'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  Plus,
  Lock,
  EyeOff,
  User,
  Phone,
  MessageSquare,
  FileText,
  Paperclip,
  Check,
  X,
  ChevronRight,
  AlertTriangle,
  Lightbulb,
  Building,
  Wrench,
  DollarSign,
  HeartPulse,
  Send,
  UserCheck,
  Briefcase,
  Image as ImageIcon,
  Download,
  ExternalLink,
  MessageCircle
} from 'lucide-react';
import { formatDateGMT } from '@/lib/dateUtils';
import AttachmentUploader from '../components/AttachmentUploader';
import ImageLightboxModal from '../components/ImageLightboxModal';

interface Reclamation {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  confidentiality: string;
  status: string;
  isAnonymous: boolean;
  authorId?: string | null;
  authorName: string;
  authorRole?: string | null;
  authorPhone?: string | null;
  authorAvatar?: string | null;
  attachments: string;
  assignedToId?: string | null;
  assignedToName?: string | null;
  resolutionNotes?: string | null;
  actionPlan?: string | null;
  resolvedAt?: string | null;
  resolvedByName?: string | null;
  createdAt: string;
  author?: {
    id: string;
    name: string;
    role: string;
    avatar?: string | null;
    phone?: string | null;
    jobTitle?: string | null;
  } | null;
  assignedTo?: {
    id: string;
    name: string;
    role: string;
    avatar?: string | null;
  } | null;
}

const CATEGORY_MAP: Record<string, { label: string; icon: any; color: string }> = {
  EQUIPMENT_TOOLS: { label: 'Matériel, Outils & IT', icon: Wrench, color: 'text-amber-700 bg-amber-50 border-amber-200' },
  WORK_ENVIRONMENT: { label: 'Locaux & Environnement', icon: Building, color: 'text-teal-700 bg-teal-50 border-teal-200' },
  REMUNERATION_BONUS: { label: 'Paie, Primes & Commissions', icon: DollarSign, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  SCHEDULE_WORKLOAD: { label: 'Horaires & Charge de Travail', icon: Clock, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  MEDIATION_RELATIONS: { label: 'Médiation & Relations d\'Équipe', icon: ShieldCheck, color: 'text-purple-700 bg-purple-50 border-purple-200' },
  HEALTH_SAFETY: { label: 'Santé, Sécurité & Ergonomie', icon: HeartPulse, color: 'text-rose-700 bg-rose-50 border-rose-200' },
  LOGISTICS_STOCK: { label: 'Process Stock & Logistique', icon: Briefcase, color: 'text-sky-700 bg-sky-50 border-sky-200' },
  OTHER: { label: 'Autre Préoccupation RH', icon: AlertCircle, color: 'text-slate-700 bg-slate-50 border-slate-200' },
};

const PRIORITY_MAP: Record<string, { label: string; badge: string; dot: string }> = {
  LOW: { label: 'Basse', badge: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' },
  MEDIUM: { label: 'Moyenne', badge: 'bg-sky-50 text-sky-800 border-sky-200', dot: 'bg-sky-500' },
  HIGH: { label: 'Haute Priorité', badge: 'bg-amber-50 text-amber-800 border-amber-300 font-bold', dot: 'bg-amber-500' },
  CRITICAL: { label: '🚨 Urgence Critique', badge: 'bg-rose-50 text-rose-800 border-rose-300 font-bold', dot: 'bg-rose-500 animate-ping' },
};

const STATUS_MAP: Record<string, { label: string; badge: string; dot: string }> = {
  OPEN: { label: 'Nouveau / Ouvert', badge: 'bg-rose-50 text-rose-800 border-rose-200', dot: 'bg-rose-500' },
  IN_REVIEW: { label: 'En Cours d\'Étude', badge: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-500' },
  ACTION_TAKEN: { label: 'Plan d\'Action en Cours', badge: 'bg-sky-50 text-sky-800 border-sky-200', dot: 'bg-[#1D9BF0]' },
  RESOLVED: { label: 'Résolu & Traité', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' },
  REJECTED: { label: 'Non Retenu / Sans Suite', badge: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' },
};

const CONFIDENTIALITY_MAP: Record<string, { label: string; badge: string; icon: any }> = {
  STANDARD: { label: 'Direction RH', badge: 'bg-slate-100 text-slate-700 border-slate-200', icon: ShieldCheck },
  CONFIDENTIAL_OWNER: { label: 'Confidentiel Propriétaire Uniquement', badge: 'bg-purple-50 text-purple-700 border border-purple-200 font-bold', icon: Lock },
  ANONYMOUS: { label: '100% Anonyme', badge: 'bg-slate-900 text-white font-bold', icon: EyeOff },
};

export default function ReclamationsClient({ currentAdmin }: { currentAdmin: any }) {
  const [reclamations, setReclamations] = useState<Reclamation[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalCount: 0, openCount: 0, actionCount: 0, resolvedCount: 0, resolutionRate: 100 });

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals & Drawers
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Reclamation | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxTitle, setLightboxTitle] = useState('');

  // Form states for new ticket
  const [newSubject, setNewSubject] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('EQUIPMENT_TOOLS');
  const [newPriority, setNewPriority] = useState('MEDIUM');
  const [newConfidentiality, setNewConfidentiality] = useState('STANDARD');
  const [newIsAnonymous, setNewIsAnonymous] = useState(false);
  const [newAttachments, setNewAttachments] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Form states for updating/resolving ticket
  const [editStatus, setEditStatus] = useState('');
  const [editResolutionNotes, setEditResolutionNotes] = useState('');
  const [editActionPlan, setEditActionPlan] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchReclamations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (categoryFilter !== 'ALL') params.set('category', categoryFilter);
      if (priorityFilter !== 'ALL') params.set('priority', priorityFilter);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/admin/team/reclamations?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setReclamations(data.reclamations);
          setStats(data.stats);
        }
      }
    } catch (e) {
      console.error('Erreur chargement réclamations:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReclamations();
  }, [categoryFilter, priorityFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReclamations();
  };

  const handleSubmitNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newDescription.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/admin/team/reclamations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: newSubject,
          description: newDescription,
          category: newCategory,
          priority: newPriority,
          confidentiality: newIsAnonymous ? 'ANONYMOUS' : newConfidentiality,
          isAnonymous: newIsAnonymous,
          attachments: newAttachments
        })
      });

      if (res.ok) {
        setIsSubmitOpen(false);
        setNewSubject('');
        setNewDescription('');
        setNewCategory('EQUIPMENT_TOOLS');
        setNewPriority('MEDIUM');
        setNewConfidentiality('STANDARD');
        setNewIsAnonymous(false);
        setNewAttachments([]);
        fetchReclamations();
      }
    } catch (e) {
      console.error('Erreur soumission réclamation:', e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    try {
      setUpdating(true);
      const res = await fetch(`/api/admin/team/reclamations/${selectedTicket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editStatus,
          resolutionNotes: editResolutionNotes,
          actionPlan: editActionPlan,
          assignedToId: currentAdmin?.id
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSelectedTicket(data.reclamation);
          fetchReclamations();
        }
      }
    } catch (e) {
      console.error('Erreur mise à jour ticket:', e);
    } finally {
      setUpdating(false);
    }
  };

  const openDetailDrawer = (ticket: Reclamation) => {
    setSelectedTicket(ticket);
    setEditStatus(ticket.status);
    setEditResolutionNotes(ticket.resolutionNotes || '');
    setEditActionPlan(ticket.actionPlan || '');
    setIsDetailOpen(true);
  };

  const handleExportCSV = () => {
    if (!reclamations.length) return;
    const headers = ['N° Ticket', 'Date (Casablanca)', 'Collaborateur', 'Catégorie', 'Priorité', 'Confidentialité', 'Statut', 'Sujet', 'Description', 'Plan Action', 'Résolution'];
    const rows = reclamations.map(t => [
      t.ticketNumber,
      formatDateGMT(t.createdAt),
      t.isAnonymous ? 'Anonyme' : t.authorName,
      CATEGORY_MAP[t.category]?.label || t.category,
      PRIORITY_MAP[t.priority]?.label || t.priority,
      CONFIDENTIALITY_MAP[t.confidentiality]?.label || t.confidentiality,
      STATUS_MAP[t.status]?.label || t.status,
      `"${t.subject.replace(/"/g, '""')}"`,
      `"${t.description.replace(/"/g, '""')}"`,
      `"${(t.actionPlan || '').replace(/"/g, '""')}"`,
      `"${(t.resolutionNotes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reclamations-equipe-nay-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isOwner = currentAdmin?.isOwner || currentAdmin?.role === 'OWNER' || currentAdmin?.role === 'HR_MANAGER';

  return (
    <div className="space-y-6 font-sans text-slate-900">
      
      {/* ── 1. MODULE SUB-NAVIGATION TABS ────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3">
        <Link
          href="/admin/team/suggestions"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 shadow-xs transition-colors"
        >
          <Lightbulb size={14} className="text-amber-500" />
          <span>Boîte à Idées & Suggestions</span>
        </Link>
        <Link
          href="/admin/team/reclamations"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-xs"
        >
          <AlertCircle size={14} className="text-rose-400" />
          <span>Réclamations & Tickets RH</span>
        </Link>
        <Link
          href="/admin/team"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 shadow-xs transition-colors"
        >
          <ShieldCheck size={14} className="text-slate-500" />
          <span>Gestion Équipe & Salaires</span>
        </Link>
        <Link
          href="/admin/team/roles"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 shadow-xs transition-colors hidden sm:inline-flex"
        >
          <User size={14} className="text-slate-500" />
          <span>Annuaire des Rôles (26)</span>
        </Link>
      </div>

      {/* ── 2. HEADER & ACTION BUTTONS ────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">
              NAY Parfums • Écoute & Bien-être Collaborateurs
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/60">
              <ShieldCheck size={11} className="text-rose-600" />
              Espace Signalement & Médiation RH
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span>Réclamations & Signalements de l'Équipe</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Un espace sécurisé et bienveillant pour signaler tout dysfonctionnement matériel, question de rémunération, condition de travail ou besoin d'assistance avec support photo. Possibilité de soumission 100% confidentielle ou anonyme.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 shadow-xs transition-all cursor-pointer"
            title="Exporter l'historique en fichier CSV"
          >
            <Download size={13} className="text-slate-500" />
            <span>Exporter CSV</span>
          </button>

          <button
            onClick={() => setIsSubmitOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0f172a] hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Plus size={16} className="text-rose-400" />
            <span>+ Déposer une Réclamation</span>
          </button>
        </div>
      </div>

      {/* ── 3. METRIC STAT CARDS ──────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Signalements</span>
            <span className="p-1.5 rounded-lg bg-slate-50 text-slate-700 border border-slate-200">
              <FileText size={14} />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">{stats.totalCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">Historique des demandes</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">À Traiter / Ouverts</span>
            <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
              <AlertCircle size={14} />
            </span>
          </div>
          <div className="text-2xl font-bold text-rose-700 tracking-tight">{stats.openCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">En attente de prise en charge</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Actions en Cours</span>
            <span className="p-1.5 rounded-lg bg-sky-50 text-sky-600 border border-sky-100">
              <Clock size={14} />
            </span>
          </div>
          <div className="text-2xl font-bold text-sky-700 tracking-tight">{stats.actionCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">En cours de résolution</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Taux de Résolution</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
              <CheckCircle2 size={14} />
            </span>
          </div>
          <div className="text-2xl font-bold text-emerald-700 tracking-tight">{stats.resolutionRate}%</div>
          <p className="text-[11px] text-slate-400 mt-1">{stats.resolvedCount} tickets clôturés avec succès</p>
        </div>
      </div>

      {/* ── 4. FILTERS & SEARCH BAR ────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="w-full md:w-80 relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="N° Ticket (REC-...), sujet, collaborateur..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Toutes les Catégories</option>
            {Object.entries(CATEGORY_MAP).map(([key, c]) => (
              <option key={key} value={key}>{c.label}</option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Toutes les Priorités</option>
            {Object.entries(PRIORITY_MAP).map(([key, p]) => (
              <option key={key} value={key}>{p.label}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Tous les Statuts</option>
            {Object.entries(STATUS_MAP).map(([key, s]) => (
              <option key={key} value={key}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── 5. RECLAMATIONS TABLE & LIST ───────────────────────────── */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          <AlertCircle size={32} className="mx-auto text-slate-300 animate-pulse mb-3" />
          <p className="text-sm font-medium text-slate-600">Chargement des signalements...</p>
        </div>
      ) : reclamations.length === 0 ? (
        <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          <CheckCircle2 size={36} className="mx-auto text-emerald-400 mb-3" />
          <p className="text-base font-bold text-slate-700">Aucune réclamation enregistrée pour ces critères</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Tous les tickets RH et signalements ont été traités. Tout fonctionne parfaitement au sein de l'équipe !
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Réf Ticket</th>
                  <th className="px-5 py-3">Collaborateur</th>
                  <th className="px-5 py-3">Objet & Photos</th>
                  <th className="px-5 py-3">Priorité</th>
                  <th className="px-5 py-3">Statut & Échéance</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reclamations.map((ticket) => {
                  const cat = CATEGORY_MAP[ticket.category] || CATEGORY_MAP.OTHER;
                  const CatIcon = cat.icon;
                  const prio = PRIORITY_MAP[ticket.priority] || PRIORITY_MAP.MEDIUM;
                  const st = STATUS_MAP[ticket.status] || STATUS_MAP.OPEN;
                  const conf = CONFIDENTIALITY_MAP[ticket.confidentiality] || CONFIDENTIALITY_MAP.STANDARD;
                  const ConfIcon = conf.icon;

                  let attachList: string[] = [];
                  try {
                    attachList = JSON.parse(ticket.attachments || '[]');
                  } catch {
                    attachList = [];
                  }

                  const phoneClean = (ticket.authorPhone || '').replace(/[^0-9]/g, '');
                  const waNumber = phoneClean.startsWith('0') ? `212${phoneClean.slice(1)}` : phoneClean;

                  return (
                    <tr
                      key={ticket.id}
                      onClick={() => openDetailDrawer(ticket)}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    >
                      {/* Ticket Number & Date */}
                      <td className="px-5 py-4">
                        <div className="font-mono font-bold text-slate-900 text-xs">
                          {ticket.ticketNumber}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {formatDateGMT(ticket.createdAt)}
                        </div>
                        {ticket.confidentiality !== 'STANDARD' && (
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold mt-1 ${conf.badge}`}>
                            <ConfIcon size={9} />
                            <span>{ticket.confidentiality === 'ANONYMOUS' ? 'Anonyme' : 'Confidentiel'}</span>
                          </span>
                        )}
                      </td>

                      {/* Author */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px] flex items-center justify-center shrink-0 border border-slate-200">
                            {ticket.isAnonymous ? '?' : (ticket.authorName || 'NA').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">
                              {ticket.isAnonymous ? 'Collaborateur Anonyme' : ticket.authorName}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {ticket.isAnonymous ? 'Poste Masqué' : (ticket.authorRole || 'Membre Équipe')}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Subject, Category & Attachments count */}
                      <td className="px-5 py-4 max-w-xs">
                        <div className="font-bold text-slate-900 text-xs truncate">
                          {ticket.subject}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${cat.color}`}>
                            <CatIcon size={10} />
                            <span>{cat.label}</span>
                          </span>
                          {attachList.length > 0 && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-mono font-bold">
                              <ImageIcon size={10} className="text-slate-500" />
                              <span>{attachList.length} photo{attachList.length > 1 ? 's' : ''}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border ${prio.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${prio.dot}`} />
                          {prio.label}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${st.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                          {st.label}
                        </span>
                        {ticket.resolvedAt && (
                          <div className="text-[10px] text-emerald-600 font-medium mt-1">
                            Clôturé le {formatDateGMT(ticket.resolvedAt)}
                          </div>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          {!ticket.isAnonymous && ticket.authorPhone && isOwner && (
                            <>
                              <a
                                href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Bonjour ${ticket.authorName}, je vous contacte suite à votre réclamation ${ticket.ticketNumber}.`)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                                title="Contacter par WhatsApp"
                              >
                                <MessageCircle size={14} />
                              </a>
                              <a
                                href={`tel:${ticket.authorPhone}`}
                                className="p-1.5 rounded-lg text-sky-600 hover:bg-sky-50 transition-colors"
                                title="Appeler"
                              >
                                <Phone size={14} />
                              </a>
                            </>
                          )}
                          <button 
                            onClick={() => openDetailDrawer(ticket)}
                            className="p-1.5 rounded-lg text-slate-400 group-hover:text-slate-900 group-hover:bg-slate-100 transition-all cursor-pointer"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 6. MODAL: DÉPOSER UNE NOUVELLE RÉCLAMATION ─────────────── */}
      {isSubmitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <AlertCircle size={18} />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">Nouveau Signalement / Réclamation RH</h3>
                  <p className="text-[11px] text-slate-400">Écoute attentive, impartiale et confidentielle</p>
                </div>
              </div>
              <button
                onClick={() => setIsSubmitOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitNew} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Sujet / Motif du signalement <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Problème d'imprimante thermique ou Question prime"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Catégorie <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none"
                  >
                    {Object.entries(CATEGORY_MAP).map(([key, c]) => (
                      <option key={key} value={key}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Niveau d'Urgence
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none"
                  >
                    <option value="LOW">Basse (Non bloquant)</option>
                    <option value="MEDIUM">Moyenne (À traiter sous 48h)</option>
                    <option value="HIGH">Haute Priorité (Impacte le travail)</option>
                    <option value="CRITICAL">🚨 Urgence Critique (Bloquant)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Description détaillée des faits ou du besoin <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Expliquez clairement la situation, le matériel concerné ou votre demande pour permettre une résolution rapide..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 resize-none leading-relaxed"
                />
              </div>

              {/* Photo & Attachment Uploader */}
              <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80">
                <AttachmentUploader
                  attachments={newAttachments}
                  onChange={setNewAttachments}
                  maxFiles={4}
                  label="Photos & Justificatifs du problème"
                  helperText="Ajoutez jusqu'à 4 photos (matériel endommagé, capture d'écran, fiche de paie...)"
                />
              </div>

              {/* Confidentiality Options */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Niveau de Confidentialité</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                    newConfidentiality === 'STANDARD' ? 'border-sky-500 bg-sky-50/50 text-sky-900' : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}>
                    <input
                      type="radio"
                      name="confidentiality"
                      value="STANDARD"
                      checked={newConfidentiality === 'STANDARD'}
                      onChange={(e) => setNewConfidentiality(e.target.value)}
                      className="text-sky-600"
                    />
                    <span className="font-medium">Direction RH</span>
                  </label>

                  <label className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                    newConfidentiality === 'CONFIDENTIAL_OWNER' ? 'border-purple-500 bg-purple-50/50 text-purple-900' : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}>
                    <input
                      type="radio"
                      name="confidentiality"
                      value="CONFIDENTIAL_OWNER"
                      checked={newConfidentiality === 'CONFIDENTIAL_OWNER'}
                      onChange={(e) => setNewConfidentiality(e.target.value)}
                      className="text-purple-600"
                    />
                    <span className="font-medium">Propriétaire uniquement</span>
                  </label>
                </div>
              </div>

              {/* Anonymous Toggle */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <EyeOff size={15} className="text-slate-500" />
                  <div>
                    <p className="font-semibold text-slate-800 text-xs">Signalement 100% anonyme</p>
                    <p className="text-[10px] text-slate-400">Votre identité et numéro ne seront pas enregistrés</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={newIsAnonymous}
                  onChange={(e) => setNewIsAnonymous(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSubmitOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold cursor-pointer disabled:opacity-50"
                >
                  <Send size={13} />
                  <span>{submitting ? 'Envoi...' : 'Transmettre le Ticket'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 7. DRAWER / MODAL: DÉTAILS & TRAITEMENT DU TICKET RH ───── */}
      {isDetailOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 text-sm">{selectedTicket.ticketNumber}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${PRIORITY_MAP[selectedTicket.priority]?.badge}`}>
                      {PRIORITY_MAP[selectedTicket.priority]?.label}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mt-0.5">{selectedTicket.subject}</h3>
                </div>
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Author Info & Confidentiality Strip */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200 shadow-xs">
                  {selectedTicket.isAnonymous ? '?' : (selectedTicket.authorName || 'NA').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-slate-900">
                    {selectedTicket.isAnonymous ? 'Collaborateur Anonyme' : selectedTicket.authorName}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {selectedTicket.isAnonymous ? 'Identité préservée' : `${selectedTicket.authorRole || 'Membre'} • ${selectedTicket.authorPhone || 'N/A'}`}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold ${CONFIDENTIALITY_MAP[selectedTicket.confidentiality]?.badge}`}>
                  <span>{CONFIDENTIALITY_MAP[selectedTicket.confidentiality]?.label}</span>
                </span>
                <p className="text-[10px] text-slate-400 mt-1">Déposé le {formatDateGMT(selectedTicket.createdAt)}</p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Description du Signalement
              </label>
              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/60 text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                {selectedTicket.description}
              </div>
            </div>

            {/* Photos & Attachments Gallery */}
            {(() => {
              let attachList: string[] = [];
              try {
                attachList = JSON.parse(selectedTicket.attachments || '[]');
              } catch {
                attachList = [];
              }
              if (attachList.length === 0) return null;

              return (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <ImageIcon size={13} className="text-slate-400" />
                    <span>Photos & Pièces Jointes ({attachList.length})</span>
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                    {attachList.map((url, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          setLightboxUrl(url);
                          setLightboxTitle(`${selectedTicket.ticketNumber} - Photo #${i + 1}`);
                        }}
                        className="relative rounded-xl overflow-hidden border border-slate-200 aspect-square group cursor-pointer shadow-xs bg-slate-100"
                      >
                        <img
                          src={url}
                          alt={`Photo ${i + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <ExternalLink size={16} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Management Resolution & Action Plan Form (Owner / HR) */}
            <form onSubmit={handleUpdateTicket} className="space-y-3.5 pt-2 border-t border-slate-100 text-xs">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-sky-600" />
                <span>Prise en Charge & Résolution RH</span>
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Statut du Ticket</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    disabled={!isOwner}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none disabled:opacity-60"
                  >
                    <option value="OPEN">Nouveau / Ouvert</option>
                    <option value="IN_REVIEW">En Cours d'Étude</option>
                    <option value="ACTION_TAKEN">Plan d'Action en Cours</option>
                    <option value="RESOLVED">Résolu & Clôturé</option>
                    <option value="REJECTED">Non Retenu / Sans Suite</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigné / Responsable</label>
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700">
                    <UserCheck size={14} className="text-slate-500" />
                    <span>{selectedTicket.assignedToName || currentAdmin?.name || 'Direction NAY'}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Plan d'Action & Mesures Prises</label>
                <textarea
                  rows={2}
                  disabled={!isOwner}
                  placeholder="Ex: Réparation commandée auprès du technicien pour jeudi matin..."
                  value={editActionPlan}
                  onChange={(e) => setEditActionPlan(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none resize-none disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Synthèse de Résolution & Réponse au Collaborateur</label>
                <textarea
                  rows={2}
                  disabled={!isOwner}
                  placeholder="Ex: Problème résolu. Nouvelle imprimante opérationnelle dans l'atelier..."
                  value={editResolutionNotes}
                  onChange={(e) => setEditResolutionNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none resize-none disabled:opacity-60"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDetailOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Fermer
                </button>

                {isOwner && (
                  <button
                    type="submit"
                    disabled={updating}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold cursor-pointer disabled:opacity-50"
                  >
                    <Check size={13} />
                    <span>{updating ? 'Mise à jour...' : 'Enregistrer les Modifications'}</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 8. LIGHTBOX MODAL FOR PICTURES ────────────────────────── */}
      <ImageLightboxModal
        imageUrl={lightboxUrl}
        title={lightboxTitle}
        onClose={() => setLightboxUrl(null)}
      />

    </div>
  );
}
