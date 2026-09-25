'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
  Receipt,
  Search,
  Filter,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Truck,
  TrendingUp,
  CreditCard,
  Building,
  Calendar,
  X,
  Plus,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Eye,
  FileText,
  AlertCircle,
  Sparkles,
  Layers,
  ArrowUpRight,
  Check,
  Copy,
  DollarSign,
  ShieldCheck,
  Edit3,
  Sliders,
  History,
  Trash2,
  Percent
} from 'lucide-react';
import { CalculatedOrderEncaissement } from '@/lib/encaissements/reconciliationService';
import { formatMAD } from '@/lib/products';

interface CarrierData {
  id: string;
  name: string;
  code: string;
  defaultFee: number | null;
  payoutTermsDays: number | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  active: boolean;
}

interface CarrierPayoutData {
  id: string;
  carrierId: string;
  carrier: CarrierData;
  reference: string;
  receivedAt: string;
  amount: number;
  paymentMethod: string;
  status: string; // CONFIRMED, DRAFT, CANCELLED
  receiptUrl?: string | null;
  notes?: string | null;
  createdByName?: string | null;
  confirmedByName?: string | null;
  createdAt: string;
  allocations: Array<{
    id: string;
    orderId: string;
    allocatedAmount: number;
    carrierFeeDeducted: number;
    notes?: string | null;
    order?: {
      id: string;
      orderNumber: string;
      customerName: string;
      total: number;
      status: string;
    };
  }>;
  adjustments: Array<any>;
}

interface AuditLogData {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userName: string;
  details: string;
  createdAt: string;
}

interface EncaissementsClientProps {
  initialOrders: CalculatedOrderEncaissement[];
  initialPayouts: CarrierPayoutData[];
  initialCarriers: CarrierData[];
  initialAuditLogs: AuditLogData[];
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export default function EncaissementsClient({
  initialOrders,
  initialPayouts,
  initialCarriers,
  initialAuditLogs,
  currentUser,
}: EncaissementsClientProps) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'ORDERS_LEDGER' | 'PAYOUTS' | 'CARRIERS_VIEW' | 'CSV_IMPORT' | 'AUDIT_LOGS'>('ORDERS_LEDGER');

  // Core data states
  const [orders, setOrders] = useState<CalculatedOrderEncaissement[]>(initialOrders);
  const [payouts, setPayouts] = useState<CarrierPayoutData[]>(initialPayouts);
  const [carriers, setCarriers] = useState<CarrierData[]>(initialCarriers);
  const [auditLogs, setAuditLogs] = useState<AuditLogData[]>(initialAuditLogs);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters for Orders Ledger Tab
  const [dateRange, setDateRange] = useState<number>(0); // 0 = all time, 7, 30, 90
  const [carrierFilter, setCarrierFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [overdueOnly, setOverdueOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [pageSize, setPageSize] = useState<number>(25);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Modal: New Payout (Versement)
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState<boolean>(false);
  const [payoutCarrierId, setPayoutCarrierId] = useState<string>(initialCarriers[0]?.id || '');
  const [payoutReference, setPayoutReference] = useState<string>('');
  const [payoutDate, setPayoutDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [payoutAmount, setPayoutAmount] = useState<string>('');
  const [payoutPaymentMethod, setPayoutPaymentMethod] = useState<string>('BANK_TRANSFER');
  const [payoutStatus, setPayoutStatus] = useState<'CONFIRMED' | 'DRAFT'>('CONFIRMED');
  const [payoutReceiptUrl, setPayoutReceiptUrl] = useState<string>('');
  const [payoutNotes, setPayoutNotes] = useState<string>('');
  const [selectedOrderIdsForPayout, setSelectedOrderIdsForPayout] = useState<Record<string, number>>({});
  const [isSavingPayout, setIsSavingPayout] = useState<boolean>(false);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState<boolean>(false);
  const receiptFileInputRef = useRef<HTMLInputElement>(null);

  // Modal: Edit Order Encaissement Details
  const [editingOrder, setEditingOrder] = useState<CalculatedOrderEncaissement | null>(null);
  const [orderCarrierId, setOrderCarrierId] = useState<string>('');
  const [orderTrackingNumber, setOrderTrackingNumber] = useState<string>('');
  const [orderCodCollected, setOrderCodCollected] = useState<string>('');
  const [orderCarrierFee, setOrderCarrierFee] = useState<string>('');
  const [orderExpectedDate, setOrderExpectedDate] = useState<string>('');
  const [orderReconNotes, setOrderReconNotes] = useState<string>('');
  const [isSavingOrder, setIsSavingOrder] = useState<boolean>(false);

  // Modal: Payout Details
  const [viewingPayout, setViewingPayout] = useState<CarrierPayoutData | null>(null);

  // CSV Import State
  const [csvCarrierId, setCsvCarrierId] = useState<string>(initialCarriers[0]?.id || '');
  const [csvContent, setCsvContent] = useState<string>('');
  const [csvFileName, setCsvFileName] = useState<string>('');
  const [csvPreviewData, setCsvPreviewData] = useState<any | null>(null);
  const [isProcessingCsv, setIsProcessingCsv] = useState<boolean>(false);
  const [csvCommitRef, setCsvCommitRef] = useState<string>('');
  const [csvCommitMethod, setCsvCommitMethod] = useState<string>('BANK_TRANSFER');
  const csvFileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const copyToClipboard = (text: string, label: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedText(label);
      setTimeout(() => setCopiedText(null), 2000);
    }
  };

  // Reload data from server
  const refreshData = async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch(`/api/admin/encaissements?days=${dateRange}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        setPayouts(data.payouts || []);
        setCarriers(data.carriers || []);
        setAuditLogs(data.auditLogs || []);
        showToast('Données d\'encaissement actualisées en direct.');
      }
    } catch (err) {
      console.error('Failed to refresh encaissements:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Upload Payout Receipt
  const handleReceiptUpload = async (file: File) => {
    try {
      setIsUploadingReceipt(true);
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setPayoutReceiptUrl(data.url);
        showToast('Justificatif bancaire téléversé avec succès.');
      } else {
        alert(data.error || 'Erreur lors du téléversement du justificatif.');
      }
    } catch (err) {
      console.error('File upload error:', err);
      alert('Erreur réseau lors de l\'envoi du fichier.');
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  // Filtered Orders for Ledger Tab
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Date range filter
      if (dateRange > 0) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - dateRange);
        if (new Date(o.createdAt) < cutoff) return false;
      }

      // Carrier filter
      if (carrierFilter !== 'ALL' && o.carrierId !== carrierFilter) return false;

      // Status filter
      if (statusFilter !== 'ALL' && o.encaissementStatus !== statusFilter) return false;

      // Overdue filter
      if (overdueOnly && !o.isOverdue) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNum = o.orderNumber.toLowerCase().includes(q);
        const matchCust = o.customerName.toLowerCase().includes(q);
        const matchPhone = (o.customerPhone || '').toLowerCase().includes(q);
        const matchCity = (o.shippingCity || '').toLowerCase().includes(q);
        const matchTrack = (o.trackingNumber || '').toLowerCase().includes(q);
        const matchCarrier = (o.carrierName || '').toLowerCase().includes(q);
        if (!matchNum && !matchCust && !matchPhone && !matchCity && !matchTrack && !matchCarrier) return false;
      }

      return true;
    });
  }, [orders, dateRange, carrierFilter, statusFilter, overdueOnly, searchQuery]);

  // High-Precision Real KPIs (Zero Fictitious Numbers)
  const kpis = useMemo(() => {
    // 1. Solde Restant Dû par les Transporteurs (sur commandes livrées/traitées)
    const remainingDueOrders = orders.filter((o) => o.encaissementStatus !== 'CANCELLED_REFUSED' && o.remainingBalance > 0);
    const totalRemainingDue = remainingDueOrders.reduce((sum, o) => sum + o.remainingBalance, 0);

    // 2. Versements Confirmés Reçus en Banque
    const confirmedPayouts = payouts.filter((p) => {
      if (p.status !== 'CONFIRMED') return false;
      if (dateRange === 0) return true;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - dateRange);
      return new Date(p.receivedAt) >= cutoff;
    });
    const totalConfirmedReceived = confirmedPayouts.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    // 3. Montants Échus Non Réglés (Overdue)
    const overdueOrdersList = orders.filter((o) => o.isOverdue && o.remainingBalance > 0);
    const totalOverdueAmount = overdueOrdersList.reduce((sum, o) => sum + o.remainingBalance, 0);

    // 4. Dossiers à vérifier / Écarts
    const discrepancyOrders = orders.filter((o) => o.encaissementStatus === 'DISCREPANCY' || o.encaissementStatus === 'INCOMPLETE_DATA');

    // 5. Total Net Dû Historique
    const totalNetDueEver = orders
      .filter((o) => o.encaissementStatus !== 'CANCELLED_REFUSED')
      .reduce((sum, o) => sum + o.netDueToNay, 0);

    return {
      totalRemainingDue,
      remainingDueOrdersCount: remainingDueOrders.length,
      totalConfirmedReceived,
      confirmedPayoutsCount: confirmedPayouts.length,
      totalOverdueAmount,
      overdueOrdersCount: overdueOrdersList.length,
      discrepancyCount: discrepancyOrders.length,
      totalNetDueEver,
    };
  }, [orders, payouts, dateRange]);

  // Carrier Balances Summary
  const carrierSummaries = useMemo(() => {
    return carriers.map((c) => {
      const carrierOrders = orders.filter((o) => o.carrierId === c.id && o.encaissementStatus !== 'CANCELLED_REFUSED');
      const deliveredCount = carrierOrders.filter((o) => ['delivered', 'completed', 'livre'].includes(o.orderStatus.toLowerCase())).length;
      const grossCollected = carrierOrders.reduce((sum, o) => sum + (o.codCollectedAmount ?? o.grossAmount), 0);
      const feesTotal = carrierOrders.reduce((sum, o) => sum + (o.carrierFee ?? 0), 0);
      const netDue = carrierOrders.reduce((sum, o) => sum + o.netDueToNay, 0);
      const paidConfirmed = carrierOrders.reduce((sum, o) => sum + o.paidConfirmed, 0);
      const remainingBalance = carrierOrders.reduce((sum, o) => sum + Math.max(0, o.remainingBalance), 0);
      const overdueCount = carrierOrders.filter((o) => o.isOverdue && o.remainingBalance > 0).length;

      const carrierPayouts = payouts.filter((p) => p.carrierId === c.id && p.status === 'CONFIRMED');
      const totalPayoutsAmount = carrierPayouts.reduce((sum, p) => sum + p.amount, 0);

      return {
        ...c,
        deliveredCount,
        grossCollected,
        feesTotal,
        netDue,
        paidConfirmed,
        remainingBalance,
        overdueCount,
        payoutsCount: carrierPayouts.length,
        totalPayoutsAmount,
      };
    });
  }, [carriers, orders, payouts]);

  // Orders available for payout allocation (belonging to selected carrier with balance > 0)
  const availableOrdersForPayout = useMemo(() => {
    if (!payoutCarrierId) return [];
    return orders.filter(
      (o) =>
        (o.carrierId === payoutCarrierId || !o.carrierId) &&
        o.encaissementStatus !== 'CANCELLED_REFUSED' &&
        o.remainingBalance > 0
    );
  }, [orders, payoutCarrierId]);

  // Current allocated sum in New Payout Modal
  const currentAllocatedSumInModal = useMemo(() => {
    return Object.values(selectedOrderIdsForPayout).reduce((sum, val) => sum + (Number(val) || 0), 0);
  }, [selectedOrderIdsForPayout]);

  // Submit New Payout (Versement)
  const handleSavePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(payoutAmount);
    if (!payoutCarrierId || !payoutReference.trim() || isNaN(amountNum) || amountNum <= 0) {
      alert('Veuillez renseigner le transporteur, une référence unique et un montant positif.');
      return;
    }

    if (currentAllocatedSumInModal > amountNum) {
      alert(`Le montant affecté (${currentAllocatedSumInModal} MAD) dépasse le montant du versement (${amountNum} MAD).`);
      return;
    }

    try {
      setIsSavingPayout(true);
      const allocationsPayload = Object.entries(selectedOrderIdsForPayout)
        .filter(([_, amount]) => amount > 0)
        .map(([orderId, allocatedAmount]) => ({
          orderId,
          allocatedAmount,
          carrierFeeDeducted: 0,
        }));

      const res = await fetch('/api/admin/encaissements/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carrierId: payoutCarrierId,
          reference: payoutReference.trim(),
          receivedAt: payoutDate,
          amount: amountNum,
          paymentMethod: payoutPaymentMethod,
          status: payoutStatus,
          receiptUrl: payoutReceiptUrl || null,
          notes: payoutNotes || null,
          allocations: allocationsPayload,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`✅ Versement "${payoutReference}" de ${amountNum.toLocaleString('fr-FR')} MAD enregistré avec succès.`);
        setIsPayoutModalOpen(false);
        // Reset form
        setPayoutReference('');
        setPayoutAmount('');
        setPayoutNotes('');
        setPayoutReceiptUrl('');
        setSelectedOrderIdsForPayout({});
        refreshData();
      } else {
        alert(data.error || 'Erreur lors de l\'enregistrement du versement.');
      }
    } catch (err) {
      console.error('Save payout error:', err);
      alert('Erreur réseau lors de l\'enregistrement du versement.');
    } finally {
      setIsSavingPayout(false);
    }
  };

  // Open Edit Order Modal
  const openEditOrderModal = (order: CalculatedOrderEncaissement) => {
    setEditingOrder(order);
    setOrderCarrierId(order.carrierId || '');
    setOrderTrackingNumber(order.trackingNumber || '');
    setOrderCodCollected(order.codCollectedAmount !== null ? String(order.codCollectedAmount) : String(order.grossAmount));
    setOrderCarrierFee(order.carrierFee !== null ? String(order.carrierFee) : '35');
    setOrderExpectedDate(order.expectedPayoutDate ? order.expectedPayoutDate.split('T')[0] : '');
    setOrderReconNotes(order.reconciliationNotes || '');
  };

  // Save Edited Order Encaissement Details
  const handleSaveOrderEncaissement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    try {
      setIsSavingOrder(true);
      const res = await fetch(`/api/admin/encaissements/orders/${editingOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carrierId: orderCarrierId || null,
          trackingNumber: orderTrackingNumber.trim() || null,
          codCollectedAmount: orderCodCollected ? parseFloat(orderCodCollected) : null,
          carrierFee: orderCarrierFee ? parseFloat(orderCarrierFee) : null,
          expectedPayoutDate: orderExpectedDate || null,
          reconciliationNotes: orderReconNotes || null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`✅ Données d'encaissement de la commande #${editingOrder.orderNumber} mises à jour.`);
        setEditingOrder(null);
        refreshData();
      } else {
        alert(data.error || 'Erreur lors de la mise à jour de la commande.');
      }
    } catch (err) {
      console.error('Save order encaissement error:', err);
      alert('Erreur réseau.');
    } finally {
      setIsSavingOrder(false);
    }
  };

  // CSV File Handler (Preview Mode)
  const handleCsvFileSelected = (file: File) => {
    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (text) {
        setCsvContent(text);
        runCsvPreview(text, file.name);
      }
    };
    reader.readAsText(file);
  };

  const runCsvPreview = async (rawCsv: string, fName: string) => {
    try {
      setIsProcessingCsv(true);
      const res = await fetch('/api/admin/encaissements/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carrierId: csvCarrierId,
          csvContent: rawCsv,
          fileName: fName,
          mode: 'PREVIEW',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCsvPreviewData(data);
        const suggestedRef = `VIR-${carriers.find((c) => c.id === csvCarrierId)?.code || 'TRANS'}-${new Date().toISOString().split('T')[0]}`;
        setCsvCommitRef(suggestedRef);
        showToast(`Relevé CSV analysé : ${data.summary.matchedCount} correspondance(s) exacte(s) trouvée(s).`);
      } else {
        alert(data.error || 'Erreur lors de l\'analyse du relevé CSV.');
      }
    } catch (err) {
      console.error('CSV Preview error:', err);
      alert('Erreur lors du traitement du fichier.');
    } finally {
      setIsProcessingCsv(false);
    }
  };

  // Confirm and Commit CSV Import
  const handleCommitCsvImport = async () => {
    if (!csvPreviewData || !csvPreviewData.rows) return;
    if (!csvCommitRef.trim()) {
      alert('Veuillez saisir une référence de versement.');
      return;
    }

    const matchedRows = csvPreviewData.rows.filter((r: any) => r.status === 'MATCHED');
    if (matchedRows.length === 0) {
      alert('Aucune ligne rapprochée à enregistrer.');
      return;
    }

    try {
      setIsProcessingCsv(true);
      const res = await fetch('/api/admin/encaissements/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carrierId: csvCarrierId,
          fileName: csvFileName,
          mode: 'CONFIRM',
          payoutReference: csvCommitRef.trim(),
          paymentMethod: csvCommitMethod,
          matchedRowsToCommit: matchedRows,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Rapprochement CSV validé avec succès.');
        setCsvPreviewData(null);
        setCsvContent('');
        setCsvFileName('');
        setActiveTab('PAYOUTS');
        refreshData();
      } else {
        alert(data.error || 'Erreur lors de la validation du rapprochement.');
      }
    } catch (err) {
      console.error('Commit CSV error:', err);
      alert('Erreur réseau lors de la validation.');
    } finally {
      setIsProcessingCsv(false);
    }
  };

  // Export Filtered Orders to CSV
  const exportFilteredOrdersCsv = () => {
    const csvRows = [
      [
        'REFERENCE COMMANDE',
        'CLIENT',
        'TELEPHONE',
        'VILLE',
        'STATUT COMMANDE',
        'TRANSPORTEUR',
        'NUMERO DE SUIVI',
        'DATE COMMANDE',
        'DATE LIVRAISON',
        'MONTANT COMMANDE TTC (MAD)',
        'ENCAISSE LIVREUR (MAD)',
        'FRAIS TRANSPORTEUR (MAD)',
        'NET DU A NAY (MAD)',
        'DEJA REVERSE (MAD)',
        'SOLDE RESTANT (MAD)',
        'ECHEANCE',
        'RETARD',
        'STATUT RAPPROCHEMENT',
      ],
      ...filteredOrders.map((o) => [
        o.orderNumber,
        `"${o.customerName}"`,
        `"${o.customerPhone || ''}"`,
        `"${o.shippingCity}"`,
        o.orderStatus,
        `"${o.carrierName}"`,
        `"${o.trackingNumber || ''}"`,
        o.createdAt.split('T')[0],
        o.deliveredAt ? o.deliveredAt.split('T')[0] : '',
        o.grossAmount.toFixed(2),
        o.codCollectedAmount !== null ? o.codCollectedAmount.toFixed(2) : '',
        o.carrierFee !== null ? o.carrierFee.toFixed(2) : '',
        o.netDueToNay.toFixed(2),
        o.paidConfirmed.toFixed(2),
        o.remainingBalance.toFixed(2),
        o.expectedPayoutDate ? o.expectedPayoutDate.split('T')[0] : '',
        o.isOverdue ? 'OUI' : 'NON',
        o.encaissementStatus,
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + csvRows.map((e) => e.join(';')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `encaissements-nay-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom-5 border border-neutral-700">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-sky-50 text-sky-800 border border-sky-200">
              Contrôle de Trésorerie & Transporteurs COD
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              Double Propriétaire : {currentUser.name}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 flex items-center gap-2">
            <Receipt size={24} className="text-sky-600" />
            <span>Suivi des Encaissements & Reversements</span>
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Suivez les créances dues par les transporteurs (Amana, Cathedis...), rapprochez les versements reçus et contrôlez chaque Dirham encaissé à la livraison.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={refreshData}
            disabled={isRefreshing}
            className="p-2.5 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 rounded-xl shadow-2xs transition-all cursor-pointer"
            title="Actualiser les données"
          >
            <RefreshCw size={15} className={isRefreshing ? 'animate-spin text-sky-600' : ''} />
          </button>

          <button
            type="button"
            onClick={exportFilteredOrdersCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <Download size={14} className="text-neutral-500" />
            <span>Exporter CSV</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('CSV_IMPORT');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-sky-50 text-sky-700 border border-sky-200 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <UploadCloud size={14} className="text-sky-600" />
            <span>Importer Relevé CSV</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setPayoutCarrierId(carriers[0]?.id || '');
              setPayoutReference(`VIR-${carriers[0]?.code || 'TRANS'}-${new Date().toISOString().split('T')[0]}`);
              setPayoutAmount('');
              setSelectedOrderIdsForPayout({});
              setIsPayoutModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer"
          >
            <Plus size={15} />
            <span>Enregistrer un Versement</span>
          </button>
        </div>
      </div>

      {/* Top 4 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Solde Restant Dû par les Transporteurs */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Solde Restant à Recevoir</span>
            <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700 mt-2 font-mono">
            {formatMAD(kpis.totalRemainingDue)}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-500 pt-2 border-t border-neutral-100">
            <span>Créance sur <strong>{kpis.remainingDueOrdersCount}</strong> colis livrés</span>
            <span className="text-amber-800 font-semibold">En attente versement</span>
          </div>
        </div>

        {/* Card 2: Versements Confirmés Reçus en Banque */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Versements Reçus en Banque</span>
            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2 font-mono">
            {formatMAD(kpis.totalConfirmedReceived)}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-500 pt-2 border-t border-neutral-100">
            <span><strong>{kpis.confirmedPayoutsCount}</strong> bordereaux confirmés</span>
            <span className="text-emerald-700 font-semibold">Encaissé à 100%</span>
          </div>
        </div>

        {/* Card 3: Montants Échus Non Réglés (Retards) */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Montants Échus Non Réglés</span>
            <div className={`p-2 rounded-xl border ${kpis.totalOverdueAmount > 0 ? 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse' : 'bg-neutral-50 border-neutral-200 text-neutral-400'}`}>
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className={`text-2xl font-black mt-2 font-mono ${kpis.totalOverdueAmount > 0 ? 'text-rose-600' : 'text-neutral-900'}`}>
            {formatMAD(kpis.totalOverdueAmount)}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-500 pt-2 border-t border-neutral-100">
            <span><strong>{kpis.overdueOrdersCount}</strong> commandes en retard</span>
            <span className={`font-semibold ${kpis.totalOverdueAmount > 0 ? 'text-rose-600' : 'text-neutral-400'}`}>
              {kpis.totalOverdueAmount > 0 ? 'Relance requise' : 'Aucun retard'}
            </span>
          </div>
        </div>

        {/* Card 4: Dossiers à Vérifier / Écarts */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Dossiers à Vérifier</span>
            <div className={`p-2 rounded-xl border ${kpis.discrepancyCount > 0 ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-neutral-50 border-neutral-200 text-neutral-400'}`}>
              <AlertCircle size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-neutral-900 mt-2 font-mono">
            {kpis.discrepancyCount}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-500 pt-2 border-t border-neutral-100">
            <span>Écarts ou données partielles</span>
            <span className={kpis.discrepancyCount > 0 ? 'text-amber-700 font-semibold' : 'text-emerald-700 font-semibold'}>
              {kpis.discrepancyCount > 0 ? 'À contrôler' : 'Tout est conforme'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 border-b border-neutral-200 pb-2 overflow-x-auto text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('ORDERS_LEDGER')}
          className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'ORDERS_LEDGER'
              ? 'bg-neutral-900 text-white shadow-2xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <Receipt size={15} />
          <span>Créances & Commandes ({orders.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PAYOUTS')}
          className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'PAYOUTS'
              ? 'bg-neutral-900 text-white shadow-2xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <Building size={15} />
          <span>Versements & Bordereaux ({payouts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('CARRIERS_VIEW')}
          className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'CARRIERS_VIEW'
              ? 'bg-neutral-900 text-white shadow-2xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <Truck size={15} />
          <span>Vue par Transporteur ({carriers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('CSV_IMPORT')}
          className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'CSV_IMPORT'
              ? 'bg-sky-600 text-white shadow-2xs'
              : 'text-sky-700 hover:bg-sky-50'
          }`}
        >
          <UploadCloud size={15} />
          <span>Rapprochement CSV</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('AUDIT_LOGS')}
          className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'AUDIT_LOGS'
              ? 'bg-neutral-900 text-white shadow-2xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <History size={15} />
          <span>Journal d'Audit ({auditLogs.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ORDERS LEDGER (Tableau Principal des Créances & Commandes) */}
      {/* ========================================================================= */}
      {activeTab === 'ORDERS_LEDGER' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              {/* Search Bar */}
              <div className="relative min-w-[240px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher commande, client, tracking..."
                  className="w-full pl-9 pr-8 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Carrier Filter */}
              <select
                value={carrierFilter}
                onChange={(e) => setCarrierFilter(e.target.value)}
                className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl font-medium text-neutral-700"
              >
                <option value="ALL">Tous les Transporteurs</option>
                {carriers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Encaissement Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl font-medium text-neutral-700"
              >
                <option value="ALL">Tous les Statuts</option>
                <option value="AWAITING_PAYOUT">🟡 À recevoir (En attente versement)</option>
                <option value="PARTIALLY_PAID">🟠 Partiellement reçu</option>
                <option value="SETTLED">🟢 Soldé (Reçu à 100%)</option>
                <option value="PENDING_DELIVERY">⚪ Non encore livrée</option>
                <option value="DISCREPANCY">🔴 Écart / Anomalie</option>
                <option value="CANCELLED_REFUSED">⛔ Refusée / Retour</option>
              </select>

              {/* Overdue Only Toggle */}
              <button
                type="button"
                onClick={() => setOverdueOnly(!overdueOnly)}
                className={`px-3 py-2 rounded-xl font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  overdueOnly
                    ? 'bg-rose-50 text-rose-700 border-rose-300'
                    : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                }`}
              >
                <AlertTriangle size={13} className={overdueOnly ? 'text-rose-600' : 'text-neutral-400'} />
                <span>En retard uniquement ({kpis.overdueOrdersCount})</span>
              </button>
            </div>

            {/* Date Range Selector */}
            <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl">
              {[
                { label: 'Tout', val: 0 },
                { label: '7J', val: 7 },
                { label: '30J', val: 30 },
                { label: '90J', val: 90 },
              ].map((t) => (
                <button
                  key={t.val}
                  type="button"
                  onClick={() => setDateRange(t.val)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    dateRange === t.val ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main Table */}
          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-neutral-50 z-10 shadow-2xs border-b border-neutral-200">
                  <tr className="text-[11px] font-bold text-neutral-600 uppercase tracking-wider">
                    <th className="py-3 px-3.5">Commande</th>
                    <th className="py-3 px-3">Client & Ville</th>
                    <th className="py-3 px-3">Transporteur & Suivi</th>
                    <th className="py-3 px-3">Statut Livraison</th>
                    <th className="py-3 px-3 text-right">Montant TTC</th>
                    <th className="py-3 px-3 text-right">Encaissé</th>
                    <th className="py-3 px-3 text-right">Frais</th>
                    <th className="py-3 px-3 text-right">Net Dû NAY</th>
                    <th className="py-3 px-3 text-right">Déjà Reversé</th>
                    <th className="py-3 px-3 text-right">Solde Dû</th>
                    <th className="py-3 px-3">Échéance</th>
                    <th className="py-3 px-3 text-center">Rapprochement</th>
                    <th className="py-3 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-neutral-700">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="text-center py-12 text-neutral-400">
                        <Receipt size={32} className="mx-auto mb-2 opacity-40 text-neutral-400" />
                        <p className="font-semibold text-neutral-600">Aucune commande trouvée</p>
                        <p className="text-xs text-neutral-400 mt-0.5">Ajustez vos filtres ou effectuez une autre recherche.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.slice(0, pageSize).map((o) => {
                      const isSettled = o.encaissementStatus === 'SETTLED';
                      const isAwaiting = o.encaissementStatus === 'AWAITING_PAYOUT';
                      const isPartial = o.encaissementStatus === 'PARTIALLY_PAID';
                      const isDiscrepancy = o.encaissementStatus === 'DISCREPANCY';
                      const isCancelled = o.encaissementStatus === 'CANCELLED_REFUSED';

                      return (
                        <tr key={o.id} className={`hover:bg-neutral-50/80 transition-colors ${o.isOverdue ? 'bg-rose-50/20' : ''}`}>
                          {/* Commande */}
                          <td className="py-3 px-3.5">
                            <div className="font-bold text-neutral-900 font-mono text-xs">
                              #{o.orderNumber}
                            </div>
                            <span className="text-[10px] text-neutral-400 block">
                              {o.createdAt.split('T')[0]}
                            </span>
                          </td>

                          {/* Client & Ville */}
                          <td className="py-3 px-3">
                            <div className="font-semibold text-neutral-900 truncate max-w-[130px]" title={o.customerName}>
                              {o.customerName}
                            </div>
                            <span className="text-[10px] text-neutral-500 block truncate max-w-[130px]">
                              {o.shippingCity}
                            </span>
                          </td>

                          {/* Transporteur & Suivi */}
                          <td className="py-3 px-3">
                            <span className="font-semibold text-neutral-800 text-[11px] block">
                              {o.carrierName}
                            </span>
                            {o.trackingNumber ? (
                              <div className="flex items-center gap-1 font-mono text-[10px] text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded w-fit mt-0.5">
                                <span>{o.trackingNumber}</span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(o.trackingNumber!, `track-${o.id}`)}
                                  className="hover:text-sky-900 cursor-pointer"
                                  title="Copier le numéro de suivi"
                                >
                                  {copiedText === `track-${o.id}` ? <Check size={10} className="text-emerald-600" /> : <Copy size={10} />}
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-neutral-400 italic">Non renseigné</span>
                            )}
                          </td>

                          {/* Statut Livraison */}
                          <td className="py-3 px-3">
                            {['delivered', 'completed', 'livre'].includes(o.orderStatus.toLowerCase()) ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Livrée & Encaissée
                              </span>
                            ) : ['shipped', 'expedie', 'in_transit'].includes(o.orderStatus.toLowerCase()) ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                                En acheminement
                              </span>
                            ) : ['returned', 'refused', 'cancelled', 'annule'].includes(o.orderStatus.toLowerCase()) ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                {o.orderStatus}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-100 text-neutral-600">
                                {o.orderStatus}
                              </span>
                            )}
                          </td>

                          {/* Montant TTC Commande */}
                          <td className="py-3 px-3 text-right font-mono font-bold text-neutral-900">
                            {formatMAD(o.grossAmount)}
                          </td>

                          {/* Encaissé par livreur */}
                          <td className="py-3 px-3 text-right font-mono text-neutral-700">
                            {o.codCollectedAmount !== null ? (
                              <span className="font-semibold">{formatMAD(o.codCollectedAmount)}</span>
                            ) : (
                              <span className="text-neutral-400 italic text-[11px]">—</span>
                            )}
                          </td>

                          {/* Frais transporteur */}
                          <td className="py-3 px-3 text-right font-mono text-rose-700">
                            {o.carrierFee !== null ? (
                              <span>-{formatMAD(o.carrierFee)}</span>
                            ) : (
                              <span className="text-neutral-400 italic text-[11px]">—</span>
                            )}
                          </td>

                          {/* Net Dû à NAY */}
                          <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800">
                            {formatMAD(o.netDueToNay)}
                          </td>

                          {/* Déjà Reversé */}
                          <td className="py-3 px-3 text-right font-mono font-semibold text-sky-700">
                            {o.paidConfirmed > 0 ? (
                              <span>{formatMAD(o.paidConfirmed)}</span>
                            ) : (
                              <span className="text-neutral-400">0 MAD</span>
                            )}
                          </td>

                          {/* Solde Restant Dû */}
                          <td className="py-3 px-3 text-right font-mono font-black">
                            {isSettled ? (
                              <span className="text-emerald-600 font-normal text-[11px]">Soldé (0 DH)</span>
                            ) : isCancelled ? (
                              <span className="text-neutral-400 font-normal text-[11px]">0 DH</span>
                            ) : (
                              <span className="text-amber-700">{formatMAD(o.remainingBalance)}</span>
                            )}
                          </td>

                          {/* Échéance */}
                          <td className="py-3 px-3">
                            {o.expectedPayoutDate ? (
                              <div>
                                <span className={`text-[11px] font-mono block ${o.isOverdue ? 'text-rose-600 font-bold' : 'text-neutral-600'}`}>
                                  {o.expectedPayoutDate.split('T')[0]}
                                </span>
                                {o.isOverdue && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-100 text-rose-800 uppercase tracking-wider">
                                    En Retard
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] text-neutral-400 italic">À renseigner</span>
                            )}
                          </td>

                          {/* Statut Rapprochement */}
                          <td className="py-3 px-3 text-center">
                            {isSettled ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 w-fit mx-auto shadow-2xs">
                                <CheckCircle2 size={11} className="text-emerald-600" />
                                <span>Soldé</span>
                              </span>
                            ) : isPartial ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1 w-fit mx-auto shadow-2xs">
                                <Clock size={11} className="text-amber-600" />
                                <span>Partiel</span>
                              </span>
                            ) : isAwaiting ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1 w-fit mx-auto">
                                <Clock size={11} className="text-amber-600" />
                                <span>À Recevoir</span>
                              </span>
                            ) : isDiscrepancy ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-1 w-fit mx-auto">
                                <AlertTriangle size={11} className="text-rose-600" />
                                <span>Écart</span>
                              </span>
                            ) : isCancelled ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-neutral-100 text-neutral-500 border border-neutral-200">
                                Sans créance
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-neutral-100 text-neutral-600 border border-neutral-200">
                                En cours
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => openEditOrderModal(o)}
                                className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                                title="Modifier les données transporteur / encaissement"
                              >
                                <Edit3 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filteredOrders.length > pageSize && (
              <div className="p-3 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-500">
                <span>Affichage de {Math.min(pageSize, filteredOrders.length)} sur {filteredOrders.length} commandes filtrées</span>
                <button
                  type="button"
                  onClick={() => setPageSize((prev) => prev + 50)}
                  className="px-3 py-1 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-lg font-semibold text-neutral-800 transition-colors cursor-pointer"
                >
                  Afficher +50 commandes
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PAYOUTS (Versements & Bordereaux Reçus) */}
      {/* ========================================================================= */}
      {activeTab === 'PAYOUTS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">
                Historique des Versements Reçus des Transporteurs
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Chaque versement bancaire ou cash est enregistré, rapproché et ventilé sur les commandes correspondantes.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setPayoutCarrierId(carriers[0]?.id || '');
                setPayoutReference(`VIR-${carriers[0]?.code || 'TRANS'}-${new Date().toISOString().split('T')[0]}`);
                setPayoutAmount('');
                setSelectedOrderIdsForPayout({});
                setIsPayoutModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer"
            >
              <Plus size={15} />
              <span>+ Enregistrer un Versement</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {payouts.length === 0 ? (
              <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-neutral-200">
                <Building size={36} className="mx-auto text-neutral-300 mb-2" />
                <h4 className="font-bold text-neutral-700 text-sm">Aucun versement enregistré</h4>
                <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto">
                  Enregistrez un premier versement reçu d'Amana ou Cathedis pour ventiler les règlements sur vos commandes.
                </p>
                <button
                  type="button"
                  onClick={() => setIsPayoutModalOpen(true)}
                  className="mt-4 px-4 py-2 bg-neutral-900 hover:bg-black text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Enregistrer un premier versement
                </button>
              </div>
            ) : (
              payouts.map((p) => {
                const totalAllocated = p.allocations.reduce((sum, al) => sum + al.allocatedAmount, 0);
                const unallocatedBalance = Math.max(0, p.amount - totalAllocated);
                const isFullyAllocated = unallocatedBalance <= 0;

                return (
                  <div key={p.id} className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs space-y-4 hover:border-neutral-300 transition-all">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-sky-50 text-sky-800 border border-sky-200">
                          {p.carrier?.name || 'Transporteur'}
                        </span>
                        <h4 className="font-bold text-neutral-900 font-mono text-sm mt-1.5">
                          {p.reference}
                        </h4>
                        <span className="text-[11px] text-neutral-400 block mt-0.5">
                          Reçu le {p.receivedAt.split('T')[0]} • {p.paymentMethod === 'BANK_TRANSFER' ? 'Virement Bancaire' : p.paymentMethod}
                        </span>
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-black text-emerald-700 font-mono">
                          {formatMAD(p.amount)}
                        </div>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mt-1 ${
                          p.status === 'CONFIRMED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {p.status === 'CONFIRMED' ? 'Confirmé en banque' : 'Brouillon'}
                        </span>
                      </div>
                    </div>

                    {/* Allocation Progress */}
                    <div className="space-y-1.5 pt-2 border-t border-neutral-100 text-xs">
                      <div className="flex justify-between text-[11px] text-neutral-500">
                        <span>Ventilé sur <strong>{p.allocations.length} commandes</strong></span>
                        <span className="font-mono font-semibold text-neutral-800">
                          {formatMAD(totalAllocated)} / {formatMAD(p.amount)}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${isFullyAllocated ? 'bg-emerald-500' : 'bg-sky-500'}`}
                          style={{ width: `${Math.min(100, (totalAllocated / (p.amount || 1)) * 100)}%` }}
                        />
                      </div>
                      {unallocatedBalance > 0 && (
                        <span className="text-[10px] text-amber-700 font-semibold block">
                          Reste à affecter : {formatMAD(unallocatedBalance)}
                        </span>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                      {p.receiptUrl ? (
                        <a
                          href={p.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 hover:text-sky-800"
                        >
                          <FileText size={12} />
                          <span>Voir Justificatif</span>
                        </a>
                      ) : (
                        <span className="text-[10px] text-neutral-400 italic">Sans justificatif</span>
                      )}

                      <button
                        type="button"
                        onClick={() => setViewingPayout(p)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-neutral-900 hover:text-sky-600 cursor-pointer"
                      >
                        <span>Fiche détaillée</span>
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CARRIERS VIEW (Vue Synthétique par Transporteur) */}
      {/* ========================================================================= */}
      {activeTab === 'CARRIERS_VIEW' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
            <h3 className="text-sm font-bold text-neutral-900">
              Synthèse & Soldes par Partenaire Logistique
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Consultez pour chaque transporteur le total des créances en cours, les commissions déduites et l'historique des reversements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {carrierSummaries.map((c) => (
              <div key={c.id} className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-2xs space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700 font-bold">
                      <Truck size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-neutral-900 text-sm">{c.name}</h4>
                      <span className="text-[10px] text-neutral-400 block font-mono">Code: {c.code} • Délai reversement: ~{c.payoutTermsDays}j</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5 pt-3 border-t border-neutral-100 text-xs">
                  <div className="flex justify-between text-neutral-600">
                    <span>Colis Livrés :</span>
                    <strong className="text-neutral-900">{c.deliveredCount} colis</strong>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Brut Encaissé par le Livreur :</span>
                    <span className="font-mono font-semibold text-neutral-900">{formatMAD(c.grossCollected)}</span>
                  </div>
                  <div className="flex justify-between text-rose-600">
                    <span>- Frais de Port Déduits :</span>
                    <span className="font-mono">-{formatMAD(c.feesTotal)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-800 font-bold pt-1 border-t border-neutral-100">
                    <span>Net Dû à NAY :</span>
                    <span className="font-mono">{formatMAD(c.netDue)}</span>
                  </div>
                  <div className="flex justify-between text-sky-700 font-semibold">
                    <span>Versements Reçus :</span>
                    <span className="font-mono">{formatMAD(c.paidConfirmed)}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-amber-800 font-medium block">Solde Restant Dû</span>
                    <span className="text-lg font-black text-amber-900 font-mono mt-0.5 block">
                      {formatMAD(c.remainingBalance)}
                    </span>
                  </div>
                  {c.overdueCount > 0 && (
                    <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                      {c.overdueCount} en retard
                    </span>
                  )}
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCarrierFilter(c.id);
                      setActiveTab('ORDERS_LEDGER');
                    }}
                    className="flex-1 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-semibold text-center cursor-pointer transition-colors"
                  >
                    Voir les commandes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPayoutCarrierId(c.id);
                      setPayoutReference(`VIR-${c.code}-${new Date().toISOString().split('T')[0]}`);
                      setPayoutAmount(c.remainingBalance > 0 ? String(c.remainingBalance) : '');
                      setSelectedOrderIdsForPayout({});
                      setIsPayoutModalOpen(true);
                    }}
                    className="flex-1 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold text-center cursor-pointer transition-colors"
                  >
                    Nouveau versement
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CSV IMPORT (Import & Rapprochement Automatique Relevé Transporteur) */}
      {/* ========================================================================= */}
      {activeTab === 'CSV_IMPORT' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-2xs max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-sky-100 border border-sky-300 flex items-center justify-center text-sky-700 shadow-2xs">
                <UploadCloud size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-900">
                  Importation & Rapprochement Automatique de Relevé Transporteur
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Importez le fichier CSV/Excel exporté d'Amana ou Cathedis pour vérifier et valider les versements en 1 clic.
                </p>
              </div>
            </div>

            {/* Step 1: Select Carrier & File */}
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                  1. Sélectionner le Transporteur
                </label>
                <select
                  value={csvCarrierId}
                  onChange={(e) => setCsvCarrierId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-800"
                >
                  {carriers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                  2. Fichier Relevé CSV
                </label>
                <input
                  type="file"
                  ref={csvFileInputRef}
                  accept=".csv,text/csv"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleCsvFileSelected(f);
                  }}
                  className="hidden"
                />

                <div
                  onClick={() => csvFileInputRef.current?.click()}
                  className="border-2 border-dashed border-sky-200 hover:border-sky-400 bg-sky-50/40 hover:bg-sky-50/80 rounded-2xl p-8 text-center cursor-pointer transition-all"
                >
                  <UploadCloud size={32} className="mx-auto text-sky-600 mb-2" />
                  <span className="text-xs font-bold text-neutral-900 block">
                    {csvFileName || 'Cliquez ici pour sélectionner votre fichier CSV'}
                  </span>
                  <span className="text-[11px] text-neutral-500 mt-1 block">
                    Formats acceptés : séparateurs virgule ou point-virgule, colonnes suivi/commande/montant
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Table & Confirmation */}
          {csvPreviewData && (
            <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-2xs space-y-5 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">
                    Résultat de l'Analyse du Relevé : {csvFileName}
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {csvPreviewData.summary.matchedCount} commandes rapprochées avec certitude sur {csvPreviewData.summary.totalRows} lignes.
                  </p>
                </div>

                {/* Summary Badges */}
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-lg font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    ✅ {csvPreviewData.summary.matchedCount} Rapprochées
                  </span>
                  {csvPreviewData.summary.discrepancyCount > 0 && (
                    <span className="px-2.5 py-1 rounded-lg font-bold bg-rose-50 text-rose-800 border border-rose-200">
                      ⚠️ {csvPreviewData.summary.discrepancyCount} Écarts
                    </span>
                  )}
                  {csvPreviewData.summary.alreadySettledCount > 0 && (
                    <span className="px-2.5 py-1 rounded-lg font-bold bg-neutral-100 text-neutral-700">
                      ℹ️ {csvPreviewData.summary.alreadySettledCount} Déjà soldées
                    </span>
                  )}
                  {csvPreviewData.summary.unmatchedCount > 0 && (
                    <span className="px-2.5 py-1 rounded-lg font-bold bg-neutral-100 text-neutral-500">
                      ❓ {csvPreviewData.summary.unmatchedCount} Non trouvées
                    </span>
                  )}
                </div>
              </div>

              {/* Commit Payout Info */}
              <div className="bg-sky-50/80 p-4 rounded-2xl border border-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-sky-950 uppercase tracking-wider block">
                    Validation du Versement Bancaire
                  </span>
                  <p className="text-xs text-sky-800">
                    Un versement sera créé et ventilé sur les {csvPreviewData.summary.matchedCount} commandes valides.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={csvCommitRef}
                    onChange={(e) => setCsvCommitRef(e.target.value)}
                    placeholder="Réf: VIR-AMANA-2026-09"
                    className="px-3 py-2 text-xs font-bold bg-white border border-sky-300 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                  />

                  <button
                    type="button"
                    disabled={isProcessingCsv || csvPreviewData.summary.matchedCount === 0}
                    onClick={handleCommitCsvImport}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isProcessingCsv ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    <span>Valider & Enregistrer le Versement</span>
                  </button>
                </div>
              </div>

              {/* Rows Table */}
              <div className="overflow-x-auto max-h-96 border border-neutral-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-neutral-50 z-10 border-b border-neutral-200">
                    <tr className="text-[11px] font-bold text-neutral-600 uppercase">
                      <th className="py-2.5 px-3">Ligne</th>
                      <th className="py-2.5 px-3">Numéro de Suivi</th>
                      <th className="py-2.5 px-3">Commande NAY</th>
                      <th className="py-2.5 px-3">Client</th>
                      <th className="py-2.5 px-3 text-right">Montant Relevé</th>
                      <th className="py-2.5 px-3 text-right">Frais</th>
                      <th className="py-2.5 px-3 text-right">Net à Reverser</th>
                      <th className="py-2.5 px-3 text-center">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-neutral-700">
                    {csvPreviewData.rows.map((r: any) => (
                      <tr key={r.rowIndex} className="hover:bg-neutral-50">
                        <td className="py-2.5 px-3 font-mono text-neutral-400">{r.rowIndex}</td>
                        <td className="py-2.5 px-3 font-mono font-semibold">{r.trackingNumber}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-neutral-900">
                          {r.orderNumber !== 'Inconnu' ? `#${r.orderNumber}` : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-neutral-600">{r.customerName}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-neutral-900">
                          {formatMAD(r.statementAmount)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-rose-700">
                          -{formatMAD(r.carrierFee)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800">
                          {formatMAD(r.netToPay)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {r.status === 'MATCHED' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ✅ Correspondance
                            </span>
                          ) : r.status === 'ALREADY_SETTLED' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-100 text-neutral-600">
                              Déjà soldée
                            </span>
                          ) : r.status === 'DISCREPANCY' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200" title={r.discrepancyReason}>
                              ⚠️ Écart
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-100 text-neutral-400">
                              Non trouvée
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: AUDIT LOGS (Journal d'Audit & Traçabilité Double Propriétaire) */}
      {/* ========================================================================= */}
      {activeTab === 'AUDIT_LOGS' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
            <h3 className="text-sm font-bold text-neutral-900">
              Journal d'Audit & Traçabilité des Encaissements
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Chaque versement, affectation, importation ou modification effectuée par les propriétaires est tracée avec date et auteur.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-2xs">
            <div className="divide-y divide-neutral-100">
              {auditLogs.length === 0 ? (
                <div className="p-8 text-center text-neutral-400 text-xs">
                  Aucun événement d'audit récent.
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="p-4 hover:bg-neutral-50 flex items-start justify-between gap-4 text-xs">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-700 shrink-0 font-bold mt-0.5">
                        <History size={15} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-neutral-900">{log.userName}</span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-600">
                            {log.action}
                          </span>
                        </div>
                        <p className="text-neutral-600 mt-1 leading-relaxed">
                          {log.details}
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] text-neutral-400 font-mono shrink-0">
                      {new Date(log.createdAt).toLocaleString('fr-FR')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ENREGISTRER UN VERSEMENT (Carrier Payout) */}
      {/* ========================================================================= */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-neutral-200 animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800">
                  <Building size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900">
                    Enregistrer un Versement de Transporteur
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Bordereau de reversement reçu d'Amana, Cathedis ou remise d'espèces
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPayoutModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-xl cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSavePayout} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Transporteur *
                  </label>
                  <select
                    value={payoutCarrierId}
                    onChange={(e) => {
                      setPayoutCarrierId(e.target.value);
                      const c = carriers.find((x) => x.id === e.target.value);
                      if (c) {
                        setPayoutReference(`VIR-${c.code}-${new Date().toISOString().split('T')[0]}`);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl font-semibold"
                  >
                    {carriers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Référence Bordereau / Virement *
                  </label>
                  <input
                    type="text"
                    required
                    value={payoutReference}
                    onChange={(e) => setPayoutReference(e.target.value)}
                    placeholder="Ex: VIR-AMANA-2026-09"
                    className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Date de Réception en Banque *
                  </label>
                  <input
                    type="date"
                    required
                    value={payoutDate}
                    onChange={(e) => setPayoutDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Montant Reçu en Banque (MAD) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    placeholder="Ex: 5420.00"
                    className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-xl font-mono font-bold text-sm text-emerald-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Mode de Règlement
                  </label>
                  <select
                    value={payoutPaymentMethod}
                    onChange={(e) => setPayoutPaymentMethod(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl font-semibold"
                  >
                    <option value="BANK_TRANSFER">Virement Bancaire (Compte NAY)</option>
                    <option value="CASH">Remise d'Espèces / Cash</option>
                    <option value="CHECK">Chèque Bancaire</option>
                    <option value="OTHER">Autre mode</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Statut du Versement
                  </label>
                  <div className="flex gap-2 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="payoutStatus"
                        checked={payoutStatus === 'CONFIRMED'}
                        onChange={() => setPayoutStatus('CONFIRMED')}
                        className="accent-emerald-600"
                      />
                      <span className="font-bold text-emerald-800">Confirmé (Reçu en banque)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer ml-3">
                      <input
                        type="radio"
                        name="payoutStatus"
                        checked={payoutStatus === 'DRAFT'}
                        onChange={() => setPayoutStatus('DRAFT')}
                        className="accent-amber-600"
                      />
                      <span className="font-semibold text-neutral-600">Brouillon</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Justificatif Upload */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2">
                <label className="block font-bold text-neutral-800">
                  Justificatif Bancaire / Avis d'Opéré (Facultatif)
                </label>
                <input
                  type="file"
                  ref={receiptFileInputRef}
                  accept="image/*,application/pdf"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleReceiptUpload(f);
                  }}
                  className="hidden"
                />

                {payoutReceiptUrl ? (
                  <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-neutral-200">
                    <span className="font-mono text-[11px] truncate max-w-xs">{payoutReceiptUrl}</span>
                    <button
                      type="button"
                      onClick={() => setPayoutReceiptUrl('')}
                      className="text-rose-600 font-bold text-xs"
                    >
                      Supprimer
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => receiptFileInputRef.current?.click()}
                    disabled={isUploadingReceipt}
                    className="w-full py-2 bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200 rounded-xl font-semibold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <UploadCloud size={14} />
                    <span>{isUploadingReceipt ? 'Téléversement...' : 'Téléverser un justificatif (PDF ou Photo)'}</span>
                  </button>
                )}
              </div>

              {/* Multi-Order Allocation Selector */}
              <div className="space-y-2 pt-2 border-t border-neutral-100">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-neutral-800 uppercase tracking-wider text-[11px]">
                    Ventilation sur les Commandes en Attente ({availableOrdersForPayout.length})
                  </label>
                  <span className={`font-mono font-bold text-xs ${currentAllocatedSumInModal > (parseFloat(payoutAmount) || 0) ? 'text-rose-600' : 'text-emerald-700'}`}>
                    Affecté : {formatMAD(currentAllocatedSumInModal)} / {formatMAD(parseFloat(payoutAmount) || 0)}
                  </span>
                </div>

                <div className="max-h-48 overflow-y-auto border border-neutral-200 rounded-2xl divide-y divide-neutral-100">
                  {availableOrdersForPayout.length === 0 ? (
                    <div className="p-4 text-center text-neutral-400">
                      Aucune commande livrée avec solde restant pour ce transporteur.
                    </div>
                  ) : (
                    availableOrdersForPayout.map((o) => {
                      const isSelected = selectedOrderIdsForPayout[o.id] !== undefined;
                      const allocatedVal = selectedOrderIdsForPayout[o.id] || 0;

                      return (
                        <div key={o.id} className="p-2.5 flex items-center justify-between hover:bg-neutral-50 gap-2">
                          <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                const newMap = { ...selectedOrderIdsForPayout };
                                if (e.target.checked) {
                                  newMap[o.id] = o.remainingBalance;
                                } else {
                                  delete newMap[o.id];
                                }
                                setSelectedOrderIdsForPayout(newMap);
                              }}
                              className="accent-sky-600 rounded"
                            />
                            <div className="min-w-0">
                              <span className="font-mono font-bold text-neutral-900 block">#{o.orderNumber}</span>
                              <span className="text-[10px] text-neutral-400 block truncate">{o.customerName} • {o.shippingCity}</span>
                            </div>
                          </label>

                          <div className="text-right shrink-0">
                            <span className="text-[10px] text-neutral-400 block">Dû : {formatMAD(o.remainingBalance)}</span>
                            {isSelected && (
                              <input
                                type="number"
                                step="0.01"
                                max={o.remainingBalance}
                                value={allocatedVal}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setSelectedOrderIdsForPayout({
                                    ...selectedOrderIdsForPayout,
                                    [o.id]: val,
                                  });
                                }}
                                className="w-24 px-2 py-1 text-right font-mono font-bold border border-sky-300 rounded-lg text-xs bg-sky-50 focus:bg-white"
                              />
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Note Interne</label>
                <textarea
                  rows={2}
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  placeholder="Notes relatives au virement, référence de chèque..."
                  className="w-full px-3.5 py-2 border border-neutral-200 rounded-xl"
                />
              </div>

              {/* Submit */}
              <div className="pt-3 border-t border-neutral-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsPayoutModalOpen(false)}
                  className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSavingPayout || isUploadingReceipt}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSavingPayout ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  <span>Enregistrer le Versement</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT ORDER ENCAISSEMENT DETAILS */}
      {/* ========================================================================= */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-100 border border-sky-300 flex items-center justify-center text-sky-800">
                  <Truck size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900">
                    Encaissement Commande #{editingOrder.orderNumber}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Client : {editingOrder.customerName} ({editingOrder.shippingCity})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-xl cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveOrderEncaissement} className="py-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Transporteur
                </label>
                <select
                  value={orderCarrierId}
                  onChange={(e) => setOrderCarrierId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl font-semibold text-neutral-800"
                >
                  <option value="">Non assigné</option>
                  {carriers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Frais standard: {c.defaultFee} MAD)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Numéro de Suivi / Tracking
                </label>
                <input
                  type="text"
                  value={orderTrackingNumber}
                  onChange={(e) => setOrderTrackingNumber(e.target.value)}
                  placeholder="Ex: AM123456789MA"
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-xl font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Montant Encaissé Livreur (MAD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={orderCodCollected}
                    onChange={(e) => setOrderCodCollected(e.target.value)}
                    placeholder="Ex: 334.00"
                    className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-xl font-mono font-bold text-emerald-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Frais Transporteur (MAD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={orderCarrierFee}
                    onChange={(e) => setOrderCarrierFee(e.target.value)}
                    placeholder="Ex: 35.00"
                    className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-xl font-mono font-bold text-rose-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Date d'Échéance du Versement
                </label>
                <input
                  type="date"
                  value={orderExpectedDate}
                  onChange={(e) => setOrderExpectedDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Notes de Rapprochement</label>
                <textarea
                  rows={2}
                  value={orderReconNotes}
                  onChange={(e) => setOrderReconNotes(e.target.value)}
                  placeholder="Remarques éventuelles sur la livraison ou le paiement..."
                  className="w-full px-3.5 py-2 border border-neutral-200 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-neutral-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSavingOrder}
                  className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSavingOrder ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  <span>Enregistrer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PAYOUT DETAILS */}
      {/* ========================================================================= */}
      {viewingPayout && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-sky-50 text-sky-800 border border-sky-200">
                  {viewingPayout.carrier?.name}
                </span>
                <h3 className="text-base font-bold text-neutral-900 font-mono mt-1">
                  Bordereau {viewingPayout.reference}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingPayout(null)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-xl cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-neutral-50 p-3.5 rounded-2xl border border-neutral-200">
                <div>
                  <span className="text-neutral-400 block text-[10px]">Montant Total Reçu :</span>
                  <span className="font-mono font-black text-emerald-700 text-lg">{formatMAD(viewingPayout.amount)}</span>
                </div>
                <div>
                  <span className="text-neutral-400 block text-[10px]">Date Réception :</span>
                  <span className="font-semibold text-neutral-900">{viewingPayout.receivedAt.split('T')[0]}</span>
                </div>
                <div>
                  <span className="text-neutral-400 block text-[10px]">Mode de Paiement :</span>
                  <span className="font-semibold text-neutral-900">{viewingPayout.paymentMethod}</span>
                </div>
                <div>
                  <span className="text-neutral-400 block text-[10px]">Statut :</span>
                  <span className="font-bold text-emerald-800">{viewingPayout.status}</span>
                </div>
              </div>

              {viewingPayout.notes && (
                <div className="p-3 bg-neutral-50 rounded-xl text-neutral-700 text-xs">
                  <strong>Notes :</strong> {viewingPayout.notes}
                </div>
              )}

              {/* Covered Orders */}
              <div>
                <h4 className="font-bold text-neutral-800 uppercase tracking-wider text-[11px] mb-2">
                  Commandes Rattachées ({viewingPayout.allocations.length})
                </h4>
                <div className="border border-neutral-200 rounded-2xl divide-y divide-neutral-100 max-h-48 overflow-y-auto">
                  {viewingPayout.allocations.map((al) => (
                    <div key={al.id} className="p-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono font-bold text-neutral-900">#{al.order?.orderNumber || al.orderId}</span>
                        <span className="text-[10px] text-neutral-400 block">{al.order?.customerName}</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-700">{formatMAD(al.allocatedAmount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-100 text-right">
              <button
                type="button"
                onClick={() => setViewingPayout(null)}
                className="px-4 py-2 bg-neutral-900 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
