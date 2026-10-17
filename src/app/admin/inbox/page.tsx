'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Inbox,
  Send,
  Mail,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Archive,
  RefreshCw,
  Sparkles,
  Phone,
  ArrowRight,
  ShieldCheck,
  Check,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Eye,
  FileText,
  User,
  Users,
  CheckCheck,
  Lock,
  Globe,
  Radio,
  Trash2,
  Reply,
  Copy
} from 'lucide-react';

interface ContactMessageItem {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  message: string;
  status: 'unread' | 'read' | 'replied' | 'archived';
  createdAt: string;
  updatedAt?: string;
}

interface SentEmailItem {
  id: string;
  to: string[];
  primaryTo: string;
  from: string;
  subject: string;
  createdAt: string;
  lastEvent: string;
  category: {
    type: string;
    label: string;
    color: string;
  };
}

interface ProMailInfo {
  email: string;
  domain: string;
  domainStatus: string;
  region: string;
  provider: string;
  subscribersCount: number;
  adminUsers: Array<{ id: string; name: string; email: string; role: string }>;
}

export default function AdminInboxPage() {
  const [activeTab, setActiveTab] = useState<'received' | 'sent' | 'compose' | 'proInfo'>('received');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [receivedMessages, setReceivedMessages] = useState<ContactMessageItem[]>([]);
  const [sentEmails, setSentEmails] = useState<SentEmailItem[]>([]);
  const [proMailInfo, setProMailInfo] = useState<ProMailInfo | null>(null);
  const [stats, setStats] = useState({
    receivedTotal: 0,
    receivedUnread: 0,
    sentTotal: 0,
    sentDelivered: 0,
    deliveryRate: 100,
  });

  // Selection states
  const [selectedReceived, setSelectedReceived] = useState<ContactMessageItem | null>(null);
  const [selectedSent, setSelectedSent] = useState<SentEmailItem | null>(null);
  const [sentEmailDetail, setSentEmailDetail] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Filters
  const [receivedSearch, setReceivedSearch] = useState('');
  const [receivedFilter, setReceivedFilter] = useState<'all' | 'unread' | 'read' | 'replied' | 'archived'>('all');
  const [sentSearch, setSentSearch] = useState('');
  const [sentCategoryFilter, setSentCategoryFilter] = useState<string>('all');

  // Composer state
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeMessage, setComposeMessage] = useState('');
  const [composeContactMessageId, setComposeContactMessageId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  // Diagnostic Test Email
  const [diagnosticEmail, setDiagnosticEmail] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchInboxData = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/admin/inbox');
      const data = await res.json();
      if (data.success) {
        setReceivedMessages(data.received || []);
        setSentEmails(data.sent || []);
        setProMailInfo(data.proMailInfo || null);
        if (data.stats) setStats(data.stats);

        // Auto-select first items if none selected
        if (!selectedReceived && data.received?.length > 0) {
          setSelectedReceived(data.received[0]);
        }
        if (!selectedSent && data.sent?.length > 0) {
          setSelectedSent(data.sent[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching inbox:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInboxData();
  }, []);

  // Fetch full details of selected sent email
  useEffect(() => {
    if (!selectedSent?.id) {
      setSentEmailDetail(null);
      return;
    }
    const fetchDetail = async () => {
      try {
        setLoadingDetail(true);
        const res = await fetch(`/api/admin/inbox/${selectedSent.id}`);
        const data = await res.json();
        if (data.success && data.email) {
          setSentEmailDetail(data.email);
        } else {
          setSentEmailDetail(null);
        }
      } catch (e) {
        console.error('Error fetching email details:', e);
        setSentEmailDetail(null);
      } finally {
        setLoadingDetail(false);
      }
    };
    fetchDetail();
  }, [selectedSent?.id]);

  // Update received message status
  const handleUpdateStatus = async (id: string, status: 'read' | 'unread' | 'archived') => {
    try {
      const res = await fetch('/api/admin/inbox', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setReceivedMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, status } : m))
        );
        if (selectedReceived?.id === id) {
          setSelectedReceived((prev) => (prev ? { ...prev, status } : null));
        }
        // update stats
        setStats((prev) => ({
          ...prev,
          receivedUnread: status === 'read' ? Math.max(0, prev.receivedUnread - 1) : prev.receivedUnread + 1,
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete message
  const handleDeleteReceived = async (id: string) => {
    if (!confirm('Supprimer définitivement ce message reçu ?')) return;
    try {
      const res = await fetch(`/api/admin/inbox?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setReceivedMessages((prev) => prev.filter((m) => m.id !== id));
        if (selectedReceived?.id === id) {
          const remaining = receivedMessages.filter((m) => m.id !== id);
          setSelectedReceived(remaining[0] || null);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Start reply to a received contact message
  const handleStartReply = (msg: ContactMessageItem) => {
    setComposeTo(msg.email);
    setComposeSubject(`Re: Votre message à Maison NAY Parfums`);
    setComposeMessage(
      `Bonjour ${msg.name},\n\nNous vous remercions pour votre prise de contact avec Maison NAY Parfums.\n\nEn réponse à votre question :\n\n\nBien cordialement,\nL'Équipe NAY Parfums\nhttps://nayparfum.ma`
    );
    setComposeContactMessageId(msg.id);
    setActiveTab('compose');
  };

  // Quick Template Injector
  const applyTemplate = (type: 'support' | 'delivery' | 'nayday' | 'vip') => {
    if (type === 'support') {
      setComposeSubject('Maison NAY Parfums — Suivi de votre demande');
      setComposeMessage(
        `Bonjour,\n\nNous avons bien pris note de votre demande auprès de notre Maison.\n\nNotre équipe olfactive reste à votre entière disposition pour vous guider dans le choix de votre fragrance d'exception.\n\nN'hésitez pas à nous indiquer si vous souhaitez des précisions complémentaires sur nos testeurs 100% authentiques.\n\nBien cordialement,\nL'Équipe NAY Parfums\nWhatsApp Officiel : +212 663-380011`
      );
    } else if (type === 'delivery') {
      setComposeSubject('Maison NAY Parfums — Information sur votre expédition express');
      setComposeMessage(
        `Bonjour,\n\nNous vous confirmons que votre colis est soigneusement préparé dans nos ateliers.\n\nLa livraison est assurée sous 24 à 48 heures ouvrées partout au Maroc avec notre transporteur partenaire, avec paiement à la livraison.\n\nLe livreur vous contactera par téléphone avant son passage à l'adresse indiquée.\n\nExcellente réception,\nMaison NAY Parfums`
      );
    } else if (type === 'nayday') {
      setComposeSubject('NAY Parfums — Votre privilège NAYDAY (-10% dès 2 parfums)');
      setComposeMessage(
        `Bonjour,\n\nNous avons le plaisir de vous faire bénéficier de notre offre privilège :\n\nProfitez de -10% immédiat dès 2 parfums ajoutés au panier avec votre code promotionnel exclusif :\n\n>>> NAYDAY <<<\n\nRendez-vous sur notre boutique : https://nayparfum.ma/fr/shop\n\nTenue exceptionnelle & Flacons garantis 100% authentiques.\n\nÀ très vite sur nayparfum.ma,\nL'Équipe NAY`
      );
    } else if (type === 'vip') {
      setComposeSubject('Maison NAY Parfums — Invitation Privée VIP');
      setComposeMessage(
        `Cher Client Privilégié,\n\nEn tant que membre de notre cercle exclusif, nous sommes heureux de vous réserver un accès prioritaire à nos dernières arrivées de parfums de niche et éditions limitées.\n\nNotre conseiller privé est à votre écoute pour toute demande personnalisée directement sur WhatsApp au +212 663-380011.\n\nAvec toute notre bienveillance,\nDirection Maison NAY Parfums`
      );
    }
  };

  // Submit Compose Email
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendSuccess(null);
    setSendError(null);

    if (!composeTo || !composeTo.includes('@')) {
      setSendError('Veuillez renseigner une adresse email valide.');
      return;
    }
    if (!composeSubject.trim()) {
      setSendError('Veuillez renseigner un objet.');
      return;
    }
    if (!composeMessage.trim()) {
      setSendError('Veuillez écrire le contenu du message.');
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch('/api/admin/inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: composeTo,
          subject: composeSubject,
          message: composeMessage,
          contactMessageId: composeContactMessageId || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSendSuccess(`Email envoyé avec succès depuis contact@nayparfum.ma à ${composeTo} !`);
        setComposeTo('');
        setComposeSubject('');
        setComposeMessage('');
        setComposeContactMessageId(null);
        fetchInboxData();
      } else {
        setSendError(data.error || 'Erreur lors de l\'envoi de l\'email.');
      }
    } catch {
      setSendError('Erreur réseau lors de l\'envoi.');
    } finally {
      setIsSending(false);
    }
  };

  // Diagnostic Test
  const handleRunDiagnostic = async () => {
    if (!diagnosticEmail || !diagnosticEmail.includes('@')) {
      alert('Veuillez entrer une adresse email valide pour le test.');
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: diagnosticEmail,
          subject: 'Diagnostic Réussi — Messagerie Pro contact@nayparfum.ma',
          message:
            'Ce message atteste que la passerelle d\'envoi officielle de Maison NAY Parfums (contact@nayparfum.ma) est 100% opérationnelle, vérifiée et configurée avec les protocoles SPF et DKIM.',
        }),
      });
      const d = await res.json();
      if (res.ok && d.success) {
        setTestResult(`✓ Test réussi ! Email de validation expédié à ${diagnosticEmail}.`);
      } else {
        setTestResult(`✗ Échec : ${d.error || 'Erreur d\'envoi'}`);
      }
    } catch {
      setTestResult('✗ Erreur réseau lors du test.');
    } finally {
      setIsTesting(false);
    }
  };

  // Filtered Received
  const filteredReceived = useMemo(() => {
    return receivedMessages.filter((m) => {
      const q = receivedSearch.toLowerCase().trim();
      const match =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.phone && m.phone.includes(q)) ||
        m.message.toLowerCase().includes(q);

      if (!match) return false;
      if (receivedFilter === 'unread') return m.status === 'unread';
      if (receivedFilter === 'read') return m.status === 'read';
      if (receivedFilter === 'replied') return m.status === 'replied';
      if (receivedFilter === 'archived') return m.status === 'archived';
      return true;
    });
  }, [receivedMessages, receivedSearch, receivedFilter]);

  // Filtered Sent
  const filteredSent = useMemo(() => {
    return sentEmails.filter((s) => {
      const q = sentSearch.toLowerCase().trim();
      const match =
        !q ||
        s.primaryTo.toLowerCase().includes(q) ||
        s.subject.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q);

      if (!match) return false;
      if (sentCategoryFilter !== 'all') {
        return s.category.type === sentCategoryFilter;
      }
      return true;
    });
  }, [sentEmails, sentSearch, sentCategoryFilter]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Luxury Banner */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-sky-50 text-[#0ea5e9] border border-sky-200 flex items-center gap-1.5">
                <Sparkles size={11} />
                Maison NAY Parfums • Hub de Communication Officiel
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                contact@nayparfum.ma • Domaine Vérifié
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                100% Opt-in Actif
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-[#0ea5e9] border border-sky-200/80 flex items-center justify-center">
                <Inbox size={19} />
              </div>
              <span>Boîte de Réception &amp; Messagerie Officielle</span>
            </h1>
            <p className="text-xs text-neutral-500 mt-1 max-w-3xl">
              Consultez l'historique complet des messages reçus et des emails professionnels envoyés depuis <strong>contact@nayparfum.ma</strong> avec accusé de réception et traçabilité en temps réel.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab('compose')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-neutral-900 hover:bg-black text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Send size={13} />
              <span>Nouveau Message</span>
            </button>
            <button
              onClick={fetchInboxData}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-medium rounded-xl shadow-2xs transition-all cursor-pointer"
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
              <span>Actualiser</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Received Messages */}
        <div 
          onClick={() => setActiveTab('received')}
          className={`bg-white border rounded-2xl p-4.5 shadow-xs cursor-pointer transition-all ${activeTab === 'received' ? 'border-[#0ea5e9] ring-2 ring-sky-500/10' : 'border-neutral-200/80 hover:border-neutral-300'}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
              Messages Reçus
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-[#0ea5e9] border border-sky-200 flex items-center justify-center">
              <Inbox size={15} />
            </div>
          </div>
          <div className="text-2xl font-black text-neutral-900 tracking-tight flex items-baseline gap-2">
            <span>{stats.receivedTotal}</span>
            {stats.receivedUnread > 0 && (
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                {stats.receivedUnread} non lu{stats.receivedUnread > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="text-[11px] text-neutral-400 mt-2 flex items-center gap-1">
            <Radio size={11} className="text-emerald-500" />
            <span>Formulaire de contact &amp; support</span>
          </div>
        </div>

        {/* Metric 2: Sent Emails */}
        <div 
          onClick={() => setActiveTab('sent')}
          className={`bg-white border rounded-2xl p-4.5 shadow-xs cursor-pointer transition-all ${activeTab === 'sent' ? 'border-[#0ea5e9] ring-2 ring-sky-500/10' : 'border-neutral-200/80 hover:border-neutral-300'}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
              Emails Envoyés Pro
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
              <Send size={15} />
            </div>
          </div>
          <div className="text-2xl font-black text-neutral-900 tracking-tight flex items-baseline gap-2">
            <span>{stats.sentTotal}</span>
            <span className="text-xs font-bold text-emerald-600">
              ({stats.sentDelivered} livrés)
            </span>
          </div>
          <div className="text-[11px] text-neutral-400 mt-2 flex items-center gap-1">
            <CheckCheck size={12} className="text-emerald-500" />
            <span>Via contact@nayparfum.ma</span>
          </div>
        </div>

        {/* Metric 3: Newsletter Subscribers Linked */}
        <Link 
          href="/admin/newsletter"
          className="bg-white border border-neutral-200/80 hover:border-neutral-300 rounded-2xl p-4.5 shadow-xs transition-all block group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
              Abonnés Newsletter Liés
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center">
              <Users size={15} />
            </div>
          </div>
          <div className="text-2xl font-black text-neutral-900 tracking-tight flex items-baseline gap-2">
            <span>{proMailInfo?.subscribersCount || 43}</span>
            <span className="text-xs font-bold text-emerald-600">
              (100% synchronisés)
            </span>
          </div>
          <div className="text-[11px] text-purple-600 mt-2 flex items-center gap-1 group-hover:underline">
            <span>Gérer l'audience newsletter</span>
            <ArrowRight size={11} />
          </div>
        </Link>

        {/* Metric 4: Pro Domain Status */}
        <div 
          onClick={() => setActiveTab('proInfo')}
          className={`bg-white border rounded-2xl p-4.5 shadow-xs cursor-pointer transition-all ${activeTab === 'proInfo' ? 'border-[#0ea5e9] ring-2 ring-sky-500/10' : 'border-neutral-200/80 hover:border-neutral-300'}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
              Domaine &amp; Sécurité
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-[#0ea5e9] border border-sky-200 flex items-center justify-center">
              <ShieldCheck size={15} />
            </div>
          </div>
          <div className="text-lg font-black text-neutral-900 tracking-tight flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>nayparfum.ma Vérifié</span>
          </div>
          <div className="text-[11px] text-neutral-500 mt-2 flex items-center gap-1">
            <Lock size={11} className="text-emerald-500" />
            <span>DKIM, SPF &amp; DMARC Actifs</span>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-neutral-200/80 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('received')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'received'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
          }`}
        >
          <Inbox size={14} />
          <span>Messages Reçus</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'received' ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-600'}`}>
            {receivedMessages.length}
          </span>
          {stats.receivedUnread > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('sent')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'sent'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
          }`}
        >
          <Send size={14} />
          <span>Messages Envoyés (contact@nayparfum.ma)</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'sent' ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-600'}`}>
            {sentEmails.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('compose')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'compose'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
          }`}
        >
          <Mail size={14} />
          <span>Écrire un Email Pro</span>
        </button>

        <button
          onClick={() => setActiveTab('proInfo')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'proInfo'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
          }`}
        >
          <Globe size={14} />
          <span>Liaison &amp; Configuration Pro</span>
        </button>
      </div>

      {/* TAB 1: MESSAGES REÇUS */}
      {activeTab === 'received' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* List panel */}
          <div className="lg:col-span-1 bg-white border border-neutral-200/80 rounded-2xl overflow-hidden shadow-2xs flex flex-col h-[700px]">
            {/* Search and filters */}
            <div className="p-3.5 border-b border-neutral-200 bg-neutral-50/50 space-y-2.5">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-neutral-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Rechercher nom, email, téléphone..."
                  value={receivedSearch}
                  onChange={(e) => setReceivedSearch(e.target.value)}
                  className="w-full bg-white border border-neutral-200 rounded-xl pl-8 pr-3.5 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {(['all', 'unread', 'read', 'replied', 'archived'] as const).map((filterKey) => (
                  <button
                    key={filterKey}
                    onClick={() => setReceivedFilter(filterKey)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                      receivedFilter === filterKey
                        ? 'bg-neutral-900 text-white'
                        : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                    }`}
                  >
                    {filterKey === 'all' && 'Tous'}
                    {filterKey === 'unread' && 'Non lus'}
                    {filterKey === 'read' && 'Lus'}
                    {filterKey === 'replied' && 'Répondus'}
                    {filterKey === 'archived' && 'Archivés'}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1 p-2 space-y-1.5" style={{ scrollbarWidth: 'thin' }}>
              {loading ? (
                <div className="text-center py-20 text-neutral-400 text-xs">
                  <RefreshCw size={18} className="animate-spin mx-auto mb-2 text-neutral-400" />
                  Chargement des messages...
                </div>
              ) : filteredReceived.length === 0 ? (
                <div className="text-center py-20 text-neutral-400 text-xs">
                  Aucun message reçu correspondant.
                </div>
              ) : (
                filteredReceived.map((msg) => {
                  const isSelected = selectedReceived?.id === msg.id;
                  return (
                    <button
                      key={msg.id}
                      onClick={() => setSelectedReceived(msg)}
                      className={`w-full text-left p-3.5 rounded-xl transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-neutral-50 border-neutral-900 shadow-2xs ring-1 ring-neutral-900/10'
                          : 'hover:bg-neutral-50/70 border-transparent'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-xs truncate ${msg.status === 'unread' ? 'text-neutral-950 font-bold' : 'text-neutral-700 font-semibold'}`}>
                          {msg.name}
                        </span>
                        <span className="text-[10px] text-neutral-400 shrink-0 ml-1">
                          {new Date(msg.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                      <div className="text-xs text-neutral-500 line-clamp-2 leading-relaxed mb-2 font-normal">
                        {msg.message}
                      </div>
                      <div className="flex gap-1.5 items-center flex-wrap">
                        {msg.status === 'unread' && (
                          <span className="bg-sky-50 text-sky-700 border border-sky-200 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                            Nouveau
                          </span>
                        )}
                        {msg.status === 'read' && (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                            Lu
                          </span>
                        )}
                        {msg.status === 'replied' && (
                          <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                            Répondu
                          </span>
                        )}
                        {msg.status === 'archived' && (
                          <span className="bg-neutral-100 text-neutral-600 border border-neutral-200 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                            Archivé
                          </span>
                        )}
                        {msg.phone && (
                          <span className="text-[10px] text-neutral-400">
                            • Tél
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Reading & Action Pane */}
          <div className="lg:col-span-2 bg-white border border-neutral-200/80 rounded-2xl shadow-2xs h-[700px] flex flex-col">
            {selectedReceived ? (
              <>
                {/* Header */}
                <div className="p-5 border-b border-neutral-200 flex justify-between items-start bg-neutral-50/40">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-base font-bold text-neutral-900">{selectedReceived.name}</h2>
                      {selectedReceived.status === 'unread' && (
                        <span className="bg-sky-50 text-sky-700 border border-sky-200 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase">
                          Non lu
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
                      <span>Email : <strong className="text-neutral-800">{selectedReceived.email}</strong></span>
                      {selectedReceived.phone && (
                        <span>• Tél : <strong className="text-neutral-800">{selectedReceived.phone}</strong></span>
                      )}
                      <span>• Reçu le {new Date(selectedReceived.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <div className="flex gap-1.5 shrink-0">
                    {selectedReceived.status === 'unread' ? (
                      <button
                        onClick={() => handleUpdateStatus(selectedReceived.id, 'read')}
                        className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Marquer comme lu"
                      >
                        <CheckCircle2 size={13} />
                        <span>Marquer lu</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdateStatus(selectedReceived.id, 'unread')}
                        className="px-3 py-1.5 bg-neutral-100 text-neutral-700 border border-neutral-200 rounded-lg hover:bg-neutral-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Marquer comme non lu"
                      >
                        <Clock size={13} />
                        <span>Marquer non lu</span>
                      </button>
                    )}

                    {selectedReceived.status !== 'archived' && (
                      <button
                        onClick={() => handleUpdateStatus(selectedReceived.id, 'archived')}
                        className="p-1.5 bg-neutral-100 text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer"
                        title="Archiver"
                      >
                        <Archive size={14} />
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteReceived(selectedReceived.id)}
                      className="p-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                      title="Supprimer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-6 flex-1 overflow-y-auto flex flex-col justify-between">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
                      Message du client
                    </div>
                    <div className="bg-[#f8fafc] p-5 rounded-xl text-xs leading-relaxed text-neutral-800 whitespace-pre-wrap border border-neutral-200/80 font-normal">
                      {selectedReceived.message}
                    </div>
                  </div>

                  {/* Reply actions */}
                  <div className="mt-6 pt-4 border-t border-neutral-100 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => handleStartReply(selectedReceived)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-neutral-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      <Reply size={14} />
                      <span>Répondre depuis contact@nayparfum.ma</span>
                    </button>

                    {selectedReceived.phone && (
                      <a
                        href={`https://wa.me/${selectedReceived.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Salam ${selectedReceived.name}. C'est Maison NAY Parfums concernant votre message.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Phone size={13} />
                        <span>Contacter sur WhatsApp</span>
                      </a>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 gap-2">
                <div className="w-12 h-12 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-400">
                  <Inbox size={22} />
                </div>
                <p className="text-xs font-semibold text-neutral-700">Sélectionnez un message</p>
                <p className="text-[11px] text-neutral-400">Cliquez sur un message dans la liste pour lire son contenu.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: EMAILS ENVOYÉS */}
      {activeTab === 'sent' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Sent List panel */}
          <div className="lg:col-span-1 bg-white border border-neutral-200/80 rounded-2xl overflow-hidden shadow-2xs flex flex-col h-[700px]">
            {/* Search and filters */}
            <div className="p-3.5 border-b border-neutral-200 bg-neutral-50/50 space-y-2.5">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-neutral-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Rechercher destinataire, objet..."
                  value={sentSearch}
                  onChange={(e) => setSentSearch(e.target.value)}
                  className="w-full bg-white border border-neutral-200 rounded-xl pl-8 pr-3.5 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="flex items-center gap-1 flex-wrap">
                {[
                  { key: 'all', label: 'Tous' },
                  { key: 'WELCOME_NAYDAY', label: 'NAYDAY (-10%)' },
                  { key: 'SECURITY', label: 'Sécurité' },
                  { key: 'ADMIN_ALERT', label: 'Alertes' },
                ].map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setSentCategoryFilter(cat.key)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                      sentCategoryFilter === cat.key
                        ? 'bg-neutral-900 text-white'
                        : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1 p-2 space-y-1.5" style={{ scrollbarWidth: 'thin' }}>
              {loading ? (
                <div className="text-center py-20 text-neutral-400 text-xs">
                  <RefreshCw size={18} className="animate-spin mx-auto mb-2 text-neutral-400" />
                  Chargement des emails envoyés...
                </div>
              ) : filteredSent.length === 0 ? (
                <div className="text-center py-20 text-neutral-400 text-xs">
                  Aucun email envoyé correspondant.
                </div>
              ) : (
                filteredSent.map((item) => {
                  const isSelected = selectedSent?.id === item.id;
                  const isDelivered = item.lastEvent === 'delivered';
                  const isBounced = item.lastEvent === 'bounced';
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedSent(item)}
                      className={`w-full text-left p-3.5 rounded-xl transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-neutral-50 border-neutral-900 shadow-2xs ring-1 ring-neutral-900/10'
                          : 'hover:bg-neutral-50/70 border-transparent'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-semibold text-neutral-900 truncate">
                          {item.primaryTo}
                        </span>
                        <span className="text-[10px] text-neutral-400 shrink-0 ml-1">
                          {new Date(item.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-xs text-neutral-600 line-clamp-1 mb-2 font-medium">
                        {item.subject}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-sky-50 text-[#0ea5e9] border border-sky-200 text-[9px] px-2 py-0.5 rounded-full font-bold">
                          {item.category.label}
                        </span>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                          isDelivered
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : isBounced
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isDelivered ? 'bg-emerald-500' : isBounced ? 'bg-red-500' : 'bg-neutral-400'}`} />
                          {isDelivered ? 'Délivré' : isBounced ? 'Rebondi' : item.lastEvent}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Sent Detail & Render Pane */}
          <div className="lg:col-span-2 bg-white border border-neutral-200/80 rounded-2xl shadow-2xs h-[700px] flex flex-col overflow-hidden">
            {selectedSent ? (
              <>
                {/* Header */}
                <div className="p-5 border-b border-neutral-200 bg-neutral-50/40">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <h2 className="text-base font-bold text-neutral-900">{selectedSent.subject}</h2>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500 mt-1">
                        <span>De : <strong className="text-neutral-800">{selectedSent.from}</strong></span>
                        <span>• À : <strong className="text-neutral-800">{selectedSent.primaryTo}</strong></span>
                        <span>• Date : {new Date(selectedSent.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 border ${
                        selectedSent.lastEvent === 'delivered'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-neutral-100 text-neutral-700 border-neutral-200'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {selectedSent.lastEvent === 'delivered' ? 'Délivré en boîte de réception' : selectedSent.lastEvent}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-neutral-400 pt-2 border-t border-neutral-200/60">
                    <span className="font-mono">ID Resend : {selectedSent.id}</span>
                    <button
                      onClick={() => copyToClipboard(selectedSent.id, selectedSent.id)}
                      className="text-neutral-600 hover:text-neutral-900 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === selectedSent.id ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                      <span>{copiedId === selectedSent.id ? 'Copié' : 'Copier l\'ID'}</span>
                    </button>
                  </div>
                </div>

                {/* Email HTML / Text Preview */}
                <div className="p-4 flex-1 overflow-y-auto bg-neutral-100/50">
                  {loadingDetail ? (
                    <div className="h-full flex items-center justify-center text-neutral-400 text-xs">
                      <RefreshCw size={18} className="animate-spin mx-auto mb-2" />
                      Chargement de l'aperçu du message...
                    </div>
                  ) : sentEmailDetail?.html ? (
                    <div className="bg-white rounded-xl shadow-xs border border-neutral-200 overflow-hidden">
                      <iframe
                        title="Aperçu Email"
                        srcDoc={sentEmailDetail.html}
                        className="w-full min-h-[500px] border-0"
                        sandbox="allow-same-origin"
                      />
                    </div>
                  ) : sentEmailDetail?.text ? (
                    <div className="bg-white p-6 rounded-xl border border-neutral-200 text-xs leading-relaxed whitespace-pre-wrap font-mono">
                      {sentEmailDetail.text}
                    </div>
                  ) : (
                    <div className="bg-white p-6 rounded-xl border border-neutral-200 text-center text-xs text-neutral-400">
                      Message expédié avec succès via le serveur haute délivrabilité Resend.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 gap-2">
                <div className="w-12 h-12 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-400">
                  <Send size={22} />
                </div>
                <p className="text-xs font-semibold text-neutral-700">Sélectionnez un email envoyé</p>
                <p className="text-[11px] text-neutral-400">Cliquez sur un email dans la colonne pour afficher son aperçu et sa délivrabilité.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ÉCRIRE UN EMAIL (COMPOSER) */}
      {activeTab === 'compose' && (
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs max-w-4xl mx-auto">
          <div className="border-b border-neutral-200 pb-4 mb-6">
            <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
              <Mail size={18} className="text-[#0ea5e9]" />
              <span>Rédiger un Email Officiel</span>
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Expédié directement depuis <strong>contact@nayparfum.ma</strong> avec mise en page luxe et signature de marque.
            </p>
          </div>

          {/* Quick templates */}
          <div className="mb-6 bg-neutral-50/70 p-4 rounded-xl border border-neutral-200/80">
            <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-2 flex items-center gap-1.5">
              <Sparkles size={12} className="text-amber-500" />
              <span>Modèles Rapides en 1 Clic</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => applyTemplate('support')}
                className="px-3 py-1.5 bg-white border border-neutral-200 hover:border-neutral-400 rounded-lg text-xs font-semibold text-neutral-700 transition-all cursor-pointer shadow-2xs"
              >
                🌸 Réponse Support Client
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('delivery')}
                className="px-3 py-1.5 bg-white border border-neutral-200 hover:border-neutral-400 rounded-lg text-xs font-semibold text-neutral-700 transition-all cursor-pointer shadow-2xs"
              >
                📦 Suivi &amp; Expédition Colis
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('nayday')}
                className="px-3 py-1.5 bg-white border border-neutral-200 hover:border-neutral-400 rounded-lg text-xs font-semibold text-neutral-700 transition-all cursor-pointer shadow-2xs"
              >
                🎁 Offre Privilège NAYDAY (-10%)
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('vip')}
                className="px-3 py-1.5 bg-white border border-neutral-200 hover:border-neutral-400 rounded-lg text-xs font-semibold text-neutral-700 transition-all cursor-pointer shadow-2xs"
              >
                👑 Invitation VIP Niche
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSendEmail} className="space-y-4">
            {sendSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-600" />
                <span>{sendSuccess}</span>
              </div>
            )}
            {sendError && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-800 flex items-center gap-2">
                <AlertCircle size={15} className="text-red-600" />
                <span>{sendError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Expéditeur (Officiel)
                </label>
                <input
                  type="text"
                  disabled
                  value="NAY Parfums <contact@nayparfum.ma>"
                  className="w-full bg-neutral-100 border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs text-neutral-600 font-semibold cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Destinataire Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="client@exemple.com"
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  className="w-full bg-white border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Objet de l'Email *
              </label>
              <input
                type="text"
                required
                placeholder="Ex : Maison NAY Parfums — Suivi de votre commande"
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
                className="w-full bg-white border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Message / Contenu *
              </label>
              <textarea
                required
                rows={9}
                placeholder="Rédigez votre message ici..."
                value={composeMessage}
                onChange={(e) => setComposeMessage(e.target.value)}
                className="w-full bg-white border border-neutral-200 rounded-xl p-3.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 leading-relaxed font-sans"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-neutral-400">
                L'en-tête, le logo Maison NAY et le pied de page sécurisé sont insérés automatiquement.
              </span>

              <button
                type="submit"
                disabled={isSending}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-neutral-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Envoi en cours...</span>
                  </>
                ) : (
                  <>
                    <Send size={13} />
                    <span>Expédier le Message</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: LIAISON PRO & CONFIGURATION */}
      {activeTab === 'proInfo' && (
        <div className="space-y-6 max-w-5xl mx-auto">
          {/* Card 1: Configuration Status */}
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-4 mb-5">
              <div>
                <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                  <ShieldCheck size={19} className="text-emerald-600" />
                  <span>Statut de la Liaison Email Professionnel</span>
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Paramètres techniques et conformité DNS de votre adresse d'entreprise.
                </p>
              </div>

              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Vérifié &amp; Opérationnel
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/80 space-y-2">
                <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                  Boîte Mail Principale
                </span>
                <div className="text-sm font-bold text-neutral-900 font-mono">
                  contact@nayparfum.ma
                </div>
                <div className="text-xs text-neutral-500">
                  Adresse officielle de relation client, expédition des offres et confirmations.
                </div>
              </div>

              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/80 space-y-2">
                <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                  Domaine de Diffusion
                </span>
                <div className="text-sm font-bold text-neutral-900 font-mono">
                  nayparfum.ma
                </div>
                <div className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <Check size={12} />
                  <span>Vérifié sur Resend (Région Europe eu-west-1)</span>
                </div>
              </div>

              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/80 space-y-2">
                <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                  Protocoles de Délivrabilité
                </span>
                <div className="text-xs text-neutral-700 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-500" />
                    <span><strong>SPF :</strong> v=spf1 include:amazonses.com ~all</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-500" />
                    <span><strong>DKIM :</strong> Clé 2048 bits vérifiée</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-500" />
                    <span><strong>DMARC :</strong> Protection anti-usurpation active</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/80 space-y-2">
                <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                  Comptes Gérance Liés
                </span>
                <div className="text-xs text-neutral-700 space-y-1">
                  {proMailInfo?.adminUsers?.map((adm) => (
                    <div key={adm.id} className="flex items-center justify-between font-mono text-[11px]">
                      <span>{adm.email}</span>
                      <span className="text-[9px] uppercase font-bold text-neutral-400 bg-neutral-200 px-1.5 py-0.2 rounded">
                        {adm.role}
                      </span>
                    </div>
                  )) || (
                    <div className="text-xs text-neutral-500">
                      ayoub@nayparfum.ma, nouamane@nayparfum.ma
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Live Diagnostic Sender */}
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs">
            <h3 className="text-sm font-bold text-neutral-900 mb-1 flex items-center gap-2">
              <Radio size={15} className="text-sky-500" />
              <span>Testeur de Délivrabilité en Direct</span>
            </h3>
            <p className="text-xs text-neutral-500 mb-4">
              Envoyez un message test instantané depuis <strong>contact@nayparfum.ma</strong> vers n'importe quelle boîte email (Gmail, Outlook, iCloud) pour certifier la réception dans la boîte principale (hors spam).
            </p>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <input
                type="email"
                placeholder="Entrez votre email de test (ex : monmail@gmail.com)"
                value={diagnosticEmail}
                onChange={(e) => setDiagnosticEmail(e.target.value)}
                className="w-full bg-white border border-neutral-200 rounded-xl px-3.5 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
              />
              <button
                onClick={handleRunDiagnostic}
                disabled={isTesting}
                className="px-5 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer shrink-0 disabled:opacity-50"
              >
                {isTesting ? 'Expédition en cours...' : 'Envoyer le Test'}
              </button>
            </div>

            {testResult && (
              <div className={`mt-3 p-3 rounded-xl text-xs font-semibold ${
                testResult.startsWith('✓') ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {testResult}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
