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

  return (
    <div className="space-y-6">
      
      {/* 1. Step Tracker */}
      <div>
        <div className="text-[13px] font-semibold text-neutral-900 mb-3 flex items-center justify-between">
          <span>Étapes de la commande</span>
          <span className="text-[12px] text-neutral-400 font-normal">
            {timeline.length} entrée(s)
          </span>
        </div>
        <OrderTimelineStepper status={order.status} timeline={timeline} compact={false} />
      </div>

      {/* 2. Tailored Action Bar For Each Job Profile */}
      <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200">
        <div className="flex items-center justify-between mb-3 text-[12px] text-neutral-500">
          <span>Actions ({jobProfile})</span>
          <span>Par : <strong className="text-neutral-900 font-medium">{currentActorName}</strong></span>
        </div>

        <div className="flex flex-wrap gap-2">
          
          {/* PROFILE 1: CONFIRMATION AGENT */}
          {jobProfile === 'CONFIRMATION' && (
            <>
              {(currentStatus === 'pending' || currentStatus === 'unconfirmed') && (
                <button
                  onClick={() => handleQuickAdvance('processing', 'Confirmée par téléphone')}
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[12px] font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Check size={13} />
                  <span>Confirmer</span>
                </button>
              )}

              {(currentStatus === 'pending' || currentStatus === 'processing' || currentStatus === 'confirmed') && (
                <button
                  onClick={() => handleQuickAdvance('unconfirmed', 'Non confirmée / Appel sans réponse')}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-lg text-[12px] font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <Phone size={13} />
                  <span>Non confirmé</span>
                </button>
              )}

              {(currentStatus === 'processing' || currentStatus === 'confirmed' || currentStatus === 'unconfirmed') && (
                <button
                  onClick={() => handleQuickAdvance('pending', 'Remise en attente')}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 rounded-lg text-[12px] font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
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
                className="px-3 py-1.5 bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-700 rounded-lg text-[12px] font-medium transition-colors cursor-pointer"
              >
                Appel sans réponse
              </button>

              <button
                onClick={() => setShowAttachModal(true)}
                className="px-3 py-1.5 bg-white hover:bg-sky-50 border border-sky-300 text-[#0284c7] rounded-lg text-[12px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
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
                  className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[12px] font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Package size={13} />
                  <span>Marquer Préparée & Emballée</span>
                </button>
              )}

              <button
                onClick={() => setShowAttachModal(true)}
                className="px-3 py-1.5 bg-white hover:bg-teal-50 border border-teal-300 text-teal-700 rounded-lg text-[12px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Paperclip size={13} /> Photo du Colis / Étiquette
              </button>

              {(currentStatus === 'processing' || currentStatus === 'confirmed') && (
                <button
                  onClick={() => handleQuickAdvance('pending', 'Remise en attente de vérification')}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 rounded-lg text-[12px] font-medium transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Clock size={13} /> Remettre en attente
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
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[12px] font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Truck size={13} />
                  <span>Expédier (Transporteur + Suivi)...</span>
                </button>
              )}

              {currentStatus === 'shipped' && (
                <button
                  onClick={() => handleQuickAdvance('delivered', `Colis livré et montant de ${order.total} MAD encaissé`)}
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[12px] font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-2xs"
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
                    className="px-3 py-1.5 bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-[12px] font-medium transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Refus client
                  </button>
                  <button
                    onClick={() => handleQuickAdvance('returned', 'Colis retourné')}
                    disabled={isSubmitting}
                    className="px-3 py-1.5 bg-white hover:bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-[12px] font-medium transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Retour colis
                  </button>
                </>
              )}

              <button
                onClick={() => setShowAttachModal(true)}
                className="px-3 py-1.5 bg-white hover:bg-indigo-50 border border-indigo-300 text-indigo-700 rounded-lg text-[12px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
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
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[12px] font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-2xs"
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
                className="px-3 py-1.5 bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-700 rounded-lg text-[12px] font-medium transition-colors cursor-pointer"
              >
                Appel / Message Support
              </button>

              {['shipped', 'delivered'].includes(currentStatus) && (
                <>
                  <button
                    onClick={() => handleQuickAdvance('refused', 'Litige client / Refus')}
                    disabled={isSubmitting}
                    className="px-3 py-1.5 bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-[12px] font-medium transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Refus
                  </button>
                  <button
                    onClick={() => handleQuickAdvance('returned', 'Retour SAV enregistré')}
                    disabled={isSubmitting}
                    className="px-3 py-1.5 bg-white hover:bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-[12px] font-medium transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Retour SAV
                  </button>
                </>
              )}

              <button
                onClick={() => setShowAttachModal(true)}
                className="px-3 py-1.5 bg-white hover:bg-rose-50 border border-rose-300 text-rose-700 rounded-lg text-[12px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
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
                  className="px-3.5 py-1.5 bg-neutral-900 hover:bg-black text-white rounded-lg text-[12px] font-medium transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Confirmer
                </button>
              )}

              {(currentStatus === 'pending' || currentStatus === 'confirmed') && (
                <button
                  onClick={() => handleQuickAdvance('processing', 'Colis prêt et emballé')}
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 bg-neutral-900 hover:bg-black text-white rounded-lg text-[12px] font-medium transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Marquer préparée
                </button>
              )}

              {(currentStatus === 'pending' || currentStatus === 'confirmed' || currentStatus === 'processing') && (
                <button
                  onClick={() => setShowShipModal(true)}
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 bg-neutral-900 hover:bg-black text-white rounded-lg text-[12px] font-medium transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Expédier...
                </button>
              )}

              {currentStatus === 'shipped' && (
                <button
                  onClick={() => handleQuickAdvance('delivered', `Colis livré et montant de ${order.total} MAD encaissé`)}
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[12px] font-medium transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Marquer livrée
                </button>
              )}

              <button
                onClick={() => setShowAttachModal(true)}
                className="px-3 py-1.5 bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-700 rounded-lg text-[12px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Paperclip size={13} /> Joindre un document
              </button>

              <button
                onClick={() => {
                  setNoteType('CALL_ATTEMPT');
                  setNewNote('Appel sans réponse');
                }}
                className="px-3 py-1.5 bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-700 rounded-lg text-[12px] font-medium transition-colors cursor-pointer"
              >
                Appel sans réponse
              </button>

              {['shipped', 'delivered'].includes(currentStatus) && (
                <button
                  onClick={() => handleQuickAdvance('refused', 'Colis refusé')}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-[12px] font-medium transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Refus client
                </button>
              )}
            </>
          )}

        </div>
      </div>

      {/* 3. Dedicated Attachments Gallery Section */}
      {orderAttachments.length > 0 && (
        <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Paperclip size={13} className="text-[#1D9BF0]" />
              <span>Pièces Jointes & Justificatifs ({orderAttachments.length})</span>
            </span>
            <button
              onClick={() => setShowAttachModal(true)}
              className="text-[11px] font-semibold text-[#0284c7] hover:underline flex items-center gap-1 cursor-pointer"
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
                  className="p-2.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between gap-2.5 group hover:border-sky-300 transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {isImg ? (
                      <div
                        onClick={() => setPreviewImageUrl(att.attachmentUrl || null)}
                        className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0 cursor-pointer group-hover:opacity-90 relative"
                        title="Cliquer pour agrandir"
                      >
                        <img src={att.attachmentUrl!} alt={att.attachmentName || 'Photo'} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Eye size={12} className="text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-sky-50 text-[#1D9BF0] border border-sky-200 flex items-center justify-center shrink-0">
                        <FileText size={18} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">{att.attachmentName || 'Document'}</p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{att.actorName || 'Équipe NAY'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {isImg ? (
                      <button
                        onClick={() => setPreviewImageUrl(att.attachmentUrl || null)}
                        className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        Voir
                      </button>
                    ) : (
                      <a
                        href={att.attachmentUrl!}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-1 rounded-md bg-sky-50 hover:bg-sky-100 text-[#0284c7] text-[11px] font-semibold transition-colors flex items-center gap-1"
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
        <form onSubmit={handleFileUpload} className="p-4 bg-white border border-sky-200 rounded-xl space-y-3 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-[13px] font-bold text-slate-900 flex items-center gap-1.5">
              <Paperclip size={14} className="text-[#1D9BF0]" />
              <span>Joindre un document ou une photo</span>
            </span>
            <button type="button" onClick={() => setShowAttachModal(false)} className="text-xs text-slate-400 hover:text-slate-700 cursor-pointer">Fermer</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Type de document</label>
              <select
                value={attachCategory}
                onChange={(e) => setAttachCategory(e.target.value)}
                className="w-full text-[12px] bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-[#1D9BF0]"
              >
                <option value="Bordereau de livraison">Bordereau de transport (Amana, Cathedis)</option>
                <option value="Preuve de paiement / Reçu">Reçu de paiement / Encaissement</option>
                <option value="Photo du colis / Flacon">Photo du colis ou du flacon</option>
                <option value="Capture WhatsApp / Client">Capture d'écran WhatsApp / Message</option>
                <option value="Autre justificatif">Autre justificatif</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Fichier (Image, PDF, Document)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                onChange={(e) => setAttachFile(e.target.files?.[0] || null)}
                className="w-full text-[11px] text-slate-700 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:bg-sky-50 file:text-[#0284c7] file:font-semibold hover:file:bg-sky-100 cursor-pointer"
              />
            </div>
          </div>

          <input
            type="text"
            placeholder="Commentaire ou note explicative (ex: Bordereau signé par le transporteur #AMN-892)"
            value={attachDescription}
            onChange={(e) => setAttachDescription(e.target.value)}
            className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#1D9BF0]"
          />

          <div className="flex justify-end gap-2 pt-1 border-t border-slate-100">
            <button type="button" onClick={() => setShowAttachModal(false)} className="px-3 py-1 text-xs text-slate-600 cursor-pointer">Annuler</button>
            <button type="submit" disabled={isUploading || !attachFile} className="px-3.5 py-1.5 bg-[#1D9BF0] hover:bg-[#0284c7] text-white rounded-lg text-xs font-semibold disabled:opacity-50 cursor-pointer shadow-2xs">
              {isUploading ? 'Téléversement...' : 'Enregistrer le document'}
            </button>
          </div>
        </form>
      )}

      {/* Shipping Form Modal */}
      {showShipModal && (
        <form onSubmit={handleShipSubmit} className="p-4 bg-white border border-indigo-200 rounded-xl space-y-3 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-[13px] font-bold text-slate-900 flex items-center gap-1.5">
              <Truck size={14} className="text-indigo-600" />
              <span>Expédition du colis</span>
            </span>
            <button type="button" onClick={() => setShowShipModal(false)} className="text-xs text-slate-400 hover:text-slate-700 cursor-pointer">Fermer</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-neutral-500 mb-1">Transporteur</label>
              <select
                value={selectedCarrier}
                onChange={(e) => setSelectedCarrier(e.target.value)}
                className="w-full text-[12px] border border-neutral-300 rounded-lg px-2.5 py-1.5 text-neutral-900 focus:outline-none focus:border-indigo-600"
              >
                {CARRIERS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-neutral-500 mb-1">N° de suivi</label>
              <input
                type="text"
                placeholder="AMN-..."
                value={trackingNum}
                onChange={(e) => setTrackingNum(e.target.value)}
                className="w-full text-[12px] border border-neutral-300 rounded-lg px-2.5 py-1.5 text-neutral-900 focus:outline-none focus:border-indigo-600 font-mono"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setShowShipModal(false)} className="px-3 py-1 text-xs text-neutral-600 cursor-pointer">Annuler</button>
            <button type="submit" disabled={isSubmitting} className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-2xs">
              Confirmer l'expédition
            </button>
          </div>
        </form>
      )}

      {/* 4. Vertical Timeline History */}
      <div className="space-y-4">
        <div className="text-[13px] font-semibold text-neutral-900">
          Historique des événements
        </div>

        <div className="border-l border-neutral-200 pl-4 ml-1 space-y-4">
          {timeline.map((event, idx) => {
            const timeStr = formatTimelineTime(event.createdAt);
            const dateStr = formatTimelineDate(event.createdAt);

            return (
              <div key={event.id || idx} className="relative group">
                {/* Dark dot */}
                <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-neutral-900 ring-4 ring-white" />

                <div>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="font-semibold text-neutral-900">
                      {event.title}
                    </span>
                    <span className="text-neutral-400 font-mono text-[11px]">
                      {dateStr}
                    </span>
                  </div>

                  {event.description && (
                    <div className="text-[12px] text-neutral-600 mt-0.5">
                      {event.description}
                    </div>
                  )}

                  {/* Attachment in timeline */}
                  {event.attachmentUrl && (
                    <div className="mt-2 inline-flex items-center gap-2 p-2 bg-neutral-50 rounded-lg border border-neutral-200 text-[12px]">
                      <FileText size={14} className="text-[#1D9BF0]" />
                      <span className="font-medium text-neutral-800">{event.attachmentName || 'Fichier'}</span>
                      <a
                        href={event.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#0284c7] font-semibold hover:underline text-[11px] ml-1"
                      >
                        Ouvrir
                      </a>
                    </div>
                  )}

                  {/* Tracking if present */}
                  {event.trackingNumber && (
                    <div className="mt-1.5 text-[11px] font-mono text-neutral-600">
                      Suivi : <span className="font-semibold text-neutral-900">{event.trackingNumber}</span>
                    </div>
                  )}

                  {/* Actor tag */}
                  {event.actorName && (
                    <div className="text-[11px] text-neutral-400 mt-0.5">
                      Par {event.actorName} {event.actorRole ? `(${event.actorRole})` : ''}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Note input */}
        <form onSubmit={handleAddNoteSubmit} className="pt-2 flex gap-2">
          <input
            type="text"
            placeholder="Ajouter une note interne..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="flex-1 text-[12px] border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:border-neutral-900"
          />
          <button
            type="submit"
            disabled={isSubmitting || !newNote.trim()}
            className="px-3.5 py-2 bg-neutral-900 text-white rounded-lg text-xs font-medium disabled:opacity-50 cursor-pointer"
          >
            Ajouter
          </button>
        </form>
      </div>

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
