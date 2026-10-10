'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Mail,
  Users,
  Download,
  Copy,
  Check,
  Plus,
  Trash2,
  Search,
  Filter,
  Sparkles,
  Send,
  ExternalLink,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Crown,
  Target,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Clock,
  Layers,
  Inbox,
  UserCheck,
  UserPlus,
  Zap,
  Globe,
  Share2,
  X,
  ChevronDown
} from 'lucide-react';
import { formatMAD } from '@/lib/products';

interface EnrichedSubscriber {
  id: number;
  email: string;
  createdAt: string;
  domain: string;
  isCustomer: boolean;
  ordersCount: number;
  totalSpent: number;
  customerName: string | null;
  customerPhone: string | null;
  lastOrderDate: string | null;
  welcomeEmailSent?: boolean;
  welcomeEmailSentAt?: string | null;
  welcomeEmailStatus?: string | null;
  welcomeEmailError?: string | null;
}

export default function AdminNewsletter() {
  const [subscribers, setSubscribers] = useState<EnrichedSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'subscribers' | 'segments' | 'campaigns' | 'integrations'>('subscribers');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'customers' | 'leads' | 'recent' | 'sent' | 'pending'>('all');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [copiedSuccess, setCopiedSuccess] = useState<string | null>(null);

  // Email Dispatch State
  const [sendingEmailId, setSendingEmailId] = useState<number | null>(null);
  const [batchSending, setBatchSending] = useState(false);
  const [sendFeedback, setSendFeedback] = useState<{ id?: number; text: string; type: 'success' | 'error' } | null>(null);
  const [testEmailTarget, setTestEmailTarget] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Add Subscriber Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [sendWelcomeOnAdd, setSendWelcomeOnAdd] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState('');

  // Delete State
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Campaign Studio State
  const [campaignTemplate, setCampaignTemplate] = useState<'nayday' | 'welcomeOffer' | 'newLaunch' | 'vipPrivate' | 'weekendSpecial'>('nayday');
  const [campaignSubject, setCampaignSubject] = useState('OFFRE NAYDAY — Votre sélection, encore plus avantageuse (−10% avec le code NAYDAY)');
  const [campaignPreheader, setCampaignPreheader] = useState('Achetez plus de 2 parfums et profitez de −10% sur votre commande.');
  const [campaignHeadline, setCampaignHeadline] = useState('Votre sélection, encore plus avantageuse.');
  const [campaignMessage, setCampaignMessage] = useState(
    'Achetez plus de 2 parfums et profitez de -10% sur votre commande grâce au code NAYDAY.\n\nFlacons d\'exception, tenue remarquable et livraison soignée partout au Maroc.'
  );
  const [campaignPromoCode, setCampaignPromoCode] = useState('NAYDAY');
  const [campaignCtaText, setCampaignCtaText] = useState('PROFITER DE −10%');
  const [campaignCtaLink, setCampaignCtaLink] = useState('https://nayparfum.ma/fr/shop');
  const [copiedHtml, setCopiedHtml] = useState(false);

  // Fetch Subscribers from API
  const fetchSubscribers = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/admin/newsletter');
      const data = await res.json();
      if (data.success && Array.isArray(data.subscribers)) {
        setSubscribers(data.subscribers);
      }
    } catch (err) {
      console.error('Error fetching subscribers:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  // Update campaign template defaults
  const handleTemplateChange = (tpl: 'nayday' | 'welcomeOffer' | 'newLaunch' | 'vipPrivate' | 'weekendSpecial') => {
    setCampaignTemplate(tpl);
    if (tpl === 'nayday') {
      setCampaignSubject('OFFRE NAYDAY — Votre sélection, encore plus avantageuse (−10% avec le code NAYDAY)');
      setCampaignPreheader('Achetez plus de 2 parfums et profitez de −10% sur votre commande.');
      setCampaignHeadline('Votre sélection, encore plus avantageuse.');
      setCampaignMessage(
        'Achetez plus de 2 parfums et profitez de -10% sur votre commande grâce au code NAYDAY.\n\nFlacons d\'exception, tenue remarquable et livraison soignée partout au Maroc.'
      );
      setCampaignPromoCode('NAYDAY');
      setCampaignCtaText('PROFITER DE −10%');
      setCampaignCtaLink('https://nayparfum.ma/fr/shop');
    } else if (tpl === 'welcomeOffer') {
      setCampaignSubject('Offre Exclusive NAY Parfums : -10% dès 3 flacons avec le code PARFUM10');
      setCampaignPreheader('Sublimez vos sens avec nos fragrances d\'exception distillées à la main.');
      setCampaignHeadline('L\'Excellence du Parfum Niche : -10% dès 3 Flacons');
      setCampaignMessage(
        'Profitez de notre offre du moment : dès 3 parfums ajoutés au panier, bénéficiez de -10% immédiat sur votre commande grâce au code PARFUM10.\n\nFlacons d\'exception, tenue remarquable et livraison soignée partout au Maroc.'
      );
      setCampaignPromoCode('PARFUM10');
      setCampaignCtaText('Découvrir la Collection');
      setCampaignCtaLink('https://nayparfum.ma/fr/shop');
    } else if (tpl === 'newLaunch') {
      setCampaignSubject('✦ Nouveauté Privée : Découvrez notre dernière fragrance de niche');
      setCampaignPreheader('Une création olfactive rare réservée à nos abonnés privilégiés.');
      setCampaignHeadline('Une Nouvelle Signature Olfactive est Née');
      setCampaignMessage(
        'Nous avons le plaisir de vous dévoiler en avant-première notre nouvelle création olfactive. Des accords boisés nobles et des notes orientales précieuses créées pour laisser une empreinte inoubliable.'
      );
      setCampaignPromoCode('NOUVEAUTE');
      setCampaignCtaText('Découvrir en Avant-Première');
      setCampaignCtaLink('https://nayparfum.ma/fr/shop');
    } else if (tpl === 'vipPrivate') {
      setCampaignSubject('Accès VIP : Vente Privée NAY Parfums réservée aux abonnés');
      setCampaignPreheader('Remises exclusives et échantillons de testeurs offerts.');
      setCampaignHeadline('Vente Privée & Privilèges Réservés aux Abonnés');
      setCampaignMessage(
        'En tant qu\'abonné privilégié, accédez en avant-première à notre sélection exclusive. Pour toute commande de 2 parfums ou plus, un échantillon testeur 5ml de votre choix vous est offert en cadeau.'
      );
      setCampaignPromoCode('VIPCLUB');
      setCampaignCtaText('Accéder à la Vente Privée');
      setCampaignCtaLink('https://nayparfum.ma/fr/shop');
    } else if (tpl === 'weekendSpecial') {
      setCampaignSubject('⚡ Flash Week-end : Livraison Gratuite + Cadeau Offert');
      setCampaignPreheader('Offre limitée ce week-end uniquement sur nayparfum.ma.');
      setCampaignHeadline('Privilège du Week-end : Livraison 0 DH Partout au Maroc');
      setCampaignMessage(
        'Ce week-end, sublimez vos journées : la livraison est 100% offerte partout au Maroc dès 2 parfums commandés. Faites-vous plaisir ou gâtez vos proches sans frais supplémentaires.'
      );
      setCampaignPromoCode('LIVRAISON0');
      setCampaignCtaText('Commander sans Frais');
      setCampaignCtaLink('https://nayparfum.ma/fr/shop');
    }
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const total = subscribers.length;
    const customers = subscribers.filter((s) => s.isCustomer);
    const leads = subscribers.filter((s) => !s.isCustomer);
    const totalRevenue = subscribers.reduce((acc, s) => acc + s.totalSpent, 0);

    const now = new Date().getTime();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

    const newThisWeek = subscribers.filter(
      (s) => new Date(s.createdAt).getTime() >= oneWeekAgo
    ).length;

    const newThisMonth = subscribers.filter(
      (s) => new Date(s.createdAt).getTime() >= oneMonthAgo
    ).length;

    const conversionRate = total > 0 ? ((customers.length / total) * 100).toFixed(1) : '0';

    // Domain breakdown
    const domainsMap: Record<string, number> = {};
    subscribers.forEach((s) => {
      const d = s.domain || 'autre';
      domainsMap[d] = (domainsMap[d] || 0) + 1;
    });

    const domainsList = Object.entries(domainsMap)
      .map(([domain, count]) => ({
        domain,
        count,
        percent: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    const emailsSentCount = subscribers.filter((s) => s.welcomeEmailSent).length;
    const emailsPendingCount = total - emailsSentCount;

    return {
      total,
      customersCount: customers.length,
      leadsCount: leads.length,
      totalRevenue,
      newThisWeek,
      newThisMonth,
      conversionRate,
      domainsList,
      emailsSentCount,
      emailsPendingCount,
    };
  }, [subscribers]);

  // Filtering Subscribers
  const filteredSubscribers = useMemo(() => {
    return subscribers.filter((sub) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        sub.email.toLowerCase().includes(q) ||
        (sub.customerName && sub.customerName.toLowerCase().includes(q)) ||
        sub.domain.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (statusFilter === 'customers') return sub.isCustomer;
      if (statusFilter === 'leads') return !sub.isCustomer;
      if (statusFilter === 'sent') return !!sub.welcomeEmailSent;
      if (statusFilter === 'pending') return !sub.welcomeEmailSent;
      if (statusFilter === 'recent') {
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        return new Date(sub.createdAt).getTime() >= thirtyDaysAgo;
      }
      return true;
    });
  }, [subscribers, searchTerm, statusFilter]);

  // Copy helpers
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSuccess(label);
    setTimeout(() => setCopiedSuccess(null), 2500);
  };

  const copyAllEmails = () => {
    const emails = subscribers.map((s) => s.email).join(', ');
    copyToClipboard(emails, 'all_emails');
  };

  const copySelectedEmails = () => {
    const selected = subscribers
      .filter((s) => selectedIds.includes(s.id))
      .map((s) => s.email)
      .join(', ');
    copyToClipboard(selected, 'selected_emails');
  };

  // Export CSV
  const exportToCSV = () => {
    const headers = ['ID', 'Email', 'Nom Client', 'Statut Client', 'Email NAYDAY', 'Commandes', 'Total Depense (MAD)', 'Date Inscription'];
    const rows = filteredSubscribers.map((s) => [
      s.id,
      s.email,
      s.customerName ? `"${s.customerName}"` : 'Prospect',
      s.isCustomer ? 'Client Acheteur' : 'Prospect Non Converti',
      s.welcomeEmailSent ? 'Envoyé' : 'En attente',
      s.ordersCount,
      s.totalSpent,
      new Date(s.createdAt).toISOString().split('T')[0],
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `nay_parfums_newsletter_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredSubscribers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredSubscribers.map((s) => s.id));
    }
  };

  const toggleSelectOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Send NAYDAY Welcome Email to Single Subscriber
  const handleSendWelcomeEmail = async (sub: EnrichedSubscriber) => {
    setSendingEmailId(sub.id);
    setSendFeedback(null);
    try {
      const res = await fetch('/api/admin/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: sub.email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSendFeedback({
          id: sub.id,
          text: `Email NAYDAY envoyé avec succès à ${sub.email} !`,
          type: 'success',
        });
        setSubscribers((prev) =>
          prev.map((s) =>
            s.id === sub.id
              ? {
                  ...s,
                  welcomeEmailSent: true,
                  welcomeEmailSentAt: new Date().toISOString(),
                  welcomeEmailStatus: data.result?.channel === 'SIMULATED' ? 'SIMULATED' : 'SENT',
                }
              : s
          )
        );
      } else {
        setSendFeedback({
          id: sub.id,
          text: data.error || 'Erreur lors de l\'envoi de l\'email.',
          type: 'error',
        });
      }
    } catch {
      setSendFeedback({
        id: sub.id,
        text: 'Erreur réseau lors de l\'envoi.',
        type: 'error',
      });
    } finally {
      setSendingEmailId(null);
      setTimeout(() => setSendFeedback(null), 4000);
    }
  };

  // Batch Send NAYDAY Welcome Email to Selected Subscribers
  const handleBatchSendWelcomeEmail = async () => {
    const selectedEmails = subscribers
      .filter((s) => selectedIds.includes(s.id))
      .map((s) => s.email);

    if (selectedEmails.length === 0) return;
    if (
      !confirm(
        `Envoyer l'email NAYDAY (-10% avec code NAYDAY) aux ${selectedEmails.length} abonnés sélectionnés ?`
      )
    )
      return;

    setBatchSending(true);
    try {
      const res = await fetch('/api/admin/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails: selectedEmails }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`Succès : ${data.sentCount} emails envoyés sur ${data.totalRequested} !`);
        fetchSubscribers();
      } else {
        alert(data.error || 'Erreur lors de l\'envoi groupé.');
      }
    } catch {
      alert('Erreur réseau lors de l\'envoi groupé.');
    } finally {
      setBatchSending(false);
    }
  };

  // Send Test Email from Studio
  const handleSendTestEmail = async () => {
    if (!testEmailTarget || !testEmailTarget.includes('@')) {
      alert('Veuillez entrer une adresse email de test valide.');
      return;
    }

    setIsSendingTest(true);
    try {
      const res = await fetch('/api/admin/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmailTarget }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`Email de test NAYDAY envoyé avec succès à ${testEmailTarget} !`);
      } else {
        alert(data.error || 'Erreur lors de l\'envoi du test.');
      }
    } catch {
      alert('Erreur réseau.');
    } finally {
      setIsSendingTest(false);
    }
  };

  // Add Subscriber
  const handleAddSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    if (!newEmail || !newEmail.includes('@')) {
      setAddError('Veuillez entrer une adresse email valide.');
      return;
    }

    setIsAdding(true);
    try {
      const res = await fetch('/api/admin/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, sendWelcomeEmail: sendWelcomeOnAdd }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNewEmail('');
        setIsAddModalOpen(false);
        fetchSubscribers();
      } else {
        setAddError(data.error || 'Erreur lors de l\'ajout.');
      }
    } catch {
      setAddError('Erreur réseau.');
    } finally {
      setIsAdding(false);
    }
  };

  // Delete Subscriber
  const handleDelete = async (id: number, email: string) => {
    if (!confirm(`Supprimer définitivement l'abonné ${email} de la liste de diffusion ?`)) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/newsletter?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSubscribers((prev) => prev.filter((s) => s.id !== id));
        setSelectedIds((prev) => prev.filter((i) => i !== id));
      } else {
        alert('Erreur lors de la suppression.');
      }
    } catch {
      alert('Erreur réseau.');
    } finally {
      setDeletingId(null);
    }
  };

  // Open Webmail in BCC
  const openInWebmailBcc = () => {
    const emails = subscribers.map((s) => s.email).join(';');
    const mailto = `mailto:contact@nayparfum.ma?bcc=${encodeURIComponent(emails)}&subject=${encodeURIComponent(campaignSubject)}&body=${encodeURIComponent(campaignMessage)}`;
    window.open(mailto, '_blank');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Luxury Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-sky-50 text-[#0ea5e9] border border-sky-200 flex items-center gap-1.5">
              <Sparkles size={11} />
              NAY Parfums • Marketing Direct & Audience Privée
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              100% Opt-in Actif
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-[#0ea5e9] border border-sky-200/80 flex items-center justify-center">
              <Mail size={19} />
            </div>
            <span>Newsletter & Diffusion Privée</span>
          </h1>
          <p className="text-xs text-neutral-500 mt-1 max-w-2xl">
            Gérez vos abonnés qualifiés, segmentez vos acheteurs, préparez vos campagnes de luxe et exportez vos listes vers Klaviyo, Brevo et Meta Ads.
          </p>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-700 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
            title="Exporter en fichier CSV pour Excel, Brevo ou Klaviyo"
          >
            <Download size={13} className="text-neutral-500" />
            <span>Exporter CSV</span>
          </button>

          <button
            type="button"
            onClick={copyAllEmails}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-700 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
            title="Copier toutes les adresses séparées par une virgule"
          >
            {copiedSuccess === 'all_emails' ? (
              <>
                <Check size={13} className="text-emerald-600" />
                <span className="text-emerald-700">Copié !</span>
              </>
            ) : (
              <>
                <Copy size={13} className="text-[#0ea5e9]" />
                <span>Copier Tout (1 Clic)</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0ea5e9] hover:bg-[#0284c7] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus size={13} />
            <span>Ajouter un Abonné</span>
          </button>
        </div>
      </div>

      {/* Luxury KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Subscribers */}
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-4.5 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
              Audience Globale
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-[#0ea5e9] border border-sky-200 flex items-center justify-center">
              <Users size={15} />
            </div>
          </div>
          <div className="text-2xl font-black text-neutral-900 tracking-tight">
            {stats.total}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              +{stats.newThisMonth} ce mois
            </span>
            <span className="text-[11px] text-neutral-400">
              +{stats.newThisWeek} cette semaine
            </span>
          </div>
        </div>

        {/* Metric 2: Converted Customers */}
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-4.5 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
              Abonnés Convertis
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
              <Crown size={15} />
            </div>
          </div>
          <div className="text-2xl font-black text-neutral-900 tracking-tight flex items-baseline gap-2">
            <span>{stats.customersCount}</span>
            <span className="text-xs font-bold text-emerald-600">
              ({stats.conversionRate}%)
            </span>
          </div>
          <div className="text-[11px] text-neutral-500 mt-2 flex items-center gap-1.5">
            <CheckCircle2 size={12} className="text-emerald-500" />
            <span>Ont déjà commandé sur la boutique</span>
          </div>
        </div>

        {/* Metric 3: NAYDAY Welcome Emails Dispatched */}
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-4.5 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
              Emails NAYDAY Envoyés
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-[#0ea5e9] border border-sky-200 flex items-center justify-center">
              <Mail size={15} />
            </div>
          </div>
          <div className="text-2xl font-black text-neutral-900 tracking-tight flex items-baseline gap-2">
            <span>{stats.emailsSentCount}</span>
            <span className="text-xs font-bold text-[#0ea5e9]">
              / {stats.total}
            </span>
          </div>
          <div className="text-[11px] text-neutral-500 mt-2 flex items-center gap-1">
            <CheckCircle2 size={12} className="text-emerald-500" />
            <span>
              {stats.emailsPendingCount > 0
                ? `${stats.emailsPendingCount} en attente d'envoi automatique`
                : 'Tous les abonnés ont reçu l\'offre'}
            </span>
          </div>
        </div>

        {/* Metric 4: Prospects to Convert */}
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-4.5 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
              Prospects Chauds
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
              <Target size={15} />
            </div>
          </div>
          <div className="text-2xl font-black text-neutral-900 tracking-tight">
            {stats.leadsCount}
          </div>
          <div className="text-[11px] text-amber-700 mt-2 flex items-center gap-1">
            <Zap size={12} className="text-amber-500" />
            <span>Cibles prêtes pour le code NAYDAY (-10%)</span>
          </div>
        </div>
      </div>

      {/* Clean Creative Tabs */}
      <div className="flex items-center justify-between bg-white border border-neutral-200/80 rounded-2xl p-2 shadow-xs flex-wrap gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('subscribers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'subscribers'
                ? 'bg-[#0ea5e9] text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/70'
            }`}
          >
            <Inbox size={14} />
            <span>Répertoire des Abonnés</span>
            <span
              className={`px-1.5 py-0.2 rounded-md text-[10px] font-extrabold ${
                activeTab === 'subscribers'
                  ? 'bg-white/20 text-white'
                  : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
              }`}
            >
              {subscribers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('segments')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'segments'
                ? 'bg-[#0ea5e9] text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/70'
            }`}
          >
            <Layers size={14} />
            <span>Segmentation Intelligente</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('campaigns')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'campaigns'
                ? 'bg-[#0ea5e9] text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/70'
            }`}
          >
            <Send size={14} />
            <span>Studio de Campagnes Email</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-sky-50 text-[#0ea5e9] border border-sky-300 uppercase">
              NAYDAY -10%
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('integrations')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'integrations'
                ? 'bg-[#0ea5e9] text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/70'
            }`}
          >
            <Globe size={14} />
            <span>Exports & Intégrations CRM</span>
          </button>
        </div>

        <button
          type="button"
          onClick={fetchSubscribers}
          disabled={refreshing}
          className="p-2 text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
          title="Actualiser la liste"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin text-[#0ea5e9]' : ''} />
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SUBSCRIBERS DIRECTORY (RICH TABLE, SEARCH, BULK ACTIONS)           */}
      {/* ========================================================================= */}
      {activeTab === 'subscribers' && (
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          {/* Controls Bar: Search & Status Filters */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search size={14} className="absolute left-3.5 top-3 text-neutral-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par email, nom du client ou domaine..."
                className="w-full pl-9 pr-4 py-2 bg-neutral-50/70 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-900 focus:outline-none focus:border-[#0ea5e9] focus:bg-white transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-neutral-900 text-white shadow-2xs'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/70'
                }`}
              >
                Tous ({subscribers.length})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('customers')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === 'customers'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100/70 border border-emerald-200'
                }`}
              >
                <Crown size={12} />
                <span>Clients ({stats.customersCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('leads')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === 'leads'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100/70 border border-amber-200'
                }`}
              >
                <Target size={12} />
                <span>Prospects ({stats.leadsCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('sent')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === 'sent'
                    ? 'bg-[#0ea5e9] text-white shadow-2xs'
                    : 'bg-sky-50 text-[#0ea5e9] hover:bg-sky-100/70 border border-sky-200'
                }`}
              >
                <CheckCircle2 size={12} />
                <span>NAYDAY Envoyé ({stats.emailsSentCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === 'pending'
                    ? 'bg-neutral-700 text-white shadow-2xs'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/70'
                }`}
              >
                <Clock size={12} />
                <span>En attente ({stats.emailsPendingCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('recent')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'recent'
                    ? 'bg-neutral-900 text-white shadow-2xs'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/70'
                }`}
              >
                <span>Ce mois ({stats.newThisMonth})</span>
              </button>
            </div>
          </div>

          {/* Bulk Selection Ribbon */}
          {selectedIds.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-sky-50/80 border border-sky-200 rounded-xl text-xs flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-[#0ea5e9]">
                  {selectedIds.length} abonné{selectedIds.length > 1 ? 's' : ''} sélectionné{selectedIds.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  disabled={batchSending}
                  onClick={handleBatchSendWelcomeEmail}
                  className="px-3.5 py-1.5 bg-[#0ea5e9] hover:bg-[#0284c7] text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
                >
                  {batchSending ? <RefreshCw size={12} className="animate-spin" /> : <Send size={12} />}
                  <span>Envoyer Offre NAYDAY ({selectedIds.length})</span>
                </button>
                <button
                  type="button"
                  onClick={copySelectedEmails}
                  className="px-3 py-1.5 bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-200 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                >
                  {copiedSuccess === 'selected_emails' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  <span>Copier les emails</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="px-2 py-1.5 text-neutral-500 hover:text-neutral-800 text-[11px] font-semibold"
                >
                  Désélectionner
                </button>
              </div>
            </div>
          )}

          {/* Table Container */}
          <div className="border border-neutral-200/90 rounded-xl overflow-hidden">
            {loading ? (
              <div className="py-16 text-center text-xs text-neutral-400 space-y-2">
                <RefreshCw size={20} className="animate-spin text-[#0ea5e9] mx-auto" />
                <p>Chargement des abonnés en cours...</p>
              </div>
            ) : filteredSubscribers.length === 0 ? (
              <div className="p-12 text-center text-neutral-400 space-y-2">
                <Mail size={32} className="mx-auto text-neutral-300" />
                <div className="text-xs font-bold text-neutral-800">Aucun abonné ne correspond à votre filtre</div>
                <p className="text-[11px] text-neutral-400">
                  {searchTerm ? 'Essayez de modifier votre terme de recherche.' : 'Aucun email collecté dans cette catégorie pour le moment.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-neutral-50/80 border-b border-neutral-200 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                      <th className="py-3 px-4 w-10">
                        <input
                          type="checkbox"
                          checked={selectedIds.length > 0 && selectedIds.length === filteredSubscribers.length}
                          onChange={toggleSelectAll}
                          className="rounded text-[#0ea5e9] focus:ring-[#0ea5e9] cursor-pointer"
                        />
                      </th>
                      <th className="py-3 px-4">Abonné & Email</th>
                      <th className="py-3 px-4">Statut Client CRM</th>
                      <th className="py-3 px-4">Offre NAYDAY (-10%)</th>
                      <th className="py-3 px-4">Commandes & Valeur</th>
                      <th className="py-3 px-4">Date d&apos;Inscription</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-xs">
                    {filteredSubscribers.map((sub) => {
                      const isSelected = selectedIds.includes(sub.id);
                      return (
                        <tr
                          key={sub.id}
                          className={`transition-colors hover:bg-neutral-50/70 ${
                            isSelected ? 'bg-sky-50/40' : ''
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="py-3.5 px-4">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectOne(sub.id)}
                              className="rounded text-[#0ea5e9] focus:ring-[#0ea5e9] cursor-pointer"
                            />
                          </td>

                          {/* Email & Avatar */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] uppercase flex-shrink-0 border ${
                                  sub.isCustomer
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-neutral-100 text-neutral-700 border-neutral-200'
                                }`}
                              >
                                {sub.email.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <a
                                    href={`mailto:${sub.email}`}
                                    className="font-bold text-neutral-900 hover:text-[#0ea5e9] hover:underline truncate"
                                  >
                                    {sub.email}
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(sub.email, `sub_${sub.id}`)}
                                    className="text-neutral-400 hover:text-neutral-800 p-0.5 cursor-pointer"
                                    title="Copier l'email"
                                  >
                                    {copiedSuccess === `sub_${sub.id}` ? (
                                      <Check size={11} className="text-emerald-600" />
                                    ) : (
                                      <Copy size={11} />
                                    )}
                                  </button>
                                </div>
                                <div className="text-[11px] text-neutral-400 mt-0.5">
                                  {sub.customerName ? (
                                    <span className="text-neutral-600 font-medium">{sub.customerName}</span>
                                  ) : (
                                    <span>Inscrit via boutique NAY</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* CRM Status */}
                          <td className="py-3.5 px-4">
                            {sub.isCustomer ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Crown size={12} className="text-emerald-600" />
                                <span>Client Acheteur</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                <Target size={12} className="text-amber-600" />
                                <span>Prospect Chaud</span>
                              </span>
                            )}
                          </td>

                          {/* NAYDAY Email Status */}
                          <td className="py-3.5 px-4">
                            {sub.welcomeEmailSent ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-extrabold bg-sky-50 text-[#0ea5e9] border border-sky-200">
                                  <CheckCircle2 size={12} className="text-[#0ea5e9]" />
                                  <span>Envoyé (Code NAYDAY)</span>
                                </span>
                                {sub.welcomeEmailSentAt && (
                                  <div className="text-[10px] text-neutral-400 pl-1">
                                    {new Date(sub.welcomeEmailSentAt).toLocaleDateString('fr-FR', {
                                      day: 'numeric',
                                      month: 'short',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </div>
                                )}
                              </div>
                            ) : sub.welcomeEmailStatus === 'FAILED' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <AlertCircle size={12} />
                                <span>Échec d&apos;envoi</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-neutral-100 text-neutral-600 border border-neutral-200">
                                <Clock size={11} className="text-neutral-400" />
                                <span>En attente</span>
                              </span>
                            )}
                          </td>

                          {/* Orders & Spent */}
                          <td className="py-3.5 px-4">
                            {sub.isCustomer ? (
                              <div>
                                <div className="font-bold text-neutral-900">
                                  {formatMAD(sub.totalSpent)}
                                </div>
                                <div className="text-[11px] text-neutral-400">
                                  {sub.ordersCount} commande{sub.ordersCount > 1 ? 's' : ''} livrée{sub.ordersCount > 1 ? 's' : ''}
                                </div>
                              </div>
                            ) : (
                              <span className="text-[11px] text-neutral-400 italic">
                                0 commande • Prêt à convertir
                              </span>
                            )}
                          </td>

                          {/* Subscription Date */}
                          <td className="py-3.5 px-4 text-neutral-500 text-[11px]">
                            <div className="font-medium text-neutral-800">
                              {new Date(sub.createdAt).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </div>
                            <div className="text-neutral-400">
                              {new Date(sub.createdAt).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleSendWelcomeEmail(sub)}
                                disabled={sendingEmailId === sub.id}
                                className="p-1.5 rounded-lg border border-sky-200 bg-sky-50/70 hover:bg-[#0ea5e9] text-[#0ea5e9] hover:text-white transition-all cursor-pointer disabled:opacity-50"
                                title="Envoyer directement l'email NAYDAY (-10%)"
                              >
                                {sendingEmailId === sub.id ? (
                                  <RefreshCw size={13} className="animate-spin" />
                                ) : (
                                  <Send size={13} />
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDelete(sub.id, sub.email)}
                                disabled={deletingId === sub.id}
                                className="p-1.5 rounded-lg border border-neutral-200 hover:border-rose-300 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Supprimer de la newsletter"
                              >
                                <Trash2 size={13} />
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: INTELLIGENT SEGMENTATION                                          */}
      {/* ========================================================================= */}
      {activeTab === 'segments' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Segment 1: Converted VIP Buyers */}
            <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                    <Crown size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                      Clients Acheteurs Fidèles ({stats.customersCount})
                    </h3>
                    <p className="text-[11px] text-neutral-500">
                      Abonnés ayant déjà passé au moins 1 commande payée.
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {stats.conversionRate}% de l&apos;audience
                </span>
              </div>

              <div className="p-3 bg-neutral-50 rounded-xl text-xs space-y-1.5 text-neutral-600">
                <div className="flex justify-between">
                  <span>Panier moyen généré :</span>
                  <span className="font-bold text-neutral-900">
                    {stats.customersCount > 0 ? formatMAD(Math.round(stats.totalRevenue / stats.customersCount)) : '0 DH'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Stratégie recommandée :</span>
                  <span className="font-semibold text-emerald-700">Upsell nouveautés, Parfums Orientaux de Luxe & Packs Trio</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const custEmails = subscribers.filter((s) => s.isCustomer).map((s) => s.email).join(', ');
                  copyToClipboard(custEmails, 'seg_cust');
                }}
                className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copiedSuccess === 'seg_cust' ? <Check size={13} /> : <Copy size={13} />}
                <span>Copier les emails de ce segment ({stats.customersCount})</span>
              </button>
            </div>

            {/* Segment 2: Hot Leads (Not yet converted) */}
            <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                    <Target size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                      Prospects Non-Convertis ({stats.leadsCount})
                    </h3>
                    <p className="text-[11px] text-neutral-500">
                      Inscrits qui attendent une offre de bienvenue pour commander.
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                  Potentiel Immédiat
                </span>
              </div>

              <div className="p-3 bg-neutral-50 rounded-xl text-xs space-y-1.5 text-neutral-600">
                <div className="flex justify-between">
                  <span>Offre idéale à leur envoyer :</span>
                  <span className="font-bold text-[#0ea5e9]">Code PARFUM10 (-10% dès 3 flacons)</span>
                </div>
                <div className="flex justify-between">
                  <span>Objectif de conversion :</span>
                  <span className="font-semibold text-amber-800">Déclencher le premier panier d&apos;achat</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const leadEmails = subscribers.filter((s) => !s.isCustomer).map((s) => s.email).join(', ');
                  copyToClipboard(leadEmails, 'seg_leads');
                }}
                className="w-full py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copiedSuccess === 'seg_leads' ? <Check size={13} /> : <Copy size={13} />}
                <span>Copier les emails de ce segment ({stats.leadsCount})</span>
              </button>
            </div>
          </div>

          {/* Domain Breakdown */}
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-150 pb-3">
              <div>
                <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                  <Globe size={14} className="text-[#0ea5e9]" />
                  <span>Répartition des Fournisseurs d&apos;Email</span>
                </h3>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Délivrabilité optimale : 100% des domaines reconnus sans risque de spam.
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                Délivrabilité Estimée : 99.8%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {stats.domainsList.map((d) => (
                <div key={d.domain} className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/70 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-mono font-bold text-neutral-800">@{d.domain}</span>
                    <span className="text-[11px] font-extrabold text-[#0ea5e9]">{d.count} ({d.percent}%)</span>
                  </div>
                  <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#0ea5e9] h-full rounded-full" style={{ width: `${d.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: LUXURY EMAIL CAMPAIGN STUDIO                                      */}
      {/* ========================================================================= */}
      {activeTab === 'campaigns' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Form: Campaign Config (5 cols) */}
          <div className="lg:col-span-5 bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="border-b border-neutral-150 pb-3">
              <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <Send size={15} className="text-[#0ea5e9]" />
                <span>Rédiger une Campagne Email</span>
              </h2>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Créez une annonce élégante prête à être envoyée à vos {subscribers.length} abonnés.
              </p>
            </div>

            {/* Template Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700">Modèle de Campagne</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleTemplateChange('nayday')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer col-span-2 ${
                    campaignTemplate === 'nayday'
                      ? 'bg-sky-50 border-[#0ea5e9] text-[#0ea5e9] font-bold ring-1 ring-[#0ea5e9]'
                      : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <div className="text-xs font-bold flex items-center justify-between">
                    <span>⚡ OFFRE NAYDAY : −10% dès 2 Parfums (Email Automatique)</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#0ea5e9] text-white">Actif & Officiel</span>
                  </div>
                  <div className="text-[10px] text-neutral-500 font-normal mt-0.5">
                    Miss Dior Parfum + Armani Stronger With You Intensely (Code NAYDAY)
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleTemplateChange('welcomeOffer')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    campaignTemplate === 'welcomeOffer'
                      ? 'bg-sky-50 border-[#0ea5e9] text-[#0ea5e9] font-bold ring-1 ring-[#0ea5e9]'
                      : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <div className="text-xs">⚡ Offre -10% dès 3 flacons</div>
                  <div className="text-[10px] text-neutral-400 font-normal">Code PARFUM10</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleTemplateChange('vipPrivate')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    campaignTemplate === 'vipPrivate'
                      ? 'bg-sky-50 border-[#0ea5e9] text-[#0ea5e9] font-bold ring-1 ring-[#0ea5e9]'
                      : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <div className="text-xs">👑 Vente Privée VIP</div>
                  <div className="text-[10px] text-neutral-400 font-normal">Échantillon offert</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleTemplateChange('newLaunch')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    campaignTemplate === 'newLaunch'
                      ? 'bg-sky-50 border-[#0ea5e9] text-[#0ea5e9] font-bold ring-1 ring-[#0ea5e9]'
                      : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <div className="text-xs">✦ Nouveau Parfum Niche</div>
                  <div className="text-[10px] text-neutral-400 font-normal">Lancement exclusif</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleTemplateChange('weekendSpecial')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    campaignTemplate === 'weekendSpecial'
                      ? 'bg-sky-50 border-[#0ea5e9] text-[#0ea5e9] font-bold ring-1 ring-[#0ea5e9]'
                      : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <div className="text-xs">🚚 Livraison 0 DH Flash</div>
                  <div className="text-[10px] text-neutral-400 font-normal">Spécial week-end</div>
                </button>
              </div>
            </div>

            {/* Subject Line */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-700">Objet de l&apos;email *</label>
              <input
                type="text"
                value={campaignSubject}
                onChange={(e) => setCampaignSubject(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50/70 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-900 focus:outline-none focus:border-[#0ea5e9] focus:bg-white"
              />
            </div>

            {/* Preheader */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-700">Sous-titre / Aperçu (Preheader)</label>
              <input
                type="text"
                value={campaignPreheader}
                onChange={(e) => setCampaignPreheader(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50/70 border border-neutral-200 rounded-xl text-xs text-neutral-700 focus:outline-none focus:border-[#0ea5e9] focus:bg-white"
              />
            </div>

            {/* Coupon Highlight */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700">Code Coupon En Vedette</label>
                <input
                  type="text"
                  value={campaignPromoCode}
                  onChange={(e) => setCampaignPromoCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-neutral-50/70 border border-neutral-200 rounded-xl text-xs font-black text-[#0ea5e9] uppercase font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700">Texte du Bouton (CTA)</label>
                <input
                  type="text"
                  value={campaignCtaText}
                  onChange={(e) => setCampaignCtaText(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50/70 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-900"
                />
              </div>
            </div>

            {/* Message Body */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-700">Corps du Message</label>
              <textarea
                rows={5}
                value={campaignMessage}
                onChange={(e) => setCampaignMessage(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50/70 border border-neutral-200 rounded-xl text-xs text-neutral-800 focus:outline-none focus:border-[#0ea5e9] focus:bg-white leading-relaxed"
              />
            </div>

            {/* Direct Send Test to Admin Email */}
            <div className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-xl space-y-2">
              <label className="text-[11px] font-bold text-neutral-800 flex items-center gap-1.5">
                <Send size={12} className="text-[#0ea5e9]" />
                <span>Tester l&apos;envoi vers votre boîte email</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="votre-email@gmail.com"
                  value={testEmailTarget}
                  onChange={(e) => setTestEmailTarget(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs"
                />
                <button
                  type="button"
                  onClick={handleSendTestEmail}
                  disabled={isSendingTest}
                  className="px-3.5 py-1.5 bg-[#0ea5e9] hover:bg-[#0284c7] text-white text-xs font-bold rounded-lg cursor-pointer disabled:opacity-50 flex items-center gap-1 shadow-2xs"
                >
                  {isSendingTest ? <RefreshCw size={12} className="animate-spin" /> : <Send size={12} />}
                  <span>Tester</span>
                </button>
              </div>
            </div>

            {/* Dispatch Actions */}
            <div className="space-y-2 pt-2 border-t border-neutral-200">
              <button
                type="button"
                onClick={openInWebmailBcc}
                className="w-full py-3 bg-[#0ea5e9] hover:bg-[#0284c7] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ExternalLink size={14} />
                <span>Ouvrir dans Gmail / Outlook (Envoi en Cci Masqué)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const plainText = `${campaignSubject}\n\n${campaignMessage}\n\nUtilisez le code promo : ${campaignPromoCode}\nLien : ${campaignCtaLink}`;
                  copyToClipboard(plainText, 'campaign_text');
                }}
                className="w-full py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {copiedSuccess === 'campaign_text' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                <span>Copier le Texte Brut pour WhatsApp / Messagerie</span>
              </button>
            </div>
          </div>

          {/* Right Mockup: Live Luxury Email Preview (7 cols) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-neutral-700 px-1">
              <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px] text-neutral-500">
                <Eye size={13} className="text-[#0ea5e9]" />
                <span>
                  {campaignTemplate === 'nayday'
                    ? 'Aperçu Réel : Modèle NAYDAY Envoyé Automatiquement'
                    : 'Aperçu Réel du Mail de Luxe (Client)'}
                </span>
              </span>
              <span className="text-[10px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded border border-neutral-200">
                Design Responsive 640px
              </span>
            </div>

            {/* Email Container Frame */}
            <div className="bg-[#f4f5f7] border border-neutral-200/90 rounded-2xl p-3 sm:p-6 shadow-xs max-w-xl mx-auto">
              {campaignTemplate === 'nayday' ? (
                <div className="bg-white rounded-xl border border-neutral-200/80 overflow-hidden shadow-xs">
                  {/* Header Logo */}
                  <div className="p-6 text-center border-b border-[#eceff3] bg-white">
                    <img
                      src="https://nayparfum.ma/images/nay/nay-logo-tight.png"
                      alt="NAY Parfum"
                      className="h-9 mx-auto object-contain"
                    />
                  </div>

                  {/* Hero */}
                  <div className="p-6 text-center space-y-2.5">
                    <div className="text-[11px] tracking-[3px] text-[#189fe3] font-bold uppercase">
                      OFFRE NAYDAY
                    </div>
                    <h3 className="font-serif text-2xl sm:text-3xl font-normal text-[#0e1d34] leading-tight">
                      Votre sélection,<br />encore plus avantageuse.
                    </h3>
                    <p className="text-xs sm:text-sm text-[#5c6470] leading-relaxed">
                      Achetez <strong>plus de 2 parfums</strong> et profitez de <strong className="text-[#189fe3]">−10%</strong> sur votre commande.
                    </p>
                  </div>

                  {/* Promo Code Box */}
                  <div className="px-6 pb-4">
                    <div className="bg-[#0e1d34] p-4 text-center rounded-lg text-white">
                      <div className="text-[10px] tracking-widest text-[#b8c6d8] uppercase">CODE PROMO</div>
                      <div className="text-2xl font-black tracking-[4px] mt-1 text-white">NAYDAY</div>
                    </div>
                  </div>

                  {/* 2 Products Showcase */}
                  <div className="px-4 pb-4 grid grid-cols-2 gap-3">
                    <div className="border border-[#e9edf2] p-3 rounded-lg text-center bg-white space-y-1.5">
                      <img
                        src="https://l3qgcdajft9wdkxz.public.blob.vercel-storage.com/1784029115159-214358233-Miss_Dior_parfum.jpg"
                        alt="Miss Dior Parfum"
                        className="w-full h-28 object-contain mx-auto"
                      />
                      <div className="text-[9px] uppercase tracking-wider text-[#8a929c] font-bold">POUR ELLE</div>
                      <div className="font-serif text-xs font-semibold text-[#0e1d34] truncate">Miss Dior Parfum</div>
                      <div className="text-[10px] text-[#5c6470]">Chypré fruité · 100 ml</div>
                      <div className="text-xs font-bold text-[#0e1d34]">299 DH</div>
                      <a
                        href="https://nayparfum.ma/fr/product/miss-dior-parfum-tester"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block text-[10px] text-[#0e1d34] border-b border-[#0e1d34] pb-0.5 font-bold"
                      >
                        DÉCOUVRIR
                      </a>
                    </div>

                    <div className="border border-[#e9edf2] p-3 rounded-lg text-center bg-white space-y-1.5">
                      <img
                        src="https://l3qgcdajft9wdkxz.public.blob.vercel-storage.com/raw-1783986821133-armani_stronger_with_you_intens.jpg"
                        alt="Stronger With You Intensely"
                        className="w-full h-28 object-contain mx-auto"
                      />
                      <div className="text-[9px] uppercase tracking-wider text-[#8a929c] font-bold">POUR LUI</div>
                      <div className="font-serif text-xs font-semibold text-[#0e1d34] truncate">Stronger With You</div>
                      <div className="text-[10px] text-[#5c6470]">Ambré fougère · 100 ml</div>
                      <div className="text-xs font-bold text-[#0e1d34]">299 DH</div>
                      <a
                        href="https://nayparfum.ma/fr/product/armani-stronger-with-you-intensely-tester"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block text-[10px] text-[#0e1d34] border-b border-[#0e1d34] pb-0.5 font-bold"
                      >
                        DÉCOUVRIR
                      </a>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="p-6 text-center space-y-3">
                    <div className="font-serif text-lg text-[#0e1d34]">Composez votre sélection.</div>
                    <div className="text-xs text-[#66707c]">
                      Ajoutez <strong>plus de 2 parfums</strong> à votre panier et utilisez le code <strong>NAYDAY</strong>.
                    </div>
                    <a
                      href="https://nayparfum.ma/fr/shop"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-[#189fe3] text-white text-xs font-bold px-6 py-2.5 uppercase tracking-wider rounded"
                    >
                      PROFITER DE −10%
                    </a>
                  </div>

                  {/* Trust */}
                  <div className="bg-[#f5f8fb] p-3 text-center text-xs text-[#3e4650] border-t border-[#e9edf2]">
                    Livraison partout au Maroc · Paiement à la livraison<br />
                    <strong>nayparfum.ma</strong>
                  </div>

                  {/* Footer */}
                  <div className="bg-[#0e1d34] p-4 text-center text-white space-y-1">
                    <div className="text-xs font-bold tracking-widest">NAY PARFUM</div>
                    <div className="text-[10px] text-[#aab6c5]">
                      Offre valable pour l&apos;achat de plus de 2 parfums avec le code NAYDAY.<br />
                      © 2026 NAY Parfum
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-neutral-200/70 overflow-hidden shadow-xs">
                  {/* Email Header */}
                  <div className="bg-[#0f172a] p-6 text-center text-white border-b border-neutral-800">
                    <div className="text-[10px] font-extrabold tracking-[0.3em] uppercase text-sky-400 mb-1">
                      HAUTE PARFUMERIE MAROCAINE
                    </div>
                    <div className="text-xl font-bold tracking-wider font-serif">
                      NAY PARFUMS
                    </div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">
                      Distillation & Création Artisanale • Maroc
                    </div>
                  </div>

                  {/* Email Banner / Badge */}
                  <div className="bg-sky-50 p-4 border-b border-sky-100 text-center">
                    <span className="inline-block px-3 py-1 bg-[#0ea5e9] text-white font-extrabold text-[11px] rounded-full uppercase tracking-wider shadow-2xs">
                      ✦ PRIVILÈGE ABONNÉ EXCLUSIF ✦
                    </span>
                  </div>

                  {/* Email Content Body */}
                  <div className="p-6 sm:p-8 space-y-5">
                    <h3 className="text-base sm:text-lg font-bold text-neutral-900 text-center leading-snug">
                      {campaignHeadline}
                    </h3>

                    <div className="text-xs text-neutral-600 leading-relaxed space-y-3 whitespace-pre-line text-center max-w-md mx-auto">
                      {campaignMessage}
                    </div>

                    {/* Promo Box */}
                    {campaignPromoCode && (
                      <div className="p-4 bg-gradient-to-br from-sky-50 to-white border-2 border-dashed border-sky-300 rounded-xl text-center space-y-1">
                        <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                          Votre Code de Réduction Personnel :
                        </div>
                        <div className="font-mono text-lg font-black text-[#0ea5e9] tracking-widest">
                          {campaignPromoCode}
                        </div>
                        <div className="text-[10px] text-neutral-500">
                          À renseigner lors de la validation de votre panier
                        </div>
                      </div>
                    )}

                    {/* CTA Button */}
                    <div className="text-center pt-2">
                      <a
                        href={campaignCtaLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-8 py-3 bg-[#0ea5e9] text-white text-xs font-bold rounded-full shadow-xs hover:bg-[#0284c7] transition-all"
                      >
                        <span>{campaignCtaText}</span>
                        <ArrowRight size={13} />
                      </a>
                    </div>
                  </div>

                  {/* Email Footer */}
                  <div className="bg-neutral-50 p-5 text-center text-[10px] text-neutral-400 border-t border-neutral-150 space-y-1.5">
                    <div className="font-semibold text-neutral-600">NAY Parfums • Maison de Luxe</div>
                    <div>Casablanca • Marrakech • Rabat • Livraison partout au Maroc</div>
                    <div className="text-[9px] text-neutral-400 pt-1">
                      Vous recevez cet email car vous êtes inscrit sur <span className="underline">nayparfum.ma</span>.
                      <br />
                      Pour modifier vos préférences ou vous désinscrire, répondez simplement « STOP ».
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: EXPORTS & CRM INTEGRATIONS                                        */}
      {/* ========================================================================= */}
      {activeTab === 'integrations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Klaviyo */}
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-black text-sm">
                K
              </div>
              <div>
                <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                  Klaviyo (E-Commerce Parfumerie)
                </h3>
                <p className="text-[11px] text-neutral-500">
                  La plateforme leader pour les marques de cosmétiques & parfums.
                </p>
              </div>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Exportez le fichier CSV de vos abonnés NAY Parfums et importez-le dans Klaviyo sous <code className="bg-neutral-100 px-1 py-0.5 rounded text-[11px]">Lists & Segments &gt; Newsletter</code>. Les champs email, nom et statut acheteur sont automatiquement mappés.
            </p>
            <button
              type="button"
              onClick={exportToCSV}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              <Download size={13} />
              <span>Télécharger CSV compatible Klaviyo</span>
            </button>
          </div>

          {/* Card 2: Brevo / Sendinblue */}
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm">
                B
              </div>
              <div>
                <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                  Brevo (Ex-Sendinblue)
                </h3>
                <p className="text-[11px] text-neutral-500">
                  Solution idéale pour les newsletters et SMS marketing au Maroc.
                </p>
              </div>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Compatible 100% avec l&apos;import de contacts Brevo. Vous pouvez segmenter vos campagnes entre clients acheteurs et prospects dès le premier import.
            </p>
            <button
              type="button"
              onClick={exportToCSV}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              <Download size={13} />
              <span>Télécharger CSV compatible Brevo</span>
            </button>
          </div>

          {/* Card 3: Meta Ads Custom Audiences */}
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#0ea5e9] text-white flex items-center justify-center font-black text-sm">
                ∞
              </div>
              <div>
                <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                  Meta Ads (Facebook & Instagram Ads)
                </h3>
                <p className="text-[11px] text-neutral-500">
                  Créez des Audiences Personnalisées & Lookalike 1% au Maroc.
                </p>
              </div>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Téléchargez cette liste pour créer une audience similaire (Lookalike) sur Meta Ads Manager. L&apos;algorithme ciblera des acheteurs marocains au profil identique à vos abonnés.
            </p>
            <button
              type="button"
              onClick={exportToCSV}
              className="px-4 py-2 bg-[#0ea5e9] hover:bg-[#0284c7] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              <Download size={13} />
              <span>Exporter pour Meta Ads Audience</span>
            </button>
          </div>

          {/* Card 4: Webmail & Direct Marketing */}
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-sm">
                @
              </div>
              <div>
                <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                  Envoi Direct Gmail / Outlook / Webmail
                </h3>
                <p className="text-[11px] text-neutral-500">
                  Envoi 100% gratuit sans abonnement externe.
                </p>
              </div>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Copiez la liste d&apos;adresses en 1 clic et collez-la dans le champ <strong>Cci (BCC)</strong> de votre messagerie pour envoyer vos offres sans révéler les adresses de vos clients.
            </p>
            <button
              type="button"
              onClick={copyAllEmails}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              <Copy size={13} />
              <span>Copier les {subscribers.length} emails pour Cci</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD SUBSCRIBER MANUALLY                                            */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-150 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-50 text-[#0ea5e9] border border-sky-200 flex items-center justify-center">
                  <UserPlus size={14} />
                </div>
                <h3 className="text-sm font-bold text-neutral-900">
                  Ajouter un Abonné Manuellement
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setAddError('');
                }}
                className="text-neutral-400 hover:text-neutral-800 p-1"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddSubscriber} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700">Adresse Email *</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="ex: client@gmail.com"
                  className="w-full px-3.5 py-2.5 bg-neutral-50/70 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-900 focus:outline-none focus:border-[#0ea5e9] focus:bg-white"
                />
                <p className="text-[10px] text-neutral-400">
                  Email collecté par WhatsApp, par téléphone ou en boutique physique.
                </p>
              </div>

              {/* Automatic welcome email option */}
              <div className="flex items-center gap-2.5 pt-1 p-2.5 bg-sky-50/70 rounded-xl border border-sky-100">
                <input
                  type="checkbox"
                  id="sendWelcome"
                  checked={sendWelcomeOnAdd}
                  onChange={(e) => setSendWelcomeOnAdd(e.target.checked)}
                  className="rounded text-[#0ea5e9] focus:ring-[#0ea5e9] cursor-pointer"
                />
                <label htmlFor="sendWelcome" className="text-xs font-semibold text-neutral-800 cursor-pointer">
                  Envoyer immédiatement l&apos;email NAYDAY (-10%)
                </label>
              </div>

              {addError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  <span>{addError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-150">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setAddError('');
                  }}
                  className="px-4 py-2 text-xs font-bold text-neutral-600 hover:bg-neutral-100 rounded-xl cursor-pointer"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={isAdding}
                  className="px-5 py-2 bg-[#0ea5e9] hover:bg-[#0284c7] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isAdding ? (
                    <RefreshCw size={13} className="animate-spin" />
                  ) : (
                    <>
                      <Plus size={13} />
                      <span>Ajouter l&apos;Abonné</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {sendFeedback && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2.5 animate-in slide-in-from-bottom-4 ${
            sendFeedback.type === 'success'
              ? 'bg-[#0e1d34] text-white border-sky-400/40 shadow-sky-500/10'
              : 'bg-rose-950 text-white border-rose-500/40 shadow-rose-500/10'
          }`}
        >
          {sendFeedback.type === 'success' ? (
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 size={15} />
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <AlertCircle size={15} />
            </div>
          )}
          <span>{sendFeedback.text}</span>
        </div>
      )}
    </div>
  );
}
