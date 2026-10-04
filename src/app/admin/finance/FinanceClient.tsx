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
  DollarSign, ShoppingBag, Users, HelpCircle
} from 'lucide-react';
import { formatMAD } from '@/lib/products';

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
};

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
  const [formCategory, setFormCategory] = useState('ADS');
  const [formAmount, setFormAmount] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formDescription, setFormDescription] = useState('');
  const [formPaymentMethod, setFormPaymentMethod] = useState('CREDIT_CARD');
  const [formRecurring, setFormRecurring] = useState('ONE_TIME');
  const [formReceiptUrl, setFormReceiptUrl] = useState('');
  const [formReceiptFileName, setFormReceiptFileName] = useState('');
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter state for Expenses tab
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('ALL');

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

  // Create Expense Submit
  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formAmount) {
      alert('Veuillez renseigner l\'intitulé et le montant de la charge.');
      return;
    }

    setFormLoading(true);
    try {
      const res = await fetch('/api/admin/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle,
          category: formCategory,
          amount: parseFloat(formAmount),
          date: formDate ? new Date(formDate).toISOString() : new Date().toISOString(),
          description: formDescription,
          paymentMethod: formPaymentMethod,
          recurring: formRecurring,
          receiptUrl: formReceiptUrl || null,
        }),
      });

      if (res.ok) {
        const newExpense = await res.json();
        setExpenses([newExpense, ...expenses]);
        setIsAddExpenseModalOpen(false);
        setFormTitle('');
        setFormAmount('');
        setFormDescription('');
        setFormReceiptUrl('');
        setFormReceiptFileName('');
        setFormDate(new Date().toISOString().split('T')[0]);
        showToast('Charge et justificatif enregistrés avec succès.');
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

      {/* TAB 6: EXPENSES & INVOICES (Gestion des Charges) */}
      {activeTab === 'EXPENSES' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search size={14} className="absolute left-3 top-3 text-neutral-400" />
              <input
                type="text"
                value={expenseSearch}
                onChange={(e) => setExpenseSearch(e.target.value)}
                placeholder="Rechercher une charge, facture..."
                className="w-full pl-9 pr-3 py-2 border border-neutral-200 rounded-xl text-xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={expenseCategoryFilter}
                onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-neutral-200 rounded-xl text-xs bg-white w-full sm:w-auto font-semibold text-neutral-700"
              >
                <option value="ALL">Toutes les catégories</option>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Expenses Table */}
          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-neutral-200 bg-neutral-50/50 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                Registre des Dépenses & Factures ({expenses.length})
              </h3>
              <span className="text-xs text-neutral-500">Total : {formatMAD(totalCharges)}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200 text-[11px] font-semibold text-neutral-600 uppercase">
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Intitulé</th>
                    <th className="py-2.5 px-4">Catégorie</th>
                    <th className="py-2.5 px-4">Montant</th>
                    <th className="py-2.5 px-4">Mode</th>
                    <th className="py-2.5 px-4 text-center">Justificatif</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-neutral-700">
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-neutral-400">
                        Aucune charge enregistrée. Cliquez sur "Ajouter une Charge" pour débuter.
                      </td>
                    </tr>
                  ) : (
                    expenses
                      .filter((e) => {
                        const matchCat = expenseCategoryFilter === 'ALL' || e.category === expenseCategoryFilter;
                        const matchSearch = e.title.toLowerCase().includes(expenseSearch.toLowerCase()) || (e.description || '').toLowerCase().includes(expenseSearch.toLowerCase());
                        return matchCat && matchSearch;
                      })
                      .map((exp) => (
                        <tr key={exp.id} className="hover:bg-neutral-50">
                          <td className="py-2.5 px-4 text-neutral-500">
                            {new Date(exp.date).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="font-bold text-neutral-900 block">{exp.title}</span>
                            {exp.description && <span className="text-[11px] text-neutral-400">{exp.description}</span>}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-neutral-100 text-neutral-800 border border-neutral-200">
                              {exp.category}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 font-bold text-rose-700 font-mono">
                            -{formatMAD(exp.amount)}
                          </td>
                          <td className="py-2.5 px-4 text-neutral-600">{exp.paymentMethod}</td>
                          <td className="py-2.5 px-4 text-center">
                            {exp.receiptUrl ? (
                              <a
                                href={exp.receiptUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-sky-600 hover:underline font-semibold text-[11px]"
                              >
                                <Eye size={12} />
                                <span>Reçu</span>
                              </a>
                            ) : (
                              <span className="text-neutral-400 text-xs">-</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <button
                              onClick={() => handleDeleteExpense(exp.id, exp.title)}
                              className="p-1.5 text-neutral-400 hover:text-rose-600 transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ADD EXPENSE MODAL */}
      {isAddExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-neutral-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="font-bold text-neutral-900 text-sm flex items-center gap-2">
                <Plus size={16} className="text-emerald-600" />
                <span>Enregistrer une Charge ou Facture</span>
              </h3>
              <button onClick={() => setIsAddExpenseModalOpen(false)} className="text-neutral-400 hover:text-neutral-600">✕</button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Intitulé de la Dépense *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ex: Campagne TikTok Ads Mars, Cartons & Pochons..."
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Montant (MAD) *</label>
                  <input
                    type="number"
                    required
                    step="0.5"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="Ex: 1500"
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Catégorie</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg bg-white"
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Receipt File Upload */}
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
                <label className="block font-semibold text-neutral-900">
                  Justificatif / Facture (PDF ou Image)
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
                  <div className="flex items-center justify-between p-2 bg-white rounded border border-neutral-300">
                    <span className="text-[11px] font-mono truncate max-w-[200px]">{formReceiptFileName || 'Justificatif joint'}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFormReceiptUrl('');
                        setFormReceiptFileName('');
                      }}
                      className="text-red-600 text-[11px] font-bold"
                    >
                      Supprimer
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingReceipt}
                    className="w-full py-2 bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200 rounded-lg font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <UploadCloud size={13} />
                    <span>{isUploadingReceipt ? 'Upload...' : 'Téléverser une facture / reçu'}</span>
                  </button>
                )}
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Notes comptables, fournisseur..."
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseModalOpen(false)}
                  className="flex-1 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={formLoading || isUploadingReceipt}
                  className="flex-1 py-2 bg-neutral-900 hover:bg-black text-white rounded-lg font-semibold shadow-xs disabled:opacity-50"
                >
                  {formLoading ? 'Enregistrement...' : 'Enregistrer la Charge'}
                </button>
              </div>
            </form>
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
