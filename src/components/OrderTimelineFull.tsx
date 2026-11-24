'use client';

import React, { useState, useRef } from 'react';
import {
  Check,
  Clock,
  Phone,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Paperclip,
  FileText,
  Upload,
  Copy,
  Plus,
  Send,
  Eye,
  ExternalLink,
} from 'lucide-react';
import OrderTimelineStepper, { TimelineEvent } from './OrderTimelineStepper';
import { formatTimelineDate, formatTimelineTime } from '@/lib/orders/timeline';

interface OrderTimelineFullProps {
  order: any;
  currentUser?: {
    id?: string;
    name?: string;
    role?: string;
    jobTitle?: string;
    avatar?: string | null;
    isOwner?: boolean;
    effectivePermissions?: string[];
  } | null;
  onUpdateStatus: (newStatus: string, options?: { carrier?: string; trackingNumber?: string; customNote?: string; actorNameOverride?: string }) => Promise<void>;
  onAddNote: (note: string, type?: string) => Promise<void>;
  onAddAttachment?: (data: { attachmentUrl: string; attachmentName: string; attachmentType: string; description?: string }) => Promise<void>;
  section?: 'all' | 'actions_and_stepper' | 'history_only';
}

const CARRIERS = [
  'Amana Express',
  'Cathedis',
  'Ozon Express',
  'SDTM',
  'Livreur Interne',
  'Autre',
];

export default function OrderTimelineFull({
  order,
  currentUser,
  onUpdateStatus,
  onAddNote,
  onAddAttachment,
  section = 'all',
}: OrderTimelineFullProps) {
  const [showShipModal, setShowShipModal] = useState(false);
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState('Amana Express');
  const [trackingNum, setTrackingNum] = useState('');
  const [shippingNote, setShippingNote] = useState('');
  
  // Note form state
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState('NOTE');

  // Attachment state
  const [attachFile, setAttachFile] = useState<File | null>(null);
  const [attachCategory, setAttachCategory] = useState('Bordereau de livraison');
  const [attachDescription, setAttachDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const timeline: TimelineEvent[] = order.timeline || [];
  const currentStatus = (order.status || 'pending').toLowerCase();
  const currentActorName = currentUser?.name || 'Nouamane Ait Yahya';
  const currentActorRole = currentUser?.jobTitle || (currentUser?.role === 'OWNER' ? 'Propriétaire' : currentUser?.role || 'Admin');

  // Multi-job profile determination
  const getJobProfile = (): 'CONFIRMATION' | 'PREPARATION' | 'LOGISTICS' | 'SUPPORT' | 'ADMIN_FULL' => {
    if (!currentUser) return 'CONFIRMATION';
    if (currentUser.isOwner || currentUser.role === 'OWNER' || currentUser.role === 'CO_OWNER' || currentUser.role === 'GENERAL_MANAGER' || currentUser.role === 'FINANCE_DIRECTOR' || currentUser.role === 'ACCOUNTANT' || currentUser.role === 'AUDITOR_CONSULTANT') {
      return 'ADMIN_FULL';
    }
    const role = (currentUser.role || '').toUpperCase();
    if (role.includes('CONFIRMATION')) return 'CONFIRMATION';
    if (role.includes('PREPARATION') || role.includes('STOCK') || role.includes('INVENTORY')) return 'PREPARATION';
    if (role.includes('SHIPPING') || role.includes('LOGISTICS') || role.includes('OPERATIONS')) return 'LOGISTICS';
    if (role.includes('SUPPORT') || role.includes('CRM') || role.includes('CUSTOMER')) return 'SUPPORT';
    if (currentUser.effectivePermissions?.includes('finance.view_revenue')) return 'ADMIN_FULL';
    return 'CONFIRMATION';
  };

  const jobProfile = getJobProfile();
  const orderAttachments = timeline.filter((t) => !!t.attachmentUrl);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleQuickAdvance = async (nextStatus: string, note?: string) => {
    setIsSubmitting(true);
    try {
      await onUpdateStatus(nextStatus, {
        customNote: note,
        actorNameOverride: currentActorName,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onUpdateStatus('shipped', {
        carrier: selectedCarrier,
        trackingNumber: trackingNum || `AMN-${Date.now().toString().slice(-6)}`,
        customNote: shippingNote || `Expédiée via ${selectedCarrier}`,
        actorNameOverride: currentActorName,
      });
      setShowShipModal(false);
      setTrackingNum('');
      setShippingNote('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddNote(newNote, noteType);
      setNewNote('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attachFile) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', attachFile);

      const uploadRes = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) throw new Error('Upload failed');
      const { url } = await uploadRes.json();

      const isImg = attachFile.type.startsWith('image/');
      const fileType = isImg ? 'IMAGE' : attachFile.type.includes('pdf') ? 'PDF' : 'DOCUMENT';
      const fullDesc = attachDescription ? `[${attachCategory}] ${attachDescription}` : `[${attachCategory}] Pièce jointe ajoutée par ${currentActorName}`;

      if (onAddAttachment) {
        await onAddAttachment({
          attachmentUrl: url,
          attachmentName: attachFile.name,
          attachmentType: fileType,
          description: fullDesc,
        });
      } else {
        await fetch(`/api/admin/orders/${order.id}/attachment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            attachmentUrl: url,
            attachmentName: attachFile.name,
            attachmentType: fileType,
            description: fullDesc,
            actorNameOverride: currentActorName,
          }),
        });
      }

      setAttachFile(null);
      setAttachDescription('');
      setShowAttachModal(false);
    } catch (err) {
      console.error('Failed to attach file:', err);
    } finally {
      setIsUploading(false);
    }
  };

  // Helper to safely format actor name and role without duplicates
  const cleanActorInfo = (rawName?: string | null, rawRole?: string | null) => {
    if (!rawName) return null;
    let cleanedName = rawName.replace(/\s*\([^)]*\)/gi, '').trim();
    let role = (rawRole || '').replace(/\s*\([^)]*\)/gi, '').trim();

    // If no role specified but raw name contained '(Client)', infer Client
    if (!role && /\bclient\b/i.test(rawName)) {
      role = 'Client';
    }
    return { name: cleanedName, role: role || null };
  };

  const showActions = section === 'all' || section === 'actions_and_stepper';
  const showHistory = section === 'all' || section === 'history_only';

  return (
    <div className="space-y-6">
      
      {/* 1. Step Tracker & 2. Action Bar */}
      {showActions && (
        <>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1.5">
                <span>Étapes & Jalons Logistiques</span>
              </span>
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-white/10">
                {timeline.length} événement(s)
              </span>
            </div>
            <OrderTimelineStepper status={order.status} timeline={timeline} compact={false} />
          </div>

          {/* Tailored Action Bar */}
          <div className="bg-slate-50 dark:bg-[#111625] p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs">
            <div className="flex items-center justify-between mb-3 text-[11.5px] text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#1D9BF0] animate-pulse" />
                <span>Console d&apos;Action • <strong className="text-slate-800 dark:text-slate-200 font-bold">{jobProfile}</strong></span>
              </span>
              <span>Opérateur : <strong className="text-slate-900 dark:text-white font-semibold">{currentActorName}</strong></span>
            </div>

            <div className="flex flex-wrap gap-2">
              
              {/* PROFILE 1: CONFIRMATION AGENT */}
              {jobProfile === 'CONFIRMATION' && (
                <>
                  {(currentStatus === 'pending' || currentStatus === 'unconfirmed') && (
                    <button
                      onClick={() => handleQuickAdvance('processing', 'Confirmée par téléphone')}
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-600/20"
                    >
                      <Check size={13} strokeWidth={2.5} />
                      <span>Confirmer</span>
                    </button>
                  )}

                  {(currentStatus === 'pending' || currentStatus === 'processing' || currentStatus === 'confirmed') && (
                    <button
                      onClick={() => handleQuickAdvance('unconfirmed', 'Non confirmée / Appel sans réponse')}
                      disabled={isSubmitting}
                      className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-900/40 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Phone size={13} />
                      <span>Non confirmé</span>
                    </button>
                  )}

                  {(currentStatus === 'processing' || currentStatus === 'confirmed' || currentStatus === 'unconfirmed') && (
                    <button
                      onClick={() => handleQuickAdvance('pending', 'Remise en attente')}
                      disabled={isSubmitting}
                      className="px-3.5 py-2 bg-white hover:bg-slate-50 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200/90 dark:border-white/10 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-medium transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Clock size={13} />
                      <span>En attente</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setNoteType('CALL_ATTEMPT');
                      setNewNote('Tentative d\'appel sans réponse');
                    }}
                    className="px-3.5 py-2 bg-white hover:bg-slate-50 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200/90 dark:border-white/10 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-medium transition-all cursor-pointer shadow-2xs"
                  >
                    Appel sans réponse
                  </button>

                  <button
                    onClick={() => setShowAttachModal(true)}
                    className="px-3.5 py-2 bg-white hover:bg-sky-50 dark:bg-white/5 dark:hover:bg-sky-950/30 border border-sky-200 dark:border-sky-800/40 text-[#0284c7] dark:text-[#38bdf8] rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <Paperclip size={13} /> Joindre un document
                  </button>
                </>
              )}

              {/* PROFILE 2: PREPARATION & PACKAGING AGENT */}
              {jobProfile === 'PREPARATION' && (
                <>
                  {(currentStatus === 'pending' || currentStatus === 'confirmed' || currentStatus === 'processing') && (
                    <button
                      onClick={() => handleQuickAdvance('processing', 'Colis prêt, flacons vérifiés et emballés avec soin')}
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-sm shadow-teal-600/20"
                    >
                      <Package size={13} />
                      <span>Marquer Préparée & Emballée</span>
                    </button>
                  )}

                  <button
                    onClick={() => setShowAttachModal(true)}
                    className="px-3.5 py-2 bg-white hover:bg-teal-50 dark:bg-white/5 dark:hover:bg-teal-950/30 border border-teal-200 dark:border-teal-800/40 text-teal-700 dark:text-teal-300 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <Paperclip size={13} /> Photo du Colis / Étiquette
                  </button>

                  {(currentStatus === 'processing' || currentStatus === 'confirmed') && (
                    <button
                      onClick={() => setShowShipModal(true)}
                      disabled={isSubmitting}
                      className="px-3.5 py-2 bg-white hover:bg-slate-50 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200/90 dark:border-white/10 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-medium transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Truck size={13} />
                      <span>Prêt pour expédition...</span>
                    </button>
                  )}
                </>
              )}

              {/* PROFILE 3: SHIPPING & LOGISTICS */}
              {jobProfile === 'LOGISTICS' && (
                <>
                  {(currentStatus === 'pending' || currentStatus === 'confirmed' || currentStatus === 'processing') && (
                    <button
                      onClick={() => setShowShipModal(true)}
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-gradient-to-r from-[#1D9BF0] to-[#0284c7] hover:from-[#1A8CD8] hover:to-[#0369a1] text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-sm shadow-[#1D9BF0]/20"
                    >
                      <Truck size={13} />
                      <span>Expédier le colis...</span>
                    </button>
                  )}

                  {currentStatus === 'shipped' && (
                    <button
                      onClick={() => handleQuickAdvance('delivered', `Colis livré et montant de ${order.total} MAD encaissé`)}
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-600/20"
                    >
                      <CheckCircle2 size={13} />
                      <span>Marquer Livrée & Encaissée</span>
                    </button>
                  )}

                  {['shipped', 'delivered'].includes(currentStatus) && (
                    <>
                      <button
                        onClick={() => handleQuickAdvance('refused', 'Colis refusé par le destinataire')}
                        disabled={isSubmitting}
                        className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
                      >
                        Refus colis
                      </button>
                      <button
                        onClick={() => handleQuickAdvance('returned', 'Colis retourné')}
                        disabled={isSubmitting}
                        className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-900/40 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
                      >
                        Retour colis
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => setShowAttachModal(true)}
                    className="px-3.5 py-2 bg-white hover:bg-indigo-50 dark:bg-white/5 dark:hover:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/40 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <Paperclip size={13} /> Joindre Bordereau de Transport
                  </button>
                </>
              )}

              {/* PROFILE 4: CUSTOMER SUPPORT & CRM */}
              {jobProfile === 'SUPPORT' && (
                <>
                  {currentStatus === 'pending' && (
                    <button
                      onClick={() => handleQuickAdvance('confirmed', 'Validée par le service client')}
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-600/20"
                    >
                      <Check size={13} />
                      <span>Confirmer</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setNoteType('CALL_ATTEMPT');
                      setNewNote('Contact client support SAV');
                    }}
                    className="px-3.5 py-2 bg-white hover:bg-slate-50 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200/90 dark:border-white/10 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-medium transition-all cursor-pointer shadow-2xs"
                  >
                    Appel / Message Support
                  </button>

                  {['shipped', 'delivered'].includes(currentStatus) && (
                    <>
                      <button
                        onClick={() => handleQuickAdvance('refused', 'Litige client / Refus')}
                        disabled={isSubmitting}
                        className="px-3.5 py-2 bg-white hover:bg-rose-50 dark:bg-white/5 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-medium transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
                      >
                        Refus
                      </button>
                      <button
                        onClick={() => handleQuickAdvance('returned', 'Retour SAV enregistré')}
                        disabled={isSubmitting}
                        className="px-3.5 py-2 bg-white hover:bg-amber-50 dark:bg-white/5 dark:hover:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 rounded-xl text-xs font-medium transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
                      >
                        Retour SAV
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => setShowAttachModal(true)}
                    className="px-3.5 py-2 bg-white hover:bg-rose-50 dark:bg-white/5 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <Paperclip size={13} /> Joindre Capture / Justificatif
                  </button>
                </>
              )}

              {/* PROFILE 5: ADMIN & OWNERS (FULL ACCESS) */}
              {jobProfile === 'ADMIN_FULL' && (
                <>
                  {currentStatus === 'pending' && (
                    <button
                      onClick={() => handleQuickAdvance('confirmed', 'Confirmée')}
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-sm shadow-emerald-600/20 flex items-center gap-1.5"
                    >
                      <Check size={13} strokeWidth={2.5} />
                      <span>Confirmer</span>
                    </button>
                  )}

                  {(currentStatus === 'pending' || currentStatus === 'confirmed') && (
                    <button
                      onClick={() => handleQuickAdvance('processing', 'Colis prêt et emballé')}
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-gradient-to-r from-[#1D9BF0] to-[#0284c7] hover:from-[#1A8CD8] hover:to-[#0369a1] text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-sm shadow-[#1D9BF0]/20 flex items-center gap-1.5"
                    >
                      <Package size={13} />
                      <span>Marquer préparée</span>
                    </button>
                  )}

                  {(currentStatus === 'pending' || currentStatus === 'confirmed' || currentStatus === 'processing') && (
                    <button
                      onClick={() => setShowShipModal(true)}
                      disabled={isSubmitting}
                      className="px-3.5 py-2 bg-white hover:bg-slate-50 dark:bg-[#131929] dark:hover:bg-white/10 border border-slate-200/90 dark:border-white/10 text-slate-800 dark:text-slate-100 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-2xs flex items-center gap-1.5"
                    >
                      <Truck size={13} />
                      <span>Expédier...</span>
                    </button>
                  )}

                  {currentStatus === 'shipped' && (
                    <button
                      onClick={() => handleQuickAdvance('delivered', `Colis livré et montant de ${order.total} MAD encaissé`)}
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-sm shadow-emerald-600/20 flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={13} />
                      <span>Marquer livrée & encaissée</span>
                    </button>
                  )}

                  <button
                    onClick={() => setShowAttachModal(true)}
                    className="px-3.5 py-2 bg-white hover:bg-slate-50 dark:bg-[#131929] dark:hover:bg-white/10 border border-slate-200/90 dark:border-white/10 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <Paperclip size={13} /> Joindre un document
                  </button>

                  <button
                    onClick={() => {
                      setNoteType('CALL_ATTEMPT');
                      setNewNote('Appel sans réponse');
                    }}
                    className="px-3.5 py-2 bg-white hover:bg-slate-50 dark:bg-[#131929] dark:hover:bg-white/10 border border-slate-200/90 dark:border-white/10 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                  >
                    Appel sans réponse
                  </button>

                  {['shipped', 'delivered'].includes(currentStatus) && (
                    <button
                      onClick={() => handleQuickAdvance('refused', 'Colis refusé')}
                      disabled={isSubmitting}
                      className="px-3.5 py-2 bg-white hover:bg-rose-50 dark:bg-white/5 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
                    >
                      Refus client
                    </button>
                  )}
                </>
              )}

            </div>
          </div>
        </>
      )}

      {/* 3. Dedicated Attachments & 4. Vertical Timeline History */}
      {showHistory && (
        <>

      {/* 3. Dedicated Attachments Gallery Section */}
      {orderAttachments.length > 0 && (
        <div className="bg-slate-50/80 dark:bg-[#111625]/80 p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <Paperclip size={13} className="text-[#1D9BF0]" />
              <span>Pièces Jointes & Justificatifs ({orderAttachments.length})</span>
            </span>
            <button
              onClick={() => setShowAttachModal(true)}
              className="text-[11.5px] font-bold text-[#0284c7] dark:text-[#38bdf8] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus size={12} /> Ajouter un document
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {orderAttachments.map((att, idx) => {
              const isImg = att.attachmentType === 'IMAGE' || (att.attachmentUrl && (att.attachmentUrl.match(/\.(jpeg|jpg|gif|png|webp)/i) || att.attachmentUrl.startsWith('data:image')));
              return (
                <div
                  key={att.id || idx}
                  className="p-2.5 rounded-xl bg-white dark:bg-[#141b2e] border border-slate-200/90 dark:border-white/10 shadow-2xs flex items-center justify-between gap-2.5 group hover:border-sky-300 dark:hover:border-white/20 transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {isImg ? (
                      <div
                        onClick={() => setPreviewImageUrl(att.attachmentUrl || null)}
                        className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 shrink-0 cursor-pointer group-hover:opacity-90 relative"
                        title="Cliquer pour agrandir"
                      >
                        <img src={att.attachmentUrl!} alt={att.attachmentName || 'Photo'} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Eye size={12} className="text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-[#1D9BF0] border border-sky-200 dark:border-sky-800/40 flex items-center justify-center shrink-0">
                        <FileText size={18} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{att.attachmentName || 'Document'}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">{att.actorName || 'Équipe NAY'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {isImg ? (
                      <button
                        onClick={() => setPreviewImageUrl(att.attachmentUrl || null)}
                        className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        Voir
                      </button>
                    ) : (
                      <a
                        href={att.attachmentUrl!}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-1 rounded-md bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/50 text-[#0284c7] dark:text-[#38bdf8] text-[11px] font-semibold transition-colors flex items-center gap-1"
                      >
                        <span>Ouvrir</span>
                        <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Attachment Upload Modal Form */}
      {showAttachModal && (
        <form onSubmit={handleFileUpload} className="p-4 bg-white dark:bg-[#111625] border border-sky-200 dark:border-sky-800/40 rounded-2xl space-y-3 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2.5">
            <span className="text-[13px] font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Paperclip size={14} className="text-[#1D9BF0]" />
              <span>Joindre un document ou une photo</span>
            </span>
            <button type="button" onClick={() => setShowAttachModal(false)} className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer">Fermer</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Type de document</label>
              <select
                value={attachCategory}
                onChange={(e) => setAttachCategory(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-[#141b2e] border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-[#1D9BF0]"
              >
                <option value="Bordereau de livraison">Bordereau de transport (Amana, Cathedis)</option>
                <option value="Preuve de paiement / Reçu">Reçu de paiement / Encaissement</option>
                <option value="Photo du colis / Flacon">Photo du colis ou du flacon</option>
                <option value="Capture WhatsApp / Client">Capture d'écran WhatsApp / Message</option>
                <option value="Autre justificatif">Autre justificatif</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Fichier (Image, PDF, Document)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                onChange={(e) => setAttachFile(e.target.files?.[0] || null)}
                className="w-full text-[11px] text-slate-700 dark:text-slate-300 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:bg-sky-50 dark:file:bg-white/10 file:text-[#0284c7] dark:file:text-white file:font-semibold hover:file:bg-sky-100 cursor-pointer"
              />
            </div>
          </div>

          <input
            type="text"
            placeholder="Commentaire ou note explicative (ex: Bordereau signé par le transporteur #AMN-892)"
            value={attachDescription}
            onChange={(e) => setAttachDescription(e.target.value)}
            className="w-full text-xs bg-slate-50 dark:bg-[#141b2e] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-[#1D9BF0]"
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
            <button type="button" onClick={() => setShowAttachModal(false)} className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer font-medium">Annuler</button>
            <button type="submit" disabled={isUploading || !attachFile} className="px-4 py-2 bg-gradient-to-r from-[#1D9BF0] to-[#0284c7] text-white rounded-xl text-xs font-bold disabled:opacity-50 cursor-pointer shadow-sm shadow-[#1D9BF0]/20">
              {isUploading ? 'Téléversement...' : 'Enregistrer le document'}
            </button>
          </div>
        </form>
      )}

      {/* Shipping Form Modal */}
      {showShipModal && (
        <form onSubmit={handleShipSubmit} className="p-4 bg-white dark:bg-[#111625] border border-indigo-200 dark:border-indigo-800/40 rounded-2xl space-y-3 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2.5">
            <span className="text-[13px] font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Truck size={14} className="text-indigo-600 dark:text-indigo-400" />
              <span>Expédition du colis</span>
            </span>
            <button type="button" onClick={() => setShowShipModal(false)} className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer">Fermer</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Transporteur</label>
              <select
                value={selectedCarrier}
                onChange={(e) => setSelectedCarrier(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-[#141b2e] border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
              >
                {CARRIERS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">N° de suivi</label>
              <input
                type="text"
                placeholder="AMN-..."
                value={trackingNum}
                onChange={(e) => setTrackingNum(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-[#141b2e] border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 font-mono"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
            <button type="button" onClick={() => setShowShipModal(false)} className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer font-medium">Annuler</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-sm shadow-indigo-600/20">
              Confirmer l&apos;expédition
            </button>
          </div>
        </form>
      )}

      {/* 4. Vertical Timeline History with Spatial Cards */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1.5">
            <span>Historique & Journal d&apos;Audit</span>
          </span>
          <span className="text-[10.5px] text-slate-400 dark:text-slate-500 font-medium">
            Mises à jour en direct
          </span>
        </div>

        <div className="relative pl-6 space-y-3 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-[2px] before:bg-slate-200 dark:before:bg-white/10">
          {timeline.map((event, idx) => {
            const dateStr = formatTimelineDate(event.createdAt);
            const actor = cleanActorInfo(event.actorName, event.actorRole);

            // Node colors matching event type
            const isConfirmedEvt = event.status === 'CONFIRMED' || event.title.toLowerCase().includes('confirm');
            const isPrepEvt = event.status === 'PREPARED' || event.title.toLowerCase().includes('prépar');
            const isShipEvt = event.status === 'SHIPPED' || event.title.toLowerCase().includes('expédi');
            const isDelivEvt = event.status === 'DELIVERED' || event.title.toLowerCase().includes('livr');
            const isRefusedEvt = event.status === 'REFUSED' || event.status === 'RETURNED' || event.title.toLowerCase().includes('refus');

            let dotColor = 'bg-[#1D9BF0] ring-sky-200 dark:ring-sky-950';
            if (isDelivEvt) dotColor = 'bg-emerald-500 ring-emerald-200 dark:ring-emerald-950';
            else if (isRefusedEvt) dotColor = 'bg-rose-500 ring-rose-200 dark:ring-rose-950';
            else if (isPrepEvt) dotColor = 'bg-teal-500 ring-teal-200 dark:ring-teal-950';
            else if (isShipEvt) dotColor = 'bg-indigo-500 ring-indigo-200 dark:ring-indigo-950';
            else if (isConfirmedEvt) dotColor = 'bg-amber-500 ring-amber-200 dark:ring-amber-950';

            return (
              <div key={event.id || idx} className="relative group">
                {/* Milestone Node */}
                <div className={`absolute -left-[27px] top-3.5 w-3 h-3 rounded-full ${dotColor} ring-4 transition-transform group-hover:scale-125`} />

                {/* Spatial Event Card */}
                <div className="p-3.5 rounded-2xl bg-white dark:bg-[#121727] border border-slate-200/80 dark:border-white/10 shadow-xs hover:border-slate-300 dark:hover:border-white/20 transition-all space-y-1.5">
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {event.title}
                    </span>
                    <span className="text-slate-400 dark:text-slate-500 font-mono text-[10.5px] shrink-0">
                      {dateStr}
                    </span>
                  </div>

                  {event.description && (
                    <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {event.description}
                    </div>
                  )}

                  {/* Attachment in timeline */}
                  {event.attachmentUrl && (
                    <div className="mt-2 inline-flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200/80 dark:border-white/10 text-xs">
                      <FileText size={13} className="text-[#1D9BF0]" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{event.attachmentName || 'Justificatif'}</span>
                      <a
                        href={event.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#0284c7] dark:text-[#38bdf8] font-bold hover:underline text-[11px] ml-1"
                      >
                        Ouvrir
                      </a>
                    </div>
                  )}

                  {/* Tracking if present */}
                  {event.trackingNumber && (
                    <div className="mt-1 text-[11px] font-mono text-slate-600 dark:text-slate-400">
                      N° Suivi : <span className="font-bold text-slate-900 dark:text-white px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10">{event.trackingNumber}</span>
                    </div>
                  )}

                  {/* Actor tag - with deduplication and clean badge */}
                  {actor && actor.name && (
                    <div className="flex items-center gap-1.5 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>Par <strong className="font-semibold text-slate-800 dark:text-slate-200">{actor.name}</strong></span>
                      {actor.role && (
                        <span className="px-1.5 py-0.2 rounded-md text-[9.5px] font-bold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/10 uppercase tracking-wider">
                          {actor.role}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Note input */}
        <form onSubmit={handleAddNoteSubmit} className="pt-2 flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Ajouter une note interne confidentielle..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="w-full text-xs bg-white dark:bg-[#121727] border border-slate-200/80 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#1D9BF0] focus:ring-1 focus:ring-[#1D9BF0]"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !newNote.trim()}
            className="px-4 py-2.5 bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-black dark:hover:bg-slate-100 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Send size={12} />
            <span>Ajouter</span>
          </button>
        </form>
      </div>
      </>
      )}

      {/* Lightbox Image Preview Modal */}
      {previewImageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in" onClick={() => setPreviewImageUrl(null)}>
          <div className="relative max-w-3xl max-h-[85vh] bg-white rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-3 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <span className="text-xs font-bold text-slate-800">Aperçu du justificatif</span>
              <button onClick={() => setPreviewImageUrl(null)} className="text-xs font-bold text-slate-500 hover:text-black p-1 cursor-pointer">✕ Fermer</button>
            </div>
            <div className="p-2 flex items-center justify-center bg-slate-900/10">
              <img src={previewImageUrl} alt="Aperçu" className="max-h-[70vh] object-contain rounded-lg" />
            </div>
            <div className="p-3 border-t border-slate-200 flex justify-end gap-2 bg-white">
              <a href={previewImageUrl} download target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-[#1D9BF0] text-white text-xs font-bold rounded-lg hover:bg-[#0284c7]">
                Télécharger l'original
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
