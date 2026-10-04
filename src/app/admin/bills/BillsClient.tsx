'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  FileText,
  Upload,
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Eye,
  Trash2,
  Paperclip,
  Building2,
  CreditCard,
  X,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Download,
  ZoomIn,
  Check,
  AlertTriangle,
  User,
  Tag,
  ChevronDown,
  Layers,
  ArrowRight,
  Receipt,
  FileCheck,
} from 'lucide-react';
import { UnifiedBillItem } from '@/lib/billsHelper';
import { isPdfUrl, getDocumentName } from '../suppliers/SuppliersClient';
import { formatDateGMT } from '@/lib/dateUtils';

interface BillsClientProps {
  initialBills: UnifiedBillItem[];
  initialSuppliers: Array<{ id: string; name: string; code: string; category: string }>;
  initialStats: {
    totalPendingMAD: number;
    pendingCount: number;
    overdueCount: number;
    dueSoonCount: number;
    paidThisMonthMAD: number;
    paidCount: number;
    employeeDepositCount: number;
  };
  currentUser: {
    id: string;
    name: string;
    role: string;
  };
}

const CATEGORY_MAP: Record<string, { label: string; bg: string; text: string; border: string }> = {
  SUPPLIES: { label: 'Stock & Matières', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  PACKAGING: { label: 'Packaging & Boîtes', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  LOGISTICS: { label: 'Transport & Fret', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  OFFICE: { label: 'Bureau & Exploitation', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  ADS: { label: 'Marketing & Pubs', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  OTHER: { label: 'Autres Charges', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
};

export default function BillsClient({
  initialBills = [],
  initialSuppliers = [],
  initialStats,
  currentUser,
}: BillsClientProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const paymentVoucherInputRef = useRef<HTMLInputElement | null>(null);

  const [bills, setBills] = useState<UnifiedBillItem[]>(initialBills);
  const [stats, setStats] = useState(initialStats);
  const [suppliers] = useState(initialSuppliers);

  // Filters
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState<'ALL' | 'PENDING' | 'OVERDUE' | 'PAID'>('PENDING');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'EMPLOYEE' | 'PO'>('ALL');

  // Modals
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [billToPay, setBillToPay] = useState<UnifiedBillItem | null>(null);

  // Lightbox Document Viewer
  const [activeDocument, setActiveDocument] = useState<{
    url: string;
    title: string;
    subtitle: string;
    vendor: string;
    invoiceNumber?: string;
  } | null>(null);

  // Loading States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Deposit Form State
  const [formData, setFormData] = useState({
    vendor: '',
    invoiceNumber: '',
    amount: '',
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    invoiceDate: new Date().toISOString().slice(0, 10),
    category: 'SUPPLIES',
    invoiceUrl: '',
    notes: '',
  });

  // Pay Form State
  const [payFormData, setPayFormData] = useState({
    paymentMethod: 'VIREMENT',
    paidAt: new Date().toISOString().slice(0, 10),
    paymentVoucherUrl: '',
    notes: '',
  });

  const formatMAD = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      maximumFractionDigits: 0,
    }).format(amount || 0).replace('MAD', '').trim() + ' MAD';
  };

  // Upload Invoice Document (PDF, JPG, PNG, WEBP)
  const handleUploadDocument = async (file: File, isVoucher = false) => {
    if (!file) return;
    setIsUploading(true);
    const fd = new FormData();
    fd.append('file', file);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (data.url) {
        if (isVoucher) {
          setPayFormData((prev) => ({ ...prev, paymentVoucherUrl: data.url }));
        } else {
          setFormData((prev) => ({ ...prev, invoiceUrl: data.url }));
        }
      } else {
        alert(data.error || 'Erreur lors du téléchargement du fichier.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Erreur lors du téléchargement. Veuillez vérifier votre connexion.');
    } finally {
      setIsUploading(false);
    }
  };

  // Submit New Bill Deposit
  const handleSubmitDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vendor.trim()) {
      alert('Veuillez spécifier le nom du fournisseur ou prestataire.');
      return;
    }
    const amt = Number(formData.amount);
    if (isNaN(amt) || amt <= 0) {
      alert('Veuillez entrer un montant supérieur à 0 MAD.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor: formData.vendor,
          invoiceNumber: formData.invoiceNumber,
          amount: amt,
          dueDate: formData.dueDate,
          invoiceDate: formData.invoiceDate,
          category: formData.category,
          invoiceUrl: formData.invoiceUrl,
          notes: formData.notes,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Erreur lors de l’enregistrement');
      }

      setBills((prev) => [json.bill, ...prev]);
      // Update stats locally
      setStats((prev) => ({
        ...prev,
        pendingCount: prev.pendingCount + 1,
        totalPendingMAD: prev.totalPendingMAD + amt,
        employeeDepositCount: prev.employeeDepositCount + 1,
      }));

      setIsDepositModalOpen(false);
      // Reset form
      setFormData({
        vendor: '',
        invoiceNumber: '',
        amount: '',
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        invoiceDate: new Date().toISOString().slice(0, 10),
        category: 'SUPPLIES',
        invoiceUrl: '',
        notes: '',
      });
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Erreur lors du dépôt de la facture');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Pay Modal
  const openPayModal = (bill: UnifiedBillItem) => {
    setBillToPay(bill);
    setPayFormData({
      paymentMethod: bill.paymentMethod || 'VIREMENT',
      paidAt: new Date().toISOString().slice(0, 10),
      paymentVoucherUrl: '',
      notes: `Règlement facture ${bill.invoiceNumber || bill.title} par ${currentUser.name}`,
    });
    setIsPayModalOpen(true);
  };

  // Confirm Mark as Paid
  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billToPay) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/bills', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: billToPay.id,
          source: billToPay.source,
          action: 'MARK_PAID',
          paymentMethod: payFormData.paymentMethod,
          paidAt: payFormData.paidAt,
          paymentVoucherUrl: payFormData.paymentVoucherUrl,
          notes: payFormData.notes,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Erreur lors de la validation du paiement');
      }

      setBills((prev) =>
        prev.map((b) =>
          b.id === billToPay.id
            ? {
                ...b,
                status: 'PAID',
                isOverdue: false,
                daysRemaining: null,
                paymentMethod: payFormData.paymentMethod,
                paidAt: payFormData.paidAt,
                receiptUrl: payFormData.paymentVoucherUrl || b.receiptUrl,
              }
            : b
        )
      );

      setStats((prev) => ({
        ...prev,
        pendingCount: Math.max(0, prev.pendingCount - 1),
        totalPendingMAD: Math.max(0, prev.totalPendingMAD - billToPay.amountMAD),
        paidCount: prev.paidCount + 1,
        paidThisMonthMAD: prev.paidThisMonthMAD + billToPay.amountMAD,
      }));

      setIsPayModalOpen(false);
      setBillToPay(null);
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Erreur lors du règlement');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Bill
  const handleDeleteBill = async (bill: UnifiedBillItem) => {
    if (bill.source !== 'EMPLOYEE_BILL') {
      alert('Les bons de commande officiels doivent être gérés depuis l’onglet Fournisseurs & Achats.');
      return;
    }

    if (!confirm(`Supprimer définitivement la facture ${bill.vendor} (${formatMAD(bill.amountMAD)}) ?`)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/bills?id=${bill.id}&source=${bill.source}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Erreur lors de la suppression');
      }

      setBills((prev) => prev.filter((b) => b.id !== bill.id));
      setStats((prev) => ({
        ...prev,
        pendingCount: bill.status === 'PENDING' ? Math.max(0, prev.pendingCount - 1) : prev.pendingCount,
        totalPendingMAD: bill.status === 'PENDING' ? Math.max(0, prev.totalPendingMAD - bill.amountMAD) : prev.totalPendingMAD,
        paidCount: bill.status === 'PAID' ? Math.max(0, prev.paidCount - 1) : prev.paidCount,
      }));
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Erreur réseau');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/admin/bills');
      const data = await res.json();
      if (data.success) {
        setBills(data.bills);
        setStats(data.stats);
      }
    } catch (e) {
      console.error('Refresh error:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filtered Bills
  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      // Status tab filter
      if (statusTab === 'PENDING' && b.status !== 'PENDING') return false;
      if (statusTab === 'OVERDUE' && (!b.isOverdue || b.status !== 'PENDING')) return false;
      if (statusTab === 'PAID' && b.status !== 'PAID') return false;

      // Category filter
      if (selectedCategory !== 'ALL' && b.category !== selectedCategory) return false;

      // Source filter
      if (sourceFilter === 'EMPLOYEE' && b.source !== 'EMPLOYEE_BILL') return false;
      if (sourceFilter === 'PO' && b.source !== 'PURCHASE_ORDER') return false;

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchVendor = b.vendor.toLowerCase().includes(q);
        const matchInvoice = b.invoiceNumber.toLowerCase().includes(q);
        const matchCreator = b.creatorName.toLowerCase().includes(q);
        const matchNotes = (b.notes || '').toLowerCase().includes(q);
        const matchAmount = b.amountMAD.toString().includes(q);
        return matchVendor || matchInvoice || matchCreator || matchNotes || matchAmount;
      }

      return true;
    });
  }, [bills, statusTab, selectedCategory, sourceFilter, search]);

  return (
    <div className="space-y-8 pb-24 text-slate-900">
      {/* 👑 EXECUTIVE HERO BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 shadow-2xl border border-slate-800/80">
        <div className="absolute -right-12 -top-12 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-16 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold backdrop-blur-md">
              <Receipt size={14} className="text-rose-400" />
              <span>Gestion des Factures à Payer & Dépôt Collaborateurs</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Échéancier des Règlements & Factures Reçues
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-light">
              Espace ouvert à tous les collaborateurs pour déposer les factures fournisseurs et prestataires reçues,
              suivre les dates d’échéances critiques et synchroniser automatiquement les sorties avec la comptabilité et le CA Net.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              title="Rafraîchir les factures"
            >
              <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Actualiser</span>
            </button>

            <button
              onClick={() => setIsDepositModalOpen(true)}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white text-xs sm:text-sm font-bold transition-all shadow-lg shadow-rose-500/25 flex items-center gap-2 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus size={18} />
              <span>Déposer une Facture à Payer</span>
            </button>
          </div>
        </div>

        {/* User identification badge */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Connecté en tant que : <strong className="text-white">{currentUser.name}</strong> ({currentUser.role})</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Accès universel équipe activé</span>
            <span>•</span>
            <span>Formats acceptés : PDF, JPG, PNG, WEBP</span>
          </div>
        </div>
      </div>

      {/* 📊 BENTO KPI METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Total À Régler */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total À Régler</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center">
              <DollarSign size={15} />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl sm:text-2xl font-extrabold text-rose-600 font-mono">
              {formatMAD(stats.totalPendingMAD)}
            </div>
            <div className="text-[10px] text-rose-600 font-semibold mt-0.5">
              {stats.pendingCount} factures en attente
            </div>
          </div>
        </div>

        {/* Factures en Retard */}
        <div className="bg-white border border-amber-200/90 rounded-2xl p-4.5 shadow-xs flex flex-col justify-between hover:border-amber-300 transition-all bg-gradient-to-br from-white to-amber-50/20">
          <div className="flex items-center justify-between text-amber-800 text-xs font-semibold">
            <span>En Retard</span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <AlertTriangle size={15} />
            </div>
          </div>
          <div className="mt-2.5">
            <div className={`text-xl sm:text-2xl font-extrabold font-mono ${stats.overdueCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {stats.overdueCount}
            </div>
            <div className="text-[10px] text-slate-500 font-medium mt-0.5">
              {stats.overdueCount > 0 ? 'Échéances dépassées !' : 'Aucun retard constaté'}
            </div>
          </div>
        </div>

        {/* Échéance < 7 jours */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Échéance &lt; 7 jours</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
              <Clock size={15} />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl sm:text-2xl font-extrabold text-indigo-600 font-mono">
              {stats.dueSoonCount}
            </div>
            <div className="text-[10px] text-indigo-600 font-semibold mt-0.5">
              Paiements imminents
            </div>
          </div>
        </div>

        {/* Factures Déposées par l'Équipe */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Dépôts Équipe</span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center">
              <User size={15} />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl sm:text-2xl font-extrabold text-sky-700 font-mono">
              {stats.employeeDepositCount}
            </div>
            <div className="text-[10px] text-sky-600 font-semibold mt-0.5">
              Factures transmises
            </div>
          </div>
        </div>

        {/* Règlements Effectués */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Réglées ce mois</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
              <CheckCircle2 size={15} />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 font-mono">
              {formatMAD(stats.paidThisMonthMAD)}
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
              {stats.paidCount} factures acquittées
            </div>
          </div>
        </div>
      </div>

      {/* 🧭 FILTER CONTROLS & TABS */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        {/* Quick Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-100/70 rounded-xl">
            <button
              onClick={() => setStatusTab('PENDING')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusTab === 'PENDING'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              À Payer ({stats.pendingCount})
            </button>
            <button
              onClick={() => setStatusTab('OVERDUE')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusTab === 'OVERDUE'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              En Retard ({stats.overdueCount})
            </button>
            <button
              onClick={() => setStatusTab('PAID')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusTab === 'PAID'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Réglées ({stats.paidCount})
            </button>
            <button
              onClick={() => setStatusTab('ALL')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusTab === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Toutes ({bills.length})
            </button>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Affichage de <strong className="text-slate-900">{filteredBills.length}</strong> facture(s)
          </div>
        </div>

        {/* Search & Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Fournisseur, n° facture, montant..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-900 focus:outline-hidden transition-all"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-900 focus:outline-hidden transition-all text-slate-700"
            >
              <option value="ALL">Toutes les catégories</option>
              <option value="SUPPLIES">Stock & Matières Premières</option>
              <option value="PACKAGING">Packaging & Emballages</option>
              <option value="LOGISTICS">Transport & Logistique</option>
              <option value="OFFICE">Bureau & Exploitation</option>
              <option value="ADS">Marketing & Publicité</option>
              <option value="OTHER">Autres Charges</option>
            </select>
          </div>

          {/* Source Filter */}
          <div>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as any)}
              className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-900 focus:outline-hidden transition-all text-slate-700"
            >
              <option value="ALL">Toutes les provenances</option>
              <option value="EMPLOYEE">Déposées par l'équipe</option>
              <option value="PO">Bons de Commande Fournisseur</option>
            </select>
          </div>

          {/* Reset button */}
          {(search || selectedCategory !== 'ALL' || sourceFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('ALL');
                setSourceFilter('ALL');
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <X size={14} />
              <span>Effacer les filtres</span>
            </button>
          )}
        </div>
      </div>

      {/* 📋 BILLS LIST TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        {filteredBills.length === 0 ? (
          <div className="py-16 px-4 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
              <FileText size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800">Aucune facture trouvée</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {statusTab === 'PENDING'
                  ? 'Toutes les factures sont à jour ou aucune facture en attente ne correspond à vos filtres.'
                  : 'Aucun enregistrement ne correspond à vos critères de recherche.'}
              </p>
            </div>
            <button
              onClick={() => setIsDepositModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all shadow-xs cursor-pointer"
            >
              <Plus size={15} />
              <span>Déposer une nouvelle facture</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Statut & Échéance</th>
                  <th className="py-3.5 px-4">Fournisseur / Prestataire</th>
                  <th className="py-3.5 px-4">Document / Facture</th>
                  <th className="py-3.5 px-4">Catégorie</th>
                  <th className="py-3.5 px-4">Montant TTC</th>
                  <th className="py-3.5 px-4">Déposé Par</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBills.map((bill) => {
                  const catCfg = CATEGORY_MAP[bill.category] || CATEGORY_MAP.OTHER;
                  const isPdf = isPdfUrl(bill.invoiceUrl);

                  return (
                    <tr
                      key={`${bill.source}-${bill.id}`}
                      className="hover:bg-slate-50/60 transition-colors group"
                    >
                      {/* Statut & Échéance */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="space-y-1">
                          {bill.status === 'PAID' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 size={12} />
                              <span>RÉGLÉ</span>
                            </span>
                          ) : bill.isOverdue ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                              <AlertCircle size={12} />
                              <span>EN RETARD</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock size={12} />
                              <span>À PAYER</span>
                            </span>
                          )}

                          <div className="text-[11px] text-slate-600 font-medium">
                            {bill.dueDate ? (
                              <span>
                                Échéance : <strong>{bill.dueDate}</strong>
                                {bill.daysRemaining !== null && bill.status === 'PENDING' && (
                                  <span
                                    className={`ml-1 text-[10px] font-bold ${
                                      bill.daysRemaining < 0
                                        ? 'text-rose-600'
                                        : bill.daysRemaining <= 3
                                        ? 'text-amber-600'
                                        : 'text-slate-400'
                                    }`}
                                  >
                                    ({bill.daysRemaining < 0 ? `+${Math.abs(bill.daysRemaining)}j retard` : `${bill.daysRemaining}j restants`})
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className="text-slate-400">Sans échéance fixée</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Fournisseur & N° Facture */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            <span>{bill.vendor}</span>
                            {bill.source === 'PURCHASE_ORDER' && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                Bon de Commande
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
                            <Tag size={11} className="text-slate-400" />
                            <span>{bill.invoiceNumber || 'Facture sans N°'}</span>
                            {bill.invoiceDate && (
                              <>
                                <span className="text-slate-300">•</span>
                                <span className="text-slate-400">Émise le {bill.invoiceDate}</span>
                              </>
                            )}
                          </div>
                          {bill.notes && (
                            <div className="text-[11px] text-slate-500 line-clamp-1 italic max-w-xs">
                              « {bill.notes} »
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Document / Facture attachée */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {bill.invoiceUrl ? (
                          <div className="flex items-center gap-2">
                            {isPdf ? (
                              <button
                                onClick={() =>
                                  setActiveDocument({
                                    url: bill.invoiceUrl!,
                                    title: `Facture ${bill.vendor}`,
                                    subtitle: bill.invoiceNumber ? `Réf: ${bill.invoiceNumber}` : 'Document PDF',
                                    vendor: bill.vendor,
                                    invoiceNumber: bill.invoiceNumber,
                                  })
                                }
                                className="px-2.5 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer group/btn"
                              >
                                <span className="w-5 h-5 rounded-md bg-rose-600 text-white text-[10px] font-black flex items-center justify-center">
                                  PDF
                                </span>
                                <span>Voir Facture</span>
                                <Eye size={13} className="text-rose-500 group-hover/btn:scale-110 transition-transform" />
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  setActiveDocument({
                                    url: bill.invoiceUrl!,
                                    title: `Facture ${bill.vendor}`,
                                    subtitle: bill.invoiceNumber ? `Réf: ${bill.invoiceNumber}` : 'Image justificative',
                                    vendor: bill.vendor,
                                    invoiceNumber: bill.invoiceNumber,
                                  })
                                }
                                className="flex items-center gap-2 p-1 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all cursor-pointer group/img"
                              >
                                <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-slate-200 shrink-0">
                                  <Image
                                    src={bill.invoiceUrl}
                                    alt="Facture"
                                    fill
                                    className="object-cover group-hover/img:scale-105 transition-transform"
                                  />
                                </div>
                                <div className="text-left pr-2">
                                  <div className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                                    <span>Scan Facture</span>
                                    <ZoomIn size={12} className="text-slate-400" />
                                  </div>
                                  <div className="text-[9px] text-slate-400">Photo / Reçu</div>
                                </div>
                              </button>
                            )}

                            {/* Additional Payment Voucher if paid */}
                            {bill.receiptUrl && (
                              <button
                                onClick={() =>
                                  setActiveDocument({
                                    url: bill.receiptUrl!,
                                    title: `Justificatif de Règlement - ${bill.vendor}`,
                                    subtitle: `Mode: ${bill.paymentMethod || 'Virement bancaire'}`,
                                    vendor: bill.vendor,
                                    invoiceNumber: bill.invoiceNumber,
                                  })
                                }
                                className="px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold hover:bg-emerald-100 transition-all flex items-center gap-1"
                                title="Voir la preuve de paiement (virement / chèque)"
                              >
                                <FileCheck size={12} />
                                <span>Reçu Payé</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic flex items-center gap-1">
                            <Paperclip size={12} className="text-slate-300" />
                            <span>Aucun document joint</span>
                          </span>
                        )}
                      </td>

                      {/* Catégorie */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold border ${catCfg.bg} ${catCfg.text} ${catCfg.border}`}
                        >
                          {catCfg.label}
                        </span>
                      </td>

                      {/* Montant */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-extrabold text-sm text-slate-900 font-mono">
                          {formatMAD(bill.amountMAD)}
                        </div>
                        {bill.status === 'PAID' && bill.paymentMethod && (
                          <div className="text-[10px] text-emerald-600 font-medium">
                            Réglé par {bill.paymentMethod}
                          </div>
                        )}
                      </td>

                      {/* Déposé Par */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                            {bill.creatorName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 text-[11px] leading-tight">
                              {bill.creatorName}
                            </div>
                            <div className="text-[10px] text-slate-400 leading-tight">
                              {bill.creatorRole}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {bill.status === 'PENDING' && (
                            <button
                              onClick={() => openPayModal(bill)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                              title="Marquer comme payée"
                            >
                              <CheckCircle2 size={13} />
                              <span>Régler</span>
                            </button>
                          )}

                          {bill.source === 'EMPLOYEE_BILL' && (
                            <button
                              onClick={() => handleDeleteBill(bill)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Supprimer la facture"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 🚀 MODAL: DÉPOSER UNE FACTURE À PAYER (ACCESSIBLE À TOUS LES EMPLOYÉS) */}
      {isDepositModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
                  <Receipt size={12} />
                  <span>Dépôt Universel Équipe NAY</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  Déposer une Facture à Payer
                </h3>
              </div>
              <button
                onClick={() => setIsDepositModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitDeposit} className="space-y-4">
              {/* Depositor Identity Banner */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center">
                    {currentUser.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-slate-500">Collaborateur : </span>
                    <strong className="text-slate-900">{currentUser.name}</strong>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 text-[10px] font-semibold">
                  {currentUser.role}
                </span>
              </div>

              {/* 📂 DRAG & DROP DOCUMENT UPLOAD ZONE */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Document de la Facture (PDF, Photo, Scan) <span className="text-rose-500">*</span>
                </label>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUploadDocument(f, false);
                  }}
                  accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                />

                {formData.invoiceUrl ? (
                  <div className="p-4 rounded-2xl border-2 border-emerald-300 bg-emerald-50/50 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {isPdfUrl(formData.invoiceUrl) ? (
                        <div className="w-10 h-10 rounded-xl bg-rose-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                          PDF
                        </div>
                      ) : (
                        <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-slate-200 shrink-0">
                          <Image src={formData.invoiceUrl} alt="Preview" fill className="object-cover" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {getDocumentName(formData.invoiceUrl, 'Facture chargée')}
                        </div>
                        <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                          <Check size={12} />
                          <span>Fichier prêt et enregistré</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveDocument({
                            url: formData.invoiceUrl,
                            title: 'Prévisualisation de la Facture',
                            subtitle: formData.vendor || 'Document joint',
                            vendor: formData.vendor,
                            invoiceNumber: formData.invoiceNumber,
                          })
                        }
                        className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer flex items-center gap-1"
                      >
                        <Eye size={13} />
                        <span>Voir</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer"
                      >
                        Remplacer
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const f = e.dataTransfer.files?.[0];
                      if (f) handleUploadDocument(f, false);
                    }}
                    className="border-2 border-dashed border-slate-300 hover:border-rose-400 bg-slate-50/70 hover:bg-rose-50/30 rounded-2xl p-6 text-center transition-all cursor-pointer space-y-2 group"
                  >
                    <div className="w-12 h-12 mx-auto rounded-xl bg-white border border-slate-200 group-hover:border-rose-200 flex items-center justify-center text-slate-400 group-hover:text-rose-500 shadow-2xs transition-colors">
                      {isUploading ? (
                        <RefreshCw size={22} className="animate-spin text-rose-500" />
                      ) : (
                        <Upload size={22} />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-slate-800">
                        {isUploading ? 'Téléchargement en cours...' : 'Glissez-déposez la facture ici ou cliquez'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Fichiers acceptés : PDF (.pdf) ou Images (.jpg, .png, .webp) • Max 20 Mo
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Fournisseur & N° Facture */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Fournisseur / Prestataire <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.vendor}
                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                    placeholder="ex: Argeville, Cartonnerie Atlas, CTM..."
                    list="known-suppliers"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-900 focus:outline-hidden transition-all"
                  />
                  <datalist id="known-suppliers">
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.name} />
                    ))}
                    <option value="CTM Messagerie" />
                    <option value="Amana Express" />
                    <option value="Cartonnerie Casablanca" />
                    <option value="Imprimerie Offset Maroc" />
                    <option value="Fournisseur Packaging Dubaï" />
                  </datalist>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    N° Facture / Référence
                  </label>
                  <input
                    type="text"
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    placeholder="ex: FAC-2026-904"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-900 focus:outline-hidden transition-all"
                  />
                </div>
              </div>

              {/* Montant & Catégorie */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Montant TTC (MAD) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="ex: 4500"
                      className="w-full pl-3.5 pr-14 py-2.5 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-900 focus:outline-hidden font-mono font-bold transition-all"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                      MAD
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Catégorie de Charge
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-900 focus:outline-hidden transition-all text-slate-800"
                  >
                    <option value="SUPPLIES">Stock & Matières Premières</option>
                    <option value="PACKAGING">Packaging, Boîtes & Sacs</option>
                    <option value="LOGISTICS">Transport, Fret & Livraison</option>
                    <option value="OFFICE">Charges d'Exploitation & Atelier</option>
                    <option value="ADS">Marketing & Publicité</option>
                    <option value="OTHER">Autre Dépense</option>
                  </select>
                </div>
              </div>

              {/* Dates : Émission & Échéance */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Date de la Facture
                  </label>
                  <input
                    type="date"
                    value={formData.invoiceDate}
                    onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-900 focus:outline-hidden transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Date d'Échéance (À payer avant le)
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-900 focus:outline-hidden transition-all font-semibold"
                  />
                </div>
              </div>

              {/* Remarques & Notes pour la compta */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Commentaires / Notes Internes
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Détails sur la prestation, conditions convenues, RIB ou numéro de virement..."
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-900 focus:outline-hidden transition-all"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsDepositModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <RefreshCw size={15} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={15} />
                  )}
                  <span>Enregistrer & Déposer la Facture</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 💳 MODAL: VALIDER LE RÈGLEMENT DE LA FACTURE */}
      {isPayModalOpen && billToPay && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                  <CreditCard size={12} />
                  <span>Validation du Paiement</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Marquer la Facture comme Réglée
                </h3>
              </div>
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Bill Summary Card */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Fournisseur :</span>
                <strong className="text-xs text-slate-900">{billToPay.vendor}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">N° Facture :</span>
                <span className="text-xs font-mono text-slate-700">{billToPay.invoiceNumber || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <span className="text-xs font-bold text-slate-700">Montant Total à Acquitter :</span>
                <span className="text-base font-extrabold text-slate-900 font-mono">
                  {formatMAD(billToPay.amountMAD)}
                </span>
              </div>
            </div>

            <form onSubmit={handleConfirmPayment} className="space-y-4">
              {/* Mode de Paiement */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Mode de Paiement <span className="text-rose-500">*</span>
                </label>
                <select
                  value={payFormData.paymentMethod}
                  onChange={(e) => setPayFormData({ ...payFormData, paymentMethod: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-900 focus:outline-hidden transition-all text-slate-800"
                >
                  <option value="VIREMENT">Virement Bancaire (Recommandé)</option>
                  <option value="CHEQUE">Chèque Bancaire</option>
                  <option value="ESPECES">Espèces (Caisse / Cash)</option>
                  <option value="CARTE">Carte Bancaire Professionnelle</option>
                  <option value="EFFET">Effet de Commerce / Traite</option>
                  <option value="AUTRE">Autre Moyen</option>
                </select>
              </div>

              {/* Date de Règlement */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Date Effective du Paiement <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={payFormData.paidAt}
                  onChange={(e) => setPayFormData({ ...payFormData, paidAt: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-900 focus:outline-hidden transition-all font-semibold"
                />
              </div>

              {/* Justificatif / Reçu de Virement (Optionnel) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Reçu de Virement / Justificatif Bancaire (Optionnel)
                </label>

                <input
                  type="file"
                  ref={paymentVoucherInputRef}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUploadDocument(f, true);
                  }}
                  accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                />

                {payFormData.paymentVoucherUrl ? (
                  <div className="p-3 rounded-xl border border-emerald-300 bg-emerald-50 flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                      <Check size={14} />
                      <span>Reçu de virement attaché</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => paymentVoucherInputRef.current?.click()}
                      className="text-xs text-emerald-700 underline font-semibold"
                    >
                      Changer
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => paymentVoucherInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full py-2.5 px-4 rounded-xl border border-dashed border-slate-300 hover:border-emerald-400 bg-slate-50 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Upload size={14} />
                    <span>{isUploading ? 'Téléchargement...' : 'Joindre le reçu de virement (PDF ou Photo)'}</span>
                  </button>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Notes de Règlement
                </label>
                <input
                  type="text"
                  value={payFormData.notes}
                  onChange={(e) => setPayFormData({ ...payFormData, notes: e.target.value })}
                  placeholder="N° d'ordre de virement ou observation..."
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-900 focus:outline-hidden transition-all"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={14} />
                  )}
                  <span>Confirmer le Règlement</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🔍 UNIVERSAL DOCUMENT VIEWER LIGHTBOX (PDF & IMAGE) */}
      {activeDocument && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-5xl w-full h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Lightbox Header */}
            <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                  <FileText size={18} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold truncate">{activeDocument.title}</h4>
                  <p className="text-xs text-slate-400 truncate">{activeDocument.subtitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={activeDocument.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                  title="Télécharger"
                >
                  <Download size={15} />
                  <span className="hidden sm:inline">Télécharger</span>
                </a>

                <a
                  href={activeDocument.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Ouvrir dans un nouvel onglet"
                >
                  <ExternalLink size={16} />
                </a>

                <button
                  onClick={() => setActiveDocument(null)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Fermer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Lightbox Viewer Body */}
            <div className="flex-1 bg-slate-950 p-4 overflow-auto flex items-center justify-center relative">
              {isPdfUrl(activeDocument.url) ? (
                <iframe
                  src={activeDocument.url}
                  className="w-full h-full rounded-2xl border border-slate-800 bg-white"
                  title="Aperçu PDF"
                />
              ) : (
                <div className="relative max-w-full max-h-full flex items-center justify-center">
                  <Image
                    src={activeDocument.url}
                    alt={activeDocument.title}
                    width={1400}
                    height={1000}
                    className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
                    priority
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
