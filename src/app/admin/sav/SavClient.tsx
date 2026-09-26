'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  RotateCcw,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  User,
  ShoppingBag,
  MessageSquare,
  MessageCircle,
  FileText,
  Paperclip,
  DollarSign,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  X,
  Send,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
  Package,
  ShieldCheck,
  Building,
  Upload,
  Eye,
  Check,
  Tag,
  Phone,
  Mail,
  Archive,
  HelpCircle,
  TrendingDown,
  History
} from 'lucide-react';
import {
  SAV_CATEGORIES,
  SAV_CHANNELS,
  SAV_PRIORITIES,
  SAV_STATUSES,
  PENDING_REASONS,
  SAV_SOLUTIONS,
  safeJsonParse
} from '@/lib/sav/savService';

interface SavClientProps {
  currentAdmin: {
    id: string;
    name: string;
    role: string;
    avatar?: string | null;
  };
}

export default function SavClient({ currentAdmin }: SavClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlClaimId = searchParams.get('claimId');
  const urlNewClaim = searchParams.get('newClaim') === 'true';
  const urlOrderId = searchParams.get('orderId');

  // Main State
  const [claims, setClaims] = useState<any[]>([]);
  const [kpis, setKpis] = useState({
    openClaims: 0,
    unassignedClaims: 0,
    overdueActions: 0,
    resolvedInPeriod: 0,
  });
  const [admins, setAdmins] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [assignedToFilter, setAssignedToFilter] = useState('ALL');
  const [periodFilter, setPeriodFilter] = useState('30d');
  const [myClaimsOnly, setMyClaimsOnly] = useState(false);

  // Active Selected Claim Drawer
  const [selectedClaim, setSelectedClaim] = useState<any | null>(null);
  const [isClaimDrawerOpen, setIsClaimDrawerOpen] = useState(false);
  const [drawerActiveTab, setDrawerActiveTab] = useState<'OVERVIEW' | 'SOLUTION' | 'RETURNS' | 'REFUNDS' | 'NOTES' | 'TIMELINE'>('OVERVIEW');
  const [isFetchingDetail, setIsFetchingDetail] = useState(false);

  // New Claim Modal State
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newOrderSearch, setNewOrderSearch] = useState('');
  const [searchedOrders, setSearchedOrders] = useState<any[]>([]);
  const [isSearchingOrders, setIsSearchingOrders] = useState(false);
  const [selectedNewOrder, setSelectedNewOrder] = useState<any | null>(null);
  const [selectedOrderItems, setSelectedOrderItems] = useState<Record<string, { selected: boolean; quantity: number }>>({});
  const [newClaimForm, setNewClaimForm] = useState({
    category: 'WRONG_PRODUCT',
    channel: 'WHATSAPP',
    priority: 'MEDIUM',
    description: '',
    assignedToId: currentAdmin.id,
    nextAction: '',
    nextActionDueDate: '',
    proposedSolution: '',
    proposedSolutionNotes: '',
    attachments: [] as any[],
  });
  const [isCreatingClaim, setIsCreatingClaim] = useState(false);
  const [newClaimError, setNewClaimError] = useState('');

  // Sub-forms inside drawer
  const [internalNoteInput, setInternalNoteInput] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // Status edit form
  const [statusUpdateForm, setStatusUpdateForm] = useState({
    status: '',
    pendingReason: '',
    priority: '',
    assignedToId: '',
    nextAction: '',
    nextActionDueDate: '',
    resolutionNotes: '',
    reopenReason: '',
    proposedSolution: '',
    proposedSolutionNotes: '',
    solutionStatus: '',
  });
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Returns management
  const [isAddingReturnItem, setIsAddingReturnItem] = useState(false);
  const [returnItemForm, setReturnItemForm] = useState({ productName: '', quantity: 1, sku: '' });
  const [inspectingItemId, setInspectingItemId] = useState<string | null>(null);
  const [inspectionDecision, setInspectionDecision] = useState('RESTOCK_SELLABLE');
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [isProcessingReturn, setIsProcessingReturn] = useState(false);

  // Refunds management
  const [isAddingRefund, setIsAddingRefund] = useState(false);
  const [refundForm, setRefundForm] = useState({
    amount: '',
    reason: '',
    paymentMethod: 'VIREMENT_BANCAIRE',
    transactionReference: '',
    notes: '',
  });
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);
  const [confirmingRefundId, setConfirmingRefundId] = useState<string | null>(null);
  const [confirmRefundData, setConfirmRefundData] = useState({
    transactionReference: '',
    paymentMethod: 'VIREMENT_BANCAIRE',
    effectiveDate: new Date().toISOString().split('T')[0],
  });

  // Attachments upload
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);

  // -------------------------------------------------------------
  // Data Fetching
  // -------------------------------------------------------------
  const fetchClaims = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (categoryFilter !== 'ALL') params.set('category', categoryFilter);
      if (priorityFilter !== 'ALL') params.set('priority', priorityFilter);
      if (assignedToFilter !== 'ALL') params.set('assignedTo', assignedToFilter);
      if (periodFilter) params.set('period', periodFilter);
      if (myClaimsOnly) params.set('myClaims', 'true');

      const res = await fetch(`/api/admin/sav?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setClaims(data.claims || []);
        setKpis(data.kpis || { openClaims: 0, unassignedClaims: 0, overdueActions: 0, resolvedInPeriod: 0 });
        setAdmins(data.admins || []);
      }
    } catch (err) {
      console.error('Error fetching claims:', err);
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, categoryFilter, priorityFilter, assignedToFilter, periodFilter, myClaimsOnly]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  // Load single claim if provided in URL or clicked
  const fetchClaimDetail = useCallback(async (idOrTicket: string) => {
    setIsFetchingDetail(true);
    try {
      const res = await fetch(`/api/admin/sav/${idOrTicket}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedClaim(data.claim);
        setStatusUpdateForm({
          status: data.claim.status,
          pendingReason: data.claim.pendingReason || '',
          priority: data.claim.priority,
          assignedToId: data.claim.assignedToId || '',
          nextAction: data.claim.nextAction || '',
          nextActionDueDate: data.claim.nextActionDueDate ? data.claim.nextActionDueDate.split('T')[0] : '',
          resolutionNotes: data.claim.resolutionNotes || '',
          reopenReason: '',
          proposedSolution: data.claim.proposedSolution || '',
          proposedSolutionNotes: data.claim.proposedSolutionNotes || '',
          solutionStatus: data.claim.solutionStatus || 'NONE',
        });
        setIsClaimDrawerOpen(true);
      }
    } catch (err) {
      console.error('Error fetching claim detail:', err);
    } finally {
      setIsFetchingDetail(false);
    }
  }, []);

  useEffect(() => {
    if (urlClaimId) {
      fetchClaimDetail(urlClaimId);
    }
  }, [urlClaimId, fetchClaimDetail]);

  // Handle URL new claim with prefilled order
  useEffect(() => {
    if (urlNewClaim) {
      setIsNewModalOpen(true);
      if (urlOrderId) {
        fetch(`/api/admin/sav/orders?q=${urlOrderId}`)
          .then((r) => r.json())
          .then((data) => {
            const matched = (data.orders || []).find((o: any) => o.id === urlOrderId || o.orderNumber === urlOrderId);
            if (matched) {
              selectOrderForNewClaim(matched);
            }
          });
      }
    }
  }, [urlNewClaim, urlOrderId]);

  // Search orders for new claim
  const searchOrders = async (query: string) => {
    setNewOrderSearch(query);
    if (!query.trim()) {
      setSearchedOrders([]);
      return;
    }
    setIsSearchingOrders(true);
    try {
      const res = await fetch(`/api/admin/sav/orders?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchedOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Error searching orders:', err);
    } finally {
      setIsSearchingOrders(false);
    }
  };

  const selectOrderForNewClaim = (order: any) => {
    setSelectedNewOrder(order);
    setSearchedOrders([]);
    setNewOrderSearch('');

    const parsedItems = safeJsonParse<any[]>(order.items, []);
    const itemsMap: Record<string, { selected: boolean; quantity: number }> = {};
    parsedItems.forEach((item, idx) => {
      const key = `${item.id || item.sku || idx}`;
      itemsMap[key] = {
        selected: true,
        quantity: item.quantity || 1,
      };
    });
    setSelectedOrderItems(itemsMap);
  };

  // Create claim submit
  const handleCreateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNewOrder) {
      setNewClaimError('Veuillez sélectionner une commande valide.');
      return;
    }
    if (!newClaimForm.description.trim()) {
      setNewClaimError('Veuillez saisir une description détaillée du problème.');
      return;
    }

    setIsCreatingClaim(true);
    setNewClaimError('');

    try {
      // Gather affected items
      const parsedItems = safeJsonParse<any[]>(selectedNewOrder.items, []);
      const affected = parsedItems
        .filter((item, idx) => {
          const key = `${item.id || item.sku || idx}`;
          return selectedOrderItems[key]?.selected;
        })
        .map((item, idx) => {
          const key = `${item.id || item.sku || idx}`;
          return {
            productId: item.id || null,
            productName: item.name,
            sku: item.sku || null,
            size: item.size || null,
            quantity: selectedOrderItems[key]?.quantity || item.quantity || 1,
            unitPrice: item.price || 0,
          };
        });

      const res = await fetch('/api/admin/sav', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedNewOrder.id,
          category: newClaimForm.category,
          channel: newClaimForm.channel,
          priority: newClaimForm.priority,
          description: newClaimForm.description,
          affectedItems: affected,
          attachments: newClaimForm.attachments,
          assignedToId: newClaimForm.assignedToId || null,
          nextAction: newClaimForm.nextAction || null,
          nextActionDueDate: newClaimForm.nextActionDueDate || null,
          proposedSolution: newClaimForm.proposedSolution || null,
          proposedSolutionNotes: newClaimForm.proposedSolutionNotes || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la création du dossier.');
      }

      setIsNewModalOpen(false);
      setSelectedNewOrder(null);
      setNewClaimForm({
        category: 'WRONG_PRODUCT',
        channel: 'WHATSAPP',
        priority: 'MEDIUM',
        description: '',
        assignedToId: currentAdmin.id,
        nextAction: '',
        nextActionDueDate: '',
        proposedSolution: '',
        proposedSolutionNotes: '',
        attachments: [],
      });

      await fetchClaims();
      if (data.claim?.id) {
        fetchClaimDetail(data.claim.id);
      }
    } catch (err: any) {
      setNewClaimError(err.message || 'Erreur inconnue.');
    } finally {
      setIsCreatingClaim(false);
    }
  };

  // Submit note inside drawer
  const handleAddInternalNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaim || !internalNoteInput.trim()) return;

    setIsSubmittingNote(true);
    try {
      const res = await fetch(`/api/admin/sav/${selectedClaim.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: internalNoteInput }),
      });

      if (res.ok) {
        setInternalNoteInput('');
        await fetchClaimDetail(selectedClaim.id);
        fetchClaims();
      }
    } catch (err) {
      console.error('Error adding note:', err);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // Update claim status/fields
  const handleUpdateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaim) return;

    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/sav/${selectedClaim.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(statusUpdateForm),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Erreur lors de la mise à jour.');
      } else {
        await fetchClaimDetail(selectedClaim.id);
        fetchClaims();
      }
    } catch (err) {
      console.error('Error updating claim:', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Return item actions
  const handleAddReturnItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaim || !returnItemForm.productName.trim()) return;

    setIsProcessingReturn(true);
    try {
      const res = await fetch(`/api/admin/sav/${selectedClaim.id}/returns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_ITEM',
          ...returnItemForm,
        }),
      });

      if (res.ok) {
        setIsAddingReturnItem(false);
        setReturnItemForm({ productName: '', quantity: 1, sku: '' });
        await fetchClaimDetail(selectedClaim.id);
      }
    } catch (err) {
      console.error('Error adding return item:', err);
    } finally {
      setIsProcessingReturn(false);
    }
  };

  const handleMarkReturnReceived = async (returnItemId: string) => {
    if (!selectedClaim) return;
    setIsProcessingReturn(true);
    try {
      const res = await fetch(`/api/admin/sav/${selectedClaim.id}/returns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'MARK_RECEIVED', returnItemId }),
      });
      if (res.ok) {
        await fetchClaimDetail(selectedClaim.id);
      }
    } catch (err) {
      console.error('Error marking return received:', err);
    } finally {
      setIsProcessingReturn(false);
    }
  };

  const handleInspectReturnItem = async (returnItemId: string) => {
    if (!selectedClaim) return;
    setIsProcessingReturn(true);
    try {
      const res = await fetch(`/api/admin/sav/${selectedClaim.id}/returns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'INSPECT',
          returnItemId,
          inspectionDecision,
          inspectionNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Erreur lors de l\'inspection.');
      } else {
        setInspectingItemId(null);
        setInspectionNotes('');
        await fetchClaimDetail(selectedClaim.id);
        fetchClaims();
      }
    } catch (err) {
      console.error('Error inspecting return item:', err);
    } finally {
      setIsProcessingReturn(false);
    }
  };

  // Refund actions
  const handleRequestRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaim || !refundForm.amount || !refundForm.reason.trim()) return;

    setIsSubmittingRefund(true);
    try {
      const res = await fetch(`/api/admin/sav/${selectedClaim.id}/refunds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REQUEST',
          amount: refundForm.amount,
          reason: refundForm.reason,
          paymentMethod: refundForm.paymentMethod,
          transactionReference: refundForm.transactionReference,
          notes: refundForm.notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Erreur lors de la demande de remboursement.');
      } else {
        setIsAddingRefund(false);
        setRefundForm({ amount: '', reason: '', paymentMethod: 'VIREMENT_BANCAIRE', transactionReference: '', notes: '' });
        await fetchClaimDetail(selectedClaim.id);
      }
    } catch (err) {
      console.error('Error requesting refund:', err);
    } finally {
      setIsSubmittingRefund(false);
    }
  };

  const handleConfirmRefund = async (refundId: string) => {
    if (!selectedClaim) return;
    setIsSubmittingRefund(true);
    try {
      const res = await fetch(`/api/admin/sav/${selectedClaim.id}/refunds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CONFIRM',
          refundId,
          transactionReference: confirmRefundData.transactionReference,
          paymentMethod: confirmRefundData.paymentMethod,
          effectiveDate: confirmRefundData.effectiveDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Erreur lors de la confirmation du remboursement.');
      } else {
        setConfirmingRefundId(null);
        await fetchClaimDetail(selectedClaim.id);
        fetchClaims();
      }
    } catch (err) {
      console.error('Error confirming refund:', err);
    } finally {
      setIsSubmittingRefund(false);
    }
  };

  // Upload attachment
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'NEW_CLAIM' | 'DRAWER') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAttachment(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) throw new Error('Échec du téléversement.');
      const { url } = await uploadRes.json();

      if (target === 'NEW_CLAIM') {
        setNewClaimForm((prev) => ({
          ...prev,
          attachments: [
            ...prev.attachments,
            {
              id: Date.now().toString(),
              name: file.name,
              url,
              type: file.type.startsWith('image/') ? 'IMAGE' : 'DOCUMENT',
              size: file.size,
              uploadedAt: new Date().toISOString(),
              uploadedByName: currentAdmin.name,
            },
          ],
        }));
      } else if (target === 'DRAWER' && selectedClaim) {
        const attachRes = await fetch(`/api/admin/sav/${selectedClaim.id}/attachments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: file.name,
            url,
            type: file.type.startsWith('image/') ? 'IMAGE' : 'DOCUMENT',
            size: file.size,
          }),
        });
        if (attachRes.ok) {
          await fetchClaimDetail(selectedClaim.id);
        }
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Erreur lors du téléversement du fichier.');
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  // Helper WhatsApp link
  const getWhatsAppLink = (phone?: string | null, name?: string, ticketNumber?: string) => {
    if (!phone) return '#';
    const cleaned = phone.replace(/[^0-9]/g, '');
    let formatted = cleaned;
    if (formatted.startsWith('0')) formatted = '212' + formatted.slice(1);
    if (!formatted.startsWith('212')) formatted = '212' + formatted;
    const msg = encodeURIComponent(
      `Bonjour ${name || 'Cher client'}, nous faisons suite à votre dossier SAV #${ticketNumber || ''} chez NAY Parfum.`
    );
    return `https://wa.me/${formatted}?text=${msg}`;
  };

  const isOverdue = (dateStr?: string | null) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md">
              <RotateCcw size={20} className="text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                SAV & Réclamations Clients
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Suivi centralisé des litiges, retours d'articles, échanges et remboursements réels.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={fetchClaims}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer"
          >
            <RefreshCw size={14} className={`text-slate-500 ${isLoading ? 'animate-spin text-[#1D9BF0]' : ''}`} />
            <span>Actualiser</span>
          </button>

          <button
            onClick={() => {
              setSelectedNewOrder(null);
              setIsNewModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <Plus size={15} />
            <span>Nouvelle réclamation</span>
          </button>
        </div>
      </div>

      {/* 4 Real-time KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Open Claims */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Dossiers Ouverts</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <AlertCircle size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{kpis.openClaims}</div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">Nouveaux, en cours ou en attente</div>
        </div>

        {/* KPI 2: Unassigned */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-purple-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Sans Responsable</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <User size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-700 mt-2">{kpis.unassignedClaims}</div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">À attribuer à un associé / agent</div>
        </div>

        {/* KPI 3: Overdue Next Actions */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-rose-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Actions en Retard</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600 mt-2">{kpis.overdueActions}</div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">Échéance de prochaine action dépassée</div>
        </div>

        {/* KPI 4: Resolved in Period */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Dossiers Résolus</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">{kpis.resolvedInPeriod}</div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">Sur les 30 derniers jours</div>
        </div>

      </div>

      {/* Filters Bar & Quick Views */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par N° SAV, N° commande, client, téléphone..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1D9BF0]/20 focus:border-[#1D9BF0] transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Quick "Mes dossiers" Toggle */}
          <button
            onClick={() => setMyClaimsOnly(!myClaimsOnly)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              myClaimsOnly
                ? 'bg-[#1D9BF0] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <User size={13} />
            <span>Mes dossiers ({claims.filter((c) => c.assignedToId === currentAdmin.id).length})</span>
          </button>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">Tous les statuts</option>
            {SAV_STATUSES.map((st) => (
              <option key={st.value} value={st.value}>
                {st.label}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">Tous les motifs</option>
            {SAV_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">Toutes priorités</option>
            {SAV_PRIORITIES.map((pr) => (
              <option key={pr.value} value={pr.value}>
                {pr.label}
              </option>
            ))}
          </select>

          {/* Assignee Filter */}
          <select
            value={assignedToFilter}
            onChange={(e) => setAssignedToFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">Tous responsables</option>
            <option value="UNASSIGNED">Non assigné</option>
            {admins.map((adm) => (
              <option key={adm.id} value={adm.id}>
                {adm.name}
              </option>
            ))}
          </select>

        </div>
      </div>

      {/* Claims Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5">Référence SAV</th>
                <th className="px-5 py-3.5">Commande liée</th>
                <th className="px-5 py-3.5">Client & Contact</th>
                <th className="px-5 py-3.5">Motif / Problème</th>
                <th className="px-5 py-3.5">Responsable</th>
                <th className="px-5 py-3.5">Priorité</th>
                <th className="px-5 py-3.5">Statut</th>
                <th className="px-5 py-3.5">Prochaine action</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw size={20} className="animate-spin text-[#1D9BF0]" />
                      <span className="text-xs font-medium">Chargement des dossiers SAV...</span>
                    </div>
                  </td>
                </tr>
              ) : claims.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-1">
                        <RotateCcw size={24} />
                      </div>
                      <span className="font-bold text-slate-800 text-sm">Aucun dossier de réclamation</span>
                      <p className="text-xs text-slate-400 text-center">
                        Aucun dossier ne correspond à vos filtres actuels, ou aucune réclamation n'a encore été ouverte.
                      </p>
                      <button
                        onClick={() => {
                          setSelectedNewOrder(null);
                          setIsNewModalOpen(true);
                        }}
                        className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer"
                      >
                        <Plus size={14} />
                        <span>Nouvelle réclamation</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                claims.map((claim) => {
                  const priorityObj = SAV_PRIORITIES.find((p) => p.value === claim.priority) || SAV_PRIORITIES[1];
                  const statusObj = SAV_STATUSES.find((s) => s.value === claim.status) || SAV_STATUSES[0];
                  const actionOverdue = isOverdue(claim.nextActionDueDate) && !['RESOLVED', 'CLOSED'].includes(claim.status);
                  const parsedAffected = safeJsonParse<any[]>(claim.affectedItems, []);

                  return (
                    <tr
                      key={claim.id}
                      onClick={() => fetchClaimDetail(claim.id)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      {/* SAV Ref */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900 group-hover:text-[#1D9BF0] transition-colors">
                          {claim.ticketNumber}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                          {new Date(claim.createdAt).toLocaleDateString('fr-MA', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>

                      {/* Linked Order */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="font-mono font-semibold text-slate-800">
                          #{claim.order?.orderNumber || 'N/A'}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          {claim.order?.shippingCity || 'Casablanca'} • {claim.order?.total || 0} MAD
                        </div>
                      </td>

                      {/* Customer & WhatsApp */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{claim.customerName}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {claim.customerPhone ? (
                            <>
                              <span className="font-mono text-[11px] text-slate-500">{claim.customerPhone}</span>
                              <a
                                href={getWhatsAppLink(claim.customerPhone, claim.customerName, claim.ticketNumber)}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-1 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-colors"
                                title="Contacter sur WhatsApp"
                              >
                                <MessageCircle size={11} />
                              </a>
                            </>
                          ) : (
                            <span className="italic text-slate-400 text-[11px]">Non renseigné</span>
                          )}
                        </div>
                      </td>

                      {/* Reason / Category */}
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-800">{claim.categoryLabel}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[200px] mt-0.5">
                          {claim.description}
                        </div>
                        {parsedAffected.length > 0 && (
                          <div className="text-[10px] text-slate-500 mt-1 font-mono">
                            {parsedAffected.length} article(s) concerné(s)
                          </div>
                        )}
                      </td>

                      {/* Assignee */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {claim.assignedTo ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-[10px]">
                              {claim.assignedTo.name.charAt(0)}
                            </div>
                            <span className="font-semibold text-slate-800 text-xs">{claim.assignedTo.name}</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[11px] font-semibold">
                            Non assigné
                          </span>
                        )}
                      </td>

                      {/* Priority */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold border ${priorityObj.badgeBg} ${priorityObj.badgeText} ${priorityObj.badgeBorder}`}>
                          {priorityObj.label}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border ${statusObj.bg} ${statusObj.text} ${statusObj.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusObj.dot}`} />
                          <span>{statusObj.label}</span>
                        </span>
                      </td>

                      {/* Next Action & Due Date */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {claim.nextAction ? (
                          <div>
                            <div className="text-xs font-semibold text-slate-800 truncate max-w-[150px]">
                              {claim.nextAction}
                            </div>
                            {claim.nextActionDueDate && (
                              <div className={`text-[10px] font-bold mt-0.5 flex items-center gap-1 ${
                                actionOverdue ? 'text-rose-600 animate-pulse' : 'text-slate-400'
                              }`}>
                                <Clock size={10} />
                                <span>
                                  {actionOverdue ? 'En retard: ' : ''}
                                  {new Date(claim.nextActionDueDate).toLocaleDateString('fr-MA', {
                                    day: 'numeric',
                                    month: 'short',
                                  })}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300 italic text-[11px]">Aucune action planifiée</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => fetchClaimDetail(claim.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 transition-all font-bold text-xs cursor-pointer"
                        >
                          <Eye size={12} />
                          <span>Détails</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* DRAWER / MODAL FICHE DÉTAILLÉE SAV */}
      {/* ========================================================= */}
      {isClaimDrawerOpen && selectedClaim && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsClaimDrawerOpen(false)}
          />

          <div className="relative w-full max-w-3xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200 z-10">
            
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-bold text-slate-900 font-mono">
                    {selectedClaim.ticketNumber}
                  </h2>
                  <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${
                    SAV_STATUSES.find((s) => s.value === selectedClaim.status)?.bg || 'bg-slate-100'
                  } ${
                    SAV_STATUSES.find((s) => s.value === selectedClaim.status)?.text || 'text-slate-700'
                  }`}>
                    {SAV_STATUSES.find((s) => s.value === selectedClaim.status)?.label || selectedClaim.status}
                  </span>
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-bold border ${
                    SAV_PRIORITIES.find((p) => p.value === selectedClaim.priority)?.badgeBg
                  } ${
                    SAV_PRIORITIES.find((p) => p.value === selectedClaim.priority)?.badgeText
                  }`}>
                    {SAV_PRIORITIES.find((p) => p.value === selectedClaim.priority)?.label}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                  Créé le {new Date(selectedClaim.createdAt).toLocaleDateString('fr-MA', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })} par <span className="font-semibold text-slate-700">{selectedClaim.createdByName}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsClaimDrawerOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Drawer Navigation Tabs */}
            <div className="flex items-center border-b border-slate-200 px-6 bg-white overflow-x-auto">
              {[
                { id: 'OVERVIEW', label: 'Vue d\'ensemble' },
                { id: 'SOLUTION', label: 'Traitement & Solution' },
                { id: 'RETURNS', label: `Retours & Stock (${selectedClaim.returnItems?.length || 0})` },
                { id: 'REFUNDS', label: `Remboursements (${selectedClaim.refunds?.length || 0})` },
                { id: 'NOTES', label: `Notes Internes (${selectedClaim.internalNotes?.length || 0})` },
                { id: 'TIMELINE', label: `Chronologie (${selectedClaim.events?.length || 0})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setDrawerActiveTab(tab.id as any)}
                  className={`py-3 px-3 text-xs font-bold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                    drawerActiveTab === tab.id
                      ? 'border-[#1D9BF0] text-[#1D9BF0]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Drawer Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              
              {/* TAB 1: OVERVIEW */}
              {drawerActiveTab === 'OVERVIEW' && (
                <div className="space-y-6">
                  
                  {/* Linked Order Card */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                        <ShoppingBag size={16} className="text-[#1D9BF0]" />
                        <span>Commande #{selectedClaim.order?.orderNumber}</span>
                      </div>
                      <Link
                        href={`/admin/orders?search=${selectedClaim.order?.orderNumber}`}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1D9BF0] hover:underline"
                      >
                        <span>Voir commande</span>
                        <ArrowRight size={12} />
                      </Link>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] pt-1 border-t border-slate-200/80">
                      <div>
                        <span className="text-slate-400 block font-medium">Statut livraison</span>
                        <span className="font-bold text-slate-800 uppercase">{selectedClaim.order?.status}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Total Commande</span>
                        <span className="font-bold text-slate-900">{selectedClaim.order?.total} MAD</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Ville de livraison</span>
                        <span className="font-bold text-slate-800">{selectedClaim.order?.shippingCity || 'Casablanca'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Date Commande</span>
                        <span className="font-bold text-slate-800">
                          {new Date(selectedClaim.order?.createdAt).toLocaleDateString('fr-MA')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Customer Information Card */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2.5">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <User size={14} className="text-[#1D9BF0]" />
                      <span>Coordonnées Client</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Nom complet</span>
                        <span className="font-semibold text-slate-900">{selectedClaim.customerName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Téléphone</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-slate-700">{selectedClaim.customerPhone || 'Non renseigné'}</span>
                          {selectedClaim.customerPhone && (
                            <a
                              href={getWhatsAppLink(selectedClaim.customerPhone, selectedClaim.customerName, selectedClaim.ticketNumber)}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-colors"
                            >
                              <MessageCircle size={12} />
                            </a>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Email</span>
                        <span className="text-slate-600">{selectedClaim.customerEmail || 'Non renseigné'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Problem Description Card */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <AlertCircle size={14} className="text-amber-500" />
                        <span>Description du problème ({selectedClaim.categoryLabel})</span>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500">Canal: {selectedClaim.channel}</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {selectedClaim.description}
                    </p>
                  </div>

                  {/* Affected Products List */}
                  <div className="space-y-2">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Package size={14} className="text-[#1D9BF0]" />
                      <span>Produits concernés par la réclamation</span>
                    </div>
                    <div className="space-y-1.5">
                      {safeJsonParse<any[]>(selectedClaim.affectedItems, []).map((prod, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-900">{prod.productName}</span>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {prod.sku ? `SKU: ${prod.sku} • ` : ''}Quantité: <span className="font-bold text-slate-800">{prod.quantity}</span>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-slate-900">{prod.unitPrice * prod.quantity} MAD</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Attachments Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Paperclip size={14} className="text-[#1D9BF0]" />
                        <span>Pièces justificatives & Photos ({safeJsonParse<any[]>(selectedClaim.attachments, []).length})</span>
                      </div>
                      <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] cursor-pointer">
                        <Upload size={12} />
                        <span>{isUploadingAttachment ? 'Envoi...' : 'Ajouter une photo'}</span>
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, 'DRAWER')}
                          disabled={isUploadingAttachment}
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {safeJsonParse<any[]>(selectedClaim.attachments, []).map((att, idx) => (
                        <a
                          key={idx}
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2.5 rounded-xl border border-slate-200 bg-white hover:border-[#1D9BF0] transition-all flex flex-col items-center text-center group"
                        >
                          <FileText size={24} className="text-slate-400 group-hover:text-[#1D9BF0] mb-1" />
                          <span className="font-medium text-slate-800 text-[11px] truncate w-full">{att.name}</span>
                          <span className="text-[10px] text-slate-400">{att.uploadedByName}</span>
                        </a>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 2: SOLUTION & STATUS MANAGEMENT */}
              {drawerActiveTab === 'SOLUTION' && (
                <form onSubmit={handleUpdateClaim} className="space-y-4">
                  
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-4">
                    <h3 className="font-bold text-slate-900 text-sm">Gestion du Statut & Attribution</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Statut */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Statut du dossier</label>
                        <select
                          value={statusUpdateForm.status}
                          onChange={(e) => setStatusUpdateForm({ ...statusUpdateForm, status: e.target.value })}
                          className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs"
                        >
                          {SAV_STATUSES.map((st) => (
                            <option key={st.value} value={st.value}>
                              {st.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Responsable */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Responsable assigné</label>
                        <select
                          value={statusUpdateForm.assignedToId}
                          onChange={(e) => setStatusUpdateForm({ ...statusUpdateForm, assignedToId: e.target.value })}
                          className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs"
                        >
                          <option value="">Non assigné</option>
                          {admins.map((adm) => (
                            <option key={adm.id} value={adm.id}>
                              {adm.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Pending Reason if PENDING */}
                    {statusUpdateForm.status === 'PENDING' && (
                      <div>
                        <label className="block text-[11px] font-bold text-purple-800 mb-1">Motif d'attente</label>
                        <select
                          value={statusUpdateForm.pendingReason}
                          onChange={(e) => setStatusUpdateForm({ ...statusUpdateForm, pendingReason: e.target.value })}
                          className="w-full p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 font-semibold text-xs"
                        >
                          <option value="">Sélectionner un motif d'attente</option>
                          {PENDING_REASONS.map((pr) => (
                            <option key={pr.value} value={pr.label}>
                              {pr.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Reopening Reason if Reopening */}
                    {(selectedClaim.status === 'CLOSED' || selectedClaim.status === 'RESOLVED') &&
                      statusUpdateForm.status !== 'CLOSED' &&
                      statusUpdateForm.status !== 'RESOLVED' && (
                        <div>
                          <label className="block text-[11px] font-bold text-rose-800 mb-1">
                            Motif de réouverture obligatoire
                          </label>
                          <input
                            type="text"
                            required
                            value={statusUpdateForm.reopenReason}
                            onChange={(e) => setStatusUpdateForm({ ...statusUpdateForm, reopenReason: e.target.value })}
                            placeholder="Ex: Le client signale que le flacon de remplacement fuit également..."
                            className="w-full p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 font-medium text-xs focus:outline-none"
                          />
                        </div>
                      )}

                    {/* Priority & Next Action */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Priorité</label>
                        <select
                          value={statusUpdateForm.priority}
                          onChange={(e) => setStatusUpdateForm({ ...statusUpdateForm, priority: e.target.value })}
                          className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs"
                        >
                          {SAV_PRIORITIES.map((pr) => (
                            <option key={pr.value} value={pr.value}>
                              {pr.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Échéance prochaine action</label>
                        <input
                          type="date"
                          value={statusUpdateForm.nextActionDueDate}
                          onChange={(e) => setStatusUpdateForm({ ...statusUpdateForm, nextActionDueDate: e.target.value })}
                          className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Action à mener</label>
                      <input
                        type="text"
                        value={statusUpdateForm.nextAction}
                        onChange={(e) => setStatusUpdateForm({ ...statusUpdateForm, nextAction: e.target.value })}
                        placeholder="Ex: Rappeler le client après confirmation transporteur..."
                        className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-xs"
                      />
                    </div>
                  </div>

                  {/* Solution Section */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-4">
                    <h3 className="font-bold text-slate-900 text-sm">Solution Proposée & Décision</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Solution</label>
                        <select
                          value={statusUpdateForm.proposedSolution}
                          onChange={(e) => setStatusUpdateForm({ ...statusUpdateForm, proposedSolution: e.target.value })}
                          className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs"
                        >
                          <option value="">Aucune solution définie</option>
                          {SAV_SOLUTIONS.map((sol) => (
                            <option key={sol.value} value={sol.value}>
                              {sol.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">État de la solution</label>
                        <select
                          value={statusUpdateForm.solutionStatus}
                          onChange={(e) => setStatusUpdateForm({ ...statusUpdateForm, solutionStatus: e.target.value })}
                          className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs"
                        >
                          <option value="NONE">Non définie</option>
                          <option value="PROPOSED">Proposée au client</option>
                          <option value="VALIDATED">Validée</option>
                          <option value="EXECUTED">Exécutée & Clôturée</option>
                          <option value="REJECTED">Rejetée</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Détails de la solution</label>
                      <textarea
                        rows={3}
                        value={statusUpdateForm.proposedSolutionNotes}
                        onChange={(e) => setStatusUpdateForm({ ...statusUpdateForm, proposedSolutionNotes: e.target.value })}
                        placeholder="Préciser les modalités convenues avec le client..."
                        className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-xs"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isUpdatingStatus}
                    className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isUpdatingStatus ? 'Enregistrement...' : 'Enregistrer les modifications'}
                  </button>

                </form>
              )}

              {/* TAB 3: RETURNS & STOCK MANAGEMENT */}
              {drawerActiveTab === 'RETURNS' && (
                <div className="space-y-4">
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Gestion des Retours Physiques</h3>
                      <p className="text-[11px] text-slate-500">
                        Réception du colis, mise en quarantaine et contrôle qualité avant remise en stock.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsAddingReturnItem(!isAddingReturnItem)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold"
                    >
                      <Plus size={13} />
                      <span>Ajouter un retour</span>
                    </button>
                  </div>

                  {isAddingReturnItem && (
                    <form onSubmit={handleAddReturnItem} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Nom du parfum</label>
                          <input
                            type="text"
                            required
                            value={returnItemForm.productName}
                            onChange={(e) => setReturnItemForm({ ...returnItemForm, productName: e.target.value })}
                            placeholder="Ex: Stronger With You Intensely 100ml"
                            className="w-full p-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Quantité</label>
                          <input
                            type="number"
                            min="1"
                            value={returnItemForm.quantity}
                            onChange={(e) => setReturnItemForm({ ...returnItemForm, quantity: Number(e.target.value) })}
                            className="w-full p-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsAddingReturnItem(false)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold"
                        >
                          Annuler
                        </button>
                        <button
                          type="submit"
                          disabled={isProcessingReturn}
                          className="px-4 py-1.5 rounded-xl bg-[#1D9BF0] text-white text-xs font-bold"
                        >
                          Enregistrer
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-3">
                    {(selectedClaim.returnItems || []).length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200/80 text-slate-400">
                        Aucun retour de marchandise n'est tracé pour ce dossier.
                      </div>
                    ) : (
                      selectedClaim.returnItems.map((item: any) => (
                        <div key={item.id} className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-bold text-slate-900 text-sm">{item.productName}</div>
                              <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                                Quantité : <span className="font-bold text-slate-800">{item.quantity}</span>
                              </div>
                            </div>

                            <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${
                              item.status === 'INSPECTED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : item.status === 'RETURN_RECEIVED'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {item.status === 'INSPECTED'
                                ? 'Inspecté & Décidé'
                                : item.status === 'RETURN_RECEIVED'
                                ? 'Reçu (En quarantaine)'
                                : 'Retour demandé'}
                            </span>
                          </div>

                          {/* Actions depending on step */}
                          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 flex-wrap">
                            {item.status === 'RETURN_REQUESTED' && (
                              <button
                                onClick={() => handleMarkReturnReceived(item.id)}
                                disabled={isProcessingReturn}
                                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-all"
                              >
                                Marquer comme colis retour reçu
                              </button>
                            )}

                            {item.status === 'RETURN_RECEIVED' && inspectingItemId !== item.id && (
                              <button
                                onClick={() => setInspectingItemId(item.id)}
                                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all"
                              >
                                Inspecter & Contrôle Qualité
                              </button>
                            )}
                          </div>

                          {/* Inspection Form Modal Inline */}
                          {inspectingItemId === item.id && (
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3 mt-2 animate-in fade-in duration-150">
                              <span className="font-bold text-slate-900 text-xs block">Décision de Contrôle Qualité</span>
                              
                              <select
                                value={inspectionDecision}
                                onChange={(e) => setInspectionDecision(e.target.value)}
                                className="w-full p-2 rounded-xl bg-white border border-slate-200 font-bold text-xs"
                              >
                                <option value="RESTOCK_SELLABLE">✅ Remise en stock vendable (+ stock)</option>
                                <option value="DAMAGED_DISCARD">❌ Produit endommagé / Rebut (Pas de stock)</option>
                                <option value="NOT_RESALEABLE">⚠️ Non revendable / Ouvert (Pas de stock)</option>
                                <option value="OTHER_JUSTIFIED">📋 Autre disposition justifiée</option>
                              </select>

                              <textarea
                                rows={2}
                                value={inspectionNotes}
                                onChange={(e) => setInspectionNotes(e.target.value)}
                                placeholder="Notes d'inspection (état du packaging, spray, etc.)..."
                                className="w-full p-2 rounded-xl bg-white border border-slate-200 font-medium text-xs"
                              />

                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setInspectingItemId(null)}
                                  className="px-3 py-1 rounded-lg border border-slate-200 text-xs font-bold"
                                >
                                  Annuler
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleInspectReturnItem(item.id)}
                                  disabled={isProcessingReturn}
                                  className="px-4 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                                >
                                  Valider l'inspection
                                </button>
                              </div>
                            </div>
                          )}

                          {item.status === 'INSPECTED' && (
                            <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1">
                              <div>
                                <span className="font-bold text-slate-800">Décision : </span>
                                <span>{item.inspectionDecision}</span>
                                {item.isRestocked && (
                                  <span className="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded">
                                    Stock incrémenté (+{item.restockedQuantity})
                                  </span>
                                )}
                              </div>
                              {item.inspectionNotes && <div>Notes : "{item.inspectionNotes}"</div>}
                              <div className="text-[10px] text-slate-400">
                                Inspecté par {item.inspectedByName} le {new Date(item.inspectedAt).toLocaleDateString('fr-MA')}
                              </div>
                            </div>
                          )}

                        </div>
                      ))
                    )}
                  </div>

                </div>
              )}

              {/* TAB 4: REFUNDS & FINANCE */}
              {drawerActiveTab === 'REFUNDS' && (
                <div className="space-y-4">
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Gestion des Remboursements</h3>
                      <p className="text-[11px] text-slate-500">
                        Traçabilité financière intégrée à la comptabilité NAY Parfum.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsAddingRefund(!isAddingRefund)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold"
                    >
                      <Plus size={13} />
                      <span>Demander un remboursement</span>
                    </button>
                  </div>

                  {/* Financial Summary Card */}
                  <div className="p-4 rounded-2xl bg-slate-900 text-white grid grid-cols-3 gap-3 text-center shadow-md">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">Total Commande</span>
                      <span className="font-bold text-base">{selectedClaim.order?.total || 0} MAD</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">Déjà Remboursé</span>
                      <span className="font-bold text-base text-rose-400">
                        {selectedClaim.refunds
                          ?.filter((r: any) => r.status === 'COMPLETED')
                          .reduce((sum: number, r: any) => sum + r.amount, 0) || 0} MAD
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">Reste Remboursable</span>
                      <span className="font-bold text-base text-emerald-400">
                        {Math.max(
                          0,
                          (selectedClaim.order?.total || 0) -
                            (selectedClaim.refunds
                              ?.filter((r: any) => r.status === 'COMPLETED')
                              .reduce((sum: number, r: any) => sum + r.amount, 0) || 0)
                        )} MAD
                      </span>
                    </div>
                  </div>

                  {/* Add Refund Form */}
                  {isAddingRefund && (
                    <form onSubmit={handleRequestRefund} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Montant (MAD)</label>
                          <input
                            type="number"
                            step="0.01"
                            required
                            value={refundForm.amount}
                            onChange={(e) => setRefundForm({ ...refundForm, amount: e.target.value })}
                            placeholder="Ex: 334"
                            className="w-full p-2 rounded-xl bg-white border border-slate-200 font-bold text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Mode de règlement</label>
                          <select
                            value={refundForm.paymentMethod}
                            onChange={(e) => setRefundForm({ ...refundForm, paymentMethod: e.target.value })}
                            className="w-full p-2 rounded-xl bg-white border border-slate-200 font-semibold text-xs"
                          >
                            <option value="VIREMENT_BANCAIRE">Virement Bancaire</option>
                            <option value="ESPECES">Espèces (Livreur / Agence)</option>
                            <option value="RECHARGE">Recharge / Avoir</option>
                            <option value="AUTRE">Autre</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Motif du remboursement</label>
                        <input
                          type="text"
                          required
                          value={refundForm.reason}
                          onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })}
                          placeholder="Ex: Geste commercial suite flacon cassé..."
                          className="w-full p-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold"
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsAddingRefund(false)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold"
                        >
                          Annuler
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmittingRefund}
                          className="px-4 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold"
                        >
                          Enregistrer la demande
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Refunds List */}
                  <div className="space-y-3">
                    {(selectedClaim.refunds || []).length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200/80 text-slate-400">
                        Aucun remboursement enregistré pour ce dossier.
                      </div>
                    ) : (
                      selectedClaim.refunds.map((refund: any) => (
                        <div key={refund.id} className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-bold text-slate-900 text-sm">{refund.amount} MAD</span>
                              <span className="text-slate-500 text-xs ml-2 font-medium">({refund.paymentMethod})</span>
                            </div>
                            <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${
                              refund.status === 'COMPLETED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {refund.status === 'COMPLETED' ? 'Effectué & Comptabilisé' : 'À effectuer'}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 font-medium">{refund.reason}</p>

                          {refund.status === 'PENDING' && confirmingRefundId !== refund.id && (
                            <div className="pt-2">
                              <button
                                onClick={() => setConfirmingRefundId(refund.id)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                              >
                                Confirmer le virement / paiement effectué
                              </button>
                            </div>
                          )}

                          {confirmingRefundId === refund.id && (
                            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2.5 mt-2">
                              <span className="font-bold text-emerald-900 text-xs block">
                                Confirmation de l'exécution manuelle
                              </span>
                              <input
                                type="text"
                                placeholder="Référence de virement bancaire / reçu..."
                                value={confirmRefundData.transactionReference}
                                onChange={(e) => setConfirmRefundData({ ...confirmRefundData, transactionReference: e.target.value })}
                                className="w-full p-2 rounded-xl bg-white border border-emerald-300 text-xs"
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setConfirmingRefundId(null)}
                                  className="px-3 py-1 rounded-lg border border-emerald-200 text-xs font-bold"
                                >
                                  Annuler
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleConfirmRefund(refund.id)}
                                  disabled={isSubmittingRefund}
                                  className="px-4 py-1 rounded-lg bg-emerald-700 text-white text-xs font-bold"
                                >
                                  Valider et intégrer en comptabilité
                                </button>
                              </div>
                            </div>
                          )}

                          {refund.status === 'COMPLETED' && (
                            <div className="text-[10px] text-slate-400 pt-1">
                              Confirmé par {refund.confirmedByName} le {new Date(refund.confirmedAt).toLocaleDateString('fr-MA')}
                              {refund.transactionReference ? ` (Réf: ${refund.transactionReference})` : ''}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                </div>
              )}

              {/* TAB 5: INTERNAL NOTES */}
              {drawerActiveTab === 'NOTES' && (
                <div className="space-y-4">
                  
                  <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-800 flex items-center gap-2">
                    <ShieldCheck size={14} className="text-amber-600 shrink-0" />
                    <span>Ces notes sont strictement internes et invisibles pour les clients.</span>
                  </div>

                  <form onSubmit={handleAddInternalNote} className="space-y-2">
                    <textarea
                      rows={3}
                      required
                      value={internalNoteInput}
                      onChange={(e) => setInternalNoteInput(e.target.value)}
                      placeholder="Ajouter une observation, consigne pour l'équipe..."
                      className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#1D9BF0]/20"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmittingNote || !internalNoteInput.trim()}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all disabled:opacity-50"
                      >
                        <Send size={13} />
                        <span>Publier la note</span>
                      </button>
                    </div>
                  </form>

                  <div className="space-y-3 pt-2">
                    {(selectedClaim.internalNotes || []).length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200/80 text-slate-400">
                        Aucune note interne enregistrée.
                      </div>
                    ) : (
                      selectedClaim.internalNotes.map((note: any) => (
                        <div key={note.id} className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[9px] font-bold">
                                {note.authorName?.charAt(0) || 'A'}
                              </div>
                              <span className="font-bold text-slate-900 text-xs">{note.authorName}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {new Date(note.createdAt).toLocaleDateString('fr-MA', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 whitespace-pre-wrap pl-7">{note.content}</p>
                        </div>
                      ))
                    )}
                  </div>

                </div>
              )}

              {/* TAB 6: TIMELINE & AUDIT */}
              {drawerActiveTab === 'TIMELINE' && (
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-900 text-sm">Historique complet des événements</h3>
                  
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {(selectedClaim.events || []).map((ev: any) => (
                      <div key={ev.id} className="relative">
                        <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-[#1D9BF0] border-2 border-white ring-2 ring-slate-200" />
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 text-xs">{ev.title}</span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(ev.createdAt).toLocaleDateString('fr-MA', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          {ev.description && (
                            <p className="text-[11px] text-slate-600 mt-0.5">{ev.description}</p>
                          )}
                          <div className="text-[10px] text-slate-400 mt-1">
                            Par <span className="font-semibold text-slate-700">{ev.actorName}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL CRÉATION NOUVELLE RÉCLAMATION SAV */}
      {/* ========================================================= */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsNewModalOpen(false)}
          />

          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh] z-10 animate-in zoom-in-95 duration-150">
            
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2">
                <RotateCcw size={18} className="text-[#1D9BF0]" />
                <h2 className="text-base font-bold text-slate-900">Nouvelle réclamation SAV</h2>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateClaim} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              
              {newClaimError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  {newClaimError}
                </div>
              )}

              {/* Step 1: Select Order */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  1. Sélectionner la commande concernée
                </label>
                
                {selectedNewOrder ? (
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-slate-900">#{selectedNewOrder.orderNumber}</span>
                      <span className="text-slate-600 ml-2 font-medium">
                        {selectedNewOrder.customerName} ({selectedNewOrder.total} MAD)
                      </span>
                      {selectedNewOrder.claims?.length > 0 && (
                        <div className="text-[10px] text-amber-700 font-bold mt-0.5">
                          ⚠️ Attention : {selectedNewOrder.claims.length} dossier(s) déjà ouvert(s) sur cette commande.
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedNewOrder(null)}
                      className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[11px]"
                    >
                      Changer
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={newOrderSearch}
                      onChange={(e) => searchOrders(e.target.value)}
                      placeholder="Tapez le numéro de commande ou le nom du client..."
                      className="w-full pl-8 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium"
                    />

                    {isSearchingOrders && (
                      <div className="text-center py-2 text-slate-400">Recherche...</div>
                    )}

                    {searchedOrders.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 max-h-48 overflow-y-auto z-20 divide-y divide-slate-100">
                        {searchedOrders.map((ord) => (
                          <div
                            key={ord.id}
                            onClick={() => selectOrderForNewClaim(ord)}
                            className="p-2.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between"
                          >
                            <div>
                              <span className="font-mono font-bold text-slate-900">#{ord.orderNumber}</span>
                              <span className="text-slate-600 ml-2 text-[11px]">{ord.customerName}</span>
                            </div>
                            <span className="font-bold text-slate-800">{ord.total} MAD</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Step 2: Select Affected Items */}
              {selectedNewOrder && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="block text-[11px] font-bold text-slate-700">
                    2. Articles concernés dans la commande
                  </label>
                  <div className="space-y-1.5">
                    {safeJsonParse<any[]>(selectedNewOrder.items, []).map((item, idx) => {
                      const key = `${item.id || item.sku || idx}`;
                      const isChecked = selectedOrderItems[key]?.selected ?? true;

                      return (
                        <div key={key} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) =>
                                setSelectedOrderItems({
                                  ...selectedOrderItems,
                                  [key]: {
                                    ...selectedOrderItems[key],
                                    selected: e.target.checked,
                                  },
                                })
                              }
                              className="rounded border-slate-300 text-[#1D9BF0]"
                            />
                            <span className="font-bold text-slate-900">{item.name}</span>
                          </label>

                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 text-[11px]">Quantité :</span>
                            <input
                              type="number"
                              min="1"
                              max={item.quantity || 1}
                              value={selectedOrderItems[key]?.quantity || item.quantity || 1}
                              onChange={(e) =>
                                setSelectedOrderItems({
                                  ...selectedOrderItems,
                                  [key]: {
                                    ...selectedOrderItems[key],
                                    quantity: Number(e.target.value),
                                  },
                                })
                              }
                              className="w-14 p-1 rounded-lg bg-white border border-slate-200 text-center font-bold"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 3: Categorization & Channel */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Motif / Catégorie</label>
                  <select
                    value={newClaimForm.category}
                    onChange={(e) => setNewClaimForm({ ...newClaimForm, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs"
                  >
                    {SAV_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Canal de contact</label>
                  <select
                    value={newClaimForm.channel}
                    onChange={(e) => setNewClaimForm({ ...newClaimForm, channel: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs"
                  >
                    {SAV_CHANNELS.map((ch) => (
                      <option key={ch.value} value={ch.value}>
                        {ch.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Priorité</label>
                  <select
                    value={newClaimForm.priority}
                    onChange={(e) => setNewClaimForm({ ...newClaimForm, priority: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs"
                  >
                    {SAV_PRIORITIES.map((pr) => (
                      <option key={pr.value} value={pr.value}>
                        {pr.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Step 4: Description */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Description détaillée du problème
                </label>
                <textarea
                  rows={3}
                  required
                  value={newClaimForm.description}
                  onChange={(e) => setNewClaimForm({ ...newClaimForm, description: e.target.value })}
                  placeholder="Expliquer le problème signalé par le client, les faits constatés..."
                  className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-[#1D9BF0]/20"
                />
              </div>

              {/* Step 5: Assignee & Action Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Responsable du dossier</label>
                  <select
                    value={newClaimForm.assignedToId}
                    onChange={(e) => setNewClaimForm({ ...newClaimForm, assignedToId: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs"
                  >
                    <option value="">Non assigné</option>
                    {admins.map((adm) => (
                      <option key={adm.id} value={adm.id}>
                        {adm.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Échéance de prochaine action</label>
                  <input
                    type="date"
                    value={newClaimForm.nextActionDueDate}
                    onChange={(e) => setNewClaimForm({ ...newClaimForm, nextActionDueDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs"
                  />
                </div>
              </div>

              {/* Attachments upload */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Photos ou pièces justificatives ({newClaimForm.attachments.length})
                </label>
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer">
                    <Upload size={13} />
                    <span>{isUploadingAttachment ? 'Envoi...' : 'Téléverser un fichier'}</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'NEW_CLAIM')}
                      disabled={isUploadingAttachment}
                    />
                  </label>
                  <span className="text-[11px] text-slate-400">Capture WhatsApp, photo du colis endommagé, etc.</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isCreatingClaim || !selectedNewOrder}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isCreatingClaim ? 'Création...' : 'Ouvrir le dossier SAV'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
