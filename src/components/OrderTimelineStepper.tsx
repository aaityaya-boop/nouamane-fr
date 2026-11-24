'use client';

import React from 'react';
import { formatTimelineTime } from '@/lib/orders/timeline';
import { Check, Truck, Package, Clock, XCircle, RotateCcw } from 'lucide-react';

export interface TimelineEvent {
  id: string;
  orderId: string;
  status: string;
  title: string;
  description?: string | null;
  actorName: string;
  actorRole?: string | null;
  actorAvatar?: string | null;
  carrier?: string | null;
  trackingNumber?: string | null;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentType?: string | null;
  createdAt: string | Date;
}

interface OrderTimelineStepperProps {
  status: string;
  timeline?: TimelineEvent[];
  compact?: boolean;
}

export default function OrderTimelineStepper({ status, timeline = [], compact = false }: OrderTimelineStepperProps) {
  const normStatus = (status || 'pending').toLowerCase();

  const createdEvent = timeline.find((e) => e.status === 'CREATED');
  const confirmedEvent = timeline.find((e) => e.status === 'CONFIRMED');
  const prepEvent = timeline.find((e) => e.status === 'PREPARED' || e.status === 'PREPARING');
  const shipEvent = timeline.find((e) => e.status === 'SHIPPED');
  const deliveredEvent = timeline.find((e) => e.status === 'DELIVERED');
  const refusedEvent = timeline.find((e) => e.status === 'REFUSED');
  const returnedEvent = timeline.find((e) => e.status === 'RETURNED');

  const isDelivered = Boolean(deliveredEvent) || normStatus === 'delivered';
  const isRefused = Boolean(refusedEvent) || normStatus === 'refused';
  const isReturned = Boolean(returnedEvent) || normStatus === 'returned';
  const isShipped = Boolean(shipEvent) || ['shipped', 'delivered', 'refused', 'returned'].includes(normStatus);
  const isPrepared = Boolean(prepEvent) || ['processing', 'shipped', 'delivered', 'refused', 'returned'].includes(normStatus);
  const isConfirmed = Boolean(confirmedEvent) || isPrepared || normStatus === 'confirmed';

  // Calculate current progress stage index (0 to 4)
  let currentStageIndex = 0;
  if (isDelivered || isRefused || isReturned) currentStageIndex = 4;
  else if (isShipped) currentStageIndex = 3;
  else if (isPrepared) currentStageIndex = 2;
  else if (isConfirmed) currentStageIndex = 1;

  // Build the most relevant recent event label for compact view
  const getLatestSummary = () => {
    if (isRefused) return { text: 'Colis refusé', sub: refusedEvent?.createdAt ? formatTimelineTime(refusedEvent.createdAt) : '', color: 'text-rose-600 dark:text-rose-400' };
    if (isReturned) return { text: 'Colis retourné', sub: returnedEvent?.createdAt ? formatTimelineTime(returnedEvent.createdAt) : '', color: 'text-rose-600 dark:text-rose-400' };
    if (isDelivered) return { text: 'Livrée & Encaissée', sub: deliveredEvent?.createdAt ? formatTimelineTime(deliveredEvent.createdAt) : '', color: 'text-emerald-600 dark:text-emerald-400' };
    if (isShipped) {
      const carrierText = shipEvent?.carrier ? `Expédiée via ${shipEvent.carrier}` : 'En cours de livraison';
      const time = shipEvent?.createdAt ? formatTimelineTime(shipEvent.createdAt) : '';
      return { text: carrierText, sub: time, color: 'text-indigo-600 dark:text-indigo-400' };
    }
    if (isPrepared) {
      const actor = prepEvent?.actorName ? prepEvent.actorName.replace(/\s*\([^)]*\)/g, '').trim() : '';
      const time = prepEvent?.createdAt ? formatTimelineTime(prepEvent.createdAt) : '';
      return { text: actor ? `Colis préparé (${actor})` : 'En préparation', sub: time, color: 'text-[#0284c7] dark:text-[#38bdf8]' };
    }
    if (isConfirmed) {
      const actor = confirmedEvent?.actorName ? confirmedEvent.actorName.replace(/\s*\([^)]*\)/g, '').trim() : '';
      const time = confirmedEvent?.createdAt ? formatTimelineTime(confirmedEvent.createdAt) : '';
      return { text: actor ? `Confirmée (${actor})` : 'Commande confirmée', sub: time, color: 'text-amber-600 dark:text-amber-400' };
    }
    return {
      text: 'Créée en ligne',
      sub: createdEvent?.createdAt ? formatTimelineTime(createdEvent.createdAt) : '',
      color: 'text-slate-700 dark:text-slate-300',
    };
  };

  const latest = getLatestSummary();

  // In compact table mode: clean, creative progress bar with subtle brand glow
  if (compact) {
    const getFillColor = (idx: number) => {
      if (isRefused || isReturned) return 'bg-rose-500 shadow-rose-500/20';
      if (isDelivered) return 'bg-emerald-500 shadow-emerald-500/20';
      if (isShipped) return 'bg-indigo-500 shadow-indigo-500/20';
      if (isPrepared) return 'bg-[#1D9BF0] shadow-sky-500/20';
      return 'bg-amber-500 shadow-amber-500/20';
    };

    return (
      <div className="space-y-1.5 py-0.5">
        <div className="flex items-center gap-1 w-32">
          {[0, 1, 2, 3].map((stepIdx) => {
            const isFilled = currentStageIndex >= stepIdx + 1 || (stepIdx === 0 && currentStageIndex >= 0);

            return (
              <div
                key={stepIdx}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  isFilled
                    ? `${getFillColor(stepIdx)} shadow-2xs`
                    : 'bg-slate-200 dark:bg-white/10'
                }`}
              />
            );
          })}
        </div>

        <div className="flex items-center gap-1.5 text-[11px]">
          <span className={`font-semibold ${latest.color}`}>{latest.text}</span>
          {latest.sub && (
            <span className="text-slate-400 dark:text-slate-500 font-mono text-[10px]">
              • {latest.sub}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Helper to safely clean actor name
  const cleanActorName = (name?: string | null) => {
    if (!name) return null;
    return name.replace(/\s*\([^)]*\)/g, '').trim();
  };

  // Full view (inside drawer / modal): 2026/2027 luxury milestone tracker with connected glowing track
  const steps = [
    {
      id: 'created',
      label: 'Créée',
      icon: <Clock size={14} />,
      time: createdEvent?.createdAt ? formatTimelineTime(createdEvent.createdAt) : null,
      actor: null,
      isDone: true,
      isActive: currentStageIndex === 0,
      badge: 'Boutique',
    },
    {
      id: 'confirmed',
      label: 'Confirmée',
      icon: <Check size={14} strokeWidth={2.5} />,
      time: confirmedEvent?.createdAt ? formatTimelineTime(confirmedEvent.createdAt) : null,
      actor: cleanActorName(confirmedEvent?.actorName),
      isDone: isConfirmed,
      isActive: currentStageIndex === 1,
      badge: null,
    },
    {
      id: 'prepared',
      label: 'Préparée',
      icon: <Package size={14} />,
      time: prepEvent?.createdAt ? formatTimelineTime(prepEvent.createdAt) : null,
      actor: cleanActorName(prepEvent?.actorName),
      isDone: isPrepared,
      isActive: currentStageIndex === 2,
      badge: null,
    },
    {
      id: 'shipped',
      label: 'Expédiée',
      icon: <Truck size={14} />,
      time: shipEvent?.createdAt ? formatTimelineTime(shipEvent.createdAt) : null,
      actor: cleanActorName(shipEvent?.carrier || shipEvent?.actorName),
      isDone: isShipped,
      isActive: currentStageIndex === 3,
      badge: shipEvent?.carrier || null,
    },
    {
      id: 'delivered',
      label: isRefused ? 'Refusée' : isReturned ? 'Retour' : 'Livrée',
      icon: isRefused ? <XCircle size={14} /> : isReturned ? <RotateCcw size={14} /> : <Check size={14} strokeWidth={2.5} />,
      time: deliveredEvent?.createdAt ? formatTimelineTime(deliveredEvent.createdAt) : null,
      actor: null,
      isDone: isDelivered || isRefused || isReturned,
      isActive: currentStageIndex === 4,
      badge: isDelivered ? 'Encaissée' : null,
    },
  ];

  // Percentage of milestone line completed
  const progressPercent = Math.min(100, Math.max(0, (currentStageIndex / (steps.length - 1)) * 100));

  return (
    <div className="relative rounded-2xl bg-slate-50 dark:bg-[#111625] p-5 border border-slate-200/80 dark:border-white/10 shadow-xs">
      {/* Background connecting track */}
      <div className="absolute top-[38px] left-[10%] right-[10%] h-[3px] bg-slate-200/90 dark:bg-white/10 rounded-full z-0">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isRefused || isReturned
              ? 'bg-rose-500'
              : isDelivered
              ? 'bg-gradient-to-r from-[#1D9BF0] via-teal-500 to-emerald-500'
              : 'bg-gradient-to-r from-[#1D9BF0] to-[#0284c7]'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Steps nodes */}
      <div className="relative z-10 grid grid-cols-5 gap-1 sm:gap-2">
        {steps.map((step, idx) => {
          let nodeStyle = 'bg-white dark:bg-[#141b2e] border-2 border-slate-200 dark:border-white/10 text-slate-400 dark:text-slate-500';
          
          if (step.isDone) {
            if ((isRefused || isReturned) && idx === 4) {
              nodeStyle = 'bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-md shadow-rose-500/25 ring-4 ring-rose-500/15 border-transparent';
            } else if (isDelivered && idx === 4) {
              nodeStyle = 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25 ring-4 ring-emerald-500/15 border-transparent';
            } else {
              nodeStyle = 'bg-gradient-to-br from-[#1D9BF0] to-[#0284c7] text-white shadow-md shadow-[#1D9BF0]/25 ring-4 ring-[#1D9BF0]/15 border-transparent';
            }
          }

          return (
            <div key={step.id} className="flex flex-col items-center text-center group">
              {/* Node Icon */}
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-300 relative ${nodeStyle} ${
                  step.isActive && !isDelivered && !isRefused
                    ? 'ring-4 ring-sky-400/40 animate-pulse'
                    : ''
                }`}
              >
                {step.icon}
                {step.isActive && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-[#0c101c]" />
                )}
              </div>

              {/* Title */}
              <div
                className={`text-[11.5px] sm:text-xs font-bold mt-2 transition-colors ${
                  step.isDone
                    ? 'text-slate-900 dark:text-white'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {step.label}
              </div>

              {/* Time Pill */}
              {step.time ? (
                <div className="mt-1 px-1.5 py-0.5 rounded-md bg-slate-100/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 font-mono text-[10px] text-slate-600 dark:text-slate-400 font-semibold tracking-tight">
                  {step.time}
                </div>
              ) : (
                <div className="mt-1 text-[10px] text-slate-300 dark:text-slate-600 font-mono">
                  —
                </div>
              )}

              {/* Actor or carrier tag */}
              {step.actor && (
                <div
                  className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-full px-1"
                  title={step.actor}
                >
                  {step.actor}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
