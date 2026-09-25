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
  Target
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
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  // 5-second Target Highlight state
  const [highlightedOrderId, setHighlightedOrderId] = useState<string | null>(null);
  const [highlightCountdown, setHighlightCountdown] = useState<number>(0);

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

  // Detect and Highlight Target Order for 5 seconds
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
      setHighlightCountdown(5);

      // Smooth scroll to the targeted row
      const scrollTimer = setTimeout(() => {
        const rowElement = document.getElementById(`order-row-${matched.id}`);
        if (rowElement) {
          rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 200);

      // 5-second countdown timer
      let remaining = 5;
      const interval = setInterval(() => {
        remaining -= 1;
        setHighlightCountdown(remaining);
        if (remaining <= 0) {
          clearInterval(interval);
          setHighlightedOrderId(null);
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
  }, [orders, search, activeTab, cityFilter, jobProfile]);

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
          badge: 'Atelier & Emballage',
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
          { value: 'returned', label: 'Retour atelier' },
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
      if (status === 'returned') return 'Retour atelier';
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
              <div className="text-[11px] text-slate-500 mt-1 font-medium">{returnedCount} refus & retours atelier</div>
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
              <div className="text-[11px] text-slate-500 mt-1 font-medium">Commandes confirmées prêtes pour atelier</div>
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
              <div className="text-[11px] text-slate-500 mt-1 font-medium">{tabCounts.TO_CONFIRM_COMBINED} en attente • {tabCounts.PROCESSING} en atelier</div>
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
              <div className="text-[11px] text-slate-500 mt-1 font-medium">CA Livré: {formatMAD(deliveredRevenue)} ({deliverySuccessRate}%)</div>
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

        {/* City Filter */}
        <div className="flex items-center gap-2">
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

      {/* Active Target Order Banner */}
      {highlightedOrderId && (
        <div className="bg-red-50 border-2 border-red-500/80 rounded-2xl p-4 flex items-center justify-between text-xs text-red-900 shadow-lg shadow-red-500/10 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3 font-bold">
            <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Target size={18} className="animate-spin" style={{ animationDuration: '3s' }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-red-950 font-extrabold text-sm">🎯 Commande Ciblée</span>
                <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase">
                  Mise en avant
                </span>
              </div>
              <p className="text-[11px] text-red-700 font-medium mt-0.5">
                La commande demandée est illuminée en <strong className="text-red-950 font-bold">rouge</strong> dans la liste ci-dessous.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3 py-1.5 rounded-xl bg-red-600 text-white font-mono font-bold text-xs shadow-xs animate-pulse">
              {highlightCountdown}s restantes
            </span>
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
                          ? 'bg-rose-50/95 ring-2 ring-red-500 border-l-4 border-l-red-600 shadow-md shadow-red-500/20'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      
                      {/* Ref & Date */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono font-bold transition-colors ${
                            isTargetHighlighted ? 'text-red-700 text-sm font-black scale-105 inline-block' : 'text-slate-900 group-hover:text-[#1D9BF0]'
                          }`}>
                            {order.orderNumber}
                          </span>
                          {isTargetHighlighted && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-600 text-white font-black text-[10px] uppercase tracking-wider animate-pulse shadow-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                              <span>Cible ({highlightCountdown}s)</span>
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
                        <div className={`text-[11px] font-mono mt-0.5 ${isTargetHighlighted ? 'text-red-600 font-semibold' : 'text-slate-400'}`}>
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

                      {/* Total */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="font-bold text-slate-900 text-xs">
                          {formatMAD(order.total)}
                        </div>
                        <div className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 mt-0.5">
                          <span>Paiement à la livraison</span>
                        </div>
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
              <div className="p-4 rounded-2xl bg-slate-900 text-white flex justify-between items-center shadow-lg shadow-slate-900/10">
                <div>
                  <span className="text-xs text-slate-400">Total à encaisser à la livraison (COD)</span>
                  <p className="text-lg font-bold text-white mt-0.5">{formatMAD(editingOrder.total)}</p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                  Paiement Cash
                </span>
              </div>

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

