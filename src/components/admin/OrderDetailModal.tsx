'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Copy,
  CreditCard,
  Edit3,
  ExternalLink,
  FileText,
  History,
  Layers,
  MapPin,
  MessageCircle,
  Package,
  Palette,
  Phone,
  Printer,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
  Truck,
  X,
} from 'lucide-react';
import { useAdminTheme } from '@/context/AdminThemeContext';

export type OrderModalDesignId =
  | 'atelier_executif'
  | 'verre_optique'
  | 'haute_couture_noir'
  | 'bordereau_triptych'
  | 'compact_teleop'
  | 'chrono_editorial';

export type WaPresetKey = 'CONFIRM' | 'SHIPPED' | 'LOCATION' | 'UNREACHABLE' | 'ADVANCE';
export type WaLangKey = 'fr' | 'darija' | 'ar';

export interface OrderModalItem {
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

export interface OrderTimelineEntry {
  id?: string;
  status: string;
  title?: string;
  description?: string | null;
  actorName?: string | null;
  actorRole?: string | null;
  createdAt: string;
  carrier?: string | null;
  trackingNumber?: string | null;
}

export interface OrderDetailRecord {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone: string;
  shippingAddress?: string | null;
  shippingCity?: string | null;
  shippingPostalCode?: string | null;
  paymentMethod?: string | null;
  items: string;
  enrichedItems?: OrderModalItem[];
  subtotal?: number | null;
  shippingCost?: number | null;
  total: number;
  paidAmount?: number | null;
  paymentStatus?: string | null;
  advancePaymentMethod?: string | null;
  paymentNotes?: string | null;
  promoCode?: string | null;
  discount?: number | null;
  status: string;
  carrier?: string | null;
  trackingNumber?: string | null;
  createdAt: string;
  timeline?: OrderTimelineEntry[];
  customerOrdersCount?: number;
}

interface OrderModalDesignOption {
  id: OrderModalDesignId;
  label: string;
  subtitle: string;
  swatchLight: string;
  swatchDark: string;
  accentHint: string;
}

const MODAL_DESIGN_OPTIONS: OrderModalDesignOption[] = [
  {
    id: 'atelier_executif',
    label: 'Atelier Exécutif',
    subtitle: 'Architecture 2 colonnes haute précision',
    swatchLight: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
    swatchDark: 'linear-gradient(135deg, #0b1222 0%, #15213a 100%)',
    accentHint: 'Pro & Net',
  },
  {
    id: 'verre_optique',
    label: 'Verre Optique',
    subtitle: 'Verre liquide translucide multi-couches',
    swatchLight: 'linear-gradient(135deg, rgba(255,255,255,0.88) 0%, rgba(224,242,254,0.8) 100%)',
    swatchDark: 'linear-gradient(135deg, rgba(15,23,42,0.86) 0%, rgba(14,116,144,0.35) 100%)',
    accentHint: 'Liquid Glass',
  },
  {
    id: 'haute_couture_noir',
    label: 'Haute Couture & Or',
    subtitle: 'Maison de parfumerie • Finition champagne & or',
    swatchLight: 'linear-gradient(135deg, #fcfaf5 0%, #f3ead8 100%)',
    swatchDark: 'linear-gradient(135deg, #09090d 0%, #191612 100%)',
    accentHint: 'Luxe Signature',
  },
  {
    id: 'bordereau_triptych',
    label: 'Cockpit 3 Colonnes',
    subtitle: 'Vue panoramique zéro-scroll sur grand écran',
    swatchLight: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    swatchDark: 'linear-gradient(135deg, #090d16 0%, #131c2e 100%)',
    accentHint: 'Widescreen',
  },
  {
    id: 'compact_teleop',
    label: 'Télé-Confirmation',
    subtitle: 'Priorité appel, WhatsApp 3 langues & GPS',
    swatchLight: 'linear-gradient(135deg, #ecfdf5 0%, #f8fafc 100%)',
    swatchDark: 'linear-gradient(135deg, #071915 0%, #0b1322 100%)',
    accentHint: 'Ops Rapide',
  },
  {
    id: 'chrono_editorial',
    label: 'Bordereau & Audit',
    subtitle: 'Ledger financier détaillé + flux chronologique',
    swatchLight: 'linear-gradient(135deg, #ffffff 0%, #eef2ff 100%)',
    swatchDark: 'linear-gradient(135deg, #0b1020 0%, #161830 100%)',
    accentHint: 'Finance & Audit',
  },
];

const STORAGE_KEY_DESIGN = 'nay-order-modal-design';
const STORAGE_KEY_WA_LANG = 'nay-order-modal-wa-lang';

const STATUS_BADGE_CLASSES: Record<string, string> = {
  pending:
    'bg-amber-50/95 text-amber-800 border-amber-200/90 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
  unconfirmed:
    'bg-rose-50/95 text-rose-800 border-rose-200/90 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30',
  processing:
    'bg-sky-50/95 text-sky-800 border-sky-200/90 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30',
  confirmed:
    'bg-sky-50/95 text-sky-800 border-sky-200/90 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30',
  shipped:
    'bg-indigo-50/95 text-indigo-800 border-indigo-200/90 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30',
  delivered:
    'bg-emerald-50/95 text-emerald-800 border-emerald-200/90 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
  refused:
    'bg-rose-50/95 text-rose-800 border-rose-200/90 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30',
  returned:
    'bg-slate-100 text-slate-700 border-slate-300 dark:bg-white/10 dark:text-slate-300 dark:border-white/15',
};

const CARRIER_TRACKING_URLS: Record<string, (code: string) => string> = {
  Cathedis: (code) => `https://cathedis.ma/tracking?code=${encodeURIComponent(code)}`,
  Amana: (code) => `https://www.amana-colis.ma/suivi-colis?code=${encodeURIComponent(code)}`,
  'Ozon Express': (code) => `https://ozonexpress.ma/tracking/${encodeURIComponent(code)}`,
};

const formatMAD = (amount: number) =>
  new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    maximumFractionDigits: 0,
  }).format(amount);

const normalizePhoneForWa = (phone?: string | null) => {
  const digits = (phone || '').replace(/[^0-9]/g, '');
  if (!digits) return '';
  return digits.startsWith('0') ? `212${digits.slice(1)}` : digits;
};

const normalizePhoneKey = (phone?: string | null) =>
  (phone || '').replace(/\D/g, '').slice(-9);

const buildTrilingualWaText = (
  lang: WaLangKey,
  preset: WaPresetKey,
  order: OrderDetailRecord,
  items: OrderModalItem[],
  trackingNumber?: string
): string => {
  const name = order.customerName || 'Client';
  const num = order.orderNumber || '';
  const city = order.shippingCity || 'votre ville';
  const itemsText = items.map((i) => `${i.quantity || 1}x ${i.name}`).join(', ') || 'Parfums NAY';
  const total = Number(order.total) || 0;
  const paid = Math.min(total, Math.max(0, Number(order.paidAmount) || 0));
  const remaining = Math.max(0, total - paid);
  const trackingLine = trackingNumber?.trim() ? `\nCode suivi : ${trackingNumber.trim()}` : '';

  if (lang === 'darija') {
    switch (preset) {
      case 'CONFIRM':
        return `Salam ${name} ✨ m3ak Maison NAY Parfums b khossoss la commande #${num} (${itemsText}).\nMontant COD : ${remaining} MAD l ${city}.\nWach nqadro nsifto lik l'colis had simana ? Chokrane !`;
      case 'SHIPPED':
        return `Salam ${name} 🚚 La commande dyalk #${num} kherjat m3a l'livreur l ${city} !${trackingLine}\n\nMontant li ghadi tkhless f'yd l'livreur : *${remaining} MAD*${paid > 0 ? ` (Tassbiq ${paid} MAD mnaqqass)` : ''}.\nKhalli télépone dyalk meftouh afak !`;
      case 'LOCATION':
        return `Salam ${name} 📍 L'livreur dyalna kayn lyoum f ${city}. Momkin tsift lina localisation GPS hna f WhatsApp bach ywassel lik l'colis tal l'bab ? Baraka Allahou fik !`;
      case 'UNREACHABLE':
        return `Salam ${name} 📞 Tasselna bik 3la wad la commande NAY Parfums #${num} (${itemsText}) o ma lqinach jawab.\nAfak jawbna hna awla 3ayt lina bach n'akdo lik l'envoi qbel ma t'annula. Chokrane !`;
      case 'ADVANCE':
        return `Salam ${name} ✨ Chokrane 3la la commande #${num}. Bach n'confirméw l'envoi dyal ${itemsText} l ${city}, khass ghir tassbiq dyal 50 DH.\n\nRIB CIH : 230 780 4567890123 45 (NAY PARFUMS)\nAwla Wafacash / CashPlus.\nSift lina l'reçu hna f WhatsApp.`;
    }
  }

  if (lang === 'ar') {
    switch (preset) {
      case 'CONFIRM':
        return `السلام عليكم ${name} ✨ معكم دار NAY Parfums بخصوص طلبكم رقم #${num} (${itemsText}).\nالمبلغ عند الاستلام لمدينة ${city} هو ${remaining} درهم.\nهل يمكنكم تأكيد توفرّكم لاستلام الطلب هذا الأسبوع؟ شكراً لكم!`;
      case 'SHIPPED':
        return `السلام عليكم ${name} 🚚 تم شحن طلبكم من NAY Parfums رقم #${num} وهو في طريقه إليكم نحو ${city}.${trackingLine}\n\nالمبلغ المطلوب عند التسليم: *${remaining} درهم*${paid > 0 ? ` (بعد خصم التسبيق ${paid} درهم)` : ''}.\nالمرجو إبقاء هاتفكم متاحاً لاستقبال الموزع.`;
      case 'LOCATION':
        return `السلام عليكم ${name} 📍 موزع التوصيل متواجد اليوم في ${city}. المرجو مشاركة موقعكم عبر GPS هنا في واتساب لتسليمكم الطلب مباشرة إلى باب منزلكم. شكراً جزيلاً!`;
      case 'UNREACHABLE':
        return `السلام عليكم ${name} 📞 حاولنا الاتصال بكم بخصوص طلب NAY Parfums رقم #${num} دون رد.\nالمرجو التواصل معنا أو الرد هنا لتأكيد الطلب والحفاظ على أولوية الشحن.`;
      case 'ADVANCE':
        return `السلام عليكم ${name} ✨ شكراً لطلبكم #${num}. لتأكيد الشحن السريع إلى ${city}، المرجو إرسال تسبيق رمزي بقيمة 50 درهم.\n\nRIB CIH : 230 780 4567890123 45 (NAY PARFUMS)\nأو عبر وفاكاش / كاش بلوس.\nيرجى إرسال وصل التحويل هنا.`;
    }
  }

  // Default: French
  switch (preset) {
    case 'CONFIRM':
      return `Salam ${name} ✨ C'est Maison NAY Parfums concernant votre commande #${num} (${itemsText}). Nous préparons votre colis pour ${city}. Merci de nous confirmer si vous êtes disponible pour recevoir votre commande cette semaine ? Belle journée !`;
    case 'ADVANCE':
      return `Salam ${name} ✨ Merci pour votre commande NAY Parfums #${num}. Afin de valider l'expédition prioritaire de votre flacon de parfum, un acompte de sécurité de 50 DH (ou 100 DH) est souhaité.\n\nRIB CIH : 230 780 4567890123 45 (NAY PARFUMS)\nOu par Wafacash / CashPlus.\n\nMerci de nous transmettre le reçu de versement ici.`;
    case 'SHIPPED':
      return `Salam ${name} 🚚 Votre commande Maison NAY Parfums #${num} est en route avec notre livreur pour ${city} !${trackingLine}\n\nMontant exact à préparer en espèces à la livraison : *${remaining} MAD*${paid > 0 ? ` (Acompte de ${paid} MAD déjà déduit)` : ''}.\n\nMerci de garder votre téléphone joignable !`;
    case 'LOCATION':
      return `Salam ${name} 📍 Notre livreur est en tournée aujourd'hui à ${city}. Pourriez-vous svp nous partager votre localisation GPS WhatsApp pour vous livrer directement à votre porte ? Merci beaucoup !`;
    case 'UNREACHABLE':
      return `Salam ${name} 📞 Nous avons essayé de vous joindre par téléphone au sujet de votre commande NAY Parfums #${num}, sans succès.\n\nMerci de nous répondre ou de nous rappeler au plus vite afin de maintenir votre commande active avant son annulation automatique.`;
  }
};

export interface OrderDetailModalProps {
  order: OrderDetailRecord;
  allOrders: OrderDetailRecord[];
  filteredOrders: OrderDetailRecord[];
  onSelectOrder: (order: OrderDetailRecord) => void;
  onClose: () => void;
  onStatusChange: (
    orderId: string,
    newStatus: string,
    options?: { carrier?: string; trackingNumber?: string; customNote?: string; actorNameOverride?: string }
  ) => Promise<void> | void;
  onSavePaymentAndLogistics: (payload: {
    paidAmount?: number;
    advancePaymentMethod: string;
    paymentNotes: string;
    carrier: string;
    trackingNumber: string;
    customerName?: string;
    city?: string;
  }) => Promise<void>;
  onAddTimelineNote: (note: string, type?: string, extra?: { carrier?: string; trackingNumber?: string }) => Promise<void>;
  onDeleteOrder: (order: OrderDetailRecord) => void;
  getOrderDisplayItems: (order: OrderDetailRecord) => OrderModalItem[];
  getInitials: (name: string) => string;
  getCustomerTrustScore: (order: OrderDetailRecord) => {
    label: string;
    badge: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    desc: string;
  };
  waPreset: WaPresetKey;
  setWaPreset: (preset: WaPresetKey) => void;
  waMessageText: string;
  setWaMessageText: React.Dispatch<React.SetStateAction<string>>;
  advanceAmountInput: string;
  setAdvanceAmountInput: (v: string) => void;
  advanceMethodInput: string;
  setAdvanceMethodInput: (v: string) => void;
  advanceNotesInput: string;
  setAdvanceNotesInput: (v: string) => void;
  carrierInput: string;
  setCarrierInput: (v: string) => void;
  trackingInput: string;
  setTrackingInput: (v: string) => void;
  isSavingPayment: boolean;
  paymentSavedMessage: string | null;
}

export default function OrderDetailModal({
  order,
  allOrders,
  filteredOrders,
  onSelectOrder,
  onClose,
  onStatusChange,
  onSavePaymentAndLogistics,
  onAddTimelineNote,
  onDeleteOrder,
  getOrderDisplayItems,
  getInitials,
  getCustomerTrustScore,
  waPreset,
  setWaPreset,
  waMessageText,
  setWaMessageText,
  advanceAmountInput,
  setAdvanceAmountInput,
  advanceMethodInput,
  setAdvanceMethodInput,
  advanceNotesInput,
  setAdvanceNotesInput,
  carrierInput,
  setCarrierInput,
  trackingInput,
  setTrackingInput,
  isSavingPayment,
  paymentSavedMessage,
}: OrderDetailModalProps) {
  const { theme } = useAdminTheme();
  const isGlobalDark = theme === 'dark';

  const [modalDesign, setModalDesign] = useState<OrderModalDesignId>('atelier_executif');
  const [showDesignPicker, setShowDesignPicker] = useState(false);
  const [waLang, setWaLang] = useState<WaLangKey>('fr');
  const [orderNumCopied, setOrderNumCopied] = useState(false);
  const [phoneCopied, setPhoneCopied] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);
  const [slipCopied, setSlipCopied] = useState(false);
  const [waCopied, setWaCopied] = useState(false);
  const [showAdvanceEditor, setShowAdvanceEditor] = useState(false);
  const [showAllTimeline, setShowAllTimeline] = useState(false);
  const [showCustomerHistory, setShowCustomerHistory] = useState(false);
  const [showEditClient, setShowEditClient] = useState(false);
  const [editClientName, setEditClientName] = useState(order.customerName || '');
  const [editClientCity, setEditClientCity] = useState(order.shippingCity || '');
  const [newInternalNote, setNewInternalNote] = useState('');
  const [isLoggingQuickEvent, setIsLoggingQuickEvent] = useState(false);

  // Restore saved modal design & WhatsApp language preferences
  useEffect(() => {
    try {
      const savedDesign = localStorage.getItem(STORAGE_KEY_DESIGN) as OrderModalDesignId | null;
      if (savedDesign && MODAL_DESIGN_OPTIONS.some((d) => d.id === savedDesign)) {
        setModalDesign(savedDesign);
      }
      const savedLang = localStorage.getItem(STORAGE_KEY_WA_LANG) as WaLangKey | null;
      if (savedLang && (savedLang === 'fr' || savedLang === 'darija' || savedLang === 'ar')) {
        setWaLang(savedLang);
      }
    } catch {
      // Ignore storage access errors
    }
  }, []);

  // Sync quick client edit inputs when order changes
  useEffect(() => {
    setEditClientName(order.customerName || '');
    setEditClientCity(order.shippingCity || '');
    setShowEditClient(false);
    setShowCustomerHistory(false);
  }, [order.id, order.customerName, order.shippingCity]);

  // Escape key handler
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDesignPicker) {
          setShowDesignPicker(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, showDesignPicker]);

  const handleSelectDesign = (id: OrderModalDesignId) => {
    setModalDesign(id);
    setShowDesignPicker(false);
    try {
      localStorage.setItem(STORAGE_KEY_DESIGN, id);
    } catch {
      // Ignore storage error
    }
  };

  const items = useMemo(() => getOrderDisplayItems(order), [order, getOrderDisplayItems]);

  // Keep WhatsApp message aligned with saved language preference when opening a different order
  useEffect(() => {
    setWaMessageText(buildTrilingualWaText(waLang, 'CONFIRM', order, items, order.trackingNumber || ''));
  }, [order.id, waLang]);

  const handleSelectWaLang = (lang: WaLangKey) => {
    setWaLang(lang);
    try {
      localStorage.setItem(STORAGE_KEY_WA_LANG, lang);
    } catch {
      // Ignore
    }
    setWaMessageText(buildTrilingualWaText(lang, waPreset, order, items, trackingInput));
  };

  const handleSelectWaPreset = (preset: WaPresetKey) => {
    setWaPreset(preset);
    setWaMessageText(buildTrilingualWaText(waLang, preset, order, items, trackingInput));
  };

  // Financial figures
  const computedSubtotal =
    Number(order.subtotal) ||
    items.reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0);
  const shippingCost = Number(order.shippingCost) || 0;
  const discountAmt = Number(order.discount) || 0;
  const total = Number(order.total) || 0;
  const paid = Math.min(total, Math.max(0, Number(order.paidAmount) || 0));
  const remaining = Math.max(0, total - paid);
  const isPaidFull = paid >= total && total > 0;
  const paidPct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;

  // Customer order history calculated from loaded orders list
  const customerHistory = useMemo(() => {
    const targetPhone = normalizePhoneKey(order.customerPhone);
    const targetEmail = (order.customerEmail || '').trim().toLowerCase();
    const matched = allOrders.filter((candidate) => {
      const ph = normalizePhoneKey(candidate.customerPhone);
      const em = (candidate.customerEmail || '').trim().toLowerCase();
      return (targetPhone && ph === targetPhone) || (targetEmail && em === targetEmail);
    });
    const deliveredCount = matched.filter((o) => o.status === 'delivered').length;
    const totalSpent = matched
      .filter((o) => o.status !== 'refused' && o.status !== 'returned')
      .reduce((acc, o) => acc + (Number(o.total) || 0), 0);
    return {
      orders: matched,
      count: Math.max(matched.length, order.customerOrdersCount || 1),
      deliveredCount,
      totalSpent,
    };
  }, [allOrders, order]);

  // Prev / Next order index in current filtered list
  const navList = filteredOrders.length > 0 ? filteredOrders : allOrders;
  const currentNavIdx = navList.findIndex((o) => o.id === order.id);
  const prevOrder = currentNavIdx > 0 ? navList[currentNavIdx - 1] : null;
  const nextOrder = currentNavIdx >= 0 && currentNavIdx < navList.length - 1 ? navList[currentNavIdx + 1] : null;

  // Phone & Maps URLs
  const waPhone = normalizePhoneForWa(order.customerPhone);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${order.shippingAddress || ''} ${order.shippingCity || ''} Maroc`
  )}`;
  const carrierTrackFn = trackingInput.trim() ? CARRIER_TRACKING_URLS[carrierInput] : undefined;
  const trackingLookupUrl = carrierTrackFn ? carrierTrackFn(trackingInput.trim()) : null;

  // Timeline (sorted newest-first for operator clarity)
  const timelineList = useMemo(() => {
    const raw = Array.isArray(order.timeline) ? [...order.timeline] : [];
    return raw.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [order.timeline]);

  const displayedTimeline = showAllTimeline ? timelineList : timelineList.slice(0, 5);

  const trustScore = getCustomerTrustScore(order);
  const TrustIcon = trustScore.icon;

  // Visual design tokens per selected modal design + active Light/Dark mode
  const designTheme = useMemo(() => {
    const dark = isGlobalDark;
    switch (modalDesign) {
      case 'verre_optique':
        return {
          shell: dark
            ? 'bg-slate-950/78 text-slate-100 border border-cyan-300/25 backdrop-blur-2xl shadow-[0_32px_90px_rgba(2,6,23,0.85),inset_0_1px_1px_rgba(255,255,255,0.16)]'
            : 'bg-white/78 text-slate-900 border border-white/80 backdrop-blur-2xl shadow-[0_32px_90px_rgba(14,165,233,0.16),inset_0_1px_1px_rgba(255,255,255,0.95)]',
          header: dark
            ? 'bg-slate-900/50 border-white/10'
            : 'bg-white/55 border-sky-200/60',
          ribbon: dark
            ? 'bg-slate-900/40 border-white/10'
            : 'bg-sky-50/50 border-sky-200/50',
          panel: dark
            ? 'bg-slate-900/52 border border-white/12 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
            : 'bg-white/65 border border-white/85 backdrop-blur-xl shadow-[0_6px_24px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,0.95)]',
          subCard: dark
            ? 'bg-slate-950/55 border border-white/10'
            : 'bg-white/75 border border-slate-200/70',
          waCard: dark
            ? 'bg-emerald-950/40 border border-emerald-400/25 backdrop-blur-xl'
            : 'bg-emerald-50/70 border border-emerald-200/80 backdrop-blur-xl',
          waBubble: dark
            ? 'bg-emerald-950/70 border border-emerald-500/25'
            : 'bg-white/85 border border-emerald-200/75',
          codTicket: dark
            ? 'bg-gradient-to-br from-sky-950/70 via-slate-900/75 to-cyan-950/60 border border-cyan-400/30'
            : 'bg-gradient-to-br from-sky-50/90 via-white/90 to-cyan-50/85 border border-sky-300/60',
          topAccent: 'from-cyan-400 via-sky-500 to-indigo-400',
          input: dark
            ? 'bg-slate-950/65 border-white/15 text-white placeholder:text-slate-400'
            : 'bg-white/85 border-slate-200 text-slate-900 placeholder:text-slate-400',
        };
      case 'haute_couture_noir':
        return {
          shell: dark
            ? 'bg-[#09090d] text-[#f5efe2] border border-[#d4af37]/30 shadow-[0_32px_90px_rgba(0,0,0,0.88)]'
            : 'bg-[#fcfaf5] text-[#1c1917] border border-[#d6c297] shadow-[0_32px_80px_rgba(120,92,40,0.16)]',
          header: dark
            ? 'bg-[#0e0d12] border-[#d4af37]/20'
            : 'bg-[#f6f0e4] border-[#dfd0b2]',
          ribbon: dark
            ? 'bg-[#111016] border-[#d4af37]/15'
            : 'bg-[#f8f3ea] border-[#e6dac1]',
          panel: dark
            ? 'bg-[#121118] border border-[#d4af37]/20 shadow-inner'
            : 'bg-white/95 border border-[#e3d4b7] shadow-sm',
          subCard: dark
            ? 'bg-[#09090d] border border-[#d4af37]/15'
            : 'bg-[#fbf8f1] border border-[#e8dcc4]',
          waCard: dark
            ? 'bg-[#101714] border border-emerald-500/25'
            : 'bg-[#f3f8f4] border border-emerald-700/20',
          waBubble: dark
            ? 'bg-[#07110d] border border-emerald-500/20'
            : 'bg-white border border-emerald-600/20',
          codTicket: dark
            ? 'bg-gradient-to-br from-[#17140d] via-[#121014] to-[#1f190e] border border-[#d4af37]/45'
            : 'bg-gradient-to-br from-[#faf3e3] via-[#fffdf8] to-[#f4e7cb] border border-[#c9a24b]/60',
          topAccent: 'from-[#b8860b] via-[#f0cf7b] to-[#b8860b]',
          input: dark
            ? 'bg-[#09090d] border-[#d4af37]/25 text-[#f5efe2] placeholder:text-stone-500'
            : 'bg-white border-[#d6c297] text-stone-900 placeholder:text-stone-400',
        };
      case 'compact_teleop':
        return {
          shell: dark
            ? 'bg-[#09101a] text-slate-100 border border-emerald-500/25 shadow-2xl'
            : 'bg-white text-slate-900 border border-emerald-200/80 shadow-2xl',
          header: dark
            ? 'bg-[#061412] border-emerald-500/20'
            : 'bg-emerald-50/55 border-emerald-200/70',
          ribbon: dark
            ? 'bg-[#0b1522] border-slate-800'
            : 'bg-slate-50/80 border-slate-200/80',
          panel: dark
            ? 'bg-[#0e1726] border border-slate-800'
            : 'bg-slate-50/75 border border-slate-200/85',
          subCard: dark
            ? 'bg-[#08101c] border border-slate-800'
            : 'bg-white border border-slate-200/80',
          waCard: dark
            ? 'bg-emerald-950/55 border border-emerald-400/35 shadow-lg shadow-emerald-950/40'
            : 'bg-emerald-50/80 border border-emerald-300/80 shadow-sm',
          waBubble: dark
            ? 'bg-[#051811] border border-emerald-500/30'
            : 'bg-white border border-emerald-200',
          codTicket: dark
            ? 'bg-gradient-to-r from-[#091f2c] to-[#0a2923] border border-emerald-400/30'
            : 'bg-gradient-to-r from-emerald-50 to-sky-50 border border-emerald-300/70',
          topAccent: 'from-emerald-400 via-teal-400 to-sky-400',
          input: dark
            ? 'bg-[#08101c] border-slate-700 text-slate-100 placeholder:text-slate-500'
            : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400',
        };
      case 'bordereau_triptych':
      case 'chrono_editorial':
      case 'atelier_executif':
      default:
        return {
          shell: dark
            ? 'bg-[#0b1222] text-slate-100 border border-slate-800/90 shadow-[0_28px_80px_rgba(0,0,0,0.75)]'
            : 'bg-white text-slate-900 border border-slate-200/90 shadow-[0_28px_80px_rgba(15,23,42,0.18)]',
          header: dark
            ? 'bg-[#080e1b] border-slate-800/90'
            : 'bg-slate-50/85 border-slate-200/80',
          ribbon: dark
            ? 'bg-[#0c1426] border-slate-800/80'
            : 'bg-slate-50/55 border-slate-200/75',
          panel: dark
            ? 'bg-[#10182b] border border-slate-800/90 shadow-sm'
            : 'bg-slate-50/75 border border-slate-200/85',
          subCard: dark
            ? 'bg-[#0a101f] border border-slate-800/90'
            : 'bg-white border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.03)]',
          waCard: dark
            ? 'bg-[#091c18] border border-emerald-500/30 shadow-lg shadow-emerald-950/30'
            : 'bg-emerald-50/55 border border-emerald-200/90',
          waBubble: dark
            ? 'bg-[#061410] border border-emerald-500/25'
            : 'bg-white border border-emerald-200/80',
          codTicket: dark
            ? 'bg-gradient-to-br from-[#081729] via-[#0c1e34] to-[#0a232b] border border-sky-400/30'
            : 'bg-gradient-to-br from-sky-50 via-white to-cyan-50/80 border border-sky-200/90',
          topAccent: 'from-transparent via-[var(--admin-accent,#0ea5e9)] to-transparent',
          input: dark
            ? 'bg-[#090f1d] border-slate-700 text-slate-100 placeholder:text-slate-500'
            : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400',
        };
    }
  }, [modalDesign, isGlobalDark]);

  const activeDesignMeta =
    MODAL_DESIGN_OPTIONS.find((d) => d.id === modalDesign) || MODAL_DESIGN_OPTIONS[0];

  const handleCopyFullDispatchSlip = () => {
    const itemsSummary = items
      .map((i) => `• ${i.quantity || 1}x ${i.name} (${i.size || '100ml'})`)
      .join('\n');
    const slip = [
      `BORDEREAU EXPÉDITION — MAISON NAY PARFUMS`,
      `Commande : #${order.orderNumber}`,
      `Client : ${order.customerName}`,
      `Tél : ${order.customerPhone}`,
      `Ville : ${order.shippingCity || 'Maroc'}`,
      `Adresse : ${order.shippingAddress || '-'}`,
      `Transporteur : ${carrierInput || 'Cathedis'}${trackingInput.trim() ? ` (${trackingInput.trim()})` : ''}`,
      `Articles :\n${itemsSummary}`,
      `NET À ENCAISSER (COD) : ${formatMAD(remaining)}`,
    ].join('\n');
    navigator.clipboard?.writeText(slip);
    setSlipCopied(true);
    setTimeout(() => setSlipCopied(false), 2200);
  };

  const handleQuickTimelineLog = async (titleNote: string, type: 'CALL_ATTEMPT' | 'NOTE') => {
    setIsLoggingQuickEvent(true);
    try {
      await onAddTimelineNote(titleNote, type);
    } finally {
      setIsLoggingQuickEvent(false);
    }
  };

  const handleQuickAmount = async (amt: number) => {
    const clamped = Math.max(0, Math.min(total, amt));
    setAdvanceAmountInput(String(clamped));
    await onSavePaymentAndLogistics({
      paidAmount: clamped,
      advancePaymentMethod: advanceMethodInput,
      paymentNotes: advanceNotesInput,
      carrier: carrierInput,
      trackingNumber: trackingInput,
    });
  };

  const handleSaveShippingAndTracking = async () => {
    await onSavePaymentAndLogistics({
      advancePaymentMethod: advanceMethodInput,
      paymentNotes: advanceNotesInput,
      carrier: carrierInput,
      trackingNumber: trackingInput,
    });
    if (trackingInput.trim()) {
      await onAddTimelineNote(
        `Bordereau transporteur mis à jour : ${carrierInput} • Suivi ${trackingInput.trim()}`,
        'NOTE',
        { carrier: carrierInput, trackingNumber: trackingInput.trim() }
      );
    }
  };

  const handleSaveClientEdits = async () => {
    if (!editClientName.trim()) return;
    await onSavePaymentAndLogistics({
      advancePaymentMethod: advanceMethodInput,
      paymentNotes: advanceNotesInput,
      carrier: carrierInput,
      trackingNumber: trackingInput,
      customerName: editClientName.trim(),
      city: editClientCity.trim(),
    });
    setShowEditClient(false);
  };

  const maxModalWidthClass =
    modalDesign === 'bordereau_triptych' ? 'max-w-[92rem]' : 'max-w-6xl';

  // Reusable architectural cards rendered in order dictated by chosen design layout
  const renderItemsCard = (compact = false) => (
    <div className={`p-4 rounded-2xl space-y-3 ${designTheme.panel}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
          <ShoppingBag size={14} style={{ color: 'var(--admin-accent, #0ea5e9)' }} />
          <span>Parfums Commandés</span>
        </span>
        <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20">
          {items.length} référence(s)
        </span>
      </div>

      <div className="space-y-2">
        {items.map((item, idx) => (
          <div
            key={`${item.name}-${idx}`}
            className={`${compact ? 'p-2.5' : 'p-3'} rounded-xl flex items-center justify-between gap-3 transition-all ${designTheme.subCard}`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`${compact ? 'w-12 h-12' : 'w-14 h-14'} rounded-xl bg-slate-100/80 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-center shrink-0 overflow-hidden p-1`}
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-contain rounded-lg"
                  />
                ) : (
                  <Sparkles size={18} style={{ color: 'var(--admin-accent, #0ea5e9)' }} />
                )}
              </div>

              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {item.brandLabel && (
                    <span className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20">
                      {item.brandLabel}
                    </span>
                  )}
                  {item.sku && (
                    <span className="text-[9px] font-mono opacity-60">{item.sku}</span>
                  )}
                </div>

                <p className="font-bold text-xs sm:text-[13px] truncate">{item.name}</p>

                <div className="flex items-center gap-2 flex-wrap text-[11px] opacity-75 font-medium">
                  <span>{item.size || '100ml'}</span>
                  <span>•</span>
                  <span className="font-bold opacity-100">Qté: {item.quantity || 1}</span>
                  {item.price ? (
                    <>
                      <span>•</span>
                      <span className="font-mono">{formatMAD(item.price)}</span>
                    </>
                  ) : null}
                </div>

                <div className="flex items-center gap-2 flex-wrap pt-0.5">
                  {typeof item.currentStock === 'number' && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${
                        item.currentStock > 3
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                          : item.currentStock > 0
                          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'
                      }`}
                    >
                      {item.currentStock > 0
                        ? `Stock atelier : ${item.currentStock}`
                        : 'Rupture atelier'}
                    </span>
                  )}
                  {item.slug && (
                    <Link
                      href={`/products/${item.slug}`}
                      target="_blank"
                      className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-0.5"
                    >
                      <span>Voir fiche</span>
                      <ArrowUpRight size={10} />
                    </Link>
                  )}
                </div>
              </div>
            </div>

            <span className="font-mono font-extrabold text-sm shrink-0 tabular-nums">
              {formatMAD((item.price || 0) * (item.quantity || 1))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCodLedgerCard = () => (
    <div className={`p-4 rounded-2xl space-y-3.5 ${designTheme.panel}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
          <CreditCard size={14} style={{ color: 'var(--admin-accent, #0ea5e9)' }} />
          <span>Décompte &amp; Encaissement COD</span>
        </span>

        <button
          type="button"
          onClick={() => setShowAdvanceEditor((prev) => !prev)}
          className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
        >
          {showAdvanceEditor ? 'Masquer éditeur' : 'Ajuster acompte'}
        </button>
      </div>

      {paymentSavedMessage && (
        <div className="px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold flex items-center gap-1.5">
          <CheckCircle2 size={13} />
          <span>{paymentSavedMessage}</span>
        </div>
      )}

      {showAdvanceEditor && (
        <div className={`p-3 rounded-xl space-y-2.5 ${designTheme.subCard}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider opacity-60 mb-1">
                Acompte encaissé (MAD)
              </label>
              <input
                type="number"
                min="0"
                max={total}
                value={advanceAmountInput}
                onChange={(e) => setAdvanceAmountInput(e.target.value)}
                className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold ${designTheme.input}`}
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider opacity-60 mb-1">
                Moyen de règlement
              </label>
              <select
                value={advanceMethodInput}
                onChange={(e) => setAdvanceMethodInput(e.target.value)}
                className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${designTheme.input}`}
              >
                <option value="VIREMENT">Virement Bancaire (CIH / Attijari)</option>
                <option value="WAFACASH">Wafacash / CashPlus</option>
                <option value="BARID">Barid Bank / Transfert</option>
                <option value="ESPECES">Espèces Boutique</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider opacity-60 mb-1">
              Note paiement / Référence reçu
            </label>
            <input
              type="text"
              value={advanceNotesInput}
              onChange={(e) => setAdvanceNotesInput(e.target.value)}
              placeholder="Ex: Reçu CIH #9841 vérifié sur WhatsApp"
              className={`w-full px-2.5 py-1.5 rounded-lg border text-xs ${designTheme.input}`}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
            <div className="flex flex-wrap items-center gap-1 text-[10px]">
              {[0, 50, 100, Math.round(total / 2), total].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleQuickAmount(amt)}
                  className="px-2 py-1 rounded-md bg-slate-100 hover:bg-sky-50 dark:bg-slate-800 dark:hover:bg-sky-500/20 font-mono font-bold transition-colors cursor-pointer"
                >
                  {amt === total ? 'Tout solder' : `${amt} DH`}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                onSavePaymentAndLogistics({
                  advancePaymentMethod: advanceMethodInput,
                  paymentNotes: advanceNotesInput,
                  carrier: carrierInput,
                  trackingNumber: trackingInput,
                })
              }
              disabled={isSavingPayment}
              className="px-3.5 py-1.5 rounded-lg bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-bold text-[11px] transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSavingPayment ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      )}

      {/* Breakdown lines */}
      <div className="space-y-1.5 text-xs font-medium opacity-85">
        <div className="flex justify-between">
          <span>Sous-total parfums :</span>
          <span className="font-mono font-semibold tabular-nums">{formatMAD(computedSubtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Livraison transporteur :</span>
          <span className="font-mono font-semibold tabular-nums">
            {shippingCost > 0 ? formatMAD(shippingCost) : 'Offerte (0 MAD)'}
          </span>
        </div>
        {discountAmt > 0 && (
          <div className="flex justify-between text-sky-600 dark:text-sky-400 font-semibold">
            <span>Remise {order.promoCode ? `(${order.promoCode})` : ''} :</span>
            <span className="font-mono tabular-nums">-{formatMAD(discountAmt)}</span>
          </div>
        )}
        {paid > 0 && (
          <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
            <span>
              Acompte encaissé {order.advancePaymentMethod ? `(${order.advancePaymentMethod})` : ''} :
            </span>
            <span className="font-mono tabular-nums">-{formatMAD(paid)}</span>
          </div>
        )}
      </div>

      {/* Collection progress meter when partial or paid */}
      {total > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] font-semibold opacity-65">
            <span>Taux d&apos;encaissement préalable</span>
            <span className="font-mono tabular-nums">{paidPct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-200/80 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
              style={{ width: `${paidPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Net COD Highlight Ticket */}
      <div className={`p-4 rounded-2xl flex items-center justify-between gap-3 ${designTheme.codTicket}`}>
        <div>
          <span className="text-[10px] uppercase tracking-wider font-bold opacity-75 block">
            {isPaidFull ? 'Commande Soldée (Reste 0 MAD)' : 'Montant Net à Encaisser (COD)'}
          </span>
          <span
            className="text-2xl font-black font-mono tracking-tight tabular-nums"
            style={{
              color:
                modalDesign === 'haute_couture_noir'
                  ? isGlobalDark
                    ? '#f3d98b'
                    : '#9a6e1c'
                  : isGlobalDark
                  ? '#34d399'
                  : '#0284c7',
            }}
          >
            {formatMAD(remaining)}
          </span>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-[11px] font-bold border ${
            isPaidFull
              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
              : 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/25'
          }`}
        >
          {isPaidFull ? '✓ Payée 100%' : 'Espèces à la livraison'}
        </span>
      </div>

      {order.paymentNotes && !showAdvanceEditor && (
        <p className="text-[11px] opacity-75 italic">Note règlement : {order.paymentNotes}</p>
      )}
    </div>
  );

  const renderShippingCard = () => (
    <div className={`p-4 rounded-2xl space-y-3 ${designTheme.panel}`}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
          <Truck size={14} style={{ color: 'var(--admin-accent, #0ea5e9)' }} />
          <span>Expédition &amp; Transporteur</span>
        </span>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopyFullDispatchSlip}
            className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-500/10 hover:bg-slate-500/20 border border-slate-500/20 inline-flex items-center gap-1 cursor-pointer transition-colors"
            title="Copier tout le bordereau livreur (Nom, Tél, Adresse, Articles, COD)"
          >
            <ClipboardCheck size={11} />
            <span>{slipCopied ? '✓ Bordereau copié' : 'Copier bordereau'}</span>
          </button>

          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/25 inline-flex items-center gap-1"
          >
            <MapPin size={10} />
            <span>Maps ↗</span>
          </a>
        </div>
      </div>

      <div className={`p-3 rounded-xl space-y-1.5 ${designTheme.subCard}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs">📍 {order.shippingCity || 'Casablanca'}</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-700 dark:text-sky-300 font-bold">
              COD National
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(
                `${order.customerName} | ${order.customerPhone} | ${order.shippingAddress || ''}, ${order.shippingCity || ''}`
              );
              setAddressCopied(true);
              setTimeout(() => setAddressCopied(false), 1800);
            }}
            className="text-[10px] font-semibold opacity-65 hover:opacity-100 cursor-pointer"
          >
            {addressCopied ? '✓ Copiée' : 'Copier adresse'}
          </button>
        </div>
        <p className="opacity-80 text-xs leading-relaxed">
          {order.shippingAddress || 'Adresse complète de livraison non renseignée'}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <select
          value={carrierInput}
          onChange={(e) => setCarrierInput(e.target.value)}
          className={`sm:w-44 px-3 py-2 rounded-xl border text-xs font-semibold shrink-0 ${designTheme.input}`}
        >
          <option value="Cathedis">Cathedis Express</option>
          <option value="Amana">Amana National (Poste)</option>
          <option value="Colis Privé">Colis Privé Maroc</option>
          <option value="Voie Express">Voie Express</option>
          <option value="Ozon Express">Ozon Express</option>
          <option value="Livreur Interne">Livreur Interne NAY</option>
        </select>

        <input
          type="text"
          value={trackingInput}
          onChange={(e) => setTrackingInput(e.target.value)}
          placeholder="N° de suivi colis..."
          className={`flex-1 min-w-0 px-3 py-2 rounded-xl border text-xs font-mono font-medium ${designTheme.input}`}
        />

        <button
          type="button"
          onClick={handleSaveShippingAndTracking}
          disabled={isSavingPayment}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] hover:from-[#38BDF8] hover:to-[#0EA5E9] text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shrink-0"
        >
          {isSavingPayment ? '...' : 'Sauvegarder'}
        </button>
      </div>

      {trackingLookupUrl && (
        <div className="flex items-center justify-between text-[11px] pt-0.5">
          <span className="opacity-65">Suivi transporteur ({carrierInput}) :</span>
          <a
            href={trackingLookupUrl}
            target="_blank"
            rel="noreferrer"
            className="font-mono font-bold text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1"
          >
            <span>Suivre {trackingInput.trim()}</span>
            <ExternalLink size={11} />
          </a>
        </div>
      )}
    </div>
  );

  const renderClientCard = () => (
    <div className={`p-4 rounded-2xl space-y-2.5 ${designTheme.panel}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-11 h-11 rounded-2xl text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-md"
            style={{
              background:
                modalDesign === 'haute_couture_noir'
                  ? 'linear-gradient(135deg, #c9a24b 0%, #8c651c 100%)'
                  : 'linear-gradient(135deg, var(--admin-accent, #0ea5e9) 0%, #0284c7 100%)',
            }}
          >
            {getInitials(order.customerName)}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-extrabold text-sm truncate">{order.customerName}</h3>
              <button
                type="button"
                onClick={() => setShowEditClient((prev) => !prev)}
                className="p-1 rounded-md opacity-55 hover:opacity-100 hover:bg-slate-500/10 cursor-pointer"
                title="Modifier nom ou ville"
              >
                <Edit3 size={12} />
              </button>
            </div>

            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <a
                href={`tel:${order.customerPhone}`}
                className="text-xs text-sky-600 dark:text-sky-400 font-mono font-bold hover:underline"
              >
                {order.customerPhone || 'Sans téléphone'}
              </a>
              {order.customerPhone && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(order.customerPhone);
                    setPhoneCopied(true);
                    setTimeout(() => setPhoneCopied(false), 1800);
                  }}
                  className="text-[10px] opacity-60 hover:opacity-100 cursor-pointer font-medium"
                >
                  {phoneCopied ? '✓ copié' : 'copier'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          {customerHistory.count > 1 ? (
            <button
              type="button"
              onClick={() => setShowCustomerHistory((prev) => !prev)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 cursor-pointer hover:bg-emerald-500/25 transition-colors"
            >
              <ShieldCheck size={11} />
              <span>Client Fidèle ({customerHistory.count} cmd)</span>
            </button>
          ) : (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold border ${trustScore.badge}`}
            >
              <TrustIcon size={11} />
              <span>{trustScore.label}</span>
            </span>
          )}
          <span className="text-[10px] opacity-55">{trustScore.desc}</span>
        </div>
      </div>

      {showEditClient && (
        <div className={`p-3 rounded-xl space-y-2 ${designTheme.subCard}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              value={editClientName}
              onChange={(e) => setEditClientName(e.target.value)}
              placeholder="Nom complet"
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${designTheme.input}`}
            />
            <input
              type="text"
              value={editClientCity}
              onChange={(e) => setEditClientCity(e.target.value)}
              placeholder="Ville"
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${designTheme.input}`}
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowEditClient(false)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold opacity-70 hover:opacity-100 cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSaveClientEdits}
              disabled={isSavingPayment || !editClientName.trim()}
              className="px-3 py-1 rounded-lg bg-[#0EA5E9] text-white text-[11px] font-bold cursor-pointer disabled:opacity-50"
            >
              Mettre à jour
            </button>
          </div>
        </div>
      )}

      {showCustomerHistory && customerHistory.orders.length > 0 && (
        <div className={`p-3 rounded-xl space-y-1.5 ${designTheme.subCard}`}>
          <div className="flex items-center justify-between text-[10.5px] font-bold opacity-80">
            <span>
              Historique client • {customerHistory.deliveredCount}/{customerHistory.orders.length} livrées
            </span>
            <span className="font-mono">{formatMAD(customerHistory.totalSpent)} cumulés</span>
          </div>
          <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
            {customerHistory.orders.map((hist) => (
              <button
                key={hist.id}
                type="button"
                onClick={() => onSelectOrder(hist)}
                className={`w-full flex items-center justify-between px-2 py-1 rounded-lg text-[10.5px] transition-colors cursor-pointer ${
                  hist.id === order.id
                    ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300 font-bold'
                    : 'hover:bg-slate-500/10'
                }`}
              >
                <span className="font-mono">#{hist.orderNumber}</span>
                <span className="opacity-70">{hist.status}</span>
                <span className="font-mono font-bold">{formatMAD(Number(hist.total) || 0)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="text-[11px] opacity-75 flex items-center justify-between pt-2 border-t border-slate-500/15 gap-2">
        <span className="truncate">
          {order.customerEmail ? `Email : ${order.customerEmail}` : `Ville : ${order.shippingCity || 'Maroc'}`}
        </span>
        <Link
          href="/admin/customers"
          className="text-sky-600 dark:text-sky-400 font-semibold hover:underline shrink-0"
        >
          Voir CRM &rarr;
        </Link>
      </div>
    </div>
  );

  const renderWhatsAppStudioCard = () => (
    <div className={`p-4 rounded-2xl space-y-3 relative overflow-hidden ${designTheme.waCard}`}>
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500" />

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <MessageCircle size={17} />
          </div>
          <div>
            <h4 className="font-extrabold text-xs sm:text-sm flex items-center gap-1.5">
              <span>Studio WhatsApp Client</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </h4>
            <p className="text-[10.5px] opacity-70 font-medium">
              Modèles intelligents FR / Darija / AR avec montant COD
            </p>
          </div>
        </div>

        {/* Language Toggle */}
        <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-900/5 dark:bg-white/10 border border-emerald-500/20">
          {(
            [
              { id: 'fr', label: 'FR' },
              { id: 'darija', label: 'Darija' },
              { id: 'ar', label: 'العربية' },
            ] as const
          ).map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => handleSelectWaLang(l.id)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                waLang === l.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scenario Pills */}
      <div className="flex flex-wrap gap-1.5">
        {(
          [
            { id: 'CONFIRM', label: '1. Confirmer', icon: CheckCircle2 },
            { id: 'SHIPPED', label: '2. Expédition', icon: Truck },
            { id: 'LOCATION', label: '3. GPS', icon: MapPin },
            { id: 'UNREACHABLE', label: '4. Injoignable', icon: Phone },
            { id: 'ADVANCE', label: '5. Acompte', icon: CreditCard },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const isActive = waPreset === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSelectWaPreset(tab.id)}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm'
                  : 'bg-white/70 dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <Icon size={12} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Editable Bubble */}
      <div className={`rounded-2xl p-3.5 space-y-1.5 relative ${designTheme.waBubble}`}>
        <div className="flex items-center justify-between text-[10px]">
          <span className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
            <MessageCircle size={12} />
            <span>Aperçu du message (Édition libre)</span>
          </span>
          <span className="text-emerald-600 dark:text-emerald-400 font-mono">
            {waMessageText.length} car.
          </span>
        </div>

        <textarea
          rows={4}
          dir={waLang === 'ar' ? 'rtl' : 'ltr'}
          value={waMessageText}
          onChange={(e) => setWaMessageText(e.target.value)}
          className="w-full text-xs leading-relaxed bg-transparent border-0 focus:outline-none focus:ring-0 resize-none font-sans font-medium"
          placeholder="Tapez le message WhatsApp pour le client..."
        />

        {/* Quick Insert Chips */}
        <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-emerald-500/15">
          <span className="text-[9.5px] opacity-60 mr-1">Insérer :</span>
          <button
            type="button"
            onClick={() => setWaMessageText((prev) => `${prev}\nCOD : ${formatMAD(remaining)}`)}
            className="text-[9.5px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-mono font-bold hover:bg-emerald-500/20 cursor-pointer"
          >
            + COD ({formatMAD(remaining)})
          </button>
          {trackingInput.trim() && (
            <button
              type="button"
              onClick={() =>
                setWaMessageText((prev) => `${prev}\nSuivi ${carrierInput} : ${trackingInput.trim()}`)
              }
              className="text-[9.5px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-mono font-bold hover:bg-emerald-500/20 cursor-pointer"
            >
              + Suivi ({trackingInput.trim()})
            </button>
          )}
        </div>
      </div>

      {/* Send / Copy row */}
      <div className="flex items-center gap-2">
        <a
          href={`https://wa.me/${waPhone}?text=${encodeURIComponent(waMessageText)}`}
          target="_blank"
          rel="noreferrer"
          className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
        >
          <MessageCircle size={15} />
          <span>Discuter sur WhatsApp</span>
          <ArrowUpRight size={14} />
        </a>

        <button
          type="button"
          onClick={() => {
            if (!waMessageText) return;
            navigator.clipboard.writeText(waMessageText);
            setWaCopied(true);
            setTimeout(() => setWaCopied(false), 1800);
          }}
          className="p-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shrink-0"
          title="Copier le texte du message"
        >
          {waCopied ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
        </button>
      </div>
    </div>
  );

  const renderAuditCard = () => (
    <div className={`p-4 rounded-2xl space-y-3 ${designTheme.panel}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
          <History size={13} style={{ color: 'var(--admin-accent, #0ea5e9)' }} />
          <span>Journal d&apos;Audit &amp; Notes</span>
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] opacity-60 font-mono font-bold">
            {timelineList.length} entrée(s)
          </span>
          {timelineList.length > 5 && (
            <button
              type="button"
              onClick={() => setShowAllTimeline((prev) => !prev)}
              className="text-[10px] font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
            >
              {showAllTimeline ? 'Réduire' : 'Tout voir'}
            </button>
          )}
        </div>
      </div>

      {/* 1-Click Call Attempt / Operator Outcome Buttons */}
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          disabled={isLoggingQuickEvent}
          onClick={() =>
            handleQuickTimelineLog('Client injoignable lors de la tentative d’appel', 'CALL_ATTEMPT')
          }
          className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/25 text-[10px] font-bold cursor-pointer disabled:opacity-50"
        >
          📞 Injoignable
        </button>
        <button
          type="button"
          disabled={isLoggingQuickEvent}
          onClick={() =>
            handleQuickTimelineLog('Appel confirmé avec le client • adresse vérifiée', 'CALL_ATTEMPT')
          }
          className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 text-[10px] font-bold cursor-pointer disabled:opacity-50"
        >
          ✓ Confirmée par tél
        </button>
        <button
          type="button"
          disabled={isLoggingQuickEvent}
          onClick={() =>
            handleQuickTimelineLog('Client a demandé un rappel ultérieur', 'CALL_ATTEMPT')
          }
          className="px-2 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/25 text-[10px] font-bold cursor-pointer disabled:opacity-50"
        >
          🕒 À rappeler
        </button>
      </div>

      <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
        {displayedTimeline.map((entry, idx) => (
          <div
            key={entry.id || idx}
            className={`p-2.5 rounded-xl text-[11px] space-y-0.5 ${designTheme.subCard}`}
          >
            <div className="flex items-center justify-between font-bold gap-2">
              <span className="truncate flex items-center gap-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    entry.status === 'delivered'
                      ? 'bg-emerald-500'
                      : entry.status === 'CALL_ATTEMPT'
                      ? 'bg-amber-500'
                      : entry.status === 'refused' || entry.status === 'returned'
                      ? 'bg-rose-500'
                      : 'bg-sky-500'
                  }`}
                />
                <span className="truncate">{entry.title || entry.status}</span>
              </span>
              <span className="text-[10px] opacity-55 font-normal shrink-0">
                {new Date(entry.createdAt).toLocaleDateString('fr-MA', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            {entry.description && (
              <p className="opacity-75 text-[10.5px] leading-tight pl-3">{entry.description}</p>
            )}
            {entry.actorName && (
              <p className="text-[9.5px] text-sky-600 dark:text-sky-400 font-semibold pl-3">
                Par {entry.actorName}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <input
          type="text"
          value={newInternalNote}
          onChange={(e) => setNewInternalNote(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (newInternalNote.trim()) {
                onAddTimelineNote(newInternalNote.trim(), 'NOTE');
                setNewInternalNote('');
              }
            }
          }}
          placeholder="Ajouter une note confidentielle pour l'équipe..."
          className={`flex-1 px-3 py-2 rounded-xl border text-xs ${designTheme.input}`}
        />
        <button
          type="button"
          onClick={() => {
            if (newInternalNote.trim()) {
              onAddTimelineNote(newInternalNote.trim(), 'NOTE');
              setNewInternalNote('');
            }
          }}
          disabled={!newInternalNote.trim()}
          className="px-3.5 py-2 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-40"
        >
          Ajouter
        </button>
      </div>
    </div>
  );

  return (
    <div
      key={`order-modal-${order.id}`}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-5 lg:p-6 overflow-y-auto"
    >
      {/* Dimmed Glass Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Sheet (Native Bottom-Sheet on Phone, Centered Sheet on Tablet/Desktop) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
        data-order-modal-design={modalDesign}
        className={`relative w-full ${maxModalWidthClass} max-h-[95dvh] sm:max-h-[93vh] rounded-t-[28px] sm:rounded-3xl flex flex-col overflow-hidden z-10 transition-[max-width,background,border-color] duration-300 ${designTheme.shell}`}
      >
        {/* Mobile Sheet Drag Handle */}
        <div className="sm:hidden pt-2 pb-1 flex justify-center shrink-0">
          <span className="w-10 h-1 rounded-full bg-slate-400/45" />
        </div>
        {/* Top Luminous Hairline Accent */}
        <div
          className={`h-[2.5px] w-full bg-gradient-to-r shrink-0 ${designTheme.topAccent}`}
        />

        {/* Optional Optical Refraction Ambient Glow for Liquid Glass */}
        {modalDesign === 'verre_optique' && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full opacity-25 blur-3xl bg-sky-400"
          />
        )}

        {/* 1. MODAL EXECUTIVE HEADER BAR */}
        <div
          className={`px-4 sm:px-6 py-3.5 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 ${designTheme.header}`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl shadow-md flex items-center justify-center text-white shrink-0"
              style={{
                background:
                  modalDesign === 'haute_couture_noir'
                    ? 'linear-gradient(135deg, #d4af37 0%, #8c651c 100%)'
                    : 'linear-gradient(135deg, var(--admin-accent, #0ea5e9) 0%, #0284c7 100%)',
              }}
            >
              <Package size={19} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-extrabold font-mono tracking-tight">
                  #{order.orderNumber}
                </h2>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(order.orderNumber);
                    setOrderNumCopied(true);
                    setTimeout(() => setOrderNumCopied(false), 1800);
                  }}
                  className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/25 transition-all cursor-pointer"
                >
                  {orderNumCopied ? '✓ Copié' : 'Copier'}
                </button>

                <div className="relative">
                  <select
                    value={order.status}
                    onChange={(e) => onStatusChange(order.id, e.target.value)}
                    className={`appearance-none pl-3 pr-7 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                      STATUS_BADGE_CLASSES[order.status] ||
                      'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-100'
                    }`}
                  >
                    <option value="pending">En attente</option>
                    <option value="unconfirmed">Non confirmé</option>
                    <option value="confirmed">Confirmée</option>
                    <option value="processing">En préparation</option>
                    <option value="shipped">En livraison</option>
                    <option value="delivered">Livrée &amp; Encaissée</option>
                    <option value="refused">Refusée</option>
                    <option value="returned">Retour</option>
                  </select>
                  <ChevronDown
                    size={12}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60"
                  />
                </div>
              </div>

              <p className="text-[11px] opacity-70 font-medium flex items-center gap-1.5 mt-0.5 flex-wrap">
                <Clock size={11} style={{ color: 'var(--admin-accent, #0ea5e9)' }} />
                <span>
                  {new Date(order.createdAt).toLocaleDateString('fr-MA', {
                    timeZone: 'Africa/Casablanca',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span>•</span>
                <span className="font-semibold opacity-100">{order.shippingCity || 'Maroc'}</span>
                <span>•</span>
                <span className="font-mono font-bold">{formatMAD(total)}</span>
              </p>
            </div>
          </div>

          {/* Right Action Toolbar + Card Design Switcher + Prev/Next */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {/* Prev / Next Order Switcher */}
            {navList.length > 1 && (
              <div className="hidden md:flex items-center gap-0.5 px-1 py-0.5 rounded-xl bg-slate-500/10 border border-slate-500/15">
                <button
                  type="button"
                  disabled={!prevOrder}
                  onClick={() => prevOrder && onSelectOrder(prevOrder)}
                  className="p-1.5 rounded-lg hover:bg-white/70 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-colors"
                  title="Commande précédente"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-[10px] font-mono font-bold px-1.5 opacity-75">
                  {currentNavIdx >= 0 ? currentNavIdx + 1 : 1}/{navList.length}
                </span>
                <button
                  type="button"
                  disabled={!nextOrder}
                  onClick={() => nextOrder && onSelectOrder(nextOrder)}
                  className="p-1.5 rounded-lg hover:bg-white/70 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-colors"
                  title="Commande suivante"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}

            {/* Modal Design Picker Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDesignPicker((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-500/10 hover:bg-slate-500/20 border border-slate-500/20 text-xs font-bold transition-all cursor-pointer"
                title="Changer le style graphique de la fiche commande"
              >
                <Palette size={13} style={{ color: 'var(--admin-accent, #0ea5e9)' }} />
                <span className="hidden sm:inline">{activeDesignMeta.label}</span>
                <ChevronDown size={12} className="opacity-70" />
              </button>

              {showDesignPicker && (
                <div
                  className={`absolute right-0 mt-2 w-72 rounded-2xl p-2 z-50 border shadow-2xl ${
                    isGlobalDark
                      ? 'bg-[#0f172a] border-slate-700 text-slate-100'
                      : 'bg-white border-slate-200 text-slate-900'
                  }`}
                >
                  <div className="px-2.5 py-1.5 flex items-center justify-between border-b border-slate-500/15 mb-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-65 flex items-center gap-1">
                      <Layers size={11} />
                      <span>Design Fiche Commande</span>
                    </span>
                    <span className="text-[10px] font-mono opacity-60">6 styles</span>
                  </div>
                  <div className="space-y-1">
                    {MODAL_DESIGN_OPTIONS.map((opt) => {
                      const active = opt.id === modalDesign;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectDesign(opt.id)}
                          className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition-all cursor-pointer ${
                            active
                              ? 'bg-sky-500/15 border border-sky-500/35'
                              : 'hover:bg-slate-500/10 border border-transparent'
                          }`}
                        >
                          <span
                            className="w-8 h-8 rounded-lg border border-slate-400/30 shrink-0 shadow-inner"
                            style={{
                              background: isGlobalDark ? opt.swatchDark : opt.swatchLight,
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold truncate">{opt.label}</span>
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-500/10 opacity-75">
                                {opt.accentHint}
                              </span>
                            </div>
                            <p className="text-[10px] opacity-65 truncate">{opt.subtitle}</p>
                          </div>
                          {active && <Check size={14} className="text-sky-500 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {order.customerPhone && (
              <a
                href={`https://wa.me/${waPhone}?text=${encodeURIComponent(waMessageText)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all"
              >
                <MessageCircle size={14} />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>
            )}

            {order.customerPhone && (
              <a
                href={`tel:${order.customerPhone}`}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-500/10 hover:bg-slate-500/20 border border-slate-500/20 text-xs font-semibold transition-colors"
              >
                <Phone size={13} />
                <span>Appeler</span>
              </a>
            )}

            <a
              href={`/invoice/${order.orderNumber}`}
              target="_blank"
              rel="noreferrer"
              className="p-2 bg-slate-500/10 hover:bg-slate-500/20 border border-slate-500/20 rounded-xl transition-colors"
              title="Facture client A4 / Bon"
            >
              <Printer size={15} />
            </a>

            <Link
              href={`/admin/sav?newClaim=true&orderId=${order.id}`}
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 text-xs font-semibold border border-amber-500/25 transition-colors"
              title="Ouvrir réclamation SAV"
            >
              <RotateCcw size={12} />
              <span>SAV</span>
            </Link>

            <button
              type="button"
              onClick={() => onDeleteOrder(order)}
              className="p-2 text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/25 rounded-xl hover:bg-rose-500/20 transition-colors cursor-pointer"
              title="Supprimer la commande"
            >
              <Trash2 size={15} />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 bg-slate-500/10 hover:bg-slate-500/20 border border-slate-500/20 rounded-xl transition-colors cursor-pointer"
              title="Fermer (Échap)"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* 2. INTERACTIVE 5-STEP PIPELINE RIBBON */}
        <div
          className={`px-4 sm:px-6 py-2.5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0 ${designTheme.ribbon}`}
        >
          <div className="flex items-center gap-2 overflow-x-auto py-0.5">
            {[
              {
                key: 'created',
                targetStatus: 'pending',
                label: '1. Reçue',
                activeWhen: ['pending', 'unconfirmed', 'processing', 'confirmed', 'shipped', 'delivered'],
              },
              {
                key: 'confirmed',
                targetStatus: 'processing',
                label: '2. Confirmée',
                activeWhen: ['processing', 'confirmed', 'shipped', 'delivered'],
              },
              {
                key: 'processing',
                targetStatus: 'processing',
                label: '3. Préparée',
                activeWhen: ['processing', 'shipped', 'delivered'],
              },
              {
                key: 'shipped',
                targetStatus: 'shipped',
                label: '4. Expédiée',
                activeWhen: ['shipped', 'delivered'],
              },
              {
                key: 'delivered',
                targetStatus: 'delivered',
                label: '5. Livrée (COD)',
                activeWhen: ['delivered'],
              },
            ].map((step, idx, arr) => {
              const isDone = step.activeWhen.includes(order.status);
              const isCurrent =
                (step.key === 'created' &&
                  (order.status === 'pending' || order.status === 'unconfirmed')) ||
                (step.key === 'confirmed' && order.status === 'confirmed') ||
                (step.key === 'processing' && order.status === 'processing') ||
                (step.key === 'shipped' && order.status === 'shipped') ||
                (step.key === 'delivered' && order.status === 'delivered');

              return (
                <React.Fragment key={step.key}>
                  <button
                    type="button"
                    onClick={() => onStatusChange(order.id, step.targetStatus)}
                    className="flex items-center gap-1.5 shrink-0 cursor-pointer group"
                    title={`Passer au statut : ${step.label}`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-transform group-hover:scale-110 ${
                        isCurrent
                          ? 'bg-[#0EA5E9] text-white ring-4 ring-[#0EA5E9]/20'
                          : isDone
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {isDone && !isCurrent ? '✓' : idx + 1}
                    </span>
                    <span
                      className={`text-[11.5px] ${
                        isCurrent
                          ? 'text-sky-600 dark:text-sky-400 font-bold'
                          : isDone
                          ? 'font-semibold opacity-90'
                          : 'opacity-50'
                      }`}
                    >
                      {step.label}
                    </span>
                  </button>
                  {idx < arr.length - 1 && (
                    <span
                      className={`w-3.5 h-0.5 shrink-0 ${
                        isDone ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-800'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}

            {(order.status === 'refused' || order.status === 'returned') && (
              <span className="ml-2 px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30 text-[10.5px] font-bold shrink-0">
                Incident : {order.status === 'refused' ? 'Refusée' : 'Colis Retourné'}
              </span>
            )}
          </div>

          {/* 1-Click Fast Forward Action */}
          <div className="flex items-center gap-2 shrink-0">
            {(order.status === 'pending' || order.status === 'unconfirmed') && (
              <button
                type="button"
                onClick={() =>
                  onStatusChange(order.id, 'processing', {
                    customNote: 'Commande confirmée et envoyée en préparation',
                  })
                }
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <Check size={14} strokeWidth={2.5} />
                <span>Confirmer la commande</span>
              </button>
            )}
            {(order.status === 'processing' || order.status === 'confirmed') && (
              <button
                type="button"
                onClick={() =>
                  onStatusChange(order.id, 'shipped', {
                    carrier: carrierInput,
                    trackingNumber: trackingInput,
                    customNote: 'Colis remis au transporteur',
                  })
                }
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] hover:from-[#38BDF8] hover:to-[#0EA5E9] text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-sky-500/25 transition-all cursor-pointer"
              >
                <Truck size={14} />
                <span>Expédier avec {carrierInput || 'Cathedis'}</span>
              </button>
            )}
            {order.status === 'shipped' && (
              <button
                type="button"
                onClick={() =>
                  onStatusChange(order.id, 'delivered', {
                    customNote: 'Colis livré et encaissé',
                  })
                }
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <Check size={14} strokeWidth={2.5} />
                <span>Marquer Livrée &amp; Encaissée</span>
              </button>
            )}
          </div>
        </div>

        {/* 3. MODAL BODY — LAYOUT ADAPTS PER SELECTED DESIGN */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 text-xs">
          {modalDesign === 'bordereau_triptych' ? (
            /* DESIGN 4: 3-Column Widescreen Zero-Scroll Cockpit */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              <div className="lg:col-span-4 space-y-4">
                {renderItemsCard(true)}
                {renderCodLedgerCard()}
              </div>
              <div className="lg:col-span-4 space-y-4">
                {renderClientCard()}
                {renderShippingCard()}
              </div>
              <div className="lg:col-span-4 space-y-4">
                {renderWhatsAppStudioCard()}
                {renderAuditCard()}
              </div>
            </div>
          ) : modalDesign === 'compact_teleop' ? (
            /* DESIGN 5: Tele-Confirmation First (Client + WhatsApp top, Logistics & Ledger below) */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              <div className="lg:col-span-6 space-y-4">
                {renderClientCard()}
                {renderWhatsAppStudioCard()}
              </div>
              <div className="lg:col-span-6 space-y-4">
                {renderShippingCard()}
                {renderCodLedgerCard()}
                {renderItemsCard(true)}
                {renderAuditCard()}
              </div>
            </div>
          ) : modalDesign === 'chrono_editorial' ? (
            /* DESIGN 6: Finance & Audit Spotlight */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              <div className="lg:col-span-7 space-y-4">
                {renderCodLedgerCard()}
                {renderItemsCard(false)}
                {renderShippingCard()}
              </div>
              <div className="lg:col-span-5 space-y-4">
                {renderClientCard()}
                {renderAuditCard()}
                {renderWhatsAppStudioCard()}
              </div>
            </div>
          ) : (
            /* DESIGNS 1, 2, 3: 2 Architectural Columns */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              <div className="lg:col-span-6 space-y-4">
                {renderItemsCard(false)}
                {renderCodLedgerCard()}
                {renderShippingCard()}
              </div>
              <div className="lg:col-span-6 space-y-4">
                {renderClientCard()}
                {renderWhatsAppStudioCard()}
                {renderAuditCard()}
              </div>
            </div>
          )}
        </div>

        {/* 4. MOBILE COMPACT THUMB-ZONE ACTION BAR */}
        <div
          className={`sm:hidden px-3.5 py-2.5 border-t flex items-center justify-between gap-2 shrink-0 ${designTheme.header}`}
          style={{ paddingBottom: 'max(0.65rem, env(safe-area-inset-bottom))' }}
        >
          {order.customerPhone && (
            <a
              href={`tel:${order.customerPhone}`}
              className="h-10 px-3 rounded-xl bg-sky-500/12 text-sky-700 dark:text-sky-300 border border-sky-500/25 font-bold text-xs flex items-center justify-center gap-1.5"
            >
              <Phone size={14} />
              <span>Appeler</span>
            </a>
          )}
          {order.customerPhone && (
            <a
              href={`https://wa.me/${waPhone}?text=${encodeURIComponent(waMessageText)}`}
              target="_blank"
              rel="noreferrer"
              className="h-10 px-3 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-bold text-xs flex items-center justify-center gap-1.5"
            >
              <MessageCircle size={14} />
              <span>WhatsApp</span>
            </a>
          )}
          <a
            href={`/invoice/${order.orderNumber}`}
            target="_blank"
            rel="noreferrer"
            className="h-10 px-3 rounded-xl bg-slate-500/10 border border-slate-500/20 font-bold text-xs flex items-center justify-center gap-1"
            title="Facture PDF / Impression"
          >
            <FileText size={14} />
          </a>
          {(order.status === 'pending' || order.status === 'unconfirmed') && (
            <button
              type="button"
              onClick={() =>
                onStatusChange(order.id, 'processing', {
                  customNote: 'Commande confirmée et envoyée en préparation',
                })
              }
              className="flex-1 h-10 px-3 rounded-xl bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check size={14} />
              <span>Confirmer</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
