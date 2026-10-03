'use client';

import React, { useState, useMemo, useRef } from 'react';
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
  Image as ImageIcon, ZoomIn, CreditCard, Wallet
} from 'lucide-react';
import { formatDateGMT, formatTimeGMT } from '@/lib/dateUtils';

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
  dbProducts = []
}: {
  initialSuppliers: SupplierItem[];
  initialPurchaseOrders: PurchaseOrderItem[];
  dbProducts: any[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [suppliers, setSuppliers] = useState<SupplierItem[]>(initialSuppliers);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderItem[]>(initialPurchaseOrders);

  // Tabs
  const [activeTab, setActiveTab] = useState<'orders' | 'suppliers' | 'cockpit' | 'cogs'>('orders');

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedTier, setSelectedTier] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'UNPAID' | 'PAID' | 'PARTIAL'>('ALL');

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
    receiptUrl: '',
    notes: ''
  });

  // Photo / Receipt Lightbox Modal
  const [activeReceiptPhoto, setActiveReceiptPhoto] = useState<{ url: string; orderNumber: string; supplierName: string } | null>(null);

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
    receiptUrl: ''
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
      return matchSearch && matchPayment;
    });
  }, [purchaseOrders, search, paymentFilter]);

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

    const lowStockAlerts = dbProducts.filter((p: any) => (p.stock || 0) <= 5);

    return {
      totalSuppliers,
      totalOrders,
      totalSpend,
      unpaidCount: unpaidOrders.length,
      totalUnpaidMAD,
      paidCount: paidOrders.length,
      totalPaidMAD,
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
      receiptUrl: ''
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
          receiptUrl: orderMeta.receiptUrl || null,
          status: 'PENDING',
          paymentStatus: 'UNPAID',
          totalAmount: 0,
          chargeAmountMAD: 0
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

  // Handle Receipt Upload via /api/admin/upload
  const handleUploadReceiptFile = async (e: React.ChangeEvent<HTMLInputElement>, targetMode: 'create' | 'manage') => {
    const file = e.target.files?.[0];
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
        if (targetMode === 'create') {
          setOrderMeta(prev => ({ ...prev, receiptUrl: data.url }));
        } else {
          setChargeFormData(prev => ({ ...prev, receiptUrl: data.url }));
        }
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Erreur lors du téléchargement de la photo');
    } finally {
      setIsUploading(false);
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
              Sélectionnez vos parfums en un clic pour créer vos bons de commande, suivez les charges réelles facturées, gérez les statuts de paiement et rattachez vos photos de reçus & factures.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => handleOpenOrderModal()}
              className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-amber-500/25 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Package size={16} />
              <span>+ Nouveau Bon de Commande (Sélection Rapide)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingSupplier(null);
                setIsSupplierModalOpen(true);
              }}
              className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold backdrop-blur-md border border-white/15 transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Building2 size={15} />
              <span>Ajouter Fournisseur</span>
            </button>
          </div>
        </div>
      </div>

      {/* 📊 EXECUTIVE BENTO KPI METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Charges Fournisseurs */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Charges Facturées (Total)</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
              <Banknote size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
              {formatMAD(kpis.totalSpend)}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">
              Sur {kpis.totalOrders} bons de commande
            </div>
          </div>
        </div>

        {/* Total Payé */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Charges Payées</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-mono">
              {formatMAD(kpis.totalPaidMAD)}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1">
              {kpis.paidCount} factures réglées avec reçus
            </div>
          </div>
        </div>

        {/* Total Non Payé / En attente */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Soldes Non Payés (À Régler)</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center">
              <AlertCircle size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 font-mono">
              {formatMAD(kpis.totalUnpaidMAD)}
            </div>
            <div className="text-[11px] text-rose-600 font-semibold mt-1">
              {kpis.unpaidCount} bons en attente de paiement
            </div>
          </div>
        </div>

        {/* Partenaires & Stock */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Partenaires Référencés</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
              <Building2 size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {kpis.totalSuppliers}
            </div>
            <div className="text-[11px] text-indigo-600 font-semibold mt-1">
              Maroc, Grasse & Dubaï
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

            {/* Payment Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
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
                    <th className="px-5 py-3.5">Fournisseur</th>
                    <th className="px-5 py-3.5">Articles Commandés</th>
                    <th className="px-5 py-3.5">Charge Fournisseur (MAD)</th>
                    <th className="px-5 py-3.5">Statut de Paiement</th>
                    <th className="px-5 py-3.5">Photo / Reçu</th>
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

                        {/* Charge Fournisseur (MAD) */}
                        <td className="px-5 py-4">
                          {charge > 0 ? (
                            <div>
                              <div className="font-mono font-bold text-slate-900 text-sm">{formatMAD(charge)}</div>
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

                        {/* Reçu / Photo Lightbox */}
                        <td className="px-5 py-4">
                          {po.receiptUrl ? (
                            <div className="flex items-center gap-2">
                              <div
                                onClick={() => setActiveReceiptPhoto({ url: po.receiptUrl!, orderNumber: po.orderNumber, supplierName: po.supplier?.name || '' })}
                                className="w-9 h-9 rounded-xl border border-slate-200 overflow-hidden relative group cursor-pointer shadow-xs hover:border-indigo-500 transition-all"
                                title="Cliquer pour agrandir la photo du reçu"
                              >
                                <Image src={po.receiptUrl} alt="Reçu" fill className="object-cover" />
                                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                  <ZoomIn size={14} />
                                </div>
                              </div>
                              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                Reçu joint
                              </span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenChargeModal(po)}
                              className="text-[10px] text-slate-500 hover:text-indigo-600 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Upload size={11} />
                              <span>+ Ajouter photo</span>
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
                              title="Gérer la charge & paiement"
                            >
                              <Banknote size={13} />
                              <span>Règlement</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setActiveOrderToPrint(po)}
                              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                              title="Imprimer / Visualiser le Bon de Commande"
                            >
                              <Printer size={14} />
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

              {/* Info Note: No Price constraint */}
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-2.5 text-amber-900">
                <AlertCircle size={18} className="text-amber-600 shrink-0" />
                <span className="text-[11px] leading-relaxed">
                  <strong>Bon de commande initial :</strong> Vous n'avez pas besoin d'indiquer de prix estimé maintenant. La charge réelle sera consignée lors de la réception de la facture fournisseur avec photo du reçu.
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
                <h3 className="text-lg font-bold text-slate-900">Enregistrer la Charge & le Règlement</h3>
                <p className="text-xs text-slate-500">Saisissez le montant facturé par le fournisseur, le statut de paiement et joignez le reçu / justificatif.</p>
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

              {/* 📷 RECEIPT / INVOICE PHOTO UPLOAD & PREVIEW */}
              <div className="space-y-2 p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
                    <ImageIcon size={15} className="text-indigo-600" />
                    <span>Photo du Reçu / Facture / Bon de Livraison</span>
                  </label>
                  {chargeFormData.receiptUrl && (
                    <button
                      type="button"
                      onClick={() => setChargeFormData({ ...chargeFormData, receiptUrl: '' })}
                      className="text-[10px] font-bold text-rose-600 hover:underline"
                    >
                      Supprimer la photo
                    </button>
                  )}
                </div>

                {chargeFormData.receiptUrl ? (
                  <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-indigo-200">
                    <div className="w-16 h-16 rounded-lg relative overflow-hidden border border-slate-200 shrink-0">
                      <Image src={chargeFormData.receiptUrl} alt="Reçu" fill className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 truncate">Photo du reçu enregistrée</div>
                      <div className="text-[10px] text-slate-400 truncate">{chargeFormData.receiptUrl}</div>
                      <button
                        type="button"
                        onClick={() => setActiveReceiptPhoto({ url: chargeFormData.receiptUrl, orderNumber: managingChargePo.orderNumber, supplierName: managingChargePo.supplier?.name || '' })}
                        className="text-[11px] font-bold text-indigo-600 hover:underline mt-1 flex items-center gap-1"
                      >
                        <ZoomIn size={12} />
                        <span>Agrandir la photo</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={e => handleUploadReceiptFile(e, 'manage')}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                    >
                      {isUploading ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
                      <span>Télécharger photo depuis l'appareil</span>
                    </button>
                    <span className="text-slate-400 text-[11px]">ou</span>
                    <input
                      type="text"
                      placeholder="Coller l'URL de l'image du reçu..."
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
                    placeholder="Chèque émis le 03/10..."
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
                  <span>Enregistrer le Règlement</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 🔍 MODAL LIGHTBOX: PHOTO AGRANDIE DU REÇU / FACTURE */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeReceiptPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="font-mono text-xs font-bold text-slate-900">{activeReceiptPhoto.orderNumber}</div>
                <div className="text-[11px] text-slate-500 font-semibold">{activeReceiptPhoto.supplierName} • Justificatif de Paiement</div>
              </div>
              <button
                type="button"
                onClick={() => setActiveReceiptPhoto(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="relative w-full h-[65vh] bg-slate-950 flex items-center justify-center p-2">
              <Image
                src={activeReceiptPhoto.url}
                alt="Reçu"
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 800px"
              />
            </div>

            <div className="p-4 bg-slate-50 flex items-center justify-between text-xs">
              <span className="text-slate-500 text-[11px]">Photo originale du reçu / bordereau</span>
              <a
                href={activeReceiptPhoto.url}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold flex items-center gap-1.5"
              >
                <ExternalLink size={13} />
                <span>Ouvrir en plein écran</span>
              </a>
            </div>
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
                onClick={() => {
                  setEditingSupplier(null);
                  setIsSupplierModalOpen(true);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Plus size={14} />
                <span>Nouveau Fournisseur</span>
              </button>
            </div>
          </div>

          {/* Suppliers Grid */}
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
    </div>
  );
}
