import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const conversation = await prisma.advisorConversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation non trouvée.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      conversation: {
        ...conversation,
        preferredNotes: conversation.preferredNotes ? (() => { try { return JSON.parse(conversation.preferredNotes); } catch { return []; } })() : [],
        recommendedSlugs: conversation.recommendedSlugs ? (() => { try { return JSON.parse(conversation.recommendedSlugs); } catch { return []; } })() : [],
        messages: conversation.messages.map((m: any) => ({
          ...m,
          recommendedProducts: m.recommendedProducts ? (() => { try { return JSON.parse(m.recommendedProducts); } catch { return []; } })() : [],
        }))
      },
    });
  } catch (error: any) {
    console.error('Erreur API Conseiller Details:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la conversation.', details: error?.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Delete associated messages first then conversation
    await prisma.advisorMessage.deleteMany({
      where: { conversationId: id },
    });

    await prisma.advisorConversation.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Conversation supprimée avec succès.' });
  } catch (error: any) {
    console.error('Erreur suppression conversation:', error);
    return NextResponse.json(
      { error: 'Impossible de supprimer la conversation.', details: error?.message },
      { status: 500 }
    );
  }
}
