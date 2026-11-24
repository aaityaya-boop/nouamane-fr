'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Upload,
  Plus,
  Search,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  Trash2,
  Paperclip,
  CreditCard,
  X,
  ExternalLink,
  RefreshCw,
  Download,
  ZoomIn,
  Check,
  AlertTriangle,
  User,
  Tag,
  Receipt,
  FileCheck,
  ArrowUpDown,
  Layers,
  Zap,
} from 'lucide-react';
import { UnifiedBillItem } from '@/lib/billsHelper';
import { isPdfUrl, getDocumentName } from '../suppliers/SuppliersClient';

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

type BillSortOption = 'DUE_URGENT' | 'AMOUNT_DESC' | 'AMOUNT_ASC' | 'VENDOR_ASC';

const CATEGORY_MAP: Record<
  string,
  { label: string; shortLabel: string; bg: string; text: string; border: string; bar: string }
> = {
  SUPPLIES: {
    label: 'Stock & Matières',
    shortLabel: 'Matières & Flacons',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-500/20',
    bar: 'bg-emerald-500',
  },
  PACKAGING: {
    label: 'Packaging & Boîtes',
    shortLabel: 'Packaging Luxe',
    bg: 'bg-amber-500/10',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-500/20',
    bar: 'bg-amber-500',
  },
  LOGISTICS: {
    label: 'Transport & Fret',
    shortLabel: 'Logistique & Fret',
    bg: 'bg-sky-500/10',
    text: 'text-[#0284c7] dark:text-[#38bdf8]',
    border: 'border-sky-500/20',
    bar: 'bg-[#0ea5e9]',
  },
  OFFICE: {
    label: 'Bureau & Exploitation',
    shortLabel: 'Exploitation',
    bg: 'bg-purple-500/10',
    text: 'text-purple-700 dark:text-purple-400',
    border: 'border-purple-500/20',
    bar: 'bg-purple-500',
  },
  ADS: {
    label: 'Marketing & Pubs',
    shortLabel: 'Marketing & Ads',
    bg: 'bg-rose-500/10',
    text: 'text-rose-700 dark:text-rose-400',
    border: 'border-rose-500/20',
    bar: 'bg-rose-500',
  },
  OTHER: {
    label: 'Autres Charges',
    shortLabel: 'Divers',
    bg: 'bg-slate-500/10',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-500/20',
    bar: 'bg-slate-400',
  },
};

const BILL_INPUT_CLASS =
  'w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#0c101b] border border-slate-200/90 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-[#131826] focus:border-[#0ea5e9] focus:ring-2 focus:ring-[#0ea5e9]/20 focus:outline-none transition-all';

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

  // Filters & Sorting
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState<'ALL' | 'PENDING' | 'OVERDUE' | 'PAID'>('PENDING');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'EMPLOYEE' | 'PO'>('ALL');
  const [sortBy, setSortBy] = useState<BillSortOption>('DUE_URGENT');

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
  const [formData, setFormData] = useState(() => ({
    vendor: '',
    invoiceNumber: '',
    amount: '',
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    invoiceDate: new Date().toISOString().slice(0, 10),
    category: 'SUPPLIES',
    invoiceUrl: '',
    notes: '',
  }));

  // Pay Form State
  const [payFormData, setPayFormData] = useState(() => ({
    paymentMethod: 'VIREMENT',
    paidAt: new Date().toISOString().slice(0, 10),
    paymentVoucherUrl: '',
    notes: '',
  }));

  const formatMAD = (amount: number) => {
    return (
      new Intl.NumberFormat('fr-MA', {
        style: 'currency',
        currency: 'MAD',
        maximumFractionDigits: 0,
      })
        .format(amount || 0)
        .replace('MAD', '')
        .trim() + ' MAD'
    );
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
      setStats((prev) => ({
        ...prev,
        pendingCount: prev.pendingCount + 1,
        totalPendingMAD: prev.totalPendingMAD + amt,
        employeeDepositCount: prev.employeeDepositCount + 1,
      }));

      setIsDepositModalOpen(false);
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
        totalPendingMAD:
          bill.status === 'PENDING' ? Math.max(0, prev.totalPendingMAD - bill.amountMAD) : prev.totalPendingMAD,
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

  // Computed breakdown metrics
  const { overdueAmountMAD, dueSoonAmountMAD, settlementRatio, categoryBreakdown, urgentBills } = useMemo(() => {
    const overdue = bills.filter((b) => b.status === 'PENDING' && b.isOverdue);
    const dueSoon = bills.filter(
      (b) => b.status === 'PENDING' && !b.isOverdue && b.daysRemaining !== null && b.daysRemaining <= 7
    );
    const totalBills = bills.length;
    const paidBills = bills.filter((b) => b.status === 'PAID').length;
    const ratio = totalBills > 0 ? Math.round((paidBills / totalBills) * 100) : 100;

    const pendingBills = bills.filter((b) => b.status === 'PENDING');
    const pendingSum = pendingBills.reduce((s, b) => s + (b.amountMAD || 0), 0);

    const catStats = Object.keys(CATEGORY_MAP).map((catKey) => {
      const items = pendingBills.filter((b) => b.category === catKey);
      const total = items.reduce((s, b) => s + (b.amountMAD || 0), 0);
      return {
        key: catKey,
        ...CATEGORY_MAP[catKey],
        count: items.length,
        totalMAD: total,
        pct: pendingSum > 0 ? Math.round((total / pendingSum) * 100) : 0,
      };
    });

    const urgent = pendingBills
      .filter((b) => b.isOverdue || (b.daysRemaining !== null && b.daysRemaining <= 7))
      .sort((a, b) => (a.daysRemaining ?? 999) - (b.daysRemaining ?? 999))
      .slice(0, 3);

    return {
      overdueAmountMAD: overdue.reduce((s, b) => s + (b.amountMAD || 0), 0),
      dueSoonAmountMAD: dueSoon.reduce((s, b) => s + (b.amountMAD || 0), 0),
      settlementRatio: ratio,
      categoryBreakdown: catStats,
      urgentBills: urgent,
    };
  }, [bills]);

  // Filtered & Sorted Bills
  const filteredBills = useMemo(() => {
    return bills
      .filter((b) => {
        if (statusTab === 'PENDING' && b.status !== 'PENDING') return false;
        if (statusTab === 'OVERDUE' && (!b.isOverdue || b.status !== 'PENDING')) return false;
        if (statusTab === 'PAID' && b.status !== 'PAID') return false;
        if (selectedCategory !== 'ALL' && b.category !== selectedCategory) return false;
        if (sourceFilter === 'EMPLOYEE' && b.source !== 'EMPLOYEE_BILL') return false;
        if (sourceFilter === 'PO' && b.source !== 'PURCHASE_ORDER') return false;

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
      })
      .sort((a, b) => {
        if (sortBy === 'AMOUNT_DESC') return (b.amountMAD || 0) - (a.amountMAD || 0);
        if (sortBy === 'AMOUNT_ASC') return (a.amountMAD || 0) - (b.amountMAD || 0);
        if (sortBy === 'VENDOR_ASC') return a.vendor.localeCompare(b.vendor, 'fr', { sensitivity: 'base' });
        // DUE_URGENT: pending + overdue first by daysRemaining asc
        if (a.status !== b.status) return a.status === 'PENDING' ? -1 : 1;
        return (a.daysRemaining ?? 9999) - (b.daysRemaining ?? 9999);
      });
  }, [bills, statusTab, selectedCategory, sourceFilter, search, sortBy]);

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['Statut', 'Échéance', 'Fournisseur', 'N° Facture', 'Catégorie', 'Montant (MAD)', 'Déposé par', 'Mode Paiement'];
    const rows = filteredBills.map((b) =>
      [
        b.status === 'PAID' ? 'RÉGLÉ' : b.isOverdue ? 'EN RETARD' : 'À PAYER',
        b.dueDate || 'Sans échéance',
        `"${b.vendor.replace(/"/g, '""')}"`,
        `"${b.invoiceNumber || ''}"`,
        `"${(CATEGORY_MAP[b.category] || CATEGORY_MAP.OTHER).label}"`,
        b.amountMAD || 0,
        `"${b.creatorName}"`,
        `"${b.paymentMethod || '-'}"`,
      ].join(';')
    );
    const csv = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Factures_NAY_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-20 font-sans text-slate-900 dark:text-slate-100">
      {/* ── 1. HOME-DASHBOARD STYLE EXECUTIVE HEADER ────────────────────────── */}
      <div className="nay-enter flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-200/80 dark:border-white/[0.06]">
        <div>
          <div className="flex items-center gap-x-2 gap-y-0.5 mb-1.5 flex-wrap text-[11px] font-semibold tracking-[0.1em] uppercase text-slate-500 dark:text-slate-400">
            <span>NAY PARFUMS · FACTURES À PAYER</span>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">·</span>
            <span className="inline-flex items-center gap-1.5 normal-case tracking-normal font-medium text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              {stats.pendingCount} facture(s) à régler
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Échéancier des Règlements &amp; Factures
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mt-0.5">
            Dépôt collaboratif des factures fournisseurs, pilotage des échéances critiques et synchronisation directe avec Finance &amp; CA Net.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center justify-center gap-1.5 h-10 sm:h-9 w-10 sm:w-auto sm:px-3.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-[#14151f] dark:hover:bg-[#1a1b28] border border-slate-200/90 dark:border-white/[0.08] text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs transition-all cursor-pointer active:scale-95 disabled:opacity-50 shrink-0"
              title="Rafraîchir les factures"
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-[#0ea5e9]' : 'text-slate-400'} />
              <span className="hidden sm:inline">Actualiser</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 h-10 sm:h-9 px-3.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-[#14151f] dark:hover:bg-[#1a1b28] border border-slate-200/90 dark:border-white/[0.08] text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs transition-all cursor-pointer active:scale-95 whitespace-nowrap"
              title="Exporter l'échéancier en CSV"
            >
              <Download size={13} className="text-[#0ea5e9] shrink-0" />
              <span>Export CSV</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsDepositModalOpen(true)}
            style={{ backgroundColor: 'var(--admin-accent, #0ea5e9)' }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-10 sm:h-9 px-4 rounded-xl text-white text-xs font-bold shadow-xs hover:opacity-95 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <Plus size={15} strokeWidth={2.5} className="shrink-0" />
            <span>Déposer une Facture</span>
          </button>
        </div>
      </div>

      {/* ── 2. 4 EXECUTIVE KPI CARDS ───────── */}
      <div className="nay-stagger grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        {/* Card 1: Maison Obsidian Lead Card - Total À Régler */}
        <div
          onClick={() => setStatusTab('PENDING')}
          className={`nay-hero-shine nay-card-lift rounded-2xl p-5 sm:p-6 flex flex-col justify-between min-h-[196px] group relative overflow-hidden bg-[#0b1322] dark:bg-[#0f172a] text-white border shadow-md transition-all cursor-pointer ${
            statusTab === 'PENDING' ? 'border-sky-500/40 ring-2 ring-[#0ea5e9]/20' : 'border-slate-800/90 dark:border-sky-500/20'
          }`}
        >
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/[0.08] border border-white/[0.12] text-sky-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Receipt size={20} strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-300 leading-tight">
                    TOTAL À RÉGLER
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium leading-tight mt-0.5">
                    Encours factures &amp; bons
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/[0.08] text-sky-300 border border-white/[0.12] shrink-0">
                {stats.pendingCount} en cours
              </span>
            </div>

            <div className="text-xl sm:text-[24px] xl:text-[27px] font-bold tracking-tight text-white tabular-nums whitespace-nowrap mt-3 mb-1">
              {formatMAD(stats.totalPendingMAD)}
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400 mt-3 relative z-10">
            <span>Dépôts équipe : <strong className="text-white">{stats.employeeDepositCount}</strong></span>
            <span className="font-bold text-white bg-white/[0.1] border border-white/[0.15] px-2.5 py-0.5 rounded-full">Voir à payer</span>
          </div>
        </div>

        {/* Card 2: Factures en Retard */}
        <div
          onClick={() => setStatusTab(statusTab === 'OVERDUE' ? 'PENDING' : 'OVERDUE')}
          className={`nay-card-lift spatial-card aura-hover-purple rounded-2xl p-5 sm:p-6 flex flex-col justify-between min-h-[196px] group cursor-pointer transition-all ${
            statusTab === 'OVERDUE' ? 'ring-2 ring-rose-500/40 border-rose-400/60' : ''
          }`}
        >
          <div>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
                  <AlertTriangle size={20} strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 leading-tight">
                    EN RETARD CRITIQUE
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight mt-0.5">
                    Échéances dépassées
                  </p>
                </div>
              </div>
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border shrink-0 ${
                  stats.overdueCount > 0
                    ? 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20'
                    : 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                }`}
              >
                {stats.overdueCount > 0 ? 'Urgent' : 'À jour'}
              </span>
            </div>

            <div className="flex items-baseline justify-between gap-2 mt-3 mb-1">
              <div
                className={`text-xl sm:text-[24px] xl:text-[27px] font-black tracking-tight tabular-nums ${
                  stats.overdueCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                }`}
              >
                {stats.overdueCount}
                <span className="text-sm font-semibold text-slate-400 ml-1.5 font-sans">facture(s)</span>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-white/5">
            <span>Montant en retard</span>
            <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{formatMAD(overdueAmountMAD)}</span>
          </div>
        </div>

        {/* Card 3: Échéance Proche (< 7 jours) */}
        <div
          onClick={() => setStatusTab('PENDING')}
          className="nay-card-lift spatial-card aura-hover-purple rounded-2xl p-5 sm:p-6 flex flex-col justify-between min-h-[196px] group cursor-pointer transition-all"
        >
          <div>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
                  <Clock size={20} strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 leading-tight">
                    ÉCHÉANCE &lt; 7 JOURS
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight mt-0.5">
                    Décaissements imminents
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 shrink-0">
                7 jours
              </span>
            </div>

            <div className="text-xl sm:text-[24px] xl:text-[27px] font-black tracking-tight text-amber-600 dark:text-amber-400 tabular-nums mt-3 mb-1">
              {stats.dueSoonCount}
              <span className="text-sm font-semibold text-slate-400 ml-1.5 font-sans">échéance(s)</span>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-white/5">
            <span>Trésorerie à prévoir</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{formatMAD(dueSoonAmountMAD)}</span>
          </div>
        </div>

        {/* Card 4: Réglées ce mois & Taux d'Apurement */}
        <div
          onClick={() => setStatusTab(statusTab === 'PAID' ? 'PENDING' : 'PAID')}
          className={`nay-card-lift spatial-card aura-hover-purple rounded-2xl p-5 sm:p-6 flex flex-col justify-between min-h-[196px] group cursor-pointer transition-all ${
            statusTab === 'PAID' ? 'ring-2 ring-emerald-500/40 border-emerald-400/60' : ''
          }`}
        >
          <div>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
                  <CheckCircle2 size={20} strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 leading-tight">
                    RÉGLÉES CE MOIS
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight mt-0.5">
                    {stats.paidCount} factures acquittées
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 shrink-0 tabular-nums">
                {settlementRatio}%
              </span>
            </div>

            <div className="text-xl sm:text-[24px] xl:text-[27px] font-black tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums mt-3 mb-2 font-mono">
              {formatMAD(stats.paidThisMonthMAD)}
            </div>

            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
              <div
                className="nay-progress-fill h-full rounded-full bg-emerald-500 dark:bg-emerald-400"
                style={{ width: `${settlementRatio}%` }}
              />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-white/5">
            <span>Taux d&apos;apurement global</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Synchronisé</span>
          </div>
        </div>
      </div>

      {/* ── 3. CATEGORY SPEND RATIO TRACK (HOME DASHBOARD DNA) ─────────────── */}
      <div className="nay-stagger grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {categoryBreakdown.map((cat) => {
          const isSelected = selectedCategory === cat.key;
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => setSelectedCategory(isSelected ? 'ALL' : cat.key)}
              className={`nay-card-lift text-left rounded-xl p-3.5 bg-white dark:bg-[#141926] border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'border-[#0ea5e9] ring-2 ring-[#0ea5e9]/25 shadow-md'
                  : 'border-slate-200/80 dark:border-white/10 hover:border-sky-300 dark:hover:border-sky-500/30'
              }`}
            >
              <div className="flex items-center justify-between gap-1 text-[10.5px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                <span className="truncate">{cat.shortLabel}</span>
                <span className="font-mono text-slate-400">{cat.pct}%</span>
              </div>
              <div className="text-sm font-black font-mono text-slate-900 dark:text-white mt-1.5 tabular-nums">
                {formatMAD(cat.totalMAD)}
              </div>
              <div className="w-full h-1 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden my-2">
                <div className={`nay-progress-fill h-full rounded-full ${cat.bar}`} style={{ width: `${cat.pct}%` }} />
              </div>
              <div className="text-[10px] text-slate-400 font-medium">{cat.count} en attente</div>
            </button>
          );
        })}
      </div>

      {/* ── 3B. PRIORITY URGENT DUE-DATES STRIP (IF ANY) ───────────────────── */}
      {urgentBills.length > 0 && (
        <div className="nay-enter spatial-card rounded-2xl border border-amber-300/70 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/15 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Zap size={16} />
            </div>
            <div>
              <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                Échéances Prioritaires ({urgentBills.length})
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400">
                Règlements rapides recommandés pour éviter tout retard fournisseur.
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {urgentBills.map((ub) => (
              <div
                key={`urgent-${ub.source}-${ub.id}`}
                className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#101524] border border-slate-200/80 dark:border-white/10 shadow-2xs text-xs"
              >
                <span className={`w-2 h-2 rounded-full ${ub.isOverdue ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`} />
                <span className="font-bold text-slate-900 dark:text-white">{ub.vendor}</span>
                <span className="font-mono font-bold text-[#0284c7] dark:text-[#38bdf8]">{formatMAD(ub.amountMAD)}</span>
                <button
                  type="button"
                  onClick={() => openPayModal(ub)}
                  className="px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition-colors cursor-pointer"
                >
                  Régler
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 4. FILTER CONTROLS, TABS & SORT TOOLBAR ─────────────────────────── */}
      <div className="nay-enter spatial-card bg-white dark:bg-[#101524] p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-white/[0.06] pb-3.5">
          <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.08] rounded-2xl">
            {[
              { id: 'PENDING' as const, label: `À Payer (${stats.pendingCount})`, activeClass: 'bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] shadow-[0_4px_14px_rgba(14,165,233,0.35)]' },
              { id: 'OVERDUE' as const, label: `En Retard (${stats.overdueCount})`, activeClass: 'bg-rose-600 shadow-xs' },
              { id: 'PAID' as const, label: `Réglées (${stats.paidCount})`, activeClass: 'bg-emerald-600 shadow-xs' },
              { id: 'ALL' as const, label: `Toutes (${bills.length})`, activeClass: 'bg-slate-900 dark:bg-[#1e293b] shadow-xs' },
            ].map((tab) => {
              const isActive = statusTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusTab(tab.id)}
                  className={`relative px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    isActive ? 'text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="bills-status-pill"
                      transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                      className={`absolute inset-0 rounded-xl ${tab.activeClass}`}
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Affichage de <strong className="text-slate-900 dark:text-white">{filteredBills.length}</strong> facture(s)
          </div>
        </div>

        {/* Search, Category, Source & Sort Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Fournisseur, n° facture, montant..."
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#0c0f1a] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#0ea5e9] focus:outline-none transition-all"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-[#0c0f1a] border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300 focus:border-[#0ea5e9] focus:outline-none cursor-pointer"
          >
            <option value="ALL">Toutes les catégories</option>
            <option value="SUPPLIES">Stock &amp; Matières Premières</option>
            <option value="PACKAGING">Packaging &amp; Emballages</option>
            <option value="LOGISTICS">Transport &amp; Logistique</option>
            <option value="OFFICE">Bureau &amp; Exploitation</option>
            <option value="ADS">Marketing &amp; Publicité</option>
            <option value="OTHER">Autres Charges</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value as any)}
            className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-[#0c0f1a] border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300 focus:border-[#0ea5e9] focus:outline-none cursor-pointer"
          >
            <option value="ALL">Toutes les provenances</option>
            <option value="EMPLOYEE">Déposées par l&apos;équipe</option>
            <option value="PO">Bons de Commande Fournisseur</option>
          </select>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <ArrowUpDown size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as BillSortOption)}
                className="w-full pl-8 pr-3 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-[#0c0f1a] border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300 focus:border-[#0ea5e9] focus:outline-none cursor-pointer"
              >
                <option value="DUE_URGENT">Échéance urgente d&apos;abord</option>
                <option value="AMOUNT_DESC">Montant décroissant</option>
                <option value="AMOUNT_ASC">Montant croissant</option>
                <option value="VENDOR_ASC">Fournisseur (A → Z)</option>
              </select>
            </div>

            {(search || selectedCategory !== 'ALL' || sourceFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('ALL');
                  setSourceFilter('ALL');
                }}
                className="p-2.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all cursor-pointer shrink-0"
                title="Réinitialiser les filtres"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 5. EXECUTIVE BILLS LEDGER TABLE ────────────────────────────────── */}
      <div className="nay-enter spatial-card bg-white dark:bg-[#101524] rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-xs overflow-hidden">
        {filteredBills.length === 0 ? (
          <div className="py-16 px-4 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-[#0ea5e9]">
              <FileText size={30} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Aucune facture trouvée</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                {statusTab === 'PENDING'
                  ? 'Toutes les factures sont réglées ou aucune facture en attente ne correspond à vos filtres.'
                  : 'Aucun enregistrement ne correspond à vos critères de recherche.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsDepositModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] text-white text-xs font-bold shadow-[0_4px_14px_rgba(14,165,233,0.35)] cursor-pointer"
            >
              <Plus size={15} />
              <span>Déposer une nouvelle facture</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-[#0c0f1a]/80 border-b border-slate-200/80 dark:border-white/10 text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Statut &amp; Échéance</th>
                  <th className="py-3.5 px-4">Fournisseur / Prestataire</th>
                  <th className="py-3.5 px-4">Document / Facture</th>
                  <th className="py-3.5 px-4">Catégorie</th>
                  <th className="py-3.5 px-4">Montant TTC</th>
                  <th className="py-3.5 px-4">Déposé Par</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {filteredBills.map((bill) => {
                  const catCfg = CATEGORY_MAP[bill.category] || CATEGORY_MAP.OTHER;
                  const isPdf = isPdfUrl(bill.invoiceUrl);

                  return (
                    <tr
                      key={`${bill.source}-${bill.id}`}
                      className="hover:bg-sky-500/[0.03] dark:hover:bg-sky-500/[0.06] transition-colors group"
                    >
                      {/* Statut & Échéance */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <div className="space-y-1">
                          {bill.status === 'PAID' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-extrabold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 size={12} />
                              <span>RÉGLÉ</span>
                            </span>
                          ) : bill.isOverdue ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-extrabold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                              <span>EN RETARD</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-extrabold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                              <Clock size={12} />
                              <span>À PAYER</span>
                            </span>
                          )}

                          <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                            {bill.dueDate ? (
                              <span>
                                Échéance : <strong className="text-slate-900 dark:text-slate-200">{bill.dueDate}</strong>
                                {bill.daysRemaining !== null && bill.status === 'PENDING' && (
                                  <span
                                    className={`ml-1 text-[10px] font-bold ${
                                      bill.daysRemaining < 0
                                        ? 'text-rose-600 dark:text-rose-400'
                                        : bill.daysRemaining <= 3
                                        ? 'text-amber-600 dark:text-amber-400'
                                        : 'text-slate-400'
                                    }`}
                                  >
                                    (
                                    {bill.daysRemaining < 0
                                      ? `+${Math.abs(bill.daysRemaining)}j retard`
                                      : `${bill.daysRemaining}j restants`}
                                    )
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
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2 group-hover:text-[#0ea5e9] dark:group-hover:text-[#38bdf8] transition-colors">
                            <span>{bill.vendor}</span>
                            {bill.source === 'PURCHASE_ORDER' && (
                              <span className="px-1.5 py-0.5 rounded-md text-[9.5px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                                Bon Commande
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1.5">
                            <Tag size={11} className="text-slate-400" />
                            <span>{bill.invoiceNumber || 'Facture sans N°'}</span>
                            {bill.invoiceDate && (
                              <>
                                <span className="text-slate-300 dark:text-slate-700">•</span>
                                <span className="text-slate-400">Émise le {bill.invoiceDate}</span>
                              </>
                            )}
                          </div>
                          {bill.notes && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 italic max-w-xs">
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
                                type="button"
                                onClick={() =>
                                  setActiveDocument({
                                    url: bill.invoiceUrl!,
                                    title: `Facture ${bill.vendor}`,
                                    subtitle: bill.invoiceNumber ? `Réf: ${bill.invoiceNumber}` : 'Document PDF',
                                    vendor: bill.vendor,
                                    invoiceNumber: bill.invoiceNumber,
                                  })
                                }
                                className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 hover:bg-rose-500/20 transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                              >
                                <span className="w-5 h-5 rounded-md bg-rose-600 text-white text-[9px] font-black flex items-center justify-center">
                                  PDF
                                </span>
                                <span>Voir Facture</span>
                                <Eye size={13} />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveDocument({
                                    url: bill.invoiceUrl!,
                                    title: `Facture ${bill.vendor}`,
                                    subtitle: bill.invoiceNumber ? `Réf: ${bill.invoiceNumber}` : 'Image justificative',
                                    vendor: bill.vendor,
                                    invoiceNumber: bill.invoiceNumber,
                                  })
                                }
                                className="flex items-center gap-2 p-1 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl border border-slate-200/80 dark:border-white/10 transition-all cursor-pointer"
                              >
                                <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0">
                                  <Image src={bill.invoiceUrl} alt="Facture" fill className="object-cover" />
                                </div>
                                <div className="text-left pr-2">
                                  <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                    <span>Scan Facture</span>
                                    <ZoomIn size={12} className="text-slate-400" />
                                  </div>
                                  <div className="text-[9px] text-slate-400">Photo / Reçu</div>
                                </div>
                              </button>
                            )}

                            {bill.receiptUrl && (
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveDocument({
                                    url: bill.receiptUrl!,
                                    title: `Justificatif de Règlement - ${bill.vendor}`,
                                    subtitle: `Mode: ${bill.paymentMethod || 'Virement bancaire'}`,
                                    vendor: bill.vendor,
                                    invoiceNumber: bill.invoiceNumber,
                                  })
                                }
                                className="px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold hover:bg-emerald-500/20 transition-all flex items-center gap-1 cursor-pointer"
                                title="Voir la preuve de paiement"
                              >
                                <FileCheck size={12} />
                                <span>Reçu Payé</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic flex items-center gap-1">
                            <Paperclip size={12} className="text-slate-400" />
                            <span>Aucun document joint</span>
                          </span>
                        )}
                      </td>

                      {/* Catégorie */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10.5px] font-bold border ${catCfg.bg} ${catCfg.text} ${catCfg.border}`}
                        >
                          {catCfg.label}
                        </span>
                      </td>

                      {/* Montant */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-extrabold text-sm text-slate-900 dark:text-white font-mono tabular-nums">
                          {formatMAD(bill.amountMAD)}
                        </div>
                        {bill.status === 'PAID' && bill.paymentMethod && (
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            Réglé par {bill.paymentMethod}
                          </div>
                        )}
                      </td>

                      {/* Déposé Par */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                            {bill.creatorName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 dark:text-slate-200 text-[11px] leading-tight">
                              {bill.creatorName}
                            </div>
                            <div className="text-[10px] text-slate-400 leading-tight">{bill.creatorRole}</div>
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {bill.status === 'PENDING' && (
                            <button
                              type="button"
                              onClick={() => openPayModal(bill)}
                              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] hover:from-[#0284c7] hover:to-[#0369a1] text-white font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer hover:scale-105"
                              title="Marquer comme payée"
                            >
                              <CheckCircle2 size={13} />
                              <span>Régler</span>
                            </button>
                          )}

                          {bill.source === 'EMPLOYEE_BILL' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteBill(bill)}
                              className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 border border-slate-200/80 dark:border-white/10 transition-all cursor-pointer hover:scale-105"
                              title="Supprimer la facture"
                            >
                              <Trash2 size={14} />
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

      {/* 🚀 MODAL: DÉPOSER UNE FACTURE À PAYER */}
      <AnimatePresence>
        {isDepositModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDepositModalOpen(false)}
              className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              className="relative z-10 bg-white dark:bg-[#111624] rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200/80 dark:border-white/10 my-8 space-y-6 text-slate-900 dark:text-slate-100"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-500/10 text-[#0284c7] dark:text-[#38bdf8] text-[10px] font-bold border border-sky-500/20">
                    <Receipt size={12} />
                    <span>Dépôt Universel Équipe NAY</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                    Déposer une Facture à Payer
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDepositModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmitDeposit} className="space-y-4">
                <div className="p-3 bg-slate-50 dark:bg-[#0c101b] rounded-2xl border border-slate-200/80 dark:border-white/10 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] text-white text-[10px] font-bold flex items-center justify-center">
                      {currentUser.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Collaborateur : </span>
                      <strong className="text-slate-900 dark:text-white">{currentUser.name}</strong>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-[10px] font-semibold">
                    {currentUser.role}
                  </span>
                </div>

                {/* Upload Zone */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
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
                    <div className="p-4 rounded-2xl border-2 border-emerald-400/50 bg-emerald-500/10 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {isPdfUrl(formData.invoiceUrl) ? (
                          <div className="w-10 h-10 rounded-xl bg-rose-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                            PDF
                          </div>
                        ) : (
                          <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-slate-200 shrink-0">
                            <Image src={formData.invoiceUrl} alt="Preview" fill className="object-cover" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {getDocumentName(formData.invoiceUrl, 'Facture chargée')}
                          </div>
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
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
                          className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white text-xs font-bold hover:bg-slate-50 cursor-pointer flex items-center gap-1"
                        >
                          <Eye size={13} />
                          <span>Voir</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1.5 rounded-lg bg-[#0ea5e9] text-white text-xs font-bold hover:bg-[#0284c7] cursor-pointer"
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
                      className="border-2 border-dashed border-slate-300 dark:border-white/15 hover:border-[#0ea5e9] bg-slate-50/70 dark:bg-[#0c101b] hover:bg-sky-500/5 rounded-2xl p-6 text-center transition-all cursor-pointer space-y-2 group"
                    >
                      <div className="w-12 h-12 mx-auto rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 group-hover:text-[#0ea5e9] shadow-2xs transition-colors">
                        {isUploading ? <RefreshCw size={22} className="animate-spin text-[#0ea5e9]" /> : <Upload size={22} />}
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
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
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Fournisseur / Prestataire <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.vendor}
                      onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                      placeholder="ex: Argeville, Cartonnerie Atlas, CTM..."
                      list="known-suppliers"
                      className={BILL_INPUT_CLASS}
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
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      N° Facture / Référence
                    </label>
                    <input
                      type="text"
                      value={formData.invoiceNumber}
                      onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                      placeholder="ex: FAC-2026-904"
                      className={BILL_INPUT_CLASS}
                    />
                  </div>
                </div>

                {/* Montant & Catégorie */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
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
                        className={`${BILL_INPUT_CLASS} pr-14 font-mono font-bold`}
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                        MAD
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Catégorie de Charge
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className={BILL_INPUT_CLASS}
                    >
                      <option value="SUPPLIES">Stock &amp; Matières Premières</option>
                      <option value="PACKAGING">Packaging, Boîtes &amp; Sacs</option>
                      <option value="LOGISTICS">Transport, Fret &amp; Livraison</option>
                      <option value="OFFICE">Charges d&apos;Exploitation &amp; Atelier</option>
                      <option value="ADS">Marketing &amp; Publicité</option>
                      <option value="OTHER">Autre Dépense</option>
                    </select>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Date de la Facture</label>
                    <input
                      type="date"
                      value={formData.invoiceDate}
                      onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                      className={BILL_INPUT_CLASS}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Date d&apos;Échéance
                    </label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className={`${BILL_INPUT_CLASS} font-semibold`}
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Commentaires / Notes Internes
                  </label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Détails sur la prestation, conditions convenues, RIB ou numéro de virement..."
                    className={BILL_INPUT_CLASS}
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsDepositModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || isUploading}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] hover:from-[#0284c7] hover:to-[#0369a1] text-white text-xs font-bold shadow-[0_4px_14px_rgba(14,165,233,0.35)] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? <RefreshCw size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                    <span>Enregistrer &amp; Déposer</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 💳 MODAL: VALIDER LE RÈGLEMENT DE LA FACTURE */}
      <AnimatePresence>
        {isPayModalOpen && billToPay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPayModalOpen(false)}
              className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              className="relative z-10 bg-white dark:bg-[#111624] rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200/80 dark:border-white/10 my-8 space-y-6 text-slate-900 dark:text-slate-100"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                    <CreditCard size={12} />
                    <span>Validation du Paiement</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Marquer la Facture comme Réglée
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-[#0c101b] rounded-2xl border border-slate-200/80 dark:border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Fournisseur :</span>
                  <strong className="text-xs text-slate-900 dark:text-white">{billToPay.vendor}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400">N° Facture :</span>
                  <span className="text-xs font-mono text-slate-700 dark:text-slate-300">
                    {billToPay.invoiceNumber || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-white/10">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Montant Total à Acquitter :</span>
                  <span className="text-base font-black text-[#0284c7] dark:text-[#38bdf8] font-mono">
                    {formatMAD(billToPay.amountMAD)}
                  </span>
                </div>
              </div>

              <form onSubmit={handleConfirmPayment} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Mode de Paiement <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={payFormData.paymentMethod}
                    onChange={(e) => setPayFormData({ ...payFormData, paymentMethod: e.target.value })}
                    className={BILL_INPUT_CLASS}
                  >
                    <option value="VIREMENT">Virement Bancaire (Recommandé)</option>
                    <option value="CHEQUE">Chèque Bancaire</option>
                    <option value="ESPECES">Espèces (Caisse / Cash)</option>
                    <option value="CARTE">Carte Bancaire Professionnelle</option>
                    <option value="EFFET">Effet de Commerce / Traite</option>
                    <option value="AUTRE">Autre Moyen</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Date Effective du Paiement <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={payFormData.paidAt}
                    onChange={(e) => setPayFormData({ ...payFormData, paidAt: e.target.value })}
                    className={`${BILL_INPUT_CLASS} font-semibold`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
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
                    <div className="p-3 rounded-xl border border-emerald-400/50 bg-emerald-500/10 flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                        <Check size={14} />
                        <span>Reçu de virement attaché</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => paymentVoucherInputRef.current?.click()}
                        className="text-xs text-emerald-700 dark:text-emerald-400 underline font-semibold cursor-pointer"
                      >
                        Changer
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => paymentVoucherInputRef.current?.click()}
                      disabled={isUploading}
                      className="w-full py-2.5 px-4 rounded-xl border border-dashed border-slate-300 dark:border-white/15 hover:border-emerald-400 bg-slate-50 dark:bg-[#0c101b] text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Upload size={14} />
                      <span>{isUploading ? 'Téléchargement...' : 'Joindre le reçu de virement (PDF ou Photo)'}</span>
                    </button>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Notes de Règlement</label>
                  <input
                    type="text"
                    value={payFormData.notes}
                    onChange={(e) => setPayFormData({ ...payFormData, notes: e.target.value })}
                    placeholder="N° d'ordre de virement ou observation..."
                    className={BILL_INPUT_CLASS}
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPayModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] hover:from-[#0284c7] hover:to-[#0369a1] text-white text-xs font-bold shadow-[0_4px_14px_rgba(14,165,233,0.35)] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    <span>Confirmer le Règlement</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🔍 UNIVERSAL DOCUMENT VIEWER LIGHTBOX (PDF & IMAGE) */}
      <AnimatePresence>
        {activeDocument && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveDocument(null)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="relative z-10 bg-slate-900 border border-slate-800 rounded-3xl max-w-5xl w-full h-[90vh] flex flex-col overflow-hidden shadow-2xl"
            >
              <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-white">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-[#38bdf8] shrink-0">
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
                    type="button"
                    onClick={() => setActiveDocument(null)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="Fermer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

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
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
