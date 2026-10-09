'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  ChevronDown,
  X,
  Printer,
  PackageOpen,
  CreditCard,
  Truck,
  RefreshCw,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Phone,
  MessageCircle,
  MapPin,
  ExternalLink,
  Copy,
  Check,
  Eye,
  Calendar,
  Filter,
  Download,
  Sparkles,
  Layers,
  ArrowUpRight,
  TrendingUp,
  User,
  Package,
  Target,
  Calculator
} from 'lucide-react';
import OrderTimelineStepper from '@/components/OrderTimelineStepper';
import OrderTimelineFull from '@/components/OrderTimelineFull';

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'refused' | 'returned' | 'unconfirmed';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  size?: string;
  sku?: string;
  image?: string;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  unconfirmed: 'Non confirmé',
  processing: 'En préparation',
  shipped: 'En livraison',
  delivered: 'Livrée & Encaissée',
  refused: 'Refusée',
  returned: 'Retour',
};

const STATUS_CLASSES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  pending: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-400' },
  unconfirmed: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', dot: 'bg-amber-500' },
  processing: { bg: 'bg-sky-50', text: 'text-[#0284c7]', border: 'border-sky-200', dot: 'bg-[#1D9BF0]' },
  shipped: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500' },
  delivered: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  refused: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
  returned: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
};

const formatMAD = (amount: number) => {
  return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(amount);
};

function OrdersPageContent() {
  const searchParams = useSearchParams();
  const highlightParam = searchParams.get('highlight');
  const orderIdParam = searchParams.get('orderId');
  const orderNumberParam = searchParams.get('orderNumber');
  const tabParam = searchParams.get('tab');
  const searchParam = searchParams.get('search');

  const [orders, setOrders] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [editingOrder, setEditingOrder] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState(searchParam || '');
  const [activeTab, setActiveTab] = useState<string>(tabParam || 'ALL');
  const [cityFilter, setCityFilter] = useState<string>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'UNPAID' | 'PARTIAL' | 'PAID'>('ALL');
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  // Delivery Fee configuration (Default: 35 MAD per order)
  const [shippingFeePerOrder, setShippingFeePerOrder] = useState<number>(35);
  const [estimationMode, setEstimationMode] = useState<'NET' | 'BRUT'>('NET');

  // Advance Payment State in Drawer
  const [advanceAmountInput, setAdvanceAmountInput] = useState<string>('');
  const [advanceMethodInput, setAdvanceMethodInput] = useState<string>('VIREMENT');
  const [advanceNotesInput, setAdvanceNotesInput] = useState<string>('');
  const [isSavingPayment, setIsSavingPayment] = useState<boolean>(false);
  const [paymentSavedMessage, setPaymentSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (editingOrder) {
      setAdvanceAmountInput(String(editingOrder.paidAmount || 0));
      setAdvanceMethodInput(editingOrder.advancePaymentMethod || 'VIREMENT');
      setAdvanceNotesInput(editingOrder.paymentNotes || '');
      setPaymentSavedMessage(null);
    }
  }, [editingOrder?.id, editingOrder?.paidAmount, editingOrder?.advancePaymentMethod, editingOrder?.paymentNotes]);

  // Target Highlight state (Spotlight)
  const [highlightedOrderId, setHighlightedOrderId] = useState<string | null>(null);
  const [highlightCountdown, setHighlightCountdown] = useState<number>(0);
  const [highlightedOrder, setHighlightedOrder] = useState<any | null>(null);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/admin/auth/me');
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      }
    } catch (e) {
      console.error('Failed to fetch current user:', e);
    }
  };

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
        if (editingOrder) {
          const updatedCurrent = data.find((o: any) => o.id === editingOrder.id);
          if (updatedCurrent) setEditingOrder(updatedCurrent);
        }
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchCurrentUser();
  }, []);

  // Detect and Highlight Target Order for 12 seconds with Spotlight
  useEffect(() => {
    const targetKey = highlightParam || orderIdParam || orderNumberParam;
    if (!targetKey || orders.length === 0) return;

    const targetLower = targetKey.toLowerCase().trim();
    const matched = orders.find(
      (o) =>
        o.id === targetKey ||
        (o.orderNumber && o.orderNumber.toLowerCase() === targetLower) ||
        (o.orderNumber && o.orderNumber.toLowerCase().includes(targetLower))
    );

    if (matched) {
      // Ensure target order is visible: reset tabs and city filter
      setActiveTab('ALL');
      setCityFilter('ALL');
      setHighlightedOrderId(matched.id);
      setHighlightedOrder(matched);
      setHighlightCountdown(12);

      // Smooth scroll to the targeted row
      const scrollTimer = setTimeout(() => {
        const rowElement = document.getElementById(`order-row-${matched.id}`);
        if (rowElement) {
          rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 200);

      // 12-second countdown timer
      let remaining = 12;
      const interval = setInterval(() => {
        remaining -= 1;
        setHighlightCountdown(remaining);
        if (remaining <= 0) {
          clearInterval(interval);
          setHighlightedOrderId(null);
          setHighlightedOrder(null);
        }
      }, 1000);

      return () => {
        clearTimeout(scrollTimer);
        clearInterval(interval);
      };
    }
  }, [orders, highlightParam, orderIdParam, orderNumberParam]);

  const handleStatusChange = async (
    orderId: string,
    newStatus: string,
    options?: { carrier?: string; trackingNumber?: string; customNote?: string; actorNameOverride?: string }
  ) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );

    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: orderId,
          status: newStatus,
          carrier: options?.carrier,
          trackingNumber: options?.trackingNumber,
          customNote: options?.customNote,
          actorNameOverride: options?.actorNameOverride || currentUser?.name,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
        if (editingOrder && editingOrder.id === orderId) {
          setEditingOrder(updated);
        }
      }
    } catch (err) {
      console.error('Failed to update order status:', err);
    }
  };

  const handleSavePayment = async (customPaid?: number) => {
    if (!editingOrder) return;
    setIsSavingPayment(true);
    setPaymentSavedMessage(null);

    const amountToSave = customPaid !== undefined 
      ? customPaid 
      : Math.max(0, Number(advanceAmountInput) || 0);

    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingOrder.id,
          paidAmount: amountToSave,
          advancePaymentMethod: advanceMethodInput,
          paymentNotes: advanceNotesInput,
          actorNameOverride: currentUser?.name || 'Admin NAY',
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setOrders((prev) => prev.map((o) => (o.id === editingOrder.id ? updated : o)));
        setEditingOrder(updated);
        setAdvanceAmountInput(String(updated.paidAmount || 0));
        setPaymentSavedMessage('Acompte enregistré avec succès !');
        setTimeout(() => setPaymentSavedMessage(null), 3500);
      }
    } catch (err) {
      console.error('Failed to save payment advance:', err);
    } finally {
      setIsSavingPayment(false);
    }
  };

  const handleQuickAdvance = async (pct: number) => {
    if (!editingOrder) return;
    const total = Number(editingOrder.total) || 0;
    const computed = pct === 100 ? total : Math.round(total * (pct / 100));
    setAdvanceAmountInput(String(computed));
    await handleSavePayment(computed);
  };

  const handleAddTimelineNote = async (note: string, type: string = 'NOTE') => {
    if (!editingOrder) return;
    try {
      const res = await fetch(`/api/admin/orders/${editingOrder.id}/timeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: type,
          title: type === 'CALL_ATTEMPT' ? 'Tentative d\'appel' : 'Note interne',
          description: note,
          actorNameOverride: currentUser?.name || 'Admin NAY',
        }),
      });

      if (res.ok) {
        await fetchOrders();
      }
    } catch (e) {
      console.error('Failed to add timeline note:', e);
    }
  };

  const handleAddAttachment = async (data: { attachmentUrl: string; attachmentName: string; attachmentType: string; description?: string }) => {
    if (!editingOrder) return;
    try {
      const res = await fetch(`/api/admin/orders/${editingOrder.id}/attachment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attachmentUrl: data.attachmentUrl,
          attachmentName: data.attachmentName,
          attachmentType: data.attachmentType,
          description: data.description,
          actorNameOverride: currentUser?.name || 'Admin NAY',
        }),
      });

      if (res.ok) {
        await fetchOrders();
      }
    } catch (e) {
      console.error('Failed to add attachment:', e);
    }
  };

  const getParsedItems = (itemsString: string): OrderItem[] => {
    try {
      return JSON.parse(itemsString || '[]');
    } catch {
      return [];
    }
  };

  const handleCopyRef = (ref: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(ref);
    setCopiedRef(ref);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  // Multi-job profile determination
  const jobProfile: 'CONFIRMATION' | 'PREPARATION' | 'LOGISTICS' | 'SUPPORT' | 'ADMIN_FULL' = useMemo(() => {
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
  }, [currentUser]);

  // Extract unique cities
  const uniqueCities = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => {
      if (o.shippingCity && o.shippingCity.trim()) {
        set.add(o.shippingCity.trim());
      }
    });
    return Array.from(set).sort();
  }, [orders]);

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      ALL: orders.length,
      PENDING: orders.filter((o) => o.status === 'pending').length,
      UNCONFIRMED: orders.filter((o) => o.status === 'unconfirmed').length,
      PROCESSING: orders.filter((o) => o.status === 'processing' || o.status === 'confirmed').length,
      SHIPPED: orders.filter((o) => o.status === 'shipped').length,
      DELIVERED: orders.filter((o) => o.status === 'delivered').length,
      ISSUES: orders.filter((o) => o.status === 'refused' || o.status === 'returned').length,
      TO_CONFIRM_COMBINED: orders.filter((o) => o.status === 'pending' || o.status === 'unconfirmed').length,
    };
  }, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o: any) => {
      const matchesSearch =
        o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        o.customerName.toLowerCase().includes(search.toLowerCase()) ||
        (o.shippingCity && o.shippingCity.toLowerCase().includes(search.toLowerCase())) ||
        (o.customerPhone && o.customerPhone.includes(search));

      if (!matchesSearch) return false;

      if (cityFilter !== 'ALL' && o.shippingCity !== cityFilter) {
        return false;
      }

      if (paymentFilter === 'UNPAID') {
        const paid = Number(o.paidAmount) || 0;
        if (paid > 0) return false;
      } else if (paymentFilter === 'PARTIAL') {
        const paid = Number(o.paidAmount) || 0;
        const total = Number(o.total) || 0;
        if (paid <= 0 || paid >= total) return false;
      } else if (paymentFilter === 'PAID') {
        const paid = Number(o.paidAmount) || 0;
        const total = Number(o.total) || 0;
        if (paid < total || total <= 0) return false;
      }

      if (activeTab === 'ALL') return true;
      if (activeTab === 'PENDING') {
        return jobProfile === 'CONFIRMATION' ? o.status === 'pending' : (o.status === 'pending' || o.status === 'unconfirmed');
      }
      if (activeTab === 'UNCONFIRMED') return o.status === 'unconfirmed';
      if (activeTab === 'PROCESSING') return o.status === 'processing' || o.status === 'confirmed';
      if (activeTab === 'SHIPPED') return o.status === 'shipped';
      if (activeTab === 'DELIVERED') return o.status === 'delivered';
      if (activeTab === 'ISSUES') return o.status === 'refused' || o.status === 'returned';

      return true;
    });
  }, [orders, search, activeTab, cityFilter, paymentFilter, jobProfile]);

  // Key Metrics & Rates
  const totalOrdersCount = orders.length;
  const confirmedCount = useMemo(() => orders.filter(o => o.status === 'processing' || o.status === 'confirmed' || o.status === 'shipped' || o.status === 'delivered').length, [orders]);
  const unconfirmedCount = tabCounts.UNCONFIRMED;
  const deliveredCount = tabCounts.DELIVERED;
  const returnedCount = tabCounts.ISSUES;

  const tauxConfirmation = totalOrdersCount > 0 ? ((confirmedCount / totalOrdersCount) * 100).toFixed(1) : '0';
  const tauxNonConfirmation = totalOrdersCount > 0 ? ((unconfirmedCount / totalOrdersCount) * 100).toFixed(1) : '0';
  const tauxLivraison = totalOrdersCount > 0 ? ((deliveredCount / totalOrdersCount) * 100).toFixed(1) : '0';
  const tauxRetour = totalOrdersCount > 0 ? ((returnedCount / totalOrdersCount) * 100).toFixed(1) : '0';

  const totalRevenue = useMemo(() => orders.reduce((acc, o) => acc + (Number(o.total) || 0), 0), [orders]);
  const deliveredRevenue = useMemo(() => orders.filter(o => o.status === 'delivered').reduce((acc, o) => acc + (Number(o.total) || 0), 0), [orders]);
  const deliverySuccessRate = tabCounts.ALL > 0 ? ((tabCounts.DELIVERED / tabCounts.ALL) * 100).toFixed(1) : '0';

  // Real Financial Estimation & Cashflow Calculations factoring 35 MAD shipping fee
  const financialEstimations = useMemo(() => {
    let totalCashCollectedGross = 0;       // Cash already in bank / collected (Gross)
    let advancesOnActiveOrders = 0;        // Acomptes already received on pending/processing/shipped orders
    let remainingToCollectShippedGross = 0; // Balance to collect on currently shipped parcels (Gross)
    let remainingToCollectProcessingGross = 0; // Balance on confirmed/processing parcels (Gross)
    let countWithAdvance = 0;
    let countPaid100 = 0;
    let deliveredOrdersCount = 0;
    let shippedOrdersCount = 0;
    let processingOrdersCount = 0;

    orders.forEach((o) => {
      const total = Number(o.total) || 0;
      const paid = Math.min(total, Math.max(0, Number(o.paidAmount) || 0));
      const remaining = Math.max(0, total - paid);

      if (paid >= total && total > 0) {
        countPaid100 += 1;
      } else if (paid > 0) {
        countWithAdvance += 1;
      }

      if (o.status === 'delivered') {
        deliveredOrdersCount += 1;
        totalCashCollectedGross += total;
      } else if (o.status !== 'refused' && o.status !== 'returned' && o.status !== 'annule') {
        totalCashCollectedGross += paid;
        if (paid > 0) {
          advancesOnActiveOrders += paid;
        }

        if (o.status === 'shipped') {
          shippedOrdersCount += 1;
          remainingToCollectShippedGross += remaining;
        } else if (o.status === 'processing' || o.status === 'confirmed') {
          processingOrdersCount += 1;
          remainingToCollectProcessingGross += remaining;
        }
      }
    });

    // Delivery costs calculation (35 MAD per delivered / successful order)
    const deliveredShippingFees = deliveredOrdersCount * shippingFeePerOrder;
    const totalCashCollectedNet = Math.max(0, totalCashCollectedGross - deliveredShippingFees);

    // Shipped delivery fees (when delivered)
    const shippedShippingFees = shippedOrdersCount * shippingFeePerOrder;
    const remainingToCollectShippedNet = Math.max(0, remainingToCollectShippedGross - shippedShippingFees);

    // Processing delivery fees
    const processingShippingFees = processingOrdersCount * shippingFeePerOrder;
    const remainingToCollectProcessingNet = Math.max(0, remainingToCollectProcessingGross - processingShippingFees);

    // Historical delivery rate for COD orders
    const historicalDeliveryRate = totalOrdersCount > 0 && deliveredCount + returnedCount > 0
      ? deliveredCount / (deliveredCount + returnedCount)
      : 0.82;

    let expectedFromShippedGross = 0;
    let expectedFromShippedNet = 0;
    let expectedShippedShippingFees = 0;

    orders.filter((o) => o.status === 'shipped').forEach((o) => {
      const total = Number(o.total) || 0;
      const paid = Math.min(total, Math.max(0, Number(o.paidAmount) || 0));
      const remaining = Math.max(0, total - paid);
      const prob = paid > 0 ? 0.98 : historicalDeliveryRate;

      expectedFromShippedGross += remaining * prob;
      expectedShippedShippingFees += shippingFeePerOrder * prob;
      expectedFromShippedNet += Math.max(0, remaining - shippingFeePerOrder) * prob;
    });

    const perfectEstimationGross = Math.round(totalCashCollectedGross + expectedFromShippedGross);
    const perfectEstimationNet = Math.round(totalCashCollectedNet + expectedFromShippedNet);
    const totalShippingFeesIncurredAndExpected = Math.round(deliveredShippingFees + expectedShippedShippingFees);

    return {
      // Gross figures
      totalCashCollectedGross,
      remainingToCollectShippedGross,
      remainingToCollectProcessingGross,
      perfectEstimationGross,

      // Net figures (after 35 MAD delivery fee per order)
      totalCashCollectedNet,
      remainingToCollectShippedNet,
      remainingToCollectProcessingNet,
      perfectEstimationNet,

      // Active advances & counts
      advancesOnActiveOrders,
      countWithAdvance,
      countPaid100,
      deliveredOrdersCount,
      shippedOrdersCount,
      processingOrdersCount,

      // Carrier fees
      deliveredShippingFees,
      shippedShippingFees,
      totalShippingFeesIncurredAndExpected,
      shippingFeePerOrder,

      // Values according to estimationMode ('NET' | 'BRUT')
      displayedCashCollected: estimationMode === 'NET' ? totalCashCollectedNet : totalCashCollectedGross,
      displayedShipped: estimationMode === 'NET' ? remainingToCollectShippedNet : remainingToCollectShippedGross,
      displayedProcessing: estimationMode === 'NET' ? remainingToCollectProcessingNet : remainingToCollectProcessingGross,
      displayedEstimation: estimationMode === 'NET' ? perfectEstimationNet : perfectEstimationGross,
      totalRemainingPipeline: remainingToCollectShippedGross + remainingToCollectProcessingGross,
    };
  }, [orders, totalOrdersCount, deliveredCount, returnedCount, shippingFeePerOrder, estimationMode]);

  // Format WhatsApp Link
  const getWhatsAppLink = (phone: string, customerName: string, orderNumber: string) => {
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '212' + cleanPhone.substring(1);
    }
    const message = encodeURIComponent(`Bonjour ${customerName}, concernant votre commande NAY Parfums #${orderNumber}...`);
    return `https://wa.me/${cleanPhone}?text=${message}`;
  };

  // Profile-specific headers
  const getHeaderInfo = () => {
    switch (jobProfile) {
      case 'CONFIRMATION':
        return {
          badge: 'Confirmation Téléphonique',
          title: 'Validation & Confirmation des Commandes',
          subtitle: 'Appels de confirmation des clients, validation des adresses et suivi des commandes.',
        };
      case 'PREPARATION':
        return {
          badge: 'Préparation & Emballage',
          title: 'Préparation & Packaging des Commandes',
          subtitle: 'Conditionnement soigné des flacons de parfum, emballage et préparation des colis.',
        };
      case 'LOGISTICS':
        return {
          badge: 'Logistique & Transport',
          title: 'Expéditions & Suivi des Livraisons',
          subtitle: 'Remise aux transporteurs (Amana, Cathedis...), bordereaux de livraison et encaissements.',
        };
      case 'SUPPORT':
        return {
          badge: 'Service Client & Support',
          title: 'Suivi des Commandes & Assistance Client',
          subtitle: 'Assistance après-vente, suivi des livraisons et résolutions d\'incidents.',
        };
      default:
        return {
          badge: 'Direction & Logistique',
          title: 'Gestion des Commandes & Expéditions',
          subtitle: 'Suivi en direct des confirmations, de l\'emballage, des livraisons et du chiffre d\'affaires.',
        };
    }
  };

  // Profile-specific status dropdown options
  const getStatusOptions = (profile: string) => {
    switch (profile) {
      case 'CONFIRMATION':
        return [
          { value: 'pending', label: 'En attente' },
          { value: 'unconfirmed', label: 'Non confirmé' },
          { value: 'processing', label: 'Confirmée' },
        ];
      case 'PREPARATION':
        return [
          { value: 'pending', label: 'En attente' },
          { value: 'processing', label: 'À préparer' },
          { value: 'shipped', label: 'Colis prêt / Expédié' },
        ];
      case 'LOGISTICS':
        return [
          { value: 'processing', label: 'À expédier' },
          { value: 'shipped', label: 'En livraison' },
          { value: 'delivered', label: 'Livrée & Encaissée' },
          { value: 'refused', label: 'Refusée' },
          { value: 'returned', label: 'Retour colis' },
        ];
      case 'SUPPORT':
        return [
          { value: 'pending', label: 'En attente' },
          { value: 'unconfirmed', label: 'Non confirmé' },
          { value: 'processing', label: 'En préparation' },
          { value: 'shipped', label: 'En livraison' },
          { value: 'delivered', label: 'Livrée' },
          { value: 'refused', label: 'Refusée' },
          { value: 'returned', label: 'Retour SAV' },
        ];
      default:
        return [
          { value: 'pending', label: 'En attente' },
          { value: 'unconfirmed', label: 'Non confirmé' },
          { value: 'processing', label: 'En préparation' },
          { value: 'shipped', label: 'En livraison' },
          { value: 'delivered', label: 'Livrée & Encaissée' },
          { value: 'refused', label: 'Refusée' },
          { value: 'returned', label: 'Retour' },
        ];
    }
  };

  const getDisplayStatusBadgeLabel = (status: string, profile: string) => {
    if (profile === 'CONFIRMATION') {
      if (status === 'processing' || status === 'confirmed') return 'Confirmée';
      if (status === 'unconfirmed') return 'Non confirmé';
      if (status === 'pending') return 'En attente';
      return STATUS_LABELS[status] || status;
    }
    if (profile === 'PREPARATION') {
      if (status === 'processing' || status === 'confirmed') return 'À préparer / Emballage';
      if (status === 'shipped') return 'Colis prêt / Expédié';
      if (status === 'pending') return 'En attente';
      return STATUS_LABELS[status] || status;
    }
    if (profile === 'LOGISTICS') {
      if (status === 'processing' || status === 'confirmed') return 'À expédier';
      if (status === 'shipped') return 'En cours de livraison';
      if (status === 'delivered') return 'Livrée & Encaissée';
      if (status === 'refused') return 'Refusée';
      if (status === 'returned') return 'Retour colis';
      return STATUS_LABELS[status] || status;
    }
    return STATUS_LABELS[status] || status;
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/90 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-100/70 text-[#0284c7] border border-sky-200">
              {headerInfo.badge}
            </span>
            <span className="text-xs text-slate-400 font-medium">Maison NAY</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ShoppingBag size={22} className="text-[#1D9BF0]" />
            <span>{headerInfo.title}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {headerInfo.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchOrders}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer"
          >
            <RefreshCw size={14} className={`text-slate-500 ${isLoading ? 'animate-spin text-[#1D9BF0]' : ''}`} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* Real-time KPI Cards Tailored to Every Job */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* PROFILE 1: CONFIRMATION */}
        {jobProfile === 'CONFIRMATION' && (
          <>
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-emerald-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Taux de Confirmation</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 size={16} />
                </div>
              </div>
              <div className="text-2xl font-bold text-emerald-600 mt-2">{tauxConfirmation}%</div>
              <div className="text-[11px] text-slate-500 mt-1 font-medium">{confirmedCount} confirmées sur {totalOrdersCount} commandes</div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-rose-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Taux de Non-Confirmation</span>
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Phone size={16} />
                </div>
              </div>
              <div className="text-2xl font-bold text-rose-600 mt-2">{tauxNonConfirmation}%</div>
              <div className="text-[11px] text-slate-500 mt-1 font-medium">{unconfirmedCount} non confirmées / injoignables</div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-indigo-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Taux de Livraison</span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Truck size={16} />
                </div>
              </div>
              <div className="text-2xl font-bold text-indigo-600 mt-2">{tauxLivraison}%</div>
              <div className="text-[11px] text-slate-500 mt-1 font-medium">{deliveredCount} livrées avec succès</div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-amber-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Taux de Retour</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <RotateCcw size={16} />
                </div>
              </div>
              <div className="text-2xl font-bold text-amber-600 mt-2">{tauxRetour}%</div>
              <div className="text-[11px] text-slate-500 mt-1 font-medium">{returnedCount} refus & retours colis</div>
            </div>
          </>
        )}

        {/* PROFILE 2: PREPARATION & PACKAGING */}
        {jobProfile === 'PREPARATION' && (
          <>
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-teal-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Commandes Totales</span>
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <ShoppingBag size={16} />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">{orders.length}</div>
              <div className="text-[11px] text-slate-500 mt-1 font-medium">{tabCounts.PROCESSING} à emballer</div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-sky-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">À Préparer & Emballer</span>
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#1D9BF0] flex items-center justify-center">
                  <Package size={16} />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#0284c7] mt-2">{tabCounts.PROCESSING}</div>
              <div className="text-[11px] text-slate-500 mt-1 font-medium">Commandes confirmées prêtes pour emballage</div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-indigo-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Colis Prêts (Expédiés)</span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Truck size={16} />
                </div>
              </div>
              <div className="text-2xl font-bold text-indigo-600 mt-2">{tabCounts.SHIPPED}</div>
              <div className="text-[11px] text-slate-500 mt-1 font-medium">Remis aux transporteurs</div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-amber-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">En Attente Confirmation</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock size={16} />
                </div>
              </div>
              <div className="text-2xl font-bold text-amber-600 mt-2">{tabCounts.PENDING}</div>
              <div className="text-[11px] text-slate-500 mt-1 font-medium">En attente d'appel client</div>
            </div>
          </>
        )}

        {/* PROFILE 3: SHIPPING & LOGISTICS */}
        {jobProfile === 'LOGISTICS' && (
          <>
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-sky-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Flux Global</span>
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#1D9BF0] flex items-center justify-center">
                  <ShoppingBag size={16} />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">{orders.length}</div>
              <div className="text-[11px] text-slate-500 mt-1 font-medium">{tabCounts.SHIPPED} colis en transit</div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-teal-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Prêtes pour Expédition</span>
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <Package size={16} />
                </div>
              </div>
              <div className="text-2xl font-bold text-teal-600 mt-2">{tabCounts.PROCESSING}</div>
              <div className="text-[11px] text-slate-500 mt-1 font-medium">À confier au transporteur</div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-indigo-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">En Cours de Livraison</span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Truck size={16} />
                </div>
              </div>
              <div className="text-2xl font-bold text-indigo-600 mt-2">{tabCounts.SHIPPED}</div>
              <div className="text-[11px] text-slate-500 mt-1 font-medium">Amana, Cathedis, Livreur</div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-emerald-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Livrées avec Succès</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 size={16} />
                </div>
              </div>
              <div className="text-2xl font-bold text-emerald-600 mt-2">{tabCounts.DELIVERED}</div>
              <div className="text-[11px] text-slate-500 mt-1 font-medium">{deliverySuccessRate}% taux de livraison</div>
            </div>
          </>
        )}

        {/* PROFILE 4: CUSTOMER SUPPORT & CRM */}
        {jobProfile === 'SUPPORT' && (
          <>
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-rose-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Dossiers Clients</span>
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <User size={16} />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">{orders.length}</div>
              <div className="text-[11px] text-slate-500 mt-1 font-medium">{tabCounts.ISSUES} litiges / retours</div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-amber-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">En Attente de Contact</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock size={16} />
                </div>
              </div>
              <div className="text-2xl font-bold text-amber-600 mt-2">{tabCounts.PENDING + tabCounts.UNCONFIRMED}</div>
              <div className="text-[11px] text-slate-500 mt-1 font-medium">À relancer par WhatsApp / Appel</div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-indigo-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">En Livraison</span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Truck size={16} />
                </div>
              </div>
              <div className="text-2xl font-bold text-indigo-600 mt-2">{tabCounts.SHIPPED}</div>
              <div className="text-[11px] text-slate-500 mt-1 font-medium">Suivi transporteur</div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-emerald-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Livrées</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 size={16} />
                </div>
              </div>
              <div className="text-2xl font-bold text-emerald-600 mt-2">{tabCounts.DELIVERED}</div>
              <div className="text-[11px] text-slate-500 mt-1 font-medium">Clients satisfaits</div>
            </div>
          </>
        )}

        {/* PROFILE 5: ADMIN FULL (OWNERS / GM / FINANCE) */}
        {jobProfile === 'ADMIN_FULL' && (
          <>
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-sky-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Volume Global</span>
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#1D9BF0] flex items-center justify-center">
                  <ShoppingBag size={16} />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">{orders.length}</div>
              <div className="text-[11px] text-slate-500 mt-1 font-medium">Total: {formatMAD(totalRevenue)}</div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-amber-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">À Confirmer & Préparer</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock size={16} />
                </div>
              </div>
              <div className="text-2xl font-bold text-amber-600 mt-2">{tabCounts.TO_CONFIRM_COMBINED + tabCounts.PROCESSING}</div>
              <div className="text-[11px] text-slate-500 mt-1 font-medium">{tabCounts.TO_CONFIRM_COMBINED} en attente • {tabCounts.PROCESSING} en préparation</div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-indigo-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">En Cours de Livraison</span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Truck size={16} />
                </div>
              </div>
              <div className="text-2xl font-bold text-indigo-600 mt-2">{tabCounts.SHIPPED}</div>
              <div className="text-[11px] text-slate-500 mt-1 font-medium">Colis avec transporteurs (Amana...)</div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-emerald-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Livrées & Encaissées</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 size={16} />
                </div>
              </div>
              <div className="text-2xl font-bold text-emerald-600 mt-2">{tabCounts.DELIVERED}</div>
              <div className="text-[11px] text-slate-500 mt-1 font-medium">
                CA: {formatMAD(deliveredRevenue)} • <span className="text-emerald-700 font-bold">Net: {formatMAD(Math.max(0, deliveredRevenue - (tabCounts.DELIVERED * shippingFeePerOrder)))}</span> (-{tabCounts.DELIVERED * shippingFeePerOrder} DH livr.)
              </div>
            </div>
          </>
        )}

      </div>

      {/* Confirmation Agent Real-time Performance & Activity Summary */}
      {jobProfile === 'CONFIRMATION' && (
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1D9BF0] animate-pulse"></span>
            <span className="font-bold text-slate-900">Activité & Suivi des Appels :</span>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 text-slate-600 font-medium">
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800">
              Total : <strong className="font-bold text-slate-900">{totalOrdersCount}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
              À appeler immédiatement : <strong className="font-bold text-amber-900">{tabCounts.PENDING}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
              Confirmées : <strong className="font-bold text-emerald-900">{confirmedCount}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200">
              Non confirmées : <strong className="font-bold text-rose-900">{unconfirmedCount}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200">
              Livrées : <strong className="font-bold text-indigo-900">{deliveredCount}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
              Retours : <strong className="font-bold text-amber-900">{returnedCount}</strong>
            </span>
          </div>
        </div>
      )}

      {/* 💎 CENTRE D'ESTIMATION FINANCIÈRE & SUIVI DES ACOMPTES (10%, 50%, 100%) */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-xl border border-slate-700/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1D9BF0] to-blue-600 flex items-center justify-center text-white shadow-md shadow-sky-500/25">
              <Calculator size={20} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-base text-white tracking-tight">
                  Centre d'Estimation Financière & Acomptes
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-400/30">
                  Calcul Prévisionnel Parfait
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  <Truck size={11} />
                  <span>Frais Livraison : {shippingFeePerOrder} MAD / colis</span>
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Calcul précis après déduction des {shippingFeePerOrder} MAD de frais de transporteur par commande (Amana, Cathedis).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            {/* Net vs Gross Mode Switch */}
            <div className="flex items-center bg-white/10 p-1 rounded-xl border border-white/10 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setEstimationMode('NET')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  estimationMode === 'NET'
                    ? 'bg-emerald-500 text-white font-bold shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Vue Nette (-{shippingFeePerOrder} DH livr.)
              </button>
              <button
                type="button"
                onClick={() => setEstimationMode('BRUT')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  estimationMode === 'BRUT'
                    ? 'bg-sky-500 text-white font-bold shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Vue Brute (Client)
              </button>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                <strong className="text-white font-bold">{financialEstimations.countWithAdvance}</strong> avec acompte • <strong className="text-white font-bold">{financialEstimations.countPaid100}</strong> payées 100%
              </span>
            </div>
          </div>
        </div>

        {/* 4 Cards Grid of Financial Estimation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative z-10">
          
          {/* 1. Cash Déjà Encaissé */}
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-400/40 transition-colors">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
              <span>{estimationMode === 'NET' ? 'Cash Net Encaissé' : 'Cash Brut Encaissé'}</span>
              <CheckCircle2 size={14} className="text-emerald-400" />
            </div>
            <div className="text-xl font-black text-emerald-400 font-mono mt-1.5">
              {formatMAD(financialEstimations.displayedCashCollected)}
            </div>
            <div className="text-[10.5px] text-slate-300 mt-1 flex flex-col gap-0.5">
              <div className="flex items-center gap-1">
                <span>Dont</span>
                <strong className="text-emerald-300">{formatMAD(financialEstimations.advancesOnActiveOrders)}</strong>
                <span>d'acomptes reçus</span>
              </div>
              <div className="text-[10px] text-slate-400">
                {estimationMode === 'NET' 
                  ? `Brut : ${formatMAD(financialEstimations.totalCashCollectedGross)} (déduit ${formatMAD(financialEstimations.deliveredShippingFees)} livr.)`
                  : `Net réel en caisse : ${formatMAD(financialEstimations.totalCashCollectedNet)}`}
              </div>
            </div>
          </div>

          {/* 2. Solde en Transit */}
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-sky-400/40 transition-colors">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
              <span>{estimationMode === 'NET' ? 'Solde Net en Livraison' : 'Solde Brut en Livraison'}</span>
              <Truck size={14} className="text-[#1D9BF0]" />
            </div>
            <div className="text-xl font-black text-[#1D9BF0] font-mono mt-1.5">
              {formatMAD(financialEstimations.displayedShipped)}
            </div>
            <div className="text-[10.5px] text-slate-300 mt-1 flex flex-col gap-0.5">
              <span>{financialEstimations.shippedOrdersCount} colis en cours avec transporteur</span>
              <div className="text-[10px] text-slate-400">
                {estimationMode === 'NET'
                  ? `Déduit ${shippingFeePerOrder} DH/colis de commission livreur`
                  : `Net transporteur : ${formatMAD(financialEstimations.remainingToCollectShippedNet)}`}
              </div>
            </div>
          </div>

          {/* 3. Solde en Préparation */}
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-amber-400/40 transition-colors">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
              <span>{estimationMode === 'NET' ? 'Solde Net en Préparation' : 'Solde Brut en Préparation'}</span>
              <Clock size={14} className="text-amber-400" />
            </div>
            <div className="text-xl font-black text-amber-300 font-mono mt-1.5">
              {formatMAD(financialEstimations.displayedProcessing)}
            </div>
            <div className="text-[10.5px] text-slate-300 mt-1 flex flex-col gap-0.5">
              <span>{financialEstimations.processingOrdersCount} commandes confirmées à expédier</span>
              <div className="text-[10px] text-slate-400">
                {estimationMode === 'NET'
                  ? `Déduit ${shippingFeePerOrder} DH/colis de livraison future`
                  : `Net marchandise : ${formatMAD(financialEstimations.remainingToCollectProcessingNet)}`}
              </div>
            </div>
          </div>

          {/* 4. ESTIMATION PARFAITE */}
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-600/20 border border-sky-400/40 hover:border-sky-300 transition-colors">
            <div className="flex items-center justify-between text-sky-200 text-[11px] font-bold uppercase tracking-wider">
              <span>Estimation Parfaite {estimationMode === 'NET' ? '(Nette)' : '(Brute)'}</span>
              <Sparkles size={14} className="text-sky-300" />
            </div>
            <div className="text-xl font-black text-white font-mono mt-1.5">
              {formatMAD(financialEstimations.displayedEstimation)}
            </div>
            <div className="text-[10.5px] text-sky-200 mt-1 flex flex-col gap-0.5">
              <span>{estimationMode === 'NET' ? 'Net réel en poche (fiabilité 98% sur acomptes)' : 'Brut prévisionnel facturé (98% sur acomptes)'}</span>
              <div className="text-[10px] text-sky-300/80">
                {estimationMode === 'NET'
                  ? `Frais transporteurs totaux déduits : -${formatMAD(financialEstimations.totalShippingFeesIncurredAndExpected)}`
                  : `Estimation Nette réelle : ${formatMAD(financialEstimations.perfectEstimationNet)}`}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Filter Tabs Bar with Status Colors */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-1 overflow-x-auto custom-scrollbar">
        {(jobProfile === 'CONFIRMATION' ? [
          { id: 'ALL', label: 'Toutes', count: tabCounts.ALL, activeBg: 'bg-slate-900 text-white' },
          { id: 'PENDING', label: 'En attente', count: tabCounts.PENDING, activeBg: 'bg-amber-500 text-white' },
          { id: 'UNCONFIRMED', label: 'Non confirmées', count: tabCounts.UNCONFIRMED, activeBg: 'bg-rose-500 text-white' },
          { id: 'PROCESSING', label: 'Confirmées', count: tabCounts.PROCESSING, activeBg: 'bg-[#1D9BF0] text-white' },
        ] : jobProfile === 'PREPARATION' ? [
          { id: 'ALL', label: 'Toutes', count: tabCounts.ALL, activeBg: 'bg-slate-900 text-white' },
          { id: 'PROCESSING', label: 'À Préparer', count: tabCounts.PROCESSING, activeBg: 'bg-teal-600 text-white' },
          { id: 'SHIPPED', label: 'Colis Prêts', count: tabCounts.SHIPPED, activeBg: 'bg-indigo-600 text-white' },
          { id: 'PENDING', label: 'En attente', count: tabCounts.PENDING, activeBg: 'bg-amber-500 text-white' },
        ] : jobProfile === 'LOGISTICS' ? [
          { id: 'ALL', label: 'Toutes', count: tabCounts.ALL, activeBg: 'bg-slate-900 text-white' },
          { id: 'PROCESSING', label: 'À Expédier', count: tabCounts.PROCESSING, activeBg: 'bg-teal-600 text-white' },
          { id: 'SHIPPED', label: 'En Livraison', count: tabCounts.SHIPPED, activeBg: 'bg-indigo-600 text-white' },
          { id: 'DELIVERED', label: 'Livrées', count: tabCounts.DELIVERED, activeBg: 'bg-emerald-600 text-white' },
          { id: 'ISSUES', label: 'Refus & Retours', count: tabCounts.ISSUES, activeBg: 'bg-rose-600 text-white' },
        ] : jobProfile === 'SUPPORT' ? [
          { id: 'ALL', label: 'Toutes', count: tabCounts.ALL, activeBg: 'bg-slate-900 text-white' },
          { id: 'PENDING', label: 'En attente', count: tabCounts.PENDING, activeBg: 'bg-amber-500 text-white' },
          { id: 'SHIPPED', label: 'En Livraison', count: tabCounts.SHIPPED, activeBg: 'bg-indigo-600 text-white' },
          { id: 'DELIVERED', label: 'Livrées', count: tabCounts.DELIVERED, activeBg: 'bg-emerald-600 text-white' },
          { id: 'ISSUES', label: 'Réclamations & Retours', count: tabCounts.ISSUES, activeBg: 'bg-rose-600 text-white' },
        ] : [
          { id: 'ALL', label: 'Toutes', count: tabCounts.ALL, activeBg: 'bg-slate-900 text-white' },
          { id: 'PENDING', label: 'À Confirmer', count: tabCounts.TO_CONFIRM_COMBINED, activeBg: 'bg-amber-500 text-white' },
          { id: 'PROCESSING', label: 'En Préparation', count: tabCounts.PROCESSING, activeBg: 'bg-[#1D9BF0] text-white' },
          { id: 'SHIPPED', label: 'En Livraison', count: tabCounts.SHIPPED, activeBg: 'bg-indigo-600 text-white' },
          { id: 'DELIVERED', label: 'Livrées & Encaissées', count: tabCounts.DELIVERED, activeBg: 'bg-emerald-600 text-white' },
          { id: 'ISSUES', label: 'Refus & Retours', count: tabCounts.ISSUES, activeBg: 'bg-rose-600 text-white' },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              activeTab === tab.id
                ? `${tab.activeBg} shadow-2xs`
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${
              activeTab === tab.id
                ? 'bg-white/20 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search & City Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
        
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par n° commande, nom client, ville, téléphone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-8 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#1D9BF0] focus:ring-2 focus:ring-[#1D9BF0]/15 transition-all font-medium"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filters Group */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Payment / Advance Filter */}
          <div className="flex items-center gap-1.5">
            <CreditCard size={14} className="text-slate-400 shrink-0" />
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as any)}
              className="text-xs bg-slate-50/70 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:bg-white focus:outline-none focus:border-[#1D9BF0] cursor-pointer font-medium"
            >
              <option value="ALL">Tous les règlements</option>
              <option value="PARTIAL">Avec Acompte (10%, 50%...)</option>
              <option value="PAID">Payées à 100%</option>
              <option value="UNPAID">Paiement à la livraison (0%)</option>
            </select>
          </div>

          {/* City Filter */}
          <div className="flex items-center gap-1.5">
            <MapPin size={14} className="text-slate-400 shrink-0" />
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="text-xs bg-slate-50/70 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:bg-white focus:outline-none focus:border-[#1D9BF0] cursor-pointer font-medium"
            >
              <option value="ALL">Toutes les villes ({uniqueCities.length})</option>
              {uniqueCities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>

      </div>

      {/* Active Target Order Luxury Spotlight Banner */}
      {highlightedOrderId && (
        <div className="relative overflow-hidden rounded-2xl border border-sky-400/50 dark:border-sky-500/40 bg-gradient-to-r from-slate-900/95 via-sky-950/95 to-slate-900/95 text-white p-4 sm:p-4.5 shadow-2xl shadow-sky-500/15 backdrop-blur-2xl animate-in fade-in slide-in-from-top-3 duration-300 ring-1 ring-sky-400/25">
          {/* Subtle Ambient Decorative Glows */}
          <div className="pointer-events-none absolute -top-12 -left-12 w-48 h-48 bg-[#0ea5e9]/20 rounded-full blur-3xl animate-pulse" />
          <div className="pointer-events-none absolute -bottom-12 -right-12 w-48 h-48 bg-blue-500/15 rounded-full blur-3xl" />
          
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Left: Creative Radar Icon & Live Summary */}
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="relative flex items-center justify-center shrink-0">
                <span className="absolute inline-flex h-10 w-10 rounded-2xl bg-sky-400/40 animate-ping" />
                <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0ea5e9] via-sky-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-sky-500/35 border border-sky-200/40">
                  <Target size={19} className="animate-spin" style={{ animationDuration: '8s' }} />
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-black tracking-wider bg-sky-400/20 text-sky-300 border border-sky-400/30 flex items-center gap-1 shadow-2xs">
                    <Sparkles size={10} />
                    <span>Focus Commande</span>
                  </span>
                  {highlightedOrder ? (
                    <>
                      <span className="font-mono font-black text-sm text-white tracking-wide bg-white/10 px-2 py-0.5 rounded-lg border border-white/10">
                        {highlightedOrder.orderNumber}
                      </span>
                      <span className="text-xs text-slate-200 font-semibold truncate">
                        • {highlightedOrder.customerName}
                      </span>
                      {highlightedOrder.shippingCity && (
                        <span className="text-[11px] text-sky-300 font-medium">
                          ({highlightedOrder.shippingCity})
                        </span>
                      )}
                      <span className="text-xs font-black text-emerald-400 ml-1">
                        {formatMAD(highlightedOrder.total)}
                      </span>
                    </>
                  ) : (
                    <span className="font-mono font-bold text-xs text-white">
                      Localisation de la commande...
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-300 font-medium mt-1 flex items-center gap-1.5 flex-wrap">
                  <span>Ligne mise en valeur avec illumination saphir dans la liste ci-dessous.</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-sky-300 font-semibold">Centrage automatique</span>
                </p>
              </div>
            </div>

            {/* Right: Quick Action, Timer & Dismiss */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              {highlightedOrder && (
                <button
                  type="button"
                  onClick={() => setEditingOrder(highlightedOrder)}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#0ea5e9] to-blue-600 hover:from-[#0284c7] hover:to-blue-700 text-white font-bold text-xs shadow-md shadow-sky-500/25 flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105 active:scale-95"
                >
                  <Eye size={13} />
                  <span>Ouvrir la fiche</span>
                </button>
              )}

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 font-mono font-bold text-xs text-sky-200 shadow-2xs">
                <Clock size={12} className="text-sky-400 animate-pulse" />
                <span>{highlightCountdown}s</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setHighlightedOrderId(null);
                  setHighlightedOrder(null);
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                title="Fermer le focus"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Orders Table Container */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            
            {/* Table Header */}
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5">Référence & Date</th>
                <th className="px-5 py-3.5">Client & Contact</th>
                <th className="px-5 py-3.5">Ville & Destination</th>
                <th className="px-5 py-3.5">Articles</th>
                <th className="px-5 py-3.5">Étape & Avancement</th>
                <th className="px-5 py-3.5">Total TTC</th>
                <th className="px-5 py-3.5">Statut</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw size={20} className="animate-spin text-[#1D9BF0]" />
                      <span className="text-xs font-medium">Chargement des commandes...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ShoppingBag size={28} className="text-slate-300" />
                      <span className="font-semibold text-slate-700 text-sm">Aucune commande trouvée</span>
                      <p className="text-xs text-slate-400 max-w-sm">
                        Modifiez votre recherche ou vos filtres pour afficher des résultats.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const parsedItems = getParsedItems(order.items);
                  const itemsCount = parsedItems.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0);
                  const formattedDate = new Date(order.createdAt).toLocaleDateString('fr-MA', {
                    timeZone: 'Africa/Casablanca',
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  const stConfig = STATUS_CLASSES[order.status] || STATUS_CLASSES.pending;
                  const isTargetHighlighted = highlightedOrderId === order.id;

                  return (
                    <tr
                      key={order.id}
                      id={`order-row-${order.id}`}
                      onClick={() => setEditingOrder(order)}
                      className={`transition-all duration-500 cursor-pointer group relative ${
                        isTargetHighlighted
                          ? 'bg-gradient-to-r from-sky-500/20 via-sky-500/10 to-transparent dark:from-sky-500/25 dark:via-sky-500/10 dark:to-transparent ring-2 ring-[#0ea5e9] dark:ring-sky-400 border-l-[5px] border-l-[#0ea5e9] shadow-[0_0_30px_rgba(14,165,233,0.3)] z-10'
                          : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      
                      {/* Ref & Date */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono font-bold transition-all ${
                            isTargetHighlighted
                              ? 'text-[#0ea5e9] dark:text-sky-300 text-sm font-black scale-105 inline-block drop-shadow-[0_0_10px_rgba(14,165,233,0.6)]'
                              : 'text-slate-900 dark:text-white group-hover:text-[#1D9BF0]'
                          }`}>
                            {order.orderNumber}
                          </span>
                          {isTargetHighlighted && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-gradient-to-r from-[#0ea5e9] to-blue-600 text-white font-black text-[10px] uppercase tracking-wider shadow-md shadow-sky-500/30 animate-pulse border border-sky-300/40">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                              <Target size={11} />
                              <span>FOCUS ({highlightCountdown}s)</span>
                            </span>
                          )}
                          <button
                            onClick={(e) => handleCopyRef(order.orderNumber, e)}
                            className="p-1 text-slate-300 hover:text-slate-600 rounded hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100"
                            title="Copier la référence"
                          >
                            {copiedRef === order.orderNumber ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                          </button>
                        </div>
                        <div className={`text-[11px] font-mono mt-0.5 ${isTargetHighlighted ? 'text-sky-600 dark:text-sky-300 font-semibold' : 'text-slate-400'}`}>
                          {formattedDate}
                        </div>
                      </td>

                      {/* Customer with Quick WhatsApp Button */}
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <span>{order.customerName}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                          {order.customerPhone ? (
                            <>
                              <span className="font-mono">{order.customerPhone}</span>
                              <a
                                href={getWhatsAppLink(order.customerPhone, order.customerName, order.orderNumber)}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all text-[10px] font-semibold"
                                title="Contacter sur WhatsApp"
                              >
                                <MessageCircle size={11} />
                                <span>WhatsApp</span>
                              </a>
                            </>
                          ) : (
                            <span className="italic text-slate-400">Sans téléphone</span>
                          )}
                        </div>
                      </td>

                      {/* City */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100/80 border border-slate-200/70 text-slate-700 font-semibold text-xs">
                          <MapPin size={11} className="text-[#1D9BF0]" />
                          <span>{order.shippingCity || 'Casablanca'}</span>
                        </div>
                      </td>

                      {/* Items */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <Package size={13} className="text-slate-400" />
                          <span>{itemsCount} article(s)</span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[140px] mt-0.5">
                          {parsedItems.map(i => i.name).join(', ') || 'Fragrance NAY'}
                        </div>
                      </td>

                      {/* Timeline / Progress Bar */}
                      <td className="px-5 py-3.5">
                        <OrderTimelineStepper
                          status={order.status}
                          timeline={order.timeline || []}
                          compact={true}
                        />
                      </td>

                      {/* Total & Payment Advance Status */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="font-bold text-slate-900 text-xs">
                          {formatMAD(order.total)}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          Net : <strong className="font-mono text-emerald-700">{formatMAD(Math.max(0, (Number(order.total) || 0) - shippingFeePerOrder))}</strong>
                          <span className="text-slate-400"> (-{shippingFeePerOrder} DH livr.)</span>
                        </div>
                        {(() => {
                          const total = Number(order.total) || 0;
                          const paid = Number(order.paidAmount) || 0;
                          const remaining = Math.max(0, total - paid);
                          const pct = total > 0 ? Math.round((paid / total) * 100) : 0;

                          if (paid >= total && total > 0) {
                            return (
                              <div className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 mt-0.5">
                                <CheckCircle2 size={10} />
                                <span>Payé 100% (0 DH solde)</span>
                              </div>
                            );
                          }

                          if (paid > 0) {
                            return (
                              <div className="space-y-0.5 mt-0.5">
                                <div className="inline-flex items-center gap-1 text-[10px] text-sky-800 font-bold bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                                  <span>Acompte : {formatMAD(paid)} ({pct}%)</span>
                                </div>
                                <div className="text-[10px] text-amber-700 font-medium">
                                  Reste : {formatMAD(remaining)}
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div className="inline-flex items-center gap-1 text-[10px] text-slate-600 font-medium bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 mt-0.5">
                              <span>À la livraison (100%)</span>
                            </div>
                          );
                        })()}
                      </td>

                      {/* Status Dropdown */}
                      <td className="px-5 py-3.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-block w-[140px]">
                          <select
                            value={order.status === 'confirmed' ? 'processing' : order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            className={`w-full appearance-none pl-2.5 pr-6 py-1.5 rounded-xl text-[11px] font-bold border cursor-pointer focus:outline-none transition-all ${stConfig.bg} ${stConfig.text} ${stConfig.border}`}
                          >
                            {getStatusOptions(jobProfile).map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown
                            size={12}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60"
                          />
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => setEditingOrder(order)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-[#1D9BF0] text-[#0284c7] hover:text-white border border-sky-200 transition-all font-semibold text-xs cursor-pointer"
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

      {/* Details & Timeline Drawer Modal */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setEditingOrder(null)}
          />

          <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
            
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-slate-200/90 flex items-center justify-between bg-slate-50/50">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-bold text-slate-900 font-mono">
                    #{editingOrder.orderNumber}
                  </h2>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                    STATUS_CLASSES[editingOrder.status]?.bg || 'bg-slate-100'
                  } ${STATUS_CLASSES[editingOrder.status]?.text || 'text-slate-700'} ${
                    STATUS_CLASSES[editingOrder.status]?.border || 'border-slate-200'
                  }`}>
                    {getDisplayStatusBadgeLabel(editingOrder.status, jobProfile)}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                  {new Date(editingOrder.createdAt).toLocaleDateString('fr-MA', {
                    timeZone: 'Africa/Casablanca',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/sav?newClaim=true&orderId=${editingOrder.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition-colors"
                  title="Ouvrir une réclamation SAV pour cette commande"
                >
                  <RotateCcw size={13} className="text-amber-600" />
                  <span>Ouvrir SAV</span>
                </Link>
                <a
                  href={`/invoice/${editingOrder.orderNumber}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
                  title="Imprimer la facture"
                >
                  <Printer size={16} />
                </a>
                <button
                  onClick={() => setEditingOrder(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Drawer Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              
              {/* Timeline Full Stepper */}
              <OrderTimelineFull
                order={editingOrder}
                currentUser={currentUser}
                onUpdateStatus={async (newStatus, options) => {
                  await handleStatusChange(editingOrder.id, newStatus, options);
                }}
                onAddNote={handleAddTimelineNote}
                onAddAttachment={handleAddAttachment}
              />

              {/* Client & Shipping Info Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                
                {/* Client Card */}
                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-2">
                  <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                    <User size={13} className="text-[#1D9BF0]" />
                    <span>Client</span>
                  </div>
                  <div className="font-bold text-slate-900 text-sm">{editingOrder.customerName}</div>
                  
                  {editingOrder.customerPhone && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="font-mono text-slate-600">{editingOrder.customerPhone}</span>
                      <a
                        href={getWhatsAppLink(editingOrder.customerPhone, editingOrder.customerName, editingOrder.orderNumber)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500 text-white text-[11px] font-semibold hover:bg-emerald-600 transition-colors"
                      >
                        <MessageCircle size={12} />
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  )}
                  {editingOrder.customerEmail && (
                    <div className="text-slate-500 text-[11px]">{editingOrder.customerEmail}</div>
                  )}
                </div>

                {/* Delivery Card */}
                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-2">
                  <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                    <MapPin size={13} className="text-[#1D9BF0]" />
                    <span>Destination</span>
                  </div>
                  <div className="font-bold text-slate-900 text-sm">{editingOrder.shippingCity || 'Casablanca'}</div>
                  <div className="text-slate-600 leading-relaxed font-normal">{editingOrder.shippingAddress || 'Adresse client'}</div>
                </div>

              </div>

              {/* 💳 GESTION DES ACOMPTES & RÈGLEMENTS */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-sky-50/40 border border-sky-200/80 shadow-2xs space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#1D9BF0] text-white flex items-center justify-center shadow-xs">
                      <CreditCard size={15} />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs">
                        Règlement & Acomptes Clients
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Gestion des avances (10%, 20%, 50%, 100% ou montant libre)
                      </div>
                    </div>
                  </div>

                  {paymentSavedMessage && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200 animate-in fade-in">
                      <Check size={13} className="text-emerald-600" />
                      <span>{paymentSavedMessage}</span>
                    </span>
                  )}
                </div>

                {/* Progress bar of payment */}
                {(() => {
                  const total = Number(editingOrder.total) || 0;
                  const paid = Math.min(total, Math.max(0, Number(editingOrder.paidAmount) || 0));
                  const remaining = Math.max(0, total - paid);
                  const pct = total > 0 ? Math.round((paid / total) * 100) : 0;

                  return (
                    <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-200/80">
                      <div className="flex justify-between items-center text-xs">
                        <div className="text-slate-600 text-[11px]">
                          Total : <strong className="font-mono text-slate-900 font-bold">{formatMAD(total)}</strong>
                        </div>
                        <div className="text-slate-600 text-[11px]">
                          Encaissé : <strong className="font-mono text-emerald-600 font-bold">{formatMAD(paid)} ({pct}%)</strong>
                        </div>
                        <div className="text-slate-600 text-[11px]">
                          Reste à livrer : <strong className="font-mono text-[#1D9BF0] font-bold">{formatMAD(remaining)}</strong>
                        </div>
                      </div>

                      {/* Visual progress bar */}
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex border border-slate-200/60">
                        <div
                          className="bg-emerald-500 h-full transition-all duration-300"
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                        <div
                          className="bg-sky-400 h-full transition-all duration-300"
                          style={{ width: `${Math.max(0, 100 - pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}

                {/* 1-Click Quick Preset Buttons */}
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center justify-between">
                    <span>Raccourcis Acomptes Rapides (1-Clic) :</span>
                    <span className="text-slate-400 font-normal">Calcul automatique</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[
                      { label: '0% Non payé', pct: 0, bg: 'bg-slate-100 hover:bg-slate-200 text-slate-700' },
                      { label: '10% Acompte', pct: 10, bg: 'bg-sky-100 hover:bg-sky-200 text-[#0284c7]' },
                      { label: '20% Acompte', pct: 20, bg: 'bg-sky-100 hover:bg-sky-200 text-[#0284c7]' },
                      { label: '50% Moitié', pct: 50, bg: 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-bold' },
                      { label: '100% Payé', pct: 100, bg: 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold' },
                    ].map((btn) => (
                      <button
                        key={btn.pct}
                        type="button"
                        onClick={() => handleQuickAdvance(btn.pct)}
                        disabled={isSavingPayment}
                        className={`px-1.5 py-2 rounded-xl text-[11px] font-semibold text-center border border-slate-200/80 transition-all cursor-pointer ${btn.bg} active:scale-95 disabled:opacity-50`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Amount & Payment Details Form */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-200/70">
                  
                  {/* Montant personnalisé */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Montant Encaissé (MAD)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={editingOrder.total}
                      value={advanceAmountInput}
                      onChange={(e) => setAdvanceAmountInput(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#1D9BF0]"
                      placeholder="0"
                    />
                  </div>

                  {/* Mode de règlement */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Canal de Règlement
                    </label>
                    <select
                      value={advanceMethodInput}
                      onChange={(e) => setAdvanceMethodInput(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#1D9BF0]"
                    >
                      <option value="VIREMENT">Virement (CIH, Attijari...)</option>
                      <option value="CASHPLUS">CashPlus / Wafacash</option>
                      <option value="CARTE">Carte Bancaire (CMI)</option>
                      <option value="ESPECES">Espèces en main propre</option>
                      <option value="AUTRE">Autre moyen</option>
                    </select>
                  </div>

                  {/* Note / Référence */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Réf / Note de virement
                    </label>
                    <input
                      type="text"
                      value={advanceNotesInput}
                      onChange={(e) => setAdvanceNotesInput(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#1D9BF0]"
                      placeholder="Ex: Virement CIH #129..."
                    />
                  </div>

                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => handleSavePayment()}
                    disabled={isSavingPayment}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1D9BF0] hover:bg-[#1A8CD8] active:scale-95 text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {isSavingPayment ? (
                      <RefreshCw size={13} className="animate-spin" />
                    ) : (
                      <Check size={13} />
                    )}
                    <span>Valider & Enregistrer l'Acompte</span>
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="pt-4 border-t border-slate-100">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-3 flex items-center gap-1.5">
                  <Package size={13} className="text-[#1D9BF0]" />
                  <span>Articles Commandés</span>
                </div>
                <div className="space-y-2">
                  {getParsedItems(editingOrder.items).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-200/60">
                      <div>
                        <div className="font-semibold text-slate-900 text-xs">{item.name}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {item.size ? `Format: ${item.size} • ` : ''}Quantité: {item.quantity}
                        </div>
                      </div>
                      <div className="font-bold text-slate-900 text-xs">
                        {formatMAD((item.price || 0) * (item.quantity || 1))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Summary */}
              {(() => {
                const total = Number(editingOrder.total) || 0;
                const paid = Math.min(total, Math.max(0, Number(editingOrder.paidAmount) || 0));
                const remaining = Math.max(0, total - paid);
                const isPaidFull = paid >= total && total > 0;
                const netProductRevenue = Math.max(0, total - shippingFeePerOrder);

                return (
                  <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3 shadow-lg shadow-slate-900/10">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs text-slate-400">
                          {isPaidFull ? 'Commande Entièrement Payée' : 'Reste à encaisser à la livraison (Livreur)'}
                        </span>
                        <p className="text-lg font-bold text-white mt-0.5 font-mono">
                          {formatMAD(remaining)}
                        </p>
                        {paid > 0 && (
                          <div className="text-[11px] text-emerald-400 mt-0.5 font-medium">
                            ✓ Acompte de {formatMAD(paid)} déjà perçu ({Math.round((paid / total) * 100)}%)
                          </div>
                        )}
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                        isPaidFull
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : paid > 0
                          ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}>
                        {isPaidFull
                          ? 'Payé 100%'
                          : paid > 0
                          ? `Acompte Versé (${Math.round((paid / total) * 100)}%)`
                          : 'Paiement Cash à la livraison'}
                      </span>
                    </div>

                    {/* Breakdown with 35 MAD delivery fee */}
                    <div className="pt-2.5 border-t border-slate-800 text-[11px] space-y-1 text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total payé par le client :</span>
                        <span className="font-mono text-white">{formatMAD(total)}</span>
                      </div>
                      <div className="flex justify-between text-rose-300">
                        <span>Frais transporteur livraison :</span>
                        <span className="font-mono">-{formatMAD(shippingFeePerOrder)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-emerald-400 pt-1.5 border-t border-slate-800/80">
                        <span>Net Boutique (Marchandise) :</span>
                        <span className="font-mono text-sm">{formatMAD(netProductRevenue)}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-slate-400">
          <RefreshCw size={24} className="animate-spin text-[#1D9BF0]" />
          <span className="text-xs font-semibold text-slate-600">Chargement de la gestion des commandes...</span>
        </div>
      }
    >
      <OrdersPageContent />
    </Suspense>
  );
}

