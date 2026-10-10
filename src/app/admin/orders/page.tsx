'use client';

import React, { useState, useEffect, useMemo, Suspense, useRef } from 'react';
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
  Calculator,
  ShieldCheck,
  ShieldAlert,
  Send,
  FileSpreadsheet,
  CheckSquare,
  Square,
  FileText,
  SlidersHorizontal,
  ChevronRight,
  QrCode,
  DollarSign,
  HelpCircle,
  Share2
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
  pending: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200/90', dot: 'bg-amber-500' },
  unconfirmed: { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200/90', dot: 'bg-rose-500' },
  processing: { bg: 'bg-sky-50', text: 'text-[#0284c7]', border: 'border-sky-200/90', dot: 'bg-[#1D9BF0]' },
  shipped: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200/90', dot: 'bg-indigo-500' },
  delivered: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200/90', dot: 'bg-emerald-500' },
  refused: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200/90', dot: 'bg-rose-500' },
  returned: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200/90', dot: 'bg-rose-500' },
};

const TOP_MOROCCAN_CITIES = ['Casablanca', 'Rabat', 'Marrakech', 'Tanger', 'Fès', 'Agadir', 'Salé', 'Meknès'];

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

  // View switch: 'OPERATIONAL' vs 'FINANCIAL' (Executive ribbon)
  const [executiveView, setExecutiveView] = useState<'OPERATIONAL' | 'FINANCIAL'>('OPERATIONAL');

  // Delivery Fee configuration (Default: 35 MAD per order)
  const [shippingFeePerOrder, setShippingFeePerOrder] = useState<number>(35);
  const [estimationMode, setEstimationMode] = useState<'NET' | 'BRUT'>('NET');

  // Multi-Selection State for Bulk Actions
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState<boolean>(false);


  // WhatsApp Presets Dropdown Open State (orderId -> boolean)
  const [openWhatsAppMenuId, setOpenWhatsAppMenuId] = useState<string | null>(null);

  // Advance Payment State in Drawer
  const [advanceAmountInput, setAdvanceAmountInput] = useState<string>('');
  const [advanceMethodInput, setAdvanceMethodInput] = useState<string>('VIREMENT');
  const [advanceNotesInput, setAdvanceNotesInput] = useState<string>('');
  const [carrierInput, setCarrierInput] = useState<string>('Cathedis');
  const [trackingInput, setTrackingInput] = useState<string>('');
  const [isSavingPayment, setIsSavingPayment] = useState<boolean>(false);
  const [paymentSavedMessage, setPaymentSavedMessage] = useState<string | null>(null);

  // Target Highlight state (Spotlight)
  const [highlightedOrderId, setHighlightedOrderId] = useState<string | null>(null);
  const [highlightCountdown, setHighlightCountdown] = useState<number>(0);
  const [highlightedOrder, setHighlightedOrder] = useState<any | null>(null);

  useEffect(() => {
    if (editingOrder) {
      setAdvanceAmountInput(String(editingOrder.paidAmount || 0));
      setAdvanceMethodInput(editingOrder.advancePaymentMethod || 'VIREMENT');
      setAdvanceNotesInput(editingOrder.paymentNotes || '');
      setCarrierInput(editingOrder.carrier || 'Cathedis');
      setTrackingInput(editingOrder.trackingNumber || '');
      setPaymentSavedMessage(null);
    }
  }, [editingOrder?.id, editingOrder?.paidAmount, editingOrder?.advancePaymentMethod, editingOrder?.paymentNotes, editingOrder?.carrier, editingOrder?.trackingNumber]);

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

  // Close WhatsApp dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.whatsapp-dropdown-container')) {
        setOpenWhatsAppMenuId(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
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
      setActiveTab('ALL');
      setCityFilter('ALL');
      setHighlightedOrderId(matched.id);
      setHighlightedOrder(matched);
      setHighlightCountdown(12);

      const scrollTimer = setTimeout(() => {
        const rowElement = document.getElementById(`order-row-${matched.id}`);
        if (rowElement) {
          rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 200);

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
          carrier: carrierInput,
          trackingNumber: trackingInput,
          actorNameOverride: currentUser?.name || 'Admin NAY',
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setOrders((prev) => prev.map((o) => (o.id === editingOrder.id ? updated : o)));
        setEditingOrder(updated);
        setAdvanceAmountInput(String(updated.paidAmount || 0));
        setPaymentSavedMessage('Modifications enregistrées avec succès !');
        setTimeout(() => setPaymentSavedMessage(null), 3500);
      }
    } catch (err) {
      console.error('Failed to save payment advance:', err);
    } finally {
      setIsSavingPayment(false);
    }
  };

  const handleQuickAmount = async (amount: number) => {
    if (!editingOrder) return;
    const total = Number(editingOrder.total) || 0;
    const computed = Math.max(0, Math.min(total, amount));
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
          title: type === 'CALL_ATTEMPT' ? 'Tentative d\'appel client' : 'Note interne',
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
  const tauxLivraison = totalOrdersCount > 0 ? ((deliveredCount / totalOrdersCount) * 100).toFixed(1) : '0';
  const tauxRetour = totalOrdersCount > 0 ? ((returnedCount / totalOrdersCount) * 100).toFixed(1) : '0';

  const totalRevenue = useMemo(() => orders.reduce((acc, o) => acc + (Number(o.total) || 0), 0), [orders]);
  const deliveredRevenue = useMemo(() => orders.filter(o => o.status === 'delivered').reduce((acc, o) => acc + (Number(o.total) || 0), 0), [orders]);

  // Financial Estimations factoring 35 MAD delivery fee
  const financialEstimations = useMemo(() => {
    let totalCashCollectedGross = 0;
    let advancesOnActiveOrders = 0;
    let remainingToCollectShippedGross = 0;
    let remainingToCollectProcessingGross = 0;
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

    const deliveredShippingFees = deliveredOrdersCount * shippingFeePerOrder;
    const totalCashCollectedNet = Math.max(0, totalCashCollectedGross - deliveredShippingFees);

    const shippedShippingFees = shippedOrdersCount * shippingFeePerOrder;
    const remainingToCollectShippedNet = Math.max(0, remainingToCollectShippedGross - shippedShippingFees);

    const processingShippingFees = processingOrdersCount * shippingFeePerOrder;
    const remainingToCollectProcessingNet = Math.max(0, remainingToCollectProcessingGross - processingShippingFees);

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
      totalCashCollectedGross,
      remainingToCollectShippedGross,
      remainingToCollectProcessingGross,
      perfectEstimationGross,
      totalCashCollectedNet,
      remainingToCollectShippedNet,
      remainingToCollectProcessingNet,
      perfectEstimationNet,
      advancesOnActiveOrders,
      countWithAdvance,
      countPaid100,
      deliveredOrdersCount,
      shippedOrdersCount,
      processingOrdersCount,
      deliveredShippingFees,
      shippedShippingFees,
      totalShippingFeesIncurredAndExpected,
      shippingFeePerOrder,
      displayedCashCollected: estimationMode === 'NET' ? totalCashCollectedNet : totalCashCollectedGross,
      displayedShipped: estimationMode === 'NET' ? remainingToCollectShippedNet : remainingToCollectShippedGross,
      displayedProcessing: estimationMode === 'NET' ? remainingToCollectProcessingNet : remainingToCollectProcessingGross,
      displayedEstimation: estimationMode === 'NET' ? perfectEstimationNet : perfectEstimationGross,
      totalRemainingPipeline: remainingToCollectShippedGross + remainingToCollectProcessingGross,
    };
  }, [orders, totalOrdersCount, deliveredCount, returnedCount, shippingFeePerOrder, estimationMode]);

  // Moroccan WhatsApp Smart Presets Builder
  const getWhatsAppPresetUrl = (
    phone: string,
    customerName: string,
    orderNumber: string,
    itemsText: string,
    city: string,
    total: number,
    paid: number,
    presetType: 'CONFIRM' | 'ADVANCE' | 'SHIPPED' | 'LOCATION' | 'UNREACHABLE'
  ) => {
    let cleanPhone = (phone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '212' + cleanPhone.substring(1);
    }
    const remaining = Math.max(0, total - paid);

    let text = '';
    switch (presetType) {
      case 'CONFIRM':
        text = `Salam ${customerName} ✨ C'est Maison NAY Parfums concernant votre commande #${orderNumber} (${itemsText}). Nous préparons votre colis pour ${city || 'votre ville'}. Merci de nous confirmer si vous êtes disponible pour recevoir votre commande cette semaine ? Belle journée !`;
        break;
      case 'ADVANCE':
        text = `Salam ${customerName} ✨ Merci pour votre commande NAY Parfums #${orderNumber}. Afin de valider l'expédition prioritaire de votre flacon de parfum, un acompte de sécurité de 50 DH (ou 100 DH) est souhaité.\n\nRIB CIH : 230 780 4567890123 45 (NAY PARFUMS)\nOu par Wafacash / CashPlus.\n\nMerci de nous transmettre le reçu de versement ici.`;
        break;
      case 'SHIPPED':
        text = `Salam ${customerName} 🚚 Votre commande Maison NAY Parfums #${orderNumber} est en route avec notre livreur pour ${city || 'votre ville'} !\n\nMontant exact à préparer en espèces à la livraison : *${remaining} MAD*${paid > 0 ? ` (Acompte de ${paid} MAD déjà déduit)` : ''}.\n\nMerci de garder votre téléphone joignable !`;
        break;
      case 'LOCATION':
        text = `Salam ${customerName} 📍 Notre livreur est en tournée aujourd'hui à ${city || 'votre ville'}. Pourriez-vous svp nous partager votre localisation GPS WhatsApp pour vous livrer directement à votre porte ? Merci beaucoup !`;
        break;
      case 'UNREACHABLE':
        text = `Salam ${customerName} 📞 Nous avons essayé de vous joindre par téléphone au sujet de votre commande NAY Parfums #${orderNumber}, sans succès.\n\nMerci de nous répondre ou de nous rappeler au plus vite afin de maintenir votre commande active avant son annulation automatique.`;
        break;
    }

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  // Anti-RTS / Customer Trust Scoring
  const getCustomerTrustScore = (order: any) => {
    const paid = Number(order.paidAmount) || 0;
    const total = Number(order.total) || 0;
    const phone = (order.customerPhone || '').replace(/[^0-9]/g, '');

    if (paid >= total && total > 0) {
      return { label: 'Client VIP', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: ShieldCheck, desc: '100% Réglé • Risque 0%' };
    }
    if (paid > 0) {
      return { label: 'Acompte Sécurisé', badge: 'bg-teal-50 text-teal-800 border-teal-200', icon: ShieldCheck, desc: 'Acompte versé • Fiabilité 98%' };
    }
    if (order.status === 'processing' || order.status === 'confirmed') {
      return { label: 'Confirmé', badge: 'bg-sky-50 text-sky-800 border-sky-200', icon: CheckCircle2, desc: 'Appel validé' };
    }
    if (phone.length < 9) {
      return { label: 'N° Incomplet', badge: 'bg-rose-50 text-rose-800 border-rose-200', icon: ShieldAlert, desc: 'Téléphone à vérifier' };
    }
    if (order.status === 'unconfirmed') {
      return { label: 'Injoignable', badge: 'bg-amber-50 text-amber-800 border-amber-200', icon: AlertTriangle, desc: 'Tentative infructueuse' };
    }
    return { label: 'Nouveau Prospect', badge: 'bg-slate-100 text-slate-700 border-slate-200', icon: User, desc: 'À confirmer' };
  };

  // Bulk Selection Handlers
  const handleToggleSelectAll = () => {
    if (selectedOrderIds.length === filteredOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map((o) => o.id));
    }
  };

  const handleToggleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Bulk Status Update (1-Click confirmation or shipping)
  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedOrderIds.length === 0) return;
    setIsBulkProcessing(true);
    try {
      await Promise.all(
        selectedOrderIds.map((id) =>
          handleStatusChange(id, newStatus, { customNote: `Mise à jour groupée en lot (${newStatus})` })
        )
      );
      setSelectedOrderIds([]);
    } catch (e) {
      console.error('Bulk update error:', e);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // Export Orders CSV (Excel / Logistics standard format)
  const handleExportOrdersCSV = () => {
    const ordersToExport = selectedOrderIds.length > 0
      ? orders.filter((o) => selectedOrderIds.includes(o.id))
      : filteredOrders;

    if (ordersToExport.length === 0) return;

    const headers = [
      'Ref Commande',
      'Date',
      'Nom Client',
      'Telephone',
      'Ville',
      'Adresse Complete',
      'Articles Details',
      'Montant Total (MAD)',
      'Acompte Recu (MAD)',
      'MONTANT A ENCAISSER COD (MAD)',
      'Transporteur Prevu',
      'Statut Commande',
      'Fragile'
    ];

    const rows = ordersToExport.map((o) => {
      const parsed = getParsedItems(o.items);
      const itemsStr = parsed.map((i) => `${i.quantity}x ${i.name} ${i.size || ''}`).join(' + ');
      const total = Number(o.total) || 0;
      const paid = Math.min(total, Math.max(0, Number(o.paidAmount) || 0));
      const remaining = Math.max(0, total - paid);

      return [
        `"${o.orderNumber}"`,
        `"${new Date(o.createdAt).toLocaleDateString('fr-MA')}"`,
        `"${(o.customerName || '').replace(/"/g, '""')}"`,
        `"${o.customerPhone || ''}"`,
        `"${(o.shippingCity || 'Casablanca').replace(/"/g, '""')}"`,
        `"${(o.shippingAddress || '').replace(/"/g, '""')}"`,
        `"${itemsStr.replace(/"/g, '""')}"`,
        total,
        paid,
        remaining,
        `"${o.carrier || 'Cathedis'}"`,
        `"${STATUS_LABELS[o.status] || o.status}"`,
        '"OUI (Flacons Parfum)"'
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const today = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `Export_Commandes_Maison_NAY_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Status options per job profile
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24">
      
      {/* ========================================================= */}
      {/* 1. TOP HEADER: LUXURY MAISON NAY BRANDING & ACTIONS       */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/90 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-900 text-amber-300 border border-slate-800 shadow-2xs">
              Maison NAY • Haute Parfumerie
            </span>
            <span className="text-xs text-slate-400 font-medium">Casablanca & Tout le Maroc</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
            <ShoppingBag size={22} className="text-amber-500" />
            <span>Gestion des Commandes & Expéditions</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Centre de commande exécutif : validation express, acomptes, suivi des expéditions et prévisions nettes.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={fetchOrders}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 text-xs font-bold text-slate-700 shadow-2xs transition-all cursor-pointer hover:border-slate-300"
          >
            <RefreshCw size={14} className={`text-slate-500 ${isLoading ? 'animate-spin text-[#1D9BF0]' : ''}`} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. UNIFIED EXECUTIVE COMMAND RIBBON (NO MORE BULKY DUAL CARDS) */}
      {/* ========================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-4">
        
        {/* Ribbon Switcher Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 max-w-fit">
            <button
              type="button"
              onClick={() => setExecutiveView('OPERATIONAL')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                executiveView === 'OPERATIONAL'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package size={13} className="text-[#1D9BF0]" />
              <span>Flux Opérationnel</span>
            </button>
            <button
              type="button"
              onClick={() => setExecutiveView('FINANCIAL')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                executiveView === 'FINANCIAL'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calculator size={13} className="text-amber-400" />
              <span>Trésorerie & Marges Nettes</span>
            </button>
          </div>

          {/* Quick Carrier Fee Info Pill & Gross/Net Switch */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {executiveView === 'FINANCIAL' && (
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/60 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setEstimationMode('NET')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    estimationMode === 'NET'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Vue Nette (-{shippingFeePerOrder} DH)
                </button>
                <button
                  type="button"
                  onClick={() => setEstimationMode('BRUT')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    estimationMode === 'BRUT'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Vue Brute Client
                </button>
              </div>
            )}

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50/80 border border-amber-200 text-amber-900 text-[11px] font-semibold">
              <Truck size={12} className="text-amber-600 shrink-0" />
              <span>Frais livreur : <strong className="font-bold">{shippingFeePerOrder} MAD</strong> / commande</span>
            </div>

            <div className="text-[11px] text-slate-500 font-medium">
              Acomptes : <strong className="text-slate-900 font-bold">{financialEstimations.countWithAdvance}</strong> versés • <strong className="text-slate-900 font-bold">{financialEstimations.countPaid100}</strong> payées 100%
            </div>
          </div>
        </div>

        {/* Dynamic Executive Cards Grid */}
        {executiveView === 'OPERATIONAL' ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            
            {/* Card 1: Volume Global */}
            <div className="bg-slate-50/70 p-3.5 sm:p-4 rounded-xl border border-slate-200/70">
              <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <span>Volume Total</span>
                <ShoppingBag size={14} className="text-slate-400" />
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{orders.length}</div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                <span>Valeur brute :</span>
                <strong className="text-slate-800 font-mono">{formatMAD(totalRevenue)}</strong>
              </div>
            </div>

            {/* Card 2: À Valider Express */}
            <div className="bg-amber-50/50 p-3.5 sm:p-4 rounded-xl border border-amber-200/70">
              <div className="flex items-center justify-between text-amber-800 text-[11px] font-bold uppercase tracking-wider">
                <span>À Confirmer & Préparer</span>
                <Clock size={14} className="text-amber-600" />
              </div>
              <div className="text-2xl font-black text-amber-700 mt-1 font-mono">
                {tabCounts.TO_CONFIRM_COMBINED + tabCounts.PROCESSING}
              </div>
              <div className="text-[11px] text-amber-800/80 mt-1 flex items-center justify-between">
                <span>{tabCounts.TO_CONFIRM_COMBINED} appels</span>
                <span>• {tabCounts.PROCESSING} en boîte</span>
              </div>
            </div>

            {/* Card 3: En Cours avec Livreur */}
            <div className="bg-indigo-50/50 p-3.5 sm:p-4 rounded-xl border border-indigo-200/70">
              <div className="flex items-center justify-between text-indigo-800 text-[11px] font-bold uppercase tracking-wider">
                <span>En Livraison (Transit)</span>
                <Truck size={14} className="text-indigo-600" />
              </div>
              <div className="text-2xl font-black text-indigo-700 mt-1 font-mono">{tabCounts.SHIPPED}</div>
              <div className="text-[11px] text-indigo-800/80 mt-1 flex items-center justify-between">
                <span>Solde à récupérer :</span>
                <strong className="font-mono">{formatMAD(financialEstimations.remainingToCollectShippedGross)}</strong>
              </div>
            </div>

            {/* Card 4: Livrées & Encaissées */}
            <div className="bg-emerald-50/50 p-3.5 sm:p-4 rounded-xl border border-emerald-200/70">
              <div className="flex items-center justify-between text-emerald-800 text-[11px] font-bold uppercase tracking-wider">
                <span>Livrées & Encaissées</span>
                <CheckCircle2 size={14} className="text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-700 mt-1 font-mono">{tabCounts.DELIVERED}</div>
              <div className="text-[11px] text-emerald-800/80 mt-1 flex items-center justify-between">
                <span>Taux de succès :</span>
                <strong className="text-emerald-700 font-mono font-bold">{tauxLivraison}%</strong>
              </div>
            </div>

          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            
            {/* Card F1: Cash Encaissé Réel */}
            <div className="bg-emerald-50/60 p-3.5 sm:p-4 rounded-xl border border-emerald-200/80">
              <div className="flex items-center justify-between text-emerald-800 text-[11px] font-bold uppercase tracking-wider">
                <span>{estimationMode === 'NET' ? 'Cash Net en Caisse' : 'Cash Brut Encaissé'}</span>
                <CheckCircle2 size={14} className="text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-700 mt-1 font-mono">
                {formatMAD(financialEstimations.displayedCashCollected)}
              </div>
              <div className="text-[11px] text-emerald-800/80 mt-1">
                Dont <strong className="font-mono">{formatMAD(financialEstimations.advancesOnActiveOrders)}</strong> d'acomptes
              </div>
            </div>

            {/* Card F2: Solde en Livraison */}
            <div className="bg-sky-50/60 p-3.5 sm:p-4 rounded-xl border border-sky-200/80">
              <div className="flex items-center justify-between text-sky-800 text-[11px] font-bold uppercase tracking-wider">
                <span>{estimationMode === 'NET' ? 'Créances Nettes Livreur' : 'Créances Brutes Livreur'}</span>
                <Truck size={14} className="text-[#1D9BF0]" />
              </div>
              <div className="text-2xl font-black text-[#0284c7] mt-1 font-mono">
                {formatMAD(financialEstimations.displayedShipped)}
              </div>
              <div className="text-[11px] text-sky-800/80 mt-1">
                {financialEstimations.shippedOrdersCount} colis chez transporteur
              </div>
            </div>

            {/* Card F3: Solde en Préparation */}
            <div className="bg-amber-50/60 p-3.5 sm:p-4 rounded-xl border border-amber-200/80">
              <div className="flex items-center justify-between text-amber-800 text-[11px] font-bold uppercase tracking-wider">
                <span>{estimationMode === 'NET' ? 'Solde Net Commandes' : 'Solde Brut Commandes'}</span>
                <Clock size={14} className="text-amber-600" />
              </div>
              <div className="text-2xl font-black text-amber-700 mt-1 font-mono">
                {formatMAD(financialEstimations.displayedProcessing)}
              </div>
              <div className="text-[11px] text-amber-800/80 mt-1">
                {financialEstimations.processingOrdersCount} colis à expédier
              </div>
            </div>

            {/* Card F4: Estimation Parfaite */}
            <div className="bg-slate-900 text-white p-3.5 sm:p-4 rounded-xl border border-slate-800 shadow-md">
              <div className="flex items-center justify-between text-amber-400 text-[11px] font-bold uppercase tracking-wider">
                <span>{estimationMode === 'NET' ? 'Estimation Nette Réelle' : 'Estimation Brute Totale'}</span>
                <Sparkles size={14} className="text-amber-400" />
              </div>
              <div className="text-2xl font-black text-white mt-1 font-mono">
                {formatMAD(financialEstimations.displayedEstimation)}
              </div>
              <div className="text-[10.5px] text-slate-300 mt-1">
                {estimationMode === 'NET'
                  ? `Déduction faite de ${formatMAD(financialEstimations.totalShippingFeesIncurredAndExpected)} livr.`
                  : 'Total facturé aux clients'}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* ========================================================= */}
      {/* 3. MOROCCAN EXPRESS CITY FILTER CHIPS (1-CLICK HUBS)       */}
      {/* ========================================================= */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1 shrink-0">
          <MapPin size={12} className="text-amber-500" />
          <span>Villes Express :</span>
        </span>
        <button
          onClick={() => setCityFilter('ALL')}
          className={`px-3 py-1 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
            cityFilter === 'ALL'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          Toutes ({uniqueCities.length})
        </button>
        {TOP_MOROCCAN_CITIES.map((city) => {
          const count = orders.filter((o) => (o.shippingCity || '').toLowerCase().trim() === city.toLowerCase()).length;
          return (
            <button
              key={city}
              onClick={() => setCityFilter(cityFilter === city ? 'ALL' : city)}
              className={`px-3 py-1 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                cityFilter === city
                  ? 'bg-amber-500 text-white font-bold shadow-2xs'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80'
              }`}
            >
              <span>{city}</span>
              {count > 0 && (
                <span className={`px-1 py-0.2 rounded text-[10px] font-mono font-bold ${
                  cityFilter === city ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* 4. FILTER TABS & WORKFLOW PIPELINE                        */}
      {/* ========================================================= */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-1 overflow-x-auto custom-scrollbar">
        {[
          { id: 'ALL', label: 'Toutes les commandes', count: tabCounts.ALL, activeBg: 'bg-slate-900 text-white' },
          { id: 'PENDING', label: 'À Confirmer', count: tabCounts.TO_CONFIRM_COMBINED, activeBg: 'bg-amber-500 text-white' },
          { id: 'PROCESSING', label: 'En Préparation', count: tabCounts.PROCESSING, activeBg: 'bg-[#1D9BF0] text-white' },
          { id: 'SHIPPED', label: 'En Livraison', count: tabCounts.SHIPPED, activeBg: 'bg-indigo-600 text-white' },
          { id: 'DELIVERED', label: 'Livrées & Encaissées', count: tabCounts.DELIVERED, activeBg: 'bg-emerald-600 text-white' },
          { id: 'ISSUES', label: 'Refus & Retours', count: tabCounts.ISSUES, activeBg: 'bg-rose-600 text-white' },
        ].map((tab) => (
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
              activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ========================================================= */}
      {/* 5. SEARCH & ADVANCED FILTERS BAR                          */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
        
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par n° commande, nom client, ville, téléphone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-8 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all font-medium"
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
          <div className="flex items-center gap-1.5">
            <CreditCard size={14} className="text-slate-400 shrink-0" />
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as any)}
              className="text-xs bg-slate-50/70 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:bg-white focus:outline-none focus:border-slate-900 cursor-pointer font-medium"
            >
              <option value="ALL">Tous les règlements</option>
              <option value="PARTIAL">Avec Acompte versé</option>
              <option value="PAID">100% Réglé</option>
              <option value="UNPAID">Paiement à la livraison (0 DH)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <MapPin size={14} className="text-slate-400 shrink-0" />
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="text-xs bg-slate-50/70 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:bg-white focus:outline-none focus:border-slate-900 cursor-pointer font-medium"
            >
              <option value="ALL">Toutes les villes ({uniqueCities.length})</option>
              {uniqueCities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>

      </div>

      {/* ========================================================= */}
      {/* 6. ACTIVE TARGET ORDER SPOTLIGHT BANNER                   */}
      {/* ========================================================= */}
      {highlightedOrderId && (
        <div className="relative overflow-hidden rounded-2xl border border-sky-400/50 bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white p-4 shadow-2xl backdrop-blur-2xl ring-1 ring-sky-400/25">
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0ea5e9] to-blue-600 text-white flex items-center justify-center shadow-lg border border-sky-200/40">
                <Target size={19} className="animate-spin" style={{ animationDuration: '8s' }} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-black tracking-wider bg-sky-400/20 text-sky-300 border border-sky-400/30 flex items-center gap-1">
                    <Sparkles size={10} />
                    <span>Focus Commande</span>
                  </span>
                  {highlightedOrder && (
                    <>
                      <span className="font-mono font-black text-sm text-white tracking-wide bg-white/10 px-2 py-0.5 rounded-lg border border-white/10">
                        {highlightedOrder.orderNumber}
                      </span>
                      <span className="text-xs text-slate-200 font-semibold truncate">
                        • {highlightedOrder.customerName} ({highlightedOrder.shippingCity || 'Casablanca'})
                      </span>
                      <span className="text-xs font-black text-emerald-400 ml-1">
                        {formatMAD(highlightedOrder.total)}
                      </span>
                    </>
                  )}
                </div>
                <p className="text-[11px] text-slate-300 font-medium mt-1">
                  Commande localisée et centrée automatiquement ci-dessous.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              {highlightedOrder && (
                <button
                  type="button"
                  onClick={() => setEditingOrder(highlightedOrder)}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#0ea5e9] to-blue-600 hover:from-[#0284c7] hover:to-blue-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Eye size={13} />
                  <span>Ouvrir la fiche</span>
                </button>
              )}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 font-mono font-bold text-xs text-sky-200">
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
              >
                <X size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 7. ORDERS TABLE WITH COD & SMART WHATSAPP PRESETS         */}
      {/* ========================================================= */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3.5 w-10 text-center">
                  <button
                    onClick={handleToggleSelectAll}
                    className="text-slate-400 hover:text-slate-900 transition-colors p-1"
                    title={selectedOrderIds.length === filteredOrders.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                  >
                    {filteredOrders.length > 0 && selectedOrderIds.length === filteredOrders.length ? (
                      <CheckSquare size={16} className="text-slate-900" />
                    ) : (
                      <Square size={16} />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3.5">Référence & Date</th>
                <th className="px-4 py-3.5">Client & Confiance</th>
                <th className="px-4 py-3.5">Destination & Livreur</th>
                <th className="px-4 py-3.5">Articles & Fragile</th>
                <th className="px-4 py-3.5">Étape Commande</th>
                <th className="px-4 py-3.5">Total & Reste Livreur</th>
                <th className="px-4 py-3.5">Statut</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw size={20} className="animate-spin text-[#1D9BF0]" />
                      <span className="text-xs font-medium">Chargement des commandes...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-slate-400">
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
                  const itemsSummary = parsedItems.map(i => `${i.quantity}x ${i.name}`).join(', ') || 'Parfum NAY';
                  const formattedDate = new Date(order.createdAt).toLocaleDateString('fr-MA', {
                    timeZone: 'Africa/Casablanca',
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  const total = Number(order.total) || 0;
                  const paid = Math.min(total, Math.max(0, Number(order.paidAmount) || 0));
                  const remaining = Math.max(0, total - paid);
                  const isPaidFull = paid >= total && total > 0;

                  const stConfig = STATUS_CLASSES[order.status] || STATUS_CLASSES.pending;
                  const isTargetHighlighted = highlightedOrderId === order.id;
                  const isSelected = selectedOrderIds.includes(order.id);
                  const trustScore = getCustomerTrustScore(order);
                  const TrustIcon = trustScore.icon;

                  return (
                    <tr
                      key={order.id}
                      id={`order-row-${order.id}`}
                      onClick={() => setEditingOrder(order)}
                      className={`transition-all duration-200 cursor-pointer group relative ${
                        isSelected ? 'bg-amber-50/40 hover:bg-amber-50/60' : 'hover:bg-slate-50/80'
                      } ${
                        isTargetHighlighted
                          ? 'bg-sky-50/80 border-l-[4px] border-l-[#0ea5e9] shadow-sm'
                          : ''
                      }`}
                    >
                      
                      {/* Checkbox */}
                      <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleToggleSelectOne(order.id, e)}
                          className="text-slate-400 hover:text-slate-900 transition-colors p-1"
                        >
                          {isSelected ? (
                            <CheckSquare size={16} className="text-amber-600" />
                          ) : (
                            <Square size={16} />
                          )}
                        </button>
                      </td>

                      {/* Ref & Date */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono font-bold transition-all ${
                            isTargetHighlighted
                              ? 'text-[#0ea5e9] text-sm font-black'
                              : 'text-slate-900 group-hover:text-amber-600'
                          }`}>
                            {order.orderNumber}
                          </span>
                          <button
                            onClick={(e) => handleCopyRef(order.orderNumber, e)}
                            className="p-1 text-slate-300 hover:text-slate-600 rounded hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100"
                            title="Copier la référence"
                          >
                            {copiedRef === order.orderNumber ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                          </button>
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                          {formattedDate}
                        </div>
                      </td>

                      {/* Customer & Anti-RTS Reliability */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <span>{order.customerName}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-1 text-[11px]">
                          {order.customerPhone ? (
                            <span className="font-mono text-slate-600">{order.customerPhone}</span>
                          ) : (
                            <span className="italic text-slate-400">Sans tél</span>
                          )}

                          {/* Anti-RTS Trust Badge */}
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${trustScore.badge}`} title={trustScore.desc}>
                            <TrustIcon size={10} />
                            <span>{trustScore.label}</span>
                          </span>
                        </div>
                      </td>

                      {/* Destination & Carrier */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-800 font-bold text-xs">
                          <MapPin size={11} className="text-amber-500" />
                          <span>{order.shippingCity || 'Casablanca'}</span>
                        </div>
                        <div className="text-[10.5px] text-slate-500 mt-1 flex items-center gap-1">
                          <Truck size={10} className="text-slate-400" />
                          <span>{order.carrier || 'Cathedis'}</span>
                          {order.trackingNumber && (
                            <span className="font-mono text-[10px] text-slate-400">({order.trackingNumber})</span>
                          )}
                        </div>
                      </td>

                      {/* Items */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <Package size={13} className="text-slate-400" />
                          <span>{itemsCount} flacon(s)</span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[140px] mt-0.5">
                          {itemsSummary}
                        </div>
                      </td>

                      {/* Timeline */}
                      <td className="px-4 py-3.5">
                        <OrderTimelineStepper
                          status={order.status}
                          timeline={order.timeline || []}
                          compact={true}
                        />
                      </td>

                      {/* Total & Clear COD Split (Anti-Erreur Livreur) */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-bold text-slate-900 text-xs">
                          {formatMAD(order.total)}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          Net Boutique : <strong className="font-mono text-emerald-700">{formatMAD(Math.max(0, total - shippingFeePerOrder))}</strong>
                          <span className="text-slate-400"> (-35 DH)</span>
                        </div>

                        {/* Driver COD Collection Badge */}
                        <div className="mt-1">
                          {isPaidFull ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                              <CheckCircle2 size={10} />
                              <span>100% Réglé • 0 DH Livreur</span>
                            </span>
                          ) : paid > 0 ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                                Acompte : {formatMAD(paid)}
                              </span>
                              <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200 text-[10px] font-bold">
                                <Truck size={10} className="text-[#1D9BF0]" />
                                <span>À ENCAISSER : {formatMAD(remaining)}</span>
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-bold">
                              <Truck size={10} className="text-amber-600" />
                              <span>À ENCAISSER : {formatMAD(total)}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status Dropdown */}
                      <td className="px-4 py-3.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-block w-[135px]">
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

                      {/* Actions & Smart WhatsApp Hub */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          

                          {/* WhatsApp Smart Presets Dropdown */}
                          <div className="relative whatsapp-dropdown-container">
                            <button
                              onClick={() => setOpenWhatsAppMenuId(openWhatsAppMenuId === order.id ? null : order.id)}
                              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all cursor-pointer"
                              title="Messages WhatsApp pré-rédigés"
                            >
                              <MessageCircle size={13} className="text-emerald-600" />
                              <ChevronDown size={11} className="opacity-70" />
                            </button>

                            {openWhatsAppMenuId === order.id && (
                              <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 text-left animate-in fade-in slide-in-from-top-1">
                                <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100 mb-1">
                                  WhatsApp Express • Maison NAY
                                </div>
                                <a
                                  href={getWhatsAppPresetUrl(order.customerPhone, order.customerName, order.orderNumber, itemsSummary, order.shippingCity, total, paid, 'CONFIRM')}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={() => setOpenWhatsAppMenuId(null)}
                                  className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                                >
                                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                                  <span>1. Confirmation express</span>
                                </a>
                                <a
                                  href={getWhatsAppPresetUrl(order.customerPhone, order.customerName, order.orderNumber, itemsSummary, order.shippingCity, total, paid, 'ADVANCE')}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={() => setOpenWhatsAppMenuId(null)}
                                  className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                                >
                                  <CreditCard size={13} className="text-amber-500 shrink-0" />
                                  <span>2. Demande d'acompte (CIH)</span>
                                </a>
                                <a
                                  href={getWhatsAppPresetUrl(order.customerPhone, order.customerName, order.orderNumber, itemsSummary, order.shippingCity, total, paid, 'SHIPPED')}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={() => setOpenWhatsAppMenuId(null)}
                                  className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                                >
                                  <Truck size={13} className="text-[#1D9BF0] shrink-0" />
                                  <span>3. Avis d'expédition & Reste</span>
                                </a>
                                <a
                                  href={getWhatsAppPresetUrl(order.customerPhone, order.customerName, order.orderNumber, itemsSummary, order.shippingCity, total, paid, 'LOCATION')}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={() => setOpenWhatsAppMenuId(null)}
                                  className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                                >
                                  <MapPin size={13} className="text-indigo-500 shrink-0" />
                                  <span>4. Demande de localisation GPS</span>
                                </a>
                                <a
                                  href={getWhatsAppPresetUrl(order.customerPhone, order.customerName, order.orderNumber, itemsSummary, order.shippingCity, total, paid, 'UNREACHABLE')}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={() => setOpenWhatsAppMenuId(null)}
                                  className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                                >
                                  <Phone size={13} className="text-rose-500 shrink-0" />
                                  <span>5. Relance client injoignable</span>
                                </a>
                              </div>
                            )}
                          </div>

                          {/* Details Button */}
                          <button
                            onClick={() => setEditingOrder(order)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition-all font-bold text-xs cursor-pointer"
                          >
                            <Eye size={12} />
                            <span>Fiche</span>
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
      </div>

      {/* ========================================================= */}
      {/* 8. FLOATING BULK ACTIONS BAR (ACTIONS GROUPÉES)           */}
      {/* ========================================================= */}
      {selectedOrderIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2 pr-3 border-r border-slate-700 text-xs font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span>{selectedOrderIds.length} sélectionnée(s)</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            <button
              onClick={() => handleBulkStatusUpdate('processing')}
              disabled={isBulkProcessing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 size={13} />
              <span>Valider le lot</span>
            </button>

            <button
              onClick={() => handleBulkStatusUpdate('shipped')}
              disabled={isBulkProcessing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              <Truck size={13} />
              <span>Remettre aux transporteurs</span>
            </button>

            <button
              onClick={handleExportOrdersCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all cursor-pointer"
            >
              <FileSpreadsheet size={13} />
              <span>Exporter CSV</span>
            </button>

            <button
              onClick={() => setSelectedOrderIds([])}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
              title="Désélectionner"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}



      {/* ========================================================= */}
      {/* 10. DETAILS & TIMELINE DRAWER MODAL                       */}
      {/* ========================================================= */}
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
                  title="Imprimer la facture client A4"
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
              
              {/* Stepper Timeline */}
              <OrderTimelineFull
                order={editingOrder}
                currentUser={currentUser}
                onUpdateStatus={async (newStatus, options) => {
                  await handleStatusChange(editingOrder.id, newStatus, options);
                }}
                onAddNote={handleAddTimelineNote}
                onAddAttachment={handleAddAttachment}
              />

              {/* Client & Destination Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-2">
                  <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <User size={13} className="text-[#1D9BF0]" />
                      <span>Client</span>
                    </span>
                    {(() => {
                      const score = getCustomerTrustScore(editingOrder);
                      const Icon = score.icon;
                      return (
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-bold border ${score.badge}`}>
                          <Icon size={10} />
                          <span>{score.label}</span>
                        </span>
                      );
                    })()}
                  </div>
                  <div className="font-bold text-slate-900 text-sm">{editingOrder.customerName}</div>
                  
                  {editingOrder.customerPhone && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="font-mono text-slate-600">{editingOrder.customerPhone}</span>
                      <a
                        href={getWhatsAppPresetUrl(editingOrder.customerPhone, editingOrder.customerName, editingOrder.orderNumber, 'Parfums NAY', editingOrder.shippingCity, Number(editingOrder.total) || 0, Number(editingOrder.paidAmount) || 0, 'CONFIRM')}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.8 rounded-lg bg-emerald-500 text-white text-[11px] font-semibold hover:bg-emerald-600 transition-colors"
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

                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-2">
                  <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                    <MapPin size={13} className="text-[#1D9BF0]" />
                    <span>Destination</span>
                  </div>
                  <div className="font-bold text-slate-900 text-sm">{editingOrder.shippingCity || 'Casablanca'}</div>
                  <div className="text-slate-600 leading-relaxed font-normal">{editingOrder.shippingAddress || 'Adresse client'}</div>
                </div>
              </div>

              {/* RÈGLEMENTS, ACOMPTES & TRANSPORTEURS */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
                
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                      <CreditCard size={15} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm tracking-tight">
                        Règlement & Acomptes Clients
                      </h4>
                      <p className="text-[11px] text-slate-500 font-normal">
                        Suivi des versements reçus et du reste à encaisser par le livreur
                      </p>
                    </div>
                  </div>

                  {paymentSavedMessage && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200 animate-in fade-in">
                      <Check size={13} className="text-emerald-600" />
                      <span>{paymentSavedMessage}</span>
                    </span>
                  )}
                </div>

                {/* 3 Executive Financial Metric Pillars */}
                {(() => {
                  const total = Number(editingOrder.total) || 0;
                  const paid = Math.min(total, Math.max(0, Number(editingOrder.paidAmount) || 0));
                  const remaining = Math.max(0, total - paid);

                  return (
                    <div className="bg-slate-50/70 rounded-xl p-3.5 border border-slate-200/80 space-y-2.5">
                      <div className="grid grid-cols-3 gap-2 text-left">
                        <div className="space-y-0.5">
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                            Total Commande
                          </span>
                          <span className="font-mono font-bold text-slate-900 text-sm">
                            {formatMAD(total)}
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                            Déjà Encaissé
                          </span>
                          <span className={`font-mono font-bold text-sm ${paid > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                            {formatMAD(paid)}
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                            Reste Livreur (COD)
                          </span>
                          <span className={`font-mono font-bold text-sm ${remaining > 0 ? 'text-[#1D9BF0]' : 'text-emerald-600'}`}>
                            {formatMAD(remaining)}
                          </span>
                        </div>
                      </div>

                      <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden flex">
                        <div
                          className="bg-emerald-500 h-full transition-all duration-300"
                          style={{ width: `${Math.min(100, total > 0 ? (paid / total) * 100 : 0)}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}

                {/* Direct Action Presets */}
                {(() => {
                  const total = Number(editingOrder.total) || 0;
                  const paid = Math.min(total, Math.max(0, Number(editingOrder.paidAmount) || 0));
                  const half = Math.round(total / 2);

                  const presets = [
                    { label: 'À la livraison', amount: 0, desc: '0 MAD' },
                    { label: 'Acompte 50 DH', amount: 50, desc: '50 MAD' },
                    { label: 'Acompte 100 DH', amount: 100, desc: '100 MAD' },
                    { label: 'Moitié commande', amount: half, desc: `${half} MAD` },
                    { label: 'Totalité soldée', amount: total, desc: `${total} MAD` },
                  ];

                  return (
                    <div>
                      <div className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Raccourcis de Versement Rapides (Dirhams) :
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                        {presets.map((preset) => {
                          const isSelected = paid === preset.amount;
                          return (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => handleQuickAmount(preset.amount)}
                              disabled={isSavingPayment}
                              className={`p-2 rounded-xl text-left border transition-all cursor-pointer disabled:opacity-50 flex flex-col justify-between ${
                                isSelected
                                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/90 hover:border-slate-300'
                              }`}
                            >
                              <span className={`text-[10.5px] font-bold truncate ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                                {preset.label}
                              </span>
                              <span className={`text-[10.5px] font-mono mt-1 font-bold ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`}>
                                {preset.desc}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Custom Amount & Carrier Details Form */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                  <div>
                    <label className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Montant Acompte (MAD)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max={editingOrder.total}
                        value={advanceAmountInput}
                        onChange={(e) => setAdvanceAmountInput(e.target.value)}
                        className="w-full pl-3 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-900"
                        placeholder="0"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none">
                        MAD
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Canal de Règlement
                    </label>
                    <select
                      value={advanceMethodInput}
                      onChange={(e) => setAdvanceMethodInput(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-900 cursor-pointer"
                    >
                      <option value="VIREMENT">Virement bancaire (CIH, Attijari...)</option>
                      <option value="CASHPLUS">CashPlus / Wafacash</option>
                      <option value="CARTE">Carte bancaire en ligne</option>
                      <option value="ESPECES">Espèces en main propre</option>
                      <option value="AUTRE">Autre mode de versement</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Transporteur Attribué
                    </label>
                    <select
                      value={carrierInput}
                      onChange={(e) => setCarrierInput(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-900 cursor-pointer"
                    >
                      <option value="Cathedis">Cathedis Express</option>
                      <option value="Amana">Amana / Poste Maroc</option>
                      <option value="Speedaf">Speedaf Express</option>
                      <option value="Livreur Maison">Livreur Interne NAY</option>
                      <option value="Autre">Autre transporteur</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      N° Suivi / Tracking
                    </label>
                    <input
                      type="text"
                      value={trackingInput}
                      onChange={(e) => setTrackingInput(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                      placeholder="Ex: CAT-98234-MA"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <div className="text-[11px] text-slate-500">
                    {Number(advanceAmountInput) > 0 ? (
                      <span>
                        Solde restant livreur : <strong className="font-mono text-slate-900 font-bold">{formatMAD(Math.max(0, (Number(editingOrder.total) || 0) - (Number(advanceAmountInput) || 0)))}</strong>
                      </span>
                    ) : (
                      <span>Règlement intégral prévu à la livraison</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSavePayment()}
                    disabled={isSavingPayment}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isSavingPayment ? (
                      <RefreshCw size={13} className="animate-spin" />
                    ) : (
                      <Check size={13} className="text-emerald-400" />
                    )}
                    <span>Enregistrer</span>
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="pt-4 border-t border-slate-100">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-3 flex items-center gap-1.5">
                  <Package size={13} className="text-amber-500" />
                  <span>Flacons de Parfum Commandés</span>
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
                      <div className="font-bold text-slate-900 text-xs font-mono">
                        {formatMAD((item.price || 0) * (item.quantity || 1))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Financial Breakdown */}
              {(() => {
                const total = Number(editingOrder.total) || 0;
                const paid = Math.min(total, Math.max(0, Number(editingOrder.paidAmount) || 0));
                const remaining = Math.max(0, total - paid);
                const isPaidFull = paid >= total && total > 0;
                const netProductRevenue = Math.max(0, total - shippingFeePerOrder);

                return (
                  <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3 shadow-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs text-slate-400">
                          {isPaidFull ? 'Commande Entièrement Réglée' : 'Montant à encaisser par le livreur (COD)'}
                        </span>
                        <p className="text-xl font-bold text-white mt-0.5 font-mono">
                          {formatMAD(remaining)}
                        </p>
                        {paid > 0 && (
                          <div className="text-[11px] text-emerald-400 mt-0.5 font-medium">
                            ✓ Acompte de {formatMAD(paid)} déjà perçu
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
                          ? 'Totalement réglé'
                          : paid > 0
                          ? `Acompte versé (${formatMAD(paid)})`
                          : 'Paiement à la livraison'}
                      </span>
                    </div>

                    <div className="pt-2.5 border-t border-slate-800 text-[11px] space-y-1 text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total facturé au client :</span>
                        <span className="font-mono text-white">{formatMAD(total)}</span>
                      </div>
                      <div className="flex justify-between text-rose-300">
                        <span>Frais transporteur livraison :</span>
                        <span className="font-mono">-{formatMAD(shippingFeePerOrder)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-emerald-400 pt-1.5 border-t border-slate-800/80">
                        <span>Net Marchandise Maison NAY :</span>
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
          <RefreshCw size={24} className="animate-spin text-amber-500" />
          <span className="text-xs font-semibold text-slate-600">Chargement de la gestion des commandes...</span>
        </div>
      }
    >
      <OrdersPageContent />
    </Suspense>
  );
}
