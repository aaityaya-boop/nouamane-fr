'use client';

import React, { useState, useEffect, useMemo, Suspense, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
  ArrowRight,
  ArrowUpRight,
  Boxes,
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
  Share2,
  Trash2
} from 'lucide-react';
import OrderTimelineStepper from '@/components/OrderTimelineStepper';
import OrderTimelineFull from '@/components/OrderTimelineFull';
import OrderDetailModal from '@/components/admin/OrderDetailModal';

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'refused' | 'returned' | 'unconfirmed';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  size?: string;
  sku?: string;
  image?: string;
  slug?: string;
  brandLabel?: string;
  categoryLabel?: string;
  currentStock?: number | null;
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
  pending: {
    bg: 'bg-amber-50/90 dark:bg-amber-500/15',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-200/80 dark:border-amber-500/30',
    dot: 'bg-amber-500',
  },
  unconfirmed: {
    bg: 'bg-rose-50/90 dark:bg-rose-500/15',
    text: 'text-rose-800 dark:text-rose-300',
    border: 'border-rose-200/80 dark:border-rose-500/30',
    dot: 'bg-rose-500',
  },
  processing: {
    bg: 'bg-slate-100 dark:bg-white/10',
    text: 'text-slate-800 dark:text-slate-200',
    border: 'border-slate-200/90 dark:border-white/15',
    dot: 'bg-slate-600 dark:bg-slate-300',
  },
  shipped: {
    bg: 'bg-sky-50/90 dark:bg-sky-500/15',
    text: 'text-[#0284c7] dark:text-[#38bdf8]',
    border: 'border-sky-200/80 dark:border-sky-500/30',
    dot: 'bg-[#0ea5e9]',
  },
  delivered: {
    bg: 'bg-emerald-50/90 dark:bg-emerald-500/15',
    text: 'text-emerald-800 dark:text-emerald-300',
    border: 'border-emerald-200/80 dark:border-emerald-500/30',
    dot: 'bg-emerald-500',
  },
  refused: {
    bg: 'bg-rose-50/90 dark:bg-rose-500/15',
    text: 'text-rose-800 dark:text-rose-300',
    border: 'border-rose-200/80 dark:border-rose-500/30',
    dot: 'bg-rose-500',
  },
  returned: {
    bg: 'bg-slate-100 dark:bg-white/[0.07]',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-200 dark:border-white/10',
    dot: 'bg-slate-500',
  },
};

const TOP_MOROCCAN_CITIES = ['Casablanca', 'Rabat', 'Marrakech', 'Tanger', 'Fès', 'Agadir', 'Salé', 'Meknès'];

const formatMAD = (amount: number) => {
  return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(amount);
};

const isTestOrder = (order: any): boolean => {
  if (!order) return false;
  const name = (order.customerName || '').toLowerCase();
  const email = (order.customerEmail || '').toLowerCase();
  const num = (order.orderNumber || '').toUpperCase();
  const phone = (order.customerPhone || '').replace(/\D/g, '');
  const addr = (order.shippingAddress || '').toLowerCase();
  const city = (order.shippingCity || '').toLowerCase();

  return (
    name.includes('test') ||
    name.includes('fake') ||
    name.includes('essai') ||
    name.includes('demo') ||
    email.includes('test') ||
    email.includes('fake') ||
    email.includes('example.com') ||
    email.endsWith('.test') ||
    num.includes('TEST') ||
    phone === '0000000000' ||
    phone === '0600000000' ||
    phone === '123456789' ||
    addr.includes('test address') ||
    addr.includes('adresse test') ||
    addr.includes('123 boulevard test') ||
    city === 'test' ||
    order.status === 'test'
  );
};

const parseOrderItemsSafe = (itemsString?: string): OrderItem[] => {
  try {
    return JSON.parse(itemsString || '[]');
  } catch {
    return [];
  }
};

const buildWhatsAppPresetText = (
  presetType: 'CONFIRM' | 'ADVANCE' | 'SHIPPED' | 'LOCATION' | 'UNREACHABLE',
  order: any
) => {
  if (!order) return '';
  const customerName = order.customerName || 'Client';
  const orderNumber = order.orderNumber || '';
  const parsedItems = parseOrderItemsSafe(order.items);
  const itemsText = parsedItems.map((i: any) => `${i.quantity || 1}x ${i.name}`).join(', ') || 'Parfums NAY';
  const city = order.shippingCity || 'votre ville';
  const total = Number(order.total) || 0;
  const paid = Math.min(total, Math.max(0, Number(order.paidAmount) || 0));
  const remaining = Math.max(0, total - paid);

  switch (presetType) {
    case 'CONFIRM':
      return `Salam ${customerName} ✨ C'est Maison NAY Parfums concernant votre commande #${orderNumber} (${itemsText}). Nous préparons votre colis pour ${city}. Merci de nous confirmer si vous êtes disponible pour recevoir votre commande cette semaine ? Belle journée !`;
    case 'ADVANCE':
      return `Salam ${customerName} ✨ Merci pour votre commande NAY Parfums #${orderNumber}. Afin de valider l'expédition prioritaire de votre flacon de parfum, un acompte de sécurité de 50 DH (ou 100 DH) est souhaité.\n\nRIB CIH : 230 780 4567890123 45 (NAY PARFUMS)\nOu par Wafacash / CashPlus.\n\nMerci de nous transmettre le reçu de versement ici.`;
    case 'SHIPPED':
      return `Salam ${customerName} 🚚 Votre commande Maison NAY Parfums #${orderNumber} est en route avec notre livreur pour ${city} !\n\nMontant exact à préparer en espèces à la livraison : *${remaining} MAD*${paid > 0 ? ` (Acompte de ${paid} MAD déjà déduit)` : ''}.\n\nMerci de garder votre téléphone joignable !`;
    case 'LOCATION':
      return `Salam ${customerName} 📍 Notre livreur est en tournée aujourd'hui à ${city}. Pourriez-vous svp nous partager votre localisation GPS WhatsApp pour vous livrer directement à votre porte ? Merci beaucoup !`;
    case 'UNREACHABLE':
      return `Salam ${customerName} 📞 Nous avons essayé de vous joindre par téléphone au sujet de votre commande NAY Parfums #${orderNumber}, sans succès.\n\nMerci de nous répondre ou de nous rappeler au plus vite afin de maintenir votre commande active avant son annulation automatique.`;
  }
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
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState(searchParam || '');
  const [activeTab, setActiveTab] = useState<string>(tabParam || 'ALL');
  const [cityFilter, setCityFilter] = useState<string>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'UNPAID' | 'PARTIAL' | 'PAID'>('ALL');
  const [sortBy, setSortBy] = useState<'DATE_DESC' | 'TOTAL_DESC' | 'TOTAL_ASC' | 'PRIORITY'>('DATE_DESC');
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  // View switch: 'OPERATIONAL' vs 'FINANCIAL' (Executive ribbon)
  const [executiveView, setExecutiveView] = useState<'OPERATIONAL' | 'FINANCIAL'>('OPERATIONAL');

  // Delivery Fee configuration (Default: 35 MAD per order)
  const [shippingFeePerOrder, setShippingFeePerOrder] = useState<number>(35);
  const [estimationMode, setEstimationMode] = useState<'NET' | 'BRUT'>('NET');

  // Multi-Selection State for Bulk Actions
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState<boolean>(false);

  // Deletion and Test Orders State
  const [orderToDelete, setOrderToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [showDeleteTestModal, setShowDeleteTestModal] = useState<boolean>(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState<boolean>(false);
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState<string | null>(null);

  // Portal-Anchored Dropdown States (Zero Table Clipping!)
  const [waMenuAnchor, setWaMenuAnchor] = useState<{
    order: any;
    itemsSummary: string;
    total: number;
    paid: number;
    top: number;
    right: number;
    openUp: boolean;
  } | null>(null);
  const [statusMenuAnchor, setStatusMenuAnchor] = useState<{
    order: any;
    top: number;
    left: number;
    openUp: boolean;
  } | null>(null);

  // Advance Payment State in Drawer
  const [advanceAmountInput, setAdvanceAmountInput] = useState<string>('');
  const [advanceMethodInput, setAdvanceMethodInput] = useState<string>('VIREMENT');
  const [advanceNotesInput, setAdvanceNotesInput] = useState<string>('');
  const [carrierInput, setCarrierInput] = useState<string>('Cathedis');
  const [trackingInput, setTrackingInput] = useState<string>('');
  const [isSavingPayment, setIsSavingPayment] = useState<boolean>(false);
  const [paymentSavedMessage, setPaymentSavedMessage] = useState<string | null>(null);

  // Dedicated WhatsApp Studio & Order Modal State
  const [waPreset, setWaPreset] = useState<'CONFIRM' | 'SHIPPED' | 'LOCATION' | 'UNREACHABLE' | 'ADVANCE'>('CONFIRM');
  const [waMessageText, setWaMessageText] = useState<string>('');

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
      setWaPreset('CONFIRM');
      setWaMessageText(buildWhatsAppPresetText('CONFIRM', editingOrder));
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

  // Close Portal Dropdowns on outside mousedown, Escape or resize
  useEffect(() => {
    const handleOutsideMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (!target.closest('.whatsapp-dropdown-container') && !target.closest('.whatsapp-portal-menu')) {
        setWaMenuAnchor(null);
      }
      if (!target.closest('.status-dropdown-container') && !target.closest('.status-portal-menu')) {
        setStatusMenuAnchor(null);
      }
    };
    const handleKeyOrResize = (e: Event) => {
      if (e.type === 'keydown' && (e as KeyboardEvent).key !== 'Escape') return;
      setWaMenuAnchor(null);
      setStatusMenuAnchor(null);
    };
    document.addEventListener('mousedown', handleOutsideMouseDown);
    document.addEventListener('keydown', handleKeyOrResize);
    window.addEventListener('resize', handleKeyOrResize);
    return () => {
      document.removeEventListener('mousedown', handleOutsideMouseDown);
      document.removeEventListener('keydown', handleKeyOrResize);
      window.removeEventListener('resize', handleKeyOrResize);
    };
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
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  ...updated,
                  enrichedItems: updated.enrichedItems || o.enrichedItems,
                  customerOrdersCount: updated.customerOrdersCount ?? o.customerOrdersCount,
                }
              : o
          )
        );
        if (editingOrder && editingOrder.id === orderId) {
          setEditingOrder((prev: any) =>
            prev
              ? {
                  ...prev,
                  ...updated,
                  enrichedItems: updated.enrichedItems || prev.enrichedItems,
                  customerOrdersCount: updated.customerOrdersCount ?? prev.customerOrdersCount,
                }
              : updated
          );
        }
      }
    } catch (err) {
      console.error('Failed to update order status:', err);
    }
  };

  const handleSavePayment = async (
    customPaid?: number,
    overrides?: {
      advancePaymentMethod?: string;
      paymentNotes?: string;
      carrier?: string;
      trackingNumber?: string;
      customerName?: string;
      city?: string;
    }
  ) => {
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
          advancePaymentMethod: overrides?.advancePaymentMethod ?? advanceMethodInput,
          paymentNotes: overrides?.paymentNotes ?? advanceNotesInput,
          carrier: overrides?.carrier ?? carrierInput,
          trackingNumber: overrides?.trackingNumber ?? trackingInput,
          ...(overrides?.customerName ? { customerName: overrides.customerName } : {}),
          ...(overrides?.city ? { city: overrides.city } : {}),
          actorNameOverride: currentUser?.name || 'Admin NAY',
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setOrders((prev) =>
          prev.map((o) =>
            o.id === editingOrder.id
              ? {
                  ...o,
                  ...updated,
                  enrichedItems: updated.enrichedItems || o.enrichedItems,
                  customerOrdersCount: updated.customerOrdersCount ?? o.customerOrdersCount,
                }
              : o
          )
        );
        setEditingOrder((prev: any) =>
          prev
            ? {
                ...prev,
                ...updated,
                enrichedItems: updated.enrichedItems || prev.enrichedItems,
                customerOrdersCount: updated.customerOrdersCount ?? prev.customerOrdersCount,
              }
            : updated
        );
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

  const handleAddTimelineNote = async (
    note: string,
    type: string = 'NOTE',
    extra?: { carrier?: string; trackingNumber?: string }
  ) => {
    if (!editingOrder) return;
    try {
      const res = await fetch(`/api/admin/orders/${editingOrder.id}/timeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: type,
          title: type === 'CALL_ATTEMPT' ? 'Tentative d\'appel client' : 'Note interne',
          description: note,
          carrier: extra?.carrier,
          trackingNumber: extra?.trackingNumber,
          actorNameOverride: currentUser?.name || 'Admin NAY',
        }),
      });

      if (res.ok) {
        const resData = await res.json();
        if (resData?.event) {
          setOrders((prev) =>
            prev.map((o) =>
              o.id === editingOrder.id
                ? {
                    ...o,
                    timeline: [...(o.timeline || []), resData.event],
                    ...(extra?.carrier ? { carrier: extra.carrier } : {}),
                    ...(extra?.trackingNumber ? { trackingNumber: extra.trackingNumber } : {}),
                  }
                : o
            )
          );
          setEditingOrder((prev: any) =>
            prev && prev.id === editingOrder.id
              ? {
                  ...prev,
                  timeline: [...(prev.timeline || []), resData.event],
                  ...(extra?.carrier ? { carrier: extra.carrier } : {}),
                  ...(extra?.trackingNumber ? { trackingNumber: extra.trackingNumber } : {}),
                }
              : prev
          );
        } else {
          await fetchOrders();
        }
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
        const resData = await res.json();
        if (resData?.event) {
          setOrders((prev) =>
            prev.map((o) =>
              o.id === editingOrder.id
                ? { ...o, timeline: [...(o.timeline || []), resData.event] }
                : o
            )
          );
          setEditingOrder((prev: any) =>
            prev && prev.id === editingOrder.id
              ? { ...prev, timeline: [...(prev.timeline || []), resData.event] }
              : prev
          );
        } else {
          await fetchOrders();
        }
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

  const getOrderDisplayItems = (order: any): OrderItem[] => {
    if (Array.isArray(order?.enrichedItems) && order.enrichedItems.length > 0) {
      return order.enrichedItems;
    }
    return getParsedItems(order?.items || '[]');
  };

  const handleCopyRef = (ref: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(ref);
    setCopiedRef(ref);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  // Multi-job profile determination (defaults to ADMIN_FULL so all status transitions are unlocked)
  const jobProfile: 'CONFIRMATION' | 'PREPARATION' | 'LOGISTICS' | 'SUPPORT' | 'ADMIN_FULL' = useMemo(() => {
    if (!currentUser) return 'ADMIN_FULL';
    const role = (currentUser.role || '').toUpperCase();
    if (
      currentUser.isOwner ||
      role === 'OWNER' ||
      role === 'CO_OWNER' ||
      role === 'SUPER_ADMIN' ||
      role === 'ADMIN' ||
      role === 'GENERAL_MANAGER' ||
      role === 'FINANCE_DIRECTOR' ||
      role === 'ACCOUNTANT' ||
      role === 'AUDITOR_CONSULTANT'
    ) {
      return 'ADMIN_FULL';
    }
    if (role.includes('CONFIRMATION')) return 'CONFIRMATION';
    if (role.includes('PREPARATION') || role.includes('STOCK') || role.includes('INVENTORY')) return 'PREPARATION';
    if (role.includes('SHIPPING') || role.includes('LOGISTICS') || role.includes('OPERATIONS')) return 'LOGISTICS';
    if (role.includes('SUPPORT') || role.includes('CRM') || role.includes('CUSTOMER')) return 'SUPPORT';
    return 'ADMIN_FULL';
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

  // Detected Test Orders (Fake, Demo, Test names, test emails, or test numbers)
  const testOrders = useMemo(() => orders.filter(isTestOrder), [orders]);

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
      TEST: testOrders.length,
    };
  }, [orders, testOrders]);

  // Filtered & sorted orders
  const filteredOrders = useMemo(() => {
    const q = search.toLowerCase().trim();
    const list = orders.filter((o: any) => {
      const matchesSearch =
        !q ||
        (o.orderNumber && o.orderNumber.toLowerCase().includes(q)) ||
        (o.customerName && o.customerName.toLowerCase().includes(q)) ||
        (o.shippingCity && o.shippingCity.toLowerCase().includes(q)) ||
        (o.customerPhone && o.customerPhone.includes(q)) ||
        (o.items && String(o.items).toLowerCase().includes(q));

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
      if (activeTab === 'TEST') return isTestOrder(o);
      if (activeTab === 'TO_CONFIRM') return o.status === 'pending' || o.status === 'unconfirmed';
      if (activeTab === 'PENDING') return o.status === 'pending';
      if (activeTab === 'UNCONFIRMED') return o.status === 'unconfirmed';
      if (activeTab === 'PROCESSING') return o.status === 'processing' || o.status === 'confirmed';
      if (activeTab === 'SHIPPED') return o.status === 'shipped';
      if (activeTab === 'DELIVERED') return o.status === 'delivered';
      if (activeTab === 'ISSUES') return o.status === 'refused' || o.status === 'returned';

      return true;
    });

    if (sortBy === 'TOTAL_DESC') {
      return [...list].sort((a, b) => (Number(b.total) || 0) - (Number(a.total) || 0));
    }
    if (sortBy === 'TOTAL_ASC') {
      return [...list].sort((a, b) => (Number(a.total) || 0) - (Number(b.total) || 0));
    }
    if (sortBy === 'PRIORITY') {
      const rank: Record<string, number> = {
        pending: 0,
        unconfirmed: 1,
        processing: 2,
        confirmed: 2,
        shipped: 3,
        delivered: 4,
        refused: 5,
        returned: 6,
      };
      return [...list].sort((a, b) => (rank[a.status] ?? 9) - (rank[b.status] ?? 9));
    }
    return list;
  }, [orders, search, activeTab, cityFilter, paymentFilter, sortBy]);

  // Key Metrics & Rates
  const totalOrdersCount = orders.length;
  const confirmedCount = useMemo(() => orders.filter(o => o.status === 'processing' || o.status === 'confirmed' || o.status === 'shipped' || o.status === 'delivered').length, [orders]);
  const unconfirmedCount = tabCounts.UNCONFIRMED;
  const deliveredCount = tabCounts.DELIVERED;
  const returnedCount = tabCounts.ISSUES;

  const tauxConfirmation = totalOrdersCount > 0 ? ((confirmedCount / totalOrdersCount) * 100).toFixed(1) : '0';
  const dispatchedCount = orders.filter(o => o.status === 'shipped' || o.status === 'delivered' || o.status === 'refused' || o.status === 'returned').length;
  const tauxLivraisonExpedie = dispatchedCount > 0 ? ((deliveredCount / dispatchedCount) * 100).toFixed(1) : '0';
  const tauxLivraison = totalOrdersCount > 0 ? ((deliveredCount / totalOrdersCount) * 100).toFixed(1) : '0';
  const tauxRetour = totalOrdersCount > 0 ? ((returnedCount / totalOrdersCount) * 100).toFixed(1) : '0';
  const tauxRetourExpedie = dispatchedCount > 0 ? ((returnedCount / dispatchedCount) * 100).toFixed(1) : '0';

  const totalRevenue = useMemo(() => orders.reduce((acc, o) => acc + (Number(o.total) || 0), 0), [orders]);
  const deliveredRevenue = useMemo(() => orders.filter(o => o.status === 'delivered').reduce((acc, o) => acc + (Number(o.total) || 0), 0), [orders]);
  const averageOrderValue = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;

  // Revenue breakdown per Pipeline Stage (matching Executive Dashboard)
  const pipelineTotals = useMemo(() => {
    const sumBy = (pred: (o: any) => boolean) =>
      orders.filter(pred).reduce((acc, o) => acc + (Number(o.total) || 0), 0);
    return {
      pendingRevenue: sumBy((o) => o.status === 'pending'),
      unconfirmedRevenue: sumBy((o) => o.status === 'unconfirmed'),
      processingRevenue: sumBy((o) => o.status === 'processing' || o.status === 'confirmed'),
      shippedRevenue: sumBy((o) => o.status === 'shipped'),
      deliveredRevenue: sumBy((o) => o.status === 'delivered'),
      issuesRevenue: sumBy((o) => o.status === 'refused' || o.status === 'returned'),
      filteredRevenue: filteredOrders.reduce((acc, o) => acc + (Number(o.total) || 0), 0),
    };
  }, [orders, filteredOrders]);

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

  // Moroccan WhatsApp Smart Message Builder (table quick menu)
  const getWhatsAppPresetText = buildWhatsAppPresetText;

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
    const text = getWhatsAppPresetText(presetType, {
      customerName,
      orderNumber,
      items: JSON.stringify([{ name: itemsText, quantity: 1 }]),
      shippingCity: city,
      total,
      paidAmount: paid,
    });
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

  // Delete single order
  const handleConfirmDeleteSingle = async () => {
    if (!orderToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderToDelete.id }),
      });
      if (res.ok) {
        setOrders((prev) => prev.filter((o) => o.id !== orderToDelete.id));
        setSelectedOrderIds((prev) => prev.filter((id) => id !== orderToDelete.id));
        if (editingOrder?.id === orderToDelete.id) {
          setEditingOrder(null);
        }
        setDeleteSuccessMessage(`La commande #${orderToDelete.orderNumber} a été supprimée définitivement.`);
        setTimeout(() => setDeleteSuccessMessage(null), 4000);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Erreur lors de la suppression de la commande');
      }
    } catch (err) {
      console.error(err);
      alert('Erreur réseau lors de la suppression');
    } finally {
      setIsDeleting(false);
      setOrderToDelete(null);
    }
  };

  // Delete all detected test orders
  const handleConfirmDeleteAllTestOrders = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteTestOnly: true }),
      });
      if (res.ok) {
        const data = await res.json();
        const deletedIds = data.deletedIds || [];
        setOrders((prev) => prev.filter((o) => !deletedIds.includes(o.id)));
        setSelectedOrderIds((prev) => prev.filter((id) => !deletedIds.includes(id)));
        if (editingOrder && deletedIds.includes(editingOrder.id)) {
          setEditingOrder(null);
        }
        setDeleteSuccessMessage(`${data.deletedCount || testOrders.length} commande(s) test nettoyée(s) avec succès.`);
        setTimeout(() => setDeleteSuccessMessage(null), 5000);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Erreur lors de la suppression des commandes tests');
      }
    } catch (err) {
      console.error(err);
      alert('Erreur réseau lors de la suppression');
    } finally {
      setIsDeleting(false);
      setShowDeleteTestModal(false);
    }
  };

  // Bulk delete selected orders
  const handleConfirmBulkDelete = async () => {
    if (selectedOrderIds.length === 0) return;
    setIsDeleting(true);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedOrderIds }),
      });
      if (res.ok) {
        setOrders((prev) => prev.filter((o) => !selectedOrderIds.includes(o.id)));
        if (editingOrder && selectedOrderIds.includes(editingOrder.id)) {
          setEditingOrder(null);
        }
        setDeleteSuccessMessage(`${selectedOrderIds.length} commande(s) supprimée(s) définitivement.`);
        setSelectedOrderIds([]);
        setTimeout(() => setDeleteSuccessMessage(null), 4000);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Erreur lors de la suppression groupée');
      }
    } catch (err) {
      console.error(err);
      alert('Erreur réseau lors de la suppression');
    } finally {
      setIsDeleting(false);
      setShowBulkDeleteModal(false);
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

  // Complete Order Lifecycle Status Options (All 7 Options Always Accessible)
  const ALL_ORDER_STATUS_OPTIONS = [
    { value: 'pending', label: 'En attente', desc: 'Arrivée boutique', dot: 'bg-slate-400', group: 'Traitement & Confirmation' },
    { value: 'unconfirmed', label: 'Non confirmé', desc: 'Appel / WhatsApp requis', dot: 'bg-amber-500', group: 'Traitement & Confirmation' },
    { value: 'processing', label: 'En préparation', desc: 'Confirmée & flaconnage', dot: 'bg-[#0ea5e9]', group: 'Traitement & Confirmation' },
    { value: 'shipped', label: 'En livraison', desc: 'Remis au transporteur', dot: 'bg-indigo-500', group: 'Expédition & Clôture' },
    { value: 'delivered', label: 'Livrée & Encaissée', desc: 'Clôturée avec succès', dot: 'bg-emerald-500', group: 'Expédition & Clôture' },
    { value: 'refused', label: 'Refusée', desc: 'Refus client / annulée', dot: 'bg-rose-500', group: 'Incidents & Retours' },
    { value: 'returned', label: 'Retour colis', desc: 'Incident logistique', dot: 'bg-rose-600', group: 'Incidents & Retours' },
  ];

  const getStatusOptions = (_profile?: string) => ALL_ORDER_STATUS_OPTIONS;

  const getInitials = (name: string) => {
    if (!name) return 'CL';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  function ProfessionalStatusBadge({ status }: { status: string }) {
    const configs: Record<string, { label: string; bg: string; dot: string; ping: string }> = {
      pending: { 
        label: 'En attente', 
        bg: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20', 
        dot: 'bg-slate-400',
        ping: 'bg-slate-400'
      },
      unconfirmed: { 
        label: 'Non confirmée', 
        bg: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20', 
        dot: 'bg-amber-500',
        ping: 'bg-amber-400'
      },
      processing: { 
        label: 'Confirmée / Prépa', 
        bg: 'bg-sky-500/10 text-[#0284c7] dark:text-[#38bdf8] border border-sky-500/20', 
        dot: 'bg-[#1D9BF0]',
        ping: 'bg-sky-400'
      },
      confirmed: { 
        label: 'Confirmée', 
        bg: 'bg-sky-500/10 text-[#0284c7] dark:text-[#38bdf8] border border-sky-500/20', 
        dot: 'bg-[#1D9BF0]',
        ping: 'bg-sky-400'
      },
      shipped: { 
        label: 'En livraison', 
        bg: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20', 
        dot: 'bg-indigo-500',
        ping: 'bg-indigo-400'
      },
      delivered: { 
        label: 'Livrée & Encaissée', 
        bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.12)]', 
        dot: 'bg-emerald-500',
        ping: 'bg-emerald-400'
      },
      refused: { 
        label: 'Refusée', 
        bg: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20', 
        dot: 'bg-rose-500',
        ping: 'bg-rose-400'
      },
      returned: { 
        label: 'Retour Colis', 
        bg: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20', 
        dot: 'bg-rose-500',
        ping: 'bg-rose-400'
      },
    };

    const config = configs[status] || {
      label: STATUS_LABELS[status] || status,
      bg: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20',
      dot: 'bg-slate-400',
      ping: 'bg-slate-400'
    };

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold whitespace-nowrap backdrop-blur-xs transition-all ${config.bg}`}>
        <span className="relative flex h-1.5 w-1.5">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.ping}`} />
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${config.dot}`} />
        </span>
        <span>{config.label}</span>
      </span>
    );
  }

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
    <div className="max-w-[1600px] mx-auto space-y-6 pb-12 font-sans text-slate-900 dark:text-slate-100">
      
      {/* ── 1. REFINED EXECUTIVE HEADER ───────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-white/[0.06]">
        <div>
          <div className="flex items-center gap-x-2 gap-y-0.5 mb-1.5 flex-wrap text-[11px] font-semibold tracking-[0.1em] uppercase text-slate-500 dark:text-slate-400">
            <span>NAY PARFUMS · COMMANDES &amp; LOGISTIQUE</span>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">·</span>
            <span className="inline-flex items-center gap-1.5 normal-case tracking-normal font-medium text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              {orders.length} commandes
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Commandes &amp; Expéditions
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mt-0.5">
            Validation téléphonique des commandes, suivi logistique et encaissements COD en temps réel.
          </p>
        </div>

        {/* Global Action Cluster */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
          <div className="grid grid-cols-2 sm:flex items-center gap-2">
            <button
              type="button"
              onClick={fetchOrders}
              disabled={isLoading}
              className="h-10 sm:h-9 inline-flex items-center justify-center gap-1.5 px-3.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-[#14151f] dark:hover:bg-[#1a1b28] border border-slate-200/90 dark:border-white/[0.08] text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs transition-all cursor-pointer active:scale-95"
              title="Actualiser les commandes"
            >
              <RefreshCw size={13} className={isLoading ? 'animate-spin text-[#0ea5e9]' : 'text-slate-500 dark:text-slate-400'} />
              <span>Actualiser</span>
            </button>

            <button
              type="button"
              onClick={handleExportOrdersCSV}
              className="h-10 sm:h-9 inline-flex items-center justify-center gap-1.5 px-3.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-[#14151f] dark:hover:bg-[#1a1b28] border border-slate-200/90 dark:border-white/[0.08] text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs transition-all cursor-pointer active:scale-95"
              title="Exporter en fichier CSV Excel"
            >
              <FileSpreadsheet size={13} className="text-[#0ea5e9]" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="h-10 sm:h-9 grid grid-cols-2 sm:flex items-center p-1 rounded-xl bg-slate-100/90 dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/[0.08] text-xs w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setExecutiveView('OPERATIONAL')}
              className={`relative h-8 sm:h-7 px-3.5 rounded-lg transition-colors cursor-pointer text-xs font-bold flex items-center justify-center ${
                executiveView === 'OPERATIONAL'
                  ? 'text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {executiveView === 'OPERATIONAL' && (
                <motion.span
                  layoutId="orders-exec-view-pill"
                  transition={{ type: 'spring', stiffness: 450, damping: 34 }}
                  className="absolute inset-0 rounded-lg shadow-xs"
                  style={{ backgroundColor: 'var(--admin-accent, #0ea5e9)' }}
                />
              )}
              <span className="relative z-10">Opérations</span>
            </button>
            <button
              type="button"
              onClick={() => setExecutiveView('FINANCIAL')}
              className={`relative h-8 sm:h-7 px-3.5 rounded-lg transition-colors cursor-pointer text-xs font-bold flex items-center justify-center ${
                executiveView === 'FINANCIAL'
                  ? 'text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {executiveView === 'FINANCIAL' && (
                <motion.span
                  layoutId="orders-exec-view-pill"
                  transition={{ type: 'spring', stiffness: 450, damping: 34 }}
                  className="absolute inset-0 rounded-lg shadow-xs"
                  style={{ backgroundColor: 'var(--admin-accent, #0ea5e9)' }}
                />
              )}
              <span className="relative z-10">Trésorerie</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. EXECUTIVE METRIC KPI CARDS (MATCHING FIRST PAGE DASHBOARD) ──── */}
      {executiveView === 'OPERATIONAL' ? (
        <div className="space-y-4">
          <div className="nay-stagger grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Commandes - Maison Obsidian Lead Card */}
            <div
              onClick={() => setActiveTab('ALL')}
              className="nay-hero-shine nay-card-lift bg-[#0b1322] dark:bg-[#0f172a] rounded-2xl p-5 sm:p-6 text-white border border-slate-800/90 dark:border-sky-500/20 shadow-md relative overflow-hidden flex flex-col justify-between min-h-[180px] hover:border-sky-500/40 transition-all cursor-pointer group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/[0.08] border border-white/[0.12] text-sky-300 flex items-center justify-center shrink-0">
                      <ShoppingBag size={17} strokeWidth={2} />
                    </div>
                    <div>
                      <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-300 leading-tight">
                        TOTAL COMMANDES
                      </h3>
                      <p className="text-[11px] text-slate-400 font-normal leading-tight mt-0.5">
                        Flux global boutique e-commerce
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/[0.08] text-emerald-300 border border-white/[0.12] shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Direct
                  </span>
                </div>

                <div className="flex items-baseline justify-between gap-1.5 mt-3 mb-1">
                  <div className="text-xl sm:text-2xl font-bold tracking-tight text-white tabular-nums">
                    {orders.length}
                    <span className="text-xs font-medium text-slate-400 ml-1.5">colis</span>
                  </div>
                  <span className="inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-white/[0.08] text-sky-300 border border-white/[0.12] shrink-0 tabular-nums">
                    Panier : {formatMAD(averageOrderValue)}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400 mt-3 gap-1">
                <span>Valeur brute : <strong className="text-white font-semibold tabular-nums">{formatMAD(totalRevenue)}</strong></span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-white/[0.1] group-hover:bg-white/[0.18] border border-white/[0.15] px-2.5 py-1 rounded-lg transition-colors">
                  <span>Tout voir</span>
                  <ArrowRight size={12} />
                </span>
              </div>
            </div>

            {/* Card 2: À Confirmer & Préparer */}
            <div
              onClick={() => setActiveTab('TO_CONFIRM')}
              className="nay-card-lift bg-white dark:bg-[#1c1c20] rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-[#2c2c34] shadow-xs flex flex-col justify-between min-h-[180px] hover:border-amber-300 dark:hover:border-amber-500/40 transition-all cursor-pointer group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200/80 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
                      <Clock size={17} strokeWidth={2} />
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 leading-tight">
                        À CONFIRMER &amp; PRÉPARER
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-normal leading-tight mt-0.5">
                        Traitement prioritaire
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-500/20 shrink-0">
                    Prioritaire
                  </span>
                </div>

                <div className="flex items-baseline justify-between gap-2 mt-3 mb-1">
                  <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
                    {tabCounts.TO_CONFIRM_COMBINED + tabCounts.PROCESSING}
                    <span className="text-xs font-normal text-slate-400 ml-1.5">colis</span>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-500/20">
                    {tabCounts.TO_CONFIRM_COMBINED} à appeler
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-[#2c2c34] flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 mt-3 gap-2">
                <span className="truncate">
                  <strong className="text-amber-600 dark:text-amber-400 font-semibold">{tabCounts.PENDING}</strong> attente • <strong className="text-[#0284C7] dark:text-[#38BDF8] font-semibold">{tabCounts.PROCESSING}</strong> prépa
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0284C7] dark:text-[#38BDF8] group-hover:translate-x-0.5 transition-transform">
                  <span>Traiter</span>
                  <ArrowRight size={12} />
                </span>
              </div>
            </div>

            {/* Card 3: En Acheminement */}
            <div
              onClick={() => setActiveTab('SHIPPED')}
              className="nay-card-lift bg-white dark:bg-[#1c1c20] rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-[#2c2c34] shadow-xs flex flex-col justify-between min-h-[180px] hover:border-sky-300 dark:hover:border-sky-500/40 transition-all cursor-pointer group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-sky-50 dark:bg-sky-500/10 border border-sky-200/80 dark:border-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 shadow-xs">
                      <Truck size={17} strokeWidth={2} />
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 leading-tight">
                        EN ACHEMINEMENT
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-normal leading-tight mt-0.5">
                        Expédiés par transporteur
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-200 dark:border-sky-500/20 shrink-0">
                    En cours
                  </span>
                </div>

                <div className="flex items-baseline justify-between gap-2 mt-3 mb-1">
                  <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
                    {tabCounts.SHIPPED}
                    <span className="text-xs font-normal text-slate-400 ml-1.5">colis</span>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-200/80 dark:border-sky-500/20">
                    {totalOrdersCount > 0 ? Math.round((tabCounts.SHIPPED / totalOrdersCount) * 100) : 0}% du flux
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-[#2c2c34] flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 mt-3 gap-2">
                <span className="truncate">
                  Créances COD : <strong className="text-slate-900 dark:text-white font-semibold tabular-nums">{formatMAD(financialEstimations.remainingToCollectShippedGross)}</strong>
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0284C7] dark:text-[#38BDF8] group-hover:translate-x-0.5 transition-transform">
                  <span>Suivre</span>
                  <ArrowRight size={12} />
                </span>
              </div>
            </div>

            {/* Card 4: Livrées & Clôturées */}
            <div
              onClick={() => setActiveTab('DELIVERED')}
              className="nay-card-lift bg-white dark:bg-[#1c1c20] rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-[#2c2c34] shadow-xs flex flex-col justify-between min-h-[180px] hover:border-emerald-300 dark:hover:border-emerald-500/40 transition-all cursor-pointer group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/80 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-xs">
                      <CheckCircle2 size={17} strokeWidth={2} />
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 leading-tight">
                        LIVRÉES &amp; CLÔTURÉES
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-normal leading-tight mt-0.5">
                        Encaissements effectifs
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20 shrink-0">
                    {tauxLivraison}%
                  </span>
                </div>

                <div className="flex items-baseline justify-between gap-2 mt-3 mb-1">
                  <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
                    {tabCounts.DELIVERED}
                    <span className="text-xs font-normal text-slate-400 ml-1.5">colis</span>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-500/20">
                    ✓ Encaissé
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-[#2c2c34] flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 mt-3 gap-2">
                <span className="truncate">
                  Encaissé net : <strong className="text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">{formatMAD(deliveredRevenue)}</strong>
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform">
                  <span>Détails</span>
                  <ArrowRight size={12} />
                </span>
              </div>
            </div>
          </div>

          {/* ── 2B. 4 OPERATIONAL RATIO BARS (DASHBOARD DNA) ─────────── */}
          <div className="nay-stagger grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Confirmation Rate */}
            <div className="nay-card-lift rounded-xl p-4 bg-white dark:bg-[#1C2025] border border-slate-200 dark:border-[#2A3038] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-400 flex items-center gap-1.5 text-[11px]">
                  <span className="w-5 h-5 rounded-md bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={12} strokeWidth={2.2} />
                  </span>
                  CONFIRMATION
                </span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold text-sm">{tauxConfirmation}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-[#23282E] h-1.5 rounded-full overflow-hidden my-2">
                <div className="nay-progress-fill bg-emerald-600 dark:bg-emerald-400 h-full rounded-full transition-all duration-300" style={{ width: `${tauxConfirmation}%` }} />
              </div>
              <div className="text-xs text-slate-500 dark:text-zinc-400 flex items-center justify-between pt-1">
                <span><strong className="text-slate-800 dark:text-slate-200 font-semibold">{confirmedCount}</strong> validées sur {totalOrdersCount}</span>
                <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                  {unconfirmedCount} à relancer
                </span>
              </div>
            </div>

            {/* Delivery Rate */}
            <div className="nay-card-lift rounded-xl p-4 bg-white dark:bg-[#1C2025] border border-slate-200 dark:border-[#2A3038] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-400 flex items-center gap-1.5 text-[11px]">
                  <span className="w-5 h-5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Truck size={12} strokeWidth={2.2} />
                  </span>
                  TAUX LIVRAISON
                </span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold text-sm">{tauxLivraisonExpedie}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-[#23282E] h-1.5 rounded-full overflow-hidden my-2">
                <div className="nay-progress-fill bg-indigo-600 dark:bg-indigo-400 h-full rounded-full transition-all duration-300" style={{ width: `${tauxLivraisonExpedie}%` }} />
              </div>
              <div className="text-xs text-slate-500 dark:text-zinc-400 flex items-center justify-between pt-1">
                <span><strong className="text-slate-800 dark:text-slate-200 font-semibold">{deliveredCount}</strong> colis encaissés</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono text-[11px]">{formatMAD(deliveredRevenue)}</span>
              </div>
            </div>

            {/* Return Rate */}
            <div className="nay-card-lift rounded-xl p-4 bg-white dark:bg-[#1C2025] border border-slate-200 dark:border-[#2A3038] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-400 flex items-center gap-1.5 text-[11px]">
                  <span className="w-5 h-5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                    <RotateCcw size={12} strokeWidth={2.2} />
                  </span>
                  TAUX DE RETOUR
                </span>
                <span className="font-mono text-rose-600 dark:text-rose-400 font-bold text-sm">{tauxRetour}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-[#23282E] h-1.5 rounded-full overflow-hidden my-2">
                <div className="nay-progress-fill bg-rose-600 dark:bg-rose-400 h-full rounded-full transition-all duration-300" style={{ width: `${tauxRetour}%` }} />
              </div>
              <div className="text-xs text-slate-500 dark:text-zinc-400 flex items-center justify-between pt-1">
                <span><strong className="text-slate-800 dark:text-slate-200 font-semibold">{returnedCount}</strong> retours</span>
                <span className="text-[10px] text-slate-400 font-normal">{tauxRetourExpedie}% des envois</span>
              </div>
            </div>

            {/* Advance Payments / Prepaid */}
            <div className="nay-card-lift rounded-xl p-4 bg-white dark:bg-[#1C2025] border border-slate-200 dark:border-[#2A3038] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-400 flex items-center gap-1.5 text-[11px]">
                  <span className="w-5 h-5 rounded-md bg-sky-50 dark:bg-sky-950/40 text-[#0284c7] dark:text-[#38bdf8] flex items-center justify-center shrink-0">
                    <CreditCard size={12} strokeWidth={2.2} />
                  </span>
                  ACOMPTES &amp; RÉGLÉS
                </span>
                <span className="font-mono text-[#0284c7] dark:text-[#38bdf8] font-bold text-sm">
                  {totalOrdersCount > 0 ? Math.round(((financialEstimations.countWithAdvance + financialEstimations.countPaid100) / totalOrdersCount) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-[#23282E] h-1.5 rounded-full overflow-hidden my-2">
                <div
                  className="nay-progress-fill bg-[#0ea5e9] dark:bg-[#38bdf8] h-full rounded-full transition-all duration-300"
                  style={{ width: `${totalOrdersCount > 0 ? Math.min(100, Math.round(((financialEstimations.countWithAdvance + financialEstimations.countPaid100) / totalOrdersCount) * 100)) : 0}%` }}
                />
              </div>
              <div className="text-xs text-slate-500 dark:text-zinc-400 flex items-center justify-between pt-1">
                <span><strong className="text-slate-800 dark:text-slate-200 font-semibold">{financialEstimations.countWithAdvance + financialEstimations.countPaid100}</strong> sécurisées</span>
                <span className="font-semibold text-[#0284c7] dark:text-[#38bdf8] font-mono text-[11px]">{formatMAD(financialEstimations.advancesOnActiveOrders)}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="text-slate-600 dark:text-slate-400 font-medium">
              Frais de livraison : <strong className="text-slate-900 dark:text-white font-bold">{shippingFeePerOrder} MAD</strong> / colis
            </div>
            <div className="flex items-center p-1 rounded-xl bg-slate-100/90 dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/[0.08] text-xs">
              <button
                type="button"
                onClick={() => setEstimationMode('NET')}
                className={`relative px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer font-bold ${
                  estimationMode === 'NET'
                    ? 'text-slate-900 dark:text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {estimationMode === 'NET' && (
                  <motion.span
                    layoutId="orders-estimation-mode-pill"
                    transition={{ type: 'spring', stiffness: 450, damping: 34 }}
                    className="absolute inset-0 rounded-lg bg-white dark:bg-[#1b2234] shadow-xs"
                  />
                )}
                <span className="relative z-10">Vue Nette (-{shippingFeePerOrder} DH)</span>
              </button>
              <button
                type="button"
                onClick={() => setEstimationMode('BRUT')}
                className={`relative px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer font-bold ${
                  estimationMode === 'BRUT'
                    ? 'text-slate-900 dark:text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {estimationMode === 'BRUT' && (
                  <motion.span
                    layoutId="orders-estimation-mode-pill"
                    transition={{ type: 'spring', stiffness: 450, damping: 34 }}
                    className="absolute inset-0 rounded-lg bg-white dark:bg-[#1b2234] shadow-xs"
                  />
                )}
                <span className="relative z-10">Vue Brute</span>
              </button>
            </div>
          </div>

          <div className="nay-stagger grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="nay-hero-shine nay-card-lift bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-500 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/15 relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/90">{estimationMode === 'NET' ? 'Cash Net Encaissé' : 'Cash Brut Encaissé'}</span>
                <span className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center border border-white/30 shrink-0">
                  <DollarSign size={15} strokeWidth={2.2} />
                </span>
              </div>
              <div className="text-2xl sm:text-[28px] font-black text-white font-mono mt-1 tabular-nums">
                {formatMAD(financialEstimations.displayedCashCollected)}
              </div>
              <div className="mt-2.5 flex items-center justify-between text-xs text-white/85 pt-2 border-t border-white/20">
                <span>Acomptes : <strong className="font-bold text-white font-mono">{formatMAD(financialEstimations.advancesOnActiveOrders)}</strong></span>
                <span className="text-[10px] font-bold text-white bg-white/20 px-2 py-0.5 rounded-full border border-white/30">
                  Encaissé
                </span>
              </div>
            </div>

            <div className="nay-card-lift bg-white dark:bg-[#1c1c20] rounded-2xl p-5 border border-slate-200/80 dark:border-[#2c2c34] shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{estimationMode === 'NET' ? 'Créances Nettes' : 'Créances Brutes'}</span>
                <span className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200/80 dark:border-indigo-500/20 shrink-0">
                  <Truck size={15} strokeWidth={2.2} />
                </span>
              </div>
              <div className="text-2xl sm:text-[28px] font-black text-slate-950 dark:text-white font-mono mt-1 tabular-nums">
                {formatMAD(financialEstimations.displayedShipped)}
              </div>
              <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-[#2c2c34]">
                <span>{financialEstimations.shippedOrdersCount} colis transporteur</span>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-200/80 dark:border-indigo-500/20">
                  En cours
                </span>
              </div>
            </div>

            <div className="nay-card-lift bg-white dark:bg-[#1c1c20] rounded-2xl p-5 border border-slate-200/80 dark:border-[#2c2c34] shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{estimationMode === 'NET' ? 'Solde Net Préparation' : 'Solde Brut Préparation'}</span>
                <span className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-500/10 text-[#0ea5e9] flex items-center justify-center border border-sky-200/80 dark:border-sky-500/20 shrink-0">
                  <Package size={15} strokeWidth={2.2} />
                </span>
              </div>
              <div className="text-2xl sm:text-[28px] font-black text-slate-950 dark:text-white font-mono mt-1 tabular-nums">
                {formatMAD(financialEstimations.displayedProcessing)}
              </div>
              <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-[#2c2c34]">
                <span>{financialEstimations.processingOrdersCount} colis à expédier</span>
                <span className="text-[10px] font-bold text-[#0ea5e9] bg-sky-50 dark:bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-200/80 dark:border-sky-500/20">
                  Stock prêt
                </span>
              </div>
            </div>

            <div className="nay-card-lift bg-white dark:bg-[#1c1c20] rounded-2xl p-5 border border-slate-200/80 dark:border-[#2c2c34] shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{estimationMode === 'NET' ? 'Estimation Nette Réelle' : 'Estimation Brute'}</span>
                <span className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200/80 dark:border-amber-500/20 shrink-0">
                  <Calculator size={15} strokeWidth={2.2} />
                </span>
              </div>
              <div className="text-2xl sm:text-[28px] font-black text-slate-950 dark:text-white font-mono mt-1 tabular-nums">
                {formatMAD(financialEstimations.displayedEstimation)}
              </div>
              <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-[#2c2c34]">
                <span>{estimationMode === 'NET' ? `Frais déduits (${formatMAD(financialEstimations.totalShippingFeesIncurredAndExpected)})` : 'Total facturé'}</span>
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-200/80 dark:border-amber-500/20">
                  Prévision
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. INTERACTIVE 6-STAGE FULFILLMENT PIPELINE (FIRST PAGE DASHBOARD DNA) ─── */}
      <div className="nay-enter bg-white dark:bg-[#1C2025] rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-[#2A3038] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-[#2e2e36]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-50 dark:bg-sky-500/10 border border-sky-200/80 dark:border-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <Boxes size={18} strokeWidth={2} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Pipeline Interactif des Commandes ({tabCounts.ALL})
                </h2>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Cliquez sur une étape pour filtrer le tableau
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  {deliveredCount} livrées ({totalOrdersCount > 0 ? Math.round((deliveredCount / totalOrdersCount) * 100) : 0}%)
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {testOrders.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('TEST')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'TEST'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/25 hover:bg-rose-100'
                }`}
              >
                <AlertTriangle size={12} />
                <span>Tests ({testOrders.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'ALL'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-white/10'
              }`}
            >
              <span>Toutes les commandes</span>
              <span className="font-mono opacity-80">({tabCounts.ALL})</span>
            </button>
          </div>
        </div>

        {/* Mobile Horizontal Snap Stage Filter Pills (< 768px) */}
        <div className="md:hidden nay-mobile-snap-row gap-2 pt-3">
          {[
            { id: 'ALL', label: 'Toutes', count: tabCounts.ALL, dot: 'bg-slate-400' },
            { id: 'UNCONFIRMED', label: 'À confirmer', count: tabCounts.UNCONFIRMED, dot: 'bg-amber-500' },
            { id: 'PENDING', label: 'En attente', count: tabCounts.PENDING, dot: 'bg-slate-400' },
            { id: 'PROCESSING', label: 'En prépa', count: tabCounts.PROCESSING, dot: 'bg-[#0ea5e9]' },
            { id: 'SHIPPED', label: 'Livraison', count: tabCounts.SHIPPED, dot: 'bg-indigo-500' },
            { id: 'DELIVERED', label: 'Livrées', count: tabCounts.DELIVERED, dot: 'bg-emerald-500' },
            { id: 'ISSUES', label: 'Retours', count: tabCounts.ISSUES, dot: 'bg-rose-500' },
          ].map((chip) => {
            const isActive = activeTab === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setActiveTab(isActive && chip.id !== 'ALL' ? 'ALL' : chip.id)}
                className={`nay-mobile-snap-card px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 border-slate-900 dark:border-white shadow-xs'
                    : 'bg-slate-50 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-white/10'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${chip.dot}`} />
                <span>{chip.label}</span>
                <span className={`font-mono text-[10.5px] ${isActive ? 'opacity-80' : 'opacity-60'}`}>
                  ({chip.count})
                </span>
              </button>
            );
          })}
        </div>

        {/* 6 Interactive Pipeline Stage Pods (Tablet / Desktop) */}
        <div className="hidden md:grid nay-stagger grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4">
          {/* Pod 1: En attente */}
          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'PENDING' ? 'ALL' : 'PENDING')}
            className={`nay-card-lift text-left p-4 rounded-xl bg-slate-50/70 dark:bg-[#22272E]/60 hover:bg-slate-100 dark:hover:bg-[#282E36] border transition-all flex flex-col justify-between cursor-pointer ${
              activeTab === 'PENDING'
                ? 'border-[#0ea5e9] ring-2 ring-[#0ea5e9]/25 shadow-md'
                : 'border-slate-200/80 dark:border-[#2E3640]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="w-6 h-6 rounded-full bg-slate-200/70 dark:bg-white/10 flex items-center justify-center text-slate-600 dark:text-slate-400">
                  <Clock size={12} strokeWidth={2} />
                </span>
                <span className="text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400">
                  {totalOrdersCount > 0 ? Math.round((tabCounts.PENDING / totalOrdersCount) * 100) : 0}%
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                {tabCounts.PENDING}
              </div>
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">
                En attente
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Arrivée boutique
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-700 dark:text-slate-300 font-mono">
              <span>{formatMAD(pipelineTotals.pendingRevenue)}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            </div>
          </button>

          {/* Pod 2: À confirmer */}
          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'UNCONFIRMED' ? 'ALL' : 'UNCONFIRMED')}
            className={`nay-card-lift text-left p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 hover:bg-amber-50 dark:hover:bg-amber-950/30 border-2 transition-all flex flex-col justify-between cursor-pointer ${
              activeTab === 'UNCONFIRMED'
                ? 'border-amber-500 ring-2 ring-amber-400/35 shadow-md'
                : 'border-amber-300 dark:border-amber-600/40'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Phone size={12} strokeWidth={2} />
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300">
                  # Priorité
                </span>
              </div>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono tabular-nums">
                {tabCounts.UNCONFIRMED}
              </div>
              <div className="text-xs font-semibold text-amber-800 dark:text-amber-300 mt-1">
                À confirmer
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Appel / WhatsApp COD
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-amber-200/60 dark:border-amber-800/50 flex items-center justify-between text-[11px] text-amber-800 dark:text-amber-300 font-mono">
              <span>{formatMAD(pipelineTotals.unconfirmedRevenue)}</span>
              <span className="text-[10px] font-semibold">
                {totalOrdersCount > 0 ? Math.round((tabCounts.UNCONFIRMED / totalOrdersCount) * 100) : 0}%
              </span>
            </div>
          </button>

          {/* Pod 3: En préparation */}
          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'PROCESSING' ? 'ALL' : 'PROCESSING')}
            className={`nay-card-lift text-left p-4 rounded-xl bg-sky-50/50 dark:bg-sky-950/20 hover:bg-sky-50 dark:hover:bg-sky-950/30 border transition-all flex flex-col justify-between cursor-pointer ${
              activeTab === 'PROCESSING'
                ? 'border-[#0ea5e9] ring-2 ring-[#0ea5e9]/30 shadow-md'
                : 'border-sky-200/70 dark:border-sky-800/30'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center text-sky-600 dark:text-sky-400">
                  <Package size={12} strokeWidth={2} />
                </span>
                <span className="text-[10px] font-mono font-semibold text-sky-600 dark:text-sky-400">
                  {totalOrdersCount > 0 ? Math.round((tabCounts.PROCESSING / totalOrdersCount) * 100) : 0}%
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                {tabCounts.PROCESSING}
              </div>
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">
                En prépa
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Mise en flacon NAY
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-sky-200/60 dark:border-sky-800/50 flex items-center justify-between text-[11px] text-slate-700 dark:text-slate-300 font-mono">
              <span>{formatMAD(pipelineTotals.processingRevenue)}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            </div>
          </button>

          {/* Pod 4: En livraison */}
          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'SHIPPED' ? 'ALL' : 'SHIPPED')}
            className={`nay-card-lift text-left p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border transition-all flex flex-col justify-between cursor-pointer ${
              activeTab === 'SHIPPED'
                ? 'border-indigo-500 ring-2 ring-indigo-500/30 shadow-md'
                : 'border-indigo-200/70 dark:border-indigo-800/30'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Truck size={12} strokeWidth={2} />
                </span>
                <span className="text-[10px] font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                  {totalOrdersCount > 0 ? Math.round((tabCounts.SHIPPED / totalOrdersCount) * 100) : 0}%
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                {tabCounts.SHIPPED}
              </div>
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">
                En livraison
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                En transit transporteur
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-indigo-200/60 dark:border-indigo-800/50 flex items-center justify-between text-[11px] text-slate-700 dark:text-slate-300 font-mono">
              <span>{formatMAD(pipelineTotals.shippedRevenue)}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            </div>
          </button>

          {/* Pod 5: Livrées */}
          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'DELIVERED' ? 'ALL' : 'DELIVERED')}
            className={`nay-card-lift text-left p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border-2 transition-all flex flex-col justify-between cursor-pointer ${
              activeTab === 'DELIVERED'
                ? 'border-emerald-500 ring-2 ring-emerald-500/35 shadow-md'
                : 'border-emerald-400 dark:border-emerald-600/40'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck size={12} strokeWidth={2} />
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300">
                  ✓ Encaissé
                </span>
              </div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                {tabCounts.DELIVERED}
              </div>
              <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 mt-1">
                Livrées
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Clôturées avec succès
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-emerald-200/60 dark:border-emerald-800/50 flex items-center justify-between text-[11px] text-emerald-800 dark:text-emerald-300 font-mono">
              <span>{formatMAD(pipelineTotals.deliveredRevenue)}</span>
              <span className="text-[10px] font-semibold">
                {totalOrdersCount > 0 ? Math.round((tabCounts.DELIVERED / totalOrdersCount) * 100) : 0}%
              </span>
            </div>
          </button>

          {/* Pod 6: Retours & Refus */}
          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'ISSUES' ? 'ALL' : 'ISSUES')}
            className={`nay-card-lift text-left p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-50 dark:hover:bg-rose-950/30 border transition-all flex flex-col justify-between cursor-pointer ${
              activeTab === 'ISSUES'
                ? 'border-rose-500 ring-2 ring-rose-500/30 shadow-md'
                : 'border-rose-200/70 dark:border-rose-800/30'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
                  <RotateCcw size={12} strokeWidth={2} />
                </span>
                <span className="text-[10px] font-mono font-semibold text-rose-600 dark:text-rose-400">
                  {totalOrdersCount > 0 ? Math.round((tabCounts.ISSUES / totalOrdersCount) * 100) : 0}%
                </span>
              </div>
              <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono tabular-nums">
                {tabCounts.ISSUES}
              </div>
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">
                Retours &amp; Refus
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Incidents logistiques
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-rose-200/60 dark:border-rose-800/50 flex items-center justify-between text-[11px] text-slate-700 dark:text-slate-300 font-mono">
              <span>{formatMAD(pipelineTotals.issuesRevenue)}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            </div>
          </button>
        </div>

        {/* Pipeline Global Progress Strip */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-[#2e2e36]">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Progression Globale du Cycle Logistique
            </span>
            <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
              Taux de délivrabilité :{' '}
              <strong className="text-emerald-600 dark:text-emerald-400">
                {totalOrdersCount > 0 ? Math.round((deliveredCount / totalOrdersCount) * 100) : 0}% ({deliveredCount} / {totalOrdersCount} colis)
              </strong>
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
            {totalOrdersCount > 0 && (
              <div className="nay-progress-fill w-full h-full flex gap-0.5">
                {tabCounts.PENDING > 0 && <div className="h-full bg-slate-400 transition-all" style={{ width: `${(tabCounts.PENDING / totalOrdersCount) * 100}%` }} />}
                {tabCounts.UNCONFIRMED > 0 && <div className="h-full bg-amber-500 transition-all" style={{ width: `${(tabCounts.UNCONFIRMED / totalOrdersCount) * 100}%` }} />}
                {tabCounts.PROCESSING > 0 && <div className="h-full bg-[#0ea5e9] transition-all" style={{ width: `${(tabCounts.PROCESSING / totalOrdersCount) * 100}%` }} />}
                {tabCounts.SHIPPED > 0 && <div className="h-full bg-indigo-500 transition-all" style={{ width: `${(tabCounts.SHIPPED / totalOrdersCount) * 100}%` }} />}
                {tabCounts.DELIVERED > 0 && <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(tabCounts.DELIVERED / totalOrdersCount) * 100}%` }} />}
                {tabCounts.ISSUES > 0 && <div className="h-full bg-rose-500 transition-all" style={{ width: `${(tabCounts.ISSUES / totalOrdersCount) * 100}%` }} />}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 4. ENTERPRISE SEARCH, SORT & FILTERS TOOLBAR ───────────── */}
      <div className="nay-enter bg-white dark:bg-[#1c1c20] rounded-2xl p-3.5 border border-slate-200/80 dark:border-[#2c2c34] shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher par n° #NF, client, tél, ville, parfum..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/25 focus:border-[#0ea5e9] focus:bg-white dark:focus:bg-white/[0.07] transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5 cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:flex sm:items-center gap-2 text-xs sm:flex-wrap">
          <div className="relative">
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full sm:w-auto appearance-none text-xs bg-slate-50/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 rounded-xl pl-3 pr-8 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/25 focus:border-[#0ea5e9] cursor-pointer font-semibold transition-all"
            >
              <option value="ALL">Toutes les villes ({uniqueCities.length})</option>
              {uniqueCities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as any)}
              className="w-full sm:w-auto appearance-none text-xs bg-slate-50/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 rounded-xl pl-3 pr-8 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/25 focus:border-[#0ea5e9] cursor-pointer font-semibold transition-all"
            >
              <option value="ALL">Tous les règlements</option>
              <option value="PARTIAL">Avec acompte versé</option>
              <option value="PAID">100% Réglé</option>
              <option value="UNPAID">Paiement livraison (COD)</option>
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full sm:w-auto appearance-none text-xs bg-slate-50/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 rounded-xl pl-3 pr-8 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/25 focus:border-[#0ea5e9] cursor-pointer font-semibold transition-all"
            >
              <option value="DATE_DESC">Plus récentes</option>
              <option value="PRIORITY">Priorité logistique</option>
              <option value="TOTAL_DESC">Montant : décroissant</option>
              <option value="TOTAL_ASC">Montant : croissant</option>
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
          </div>

          <div className="text-[11px] font-mono font-bold px-3 py-2 rounded-xl bg-sky-50/80 dark:bg-sky-500/10 text-[#0284c7] dark:text-[#38bdf8] border border-sky-200/80 dark:border-sky-500/20 whitespace-nowrap">
            {filteredOrders.length} {filteredOrders.length > 1 ? 'colis' : 'colis'} • {formatMAD(pipelineTotals.filteredRevenue)}
          </div>

          {(search || cityFilter !== 'ALL' || paymentFilter !== 'ALL' || activeTab !== 'ALL' || sortBy !== 'DATE_DESC') && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setCityFilter('ALL');
                setPaymentFilter('ALL');
                setActiveTab('ALL');
                setSortBy('DATE_DESC');
              }}
              className="px-3 py-2 text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 cursor-pointer font-bold rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
            >
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* ── SUCCESS NOTIFICATION BANNER ────────────────────────────── */}
      {deleteSuccessMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 flex items-center justify-between text-xs shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={16} className="text-emerald-500" />
            <span className="font-bold">{deleteSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setDeleteSuccessMessage(null)}
            className="p-1 text-emerald-600 dark:text-emerald-400 hover:opacity-75 transition-opacity"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── TEST ORDERS ALERT & CLEANUP BANNER ──────────────────────── */}
      {testOrders.length > 0 && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#101626] border border-slate-200/90 dark:border-white/[0.08] border-l-[3px] border-l-amber-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/[0.1] text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
              <AlertTriangle size={17} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  {testOrders.length} commande{testOrders.length > 1 ? 's' : ''} test ou fictive{testOrders.length > 1 ? 's' : ''} détectée{testOrders.length > 1 ? 's' : ''}
                </h4>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/10">
                  Nettoyage disponible
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Exemples : {testOrders.slice(0, 3).map(o => `#${o.orderNumber} (${o.customerName})`).join(', ')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab('TEST')}
              className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-white dark:bg-white/10 hover:bg-slate-100 dark:hover:bg-white/15 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-white/10 transition-all cursor-pointer"
            >
              Voir la liste
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteTestModal(true)}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-rose-600/30 transition-all cursor-pointer"
            >
              <Trash2 size={14} />
              <span>Nettoyer les commandes tests ({testOrders.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* ── 5. SPOTLIGHT BANNER IF TARGET HIGHLIGHTED ──────────────── */}
      {highlightedOrderId && (
        <div className="bg-slate-950 dark:bg-[#101524] text-white p-3.5 rounded-2xl flex items-center justify-between text-xs shadow-lg border border-slate-800 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-semibold">Focus Commande #{highlightedOrder?.orderNumber} ({highlightedOrder?.customerName})</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEditingOrder(highlightedOrder)}
              className="px-3 py-1 bg-white text-slate-900 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Ouvrir fiche
            </button>
            <button
              type="button"
              onClick={() => {
                setHighlightedOrderId(null);
                setHighlightedOrder(null);
              }}
              className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── 6. ORDERS VIEW: MOBILE TOUCH CARDS (< 768px) + DESKTOP TABLE ── */}
      <div className="bg-white dark:bg-[#1c1c20] rounded-2xl border border-slate-200/80 dark:border-[#2c2c34] shadow-xs overflow-hidden">
        {/* Mobile Selection Bar */}
        {!isLoading && filteredOrders.length > 0 && (
          <div className="md:hidden px-4 py-2.5 bg-slate-50/90 dark:bg-[#16181f] border-b border-slate-200/70 dark:border-[#2c2c34] flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              {selectedOrderIds.length === filteredOrders.length ? (
                <CheckSquare size={15} className="text-[#1D9BF0]" />
              ) : (
                <Square size={15} className="text-slate-400" />
              )}
              <span>Tout sélectionner ({filteredOrders.length})</span>
            </button>
            <span className="font-mono font-bold text-[11px] text-slate-500 dark:text-slate-400">
              {formatMAD(pipelineTotals.filteredRevenue)}
            </span>
          </div>
        )}

        {/* Phone Native Card List (< 768px) */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-white/[0.06]">
          {isLoading ? (
            <div className="text-center py-14 text-slate-400">
              <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-[#1D9BF0]" />
              <span className="font-semibold text-xs text-slate-500 dark:text-slate-400">
                Chargement des commandes...
              </span>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-14 px-4 text-slate-400 space-y-1">
              <p className="font-semibold text-slate-600 dark:text-slate-300 text-xs">
                Aucune commande trouvée
              </p>
              <p className="text-[11px] text-slate-400">
                Modifiez vos critères de recherche ou réinitialisez les filtres.
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const parsedItems = getParsedItems(order.items);
              const itemsCount = parsedItems.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0);
              const itemsSummary = parsedItems.map((i) => `${i.quantity || 1}x ${i.name}`).join(', ') || 'Parfum NAY';
              const formattedDate = new Date(order.createdAt).toLocaleDateString('fr-MA', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              });
              const total = Number(order.total) || 0;
              const paid = Math.min(total, Math.max(0, Number(order.paidAmount) || 0));
              const remaining = Math.max(0, total - paid);
              const isSelected = selectedOrderIds.includes(order.id);
              const cleanPhone = (order.customerPhone || '').replace(/[^0-9]/g, '');
              const waPhone = cleanPhone.startsWith('0') ? `212${cleanPhone.slice(1)}` : cleanPhone;
              const initials = getInitials(order.customerName);

              return (
                <div
                  key={`mob-${order.id}`}
                  onClick={() => setEditingOrder(order)}
                  className={`p-3.5 space-y-3 transition-colors cursor-pointer ${
                    isSelected ? 'bg-sky-500/10 dark:bg-sky-500/15' : 'active:bg-slate-50 dark:active:bg-white/[0.03]'
                  }`}
                >
                  {/* Row 1: Checkbox + Order # + Date + Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        type="button"
                        onClick={(e) => handleToggleSelectOne(order.id, e)}
                        className="p-1 -ml-1 text-slate-400 cursor-pointer"
                        aria-label="Sélectionner la commande"
                      >
                        {isSelected ? (
                          <CheckSquare size={16} className="text-[#1D9BF0]" />
                        ) : (
                          <Square size={16} />
                        )}
                      </button>
                      <span className="font-mono text-xs font-extrabold text-slate-900 dark:text-white truncate">
                        #{order.orderNumber}
                      </span>
                      {isTestOrder(order) && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-500/15 text-rose-600 dark:text-rose-400">
                          TEST
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {formattedDate}
                      </span>
                    </div>

                    <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const openUp = window.innerHeight - rect.bottom < 320;
                          setStatusMenuAnchor({
                            order,
                            top: openUp ? rect.top - 6 : rect.bottom + 6,
                            left: Math.max(12, Math.min(rect.left, window.innerWidth - 268)),
                            openUp,
                          });
                        }}
                        className="cursor-pointer"
                      >
                        <ProfessionalStatusBadge status={order.status} />
                      </button>
                    </div>
                  </div>

                  {/* Row 2: Client Identity + Amount MAD */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500/15 to-indigo-500/15 border border-sky-500/20 text-sky-700 dark:text-sky-300 font-extrabold text-xs flex items-center justify-center shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                          {order.customerName}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                          {order.shippingCity || 'Casablanca'} · {order.customerPhone}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-black font-mono text-slate-950 dark:text-white tabular-nums">
                        {formatMAD(total)}
                      </div>
                      <div className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {paid >= total && total > 0
                          ? 'Payée 100%'
                          : paid > 0
                          ? `COD ${formatMAD(remaining)}`
                          : 'COD intégral'}
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Items Summary Pill */}
                  <div className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.07] text-[11px] text-slate-700 dark:text-slate-300 line-clamp-1 font-medium">
                    <span className="font-bold text-sky-600 dark:text-sky-400 mr-1.5">
                      {itemsCount} art.
                    </span>
                    {itemsSummary}
                  </div>

                  {/* Row 4: Thumb-Ready Action Bar */}
                  <div className="grid grid-cols-4 gap-2 pt-0.5" onClick={(e) => e.stopPropagation()}>
                    {order.customerPhone ? (
                      <a
                        href={`tel:${order.customerPhone}`}
                        className="h-9 rounded-xl bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20 text-[11px] font-bold flex items-center justify-center gap-1"
                      >
                        <Phone size={13} />
                        <span>Appel</span>
                      </a>
                    ) : (
                      <span className="h-9 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400 text-[11px] flex items-center justify-center">
                        -
                      </span>
                    )}

                    <a
                      href={`https://wa.me/${waPhone}?text=${encodeURIComponent(
                        buildWhatsAppPresetText('CONFIRM', order)
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="h-9 rounded-xl bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 text-[11px] font-bold flex items-center justify-center gap-1"
                    >
                      <MessageCircle size={13} />
                      <span>WhatsApp</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => setOrderToDelete(order)}
                      className="h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={13} />
                      <span>Suppr.</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditingOrder(order)}
                      className="h-9 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-[11px] font-extrabold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>Dossier</span>
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/95 dark:bg-[#16181f] text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider border-b border-slate-200/80 dark:border-[#2c2c34]">
              <tr>
                <th className="py-3 px-2 w-8 text-center">
                  <button
                    onClick={handleToggleSelectAll}
                    className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors p-0.5 cursor-pointer"
                  >
                    {filteredOrders.length > 0 && selectedOrderIds.length === filteredOrders.length ? (
                      <CheckSquare size={15} className="text-[#1D9BF0]" />
                    ) : (
                      <Square size={15} />
                    )}
                  </button>
                </th>
                <th className="py-3 px-2 whitespace-nowrap">Commande</th>
                <th className="py-3 px-2">Client</th>
                <th className="py-3 px-2 whitespace-nowrap">Destination</th>
                <th className="py-3 px-2">Articles &amp; Parfums</th>
                <th className="py-3 px-2 whitespace-nowrap">Règlement</th>
                <th className="py-3 px-2 whitespace-nowrap">Total</th>
                <th className="py-3 px-2 whitespace-nowrap">Statut</th>
                <th className="py-3 px-2 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-slate-400">
                    <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-[#1D9BF0]" />
                    <span className="font-semibold text-xs text-slate-500 dark:text-slate-400">Chargement des commandes en temps réel...</span>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-slate-400">
                    <div className="max-w-xs mx-auto space-y-1">
                      <p className="font-semibold text-slate-600 dark:text-slate-300">Aucune commande trouvée</p>
                      <p className="text-[11px] text-slate-400">Modifiez vos critères de recherche ou réinitialisez les filtres.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const parsedItems = getParsedItems(order.items);
                  const itemsCount = parsedItems.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0);
                  const itemsSummary = parsedItems.map(i => `${i.quantity}x ${i.name}`).join(', ') || 'Parfum NAY';
                  const formattedDate = new Date(order.createdAt).toLocaleDateString('fr-MA', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  const total = Number(order.total) || 0;
                  const paid = Math.min(total, Math.max(0, Number(order.paidAmount) || 0));
                  const remaining = Math.max(0, total - paid);
                  const isPaidFull = paid >= total && total > 0;
                  const isSelected = selectedOrderIds.includes(order.id);

                  const cleanPhone = (order.customerPhone || '').replace(/[^0-9]/g, '');
                  const waPhone = cleanPhone.startsWith('0') ? `212${cleanPhone.slice(1)}` : cleanPhone;
                  const initials = getInitials(order.customerName);

                  return (
                    <tr
                      key={order.id}
                      onClick={() => setEditingOrder(order)}
                      className={`group transition-all duration-150 cursor-pointer ${
                        isSelected 
                          ? 'bg-sky-500/10 dark:bg-sky-500/15' 
                          : 'hover:bg-slate-50/80 dark:hover:bg-white/[0.03]'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleToggleSelectOne(order.id, e)}
                          className="text-slate-400 hover:text-[#1D9BF0] transition-colors p-0.5 cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare size={15} className="text-[#1D9BF0]" />
                          ) : (
                            <Square size={15} />
                          )}
                        </button>
                      </td>

                      {/* Commande */}
                      <td className="py-3 px-2 whitespace-nowrap">
                        <div className="font-mono text-[11.5px] font-bold text-slate-900 dark:text-white flex items-center gap-1">
                          <span>#{order.orderNumber}</span>
                          {isTestOrder(order) && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                              TEST
                            </span>
                          )}
                          <button
                            onClick={(e) => handleCopyRef(order.orderNumber, e)}
                            className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                            title="Copier référence"
                          >
                            {copiedRef === order.orderNumber ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                          </button>
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                          {formattedDate}
                        </div>
                      </td>

                      {/* Client (Avatar Circle + Name) */}
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-[#1b2234] dark:to-[#121622] text-slate-800 dark:text-slate-200 font-extrabold text-[10px] flex items-center justify-center border border-slate-200/80 dark:border-white/10 shrink-0 shadow-xs">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 dark:text-white truncate max-w-[105px] text-xs">
                              {order.customerName || 'Client NAY'}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-[105px]">
                              {order.customerEmail || 'Client Boutique'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Destination & Contact */}
                      <td className="py-3 px-2 whitespace-nowrap">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 text-xs">
                          <MapPin size={12} className="text-[#0ea5e9] dark:text-[#38bdf8] shrink-0" />
                          <span className="truncate max-w-[85px]">{order.shippingCity || 'Casablanca'}</span>
                          <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            MA
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                          {order.customerPhone ? (
                            <a
                              href={`tel:${order.customerPhone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="hover:underline hover:text-slate-900 dark:hover:text-white"
                            >
                              {order.customerPhone}
                            </a>
                          ) : (
                            <span className="text-slate-400">Sans tél</span>
                          )}
                        </div>
                      </td>

                      {/* Articles & Parfums */}
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="inline-flex items-center gap-1 bg-sky-500/10 text-[#0284c7] dark:text-[#38bdf8] px-2 py-0.5 rounded-lg text-[10px] font-bold border border-sky-500/20">
                            <Package size={10} className="text-[#0284c7] dark:text-[#38bdf8]" />
                            <span>{itemsCount} flacon{itemsCount > 1 ? 's' : ''}</span>
                          </span>
                          {parsedItems.length > 1 && (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono font-medium">
                              ({parsedItems.length} réf.)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-700 dark:text-slate-300 font-medium leading-snug line-clamp-2 max-w-[140px]" title={itemsSummary}>
                          {itemsSummary}
                        </div>
                      </td>

                      {/* Règlement & Acompte */}
                      <td className="py-3 px-2 whitespace-nowrap">
                        {isPaidFull ? (
                          <div>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.08)]">
                              <CheckCircle2 size={11} className="text-emerald-500" />
                              <span>100% Réglé</span>
                            </span>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                              Paiement validé
                            </div>
                          </div>
                        ) : paid > 0 ? (
                          <div>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20">
                              <CreditCard size={11} className="text-teal-500" />
                              <span>Acompte {paid} DH</span>
                            </span>
                            <div className="text-[10.5px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                              Reste : <strong className="text-slate-900 dark:text-white font-bold">{remaining} DH</strong>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              <span>COD (Livraison)</span>
                            </span>
                            <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                              Espèces au livreur
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Montant Total */}
                      <td className="py-3 px-2 whitespace-nowrap">
                        <div className="font-mono text-xs font-black text-slate-900 dark:text-white">
                          {formatMAD(order.total)}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                          {order.shippingCost === 0 ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Livraison offerte</span>
                          ) : (
                            `Dont ${order.shippingCost || 35} DH livr.`
                          )}
                        </div>
                      </td>

                      {/* Statut (Portal-Anchored Status Badge + All 7 Options) */}
                      <td className="py-3 px-2 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-block status-dropdown-container">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setWaMenuAnchor(null);
                              if (statusMenuAnchor?.order?.id === order.id) {
                                setStatusMenuAnchor(null);
                                return;
                              }
                              const rect = e.currentTarget.getBoundingClientRect();
                              const openUp = window.innerHeight - rect.bottom < 400;
                              setStatusMenuAnchor({
                                order,
                                top: openUp ? rect.top - 6 : rect.bottom + 6,
                                left: Math.min(rect.left, window.innerWidth - 260),
                                openUp,
                              });
                            }}
                            className="inline-flex items-center gap-1.5 cursor-pointer hover:opacity-90 transition-opacity rounded-full pr-1.5 hover:bg-slate-100/80 dark:hover:bg-white/5"
                            title="Modifier le statut de la commande (Toutes les options)"
                          >
                            <ProfessionalStatusBadge status={order.status} />
                            <ChevronDown size={11} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" />
                          </button>
                        </div>
                      </td>

                      {/* Actions (Enterprise Quick Action Buttons) */}
                      <td className="py-3 px-2 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center justify-end gap-0.5">
                          {/* WhatsApp Portal Presets */}
                          <div className="relative whatsapp-dropdown-container">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setStatusMenuAnchor(null);
                                if (waMenuAnchor?.order?.id === order.id) {
                                  setWaMenuAnchor(null);
                                  return;
                                }
                                const rect = e.currentTarget.getBoundingClientRect();
                                const openUp = window.innerHeight - rect.bottom < 250;
                                setWaMenuAnchor({
                                  order,
                                  itemsSummary,
                                  total,
                                  paid,
                                  top: openUp ? rect.top - 6 : rect.bottom + 6,
                                  right: Math.max(16, window.innerWidth - rect.right),
                                  openUp,
                                });
                              }}
                              className="p-1.5 rounded-xl text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 border border-transparent hover:border-emerald-500/20 transition-all cursor-pointer"
                              title="WhatsApp Rapide"
                            >
                              <MessageCircle size={14} />
                            </button>
                          </div>

                          {/* Phone Call Button */}
                          {order.customerPhone && (
                            <a
                              href={`tel:${order.customerPhone}`}
                              title="Appeler"
                              className="p-1.5 rounded-xl text-sky-600 hover:bg-sky-500/10 dark:text-sky-400 dark:hover:bg-sky-500/20 border border-transparent hover:border-sky-500/20 transition-all cursor-pointer"
                            >
                              <Phone size={14} />
                            </a>
                          )}

                          {/* Delete Order Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOrderToDelete(order);
                            }}
                            title="Supprimer la commande"
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>

                          {/* Fiche Button */}
                          <button
                            type="button"
                            onClick={() => setEditingOrder(order)}
                            title="Ouvrir le dossier complet"
                            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                          >
                            <ChevronRight size={14} />
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

        {/* Table Summary Footer */}
        <div className="px-4 py-3 bg-slate-50/80 dark:bg-[#16181f] border-t border-slate-200/80 dark:border-[#2c2c34] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <div>
            Affichage de <strong className="text-slate-900 dark:text-white">{filteredOrders.length}</strong> commande{filteredOrders.length > 1 ? 's' : ''} sur <strong className="text-slate-900 dark:text-white">{orders.length}</strong>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span>
              Total filtré : <strong className="text-slate-900 dark:text-white">{formatMAD(pipelineTotals.filteredRevenue)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 7. PORTAL DROPDOWNS (ZERO CLIPPING — ALL 7 STATUS OPTIONS) */}
      {/* ========================================================= */}
      {mounted && createPortal(
        <AnimatePresence>
          {statusMenuAnchor && (
            <div
              key={`status-menu-${statusMenuAnchor.order.id}`}
              style={{
                top: statusMenuAnchor.top,
                left: statusMenuAnchor.left,
                transform: statusMenuAnchor.openUp ? 'translateY(-100%)' : 'none',
              }}
              className="status-portal-menu fixed z-[90] w-64"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: statusMenuAnchor.openUp ? 6 : -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: statusMenuAnchor.openUp ? 4 : -4 }}
                transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                className="bg-white dark:bg-[#161922] rounded-2xl shadow-[0_20px_50px_-10px_rgba(15,23,42,0.22)] dark:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.75)] border border-slate-200/90 dark:border-white/10 py-2 text-left"
              >
                <div className="px-3.5 py-1.5 border-b border-slate-100 dark:border-white/[0.06] mb-1 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-slate-500">
                    Statut • #{statusMenuAnchor.order.orderNumber}
                  </span>
                  <span className="text-[10px] font-semibold text-[#0284c7] dark:text-[#38bdf8]">7 étapes</span>
                </div>

                {['Traitement & Confirmation', 'Expédition & Clôture', 'Incidents & Retours'].map((groupName) => (
                  <div key={groupName} className="mb-1 last:mb-0">
                    <div className="px-3.5 py-1 text-[9.5px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {groupName}
                    </div>
                    {ALL_ORDER_STATUS_OPTIONS.filter((o) => o.group === groupName).map((opt) => {
                      const isCurrent = statusMenuAnchor.order.status === opt.value || (opt.value === 'processing' && statusMenuAnchor.order.status === 'confirmed');
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            handleStatusChange(statusMenuAnchor.order.id, opt.value);
                            setStatusMenuAnchor(null);
                          }}
                          className={`w-full text-left px-3.5 py-1.5 text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                            isCurrent
                              ? 'bg-sky-50/90 dark:bg-sky-500/15 text-[#0284c7] dark:text-[#38bdf8] font-bold'
                              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.05]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${opt.dot}`} />
                            <div className="min-w-0">
                              <div className="leading-tight truncate">{opt.label}</div>
                              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-normal leading-tight">{opt.desc}</div>
                            </div>
                          </div>
                          {isCurrent && <Check size={13} className="text-[#0ea5e9] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {mounted && createPortal(
        <AnimatePresence>
          {waMenuAnchor && (
            <div
              key={`wa-menu-${waMenuAnchor.order.id}`}
              style={{
                top: waMenuAnchor.top,
                right: waMenuAnchor.right,
                transform: waMenuAnchor.openUp ? 'translateY(-100%)' : 'none',
              }}
              className="whatsapp-portal-menu fixed z-[90] w-60"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: waMenuAnchor.openUp ? 6 : -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: waMenuAnchor.openUp ? 4 : -4 }}
                transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                className="bg-white dark:bg-[#161922] rounded-2xl shadow-[0_20px_50px_-10px_rgba(15,23,42,0.22)] dark:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.75)] border border-slate-200/90 dark:border-white/10 py-2 text-left text-xs"
              >
                <div className="px-3.5 py-1.5 text-[10px] uppercase tracking-wider font-extrabold text-emerald-600 dark:text-emerald-400 border-b border-slate-100 dark:border-white/[0.06] mb-1 flex items-center justify-between">
                  <span>WhatsApp • #{waMenuAnchor.order.orderNumber}</span>
                  <MessageCircle size={12} />
                </div>
                {[
                  { preset: 'CONFIRM' as const, label: 'Confirmation commande', icon: <CheckCircle2 size={13} className="text-emerald-500" /> },
                  { preset: 'ADVANCE' as const, label: 'Demande acompte (RIB)', icon: <CreditCard size={13} className="text-amber-500" /> },
                  { preset: 'SHIPPED' as const, label: 'Avis d’expédition', icon: <Truck size={13} className="text-sky-500" /> },
                  { preset: 'LOCATION' as const, label: 'Demande localisation GPS', icon: <MapPin size={13} className="text-slate-400" /> },
                  { preset: 'UNREACHABLE' as const, label: 'Client injoignable', icon: <Phone size={13} className="text-rose-500" /> },
                ].map((item) => (
                  <a
                    key={item.preset}
                    href={getWhatsAppPresetUrl(
                      waMenuAnchor.order.customerPhone,
                      waMenuAnchor.order.customerName,
                      waMenuAnchor.order.orderNumber,
                      waMenuAnchor.itemsSummary,
                      waMenuAnchor.order.shippingCity,
                      waMenuAnchor.total,
                      waMenuAnchor.paid,
                      item.preset
                    )}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setWaMenuAnchor(null)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-emerald-50/70 dark:hover:bg-emerald-500/10 transition-colors"
                  >
                    {item.icon}
                    <span className="font-medium">{item.label}</span>
                  </a>
                ))}
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* ========================================================= */}
      {/* 8. FLOATING BULK ACTIONS BAR (ACTIONS GROUPÉES)           */}
      {/* ========================================================= */}
      <AnimatePresence>
        {selectedOrderIds.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              className="bg-slate-900/95 dark:bg-[#0c101c]/95 backdrop-blur-xl text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700/80 dark:border-white/15 flex items-center gap-4"
            >
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
              onClick={() => setShowBulkDeleteModal(true)}
              disabled={isBulkProcessing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all cursor-pointer disabled:opacity-50 shadow-md shadow-rose-600/30 active:scale-95"
            >
              <Trash2 size={13} />
              <span>Supprimer ({selectedOrderIds.length})</span>
            </button>

            <button
              onClick={() => setSelectedOrderIds([])}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
              title="Désélectionner"
            >
              <X size={15} />
            </button>
          </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>



      {/* ========================================================= */}
      {/* 10. NAY 2027 ARCHITECTURAL ORDER COMMAND SHEET             */}
      {/* ========================================================= */}
      {mounted && createPortal(
        <AnimatePresence>
          {editingOrder && (
            <OrderDetailModal
              order={editingOrder}
              allOrders={orders}
              filteredOrders={filteredOrders}
              onSelectOrder={(next) => setEditingOrder(next)}
              onClose={() => setEditingOrder(null)}
              onStatusChange={handleStatusChange}
              onSavePaymentAndLogistics={async (payload) => {
                await handleSavePayment(payload.paidAmount, {
                  advancePaymentMethod: payload.advancePaymentMethod,
                  paymentNotes: payload.paymentNotes,
                  carrier: payload.carrier,
                  trackingNumber: payload.trackingNumber,
                  customerName: payload.customerName,
                  city: payload.city,
                });
              }}
              onAddTimelineNote={handleAddTimelineNote}
              onDeleteOrder={(ord) => setOrderToDelete(ord)}
              getOrderDisplayItems={getOrderDisplayItems}
              getInitials={getInitials}
              getCustomerTrustScore={getCustomerTrustScore}
              waPreset={waPreset}
              setWaPreset={setWaPreset}
              waMessageText={waMessageText}
              setWaMessageText={setWaMessageText}
              advanceAmountInput={advanceAmountInput}
              setAdvanceAmountInput={setAdvanceAmountInput}
              advanceMethodInput={advanceMethodInput}
              setAdvanceMethodInput={setAdvanceMethodInput}
              advanceNotesInput={advanceNotesInput}
              setAdvanceNotesInput={setAdvanceNotesInput}
              carrierInput={carrierInput}
              setCarrierInput={setCarrierInput}
              trackingInput={trackingInput}
              setTrackingInput={setTrackingInput}
              isSavingPayment={isSavingPayment}
              paymentSavedMessage={paymentSavedMessage}
            />
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* ── MODAL 1: CONFIRM DELETE SINGLE ORDER ──────────────────── */}
      {mounted && orderToDelete && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={() => !isDeleting && setOrderToDelete(null)}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-[#0c101c] rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-white/10 z-10 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
              <Trash2 size={24} />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Supprimer la commande #{orderToDelete.orderNumber} ?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cette action supprimera définitivement cette commande et son historique. Cette action est irréversible.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/5 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Client :</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{orderToDelete.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Téléphone :</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{orderToDelete.customerPhone || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Montant Total :</span>
                <span className="font-bold font-mono text-slate-900 dark:text-white">{formatMAD(orderToDelete.total)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSingle}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Suppression...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={13} />
                    <span>Supprimer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL 2: CONFIRM CLEAN ALL TEST ORDERS ────────────────── */}
      {mounted && showDeleteTestModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={() => !isDeleting && setShowDeleteTestModal(false)}
          />
          <div className="relative w-full max-w-lg bg-white dark:bg-[#0c101c] rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-white/10 z-10 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
              <AlertTriangle size={24} />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Nettoyer les {testOrders.length} commande(s) test ?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Toutes les commandes créées lors des tests internes ou factices seront définitivement purgées de la base de données.
              </p>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-1.5 p-2 bg-slate-50 dark:bg-white/[0.03] rounded-2xl border border-slate-200/80 dark:border-white/10">
              {testOrders.map((o) => (
                <div key={o.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-[#0a0e1a] border border-slate-200/60 dark:border-white/5 text-xs">
                  <div className="min-w-0 pr-2">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 font-mono truncate">
                      <span>#{o.orderNumber}</span>
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-sans font-bold">({o.customerName})</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                      {o.customerPhone || 'Sans tél'} • {o.customerEmail}
                    </div>
                  </div>
                  <div className="font-mono font-bold text-slate-800 dark:text-slate-200 shrink-0">
                    {formatMAD(o.total)}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteTestModal(false)}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAllTestOrders}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Nettoyage en cours...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={13} />
                    <span>Nettoyer ({testOrders.length})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL 3: CONFIRM BULK DELETE SELECTED ORDERS ──────────── */}
      {mounted && showBulkDeleteModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={() => !isDeleting && setShowBulkDeleteModal(false)}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-[#0c101c] rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-white/10 z-10 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
              <Trash2 size={24} />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Supprimer {selectedOrderIds.length} commande(s) ?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Vous avez sélectionné {selectedOrderIds.length} commande(s). Cette suppression est irréversible.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Suppression...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={13} />
                    <span>Confirmer la suppression</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
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
