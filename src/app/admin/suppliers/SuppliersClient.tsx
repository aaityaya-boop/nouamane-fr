'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Truck, Plus, Search, Filter, Phone, Mail, MapPin,
  Building2, DollarSign, Clock, Star, MessageSquare,
  ExternalLink, Edit, Trash2, CheckCircle2, AlertCircle,
  ShoppingBag, Package, FileText, Check, X, RefreshCw,
  TrendingUp, ShieldCheck, ArrowRight, Banknote, Calendar,
  Layers, ChevronDown, Download, Sparkles, Send, Printer,
  Eye, Award, CheckCircle, AlertTriangle, HelpCircle,
  BarChart3, PieChart, Percent, ArrowUpRight, Scale,
  FileCheck, Shield, ChevronRight, Copy, Hash, Globe,
  Briefcase, Boxes, Gauge, Landmark, BadgePercent, Upload,
  Image as ImageIcon, ZoomIn, CreditCard, Wallet, Paperclip, Receipt, User
} from 'lucide-react';
import { formatDateGMT, formatTimeGMT } from '@/lib/dateUtils';
import { UnifiedBillItem, checkIsOverdue, getDaysRemaining } from '@/lib/billsHelper';

export const isPdfUrl = (url?: string | null): boolean => {
  if (!url) return false;
  const clean = url.toLowerCase().split('?')[0];
  return clean.endsWith('.pdf') || url.includes('application/pdf') || url.startsWith('data:application/pdf');
};

export const getDocumentName = (url?: string | null, fallback = 'Document joint'): string => {
  if (!url) return fallback;
  try {
    const clean = url.split('?')[0];
    const parts = clean.split('/');
    const last = parts[parts.length - 1];
    if (last && last.length < 50 && !last.startsWith('data:')) {
      return decodeURIComponent(last);
    }
  } catch {}
  return fallback;
};

export interface NegotiatedSku {
  sku: string;
  name: string;
  unitCostMAD: number;
  minQty: number;
  leadTimeDays: number;
}

export interface SupplierItem {
  id: string;
  name: string;
  code: string;
  category: string;
  tier: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  country: string | null;
  address: string | null;
  taxId: string | null;
  incoterms: string | null;
  certifications: string | null;
  currency: string;
  minOrderValueMAD: number;
  paymentTerms: string | null;
  bankName: string | null;
  bankRib: string | null;
  leadTimeDays: number;
  rating: number;
  qualityScore: number;
  onTimeDeliveryRate: number;
  status: string;
  notes: string | null;
  totalOrdersCount: number;
  totalSpendMAD: number;
  lastOrderDate: string | Date | null;
  suppliedProducts: string | null;
  pricingList: string | null;
  contractUrl: string | null;
  purchaseOrders?: any[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface PurchaseOrderItem {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplier?: {
    name: string;
    code: string;
    city: string | null;
    phone: string | null;
    email?: string | null;
    taxId?: string | null;
    address?: string | null;
    bankName?: string | null;
    bankRib?: string | null;
  };
  items: string;
  subtotalAmountMAD: number;
  shippingCostMAD: number;
  taxAmountMAD: number;
  totalAmount: number;
  chargeAmountMAD?: number;
  currency: string;
  status: string;
  paymentStatus: string; // PAID, UNPAID, PARTIAL
  paidAmount: number;
  paymentMethod?: string | null;
  paymentDueDate: string | Date | null;
  paidAt?: string | Date | null;
  carrierName: string | null;
  trackingNumber: string | null;
  invoiceNumber: string | null;
  invoiceUrl: string | null;
  receiptUrl?: string | null; // Photo du reçu / facture
  qualityInspectionStatus: string;
  qualityInspectionNotes: string | null;
  deliveryExpectedAt: string | Date | null;
  receivedAt: string | Date | null;
  notes: string | null;
  createdAt: string | Date;
}

const CATEGORIES = [
  { id: 'ALL', label: 'Toutes Catégories', icon: Layers },
  { id: 'PARFUMS', label: 'Parfums & Testeurs', icon: Sparkles },
  { id: 'ESSENCES', label: 'Essences & Concentrés', icon: ShoppingBag },
  { id: 'FLACONS', label: 'Flacons & Cristallerie', icon: Building2 },
  { id: 'PACKAGING', label: 'Coffrets & Packaging', icon: Package },
  { id: 'LOGISTIQUE', label: 'Logistique & Fret', icon: Truck },
];

const TIERS_CONFIG: Record<string, { label: string; badge: string; desc: string }> = {
  'TIER_1': { label: 'Tier 1 • Partenaire Stratégique', badge: 'bg-amber-500/10 text-amber-600 border-amber-500/20', desc: 'Approvisionnement critique' },
  'TIER_2': { label: 'Tier 2 • Fournisseur Agréé', badge: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20', desc: 'Fournisseur qualifié' },
  'TIER_3': { label: 'Tier 3 • Fournisseur Ponctuel', badge: 'bg-slate-500/10 text-slate-600 border-slate-500/20', desc: 'Achats spot' },
};

const PAYMENT_TERMS_MAP: Record<string, string> = {
  'A_LA_LIVRAISON': 'Paiement à la livraison',
  '30_JOURS': '30 jours fin de mois',
  '50_AVANCE': '50% à la commande / 50% réception',
  'COMPTANT': 'Comptant avant expédition',
  'VIREMENT': 'Virement bancaire standard à 15j'
};

const INCOTERMS_OPTIONS = [
  { id: 'DDP', label: 'DDP (Rendu Droits Acquittés - Casa/Atelier NAY)' },
  { id: 'CIF', label: 'CIF (Coût, Assurance et Fret - Port/Aéroport Casa)' },
  { id: 'EXW', label: 'EXW (Départ Usine - Grasse / Dubaï)' },
  { id: 'FOB', label: 'FOB (Franco à Bord Port d’embarquement)' },
  { id: 'DAP', label: 'DAP (Rendu au Lieu de Destination)' },
];

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  'VIP': { label: 'Partenaire VIP ⭐', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'ACTIVE': { label: 'Actif & Certifié', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'PENDING': { label: 'Audit / Validation', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  'INACTIVE': { label: 'Suspendu / Inactif', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
};

const PO_STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  'DRAFT': { label: 'Brouillon', bg: 'bg-slate-100', text: 'text-slate-700' },
  'PENDING': { label: 'Transmis au Fournisseur', bg: 'bg-amber-50 text-amber-700 border border-amber-200', text: 'text-amber-700' },
  'CONFIRMED': { label: 'Confirmé / En Préparation', bg: 'bg-sky-50 text-sky-700 border border-sky-200', text: 'text-sky-700' },
  'IN_TRANSIT': { label: 'En Transit / Dédouanement', bg: 'bg-indigo-50 text-indigo-700 border border-indigo-200', text: 'text-indigo-700' },
  'RECEIVED': { label: 'Réceptionné & Contrôlé', bg: 'bg-emerald-50 text-emerald-700 border border-emerald-200', text: 'text-emerald-700' },
  'CANCELLED': { label: 'Annulé', bg: 'bg-rose-50 text-rose-700 border border-rose-200', text: 'text-rose-700' },
};

export default function SuppliersClient({
  initialSuppliers = [],
  initialPurchaseOrders = [],
  dbProducts = [],
  initialBills = [],
  currentUser
}: {
  initialSuppliers: SupplierItem[];
  initialPurchaseOrders: PurchaseOrderItem[];
  dbProducts: any[];
  initialBills?: UnifiedBillItem[];
  currentUser?: { id: string; name: string; role: string };
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const invoiceFileInputRef = useRef<HTMLInputElement | null>(null);
  const receiptFileInputRef = useRef<HTMLInputElement | null>(null);
  const orderDocFileInputRef = useRef<HTMLInputElement | null>(null);
  const billDropzoneRef = useRef<HTMLInputElement | null>(null);
  const billPaymentVoucherRef = useRef<HTMLInputElement | null>(null);

  const [suppliers, setSuppliers] = useState<SupplierItem[]>(initialSuppliers);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderItem[]>(initialPurchaseOrders);
  const [bills, setBills] = useState<UnifiedBillItem[]>(initialBills);

  // Tabs
  const [activeTab, setActiveTab] = useState<'orders' | 'bills' | 'suppliers' | 'cockpit' | 'cogs'>('orders');

  // Sync tab with URL parameter (?tab=bills / ?tab=unpaid_bills)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const t = p.get('tab');
      if (t === 'bills' || t === 'unpaid_bills' || t === 'factures') {
        setActiveTab('bills');
      }
    }
  }, []);

  // Employee Bill Deposit State
  const [isBillDepositModalOpen, setIsBillDepositModalOpen] = useState(false);
  const [billFormData, setBillFormData] = useState({
    vendor: '',
    invoiceNumber: '',
    amount: '',
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    invoiceDate: new Date().toISOString().slice(0, 10),
    category: 'SUPPLIES',
    invoiceUrl: '',
    notes: '',
  });

  // Bill Payment State
  const [isBillPayModalOpen, setIsBillPayModalOpen] = useState(false);
  const [activeBillToPay, setActiveBillToPay] = useState<UnifiedBillItem | null>(null);
  const [billPayFormData, setBillPayFormData] = useState({
    paymentMethod: 'VIREMENT',
    paidAt: new Date().toISOString().slice(0, 10),
    paymentVoucherUrl: '',
    notes: '',
  });
  const [billStatusFilter, setBillStatusFilter] = useState<'ALL' | 'PENDING' | 'OVERDUE' | 'PAID'>('PENDING');

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedTier, setSelectedTier] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'UNPAID' | 'PAID' | 'PARTIAL'>('ALL');
  const [documentFilter, setDocumentFilter] = useState<'ALL' | 'WITH_DOCS' | 'WITHOUT_DOCS'>('ALL');

  // Modals & Drawers
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierItem | null>(null);
  const [activeSupplierDossier, setActiveSupplierDossier] = useState<SupplierItem | null>(null);

  // Purchase Order Creation Modal
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedSupplierForOrder, setSelectedSupplierForOrder] = useState<SupplierItem | null>(null);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [selectedCatalogCategory, setSelectedCatalogCategory] = useState('ALL');

  // Order Line Items
  const [orderItems, setOrderItems] = useState<Array<{
    sku: string;
    name: string;
    quantity: number;
    image?: string;
    notes?: string;
  }>>([]);

  // Charge & Payment Management Modal
  const [managingChargePo, setManagingChargePo] = useState<PurchaseOrderItem | null>(null);
  const [chargeFormData, setChargeFormData] = useState({
    chargeAmountMAD: 0,
    paymentStatus: 'UNPAID', // PAID, UNPAID, PARTIAL
    paidAmount: 0,
    paymentMethod: 'VIREMENT',
    paidAt: '',
    invoiceNumber: '',
    invoiceUrl: '',
    receiptUrl: '',
    notes: ''
  });

  // Universal Document Viewer Lightbox (PDF, JPG, PNG)
  const [activeDocument, setActiveDocument] = useState<{
    url: string;
    title: string;
    subtitle: string;
    orderNumber: string;
    supplierName: string;
    typeLabel?: string;
  } | null>(null);

  // Finance Auto-Sync State
  const [isSyncingFinance, setIsSyncingFinance] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // Printable PO Modal
  const [activeOrderToPrint, setActiveOrderToPrint] = useState<PurchaseOrderItem | null>(null);

  // Loading States
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // COGS Simulator State
  const [cogsPerfumeName, setCogsPerfumeName] = useState('Extrait de Parfum NAY 100ml');
  const [cogsJusCost, setCogsJusCost] = useState(55);
  const [cogsBottleCost, setCogsBottleCost] = useState(18);
  const [cogsPackagingCost, setCogsPackagingCost] = useState(22);
  const [cogsLaborCost, setCogsLaborCost] = useState(8);
  const [cogsLogisticsCost, setCogsLogisticsCost] = useState(7);
  const [cogsRetailPrice, setCogsRetailPrice] = useState(380);

  // Supplier Form State
  const [supplierFormData, setSupplierFormData] = useState<Partial<SupplierItem>>({
    name: '',
    code: '',
    category: 'PARFUMS',
    tier: 'TIER_1',
    contactName: '',
    phone: '',
    email: '',
    city: 'Casablanca',
    country: 'MA',
    address: '',
    taxId: '',
    incoterms: 'DDP',
    certifications: '["IFRA Compliant", "ISO 22716 BPF"]',
    currency: 'MAD',
    minOrderValueMAD: 5000,
    paymentTerms: 'A_LA_LIVRAISON',
    bankName: '',
    bankRib: '',
    leadTimeDays: 3,
    rating: 5.0,
    qualityScore: 99.0,
    onTimeDeliveryRate: 98.0,
    status: 'ACTIVE',
    notes: '',
    pricingList: '[]',
    suppliedProducts: '[]'
  });

  // New PO Meta State
  const [orderMeta, setOrderMeta] = useState({
    supplierId: '',
    carrierName: 'Propre Flotte NAY / Amana Express',
    trackingNumber: '',
    deliveryExpectedAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    paymentDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    notes: 'Marchandise fragile • Vérification qualitative à la réception.',
    invoiceNumber: '',
    invoiceUrl: '',
    receiptUrl: '',
    chargeAmountMAD: 0
  });

  // Format MAD helper
  const formatMAD = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      maximumFractionDigits: 0
    }).format(amount || 0).replace('MAD', '').trim() + ' MAD';
  };

  // Filtered Catalog Products for quick selection in PO modal
  const filteredCatalogProducts = useMemo(() => {
    return dbProducts.filter((p: any) => {
      const q = productSearchTerm.toLowerCase();
      const matchSearch = !productSearchTerm || (
        p.name?.toLowerCase().includes(q) ||
        p.brandLabel?.toLowerCase().includes(q) ||
        p.slug?.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q))
      );
      const matchCat = selectedCatalogCategory === 'ALL' || p.subcategoryLabel === selectedCatalogCategory;
      return matchSearch && matchCat;
    });
  }, [dbProducts, productSearchTerm, selectedCatalogCategory]);

  // Filtered Purchase Orders
  const filteredPurchaseOrders = useMemo(() => {
    return purchaseOrders.filter(po => {
      const q = search.toLowerCase();
      const matchSearch = !search || (
        po.orderNumber.toLowerCase().includes(q) ||
        (po.supplier?.name && po.supplier.name.toLowerCase().includes(q)) ||
        (po.carrierName && po.carrierName.toLowerCase().includes(q)) ||
        (po.invoiceNumber && po.invoiceNumber.toLowerCase().includes(q))
      );
      const matchPayment = paymentFilter === 'ALL' || po.paymentStatus === paymentFilter;
      const matchDoc = documentFilter === 'ALL' || (
        documentFilter === 'WITH_DOCS'
          ? Boolean(po.invoiceUrl || po.receiptUrl)
          : (!po.invoiceUrl && !po.receiptUrl)
      );
      return matchSearch && matchPayment && matchDoc;
    });
  }, [purchaseOrders, search, paymentFilter, documentFilter]);

  // Filtered Suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => {
      const matchCategory = selectedCategory === 'ALL' || s.category === selectedCategory;
      const matchTier = selectedTier === 'ALL' || s.tier === selectedTier;
      const matchStatus = selectedStatus === 'ALL' || s.status === selectedStatus;
      const q = search.toLowerCase();
      const matchSearch = !search || (
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        (s.contactName && s.contactName.toLowerCase().includes(q)) ||
        (s.city && s.city.toLowerCase().includes(q)) ||
        (s.taxId && s.taxId.toLowerCase().includes(q)) ||
        (s.phone && s.phone.includes(q))
      );
      return matchCategory && matchTier && matchStatus && matchSearch;
    });
  }, [suppliers, selectedCategory, selectedTier, selectedStatus, search]);

  // Total Charges & KPIs
  const kpis = useMemo(() => {
    const totalSuppliers = suppliers.length;
    const totalOrders = purchaseOrders.length;
    
    // Total charges recorded
    const totalSpend = purchaseOrders.reduce((acc, po) => acc + (po.chargeAmountMAD || po.totalAmount || 0), 0);
    
    // Unpaid & Paid totals
    const unpaidOrders = purchaseOrders.filter(p => p.paymentStatus === 'UNPAID');
    const paidOrders = purchaseOrders.filter(p => p.paymentStatus === 'PAID');
    const partialOrders = purchaseOrders.filter(p => p.paymentStatus === 'PARTIAL');

    const totalUnpaidMAD = unpaidOrders.reduce((acc, p) => acc + (p.chargeAmountMAD || p.totalAmount || 0), 0);
    const totalPaidMAD = paidOrders.reduce((acc, p) => acc + (p.chargeAmountMAD || p.totalAmount || 0), 0) +
                         partialOrders.reduce((acc, p) => acc + (p.paidAmount || 0), 0);

    const ordersWithDocuments = purchaseOrders.filter(p => Boolean(p.invoiceUrl || p.receiptUrl));
    const coveragePercent = totalOrders > 0 ? Math.round((ordersWithDocuments.length / totalOrders) * 100) : 0;
    const lowStockAlerts = dbProducts.filter((p: any) => (p.stock || 0) <= 5);

    return {
      totalSuppliers,
      totalOrders,
      totalSpend,
      unpaidCount: unpaidOrders.length,
      totalUnpaidMAD,
      paidCount: paidOrders.length,
      totalPaidMAD,
      ordersWithDocumentsCount: ordersWithDocuments.length,
      coveragePercent,
      lowStockAlerts
    };
  }, [suppliers, purchaseOrders, dbProducts]);

  // Open Create Purchase Order Modal
  const handleOpenOrderModal = (supplier?: SupplierItem, initialProduct?: any) => {
    const targetSupplier = supplier || suppliers[0] || null;
    setSelectedSupplierForOrder(targetSupplier);

    let initialItems: any[] = [];
    if (initialProduct) {
      let imageSrc = '';
      try {
        const imgs = typeof initialProduct.images === 'string' ? JSON.parse(initialProduct.images) : initialProduct.images;
        imageSrc = Array.isArray(imgs) ? imgs[0] : '';
      } catch {}

      initialItems = [{
        sku: initialProduct.sku || initialProduct.slug || `PRD-${initialProduct.id}`,
        name: `${initialProduct.name} (${initialProduct.brandLabel || 'NAY'})`,
        quantity: 20,
        image: imageSrc,
        notes: 'Réassort stock urgent'
      }];
    }

    setOrderItems(initialItems);
    setOrderMeta({
      supplierId: targetSupplier?.id || '',
      carrierName: 'Propre Flotte NAY / Amana Express',
      trackingNumber: '',
      deliveryExpectedAt: new Date(Date.now() + (targetSupplier?.leadTimeDays || 3) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      paymentDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      notes: 'Marchandise fragile • Vérification qualitative à la réception.',
      invoiceNumber: '',
      invoiceUrl: '',
      receiptUrl: '',
      chargeAmountMAD: 0
    });
    setProductSearchTerm('');
    setIsOrderModalOpen(true);
  };

  // Add Product to Order Items from Catalog
  const handleAddProductToOrder = (product: any) => {
    let imageSrc = '';
    try {
      const imgs = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
      imageSrc = Array.isArray(imgs) ? imgs[0] : '';
    } catch {}

    const sku = product.sku || product.slug || `PRD-${product.id}`;
    const exists = orderItems.find(i => i.sku === sku);

    if (exists) {
      setOrderItems(prev => prev.map(i => i.sku === sku ? { ...i, quantity: i.quantity + 10 } : i));
    } else {
      setOrderItems(prev => [
        ...prev,
        {
          sku,
          name: `${product.name} (${product.brandLabel || 'NAY'})`,
          quantity: 20,
          image: imageSrc,
          notes: ''
        }
      ]);
    }
  };

  // Add Custom Free Line Item
  const handleAddCustomItem = () => {
    setOrderItems(prev => [
      ...prev,
      {
        sku: `REF-${Date.now().toString().slice(-4)}`,
        name: 'Matière Première / Flaconnage Personnalisé',
        quantity: 50,
        notes: ''
      }
    ]);
  };

  // Save Purchase Order (No Price calculation required)
  const handleSavePurchaseOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (orderItems.length === 0) {
      alert('Veuillez ajouter au moins un produit ou article à la commande.');
      return;
    }
    setIsSaving(true);

    try {
      const res = await fetch('/api/admin/suppliers/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: orderMeta.supplierId,
          items: orderItems,
          carrierName: orderMeta.carrierName,
          trackingNumber: orderMeta.trackingNumber,
          deliveryExpectedAt: orderMeta.deliveryExpectedAt,
          paymentDueDate: orderMeta.paymentDueDate,
          notes: orderMeta.notes,
          invoiceNumber: orderMeta.invoiceNumber || null,
          invoiceUrl: orderMeta.invoiceUrl || null,
          receiptUrl: orderMeta.receiptUrl || null,
          status: 'PENDING',
          paymentStatus: Number(orderMeta.chargeAmountMAD) > 0 ? 'PARTIAL' : 'UNPAID',
          totalAmount: Number(orderMeta.chargeAmountMAD) || 0,
          chargeAmountMAD: Number(orderMeta.chargeAmountMAD) || 0
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Erreur lors de l'enregistrement du bon de commande");
      }

      setPurchaseOrders(prev => [json.purchaseOrder, ...prev]);
      setIsOrderModalOpen(false);
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Erreur réseau');
    } finally {
      setIsSaving(false);
    }
  };

  // Open Manage Charge & Payment Modal
  const handleOpenChargeModal = (po: PurchaseOrderItem) => {
    setManagingChargePo(po);
    setChargeFormData({
      chargeAmountMAD: po.chargeAmountMAD || po.totalAmount || 0,
      paymentStatus: po.paymentStatus || 'UNPAID',
      paidAmount: po.paidAmount || (po.paymentStatus === 'PAID' ? (po.chargeAmountMAD || po.totalAmount || 0) : 0),
      paymentMethod: po.paymentMethod || 'VIREMENT',
      paidAt: po.paidAt ? new Date(po.paidAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      invoiceNumber: po.invoiceNumber || '',
      invoiceUrl: po.invoiceUrl || '',
      receiptUrl: po.receiptUrl || '',
      notes: po.notes || ''
    });
  };

  // Save Charge & Payment Data
  const handleSaveCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingChargePo) return;
    setIsSaving(true);

    try {
      const calculatedPaidAmount = chargeFormData.paymentStatus === 'PAID'
        ? Number(chargeFormData.chargeAmountMAD)
        : chargeFormData.paymentStatus === 'PARTIAL'
        ? Number(chargeFormData.paidAmount || (Number(chargeFormData.chargeAmountMAD) / 2))
        : 0;

      const res = await fetch('/api/admin/suppliers/purchases', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: managingChargePo.id,
          chargeAmountMAD: Number(chargeFormData.chargeAmountMAD),
          totalAmount: Number(chargeFormData.chargeAmountMAD),
          paymentStatus: chargeFormData.paymentStatus,
          paidAmount: calculatedPaidAmount,
          paymentMethod: chargeFormData.paymentMethod,
          paidAt: chargeFormData.paymentStatus === 'PAID' || chargeFormData.paymentStatus === 'PARTIAL' ? chargeFormData.paidAt : null,
          invoiceNumber: chargeFormData.invoiceNumber,
          invoiceUrl: chargeFormData.invoiceUrl,
          receiptUrl: chargeFormData.receiptUrl,
          notes: chargeFormData.notes
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Erreur mise à jour');

      setPurchaseOrders(prev => prev.map(p => p.id === managingChargePo.id ? json.purchaseOrder : p));
      setManagingChargePo(null);
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Erreur enregistrement de la charge');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Multi-Format Document Upload (PDF, JPG, PNG, WEBP)
  const handleUploadDocument = async (
    file: File,
    target: 'orderInvoice' | 'orderReceipt' | 'chargeInvoice' | 'chargeReceipt' | 'billInvoice' | 'billVoucher'
  ) => {
    if (!file) return;

    setIsUploading(true);
    const fd = new FormData();
    fd.append('file', file);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: fd
      });
      const data = await res.json();
      if (data.url) {
        if (target === 'orderInvoice') {
          setOrderMeta(prev => ({ ...prev, invoiceUrl: data.url }));
        } else if (target === 'orderReceipt') {
          setOrderMeta(prev => ({ ...prev, receiptUrl: data.url }));
        } else if (target === 'chargeInvoice') {
          setChargeFormData(prev => ({ ...prev, invoiceUrl: data.url }));
        } else if (target === 'chargeReceipt') {
          setChargeFormData(prev => ({ ...prev, receiptUrl: data.url }));
        } else if (target === 'billInvoice') {
          setBillFormData(prev => ({ ...prev, invoiceUrl: data.url }));
        } else if (target === 'billVoucher') {
          setBillPayFormData(prev => ({ ...prev, paymentVoucherUrl: data.url }));
        }
      } else {
        alert(data.error || 'Erreur lors du téléchargement');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Erreur lors du téléchargement du document (PDF ou Image)');
    } finally {
      setIsUploading(false);
    }
  };

  // Deposit Employee Bill
  const handleDepositBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billFormData.vendor.trim()) {
      alert('Veuillez saisir le nom du fournisseur ou prestataire.');
      return;
    }
    const amt = Number(billFormData.amount);
    if (isNaN(amt) || amt <= 0) {
      alert('Veuillez saisir un montant supérieur à 0 MAD.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor: billFormData.vendor,
          invoiceNumber: billFormData.invoiceNumber,
          amount: amt,
          dueDate: billFormData.dueDate,
          invoiceDate: billFormData.invoiceDate,
          category: billFormData.category,
          invoiceUrl: billFormData.invoiceUrl,
          notes: billFormData.notes,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Erreur lors du dépôt');

      setBills(prev => [json.bill, ...prev]);
      setIsBillDepositModalOpen(false);
      setBillFormData({
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
      setIsSaving(false);
    }
  };

  // Confirm Mark Bill as Paid
  const handleConfirmBillPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBillToPay) return;

    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/bills', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeBillToPay.id,
          source: activeBillToPay.source,
          action: 'MARK_PAID',
          paymentMethod: billPayFormData.paymentMethod,
          paidAt: billPayFormData.paidAt,
          paymentVoucherUrl: billPayFormData.paymentVoucherUrl,
          notes: billPayFormData.notes,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Erreur lors du règlement');

      if (activeBillToPay.source === 'PURCHASE_ORDER') {
        setPurchaseOrders(prev => prev.map(p => p.id === activeBillToPay.id ? { ...p, paymentStatus: 'PAID', paidAt: billPayFormData.paidAt } : p));
      }
      setBills(prev => prev.map(b => b.id === activeBillToPay.id ? {
        ...b,
        status: 'PAID',
        isOverdue: false,
        daysRemaining: null,
        paymentMethod: billPayFormData.paymentMethod,
        paidAt: billPayFormData.paidAt,
        receiptUrl: billPayFormData.paymentVoucherUrl || b.receiptUrl
      } : b));

      setIsBillPayModalOpen(false);
      setActiveBillToPay(null);
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Erreur lors du règlement de la facture');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Bill
  const handleDeleteBill = async (billId: string) => {
    if (!confirm('Supprimer définitivement cette facture à payer ?')) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/bills?id=${billId}&source=EMPLOYEE_BILL`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Erreur lors de la suppression');
      setBills(prev => prev.filter(b => b.id !== billId));
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Purchase Order (removes PO and its linked AdminExpense from Finance)
  const handleDeletePurchaseOrder = async (orderId: string, orderNumber: string) => {
    if (!confirm(`Supprimer définitivement le bon de commande ${orderNumber} ?\nCette opération retirera automatiquement la charge associée de Finance & CA Net.`)) {
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/suppliers/purchases?id=${orderId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de la suppression');
      }

      setPurchaseOrders(prev => prev.filter(p => p.id !== orderId));
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Erreur suppression');
    } finally {
      setIsSaving(false);
    }
  };

  // Manual Trigger: Synchronize all Purchase Orders with Finance & CA Net
  const handleSyncWithFinance = async () => {
    setIsSyncingFinance(true);
    try {
      const res = await fetch('/api/admin/suppliers/sync-charges', {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSyncNotice(data.message || 'Charges synchronisées avec succès !');
        setTimeout(() => setSyncNotice(null), 5000);
        router.refresh();
      } else {
        alert(data.error || 'Erreur lors de la synchronisation');
      }
    } catch (err) {
      console.error('Finance sync error:', err);
      alert('Erreur réseau lors de la synchronisation');
    } finally {
      setIsSyncingFinance(false);
    }
  };

  // Update PO Delivery Status
  const handleUpdateDeliveryStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/suppliers/purchases', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: orderId,
          status: newStatus,
          receivedAt: newStatus === 'RECEIVED' ? new Date().toISOString() : null
        })
      });

      if (res.ok) {
        const json = await res.json();
        setPurchaseOrders(prev => prev.map(p => p.id === orderId ? json.purchaseOrder : p));
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open Supplier Modal (Create or Edit)
  const handleOpenSupplierModal = (supplier?: SupplierItem | null) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setSupplierFormData({
        name: supplier.name || '',
        code: supplier.code || '',
        category: supplier.category || 'PARFUMS',
        tier: supplier.tier || 'TIER_1',
        contactName: supplier.contactName || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        city: supplier.city || 'Casablanca',
        country: supplier.country || 'MA',
        address: supplier.address || '',
        taxId: supplier.taxId || '',
        incoterms: supplier.incoterms || 'DDP',
        currency: supplier.currency || 'MAD',
        minOrderValueMAD: supplier.minOrderValueMAD || 0,
        paymentTerms: supplier.paymentTerms || 'A_LA_LIVRAISON',
        bankName: supplier.bankName || '',
        bankRib: supplier.bankRib || '',
        leadTimeDays: supplier.leadTimeDays || 3,
        status: supplier.status || 'ACTIVE',
        notes: supplier.notes || '',
      });
    } else {
      setEditingSupplier(null);
      setSupplierFormData({
        name: '',
        code: '',
        category: 'PARFUMS',
        tier: 'TIER_1',
        contactName: '',
        phone: '',
        email: '',
        city: 'Casablanca',
        country: 'MA',
        address: '',
        taxId: '',
        incoterms: 'DDP',
        currency: 'MAD',
        minOrderValueMAD: 0,
        paymentTerms: 'A_LA_LIVRAISON',
        bankName: '',
        bankRib: '',
        leadTimeDays: 3,
        status: 'ACTIVE',
        notes: '',
      });
    }
    setIsSupplierModalOpen(true);
  };

  // Save Supplier (POST / PUT)
  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierFormData.name?.trim()) {
      alert('Veuillez saisir le nom du partenaire fournisseur.');
      return;
    }

    setIsSaving(true);
    try {
      if (editingSupplier) {
        // Edit existing
        const res = await fetch(`/api/admin/suppliers/${editingSupplier.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(supplierFormData)
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Erreur lors de la modification du fournisseur');
        }

        setSuppliers(prev => prev.map(s => s.id === editingSupplier.id ? json.supplier : s));
        if (activeSupplierDossier && activeSupplierDossier.id === editingSupplier.id) {
          setActiveSupplierDossier(json.supplier);
        }
      } else {
        // Create new
        const res = await fetch('/api/admin/suppliers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(supplierFormData)
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Erreur lors de la création du fournisseur');
        }

        setSuppliers(prev => [json.supplier, ...prev]);
      }

      setIsSupplierModalOpen(false);
      setEditingSupplier(null);
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Erreur réseau');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Supplier
  const handleDeleteSupplier = async (supplierId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer définitivement ce partenaire fournisseur ?')) {
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/suppliers/${supplierId}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Erreur lors de la suppression');
      }

      setSuppliers(prev => prev.filter(s => s.id !== supplierId));
      if (activeSupplierDossier && activeSupplierDossier.id === supplierId) {
        setActiveSupplierDossier(null);
      }
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Erreur réseau');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-24 text-slate-900">
      {/* 👑 LUXURY EXECUTIVE HERO BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 shadow-2xl border border-slate-800/80">
        <div className="absolute -right-12 -top-12 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-16 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-amber-300 text-xs font-bold tracking-wide">
              <Sparkles size={14} className="text-amber-400" />
              <span>Maison NAY Parfums • Cockpit Achats & Approvisionnements</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              Bons de Commande, Charges & Fournisseurs
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-light leading-relaxed">
              Créez vos bons de commande en sélectionnant directement vos parfums, joignez tous vos bons (PDF, JPG, PNG), et retrouvez vos charges d'approvisionnement déduites en temps réel dans votre Chiffre d'Affaires Net.
            </p>

            {syncNotice && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold animate-fadeIn">
                <CheckCircle size={14} className="text-emerald-400" />
                <span>{syncNotice}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleOpenOrderModal()}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-amber-500/25 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Package size={15} />
              <span>+ Nouveau Bon</span>
            </button>
            <button
              type="button"
              onClick={handleSyncWithFinance}
              disabled={isSyncingFinance}
              className="px-3.5 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 text-xs font-bold backdrop-blur-md border border-cyan-400/30 transition-all flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
              title="Synchroniser automatiquement toutes les charges avec Finance & CA Net"
            >
              <RefreshCw size={14} className={isSyncingFinance ? 'animate-spin text-cyan-300' : 'text-cyan-300'} />
              <span>{isSyncingFinance ? 'Synchronisation...' : 'Synchroniser Finance & CA Net'}</span>
            </button>
            <a
              href="/admin/finance?tab=EXPENSES"
              className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold backdrop-blur-md border border-white/15 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Consulter le compte de résultat et charges dans le cockpit Finance"
            >
              <BarChart3 size={14} className="text-amber-300" />
              <span>Finance & CA Net ↗</span>
            </a>
            <button
              type="button"
              onClick={() => handleOpenSupplierModal()}
              className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold backdrop-blur-md border border-white/15 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Building2 size={14} />
              <span>+ Fournisseur</span>
            </button>
          </div>
        </div>
      </div>

      {/* 📊 EXECUTIVE BENTO KPI METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Charges Fournisseurs */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Charges Facturées</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
              <Banknote size={15} />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono">
              {formatMAD(kpis.totalSpend)}
            </div>
            <div className="text-[10px] text-slate-500 font-medium mt-0.5">
              Sur {kpis.totalOrders} commandes
            </div>
          </div>
        </div>

        {/* Impact sur CA Net */}
        <div className="bg-white border border-cyan-200/70 rounded-2xl p-4.5 shadow-xs flex flex-col justify-between hover:border-cyan-300 transition-all bg-gradient-to-br from-white to-cyan-50/30">
          <div className="flex items-center justify-between text-cyan-800 text-xs font-semibold">
            <span>Déduit du CA Net</span>
            <div className="w-7 h-7 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold">
              <TrendingUp size={15} />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl sm:text-2xl font-extrabold text-cyan-700 font-mono">
              -{formatMAD(kpis.totalSpend)}
            </div>
            <a
              href="/admin/finance?tab=EXPENSES"
              className="text-[10px] text-cyan-600 font-bold hover:underline flex items-center gap-1 mt-0.5"
            >
              <span>Vérifier dans Finance</span>
              <ArrowUpRight size={11} />
            </a>
          </div>
        </div>

        {/* Total Payé */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Charges Payées</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
              <CheckCircle2 size={15} />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 font-mono">
              {formatMAD(kpis.totalPaidMAD)}
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
              {kpis.paidCount} réglées
            </div>
          </div>
        </div>

        {/* Total Non Payé / En attente */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Soldes À Régler</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center">
              <AlertCircle size={15} />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl sm:text-2xl font-extrabold text-rose-600 font-mono">
              {formatMAD(kpis.totalUnpaidMAD)}
            </div>
            <div className="text-[10px] text-rose-600 font-semibold mt-0.5">
              {kpis.unpaidCount} en attente
            </div>
          </div>
        </div>

        {/* Bons & Documents Archivés */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Bons & Justificatifs</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
              <Paperclip size={15} />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono">
              {kpis.ordersWithDocumentsCount}/{kpis.totalOrders}
            </div>
            <div className="text-[10px] text-indigo-600 font-semibold mt-0.5">
              {kpis.coveragePercent}% couverture PDF/Reçus
            </div>
          </div>
        </div>
      </div>

      {/* 🧭 NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 bg-white p-1.5 rounded-2xl shadow-xs overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`py-2.5 px-5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'orders'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Package size={15} />
          <span>Bons de Commande, Charges & Reçus ({purchaseOrders.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bills')}
          className={`py-2.5 px-5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'bills'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Receipt size={15} />
          <span>Factures à Payer & Dépôt ({kpis.unpaidCount + bills.filter(b => b.status === 'PENDING').length})</span>
          {kpis.unpaidCount + bills.filter(b => b.status === 'PENDING').length > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${activeTab === 'bills' ? 'bg-white text-rose-600' : 'bg-rose-100 text-rose-700'}`}>
              À régler
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('suppliers')}
          className={`py-2.5 px-5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'suppliers'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Building2 size={15} />
          <span>Annuaire des Fournisseurs ({suppliers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cockpit')}
          className={`py-2.5 px-5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'cockpit'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <BarChart3 size={15} />
          <span>Cockpit Achats & Synthèse</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cogs')}
          className={`py-2.5 px-5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'cogs'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Scale size={15} />
          <span>Simulateur COGS & Marges</span>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 📜 TAB 1: BONS DE COMMANDE, CHARGES & REÇUS (MAIN VIEW) */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden space-y-6 p-6">
          {/* Top Actions & Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher par N° Bon, fournisseur, transporteur..."
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            {/* Payment & Document Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">Paiement :</span>
              <button
                type="button"
                onClick={() => setPaymentFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  paymentFilter === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tous ({purchaseOrders.length})
              </button>
              <button
                type="button"
                onClick={() => setPaymentFilter('UNPAID')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  paymentFilter === 'UNPAID'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                }`}
              >
                Non Payés ({purchaseOrders.filter(p => p.paymentStatus === 'UNPAID').length})
              </button>
              <button
                type="button"
                onClick={() => setPaymentFilter('PAID')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  paymentFilter === 'PAID'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                Payés ({purchaseOrders.filter(p => p.paymentStatus === 'PAID').length})
              </button>
              <button
                type="button"
                onClick={() => setPaymentFilter('PARTIAL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  paymentFilter === 'PARTIAL'
                    ? 'bg-sky-600 text-white'
                    : 'bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100'
                }`}
              >
                Acomptes ({purchaseOrders.filter(p => p.paymentStatus === 'PARTIAL').length})
              </button>

              <span className="text-slate-300 mx-1 hidden md:inline">|</span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">Bons :</span>

              <button
                type="button"
                onClick={() => setDocumentFilter(prev => prev === 'WITH_DOCS' ? 'ALL' : 'WITH_DOCS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  documentFilter === 'WITH_DOCS'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
                }`}
                title="Filtrer les commandes ayant au moins un bon joint (PDF ou image)"
              >
                <Paperclip size={12} />
                <span>Avec Bons ({purchaseOrders.filter(p => Boolean(p.invoiceUrl || p.receiptUrl)).length})</span>
              </button>

              <button
                type="button"
                onClick={() => setDocumentFilter(prev => prev === 'WITHOUT_DOCS' ? 'ALL' : 'WITHOUT_DOCS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  documentFilter === 'WITHOUT_DOCS'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                }`}
                title="Filtrer les commandes nécessitant l'ajout d'un bon ou d'un reçu"
              >
                <AlertCircle size={12} />
                <span>Sans Justificatif ({purchaseOrders.filter(p => !p.invoiceUrl && !p.receiptUrl).length})</span>
              </button>
            </div>
          </div>

          {/* Orders Table */}
          {filteredPurchaseOrders.length === 0 ? (
            <div className="p-16 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl">
              <Package size={40} className="mx-auto text-slate-300 mb-2" />
              <h3 className="text-sm font-bold text-slate-800">Aucun bon de commande trouvé</h3>
              <p className="text-xs text-slate-500 mt-1">Créez votre premier bon de commande avec sélection directe des parfums.</p>
              <button
                type="button"
                onClick={() => handleOpenOrderModal()}
                className="mt-4 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                + Créer un Bon de Commande
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">N° Bon & Date</th>
                    <th className="px-5 py-3.5">Fournisseur & Transport</th>
                    <th className="px-5 py-3.5">Articles Commandés</th>
                    <th className="px-5 py-3.5">Charge & CA Net</th>
                    <th className="px-5 py-3.5">Statut Paiement</th>
                    <th className="px-5 py-3.5">Bons & Pièces Jointes (PDF / Img)</th>
                    <th className="px-5 py-3.5">Statut Livraison</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPurchaseOrders.map(po => {
                    const charge = po.chargeAmountMAD || po.totalAmount || 0;
                    let itemsArray = [];
                    try {
                      itemsArray = typeof po.items === 'string' ? JSON.parse(po.items) : po.items;
                    } catch {}

                    return (
                      <tr key={po.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Order Number & Date */}
                        <td className="px-5 py-4">
                          <div className="font-mono font-bold text-slate-900">{po.orderNumber}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{formatDateGMT(po.createdAt)}</div>
                        </td>

                        {/* Supplier */}
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900">{po.supplier?.name || 'Fournisseur'}</div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin size={10} />
                            <span>{po.supplier?.city || 'Maroc'}</span>
                            {po.carrierName && (
                              <span className="text-slate-500 font-medium ml-1">• {po.carrierName}</span>
                            )}
                          </div>
                        </td>

                        {/* Items List */}
                        <td className="px-5 py-4">
                          <div className="space-y-1">
                            {itemsArray.map((it: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-1.5 text-slate-800 font-medium">
                                {it.image && (
                                  <div className="w-5 h-5 rounded relative overflow-hidden shrink-0 border border-slate-200">
                                    <Image src={it.image} alt="" fill className="object-contain" />
                                  </div>
                                )}
                                <span className="truncate max-w-[180px]">{it.name}</span>
                                <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded text-[10px] font-bold">
                                  x{it.quantity}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* Charge Fournisseur (MAD) & Imputation CA Net */}
                        <td className="px-5 py-4">
                          {charge > 0 ? (
                            <div className="space-y-1">
                              <div className="font-mono font-bold text-slate-900 text-sm">{formatMAD(charge)}</div>
                              <a
                                href="/admin/finance?tab=EXPENSES"
                                className="inline-flex items-center gap-1 text-[9px] font-bold text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-200 hover:bg-cyan-100 hover:underline transition-colors"
                                title="Cette charge est immédiatement déduite du CA Brut pour calculer le CA Net sur la page Finance"
                              >
                                <span>Lié au CA Net</span>
                                <ArrowUpRight size={10} />
                              </a>
                              {po.paidAmount > 0 && po.paymentStatus === 'PARTIAL' && (
                                <div className="text-[10px] text-sky-600 font-mono">Acompte versé: {formatMAD(po.paidAmount)}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-semibold border border-amber-200">
                              En attente facture
                            </span>
                          )}
                        </td>

                        {/* Statut Paiement (Payé / Non Payé / Acompte) */}
                        <td className="px-5 py-4">
                          {po.paymentStatus === 'PAID' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 size={12} />
                              <span>PAYÉ</span>
                            </span>
                          ) : po.paymentStatus === 'PARTIAL' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                              <Wallet size={12} />
                              <span>ACOMPTE (50%)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <AlertCircle size={12} />
                              <span>NON PAYÉ</span>
                            </span>
                          )}
                        </td>

                        {/* Bons & Pièces Jointes (PDF / Image) */}
                        <td className="px-5 py-4">
                          {po.invoiceUrl || po.receiptUrl ? (
                            <div className="flex flex-col gap-1.5">
                              {/* Bon de Commande / Livraison / Facture */}
                              {po.invoiceUrl && (
                                <div className="flex items-center gap-1.5">
                                  {isPdfUrl(po.invoiceUrl) ? (
                                    <button
                                      type="button"
                                      onClick={() => setActiveDocument({
                                        url: po.invoiceUrl!,
                                        title: `Bon / Facture • ${po.orderNumber}`,
                                        subtitle: `${po.supplier?.name || ''} • Document PDF`,
                                        orderNumber: po.orderNumber,
                                        supplierName: po.supplier?.name || '',
                                        typeLabel: 'Bon / Facture PDF'
                                      })}
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold transition-all cursor-pointer shadow-2xs hover:scale-102"
                                      title="Consulter le Bon / Facture (PDF)"
                                    >
                                      <FileText size={12} className="text-rose-600 shrink-0" />
                                      <span className="truncate max-w-[85px]">Bon (PDF)</span>
                                    </button>
                                  ) : (
                                    <div
                                      onClick={() => setActiveDocument({
                                        url: po.invoiceUrl!,
                                        title: `Bon / Facture • ${po.orderNumber}`,
                                        subtitle: `${po.supplier?.name || ''} • Image`,
                                        orderNumber: po.orderNumber,
                                        supplierName: po.supplier?.name || '',
                                        typeLabel: 'Bon / Facture Image'
                                      })}
                                      className="w-7 h-7 rounded-lg border border-slate-200 overflow-hidden relative group cursor-pointer hover:border-indigo-500 transition-all shrink-0"
                                      title="Agrandir le Bon / Facture (Image)"
                                    >
                                      <Image src={po.invoiceUrl} alt="Bon" fill className="object-cover" />
                                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                        <ZoomIn size={11} />
                                      </div>
                                    </div>
                                  )}
                                  <span className="text-[9px] text-slate-500 font-medium">Bon</span>
                                </div>
                              )}

                              {/* Reçu de Paiement */}
                              {po.receiptUrl && (
                                <div className="flex items-center gap-1.5">
                                  {isPdfUrl(po.receiptUrl) ? (
                                    <button
                                      type="button"
                                      onClick={() => setActiveDocument({
                                        url: po.receiptUrl!,
                                        title: `Reçu de Règlement • ${po.orderNumber}`,
                                        subtitle: `${po.supplier?.name || ''} • Document PDF`,
                                        orderNumber: po.orderNumber,
                                        supplierName: po.supplier?.name || '',
                                        typeLabel: 'Reçu / Virement PDF'
                                      })}
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-bold transition-all cursor-pointer shadow-2xs hover:scale-102"
                                      title="Consulter le Reçu de Règlement (PDF)"
                                    >
                                      <FileCheck size={12} className="text-emerald-600 shrink-0" />
                                      <span className="truncate max-w-[85px]">Reçu (PDF)</span>
                                    </button>
                                  ) : (
                                    <div
                                      onClick={() => setActiveDocument({
                                        url: po.receiptUrl!,
                                        title: `Reçu de Règlement • ${po.orderNumber}`,
                                        subtitle: `${po.supplier?.name || ''} • Image`,
                                        orderNumber: po.orderNumber,
                                        supplierName: po.supplier?.name || '',
                                        typeLabel: 'Reçu / Virement Image'
                                      })}
                                      className="w-7 h-7 rounded-lg border border-emerald-200 overflow-hidden relative group cursor-pointer hover:border-emerald-500 transition-all shrink-0"
                                      title="Agrandir le Reçu de Paiement (Image)"
                                    >
                                      <Image src={po.receiptUrl} alt="Reçu" fill className="object-cover" />
                                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                        <ZoomIn size={11} />
                                      </div>
                                    </div>
                                  )}
                                  <span className="text-[9px] text-emerald-700 font-semibold">Reçu</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenChargeModal(po)}
                              className="text-[10px] text-slate-500 hover:text-indigo-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                              title="Joindre un Bon de commande/livraison ou un reçu de paiement (PDF, Image)"
                            >
                              <Upload size={12} />
                              <span>+ Joindre Bon</span>
                            </button>
                          )}
                        </td>

                        {/* Statut Livraison */}
                        <td className="px-5 py-4">
                          <select
                            value={po.status}
                            onChange={e => handleUpdateDeliveryStatus(po.id, e.target.value)}
                            className="text-[11px] font-bold rounded-lg px-2.5 py-1 bg-slate-100 text-slate-800 border border-slate-200 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                          >
                            <option value="PENDING">Transmis</option>
                            <option value="CONFIRMED">Confirmé / En cours</option>
                            <option value="IN_TRANSIT">En Transit</option>
                            <option value="RECEIVED">Réceptionné</option>
                            <option value="CANCELLED">Annulé</option>
                          </select>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenChargeModal(po)}
                              className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 flex items-center gap-1 transition-colors cursor-pointer"
                              title="Gérer le montant de la charge, le règlement et joindre les bons"
                            >
                              <Banknote size={13} />
                              <span>Règlement & Bons</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setActiveOrderToPrint(po)}
                              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                              title="Imprimer / Visualiser le Bon de Commande"
                            >
                              <Printer size={14} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeletePurchaseOrder(po.id, po.orderNumber)}
                              className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Supprimer ce bon de commande et retirer la charge de Finance"
                            >
                              <Trash2 size={14} />
                            </button>
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
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 📦 MODAL: NOUVEAU BON DE COMMANDE AVEC SÉLECTION PRODUITS */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Package size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Émettre un Nouveau Bon de Commande</h3>
                  <p className="text-xs text-slate-500">Sélectionnez vos parfums au catalogue ou ajoutez des fournitures sur mesure.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOrderModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSavePurchaseOrder} className="space-y-6 text-xs">
              {/* Supplier Selection */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                  1. Fournisseur Destinataire *
                </label>
                <select
                  required
                  value={orderMeta.supplierId}
                  onChange={e => {
                    const supId = e.target.value;
                    setOrderMeta({ ...orderMeta, supplierId: supId });
                    setSelectedSupplierForOrder(suppliers.find(s => s.id === supId) || null);
                  }}
                  className="w-full font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white cursor-pointer"
                >
                  <option value="">-- Choisir le partenaire destinataire --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.city || 'Maroc'}) — {s.code} • {s.category}
                    </option>
                  ))}
                </select>
              </div>

              {/* 🛍️ PRODUCT SELECTOR FROM CATALOG */}
              <div className="space-y-3 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-500" />
                    <span>2. Sélectionner les Produits du Catalogue NAY</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddCustomItem}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                  >
                    + Ajouter une ligne personnalisée
                  </button>
                </div>

                {/* Search Bar for Catalog */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={productSearchTerm}
                    onChange={e => setProductSearchTerm(e.target.value)}
                    placeholder="Tapez pour filtrer les parfums (Dior, Valentino, Oud, etc.)..."
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Products Grid (Max 6 visible with scroll) */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-1">
                  {filteredCatalogProducts.slice(0, 12).map((prod: any) => {
                    let imageSrc = '/placeholder-perfume.jpg';
                    try {
                      const imgs = typeof prod.images === 'string' ? JSON.parse(prod.images) : prod.images;
                      if (Array.isArray(imgs) && imgs[0]) imageSrc = imgs[0];
                    } catch {}

                    const sku = prod.sku || prod.slug || `PRD-${prod.id}`;
                    const isSelected = orderItems.some(i => i.sku === sku);

                    return (
                      <div
                        key={prod.id}
                        onClick={() => handleAddProductToOrder(prod)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-400'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 relative overflow-hidden shrink-0 border border-slate-200">
                            {imageSrc.startsWith('http') || imageSrc.startsWith('/') ? (
                              <Image src={imageSrc} alt="" fill className="object-contain p-0.5" />
                            ) : null}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate text-[11px]">{prod.name}</div>
                            <div className="text-[10px] text-slate-400 truncate">{prod.brandLabel || 'NAY'} • Stock: {prod.stock || 0}</div>
                          </div>
                        </div>

                        <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {isSelected ? '✓' : '+'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 📋 SELECTED ITEMS LIST & QUANTITY CONTROLS */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  3. Lignes du Bon de Commande ({orderItems.length} articles)
                </label>

                {orderItems.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-slate-400">
                    <p className="font-semibold text-slate-600">Aucun produit sélectionné pour ce bon de commande.</p>
                    <p className="text-[11px] mt-0.5">Cliquez sur un parfum ci-dessus pour l'ajouter instantanément.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {orderItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                        {item.image && (
                          <div className="w-8 h-8 rounded-lg bg-white relative overflow-hidden shrink-0 border border-slate-200">
                            <Image src={item.image} alt="" fill className="object-contain" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            required
                            value={item.name}
                            onChange={e => {
                              const updated = [...orderItems];
                              updated[idx].name = e.target.value;
                              setOrderItems(updated);
                            }}
                            className="w-full bg-transparent font-bold text-slate-900 focus:bg-white focus:outline-none px-1 rounded"
                          />
                          <div className="text-[10px] font-mono text-slate-400 px-1">{item.sku}</div>
                        </div>

                        {/* Quantity Stepper */}
                        <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-xl border border-slate-200">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...orderItems];
                              updated[idx].quantity = Math.max(1, updated[idx].quantity - 5);
                              setOrderItems(updated);
                            }}
                            className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={e => {
                              const updated = [...orderItems];
                              updated[idx].quantity = Math.max(1, Number(e.target.value));
                              setOrderItems(updated);
                            }}
                            className="w-12 text-center font-mono font-bold text-xs bg-transparent focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...orderItems];
                              updated[idx].quantity = updated[idx].quantity + 5;
                              setOrderItems(updated);
                            }}
                            className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold"
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setOrderItems(orderItems.filter((_, i) => i !== idx));
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Delivery Meta */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    Transporteur / Acheminement
                  </label>
                  <input
                    type="text"
                    value={orderMeta.carrierName}
                    onChange={e => setOrderMeta({ ...orderMeta, carrierName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    Date de Réception Estimée
                  </label>
                  <input
                    type="date"
                    value={orderMeta.deliveryExpectedAt}
                    onChange={e => setOrderMeta({ ...orderMeta, deliveryExpectedAt: e.target.value })}
                    className="w-full font-mono bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* 📄 PIÈCE JOINTE DU BON DE COMMANDE (PDF / IMAGE) */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <FileText size={15} className="text-indigo-600" />
                    <span>4. Joindre un Bon / Devis / Facture Proforma (PDF, JPG, PNG)</span>
                  </label>
                  {orderMeta.invoiceUrl && (
                    <button
                      type="button"
                      onClick={() => setOrderMeta({ ...orderMeta, invoiceUrl: '' })}
                      className="text-[10px] font-bold text-rose-600 hover:underline"
                    >
                      Supprimer le document
                    </button>
                  )}
                </div>

                <input
                  type="file"
                  ref={orderDocFileInputRef}
                  accept=".pdf,image/png,image/jpeg,image/webp,image/jpg,application/pdf"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadDocument(file, 'orderInvoice');
                  }}
                  className="hidden"
                />

                {orderMeta.invoiceUrl ? (
                  <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-indigo-200">
                    {isPdfUrl(orderMeta.invoiceUrl) ? (
                      <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 flex flex-col items-center justify-center text-rose-600 shrink-0">
                        <FileText size={20} />
                        <span className="text-[9px] font-black uppercase mt-0.5">PDF</span>
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl relative overflow-hidden border border-slate-200 shrink-0">
                        <Image src={orderMeta.invoiceUrl} alt="Bon" fill className="object-cover" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {getDocumentName(orderMeta.invoiceUrl, 'Bon joint au format PDF / Image')}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">{orderMeta.invoiceUrl}</div>
                      <button
                        type="button"
                        onClick={() => setActiveDocument({
                          url: orderMeta.invoiceUrl,
                          title: 'Bon joint • Nouveau bon',
                          subtitle: 'Aperçu du document',
                          orderNumber: 'Nouveau',
                          supplierName: 'Fournisseur sélectionné',
                          typeLabel: isPdfUrl(orderMeta.invoiceUrl) ? 'Bon PDF' : 'Bon Image'
                        })}
                        className="text-[11px] font-bold text-indigo-600 hover:underline mt-1 flex items-center gap-1"
                      >
                        <ZoomIn size={12} />
                        <span>Visualiser le document</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <button
                      type="button"
                      onClick={() => orderDocFileInputRef.current?.click()}
                      disabled={isUploading}
                      className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {isUploading ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
                      <span>Télécharger Bon (PDF ou Image)</span>
                    </button>
                    <span className="text-slate-400 text-[11px]">ou</span>
                    <input
                      type="text"
                      placeholder="Coller l'URL du bon (PDF, JPG, PNG)..."
                      value={orderMeta.invoiceUrl}
                      onChange={e => setOrderMeta({ ...orderMeta, invoiceUrl: e.target.value })}
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                )}
              </div>

              {/* 💰 CHARGE ESTIMÉE INITIALE (OPTIONNEL) */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    5. Charge Initiale Estimée (MAD) - Optionnel
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={orderMeta.chargeAmountMAD || ''}
                      onChange={e => setOrderMeta({ ...orderMeta, chargeAmountMAD: Number(e.target.value) })}
                      placeholder="ex: 12500"
                      className="w-full font-mono bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">MAD</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    N° Facture / Devis Fournisseur
                  </label>
                  <input
                    type="text"
                    value={orderMeta.invoiceNumber}
                    onChange={e => setOrderMeta({ ...orderMeta, invoiceNumber: e.target.value })}
                    placeholder="FAC-PRO-2026..."
                    className="w-full font-mono bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Info Note: Linked with Finance */}
              <div className="p-3.5 rounded-2xl bg-cyan-50/70 border border-cyan-200 flex items-center gap-2.5 text-cyan-950">
                <Sparkles size={18} className="text-cyan-600 shrink-0" />
                <span className="text-[11px] leading-relaxed">
                  <strong>Liaison comptable & CA Net automatique :</strong> Dès qu'un montant facturé est consigné, il est instantanément répercuté dans vos charges d'exploitation et déduit de votre CA Brut pour calculer votre CA Net et votre marge réelle.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOrderModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSaving || orderItems.length === 0}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                  <span>Créer le Bon de Commande</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 💳 MODAL: GESTION DE LA CHARGE FOURNISSEUR, PAIEMENT & REÇU */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {managingChargePo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {managingChargePo.orderNumber}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">{managingChargePo.supplier?.name}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">Enregistrer la Charge & les Bons</h3>
                <p className="text-xs text-slate-500">Saisissez le montant facturé, le règlement et joignez vos bons (PDF, JPG, PNG).</p>
              </div>
              <button
                type="button"
                onClick={() => setManagingChargePo(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveCharge} className="space-y-5 text-xs">
              {/* Linked to Finance Banner */}
              <div className="p-3.5 rounded-2xl bg-cyan-50/80 border border-cyan-200 flex items-center gap-3 text-cyan-950">
                <Sparkles size={18} className="text-cyan-600 shrink-0" />
                <div className="text-[11px] leading-relaxed">
                  <strong>Imputation Finance & CA Net :</strong> Cette charge sera automatiquement rattachée à la comptabilité Maison NAY et déduite de votre Chiffre d'Affaires Brut dans <strong className="text-cyan-800">Finance & CA Net</strong>.
                </div>
              </div>

              {/* Charge Amount (MAD) */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                  Montant Réel de la Charge Fournisseur (Facture TTC en MAD) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={chargeFormData.chargeAmountMAD || ''}
                    onChange={e => setChargeFormData({ ...chargeFormData, chargeAmountMAD: Number(e.target.value) })}
                    placeholder="ex: 15400"
                    className="w-full font-mono text-base font-bold bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">
                    MAD
                  </span>
                </div>
              </div>

              {/* Payment Status Switcher (Payé / Non Payé / Acompte) */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
                  Statut de Règlement de la Charge *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setChargeFormData({ ...chargeFormData, paymentStatus: 'PAID' })}
                    className={`p-3 rounded-xl font-bold flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                      chargeFormData.paymentStatus === 'PAID'
                        ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                        : 'bg-emerald-50/50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    <CheckCircle2 size={16} />
                    <span>PAYÉ (Intégral)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setChargeFormData({ ...chargeFormData, paymentStatus: 'PARTIAL' })}
                    className={`p-3 rounded-xl font-bold flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                      chargeFormData.paymentStatus === 'PARTIAL'
                        ? 'bg-sky-600 text-white border-sky-700 shadow-sm'
                        : 'bg-sky-50/50 text-sky-800 border-sky-200 hover:bg-sky-100'
                    }`}
                  >
                    <Wallet size={16} />
                    <span>ACOMPTE (Partiel)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setChargeFormData({ ...chargeFormData, paymentStatus: 'UNPAID' })}
                    className={`p-3 rounded-xl font-bold flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                      chargeFormData.paymentStatus === 'UNPAID'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                        : 'bg-rose-50/50 text-rose-800 border-rose-200 hover:bg-rose-100'
                    }`}
                  >
                    <AlertCircle size={16} />
                    <span>NON PAYÉ (À Régler)</span>
                  </button>
                </div>
              </div>

              {/* Payment Method & Date (If Paid or Partial) */}
              {chargeFormData.paymentStatus !== 'UNPAID' && (
                <div className="grid sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                      Mode de Règlement
                    </label>
                    <select
                      value={chargeFormData.paymentMethod}
                      onChange={e => setChargeFormData({ ...chargeFormData, paymentMethod: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none"
                    >
                      <option value="VIREMENT">Virement bancaire (Attijari, CIH, BOA)</option>
                      <option value="ESPECES">Espèces (Reçu de caisse)</option>
                      <option value="CHEQUE">Chèque bancaire</option>
                      <option value="EFFET">Effet de commerce (Traite)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                      Date du Règlement
                    </label>
                    <input
                      type="date"
                      value={chargeFormData.paidAt}
                      onChange={e => setChargeFormData({ ...chargeFormData, paidAt: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* 📑 SECTION 1: BON DE COMMANDE / BON DE LIVRAISON / FACTURE (PDF, JPG, PNG) */}
              <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <FileText size={15} className="text-indigo-600" />
                    <span>Bon de Livraison / Facture d'Achat (PDF, JPG, PNG)</span>
                  </label>
                  {chargeFormData.invoiceUrl && (
                    <button
                      type="button"
                      onClick={() => setChargeFormData({ ...chargeFormData, invoiceUrl: '' })}
                      className="text-[10px] font-bold text-rose-600 hover:underline"
                    >
                      Supprimer le document
                    </button>
                  )}
                </div>

                <input
                  type="file"
                  ref={invoiceFileInputRef}
                  accept=".pdf,image/png,image/jpeg,image/webp,image/jpg,application/pdf"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadDocument(file, 'chargeInvoice');
                  }}
                  className="hidden"
                />

                {chargeFormData.invoiceUrl ? (
                  <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
                    {isPdfUrl(chargeFormData.invoiceUrl) ? (
                      <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 flex flex-col items-center justify-center text-rose-600 shrink-0">
                        <FileText size={20} />
                        <span className="text-[9px] font-black uppercase mt-0.5">PDF</span>
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl relative overflow-hidden border border-slate-200 shrink-0">
                        <Image src={chargeFormData.invoiceUrl} alt="Bon" fill className="object-cover" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {getDocumentName(chargeFormData.invoiceUrl, 'Bon / Facture fournisseur')}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">{chargeFormData.invoiceUrl}</div>
                      <button
                        type="button"
                        onClick={() => setActiveDocument({
                          url: chargeFormData.invoiceUrl,
                          title: `Bon / Facture • ${managingChargePo.orderNumber}`,
                          subtitle: managingChargePo.supplier?.name || '',
                          orderNumber: managingChargePo.orderNumber,
                          supplierName: managingChargePo.supplier?.name || '',
                          typeLabel: isPdfUrl(chargeFormData.invoiceUrl) ? 'Bon PDF' : 'Bon Image'
                        })}
                        className="text-[11px] font-bold text-indigo-600 hover:underline mt-1 flex items-center gap-1"
                      >
                        <ZoomIn size={12} />
                        <span>Visualiser en plein écran</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => invoiceFileInputRef.current?.click()}
                      disabled={isUploading}
                      className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {isUploading ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
                      <span>Télécharger Bon (PDF / Image)</span>
                    </button>
                    <span className="text-slate-400 text-[11px]">ou</span>
                    <input
                      type="text"
                      placeholder="Coller l'URL du bon (PDF, JPG, PNG)..."
                      value={chargeFormData.invoiceUrl}
                      onChange={e => setChargeFormData({ ...chargeFormData, invoiceUrl: e.target.value })}
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                )}
              </div>

              {/* 📷 SECTION 2: REÇU DE PAIEMENT / SCAN VIREMENT (PDF, JPG, PNG) */}
              <div className="space-y-2 p-4 rounded-2xl bg-emerald-50/40 border border-emerald-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                    <FileCheck size={15} className="text-emerald-600" />
                    <span>Reçu de Règlement / Avis de Virement (PDF, JPG, PNG)</span>
                  </label>
                  {chargeFormData.receiptUrl && (
                    <button
                      type="button"
                      onClick={() => setChargeFormData({ ...chargeFormData, receiptUrl: '' })}
                      className="text-[10px] font-bold text-rose-600 hover:underline"
                    >
                      Supprimer le reçu
                    </button>
                  )}
                </div>

                <input
                  type="file"
                  ref={receiptFileInputRef}
                  accept=".pdf,image/png,image/jpeg,image/webp,image/jpg,application/pdf"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadDocument(file, 'chargeReceipt');
                  }}
                  className="hidden"
                />

                {chargeFormData.receiptUrl ? (
                  <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-emerald-200">
                    {isPdfUrl(chargeFormData.receiptUrl) ? (
                      <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col items-center justify-center text-emerald-600 shrink-0">
                        <FileCheck size={20} />
                        <span className="text-[9px] font-black uppercase mt-0.5">PDF</span>
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl relative overflow-hidden border border-slate-200 shrink-0">
                        <Image src={chargeFormData.receiptUrl} alt="Reçu" fill className="object-cover" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {getDocumentName(chargeFormData.receiptUrl, 'Reçu de paiement enregistré')}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">{chargeFormData.receiptUrl}</div>
                      <button
                        type="button"
                        onClick={() => setActiveDocument({
                          url: chargeFormData.receiptUrl,
                          title: `Reçu de Règlement • ${managingChargePo.orderNumber}`,
                          subtitle: managingChargePo.supplier?.name || '',
                          orderNumber: managingChargePo.orderNumber,
                          supplierName: managingChargePo.supplier?.name || '',
                          typeLabel: isPdfUrl(chargeFormData.receiptUrl) ? 'Reçu PDF' : 'Reçu Image'
                        })}
                        className="text-[11px] font-bold text-emerald-700 hover:underline mt-1 flex items-center gap-1"
                      >
                        <ZoomIn size={12} />
                        <span>Visualiser en plein écran</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => receiptFileInputRef.current?.click()}
                      disabled={isUploading}
                      className="w-full sm:w-auto px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {isUploading ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
                      <span>Télécharger Reçu (PDF / Image)</span>
                    </button>
                    <span className="text-slate-400 text-[11px]">ou</span>
                    <input
                      type="text"
                      placeholder="Coller l'URL du reçu (PDF, JPG, PNG)..."
                      value={chargeFormData.receiptUrl}
                      onChange={e => setChargeFormData({ ...chargeFormData, receiptUrl: e.target.value })}
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Invoice Number & Notes */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    N° Facture / Bordereau Fournisseur
                  </label>
                  <input
                    type="text"
                    value={chargeFormData.invoiceNumber}
                    onChange={e => setChargeFormData({ ...chargeFormData, invoiceNumber: e.target.value })}
                    placeholder="FAC-2026-0891"
                    className="w-full font-mono bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    Notes de Paiement
                  </label>
                  <input
                    type="text"
                    value={chargeFormData.notes}
                    onChange={e => setChargeFormData({ ...chargeFormData, notes: e.target.value })}
                    placeholder="Virement émis le 03/10..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setManagingChargePo(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                  <span>Enregistrer la Charge & les Bons</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 🔍 MODAL UNIVERSELLE: VISIONNEUSE DE DOCUMENTS (PDF & IMAGES) */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {activeDocument.orderNumber}
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900">{activeDocument.title}</h4>
                  <p className="text-[11px] text-slate-500 font-medium">{activeDocument.subtitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={activeDocument.url}
                  download={getDocumentName(activeDocument.url, `${activeDocument.orderNumber}_bon`)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  title="Télécharger le fichier"
                >
                  <Download size={13} />
                  <span className="hidden sm:inline">Télécharger</span>
                </a>

                <a
                  href={activeDocument.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                  title="Ouvrir dans un nouvel onglet"
                >
                  <ExternalLink size={13} />
                  <span className="hidden sm:inline">Plein écran</span>
                </a>

                <button
                  type="button"
                  onClick={() => setActiveDocument(null)}
                  className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
                  title="Fermer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Modal Body: PDF Iframe or High-Res Image */}
            <div className="relative w-full flex-1 min-h-[60vh] max-h-[75vh] bg-slate-950 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
              {isPdfUrl(activeDocument.url) ? (
                <div className="w-full h-full flex flex-col items-center">
                  <iframe
                    src={activeDocument.url}
                    title={activeDocument.title}
                    className="w-full h-full min-h-[65vh] rounded-2xl bg-white border border-slate-800 shadow-2xl"
                  />
                </div>
              ) : (
                <div className="relative w-full h-full min-h-[60vh]">
                  <Image
                    src={activeDocument.url}
                    alt={activeDocument.title}
                    fill
                    className="object-contain"
                    sizes="(max-width: 1024px) 100vw, 1000px"
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 text-[11px] font-mono truncate max-w-md">
                {getDocumentName(activeDocument.url, 'Document')} • {isPdfUrl(activeDocument.url) ? 'Format Document PDF' : 'Format Image (Haute Résolution)'}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Maison NAY Parfums • Archivage Sécurisé</span>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 🧾 TAB: FACTURES À PAYER & DÉPÔT EMPLOYÉS */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'bills' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Card */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
                <Receipt size={12} />
                <span>Gestion des Factures à Payer & Dépôt Équipe</span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Factures à Payer & Échéancier des Règlements
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed font-light">
                Tous les collaborateurs ont accès à cet espace pour déposer les factures reçues des fournisseurs et prestataires.
                Chaque facture déposée est tracée, horodatée et archivée pour validation de paiement.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsBillDepositModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold text-xs shadow-md shadow-rose-500/20 transition-all flex items-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
              >
                <Plus size={16} />
                <span>Déposer une Facture à Payer</span>
              </button>

              <a
                href="/admin/bills"
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-all flex items-center gap-1.5"
              >
                <span>Vue Dédiée</span>
                <ArrowUpRight size={14} />
              </a>
            </div>
          </div>

          {/* Bento KPIs for Bills */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Total En Attente</span>
                <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <DollarSign size={14} />
                </div>
              </div>
              <div className="text-xl font-extrabold text-rose-600 font-mono mt-2">
                {formatMAD(
                  purchaseOrders.filter(po => po.paymentStatus !== 'PAID').reduce((sum, po) => sum + (po.chargeAmountMAD || po.totalAmount || 0), 0) +
                  bills.filter(b => b.status === 'PENDING').reduce((sum, b) => sum + b.amountMAD, 0)
                )}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {purchaseOrders.filter(po => po.paymentStatus !== 'PAID').length + bills.filter(b => b.status === 'PENDING').length} factures à acquitter
              </div>
            </div>

            <div className="bg-white border border-amber-200/90 rounded-2xl p-4 shadow-xs bg-gradient-to-br from-white to-amber-50/20">
              <div className="flex items-center justify-between text-amber-800 text-xs font-semibold">
                <span>Factures En Retard</span>
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <AlertTriangle size={14} />
                </div>
              </div>
              <div className="text-xl font-extrabold text-amber-700 font-mono mt-2">
                {
                  purchaseOrders.filter(po => po.paymentStatus !== 'PAID' && checkIsOverdue(po.paymentDueDate, 'PENDING')).length +
                  bills.filter(b => b.status === 'PENDING' && b.isOverdue).length
                }
              </div>
              <div className="text-[10px] text-amber-600 font-semibold mt-0.5">
                Échéance dépassée
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Dépôts Équipe</span>
                <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                  <User size={14} />
                </div>
              </div>
              <div className="text-xl font-extrabold text-sky-700 font-mono mt-2">
                {bills.length}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Factures transmises par l'équipe
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Factures Réglées</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <CheckCircle2 size={14} />
                </div>
              </div>
              <div className="text-xl font-extrabold text-emerald-600 font-mono mt-2">
                {
                  purchaseOrders.filter(po => po.paymentStatus === 'PAID').length +
                  bills.filter(b => b.status === 'PAID').length
                }
              </div>
              <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                Règlements archivés
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setBillStatusFilter('PENDING')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  billStatusFilter === 'PENDING' ? 'bg-rose-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                À Payer ({purchaseOrders.filter(po => po.paymentStatus !== 'PAID').length + bills.filter(b => b.status === 'PENDING').length})
              </button>
              <button
                type="button"
                onClick={() => setBillStatusFilter('OVERDUE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  billStatusFilter === 'OVERDUE' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                En Retard
              </button>
              <button
                type="button"
                onClick={() => setBillStatusFilter('PAID')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  billStatusFilter === 'PAID' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Réglées
              </button>
              <button
                type="button"
                onClick={() => setBillStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  billStatusFilter === 'ALL' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Toutes
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Filtrer les factures..."
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Statut & Échéance</th>
                    <th className="py-3.5 px-4">Fournisseur / Prestataire</th>
                    <th className="py-3.5 px-4">Document / Facture</th>
                    <th className="py-3.5 px-4">Montant TTC</th>
                    <th className="py-3.5 px-4">Déposé par</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Map combined bills */}
                  {[
                    // Employee bills
                    ...bills.map(b => ({
                      id: b.id,
                      source: 'EMPLOYEE_BILL' as const,
                      vendor: b.vendor,
                      invoiceNumber: b.invoiceNumber,
                      amountMAD: b.amountMAD,
                      dueDate: b.dueDate,
                      status: b.status,
                      isOverdue: b.isOverdue,
                      daysRemaining: b.daysRemaining,
                      invoiceUrl: b.invoiceUrl,
                      receiptUrl: b.receiptUrl,
                      paymentMethod: b.paymentMethod,
                      creatorName: b.creatorName,
                      creatorRole: b.creatorRole,
                      notes: b.notes,
                    })),
                    // Purchase orders
                    ...purchaseOrders.map(po => {
                      const isPaid = po.paymentStatus === 'PAID';
                      const dueDateStr = po.paymentDueDate ? new Date(po.paymentDueDate).toISOString().slice(0, 10) : null;
                      const isOverdue = checkIsOverdue(dueDateStr, isPaid ? 'PAID' : 'PENDING');
                      const daysRemaining = getDaysRemaining(dueDateStr);
                      return {
                        id: po.id,
                        source: 'PURCHASE_ORDER' as const,
                        vendor: po.supplier?.name || 'Fournisseur',
                        invoiceNumber: po.invoiceNumber || po.orderNumber,
                        amountMAD: Number(po.chargeAmountMAD) || Number(po.totalAmount) || 0,
                        dueDate: dueDateStr,
                        status: isPaid ? ('PAID' as const) : ('PENDING' as const),
                        isOverdue,
                        daysRemaining,
                        invoiceUrl: po.invoiceUrl || null,
                        receiptUrl: po.receiptUrl || null,
                        paymentMethod: po.paymentMethod || null,
                        creatorName: 'Direction Achats',
                        creatorRole: 'Achats & Logistique',
                        notes: po.notes || null,
                      };
                    })
                  ]
                    .filter(item => {
                      if (billStatusFilter === 'PENDING' && item.status !== 'PENDING') return false;
                      if (billStatusFilter === 'OVERDUE' && (!item.isOverdue || item.status !== 'PENDING')) return false;
                      if (billStatusFilter === 'PAID' && item.status !== 'PAID') return false;
                      if (search.trim()) {
                        const q = search.toLowerCase();
                        return (
                          item.vendor.toLowerCase().includes(q) ||
                          item.invoiceNumber.toLowerCase().includes(q) ||
                          item.creatorName.toLowerCase().includes(q)
                        );
                      }
                      return true;
                    })
                    .map((item, idx) => (
                      <tr key={`${item.source}-${item.id}-${idx}`} className="hover:bg-slate-50/60 transition-colors">
                        {/* Statut & Échéance */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="space-y-1">
                            {item.status === 'PAID' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 size={11} />
                                <span>RÉGLÉ</span>
                              </span>
                            ) : item.isOverdue ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                                <AlertCircle size={11} />
                                <span>EN RETARD</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <Clock size={11} />
                                <span>À PAYER</span>
                              </span>
                            )}
                            <div className="text-[11px] text-slate-500 font-medium">
                              {item.dueDate ? (
                                <span>Échéance: {item.dueDate}</span>
                              ) : (
                                <span className="text-slate-400">Sans échéance fixée</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Fournisseur & N° Facture */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            <span>{item.vendor}</span>
                            {item.source === 'PURCHASE_ORDER' && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                Bon de Commande
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {item.invoiceNumber || 'Facture sans N°'}
                          </div>
                          {item.notes && (
                            <div className="text-[10px] text-slate-400 line-clamp-1 italic">
                              « {item.notes} »
                            </div>
                          )}
                        </td>

                        {/* Document / Facture attachée */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {item.invoiceUrl ? (
                            <div className="flex items-center gap-2">
                              {isPdfUrl(item.invoiceUrl) ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setActiveDocument({
                                      url: item.invoiceUrl!,
                                      title: `Facture ${item.vendor}`,
                                      subtitle: item.invoiceNumber ? `Réf: ${item.invoiceNumber}` : 'Document joint',
                                      orderNumber: item.invoiceNumber || 'FAC',
                                      supplierName: item.vendor,
                                      typeLabel: 'Facture PDF'
                                    })
                                  }
                                  className="px-2.5 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                                >
                                  <span className="w-5 h-5 rounded-md bg-rose-600 text-white text-[10px] font-black flex items-center justify-center">
                                    PDF
                                  </span>
                                  <span>Voir Facture</span>
                                  <Eye size={12} />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setActiveDocument({
                                      url: item.invoiceUrl!,
                                      title: `Facture ${item.vendor}`,
                                      subtitle: item.invoiceNumber ? `Réf: ${item.invoiceNumber}` : 'Scan Reçu',
                                      orderNumber: item.invoiceNumber || 'FAC',
                                      supplierName: item.vendor,
                                      typeLabel: 'Facture Image'
                                    })
                                  }
                                  className="flex items-center gap-2 p-1 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all cursor-pointer"
                                >
                                  <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-slate-200 shrink-0">
                                    <Image src={item.invoiceUrl} alt="Facture" fill className="object-cover" />
                                  </div>
                                  <div className="text-left pr-2">
                                    <div className="text-[11px] font-bold text-slate-800">Scan Facture</div>
                                    <div className="text-[9px] text-slate-400">Photo / Reçu</div>
                                  </div>
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Aucun document joint</span>
                          )}
                        </td>

                        {/* Montant TTC */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-extrabold text-sm text-slate-900 font-mono">
                            {formatMAD(item.amountMAD)}
                          </div>
                          {item.status === 'PAID' && item.paymentMethod && (
                            <div className="text-[10px] text-emerald-600">Réglé ({item.paymentMethod})</div>
                          )}
                        </td>

                        {/* Déposé par */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="text-[11px] font-bold text-slate-800">{item.creatorName}</div>
                          <div className="text-[10px] text-slate-400">{item.creatorRole}</div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {item.status === 'PENDING' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveBillToPay(item as any);
                                  setBillPayFormData({
                                    paymentMethod: 'VIREMENT',
                                    paidAt: new Date().toISOString().slice(0, 10),
                                    paymentVoucherUrl: '',
                                    notes: `Règlement facture ${item.invoiceNumber || item.vendor}`,
                                  });
                                  setIsBillPayModalOpen(true);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                              >
                                <CheckCircle2 size={13} />
                                <span>Régler</span>
                              </button>
                            )}

                            {item.source === 'EMPLOYEE_BILL' && (
                              <button
                                type="button"
                                onClick={() => handleDeleteBill(item.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Supprimer la facture"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 MODAL: DÉPOSER UNE FACTURE À PAYER (ACCÈS TOUS COLLABORATEURS) */}
      {isBillDepositModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
                  <Receipt size={12} />
                  <span>Dépôt Universel Facture à Payer</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  Déposer une Facture Fournisseur / Prestataire
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBillDepositModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleDepositBill} className="space-y-4">
              {/* Depositor Identity Banner */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center">
                    {(currentUser?.name || 'Admin').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-slate-500">Collaborateur : </span>
                    <strong className="text-slate-900">{currentUser?.name || 'Collaborateur NAY'}</strong>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 text-[10px] font-semibold">
                  {currentUser?.role || 'Équipe'}
                </span>
              </div>

              {/* 📂 DRAG & DROP DOCUMENT UPLOAD ZONE */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Document de la Facture (PDF, Photo, Scan) <span className="text-rose-500">*</span>
                </label>

                <input
                  type="file"
                  ref={billDropzoneRef}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUploadDocument(f, 'billInvoice');
                  }}
                  accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                />

                {billFormData.invoiceUrl ? (
                  <div className="p-4 rounded-2xl border-2 border-emerald-300 bg-emerald-50/50 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {isPdfUrl(billFormData.invoiceUrl) ? (
                        <div className="w-10 h-10 rounded-xl bg-rose-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                          PDF
                        </div>
                      ) : (
                        <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-slate-200 shrink-0">
                          <Image src={billFormData.invoiceUrl} alt="Preview" fill className="object-cover" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {getDocumentName(billFormData.invoiceUrl, 'Facture chargée')}
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
                            url: billFormData.invoiceUrl,
                            title: 'Prévisualisation de la Facture',
                            subtitle: billFormData.vendor || 'Document joint',
                            orderNumber: billFormData.invoiceNumber || 'FAC',
                            supplierName: billFormData.vendor || 'Fournisseur',
                            typeLabel: 'Facture'
                          })
                        }
                        className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer flex items-center gap-1"
                      >
                        <Eye size={13} />
                        <span>Voir</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => billDropzoneRef.current?.click()}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer"
                      >
                        Remplacer
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => billDropzoneRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const f = e.dataTransfer.files?.[0];
                      if (f) handleUploadDocument(f, 'billInvoice');
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
                    value={billFormData.vendor}
                    onChange={(e) => setBillFormData({ ...billFormData, vendor: e.target.value })}
                    placeholder="ex: Argeville, Cartonnerie Atlas, CTM..."
                    list="suppliers-list-tab"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-900 focus:outline-hidden transition-all"
                  />
                  <datalist id="suppliers-list-tab">
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.name} />
                    ))}
                    <option value="CTM Messagerie" />
                    <option value="Amana Express" />
                    <option value="Cartonnerie Casablanca" />
                    <option value="Imprimerie Offset Maroc" />
                  </datalist>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    N° Facture / Référence
                  </label>
                  <input
                    type="text"
                    value={billFormData.invoiceNumber}
                    onChange={(e) => setBillFormData({ ...billFormData, invoiceNumber: e.target.value })}
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
                      value={billFormData.amount}
                      onChange={(e) => setBillFormData({ ...billFormData, amount: e.target.value })}
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
                    value={billFormData.category}
                    onChange={(e) => setBillFormData({ ...billFormData, category: e.target.value })}
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
                    value={billFormData.invoiceDate}
                    onChange={(e) => setBillFormData({ ...billFormData, invoiceDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-900 focus:outline-hidden transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Date d'Échéance (À payer avant le)
                  </label>
                  <input
                    type="date"
                    value={billFormData.dueDate}
                    onChange={(e) => setBillFormData({ ...billFormData, dueDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-900 focus:outline-hidden transition-all font-semibold"
                  />
                </div>
              </div>

              {/* Remarques & Notes */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Commentaires / Notes pour la compta
                </label>
                <textarea
                  rows={2}
                  value={billFormData.notes}
                  onChange={(e) => setBillFormData({ ...billFormData, notes: e.target.value })}
                  placeholder="Détails sur la marchandise reçue ou modalité convenue..."
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-900 focus:outline-hidden transition-all"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsBillDepositModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isUploading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                  <span>Enregistrer & Déposer la Facture</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 💳 MODAL: VALIDER RÈGLEMENT FACTURE DANS ONGLET */}
      {isBillPayModalOpen && activeBillToPay && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                  <CreditCard size={12} />
                  <span>Validation du Règlement</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Marquer la Facture comme Réglée
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBillPayModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Fournisseur :</span>
                <strong className="text-xs text-slate-900">{activeBillToPay.vendor}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">N° Facture :</span>
                <span className="text-xs font-mono text-slate-700">{activeBillToPay.invoiceNumber || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <span className="text-xs font-bold text-slate-700">Montant Total à Régler :</span>
                <span className="text-base font-extrabold text-slate-900 font-mono">
                  {formatMAD(activeBillToPay.amountMAD)}
                </span>
              </div>
            </div>

            <form onSubmit={handleConfirmBillPayment} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Mode de Paiement <span className="text-rose-500">*</span>
                </label>
                <select
                  value={billPayFormData.paymentMethod}
                  onChange={(e) => setBillPayFormData({ ...billPayFormData, paymentMethod: e.target.value })}
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

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Date Effective du Paiement <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={billPayFormData.paidAt}
                  onChange={(e) => setBillPayFormData({ ...billPayFormData, paidAt: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-900 focus:outline-hidden transition-all font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Reçu de Virement / Justificatif Bancaire (Optionnel)
                </label>

                <input
                  type="file"
                  ref={billPaymentVoucherRef}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUploadDocument(f, 'billVoucher');
                  }}
                  accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                />

                {billPayFormData.paymentVoucherUrl ? (
                  <div className="p-3 rounded-xl border border-emerald-300 bg-emerald-50 flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                      <Check size={14} />
                      <span>Reçu de virement attaché</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => billPaymentVoucherRef.current?.click()}
                      className="text-xs text-emerald-700 underline font-semibold"
                    >
                      Changer
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => billPaymentVoucherRef.current?.click()}
                    disabled={isUploading}
                    className="w-full py-2.5 px-4 rounded-xl border border-dashed border-slate-300 hover:border-emerald-400 bg-slate-50 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Upload size={14} />
                    <span>{isUploading ? 'Téléchargement...' : 'Joindre le reçu de virement (PDF ou Photo)'}</span>
                  </button>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Notes de Règlement
                </label>
                <input
                  type="text"
                  value={billPayFormData.notes}
                  onChange={(e) => setBillPayFormData({ ...billPayFormData, notes: e.target.value })}
                  placeholder="N° d'ordre de virement ou observation..."
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-900 focus:outline-hidden transition-all"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsBillPayModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  <span>Confirmer le Règlement</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 🏢 TAB 2: ANNUAIRE DES FOURNISSEURS */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'suppliers' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher partenaire, ICE, ville, code..."
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => handleOpenSupplierModal()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Plus size={14} />
                <span>Nouveau Fournisseur</span>
              </button>
            </div>
          </div>

          {/* Suppliers Grid */}
          {filteredSuppliers.length === 0 ? (
            <div className="p-16 text-center text-slate-400 border border-dashed border-slate-200 rounded-3xl bg-white space-y-3">
              <Building2 size={44} className="mx-auto text-slate-300 mb-2" />
              <h3 className="text-base font-bold text-slate-800">Aucun fournisseur enregistré</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Votre annuaire est actuellement vierge. Ajoutez vos premiers partenaires (parfumeurs, laboratoires, verreries, packaging) pour démarrer vos approvisionnements.
              </p>
              <button
                type="button"
                onClick={() => handleOpenSupplierModal()}
                className="mt-4 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm transition-all inline-flex items-center gap-2"
              >
                <Plus size={14} />
                <span>+ Ajouter un Fournisseur</span>
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSuppliers.map(s => {
                const cleanPhone = (s.phone || '').replace(/[^0-9]/g, '');
                const waPhone = cleanPhone.startsWith('0') ? `212${cleanPhone.slice(1)}` : cleanPhone;
                const waMessage = encodeURIComponent(`Bonjour ${s.contactName || s.name}, nous vous contactons de la part de la Maison NAY Parfums concernant un réassort.`);

                return (
                  <div
                    key={s.id}
                    className="bg-white rounded-3xl border border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-xl transition-all duration-300 p-6 flex flex-col justify-between space-y-5"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 uppercase">
                          {s.code}
                        </span>
                        <span className="text-[10px] font-bold font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                          {s.category}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 line-clamp-1">{s.name}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin size={12} />
                        <span>{s.city || 'Casablanca'}</span>
                      </p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
                      {s.contactName && (
                        <div className="flex justify-between text-slate-700">
                          <span className="text-slate-400 text-[11px]">Contact :</span>
                          <span className="font-semibold">{s.contactName}</span>
                        </div>
                      )}
                      {s.phone && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 text-[11px]">Tél :</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-slate-800">{s.phone}</span>
                            <a
                              href={`https://wa.me/${waPhone}?text=${waMessage}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 rounded-md bg-emerald-500 text-white"
                            >
                              <MessageSquare size={12} />
                            </a>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleOpenOrderModal(s)}
                        className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Package size={13} />
                        <span>Commander</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveSupplierDossier(s)}
                        className="p-2 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                      >
                        <Eye size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 📊 TAB 3: COCKPIT SYNTHÈSE ACHATS */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'cockpit' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-6">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <PieChart size={18} className="text-indigo-600" />
            <span>Répartition des Dépenses d'Approvisionnement</span>
          </h3>

          <div className="space-y-4">
            {[
              { label: 'Parfums & Testeurs Prêts à la Vente', category: 'PARFUMS', color: 'bg-indigo-600', icon: Sparkles },
              { label: 'Concentrés & Huiles Essentielles (Grasse/Dubaï)', category: 'ESSENCES', color: 'bg-amber-500', icon: ShoppingBag },
              { label: 'Flaconnage Lourd, Cristallerie & Pompes 24k', category: 'FLACONS', color: 'bg-sky-500', icon: Building2 },
              { label: 'Packaging, Coffrets Aimantés & Dorure', category: 'PACKAGING', color: 'bg-emerald-500', icon: Package },
              { label: 'Logistique, Fret Aérien & Douanes', category: 'LOGISTIQUE', color: 'bg-purple-500', icon: Truck },
            ].map((item, idx) => {
              const categorySuppliers = suppliers.filter(s => s.category === item.category);
              const catSpend = categorySuppliers.reduce((sum, s) => sum + (s.totalSpendMAD || 0), 0);
              const percentage = kpis.totalSpend > 0 ? ((catSpend / kpis.totalSpend) * 100).toFixed(1) : '0';

              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 flex items-center gap-2">
                      <item.icon size={14} className="text-slate-500" />
                      <span>{item.label}</span>
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-slate-900">{formatMAD(catSpend)}</span>
                      <span className="text-slate-400 font-mono text-[11px] w-12 text-right">{percentage}%</span>
                    </div>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.max(5, Number(percentage))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 💰 TAB 4: SIMULATEUR COGS & MARGES */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'cogs' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Scale size={20} className="text-amber-500" />
              <span>Simulateur de Coût de Revient Unitaire & Marge Brute (COGS)</span>
            </h2>

            <div className="grid sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between font-bold">
                  <span>1. Concentré & Jus</span>
                  <span className="font-mono text-indigo-600">{cogsJusCost} MAD</span>
                </div>
                <input type="range" min="10" max="200" value={cogsJusCost} onChange={e => setCogsJusCost(Number(e.target.value))} className="w-full accent-indigo-600" />
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between font-bold">
                  <span>2. Flacon & Pompe 24k</span>
                  <span className="font-mono text-indigo-600">{cogsBottleCost} MAD</span>
                </div>
                <input type="range" min="5" max="80" value={cogsBottleCost} onChange={e => setCogsBottleCost(Number(e.target.value))} className="w-full accent-indigo-600" />
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between font-bold">
                  <span>3. Coffret Aimanté</span>
                  <span className="font-mono text-indigo-600">{cogsPackagingCost} MAD</span>
                </div>
                <input type="range" min="5" max="100" value={cogsPackagingCost} onChange={e => setCogsPackagingCost(Number(e.target.value))} className="w-full accent-indigo-600" />
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200 space-y-2">
                <div className="flex justify-between font-bold text-indigo-950">
                  <span>Prix Public de Vente</span>
                  <span className="font-mono text-indigo-700 text-sm">{cogsRetailPrice} MAD</span>
                </div>
                <input type="range" min="100" max="1500" step="10" value={cogsRetailPrice} onChange={e => setCogsRetailPrice(Number(e.target.value))} className="w-full accent-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col justify-between space-y-6">
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-400">Rentabilité NAY</span>
              <h3 className="text-xl font-bold mt-1">Marge Brute Estimée</h3>
            </div>
            <div className="text-3xl font-extrabold text-emerald-400 font-mono">
              +{formatMAD(Math.max(0, cogsRetailPrice - (cogsJusCost + cogsBottleCost + cogsPackagingCost + cogsLaborCost + cogsLogisticsCost)))}
            </div>
            <p className="text-xs text-slate-400">
              Coût total unitaire : {formatMAD(cogsJusCost + cogsBottleCost + cogsPackagingCost + cogsLaborCost + cogsLogisticsCost)}
            </p>
          </div>
        </div>
      )}

      {/* 🖨️ PRINTABLE PURCHASE ORDER MODAL */}
      {activeOrderToPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-8 space-y-6 text-slate-900 print:p-0">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 print:hidden">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                {activeOrderToPrint.orderNumber}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer size={14} />
                  <span>Imprimer Bon</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveOrderToPrint(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-6">
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-950">MAISON NAY PARFUMS</h2>
                  <p className="text-xs text-slate-500">Haute Parfumerie • Casablanca, Maroc</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold font-mono">{activeOrderToPrint.orderNumber}</div>
                  <div className="text-xs text-slate-400">{formatDateGMT(activeOrderToPrint.createdAt)}</div>
                </div>
              </div>

              <div className="text-xs space-y-2">
                <div className="font-bold">Articles du Bon de Commande :</div>
                {(() => {
                  let items = [];
                  try {
                    items = typeof activeOrderToPrint.items === 'string' ? JSON.parse(activeOrderToPrint.items) : activeOrderToPrint.items;
                  } catch {}
                  return items.map((it: any, idx: number) => (
                    <div key={idx} className="flex justify-between py-1 border-b border-slate-100">
                      <span>• {it.name}</span>
                      <span className="font-mono font-bold">Quantité : {it.quantity} unités</span>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 🏢 MODAL: AJOUTER / MODIFIER UN FOURNISSEUR */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingSupplier ? 'Modifier le Partenaire Fournisseur' : 'Nouveau Partenaire Fournisseur'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingSupplier ? `Mise à jour de la fiche : ${editingSupplier.name}` : 'Enregistrez un nouveau fournisseur dans votre annuaire stratégique.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSupplierModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="space-y-6 text-xs">
              {/* Section 1: Identité */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                  <Sparkles size={14} className="text-amber-500" />
                  <span>1. Identité & Classification Métier</span>
                </h4>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                      Nom / Raison Sociale du Partenaire *
                    </label>
                    <input
                      type="text"
                      required
                      value={supplierFormData.name || ''}
                      onChange={e => setSupplierFormData({ ...supplierFormData, name: e.target.value })}
                      placeholder="ex: Laboratoires Robertet Grasse, Verrerie Saverglass..."
                      className="w-full font-bold bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                      Code Référence Fournisseur
                    </label>
                    <input
                      type="text"
                      value={supplierFormData.code || ''}
                      onChange={e => setSupplierFormData({ ...supplierFormData, code: e.target.value.toUpperCase() })}
                      placeholder="FRN-001 (auto si vide)"
                      className="w-full font-mono uppercase bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                      Catégorie Métier *
                    </label>
                    <select
                      value={supplierFormData.category || 'PARFUMS'}
                      onChange={e => setSupplierFormData({ ...supplierFormData, category: e.target.value })}
                      className="w-full font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="PARFUMS">Parfums & Testeurs Prêts à la Vente</option>
                      <option value="ESSENCES">Concentrés & Huiles Essentielles (Grasse/Dubaï)</option>
                      <option value="FLACONS">Flaconnage Lourd, Cristallerie & Pompes</option>
                      <option value="PACKAGING">Packaging, Coffrets Aimantés & Dorure</option>
                      <option value="LOGISTIQUE">Logistique, Fret Aérien & Douanes</option>
                      <option value="AUTRE">Autre Fourniture / Prestation</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                      Niveau / Tier Stratégique
                    </label>
                    <select
                      value={supplierFormData.tier || 'TIER_1'}
                      onChange={e => setSupplierFormData({ ...supplierFormData, tier: e.target.value })}
                      className="w-full font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="TIER_1">Tier 1 - Partenaire Stratégique Clé</option>
                      <option value="TIER_2">Tier 2 - Fournisseur Régulier Agréé</option>
                      <option value="TIER_3">Tier 3 - Fournisseur Ponctuel</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                      Statut Partenaire
                    </label>
                    <select
                      value={supplierFormData.status || 'ACTIVE'}
                      onChange={e => setSupplierFormData({ ...supplierFormData, status: e.target.value })}
                      className="w-full font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="ACTIVE">Actif (Opérationnel)</option>
                      <option value="VIP">Partenaire VIP Privilégié</option>
                      <option value="PENDING">En cours d'homologation</option>
                      <option value="INACTIVE">Inactif / Suspendu</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Contact & Localisation */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                  <Phone size={14} className="text-indigo-600" />
                  <span>2. Contact & Coordonnées</span>
                </h4>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                      Nom de l'Interlocuteur / Contact
                    </label>
                    <input
                      type="text"
                      value={supplierFormData.contactName || ''}
                      onChange={e => setSupplierFormData({ ...supplierFormData, contactName: e.target.value })}
                      placeholder="ex: M. Karim Bennis"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                      Téléphone / WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={supplierFormData.phone || ''}
                      onChange={e => setSupplierFormData({ ...supplierFormData, phone: e.target.value })}
                      placeholder="06 61 XX XX XX ou +212..."
                      className="w-full font-mono bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                      Email Professionnel
                    </label>
                    <input
                      type="email"
                      value={supplierFormData.email || ''}
                      onChange={e => setSupplierFormData({ ...supplierFormData, email: e.target.value })}
                      placeholder="contact@fournisseur.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                      Ville
                    </label>
                    <input
                      type="text"
                      value={supplierFormData.city || ''}
                      onChange={e => setSupplierFormData({ ...supplierFormData, city: e.target.value })}
                      placeholder="Casablanca, Tanger, Grasse, Dubaï..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                      Adresse Physique / Entrepôt
                    </label>
                    <input
                      type="text"
                      value={supplierFormData.address || ''}
                      onChange={e => setSupplierFormData({ ...supplierFormData, address: e.target.value })}
                      placeholder="Zone Industrielle Sidi Maârouf, Casablanca"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Financier & Modalités */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                  <CreditCard size={14} className="text-emerald-600" />
                  <span>3. Légal & Conditions Commerciales</span>
                </h4>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                      ICE / Identifiant Fiscal / RC
                    </label>
                    <input
                      type="text"
                      value={supplierFormData.taxId || ''}
                      onChange={e => setSupplierFormData({ ...supplierFormData, taxId: e.target.value })}
                      placeholder="002345678000045"
                      className="w-full font-mono bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                      Conditions de Règlement
                    </label>
                    <select
                      value={supplierFormData.paymentTerms || 'A_LA_LIVRAISON'}
                      onChange={e => setSupplierFormData({ ...supplierFormData, paymentTerms: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="A_LA_LIVRAISON">Paiement à la livraison</option>
                      <option value="30_JOURS">Paiement à 30 jours (Fin de mois)</option>
                      <option value="50_AVANCE">50% à la commande / 50% à la réception</option>
                      <option value="COMPTANT">Paiement comptant (Espèces / Chèque)</option>
                      <option value="VIREMENT">Virement bancaire avant expédition</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                      Délai Moyen de Livraison (Jours)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={supplierFormData.leadTimeDays || 3}
                      onChange={e => setSupplierFormData({ ...supplierFormData, leadTimeDays: Number(e.target.value) })}
                      className="w-full font-mono bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                      Minimum de Commande (MAD)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={supplierFormData.minOrderValueMAD || 0}
                      onChange={e => setSupplierFormData({ ...supplierFormData, minOrderValueMAD: Number(e.target.value) })}
                      className="w-full font-mono bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                      Banque Partenaire
                    </label>
                    <input
                      type="text"
                      value={supplierFormData.bankName || ''}
                      onChange={e => setSupplierFormData({ ...supplierFormData, bankName: e.target.value })}
                      placeholder="Attijariwafa Bank, CIH, BOA..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                      RIB Bancaire (24 chiffres)
                    </label>
                    <input
                      type="text"
                      value={supplierFormData.bankRib || ''}
                      onChange={e => setSupplierFormData({ ...supplierFormData, bankRib: e.target.value })}
                      placeholder="007 780 0001234567890123 45"
                      className="w-full font-mono bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Notes */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  Notes & Observations Internes
                </label>
                <textarea
                  rows={3}
                  value={supplierFormData.notes || ''}
                  onChange={e => setSupplierFormData({ ...supplierFormData, notes: e.target.value })}
                  placeholder="Informations sur la qualité des flacons, consignes de déchargement, remises accordées..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                  <span>{editingSupplier ? 'Mettre à jour le Fournisseur' : 'Enregistrer le Fournisseur'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 📂 MODAL: DOSSIER COMPLET DU FOURNISSEUR */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeSupplierDossier && (() => {
        const cleanPhone = (activeSupplierDossier.phone || '').replace(/[^0-9]/g, '');
        const waPhone = cleanPhone.startsWith('0') ? `212${cleanPhone.slice(1)}` : cleanPhone;
        const waMessage = encodeURIComponent(`Bonjour ${activeSupplierDossier.contactName || activeSupplierDossier.name}, nous vous contactons de la part de la Maison NAY Parfums.`);
        const supplierOrders = purchaseOrders.filter(p => p.supplierId === activeSupplierDossier.id);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6 text-slate-900">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase">
                      {activeSupplierDossier.code}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {activeSupplierDossier.category}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                      {activeSupplierDossier.tier}
                    </span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-950">{activeSupplierDossier.name}</h2>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin size={13} className="text-slate-400" />
                    <span>{activeSupplierDossier.address || activeSupplierDossier.city || 'Maroc'}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const s = activeSupplierDossier;
                      setActiveSupplierDossier(null);
                      handleOpenSupplierModal(s);
                    }}
                    className="p-2 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                    title="Modifier"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteSupplier(activeSupplierDossier.id)}
                    className="p-2 rounded-xl text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 cursor-pointer"
                    title="Supprimer"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSupplierDossier(null)}
                    className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Direct Actions Bar */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const s = activeSupplierDossier;
                    setActiveSupplierDossier(null);
                    handleOpenOrderModal(s);
                  }}
                  className="flex-1 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <Package size={15} />
                  <span>+ Émettre un Bon de Commande</span>
                </button>

                {activeSupplierDossier.phone && (
                  <a
                    href={`https://wa.me/${waPhone}?text=${waMessage}`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold text-xs flex items-center gap-2 shadow-sm"
                  >
                    <MessageSquare size={15} />
                    <span>WhatsApp</span>
                  </a>
                )}

                {activeSupplierDossier.phone && (
                  <a
                    href={`tel:${activeSupplierDossier.phone}`}
                    className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-bold text-xs flex items-center gap-2"
                  >
                    <Phone size={15} />
                    <span>Appeler</span>
                  </a>
                )}
              </div>

              {/* Details Bento Grid */}
              <div className="grid sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                  <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Coordonnées de Contact</div>
                  <div className="space-y-1 text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Contact :</span>
                      <span className="font-semibold text-slate-900">{activeSupplierDossier.contactName || 'Non spécifié'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Téléphone :</span>
                      <span className="font-mono font-semibold text-slate-900">{activeSupplierDossier.phone || 'Non spécifié'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Email :</span>
                      <span className="font-semibold text-slate-900">{activeSupplierDossier.email || 'Non spécifié'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Ville :</span>
                      <span className="font-semibold text-slate-900">{activeSupplierDossier.city || 'Casablanca'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                  <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Données Commerciales & Légal</div>
                  <div className="space-y-1 text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400">ICE / Tax ID :</span>
                      <span className="font-mono font-semibold text-slate-900">{activeSupplierDossier.taxId || 'Non renseigné'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Règlement :</span>
                      <span className="font-semibold text-slate-900">{activeSupplierDossier.paymentTerms || 'À la livraison'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Délai moyen :</span>
                      <span className="font-semibold text-slate-900">{activeSupplierDossier.leadTimeDays || 3} jours</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Min. Commande :</span>
                      <span className="font-mono font-semibold text-slate-900">{formatMAD(activeSupplierDossier.minOrderValueMAD || 0)}</span>
                    </div>
                  </div>
                </div>

                {(activeSupplierDossier.bankName || activeSupplierDossier.bankRib) && (
                  <div className="sm:col-span-2 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 space-y-1 text-xs">
                    <div className="font-bold text-indigo-950 uppercase tracking-wider text-[11px]">Coordonnées Bancaires (RIB)</div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-indigo-900 gap-1">
                      <span>Banque : <strong>{activeSupplierDossier.bankName || 'Banque'}</strong></span>
                      <span className="font-mono font-bold bg-white px-2.5 py-1 rounded-lg border border-indigo-200">
                        {activeSupplierDossier.bankRib}
                      </span>
                    </div>
                  </div>
                )}

                {activeSupplierDossier.notes && (
                  <div className="sm:col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1 text-xs">
                    <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Notes Internes</div>
                    <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{activeSupplierDossier.notes}</p>
                  </div>
                )}
              </div>

              {/* Purchase Orders History */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                  <span>Historique des Bons de Commande ({supplierOrders.length})</span>
                </h4>

                {supplierOrders.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                    Aucun bon de commande n'a encore été émis pour ce partenaire.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {supplierOrders.map(po => (
                      <div key={po.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs">
                        <div>
                          <span className="font-mono font-bold text-slate-900">{po.orderNumber}</span>
                          <span className="text-[10px] text-slate-400 ml-2">{formatDateGMT(po.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-slate-900">{formatMAD(po.chargeAmountMAD || po.totalAmount || 0)}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            po.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {po.paymentStatus === 'PAID' ? 'Payé' : 'Non Payé'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
