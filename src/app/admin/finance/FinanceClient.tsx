'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';
import {
  TrendingUp, TrendingDown, Package, Plus, Trash2, X,
  Banknote, AlertCircle, CheckCircle2, Search, CreditCard,
  PieChart as PieIcon, ExternalLink, Calendar, RefreshCw,
  UploadCloud, FileText, Image as ImageIcon, Paperclip, Eye,
  ShieldCheck, ArrowUpRight, Filter, Calculator, Sparkles,
  Sliders, Download, Printer, Target, Flame, Layers, Award,
  DollarSign, ShoppingBag, Users, HelpCircle,
  Check, Clock, AlertTriangle, FileSpreadsheet, Building2, User,
  ChevronDown, ZoomIn, Receipt, Edit3, Tag, ArrowRight
} from 'lucide-react';
import { formatMAD } from '@/lib/products';
import {
  BillMetadata,
  parseBillMetadata,
  encodeBillDescription,
  checkIsOverdue,
  getDaysRemaining,
} from '@/lib/billsHelper';

type OrderData = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  shippingCity: string;
  total: number;
  status: string;
  createdAt: string;
  shippingCost: number;
  discount: number | null;
  items: string;
};

type VisitorData = {
  id: string;
  createdAt: string;
};

export type ExpenseData = {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  description?: string | null;
  receiptUrl?: string | null;
  paymentMethod: string;
  recurring: string;
  creator?: {
    id: string;
    name: string;
    avatar?: string | null;
  } | null;
};

export interface EnrichedExpense {
  id: string;
  title: string;
  vendor: string;
  invoiceNumber: string;
  category: string;
  amount: number;
  date: string;
  dueDate: string | null;
  status: 'PAID' | 'PENDING' | 'OVERDUE' | 'CANCELLED';
  paidAt: string | null;
  paidBy: string;
  payerRole: string;
  paymentMethod: string;
  recurring: string;
  cleanNotes: string;
  receiptUrl: string | null;
  isOverdue: boolean;
  daysRemaining: number | null;
  creator?: {
    id: string;
    name: string;
    avatar?: string | null;
  } | null;
  raw: ExpenseData;
}

export type EmployeeData = {
  id: string;
  name: string;
  role: string;
  jobTitle?: string | null;
  salary?: number | null;
  salaryType?: string | null;
};

export type AffiliateData = {
  id: string;
  name: string;
  code: string;
  visits: number;
  sales: number;
  revenueGenerated: number;
  commissionEarned: number;
  commissionPaid: number;
};

type FinanceClientProps = {
  orders: OrderData[];
  visitors: VisitorData[];
  viewsBySlug: Record<string, { total: number; dates: string[] }>;
  products: {
    id: number;
    slug: string;
    name: string;
    brandLabel: string;
    price: number;
    testerPrice?: number | null;
    originalPrice?: number | null;
    images: string;
    sku: string | null;
    isTester?: boolean;
    subcategory?: string;
    subcategoryLabel?: string;
    inStock?: boolean;
    stock?: number | null;
  }[];
  initialExpenses: ExpenseData[];
  employees: EmployeeData[];
  affiliates?: AffiliateData[];
  customersCount?: number;
  initialGoal?: number;
  currentUser?: {
    id: string;
    name: string;
    email?: string;
    role: string;
    avatar?: string | null;
  };
};

export const PAYMENT_METHOD_OPTIONS = [
  { id: 'CREDIT_CARD', label: 'Carte Bancaire CIH NAY' },
  { id: 'BANK_TRANSFER', label: 'Virement Bancaire Société' },
  { id: 'CASH', label: 'Espèces (Caisse Boutique)' },
  { id: 'AUTO_DEBIT', label: 'Prélèvement Automatique' },
  { id: 'CHECK', label: 'Chèque Bancaire' },
  { id: 'OTHER', label: 'Autre mode de règlement' },
];

export const QUICK_VENDOR_SUGGESTIONS = [
  'Hostinger Web & Mail',
  'Google Workspace',
  'Meta Ads (Facebook/Insta)',
  'TikTok Ads Manager',
  'Cartonnerie Casablanca',
  'Cathedis Express',
  'Amana Poste Maroc',
  'Vercel Cloud',
  'CIH Bank',
  'Fournisseur Parfums',
];

export const EXPENSE_STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; dot: string }> = {
  PAID: {
    label: 'Réglée / Payée',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  PENDING: {
    label: 'À Payer (En attente)',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  OVERDUE: {
    label: 'En Retard (Échue)',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
  },
  CANCELLED: {
    label: 'Annulée / Rejetée',
    bg: 'bg-neutral-100',
    text: 'text-neutral-600',
    border: 'border-neutral-200',
    dot: 'bg-neutral-400',
  },
};

export function extractVendorFromTitle(title: string): string {
  const lower = (title || '').toLowerCase();
  if (lower.includes('mail') || lower.includes('hostinger') || lower.includes('domain')) return 'Hostinger / Web Mail';
  if (lower.includes('tiktok')) return 'TikTok Ads';
  if (lower.includes('meta') || lower.includes('facebook') || lower.includes('instagram')) return 'Meta Ads';
  if (lower.includes('google')) return 'Google Workspace / Ads';
  if (lower.includes('carton') || lower.includes('pochon') || lower.includes('packaging')) return 'Cartonnerie & Packaging';
  if (lower.includes('amana') || lower.includes('cathedis') || lower.includes('speedaf') || lower.includes('livraison')) return 'Transporteur Express';
  if (lower.includes('salaire') || lower.includes('prime') || lower.includes('équipe')) return 'Équipe NAY';
  if (lower.includes('vercel')) return 'Vercel Cloud';
  if (lower.includes('shopify')) return 'Shopify SaaS';
  if (lower.includes('cih') || lower.includes('banque')) return 'CIH Bank';
  const firstWords = (title || '').split(' ').slice(0, 2).join(' ');
  return firstWords || 'Prestataire NAY';
}

export function enrichExpense(exp: ExpenseData): EnrichedExpense {
  const meta = parseBillMetadata(exp.description);

  if (meta) {
    const isOverdue = checkIsOverdue(meta.dueDate, meta.status);
    const computedStatus: 'PAID' | 'PENDING' | 'OVERDUE' | 'CANCELLED' =
      meta.status === 'CANCELLED'
        ? 'CANCELLED'
        : meta.status === 'PAID'
        ? 'PAID'
        : isOverdue
        ? 'OVERDUE'
        : 'PENDING';

    const daysRemaining = getDaysRemaining(meta.dueDate);

    let cleanNotes = '';
    if (exp.description) {
      const closingIdx = exp.description.indexOf(']');
      if (closingIdx !== -1) {
        cleanNotes = exp.description.substring(closingIdx + 1).trim();
      } else {
        cleanNotes = exp.description;
      }
    }

    return {
      id: exp.id,
      title: exp.title,
      vendor: meta.vendor || extractVendorFromTitle(exp.title),
      invoiceNumber: meta.invoiceNumber || `FAC-${exp.id.slice(-5).toUpperCase()}`,
      category: exp.category || 'OTHER',
      amount: Number(exp.amount) || 0,
      date: exp.date,
      dueDate: meta.dueDate || null,
      status: computedStatus,
      paidAt: meta.paidAt || (meta.status === 'PAID' ? exp.date : null),
      paidBy: meta.paidBy || exp.creator?.name || 'Ayoub Ait Yahya',
      payerRole: meta.creatorRole || 'Propriétaire NAY',
      paymentMethod: meta.paymentMethod || exp.paymentMethod || 'CREDIT_CARD',
      recurring: exp.recurring || 'ONE_TIME',
      cleanNotes: meta.notes || cleanNotes,
      receiptUrl: exp.receiptUrl || meta.paymentVoucherUrl || null,
      isOverdue,
      daysRemaining,
      creator: exp.creator,
      raw: exp,
    };
  }

  const inferredVendor = extractVendorFromTitle(exp.title);
  const inferredInvNum = `FAC-${exp.id.slice(-5).toUpperCase()}`;

  return {
    id: exp.id,
    title: exp.title,
    vendor: inferredVendor,
    invoiceNumber: inferredInvNum,
    category: exp.category || 'OTHER',
    amount: Number(exp.amount) || 0,
    date: exp.date,
    dueDate: null,
    status: 'PAID',
    paidAt: exp.date,
    paidBy: exp.creator?.name || 'Ayoub Ait Yahya',
    payerRole: 'Propriétaire NAY',
    paymentMethod: exp.paymentMethod || 'CREDIT_CARD',
    recurring: exp.recurring || 'ONE_TIME',
    cleanNotes: exp.description || '',
    receiptUrl: exp.receiptUrl || null,
    isOverdue: false,
    daysRemaining: null,
    creator: exp.creator,
    raw: exp,
  };
}

const EXPENSE_CATEGORIES = [
  { id: 'ADS', label: 'Publicité & Ads (TikTok, Meta, Google)', color: '#f43f5e' },
  { id: 'SUPPLIES', label: 'Achats Stock & Fournisseurs', color: '#06b6d4' },
  { id: 'HOSTING', label: 'Hébergement, Web & Domaine', color: '#38bdf8' },
  { id: 'SALARY', label: 'Salaires & Rémunérations Équipe', color: '#f59e0b' },
  { id: 'PACKAGING', label: 'Flacons, Packaging & Coffrets', color: '#10b981' },
  { id: 'LOGISTICS', label: 'Logistique & Transporteurs (Amana...)', color: '#8b5cf6' },
  { id: 'TOOLS', label: 'Logiciels, IA & Abonnements SaaS', color: '#ec4899' },
  { id: 'OFFICE', label: 'Fournitures, Matériel & Bureautique', color: '#64748b' },
  { id: 'OTHER', label: 'Autres Charges Diverses', color: '#a855f7' },
];

const GOAL_PRESETS = [
  { value: 50000, label: '50.000 MAD', tag: 'Démarrage', desc: 'Phase de lancement & validation' },
  { value: 100000, label: '100.000 MAD', tag: 'Croissance', desc: 'Consolidation & expansion continue' },
  { value: 150000, label: '150.000 MAD', tag: 'Standard NAY', desc: 'Objectif régulier Maison NAY' },
  { value: 250000, label: '250.000 MAD', tag: 'Performance', desc: 'Campagnes intensives & scaling' },
  { value: 500000, label: '500.000 MAD', tag: 'Expansion', desc: 'Leader Beauté & Parfums Maroc' },
  { value: 1000000, label: '1.000.000 MAD', tag: 'Club 7 Chiffres', desc: 'Vision 1 Million MAD / mois' },
];

const PAYMENT_METHODS = [
  { id: 'CREDIT_CARD', label: 'Carte Bancaire / CMI' },
  { id: 'BANK_TRANSFER', label: 'Virement Bancaire' },
  { id: 'CASH', label: 'Espèces / Cash' },
  { id: 'CHECK', label: 'Chèque Bancaire' },
  { id: 'OTHER', label: 'Autre mode de paiement' },
];

export default function FinanceClient({
  orders,
  visitors,
  viewsBySlug,
  products,
  initialExpenses,
  employees,
  affiliates = [],
  customersCount = 0,
  initialGoal = 150000,
  currentUser,
}: FinanceClientProps) {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'UNIT_ECONOMICS' | 'ACQUISITION_ROAS' | 'SIMULATOR' | 'PNL_STATEMENT' | 'EXPENSES'>('OVERVIEW');
  const [dateRange, setDateRange] = useState<number>(30); // days, 0 = all time
  const [expenses, setExpenses] = useState<ExpenseData[]>(initialExpenses);

  // Sync tab from URL if provided (e.g. ?tab=EXPENSES)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'EXPENSES') {
        setActiveTab('EXPENSES');
      }
    }
  }, []);

  // Modal State for New Expense
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formVendor, setFormVendor] = useState('');
  const [formInvoiceNumber, setFormInvoiceNumber] = useState('');
  const [formCategory, setFormCategory] = useState('ADS');
  const [formAmount, setFormAmount] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formStatus, setFormStatus] = useState<'PAID' | 'PENDING'>('PAID');
  const [formDueDate, setFormDueDate] = useState('');
  const [formPaidBy, setFormPaidBy] = useState(currentUser?.name || 'Ayoub Ait Yahya');
  const [formPaidAt, setFormPaidAt] = useState(new Date().toISOString().split('T')[0]);
  const [formDescription, setFormDescription] = useState('');
  const [formPaymentMethod, setFormPaymentMethod] = useState('CREDIT_CARD');
  const [formRecurring, setFormRecurring] = useState('ONE_TIME');
  const [formReceiptUrl, setFormReceiptUrl] = useState('');
  const [formReceiptFileName, setFormReceiptFileName] = useState('');
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit Expense & Viewer Modal States
  const [editingExpense, setEditingExpense] = useState<EnrichedExpense | null>(null);
  const [activeReceiptModal, setActiveReceiptModal] = useState<{
    url: string;
    title: string;
    vendor?: string;
    amount?: number;
    invoiceNumber?: string;
  } | null>(null);

  const [editTitle, setEditTitle] = useState('');
  const [editVendor, setEditVendor] = useState('');
  const [editInvoiceNumber, setEditInvoiceNumber] = useState('');
  const [editCategory, setEditCategory] = useState('OTHER');
  const [editAmount, setEditAmount] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editStatus, setEditStatus] = useState<'PAID' | 'PENDING'>('PAID');
  const [editDueDate, setEditDueDate] = useState('');
  const [editPaidAt, setEditPaidAt] = useState('');
  const [editPaidBy, setEditPaidBy] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState('CREDIT_CARD');
  const [editRecurring, setEditRecurring] = useState('ONE_TIME');
  const [editReceiptUrl, setEditReceiptUrl] = useState('');
  const [editReceiptFileName, setEditReceiptFileName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isEditingLoading, setIsEditingLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Filter state for Expenses tab
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('ALL');
  const [expenseStatusFilter, setExpenseStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING' | 'OVERDUE' | 'RECURRING'>('ALL');

  // Interactive Profit Simulator State
  const [simDailyOrders, setSimDailyOrders] = useState<number>(25);
  const [simAOV, setSimAOV] = useState<number>(420);
  const [simDailyAdBudget, setSimDailyAdBudget] = useState<number>(350);
  const [simDeliveryRate, setSimDeliveryRate] = useState<number>(85); // %
  const [simCogsRate, setSimCogsRate] = useState<number>(32); // % COGS of product price
  const [simFixedCharges, setSimFixedCharges] = useState<number>(6000); // Fixed rent, tools, base salaires in MAD

  // Unit Economics & Grossiste Pricing State
  // Grossiste tester price range: 150 - 170 MAD (Standard/Default: 160 MAD)
  const [testerWholesalePrice, setTesterWholesalePrice] = useState<number>(160);
  const [unitEcoCategoryFilter, setUnitEcoCategoryFilter] = useState<'ALL' | 'TESTERS' | 'ORIGINALS'>('ALL');
  const [unitEcoSearch, setUnitEcoSearch] = useState<string>('');
  const [unitEcoPageSize, setUnitEcoPageSize] = useState<number>(25);

  // Monthly Financial Target (Customizable Goal)
  const [monthlyRevenueGoal, setMonthlyRevenueGoal] = useState<number>(initialGoal);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState<boolean>(false);
  const [customGoalInput, setCustomGoalInput] = useState<string>(String(initialGoal));
  const [isSavingGoal, setIsSavingGoal] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Save / Update Financial Revenue Target
  const handleSaveGoal = async (targetValue?: number) => {
    const valueToSave = targetValue !== undefined ? targetValue : Number(customGoalInput);
    if (isNaN(valueToSave) || valueToSave <= 0) {
      alert('Veuillez entrer un montant d\'objectif valide supérieur à 0 MAD.');
      return;
    }

    try {
      setIsSavingGoal(true);
      const res = await fetch('/api/admin/finance/goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthlyRevenueGoal: valueToSave }),
      });

      if (res.ok) {
        setMonthlyRevenueGoal(valueToSave);
        setCustomGoalInput(String(valueToSave));
        if (typeof window !== 'undefined') {
          localStorage.setItem('nay_monthlyRevenueGoal', String(valueToSave));
        }
        showToast(`🎯 Objectif mensuel fixé à ${formatMAD(valueToSave)} avec succès !`);
        setIsGoalModalOpen(false);
      } else {
        const data = await res.json();
        alert(data.error || 'Erreur lors de l\'enregistrement de l\'objectif.');
      }
    } catch (err) {
      console.error('Error updating goal:', err);
      // Local fallback
      setMonthlyRevenueGoal(valueToSave);
      setCustomGoalInput(String(valueToSave));
      if (typeof window !== 'undefined') {
        localStorage.setItem('nay_monthlyRevenueGoal', String(valueToSave));
      }
      showToast(`🎯 Objectif mensuel mis à jour : ${formatMAD(valueToSave)}`);
      setIsGoalModalOpen(false);
    } finally {
      setIsSavingGoal(false);
    }
  };

  // Upload Invoice / Receipt
  const handleFileUpload = async (file: File) => {
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
        setFormReceiptUrl(data.url);
        setFormReceiptFileName(file.name);
        showToast('Justificatif / facture téléversé avec succès !');
      } else {
        alert(data.error || 'Erreur lors du téléversement du fichier.');
      }
    } catch (error) {
      console.error('File upload error:', error);
      alert('Erreur réseau lors de l\'envoi du fichier.');
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  // Filter orders by dateRange
  const filteredOrders = useMemo(() => {
    if (dateRange === 0) return orders;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - dateRange);
    return orders.filter((o) => new Date(o.createdAt) >= cutoff);
  }, [orders, dateRange]);

  // Filter expenses by dateRange
  const filteredExpenses = useMemo(() => {
    if (dateRange === 0) return expenses;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - dateRange);
    return expenses.filter((e) => new Date(e.date) >= cutoff);
  }, [expenses, dateRange]);

  // Filter visitors by dateRange
  const filteredVisitors = useMemo(() => {
    if (dateRange === 0) return visitors;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - dateRange);
    return visitors.filter((v) => new Date(v.createdAt) >= cutoff);
  }, [visitors, dateRange]);

  // Calculations & Real Stats
  const validOrders = filteredOrders.filter((o) =>
    ['delivered', 'shipped', 'completed', 'livre', 'expedie', 'pending', 'confirmed'].includes(o.status.toLowerCase())
  );

  const deliveredOrders = filteredOrders.filter((o) =>
    ['delivered', 'completed', 'livre'].includes(o.status.toLowerCase())
  );

  const shippedOrders = filteredOrders.filter((o) =>
    ['shipped', 'expedie', 'in_transit'].includes(o.status.toLowerCase())
  );

  const returnedOrRefusedOrders = filteredOrders.filter((o) =>
    ['returned', 'refused', 'retourne', 'refuse', 'annule', 'cancelled'].includes(o.status.toLowerCase())
  );

  // Parcelles confiées aux transporteurs (Livrées + En transit + Retours/Refus)
  const dispatchedOrders = filteredOrders.filter((o) =>
    ['delivered', 'completed', 'livre', 'shipped', 'expedie', 'in_transit', 'returned', 'refused', 'retourne', 'refuse'].includes(o.status.toLowerCase())
  );

  // Expéditions dont le sort final est clôturé (Livrées + Retours + Refusées)
  const resolvedCarrierOrders = filteredOrders.filter((o) =>
    ['delivered', 'completed', 'livre', 'returned', 'refused', 'retourne', 'refuse'].includes(o.status.toLowerCase())
  );

  const grossRevenue = validOrders.reduce((acc, o) => acc + o.total, 0);
  const totalCharges = filteredExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  const netRevenue = grossRevenue - totalCharges;
  const netMargin = grossRevenue > 0 ? (netRevenue / grossRevenue) * 100 : 0;

  // Real Items count and AOV calculations
  const totalItemsSold = validOrders.reduce((sum, o) => {
    try {
      const parsed = JSON.parse(o.items || '[]');
      return sum + (Array.isArray(parsed) ? parsed.reduce((itemSum: number, it: any) => itemSum + (Number(it.quantity) || 1), 0) : 1);
    } catch {
      return sum + 1;
    }
  }, 0);
  const avgItemsPerOrder = validOrders.length > 0 ? (totalItemsSold / validOrders.length).toFixed(1) : '1.5';
  const avgOrderValue = validOrders.length > 0 ? grossRevenue / validOrders.length : 0;
  const avgOrderValueAll = filteredOrders.length > 0
    ? filteredOrders.reduce((acc, o) => acc + o.total, 0) / filteredOrders.length
    : 0;

  // Taux de Livraison Réel Transporteur (COD):
  // Calculé sur les expéditions traitées par le transporteur (13 livrées / 17 résolues = 76.5%)
  const deliveryRate = resolvedCarrierOrders.length > 0
    ? (deliveredOrders.length / resolvedCarrierOrders.length) * 100
    : (dispatchedOrders.length > 0 ? (deliveredOrders.length / dispatchedOrders.length) * 100 : 85);

  const confirmationRate = filteredOrders.length > 0
    ? ((filteredOrders.length - filteredOrders.filter((o) => o.status === 'unconfirmed').length) / filteredOrders.length) * 100
    : 0;

  // Breakdown of expenses by category
  const expensesByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    EXPENSE_CATEGORIES.forEach((c) => (map[c.id] = 0));
    filteredExpenses.forEach((e) => {
      const cat = e.category || 'OTHER';
      map[cat] = (map[cat] || 0) + (Number(e.amount) || 0);
    });
    return map;
  }, [filteredExpenses]);

  // Ad Spend & ROAS / CAC metrics
  const adSpendTotal = expensesByCategory['ADS'] || 0;
  const blendedROAS = adSpendTotal > 0 ? (grossRevenue / adSpendTotal).toFixed(2) : 'N/A';
  const customerAcquisitionCost = validOrders.length > 0 && adSpendTotal > 0
    ? (adSpendTotal / validOrders.length).toFixed(0)
    : '0';
  const marketingEfficiencyRatio = adSpendTotal > 0 ? (grossRevenue / adSpendTotal).toFixed(2) : '100%';

  // Total Affiliate Commissions in date range
  const totalInfluencerCommissions = affiliates.reduce((sum, a) => sum + (a.commissionEarned || 0), 0);

  // Chart Data
  const chartData = useMemo(() => {
    const data = [];
    const daysToLook = dateRange === 0 ? 30 : dateRange;
    const today = new Date();
    for (let i = daysToLook - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      const dayOrders = validOrders.filter((o) => o.createdAt.split('T')[0] === dateStr);
      const dayExpenses = filteredExpenses.filter((e) => e.date.split('T')[0] === dateStr);

      const dayRevenue = dayOrders.reduce((acc, o) => acc + o.total, 0);
      const dayCharges = dayExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
      const dayNet = dayRevenue - dayCharges;

      data.push({
        date: dateStr.split('-').slice(1).join('/'),
        revenue: dayRevenue,
        charges: dayCharges,
        netRevenue: dayNet,
      });
    }
    return data;
  }, [validOrders, filteredExpenses, dateRange]);

  // Upload Invoice / Receipt for Edit
  const handleEditFileUpload = async (file: File) => {
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
        setEditReceiptUrl(data.url);
        setEditReceiptFileName(file.name);
        showToast('Justificatif téléversé avec succès !');
      } else {
        alert(data.error || 'Erreur lors du téléversement du fichier.');
      }
    } catch (error) {
      console.error('File upload error:', error);
      alert('Erreur réseau lors de l\'envoi du fichier.');
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  // Create Expense Submit
  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formAmount) {
      alert('Veuillez renseigner l\'intitulé et le montant de la charge.');
      return;
    }

    setFormLoading(true);
    try {
      const metadata: BillMetadata = {
        type: 'EMPLOYEE_BILL',
        status: formStatus,
        vendor: formVendor.trim() || extractVendorFromTitle(formTitle),
        invoiceNumber: formInvoiceNumber.trim() || undefined,
        dueDate: formStatus === 'PENDING' ? (formDueDate || undefined) : undefined,
        paidAt: formStatus === 'PAID' ? (formPaidAt ? new Date(formPaidAt).toISOString() : new Date().toISOString()) : undefined,
        paidBy: formPaidBy.trim() || currentUser?.name || 'Ayoub Ait Yahya',
        creatorRole: currentUser?.role || 'Direction NAY',
        paymentMethod: formPaymentMethod,
        notes: formDescription.trim() || undefined,
      };

      const finalDescription = encodeBillDescription(metadata, formDescription);

      const res = await fetch('/api/admin/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle.trim(),
          category: formCategory,
          amount: parseFloat(formAmount),
          date: formDate ? new Date(formDate).toISOString() : new Date().toISOString(),
          description: finalDescription,
          paymentMethod: formPaymentMethod,
          recurring: formRecurring,
          receiptUrl: formReceiptUrl || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const newExpense = data.expense || data;
        setExpenses([newExpense, ...expenses]);
        setIsAddExpenseModalOpen(false);
        setFormTitle('');
        setFormVendor('');
        setFormInvoiceNumber('');
        setFormAmount('');
        setFormDescription('');
        setFormReceiptUrl('');
        setFormReceiptFileName('');
        setFormStatus('PAID');
        setFormDueDate('');
        setFormDate(new Date().toISOString().split('T')[0]);
        showToast('Charge et facture enregistrées avec succès.');
      } else {
        const d = await res.json();
        alert(d.error || "Erreur lors de l'enregistrement de la charge.");
      }
    } catch (err) {
      console.error('Create expense error:', err);
      alert('Erreur réseau lors de la création de la charge.');
    } finally {
      setFormLoading(false);
    }
  };

  // Open Edit Expense Modal
  const openEditModal = (exp: EnrichedExpense) => {
    setEditingExpense(exp);
    setEditTitle(exp.title);
    setEditVendor(exp.vendor);
    setEditInvoiceNumber(exp.invoiceNumber);
    setEditAmount(String(exp.amount));
    setEditCategory(exp.category);
    setEditDate(exp.date ? exp.date.split('T')[0] : '');
    setEditStatus(exp.status === 'PAID' ? 'PAID' : 'PENDING');
    setEditDueDate(exp.dueDate ? exp.dueDate.split('T')[0] : '');
    setEditPaidBy(exp.paidBy || currentUser?.name || 'Ayoub Ait Yahya');
    setEditPaidAt(exp.paidAt ? exp.paidAt.split('T')[0] : new Date().toISOString().split('T')[0]);
    setEditPaymentMethod(exp.paymentMethod || 'CREDIT_CARD');
    setEditRecurring(exp.recurring || 'ONE_TIME');
    setEditReceiptUrl(exp.receiptUrl || '');
    setEditReceiptFileName(exp.receiptUrl ? 'Justificatif joint' : '');
    setEditDescription(exp.cleanNotes || '');
  };

  // Update Expense Submit
  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense || !editTitle || !editAmount) return;

    setIsEditingLoading(true);
    try {
      const metadata: BillMetadata = {
        type: 'EMPLOYEE_BILL',
        status: editStatus,
        vendor: editVendor.trim() || extractVendorFromTitle(editTitle),
        invoiceNumber: editInvoiceNumber.trim() || undefined,
        dueDate: editStatus === 'PENDING' ? (editDueDate || undefined) : undefined,
        paidAt: editStatus === 'PAID' ? (editPaidAt ? new Date(editPaidAt).toISOString() : new Date().toISOString()) : undefined,
        paidBy: editPaidBy.trim() || currentUser?.name || 'Ayoub Ait Yahya',
        creatorRole: currentUser?.role || 'Direction NAY',
        paymentMethod: editPaymentMethod,
        notes: editDescription.trim() || undefined,
      };

      const finalDescription = encodeBillDescription(metadata, editDescription);

      const res = await fetch(`/api/admin/expenses/${editingExpense.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          category: editCategory,
          amount: parseFloat(editAmount),
          date: editDate ? new Date(editDate).toISOString() : undefined,
          description: finalDescription,
          paymentMethod: editPaymentMethod,
          recurring: editRecurring,
          receiptUrl: editReceiptUrl || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const updatedExp = data.expense || data;
        setExpenses((prev) => prev.map((e) => (e.id === editingExpense.id ? { ...e, ...updatedExp } : e)));
        setEditingExpense(null);
        showToast('Charge et facture mises à jour avec succès.');
      } else {
        const d = await res.json();
        alert(d.error || 'Erreur lors de la mise à jour.');
      }
    } catch (err) {
      console.error('Update expense error:', err);
      alert('Erreur réseau lors de la modification de la charge.');
    } finally {
      setIsEditingLoading(false);
    }
  };

  // 1-Click Status Toggle (Mark as Paid / Pending)
  const handleToggleStatus = async (exp: EnrichedExpense) => {
    const nextStatus = exp.status === 'PAID' ? 'PENDING' : 'PAID';
    const metadata: BillMetadata = {
      type: 'EMPLOYEE_BILL',
      status: nextStatus,
      vendor: exp.vendor,
      invoiceNumber: exp.invoiceNumber,
      dueDate: nextStatus === 'PENDING' ? (exp.dueDate || undefined) : undefined,
      paidAt: nextStatus === 'PAID' ? new Date().toISOString() : undefined,
      paidBy: nextStatus === 'PAID' ? (currentUser?.name || 'Ayoub Ait Yahya') : undefined,
      creatorRole: currentUser?.role || 'Direction NAY',
      paymentMethod: exp.paymentMethod,
      notes: exp.cleanNotes || undefined,
    };

    const finalDescription = encodeBillDescription(metadata, exp.cleanNotes);

    try {
      const res = await fetch(`/api/admin/expenses/${exp.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: finalDescription,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const updated = data.expense || data;
        setExpenses((prev) => prev.map((e) => (e.id === exp.id ? { ...e, ...updated } : e)));
        showToast(
          nextStatus === 'PAID'
            ? `✓ Facture "${exp.title}" marquée comme Payée par ${currentUser?.name || 'Ayoub'} !`
            : `⏳ Facture "${exp.title}" remise en Attente de paiement.`
        );
      }
    } catch (e) {
      console.error('Error toggling status:', e);
    }
  };

  // Export Expenses CSV
  const handleExportExpensesCSV = () => {
    const itemsToExport = filteredEnrichedExpenses;
    if (itemsToExport.length === 0) return;

    const headers = [
      'Date',
      'Ref Facture',
      'Fournisseur / Prestataire',
      'Intitule Prestation',
      'Categorie',
      'Montant (MAD)',
      'Statut Facture',
      'Paye Par',
      'Canal de Reglement',
      'Date de Paiement',
      'Date d Echeance',
      'Recurrence',
      'Justificatif URL',
      'Notes'
    ];

    const rows = itemsToExport.map((e) => [
      `"${new Date(e.date).toLocaleDateString('fr-FR')}"`,
      `"${e.invoiceNumber}"`,
      `"${(e.vendor || '').replace(/"/g, '""')}"`,
      `"${(e.title || '').replace(/"/g, '""')}"`,
      `"${e.category}"`,
      e.amount,
      `"${e.status === 'PAID' ? 'PAYEE' : e.status === 'OVERDUE' ? 'EN RETARD' : 'EN ATTENTE'}"`,
      `"${(e.paidBy || '').replace(/"/g, '""')}"`,
      `"${e.paymentMethod}"`,
      `"${e.paidAt ? new Date(e.paidAt).toLocaleDateString('fr-FR') : '-'}"`,
      `"${e.dueDate ? new Date(e.dueDate).toLocaleDateString('fr-FR') : '-'}"`,
      `"${e.recurring}"`,
      `"${e.receiptUrl || 'Sans justificatif'}"`,
      `"${(e.cleanNotes || '').replace(/"/g, '""')}"`,
    ].join(';'));

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const today = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `Registre_Charges_Factures_Maison_NAY_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // All enriched expenses
  const enrichedExpenses = useMemo(() => {
    return expenses.map((exp) => enrichExpense(exp));
  }, [expenses]);

  // Executive KPI stats for charges & factures
  const expenseKpis = useMemo(() => {
    let totalPaid = 0;
    let totalPending = 0;
    let totalOverdue = 0;
    let countPending = 0;
    let countOverdue = 0;
    let recurringMonthly = 0;
    let withReceiptCount = 0;

    enrichedExpenses.forEach((e) => {
      if (e.status === 'PAID') {
        totalPaid += e.amount;
      } else if (e.status === 'OVERDUE') {
        totalOverdue += e.amount;
        countOverdue += 1;
      } else if (e.status === 'PENDING') {
        totalPending += e.amount;
        countPending += 1;
      }

      if (e.recurring === 'MONTHLY') {
        recurringMonthly += e.amount;
      } else if (e.recurring === 'ANNUAL') {
        recurringMonthly += e.amount / 12;
      }

      if (e.receiptUrl) {
        withReceiptCount += 1;
      }
    });

    const receiptRate = enrichedExpenses.length > 0
      ? Math.round((withReceiptCount / enrichedExpenses.length) * 100)
      : 100;

    return {
      totalPaid,
      totalPending,
      totalOverdue,
      countPending,
      countOverdue,
      recurringMonthly: Math.round(recurringMonthly),
      receiptRate,
      withReceiptCount,
      totalAll: totalPaid + totalPending + totalOverdue,
    };
  }, [enrichedExpenses]);

  // Filtered enriched expenses for tab view
  const filteredEnrichedExpenses = useMemo(() => {
    return enrichedExpenses.filter((e) => {
      // Date filter
      if (dateRange !== 0) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - dateRange);
        if (new Date(e.date) < cutoff) return false;
      }

      // Search filter
      if (expenseSearch) {
        const q = expenseSearch.toLowerCase();
        const matches =
          e.title.toLowerCase().includes(q) ||
          e.vendor.toLowerCase().includes(q) ||
          e.invoiceNumber.toLowerCase().includes(q) ||
          e.paidBy.toLowerCase().includes(q) ||
          e.cleanNotes.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Category filter
      if (expenseCategoryFilter !== 'ALL' && e.category !== expenseCategoryFilter) {
        return false;
      }

      // Status filter
      if (expenseStatusFilter === 'PAID' && e.status !== 'PAID') return false;
      if (expenseStatusFilter === 'PENDING' && e.status !== 'PENDING') return false;
      if (expenseStatusFilter === 'OVERDUE' && e.status !== 'OVERDUE') return false;
      if (expenseStatusFilter === 'RECURRING' && (e.recurring !== 'MONTHLY' && e.recurring !== 'ANNUAL')) return false;

      return true;
    });
  }, [enrichedExpenses, dateRange, expenseSearch, expenseCategoryFilter, expenseStatusFilter]);

  // Delete Expense
  const handleDeleteExpense = async (id: string, title: string) => {
    if (!window.confirm(`Supprimer définitivement la charge "${title}" ?`)) return;

    try {
      const res = await fetch(`/api/admin/expenses/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setExpenses(expenses.filter((e) => e.id !== id));
        showToast('Charge supprimée avec succès.');
      } else {
        const d = await res.json();
        alert(d.error || 'Erreur de suppression');
      }
    } catch (err) {
      console.error('Delete expense error:', err);
    }
  };

  // Estimated COGS for all valid orders
  const estimatedCOGS = grossRevenue * 0.32; // ~32% product purchase cost
  const grossProfit = grossRevenue - estimatedCOGS;

  // Simulator Calculations
  const simMonthlyOrders = simDailyOrders * 30;
  const simGrossRevenue = simMonthlyOrders * simAOV * (simDeliveryRate / 100);
  const simTotalCOGS = simGrossRevenue * (simCogsRate / 100);
  const simTotalAdSpend = simDailyAdBudget * 30;
  const simTotalDeliveryShipping = simMonthlyOrders * 35; // 35 MAD per delivered parcel
  const simTotalExpenses = simTotalCOGS + simTotalAdSpend + simTotalDeliveryShipping + simFixedCharges;
  const simNetProfit = simGrossRevenue - simTotalExpenses;
  const simMarginPercent = simGrossRevenue > 0 ? ((simNetProfit / simGrossRevenue) * 100).toFixed(1) : '0';

  // Export CSV Handler for P&L
  const exportCsvPnL = () => {
    const csvRows = [
      ['POSTE COMPTABLE', 'MONTANT (MAD)', '% DU CA'],
      ['Chiffre d Affaires Brut (Ventes)', grossRevenue.toFixed(0), '100%'],
      ['Coût Approvisionnement Produits (COGS)', (-estimatedCOGS).toFixed(0), '-32.0%'],
      ['MARGE BRUTE COMMERCIALE', grossProfit.toFixed(0), `${((grossProfit / (grossRevenue || 1)) * 100).toFixed(1)}%`],
      ['Dépenses Publicitaires (TikTok, Meta, Google)', (-adSpendTotal).toFixed(0), `-${((adSpendTotal / (grossRevenue || 1)) * 100).toFixed(1)}%`],
      ['Commissions Ambassadeurs & Influenceurs', (-totalInfluencerCommissions).toFixed(0), `-${((totalInfluencerCommissions / (grossRevenue || 1)) * 100).toFixed(1)}%`],
      ['Achats Stock & Fournisseurs (Bons de Commande)', (-(expensesByCategory['SUPPLIES'] || 0)).toFixed(0), `-${(((expensesByCategory['SUPPLIES'] || 0) / (grossRevenue || 1)) * 100).toFixed(1)}%`],
      ['Frais Logistiques & Emballages', (-(expensesByCategory['LOGISTICS'] || 0 + (expensesByCategory['PACKAGING'] || 0))).toFixed(0), ''],
      ['Masse Salariale & Salaires Fixes', (-(expensesByCategory['SALARY'] || 0)).toFixed(0), ''],
      ['Hébergement, Logiciels & SaaS', (-(expensesByCategory['HOSTING'] || 0 + (expensesByCategory['TOOLS'] || 0))).toFixed(0), ''],
      ['RESULTAT NET REEL (EBITDA)', netRevenue.toFixed(0), `${netMargin.toFixed(1)}%`],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `compte-de-resultat-nay-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom-5">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header with Title and Global Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
              Moteur Financier & Rentabilité
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 flex items-center gap-2">
            <DollarSign size={22} className="text-emerald-600" />
            <span>Finance, Marges & Trésorerie NAY</span>
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Tableau de bord financier haute précision : Marges réelles, ROAS, économie unitaire, simulation de rentabilité et P&L.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Timeframe Filter */}
          <div className="flex items-center bg-white border border-neutral-200 rounded-lg p-1 text-xs shadow-2xs">
            <button
              onClick={() => setDateRange(7)}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                dateRange === 7 ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              7J
            </button>
            <button
              onClick={() => setDateRange(30)}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                dateRange === 30 ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              30J
            </button>
            <button
              onClick={() => setDateRange(90)}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                dateRange === 90 ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              90J
            </button>
            <button
              onClick={() => setDateRange(0)}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                dateRange === 0 ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Tout
            </button>
          </div>

          <button
            onClick={() => setIsAddExpenseModalOpen(true)}
            className="px-3.5 py-2 bg-neutral-900 hover:bg-black text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Plus size={14} />
            <span>Ajouter une Charge</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="border-b border-neutral-200 flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'OVERVIEW'
              ? 'bg-neutral-900 text-white shadow-2xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <TrendingUp size={14} />
          <span>Vue d'Ensemble & CA Net</span>
        </button>

        <button
          onClick={() => setActiveTab('UNIT_ECONOMICS')}
          className={`px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'UNIT_ECONOMICS'
              ? 'bg-neutral-900 text-white shadow-2xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <Package size={14} />
          <span>Économie Unitaire & Marges Parfums</span>
        </button>

        <button
          onClick={() => setActiveTab('ACQUISITION_ROAS')}
          className={`px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'ACQUISITION_ROAS'
              ? 'bg-neutral-900 text-white shadow-2xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <Flame size={14} />
          <span>Ads, ROAS & Coût Client (CAC)</span>
        </button>

        <button
          onClick={() => setActiveTab('SIMULATOR')}
          className={`px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'SIMULATOR'
              ? 'bg-neutral-900 text-white shadow-2xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <Sliders size={14} />
          <span>Simulateur de Croissance</span>
        </button>

        <button
          onClick={() => setActiveTab('PNL_STATEMENT')}
          className={`px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'PNL_STATEMENT'
              ? 'bg-neutral-900 text-white shadow-2xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <FileText size={14} />
          <span>Compte de Résultat (P&L)</span>
        </button>

        <button
          onClick={() => setActiveTab('EXPENSES')}
          className={`px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'EXPENSES'
              ? 'bg-neutral-900 text-white shadow-2xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <Banknote size={14} />
          <span>Charges & Factures ({expenses.length})</span>
        </button>
      </div>

      {/* TAB 1: EXECUTIVE OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* Top 6 KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3.5">
            <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
              <span className="text-[11px] text-neutral-500 font-medium block">CA Brut Total</span>
              <div className="text-2xl font-bold text-neutral-900 mt-1">{formatMAD(grossRevenue)}</div>
              <span className="text-[10px] text-neutral-400 mt-0.5 block">{validOrders.length} commandes</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
              <span className="text-[11px] text-neutral-500 font-medium block">Total Charges Déduites</span>
              <div className="text-2xl font-bold text-rose-600 mt-1">-{formatMAD(totalCharges)}</div>
              <span className="text-[10px] text-neutral-400 mt-0.5 block">{filteredExpenses.length} factures enregistrées</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs col-span-2 sm:col-span-1">
              <span className="text-[11px] text-neutral-500 font-medium block">BÉNÉFICE NET RÉEL</span>
              <div className={`text-2xl font-black mt-1 ${netRevenue >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                {formatMAD(netRevenue)}
              </div>
              <span className="text-[10px] text-neutral-400 mt-0.5 block">Marge Nette : <strong className="text-neutral-800">{netMargin.toFixed(1)}%</strong></span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
              <span className="text-[11px] text-neutral-500 font-medium block">Panier Moyen (AOV)</span>
              <div className="text-2xl font-bold text-neutral-900 mt-1">{formatMAD(avgOrderValue)}</div>
              <span className="text-[10px] text-neutral-400 mt-0.5 block truncate" title={`~${avgItemsPerOrder} articles / commande sur ${validOrders.length} commandes validées`}>
                ~{avgItemsPerOrder} articles / cmd ({validOrders.length} validées)
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
              <span className="text-[11px] text-neutral-500 font-medium block">ROAS Publicitaire</span>
              <div className="text-2xl font-bold text-amber-700 mt-1">{blendedROAS}x</div>
              <span className="text-[10px] text-neutral-400 mt-0.5 block">CAC : ~{customerAcquisitionCost} MAD</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
              <span className="text-[11px] text-neutral-500 font-medium block">Taux de Livraison (COD)</span>
              <div className="text-2xl font-bold text-sky-700 mt-1">{deliveryRate.toFixed(1)}%</div>
              <span className="text-[10px] text-neutral-400 mt-0.5 block truncate" title={`${deliveredOrders.length} livrées sur ${resolvedCarrierOrders.length} expéditions traitées (${shippedOrders.length} en transit)`}>
                {deliveredOrders.length} livrées / {resolvedCarrierOrders.length} traitées
              </span>
            </div>
          </div>

          {/* Monthly Revenue Goal & Break-Even Banner */}
          <div className="bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-sky-50/50 border border-emerald-200/90 rounded-2xl p-5 shadow-2xs transition-all hover:border-emerald-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center flex-wrap gap-2.5 mb-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomGoalInput(String(monthlyRevenueGoal));
                      setIsGoalModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 hover:bg-emerald-200/80 border border-emerald-300 text-emerald-950 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-2xs group"
                    title="Cliquer pour personnaliser l'objectif"
                  >
                    <Target size={15} className="text-emerald-700 group-hover:rotate-12 transition-transform" />
                    <span>Objectif Mensuel NAY : {formatMAD(monthlyRevenueGoal)}</span>
                    <Sliders size={12} className="text-emerald-600 opacity-60 group-hover:opacity-100 transition-opacity ml-0.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCustomGoalInput(String(monthlyRevenueGoal));
                      setIsGoalModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 bg-white hover:bg-emerald-50 border border-emerald-300/80 hover:border-emerald-400 rounded-lg shadow-2xs hover:shadow transition-all cursor-pointer"
                  >
                    <Sliders size={13} className="text-emerald-600" />
                    <span>Changer d'objectif</span>
                  </button>
                </div>

                <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-emerald-900 mt-2">
                  <span>
                    Progression actuelle : <strong className="text-emerald-950 font-bold">{((grossRevenue / (monthlyRevenueGoal || 1)) * 100).toFixed(1)}%</strong> ({formatMAD(grossRevenue)} atteints)
                  </span>
                  <span className="text-emerald-300 hidden sm:inline">•</span>
                  <span>
                    Reste : <strong className="text-emerald-800">{formatMAD(Math.max(0, monthlyRevenueGoal - grossRevenue))}</strong>
                  </span>
                  <span className="text-emerald-300 hidden sm:inline">•</span>
                  <span className="text-emerald-700 font-medium">
                    Rythme cible : <strong>~{formatMAD(Math.round(monthlyRevenueGoal / 30))} / jour</strong>
                  </span>
                </div>
              </div>

              <div className="sm:text-right bg-white/80 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-emerald-100/90 shadow-2xs sm:self-center">
                <span className="text-[11px] text-neutral-500 font-medium block">Seuil de Rentabilité (Break-Even)</span>
                <span className="text-sm font-bold text-neutral-900">
                  ~{(totalCharges / (avgOrderValue || 400)).toFixed(0)} commandes nécessaires
                </span>
                <span className="text-[10px] text-neutral-400 block">pour couvrir l'ensemble des charges</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-emerald-200/60 rounded-full mt-3.5 overflow-hidden p-0.5 relative">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 rounded-full transition-all duration-700 ease-out shadow-xs"
                style={{ width: `${Math.min(100, Math.max(1.5, (grossRevenue / (monthlyRevenueGoal || 1)) * 100))}%` }}
              />
            </div>
          </div>

          {/* Charts Section: Cashflow Area Chart & Cost Waterfall */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-neutral-200 p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                    Évolution CA Brut vs Charges vs CA Net
                  </h3>
                  <p className="text-[11px] text-neutral-400">Courbe de trésorerie sur la période sélectionnée</p>
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorCharges" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" tickFormatter={(v) => `${v} DH`} />
                    <Tooltip
                      formatter={(val: any) => [`${val} MAD`]}
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                    />
                    <Area type="monotone" dataKey="revenue" name="CA Brut" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                    <Area type="monotone" dataKey="charges" name="Charges" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorCharges)" />
                    <Area type="monotone" dataKey="netRevenue" name="CA Net" stroke="#38bdf8" strokeWidth={2} fillOpacity={1} fill="url(#colorNet)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Expenses Distribution */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1">
                  Répartition des Charges
                </h3>
                <p className="text-[11px] text-neutral-400 mb-4">Total déduit : {formatMAD(totalCharges)}</p>

                <div className="space-y-3 text-xs">
                  {EXPENSE_CATEGORIES.map((cat) => {
                    const amount = expensesByCategory[cat.id] || 0;
                    const pct = totalCharges > 0 ? ((amount / totalCharges) * 100).toFixed(1) : '0';
                    return (
                      <div key={cat.id} className="flex flex-col">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-neutral-600 text-[11px] truncate max-w-[180px]">{cat.label.split('(')[0]}</span>
                          <span className="font-bold text-neutral-900">{formatMAD(amount)} ({pct}%)</span>
                        </div>
                        <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, backgroundColor: cat.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={() => setActiveTab('EXPENSES')}
                className="mt-5 w-full py-2 bg-neutral-50 hover:bg-neutral-100 text-neutral-800 rounded-lg text-xs font-semibold border border-neutral-200 transition-colors"
              >
                Gérer les factures détaillées
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: UNIT ECONOMICS (Marges Réelles & Coût Grossiste Parfums) */}
      {activeTab === 'UNIT_ECONOMICS' && (
        <div className="space-y-6">
          {/* Top Banner: Real Unit Cost Breakdown */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-2xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-sky-50 text-sky-800 border border-sky-200">
                    Analyse de Marge Unitaire Réelle
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Testeurs : 150 – 170 MAD Grossiste
                  </span>
                </div>
                <h2 className="text-xl font-bold text-neutral-900 mt-1">
                  Décomposition du Coût de Revient d'un Parfum Testeur NAY
                </h2>
                <p className="text-xs text-neutral-500 mt-1">
                  Prix d'achat grossiste des testeurs : <strong>150 DH à 170 DH</strong>. Pour les parfums originaux, le coût grossiste est en attente de communication fournisseur.
                </p>
              </div>

              {/* Interactive Wholesale Price Toggle for Testers */}
              <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-200 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="text-xs">
                  <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">
                    Prix Achat Grossiste (Testeur) :
                  </span>
                  <div className="font-bold text-neutral-900 font-mono text-sm mt-0.5">
                    {testerWholesalePrice} MAD / flacon
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-neutral-200 shadow-2xs">
                  {[
                    { val: 150, label: '150 DH', tip: 'Min Grossiste' },
                    { val: 160, label: '160 DH', tip: 'Moyen Standard' },
                    { val: 170, label: '170 DH', tip: 'Max Grossiste' },
                  ].map((tier) => (
                    <button
                      key={tier.val}
                      type="button"
                      onClick={() => setTesterWholesalePrice(tier.val)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        testerWholesalePrice === tier.val
                          ? 'bg-neutral-900 text-white shadow-xs'
                          : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                      }`}
                      title={tier.tip}
                    >
                      {tier.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Visual Waterfall */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mt-6">
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-center">
                <span className="text-[11px] text-neutral-500 block font-medium">Prix Vente Boutique</span>
                <span className="text-xl font-black text-neutral-900 mt-1 block">299 MAD</span>
                <span className="text-[10px] text-neutral-400">100% du CA Testeur</span>
              </div>

              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-center relative overflow-hidden">
                <div className="absolute top-1 right-2 text-[9px] font-bold text-rose-600 uppercase">Grossiste</div>
                <span className="text-[11px] text-rose-700 block font-medium">- Achat Testeur (COGS)</span>
                <span className="text-xl font-bold text-rose-800 mt-1 block font-mono">-{testerWholesalePrice} MAD</span>
                <span className="text-[10px] text-rose-600">Fourchette 150 - 170 DH</span>
              </div>

              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-center">
                <span className="text-[11px] text-amber-700 block font-medium">- Emballage & Pochon</span>
                <span className="text-xl font-bold text-amber-800 mt-1 block font-mono">-25 MAD</span>
                <span className="text-[10px] text-amber-600">Boîte & Pochon luxe satin</span>
              </div>

              <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-center">
                <span className="text-[11px] text-purple-700 block font-medium">- Livraison Express & COD</span>
                <span className="text-xl font-bold text-purple-800 mt-1 block font-mono">-35 MAD</span>
                <span className="text-[10px] text-purple-600">Transporteur & Encaissement</span>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-center shadow-xs">
                <span className="text-[11px] text-emerald-800 block font-bold">BÉNÉFICE NET / FLACON</span>
                <span className="text-xl font-black text-emerald-700 mt-1 block font-mono">
                  +{299 - testerWholesalePrice - 25 - 35} MAD
                </span>
                <span className="text-[10px] text-emerald-700 font-bold">
                  Marge Brute : +{299 - testerWholesalePrice} MAD ({(((299 - testerWholesalePrice) / 299) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>

          {/* Table: Rentabilité du Catalogue Parfums */}
          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-2xs">
            {/* Table Header & Controls */}
            <div className="p-4 border-b border-neutral-200 bg-neutral-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-2">
                  <Package size={15} className="text-sky-600" />
                  <span>Rentabilité du Catalogue Parfums ({products.length} références)</span>
                </h3>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Visualisez les marges réelles par référence (Prix Grossiste appliqué aux testeurs)
                </p>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Search Bar */}
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={unitEcoSearch}
                    onChange={(e) => setUnitEcoSearch(e.target.value)}
                    placeholder="Rechercher parfum ou marque..."
                    className="pl-8 pr-3 py-1.5 text-xs bg-white border border-neutral-200 rounded-lg w-52 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                  />
                  {unitEcoSearch && (
                    <button
                      onClick={() => setUnitEcoSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Category Filter Tabs */}
                <div className="flex items-center bg-white border border-neutral-200 rounded-lg p-0.5 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setUnitEcoCategoryFilter('ALL')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      unitEcoCategoryFilter === 'ALL'
                        ? 'bg-neutral-900 text-white'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    Tous ({products.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnitEcoCategoryFilter('TESTERS')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                      unitEcoCategoryFilter === 'TESTERS'
                        ? 'bg-sky-600 text-white'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    <span>Testeurs (172)</span>
                    <span className="text-[10px] opacity-80">(150-170 DH)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnitEcoCategoryFilter('ORIGINALS')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                      unitEcoCategoryFilter === 'ORIGINALS'
                        ? 'bg-amber-600 text-white'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    <span>Originaux (27)</span>
                    <span className="text-[10px] opacity-80">(En attente)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Information Banner */}
            <div className="bg-sky-50/60 border-b border-sky-100 px-4 py-2 flex items-center gap-2 text-xs text-sky-900">
              <Sparkles size={14} className="text-sky-600 shrink-0" />
              <span>
                <strong>Tarification Grossiste :</strong> Les parfums testeurs bénéficient d'un coût d'achat grossiste de <strong>150 DH à 170 DH</strong> ({testerWholesalePrice} MAD appliqué). Les parfums originaux sont en cours de tarification par les distributeurs officiels.
              </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-neutral-50 z-10 shadow-2xs">
                  <tr className="border-b border-neutral-200 text-[11px] font-semibold text-neutral-600 uppercase">
                    <th className="py-3 px-4">Parfum & Marque</th>
                    <th className="py-3 px-4">Type / Format</th>
                    <th className="py-3 px-4">Prix Vente Boutique</th>
                    <th className="py-3 px-4">Coût Grossiste (Achat)</th>
                    <th className="py-3 px-4">Marge Brute (MAD)</th>
                    <th className="py-3 px-4">Marge Nette Estimée</th>
                    <th className="py-3 px-4">Rentabilité</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-neutral-700">
                  {(() => {
                    const filtered = products.filter((p) => {
                      const isTesterItem = p.isTester === true || (p.subcategory !== 'arabic' && p.subcategory !== 'oriental');
                      if (unitEcoCategoryFilter === 'TESTERS' && !isTesterItem) return false;
                      if (unitEcoCategoryFilter === 'ORIGINALS' && isTesterItem) return false;

                      if (unitEcoSearch.trim()) {
                        const q = unitEcoSearch.toLowerCase();
                        const matchName = p.name.toLowerCase().includes(q);
                        const matchBrand = (p.brandLabel || '').toLowerCase().includes(q);
                        const matchSub = (p.subcategoryLabel || p.subcategory || '').toLowerCase().includes(q);
                        if (!matchName && !matchBrand && !matchSub) return false;
                      }

                      return true;
                    });

                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-neutral-400">
                            Aucun parfum ne correspond à vos critères de recherche.
                          </td>
                        </tr>
                      );
                    }

                    return filtered.slice(0, unitEcoPageSize).map((p) => {
                      const isTesterItem = p.isTester === true || (p.subcategory !== 'arabic' && p.subcategory !== 'oriental');
                      const price = p.price || (isTesterItem ? 299 : 500);

                      if (isTesterItem) {
                        const wholesaleCost = testerWholesalePrice;
                        const grossMargin = price - wholesaleCost;
                        const netMargin = grossMargin - 25 - 35; // after 25 MAD box & 35 MAD delivery
                        const marginPercent = ((grossMargin / price) * 100).toFixed(0);

                        return (
                          <tr key={p.id} className="hover:bg-neutral-50/80 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex flex-col">
                                <span className="font-bold text-neutral-900">{p.name}</span>
                                <span className="text-[10px] text-neutral-500 uppercase">{p.brandLabel}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                                Testeur 100ml
                              </span>
                            </td>
                            <td className="py-3 px-4 font-bold text-neutral-900 font-mono">
                              {formatMAD(price)}
                            </td>
                            <td className="py-3 px-4 text-rose-700 font-mono font-semibold">
                              ~{formatMAD(wholesaleCost)}
                              <span className="text-[9px] text-neutral-400 block font-normal">(150-170 DH)</span>
                            </td>
                            <td className="py-3 px-4 font-bold text-emerald-700 font-mono">
                              +{formatMAD(grossMargin)}
                            </td>
                            <td className="py-3 px-4 font-semibold text-neutral-800 font-mono">
                              +{formatMAD(netMargin)}
                              <span className="text-[9px] text-neutral-400 block font-normal">après boîte & livraison</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                                {marginPercent}% Marge
                              </span>
                            </td>
                          </tr>
                        );
                      }

                      // Original fragrance (wholesale price unknown)
                      return (
                        <tr key={p.id} className="hover:bg-amber-50/30 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-neutral-900">{p.name}</span>
                              <span className="text-[10px] text-neutral-500 uppercase">{p.brandLabel}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              Parfum Original
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-neutral-900 font-mono">
                            {formatMAD(price)}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1 w-fit">
                              <AlertCircle size={10} />
                              <span>En attente grossiste</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-neutral-400 font-mono italic">
                            —
                          </td>
                          <td className="py-3 px-4 text-neutral-400 font-mono italic">
                            —
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-neutral-100 text-neutral-500 border border-neutral-200">
                              Non chiffré
                            </span>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>

            {/* Pagination / Show more */}
            <div className="p-3 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between text-xs text-neutral-500">
              <span>
                Affichage de {Math.min(unitEcoPageSize, products.length)} sur {products.length} références du catalogue
              </span>
              {unitEcoPageSize < products.length && (
                <button
                  type="button"
                  onClick={() => setUnitEcoPageSize((prev) => Math.min(prev + 50, products.length))}
                  className="px-3 py-1 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-lg font-semibold text-neutral-800 transition-colors cursor-pointer"
                >
                  Afficher +50 parfums
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ACQUISITION & ROAS */}
      {activeTab === 'ACQUISITION_ROAS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs">
              <span className="text-xs text-neutral-500 font-medium block">Budget Ads Dépensé</span>
              <div className="text-2xl font-black text-rose-600 mt-1">{formatMAD(adSpendTotal)}</div>
              <span className="text-[10px] text-neutral-400 mt-0.5 block">TikTok + Meta + Google</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs">
              <span className="text-xs text-neutral-500 font-medium block">Blended ROAS (Retour sur Ads)</span>
              <div className="text-2xl font-black text-amber-700 mt-1">{blendedROAS}x</div>
              <span className="text-[10px] text-neutral-400 mt-0.5 block">1 DH investi = {blendedROAS} DH CA</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs">
              <span className="text-xs text-neutral-500 font-medium block">Coût d'Acquisition Client (CAC)</span>
              <div className="text-2xl font-black text-neutral-900 mt-1">~{customerAcquisitionCost} MAD</div>
              <span className="text-[10px] text-neutral-400 mt-0.5 block">Coût par acheteur généré</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs">
              <span className="text-xs text-neutral-500 font-medium block">MER (Marketing Efficiency Ratio)</span>
              <div className="text-2xl font-black text-emerald-700 mt-1">{marketingEfficiencyRatio}x</div>
              <span className="text-[10px] text-neutral-400 mt-0.5 block">Score de rentabilité global</span>
            </div>
          </div>

          {/* Strategic Advice Card */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 text-neutral-900 font-bold text-sm">
              <Sparkles size={18} className="text-amber-500" />
              <span>Diagnostic Financier & Conseils de Scaling pour NAY Parfums</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
                <span className="font-bold text-neutral-900 block">1. Scalabilité Publicitaire</span>
                <p className="text-neutral-600 leading-relaxed">
                  Votre panier moyen à <strong>{formatMAD(avgOrderValue || 420)}</strong> vous permet d'absorber un CAC jusqu'à <strong>80 MAD</strong> tout en restant très rentable.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
                <span className="font-bold text-neutral-900 block">2. Optimisation des Retours COD</span>
                <p className="text-neutral-600 leading-relaxed">
                  La confirmation WhatsApp avant expédition augmente le taux de livraison de <strong>+12%</strong>, réduisant directement les pertes d'expédition Amana.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
                <span className="font-bold text-neutral-900 block">3. Recommandation Coffrets</span>
                <p className="text-neutral-600 leading-relaxed">
                  Augmenter la part des coffrets cadeaux (AOV &gt; 650 MAD) augmente instantanément votre marge nette sans augmenter le budget publicitaire.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: INTERACTIVE PROFIT SIMULATOR */}
      {activeTab === 'SIMULATOR' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-2xs">
            <div className="max-w-2xl mb-6">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                Outil de Projection Stratégique
              </span>
              <h2 className="text-xl font-bold text-neutral-900 mt-2">
                Simulateur de Croissance & Rentabilité Mensuelle
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                Ajustez les curseurs ci-dessous pour simuler les revenus, les charges et le <strong>bénéfice net mensuel</strong> selon vos objectifs de commandes.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Sliders Form */}
              <div className="space-y-5 bg-neutral-50 p-5 rounded-2xl border border-neutral-200 text-xs">
                <div>
                  <div className="flex justify-between font-semibold text-neutral-800 mb-1">
                    <span>Commandes traitées par jour :</span>
                    <strong className="text-neutral-900 font-mono text-sm">{simDailyOrders} commandes / jour ({simDailyOrders * 30} / mois)</strong>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="150"
                    step="1"
                    value={simDailyOrders}
                    onChange={(e) => setSimDailyOrders(Number(e.target.value))}
                    className="w-full accent-neutral-900 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-semibold text-neutral-800 mb-1">
                    <span>Panier Moyen par Commande (MAD) :</span>
                    <strong className="text-neutral-900 font-mono text-sm">{simAOV} MAD</strong>
                  </div>
                  <input
                    type="range"
                    min="250"
                    max="1000"
                    step="10"
                    value={simAOV}
                    onChange={(e) => setSimAOV(Number(e.target.value))}
                    className="w-full accent-neutral-900 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-semibold text-neutral-800 mb-1">
                    <span>Budget Ads Publicitaire Quotidien (MAD/jour) :</span>
                    <strong className="text-rose-700 font-mono text-sm">{simDailyAdBudget} MAD / jour ({simDailyAdBudget * 30} MAD/mois)</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="3000"
                    step="50"
                    value={simDailyAdBudget}
                    onChange={(e) => setSimDailyAdBudget(Number(e.target.value))}
                    className="w-full accent-neutral-900 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-semibold text-neutral-800 mb-1">
                    <span>Taux de Livraison Réel Encaissé (COD %) :</span>
                    <strong className="text-sky-700 font-mono text-sm">{simDeliveryRate}%</strong>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="98"
                    step="1"
                    value={simDeliveryRate}
                    onChange={(e) => setSimDeliveryRate(Number(e.target.value))}
                    className="w-full accent-neutral-900 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-semibold text-neutral-800 mb-1">
                    <span>Charges Fixes Mensuelles (Loyer, Outils, Base Salaires) :</span>
                    <strong className="text-neutral-900 font-mono text-sm">{simFixedCharges} MAD / mois</strong>
                  </div>
                  <input
                    type="range"
                    min="2000"
                    max="30000"
                    step="500"
                    value={simFixedCharges}
                    onChange={(e) => setSimFixedCharges(Number(e.target.value))}
                    className="w-full accent-neutral-900 cursor-pointer"
                  />
                </div>
              </div>

              {/* Simulation Result Card */}
              <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 text-white rounded-2xl p-6 flex flex-col justify-between shadow-xl">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 block mb-1">
                    RÉSULTAT DE LA PROJECTION
                  </span>
                  <h3 className="text-lg font-bold text-white">Projection Financière Mensuelle</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">Basée sur {simDailyOrders} commandes/jour ({simMonthlyOrders} par mois)</p>

                  <div className="mt-6 space-y-3 text-xs border-y border-neutral-800 py-4">
                    <div className="flex justify-between text-neutral-300">
                      <span>CA Brut Encaissé Estimé :</span>
                      <strong className="text-white text-sm font-mono">{formatMAD(simGrossRevenue)}</strong>
                    </div>

                    <div className="flex justify-between text-rose-400">
                      <span>- Coût Achat Parfums (COGS {simCogsRate}%) :</span>
                      <span className="font-mono">-{formatMAD(simTotalCOGS)}</span>
                    </div>

                    <div className="flex justify-between text-rose-400">
                      <span>- Budget Ads (TikTok / Meta) :</span>
                      <span className="font-mono">-{formatMAD(simTotalAdSpend)}</span>
                    </div>

                    <div className="flex justify-between text-rose-400">
                      <span>- Frais Livraison & Emballages :</span>
                      <span className="font-mono">-{formatMAD(simTotalDeliveryShipping)}</span>
                    </div>

                    <div className="flex justify-between text-rose-400">
                      <span>- Charges Fixes & Logiciels :</span>
                      <span className="font-mono">-{formatMAD(simFixedCharges)}</span>
                    </div>

                    <div className="flex justify-between text-emerald-300 pt-2 border-t border-neutral-800">
                      <span className="flex items-center gap-1.5">
                        <Target size={12} className="text-emerald-400" />
                        <span>Objectif Mensuel Fixé :</span>
                      </span>
                      <span className="font-mono text-white font-bold">
                        {formatMAD(monthlyRevenueGoal)} ({((simGrossRevenue / (monthlyRevenueGoal || 1)) * 100).toFixed(0)}% atteint)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <span className="text-[11px] text-emerald-300 block font-semibold uppercase tracking-wider">
                    BÉNÉFICE NET MENSUEL ESTIMÉ
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-emerald-400 mt-1 font-mono">
                    {formatMAD(simNetProfit)}
                  </div>
                  <span className="text-[11px] text-neutral-400 mt-1 block">
                    Marge nette estimée : <strong>{simMarginPercent}%</strong> • Dividendes par associé : <strong>{formatMAD(simNetProfit / 2)}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: P&L STATEMENT (Compte de Résultat Simplifié) */}
      {activeTab === 'PNL_STATEMENT' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-2xs">
            <div className="p-5 border-b border-neutral-200 bg-neutral-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
                  Compte de Résultat d'Exploitation (P&L NAY Parfums)
                </h3>
                <p className="text-xs text-neutral-500">Période : {dateRange === 0 ? 'Toute la période' : `Derniers ${dateRange} jours`}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={exportCsvPnL}
                  className="px-3.5 py-2 bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                >
                  <Download size={13} />
                  <span>Exporter CSV</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-2 bg-neutral-900 hover:bg-black text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                >
                  <Printer size={13} />
                  <span>Imprimer P&L</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-6">Poste Financier</th>
                    <th className="py-3 px-6 text-right">Montant (MAD)</th>
                    <th className="py-3 px-6 text-right">% du Chiffre d'Affaires</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-neutral-800">
                  <tr className="bg-neutral-50/40 font-bold">
                    <td className="py-3 px-6 text-neutral-900">1. Chiffre d'Affaires Brut (Ventes Encaissées)</td>
                    <td className="py-3 px-6 text-right font-mono text-neutral-900">{formatMAD(grossRevenue)}</td>
                    <td className="py-3 px-6 text-right font-mono">100.0%</td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-6 pl-10 text-neutral-600">- Coût des Marchandises Vendues (COGS Achat ~32%)</td>
                    <td className="py-2.5 px-6 text-right font-mono text-rose-600">-{formatMAD(estimatedCOGS)}</td>
                    <td className="py-2.5 px-6 text-right font-mono text-neutral-500">-32.0%</td>
                  </tr>

                  <tr className="bg-emerald-50/30 font-bold">
                    <td className="py-3 px-6 text-emerald-950">2. MARGE BRUTE COMMERCIALE</td>
                    <td className="py-3 px-6 text-right font-mono text-emerald-800">{formatMAD(grossProfit)}</td>
                    <td className="py-3 px-6 text-right font-mono text-emerald-800">
                      {((grossProfit / (grossRevenue || 1)) * 100).toFixed(1)}%
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-6 pl-10 text-neutral-600">- Dépenses Publicitaires (TikTok, Meta, Google Ads)</td>
                    <td className="py-2.5 px-6 text-right font-mono text-rose-600">-{formatMAD(adSpendTotal)}</td>
                    <td className="py-2.5 px-6 text-right font-mono text-neutral-500">
                      -{((adSpendTotal / (grossRevenue || 1)) * 100).toFixed(1)}%
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-6 pl-10 text-neutral-600">- Commissions Ambassadeurs & Influenceurs VIP</td>
                    <td className="py-2.5 px-6 text-right font-mono text-rose-600">-{formatMAD(totalInfluencerCommissions)}</td>
                    <td className="py-2.5 px-6 text-right font-mono text-neutral-500">
                      -{((totalInfluencerCommissions / (grossRevenue || 1)) * 100).toFixed(1)}%
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-6 pl-10 text-neutral-600 flex items-center gap-1.5">
                      <span>- Achats Stock & Fournisseurs (Bons de Commande)</span>
                    </td>
                    <td className="py-2.5 px-6 text-right font-mono text-rose-600">
                      -{formatMAD(expensesByCategory['SUPPLIES'] || 0)}
                    </td>
                    <td className="py-2.5 px-6 text-right font-mono text-neutral-500">
                      -{((((expensesByCategory['SUPPLIES'] || 0)) / (grossRevenue || 1)) * 100).toFixed(1)}%
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-6 pl-10 text-neutral-600">- Frais Logistiques & Emballages (Packaging Luxe)</td>
                    <td className="py-2.5 px-6 text-right font-mono text-rose-600">
                      -{formatMAD((expensesByCategory['LOGISTICS'] || 0) + (expensesByCategory['PACKAGING'] || 0))}
                    </td>
                    <td className="py-2.5 px-6 text-right font-mono text-neutral-500">
                      -{((((expensesByCategory['LOGISTICS'] || 0) + (expensesByCategory['PACKAGING'] || 0)) / (grossRevenue || 1)) * 100).toFixed(1)}%
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-6 pl-10 text-neutral-600">- Masse Salariale & Salaires Fixes</td>
                    <td className="py-2.5 px-6 text-right font-mono text-rose-600">-{formatMAD(expensesByCategory['SALARY'] || 0)}</td>
                    <td className="py-2.5 px-6 text-right font-mono text-neutral-500">
                      -{(((expensesByCategory['SALARY'] || 0) / (grossRevenue || 1)) * 100).toFixed(1)}%
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-6 pl-10 text-neutral-600">- Hébergement Web, Vercel & Outils SaaS</td>
                    <td className="py-2.5 px-6 text-right font-mono text-rose-600">
                      -{formatMAD((expensesByCategory['HOSTING'] || 0) + (expensesByCategory['TOOLS'] || 0))}
                    </td>
                    <td className="py-2.5 px-6 text-right font-mono text-neutral-500">
                      -{((((expensesByCategory['HOSTING'] || 0) + (expensesByCategory['TOOLS'] || 0)) / (grossRevenue || 1)) * 100).toFixed(1)}%
                    </td>
                  </tr>

                  <tr className="bg-neutral-900 text-white font-black text-sm">
                    <td className="py-4 px-6">3. RÉSULTAT NET RÉEL (BÉNÉFICE NET / EBITDA)</td>
                    <td className="py-4 px-6 text-right font-mono text-emerald-400">{formatMAD(netRevenue)}</td>
                    <td className="py-4 px-6 text-right font-mono text-emerald-400">{netMargin.toFixed(1)}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: EXPENSES & INVOICES (Gestion des Charges & Factures Professionnelle) */}
      {activeTab === 'EXPENSES' && (
        <div className="space-y-6">
          {/* Header Banner & Global Actions */}
          <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-800 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-neutral-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Comptabilité & Trésorerie
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-white/10 text-neutral-300 border border-white/10">
                  {filteredEnrichedExpenses.length} facture(s) répertoriée(s)
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
                <Receipt className="text-emerald-400" size={26} />
                <span>Registre des Charges & Factures Fournisseurs</span>
              </h2>
              <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed">
                Suivi rigoureux des décaissements, gestion des échéances de paiement, traçabilité des règlements par associé et centralisation des pièces justificatives certifiées.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={handleExportExpensesCSV}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/15 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
              >
                <FileSpreadsheet size={15} className="text-emerald-400" />
                <span>Exporter Registre CSV</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFormTitle('');
                  setFormVendor('');
                  setFormInvoiceNumber('');
                  setFormAmount('');
                  setFormDescription('');
                  setFormReceiptUrl('');
                  setFormReceiptFileName('');
                  setFormStatus('PAID');
                  setFormDueDate('');
                  setFormDate(new Date().toISOString().split('T')[0]);
                  setIsAddExpenseModalOpen(true);
                }}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-md hover:shadow-lg cursor-pointer"
              >
                <Plus size={16} />
                <span>Enregistrer une Facture</span>
              </button>
            </div>
          </div>

          {/* 5-Card Executive KPI Ribbon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Card 1: Paid Total */}
            <div className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-2xs hover:border-emerald-300 transition-all">
              <div className="flex items-center justify-between text-neutral-500 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-600">Total Réglé</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 size={16} />
                </div>
              </div>
              <div className="text-xl font-black text-neutral-900 font-mono tracking-tight">
                {formatMAD(expenseKpis.totalPaid)}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
                <ShieldCheck size={12} />
                <span>Factures acquittées</span>
              </div>
            </div>

            {/* Card 2: Pending Invoices */}
            <div className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-2xs hover:border-amber-300 transition-all">
              <div className="flex items-center justify-between text-neutral-500 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-600">À Régler</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock size={16} />
                </div>
              </div>
              <div className="text-xl font-black text-amber-700 font-mono tracking-tight">
                {formatMAD(expenseKpis.totalPending)}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-amber-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block animate-pulse"></span>
                <span>{expenseKpis.countPending} facture(s) en attente</span>
              </div>
            </div>

            {/* Card 3: Overdue Invoices */}
            <div className={`rounded-2xl p-4 border transition-all ${
              expenseKpis.countOverdue > 0
                ? 'bg-rose-50/50 border-rose-300 shadow-2xs'
                : 'bg-white border-neutral-200/80 shadow-2xs'
            }`}>
              <div className="flex items-center justify-between text-neutral-500 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-600">En Retard</span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  expenseKpis.countOverdue > 0 ? 'bg-rose-100 text-rose-700' : 'bg-neutral-100 text-neutral-400'
                }`}>
                  <AlertTriangle size={16} />
                </div>
              </div>
              <div className={`text-xl font-black font-mono tracking-tight ${
                expenseKpis.countOverdue > 0 ? 'text-rose-700' : 'text-neutral-900'
              }`}>
                {formatMAD(expenseKpis.totalOverdue)}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-rose-700">
                {expenseKpis.countOverdue > 0 ? (
                  <span>⚠️ {expenseKpis.countOverdue} facture(s) échue(s)</span>
                ) : (
                  <span className="text-neutral-400">Aucun retard de paiement</span>
                )}
              </div>
            </div>

            {/* Card 4: Recurring Monthly */}
            <div className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-2xs hover:border-sky-300 transition-all">
              <div className="flex items-center justify-between text-neutral-500 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-600">Abonnements SaaS</span>
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                  <RefreshCw size={15} />
                </div>
              </div>
              <div className="text-xl font-black text-neutral-900 font-mono tracking-tight">
                ~{formatMAD(expenseKpis.recurringMonthly)}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-sky-700 font-medium">
                <Layers size={12} />
                <span>Charges fixes par mois</span>
              </div>
            </div>

            {/* Card 5: Receipts Compliance Rate */}
            <div className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-2xs hover:border-purple-300 transition-all">
              <div className="flex items-center justify-between text-neutral-500 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-600">Justificatifs</span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Paperclip size={15} />
                </div>
              </div>
              <div className="text-xl font-black text-neutral-900 font-mono tracking-tight">
                {expenseKpis.receiptRate}%
              </div>
              <div className="mt-1 text-[11px] text-neutral-500 font-medium flex items-center gap-1">
                <div className="flex-1 bg-neutral-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-purple-600 h-full rounded-full transition-all"
                    style={{ width: `${expenseKpis.receiptRate}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono">{expenseKpis.withReceiptCount}/{enrichedExpenses.length}</span>
              </div>
            </div>
          </div>

          {/* Quick Status Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              type="button"
              onClick={() => setExpenseStatusFilter('ALL')}
              className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                expenseStatusFilter === 'ALL'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-white hover:bg-neutral-100 text-neutral-600 border border-neutral-200'
              }`}
            >
              <span>Toutes les charges</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                expenseStatusFilter === 'ALL' ? 'bg-neutral-800 text-neutral-200' : 'bg-neutral-100 text-neutral-600'
              }`}>
                {enrichedExpenses.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setExpenseStatusFilter('PAID')}
              className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                expenseStatusFilter === 'PAID'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white hover:bg-emerald-50 text-emerald-800 border border-neutral-200'
              }`}
            >
              <CheckCircle2 size={13} />
              <span>Réglées / Payées</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                expenseStatusFilter === 'PAID' ? 'bg-emerald-800 text-emerald-100' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {enrichedExpenses.filter(e => e.status === 'PAID').length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setExpenseStatusFilter('PENDING')}
              className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                expenseStatusFilter === 'PENDING'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white hover:bg-amber-50 text-amber-800 border border-neutral-200'
              }`}
            >
              <Clock size={13} />
              <span>À Payer (En attente)</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                expenseStatusFilter === 'PENDING' ? 'bg-amber-700 text-amber-100' : 'bg-amber-100 text-amber-800'
              }`}>
                {expenseKpis.countPending}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setExpenseStatusFilter('OVERDUE')}
              className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                expenseStatusFilter === 'OVERDUE'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white hover:bg-rose-50 text-rose-700 border border-neutral-200'
              }`}
            >
              <AlertTriangle size={13} />
              <span>En Retard</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                expenseStatusFilter === 'OVERDUE' ? 'bg-rose-700 text-rose-100' : 'bg-rose-100 text-rose-700'
              }`}>
                {expenseKpis.countOverdue}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setExpenseStatusFilter('RECURRING')}
              className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                expenseStatusFilter === 'RECURRING'
                  ? 'bg-sky-700 text-white shadow-xs'
                  : 'bg-white hover:bg-sky-50 text-sky-800 border border-neutral-200'
              }`}
            >
              <RefreshCw size={13} />
              <span>Abonnements Récurrents</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                expenseStatusFilter === 'RECURRING' ? 'bg-sky-800 text-sky-100' : 'bg-sky-100 text-sky-800'
              }`}>
                {enrichedExpenses.filter(e => e.recurring === 'MONTHLY' || e.recurring === 'ANNUAL').length}
              </span>
            </button>
          </div>

          {/* Filters Bar: Search & Category */}
          <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-96">
              <Search size={14} className="absolute left-3.5 top-3 text-neutral-400" />
              <input
                type="text"
                value={expenseSearch}
                onChange={(e) => setExpenseSearch(e.target.value)}
                placeholder="Rechercher par intitulé, fournisseur, réf facture, payé par..."
                className="w-full pl-9 pr-3 py-2 border border-neutral-200 rounded-xl text-xs bg-neutral-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium">
                <Filter size={13} />
                <span>Catégorie :</span>
              </div>
              <select
                value={expenseCategoryFilter}
                onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-neutral-200 rounded-xl text-xs bg-white w-full sm:w-auto font-semibold text-neutral-800 focus:outline-hidden focus:ring-2 focus:ring-neutral-900/10 cursor-pointer"
              >
                <option value="ALL">Toutes les catégories</option>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>

              {(expenseSearch || expenseCategoryFilter !== 'ALL' || expenseStatusFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setExpenseSearch('');
                    setExpenseCategoryFilter('ALL');
                    setExpenseStatusFilter('ALL');
                  }}
                  className="px-2.5 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer"
                  title="Réinitialiser les filtres"
                >
                  Effacer
                </button>
              )}
            </div>
          </div>

          {/* Enriched Expenses & Invoices Table */}
          <div className="bg-white rounded-3xl border border-neutral-200/90 overflow-hidden shadow-2xs">
            <div className="p-4 sm:p-5 border-b border-neutral-200 bg-neutral-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                  <FileText size={15} className="text-neutral-600" />
                  <span>Grand Livre des Dépenses & Factures Fournisseurs</span>
                </h3>
                <span className="text-[11px] text-neutral-500 mt-0.5 block">
                  Affichage de {filteredEnrichedExpenses.length} facture(s) sur {enrichedExpenses.length} au total
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 rounded-xl bg-white border border-neutral-200 shadow-2xs text-xs font-mono">
                  <span className="text-neutral-400 mr-1.5">Sous-total :</span>
                  <strong className="text-neutral-900 font-bold">
                    {formatMAD(filteredEnrichedExpenses.reduce((sum, e) => sum + e.amount, 0))}
                  </strong>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200 text-[11px] font-bold text-neutral-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Date & Échéance</th>
                    <th className="py-3 px-4">Fournisseur & Réf</th>
                    <th className="py-3 px-4">Intitulé & Catégorie</th>
                    <th className="py-3 px-4">Statut Facture</th>
                    <th className="py-3 px-4">Payé Par & Compte</th>
                    <th className="py-3 px-4 text-right">Montant (MAD)</th>
                    <th className="py-3 px-4 text-center">Justificatif</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-neutral-800">
                  {filteredEnrichedExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-14 text-center">
                        <div className="max-w-xs mx-auto space-y-3">
                          <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
                            <Receipt size={24} />
                          </div>
                          <div>
                            <p className="font-bold text-neutral-800 text-sm">Aucune charge trouvée</p>
                            <p className="text-xs text-neutral-400 mt-0.5">
                              {expenseSearch || expenseCategoryFilter !== 'ALL' || expenseStatusFilter !== 'ALL'
                                ? 'Modifiez vos critères de recherche ou réinitialisez les filtres.'
                                : 'Commencez par enregistrer une première facture fournisseur.'}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredEnrichedExpenses.map((exp) => {
                      const statusCfg = EXPENSE_STATUS_CONFIG[exp.status] || EXPENSE_STATUS_CONFIG.PAID;
                      const hasReceipt = Boolean(exp.receiptUrl);

                      return (
                        <tr key={exp.id} className="hover:bg-neutral-50/80 transition-colors group">
                          {/* Col 1: Date & Due Date */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="font-bold text-neutral-900 font-mono">
                              {new Date(exp.date).toLocaleDateString('fr-FR')}
                            </div>
                            {exp.status === 'PAID' ? (
                              <div className="text-[10px] text-emerald-700 font-medium mt-0.5 flex items-center gap-1">
                                <Check size={10} />
                                <span>Réglée {exp.paidAt ? `le ${new Date(exp.paidAt).toLocaleDateString('fr-FR')}` : ''}</span>
                              </div>
                            ) : exp.status === 'OVERDUE' ? (
                              <div className="text-[10px] text-rose-700 font-bold mt-0.5 flex items-center gap-1">
                                <AlertTriangle size={10} />
                                <span>Échue ({exp.daysRemaining ? `${Math.abs(exp.daysRemaining)}j retard` : 'En retard'})</span>
                              </div>
                            ) : (
                              <div className="text-[10px] text-amber-700 font-medium mt-0.5 flex items-center gap-1">
                                <Clock size={10} />
                                <span>{exp.dueDate ? `Échéance ${new Date(exp.dueDate).toLocaleDateString('fr-FR')}` : 'À régler'}</span>
                              </div>
                            )}
                          </td>

                          {/* Col 2: Vendor & Invoice Number */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-neutral-100 border border-neutral-200 text-neutral-700 flex items-center justify-center shrink-0">
                                <Building2 size={13} />
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-neutral-900 truncate">
                                  {exp.vendor}
                                </div>
                                <div className="text-[10px] font-mono text-neutral-500 bg-neutral-100 px-1.5 py-0.2 rounded inline-block mt-0.5">
                                  {exp.invoiceNumber}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Col 3: Title & Category */}
                          <td className="py-3.5 px-4 max-w-[240px]">
                            <div className="font-semibold text-neutral-900 truncate" title={exp.title}>
                              {exp.title}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-neutral-100 text-neutral-800 border border-neutral-200/80">
                                {EXPENSE_CATEGORIES.find((c) => c.id === exp.category)?.label || exp.category}
                              </span>

                              {exp.recurring && exp.recurring !== 'ONE_TIME' && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-1">
                                  <RefreshCw size={9} />
                                  <span>{exp.recurring === 'MONTHLY' ? 'Mensuel' : 'Annuel'}</span>
                                </span>
                              )}
                            </div>
                            {exp.cleanNotes && (
                              <p className="text-[10px] text-neutral-400 mt-0.5 truncate max-w-[200px]" title={exp.cleanNotes}>
                                {exp.cleanNotes}
                              </p>
                            )}
                          </td>

                          {/* Col 4: Invoice Status with 1-Click Toggle */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex flex-col items-start gap-1">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`}></span>
                                <span>{statusCfg.label}</span>
                              </span>

                              {/* 1-Click Status Quick Switch */}
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(exp)}
                                className="text-[10px] font-semibold text-neutral-500 hover:text-neutral-900 underline underline-offset-2 transition-colors cursor-pointer flex items-center gap-1 opacity-70 group-hover:opacity-100"
                                title={exp.status === 'PAID' ? 'Marquer comme À Payer' : 'Marquer comme Réglée'}
                              >
                                {exp.status === 'PAID' ? (
                                  <>
                                    <Clock size={10} className="text-amber-600" />
                                    <span>Remettre en attente</span>
                                  </>
                                ) : (
                                  <>
                                    <Check size={10} className="text-emerald-600" />
                                    <span>Marquer comme Réglée</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </td>

                          {/* Col 5: Paid By & Account */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center text-[10px] font-bold uppercase">
                                {(exp.paidBy || 'A')[0]}
                              </div>
                              <div>
                                <span className="font-bold text-neutral-900 block text-[11px]">
                                  {exp.paidBy || 'Ayoub Ait Yahya'}
                                </span>
                                <span className="text-[10px] text-neutral-500 flex items-center gap-1">
                                  <CreditCard size={10} className="text-neutral-400" />
                                  <span>
                                    {PAYMENT_METHOD_OPTIONS.find((p) => p.id === exp.paymentMethod)?.label.split('(')[0] || exp.paymentMethod}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Col 6: Amount in MAD */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="font-black text-rose-700 font-mono text-sm">
                              -{formatMAD(exp.amount)}
                            </div>
                            <span className="text-[10px] text-neutral-400 block">TTC Encaissé</span>
                          </td>

                          {/* Col 7: Receipt Viewer Button */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            {hasReceipt ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveReceiptModal({
                                    url: exp.receiptUrl!,
                                    title: exp.title,
                                    vendor: exp.vendor,
                                    amount: exp.amount,
                                    invoiceNumber: exp.invoiceNumber,
                                  })
                                }
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg font-bold text-[11px] transition-colors cursor-pointer shadow-2xs"
                                title="Voir le justificatif"
                              >
                                <Eye size={12} />
                                <span>Voir Pièce</span>
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-neutral-400 text-[10px] italic">
                                <span>Sans pièce</span>
                              </span>
                            )}
                          </td>

                          {/* Col 8: Actions */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditModal(exp)}
                                className="p-1.5 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                                title="Modifier la facture"
                              >
                                <Edit3 size={14} />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteExpense(exp.id, exp.title)}
                                className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Supprimer définitivement"
                              >
                                <Trash2 size={14} />
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
        </div>
      )}

      {/* MODAL: ADD EXPENSE & INVOICE (Création enrichie avec métadonnées) */}
      {isAddExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-neutral-200 overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-2xs">
                  <Receipt size={20} className="text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-bold text-neutral-900 text-sm">
                    Enregistrer une Charge ou Facture Fournisseur
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Complétez les informations pour la tenue comptable et le suivi des échéances
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddExpenseModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleCreateExpense} className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
              {/* Row 1: Title */}
              <div>
                <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1 text-[11px]">
                  Intitulé de la Prestation / Dépense *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => {
                    setFormTitle(e.target.value);
                    if (!formVendor) {
                      setFormVendor(extractVendorFromTitle(e.target.value));
                    }
                  }}
                  placeholder="Ex: Campagne TikTok Ads Mars, Cartons 50ml NAY, Hébergement Hostinger..."
                  className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              {/* Row 2: Vendor & Invoice Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1 text-[11px]">
                    Fournisseur / Prestataire *
                  </label>
                  <input
                    type="text"
                    required
                    value={formVendor}
                    onChange={(e) => setFormVendor(e.target.value)}
                    placeholder="Ex: Hostinger, Meta Ads, Cartonnerie..."
                    className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                  {/* Quick Suggestions Chips */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {QUICK_VENDOR_SUGGESTIONS.slice(0, 4).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setFormVendor(v)}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 cursor-pointer"
                      >
                        {v.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1 text-[11px]">
                    N° Facture / Référence Pièce
                  </label>
                  <input
                    type="text"
                    value={formInvoiceNumber}
                    onChange={(e) => setFormInvoiceNumber(e.target.value)}
                    placeholder="Ex: FAC-2024-001, HOST-8921..."
                    className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl font-mono uppercase focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                  <span className="text-[10px] text-neutral-400 mt-1 block">
                    Générée automatiquement si laissée vide
                  </span>
                </div>
              </div>

              {/* Row 3: Amount & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1 text-[11px]">
                    Montant Décaissé (MAD) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      step="0.5"
                      min="0"
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      placeholder="Ex: 1500"
                      className="w-full pl-3.5 pr-14 py-2.5 border border-neutral-200 rounded-xl font-mono font-black text-sm text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-xs font-bold text-neutral-400">
                      MAD
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1 text-[11px]">
                    Catégorie Comptable *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl bg-white font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 4: Status Selector (Paid vs Pending) */}
              <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-neutral-900 uppercase tracking-wider text-[11px] block">
                    Statut du Paiement
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFormStatus('PAID')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        formStatus === 'PAID'
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-white text-neutral-600 border border-neutral-200'
                      }`}
                    >
                      ✓ Déjà Réglée (Payée)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormStatus('PENDING')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        formStatus === 'PENDING'
                          ? 'bg-amber-600 text-white shadow-2xs'
                          : 'bg-white text-neutral-600 border border-neutral-200'
                      }`}
                    >
                      ⏳ À Régler (En attente)
                    </button>
                  </div>
                </div>

                {formStatus === 'PAID' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-neutral-200/60">
                    <div>
                      <label className="block font-medium text-neutral-600 mb-1 text-[11px]">
                        Payé Par (Associé / Responsable)
                      </label>
                      <input
                        type="text"
                        value={formPaidBy}
                        onChange={(e) => setFormPaidBy(e.target.value)}
                        placeholder="Ex: Ayoub Ait Yahya, Nouamane..."
                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-neutral-600 mb-1 text-[11px]">
                        Date d'Acquittement
                      </label>
                      <input
                        type="date"
                        value={formPaidAt}
                        onChange={(e) => setFormPaidAt(e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg bg-white"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="pt-1 border-t border-neutral-200/60">
                    <label className="block font-medium text-neutral-600 mb-1 text-[11px]">
                      Date Limite d'Échéance *
                    </label>
                    <input
                      type="date"
                      required
                      value={formDueDate}
                      onChange={(e) => setFormDueDate(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Row 5: Payment Method & Recurring */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1 text-[11px]">
                    Canal de Règlement
                  </label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl bg-white focus:outline-hidden cursor-pointer"
                  >
                    {PAYMENT_METHOD_OPTIONS.map((m) => (
                      <option key={m.id} value={m.id}>{m.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1 text-[11px]">
                    Type de Récurrence
                  </label>
                  <select
                    value={formRecurring}
                    onChange={(e) => setFormRecurring(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl bg-white focus:outline-hidden cursor-pointer"
                  >
                    <option value="ONE_TIME">Ponctuelle (Achat unique)</option>
                    <option value="MONTHLY">Abonnement Mensuel Récurrent</option>
                    <option value="ANNUAL">Abonnement Annuel</option>
                  </select>
                </div>
              </div>

              {/* Row 6: Receipt File Upload */}
              <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2">
                <label className="block font-bold text-neutral-900 uppercase tracking-wider text-[11px]">
                  Pièce Justificative / Facture PDF / Photo du Reçu
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f);
                  }}
                  accept="image/*,application/pdf"
                  className="hidden"
                />

                {formReceiptUrl ? (
                  <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-neutral-200 shadow-2xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <Paperclip size={14} className="text-emerald-600 shrink-0" />
                      <span className="text-xs font-mono font-medium truncate">
                        {formReceiptFileName || 'Justificatif joint'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={formReceiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-sky-600 hover:underline"
                      >
                        Voir
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          setFormReceiptUrl('');
                          setFormReceiptFileName('');
                        }}
                        className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                      >
                        Retirer
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingReceipt}
                    className="w-full py-2.5 bg-white hover:bg-neutral-100 text-neutral-700 border border-dashed border-neutral-300 rounded-xl font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <UploadCloud size={15} className="text-neutral-500" />
                    <span>{isUploadingReceipt ? 'Téléversement en cours...' : 'Téléverser la facture (PDF, PNG, JPG)'}</span>
                  </button>
                )}
              </div>

              {/* Row 7: Notes */}
              <div>
                <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1 text-[11px]">
                  Notes Comptables & Commentaire Interne
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Notes sur la commande, bon de livraison, accord d'équipe..."
                  className="w-full px-3.5 py-2 border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseModalOpen(false)}
                  className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={formLoading || isUploadingReceipt}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs hover:shadow transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {formLoading ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} />
                      <span>Enregistrer la Facture</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT EXPENSE & INVOICE */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-neutral-200 overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-800 flex items-center justify-center shadow-2xs">
                  <Edit3 size={20} className="text-sky-700" />
                </div>
                <div>
                  <h3 className="font-bold text-neutral-900 text-sm">
                    Modifier la Facture : {editingExpense.title}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Réf : {editingExpense.invoiceNumber} • Fournisseur : {editingExpense.vendor}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingExpense(null)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleUpdateExpense} className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
              <div>
                <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1 text-[11px]">
                  Intitulé de la Prestation *
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl font-medium focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1 text-[11px]">
                    Fournisseur / Prestataire *
                  </label>
                  <input
                    type="text"
                    required
                    value={editVendor}
                    onChange={(e) => setEditVendor(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1 text-[11px]">
                    N° Facture / Référence
                  </label>
                  <input
                    type="text"
                    value={editInvoiceNumber}
                    onChange={(e) => setEditInvoiceNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl font-mono uppercase focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1 text-[11px]">
                    Montant Décaissé (MAD) *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.5"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl font-mono font-black text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1 text-[11px]">
                    Catégorie Comptable *
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl bg-white font-semibold cursor-pointer"
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status Section */}
              <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-neutral-900 uppercase tracking-wider text-[11px]">
                    Statut du Paiement
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditStatus('PAID')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        editStatus === 'PAID'
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-white text-neutral-600 border border-neutral-200'
                      }`}
                    >
                      ✓ Réglée (Payée)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditStatus('PENDING')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        editStatus === 'PENDING'
                          ? 'bg-amber-600 text-white shadow-2xs'
                          : 'bg-white text-neutral-600 border border-neutral-200'
                      }`}
                    >
                      ⏳ À Régler (En attente)
                    </button>
                  </div>
                </div>

                {editStatus === 'PAID' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-neutral-200/60">
                    <div>
                      <label className="block font-medium text-neutral-600 mb-1 text-[11px]">
                        Payé Par
                      </label>
                      <input
                        type="text"
                        value={editPaidBy}
                        onChange={(e) => setEditPaidBy(e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-neutral-600 mb-1 text-[11px]">
                        Date d'Acquittement
                      </label>
                      <input
                        type="date"
                        value={editPaidAt}
                        onChange={(e) => setEditPaidAt(e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg bg-white"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="pt-1 border-t border-neutral-200/60">
                    <label className="block font-medium text-neutral-600 mb-1 text-[11px]">
                      Date Limite d'Échéance
                    </label>
                    <input
                      type="date"
                      value={editDueDate}
                      onChange={(e) => setEditDueDate(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Channel & Recurrence */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1 text-[11px]">
                    Canal de Règlement
                  </label>
                  <select
                    value={editPaymentMethod}
                    onChange={(e) => setEditPaymentMethod(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl bg-white cursor-pointer"
                  >
                    {PAYMENT_METHOD_OPTIONS.map((m) => (
                      <option key={m.id} value={m.id}>{m.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1 text-[11px]">
                    Type de Récurrence
                  </label>
                  <select
                    value={editRecurring}
                    onChange={(e) => setEditRecurring(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl bg-white cursor-pointer"
                  >
                    <option value="ONE_TIME">Ponctuelle (Achat unique)</option>
                    <option value="MONTHLY">Abonnement Mensuel Récurrent</option>
                    <option value="ANNUAL">Abonnement Annuel</option>
                  </select>
                </div>
              </div>

              {/* Receipt File */}
              <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2">
                <label className="block font-bold text-neutral-900 uppercase tracking-wider text-[11px]">
                  Pièce Justificative (PDF ou Image)
                </label>
                <input
                  type="file"
                  ref={editFileInputRef}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleEditFileUpload(f);
                  }}
                  accept="image/*,application/pdf"
                  className="hidden"
                />

                {editReceiptUrl ? (
                  <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-neutral-200 shadow-2xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <Paperclip size={14} className="text-emerald-600 shrink-0" />
                      <span className="text-xs font-mono font-medium truncate">
                        {editReceiptFileName || 'Justificatif joint'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={editReceiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-sky-600 hover:underline"
                      >
                        Voir
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          setEditReceiptUrl('');
                          setEditReceiptFileName('');
                        }}
                        className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                      >
                        Retirer
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => editFileInputRef.current?.click()}
                    disabled={isUploadingReceipt}
                    className="w-full py-2.5 bg-white hover:bg-neutral-100 text-neutral-700 border border-dashed border-neutral-300 rounded-xl font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <UploadCloud size={15} className="text-neutral-500" />
                    <span>{isUploadingReceipt ? 'Téléversement...' : 'Remplacer ou ajouter un justificatif'}</span>
                  </button>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1 text-[11px]">
                  Notes Comptables
                </label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3.5 py-2 border border-neutral-200 rounded-xl focus:outline-hidden"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isEditingLoading || isUploadingReceipt}
                  className="flex-1 py-2.5 bg-neutral-900 hover:bg-black text-white rounded-xl font-bold shadow-xs hover:shadow transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isEditingLoading ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Mise à jour...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} />
                      <span>Enregistrer les Modifications</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: INTERACTIVE RECEIPT VIEWER */}
      {activeReceiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-neutral-200 bg-neutral-50/80 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                  <FileText size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-neutral-900 text-sm truncate">
                    Justificatif : {activeReceiptModal.title}
                  </h3>
                  <p className="text-xs text-neutral-500 truncate">
                    {activeReceiptModal.vendor && <span>Fournisseur : {activeReceiptModal.vendor} • </span>}
                    {activeReceiptModal.invoiceNumber && <span>Réf : {activeReceiptModal.invoiceNumber} • </span>}
                    {activeReceiptModal.amount && <strong className="text-neutral-800">{formatMAD(activeReceiptModal.amount)}</strong>}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={activeReceiptModal.url}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="px-3 py-1.5 bg-neutral-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ExternalLink size={13} />
                  <span>Ouvrir / Télécharger</span>
                </a>
                <button
                  type="button"
                  onClick={() => setActiveReceiptModal(null)}
                  className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/80 rounded-xl transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Viewer Body */}
            <div className="flex-1 bg-neutral-900/5 p-4 overflow-auto flex items-center justify-center min-h-[420px]">
              {activeReceiptModal.url.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={activeReceiptModal.url}
                  className="w-full h-[550px] rounded-2xl border border-neutral-200 bg-white"
                  title="Aperçu PDF de la facture"
                />
              ) : (
                <div className="relative max-w-full max-h-[550px] overflow-hidden rounded-2xl shadow-md border border-neutral-200 bg-white p-2">
                  <img
                    src={activeReceiptModal.url}
                    alt={activeReceiptModal.title}
                    className="max-h-[520px] max-w-full object-contain rounded-xl mx-auto"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CUSTOMIZE MONTHLY REVENUE GOAL */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-300/60 flex items-center justify-center text-emerald-800 shadow-2xs">
                  <Target size={22} className="text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900">
                    Définir l'Objectif Mensuel NAY
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Choisissez ou personnalisez le chiffre d'affaires cible pour le suivi financier
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGoalModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="py-5 space-y-5">
              {/* Presets Grid */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2.5">
                  1. Choix Rapide par Palier Stratégique
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {GOAL_PRESETS.map((preset) => {
                    const isSelected = Number(customGoalInput) === preset.value;
                    return (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setCustomGoalInput(String(preset.value))}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                          isSelected
                            ? 'bg-emerald-50/90 border-emerald-500 shadow-xs ring-2 ring-emerald-400/20'
                            : 'bg-white border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                            isSelected ? 'bg-emerald-200/80 text-emerald-900' : 'bg-neutral-100 text-neutral-600'
                          }`}>
                            {preset.tag}
                          </span>
                          {isSelected && <CheckCircle2 size={14} className="text-emerald-600" />}
                        </div>
                        <div className="text-sm font-bold text-neutral-900 font-mono">
                          {preset.label}
                        </div>
                        <div className="text-[10px] text-neutral-400 mt-0.5 truncate">
                          {preset.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Input */}
              <div className="bg-neutral-50/80 p-4 rounded-2xl border border-neutral-200">
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                  2. Ou Saisir un Montant Personnalisé
                </label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                    <Banknote size={18} className="text-emerald-700" />
                  </div>
                  <input
                    type="number"
                    min="1000"
                    step="5000"
                    value={customGoalInput}
                    onChange={(e) => setCustomGoalInput(e.target.value)}
                    placeholder="Ex: 180000"
                    className="w-full pl-10 pr-16 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm font-bold text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-xs font-bold text-neutral-400">
                    MAD
                  </div>
                </div>

                {/* Quick adjustments */}
                <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                  <span className="text-[10px] text-neutral-400 font-medium">Ajustements :</span>
                  {[-50000, -10000, 10000, 50000].map((delta) => (
                    <button
                      key={delta}
                      type="button"
                      onClick={() => {
                        const cur = Number(customGoalInput) || 0;
                        setCustomGoalInput(String(Math.max(5000, cur + delta)));
                      }}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-700 transition-colors cursor-pointer"
                    >
                      {delta > 0 ? `+${delta / 1000}k` : `${delta / 1000}k`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Live Simulation Preview Cards */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                  Aperçu de la Progression avec cet Objectif
                </label>
                {(() => {
                  const targetMAD = Number(customGoalInput) || 1;
                  const percentAchieved = ((grossRevenue / targetMAD) * 100).toFixed(1);
                  const remainingMAD = Math.max(0, targetMAD - grossRevenue);
                  const dailyRunRate = Math.round(targetMAD / 30);
                  const estimatedOrders = Math.ceil(targetMAD / (avgOrderValue || 450));

                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-200/80">
                      <div className="bg-white p-2.5 rounded-xl border border-emerald-100 shadow-2xs">
                        <span className="text-[10px] text-neutral-400 font-medium block">Taux Atteint</span>
                        <span className="text-sm font-black text-emerald-700 font-mono">{percentAchieved}%</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-emerald-100 shadow-2xs">
                        <span className="text-[10px] text-neutral-400 font-medium block">Reste à faire</span>
                        <span className="text-xs font-bold text-neutral-800 font-mono mt-0.5 block">{formatMAD(remainingMAD)}</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-emerald-100 shadow-2xs">
                        <span className="text-[10px] text-neutral-400 font-medium block">Cible / jour</span>
                        <span className="text-xs font-bold text-neutral-800 font-mono mt-0.5 block">~{formatMAD(dailyRunRate)}</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-emerald-100 shadow-2xs">
                        <span className="text-[10px] text-neutral-400 font-medium block">Commandes requises</span>
                        <span className="text-xs font-bold text-neutral-800 font-mono mt-0.5 block">~{estimatedOrders} cmds</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-4 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setIsGoalModalOpen(false)}
                className="flex-1 py-2.5 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={isSavingGoal}
                onClick={() => handleSaveGoal()}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSavingGoal ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Enregistrement...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    <span>Enregistrer l'Objectif</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
