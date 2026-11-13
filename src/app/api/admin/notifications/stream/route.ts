import { NextRequest } from 'next/server';
import { notificationEmitter } from '@/lib/realtimeEvents';
import { requireAdmin } from '@/lib/auth/rbac/serverGuard';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.authorized) return auth.response!;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connected message
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'SSE Stream active' })}\n\n`));

      const onNotification = (notif: any) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'NOTIFICATION', data: notif })}\n\n`));
        } catch (err) {
          console.error('Error streaming notification:', err);
        }
      };

      notificationEmitter.on('notification', onNotification);

      // Keep connection alive with heartbeat
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: keep-alive\n\n`));
        } catch (e) {
          clearInterval(heartbeat);
        }
      }, 15000);

      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        notificationEmitter.off('notification', onNotification);
        try {
          controller.close();
        } catch (_) {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
