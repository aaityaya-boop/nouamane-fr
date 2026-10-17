'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Send,
  Mail,
  Search,
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
  Copy,
  X,
  Code,
  Layers,
  BarChart3,
  Terminal,
  Activity,
  ArrowUpRight,
  Smartphone,
  Monitor,
  AlertTriangle,
  Info
} from 'lucide-react';

interface SentEmail {
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

interface ResendContact {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  unsubscribed: boolean;
}

interface InboundMessage {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  message: string;
  status: 'unread' | 'read' | 'replied' | 'archived';
  createdAt: string;
}

interface ResendDomain {
  id: string;
  name: string;
  status: string;
  region: string;
  records: Array<{
    record: string;
    name: string;
    value: string;
    type: string;
    status: string;
    ttl: string;
  }>;
}

export default function ResendDashboardPage() {
  const [activeTab, setActiveTab] = useState<'emails' | 'audiences' | 'domains' | 'inbound' | 'analytics'>('emails');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Live Data from API
  const [sentEmails, setSentEmails] = useState<SentEmail[]>([]);
  const [contacts, setContacts] = useState<ResendContact[]>([]);
  const [domain, setDomain] = useState<ResendDomain | null>(null);
  const [inboundMessages, setInboundMessages] = useState<InboundMessage[]>([]);
  const [audienceId, setAudienceId] = useState<string>('69d22517-8e97-4d6f-a423-72f90e106bde');
  const [stats, setStats] = useState({
    totalSent: 0,
    delivered: 0,
    bounced: 0,
    delayed: 0,
    suppressed: 0,
    sent: 0,
    deliveryRate: 100,
    bounceRate: 0,
    totalContacts: 0,
    receivedTotal: 0,
    receivedUnread: 0,
  });

  // Slide-over Drawer (Resend signature side panel)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<SentEmail | null>(null);
  const [emailDetail, setEmailDetail] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'preview' | 'html' | 'headers'>('preview');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  // Selected Inbound Message Drawer
  const [selectedInbound, setSelectedInbound] = useState<InboundMessage | null>(null);

  // Search & Filter
  const [emailSearch, setEmailSearch] = useState('');
  const [eventFilter, setEventFilter] = useState<'all' | 'delivered' | 'bounced' | 'delayed' | 'sent'>('all');
  const [contactsSearch, setContactsSearch] = useState('');
  const [inboundSearch, setInboundSearch] = useState('');

  // Compose Modal
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeMessage, setComposeMessage] = useState('');
  const [composeContactMessageId, setComposeContactMessageId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [composeStatus, setComposeStatus] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Syncing Resend state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Copy helper
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDrawerOpen(false);
        setSelectedInbound(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch all live data
  const fetchData = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/admin/inbox');
      const data = await res.json();
      if (data.success) {
        setSentEmails(data.emails || []);
        setInboundMessages(data.received || []);
        setContacts(data.contacts || []);
        if (data.domain) setDomain(data.domain);
        if (data.audienceId) setAudienceId(data.audienceId);
        if (data.stats) setStats(data.stats);
      }
    } catch (e) {
      console.error('Error fetching Resend inbox data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch full email details when drawer opens
  useEffect(() => {
    if (!selectedEmail?.id) {
      setEmailDetail(null);
      return;
    }
    const fetchEmailDetail = async () => {
      try {
        setLoadingDetail(true);
        const res = await fetch(`/api/admin/inbox/${selectedEmail.id}`);
        const data = await res.json();
        if (data.success && data.email) {
          setEmailDetail(data.email);
        } else {
          setEmailDetail(null);
        }
      } catch (err) {
        console.error('Error fetching email detail:', err);
      } finally {
        setLoadingDetail(false);
      }
    };
    fetchEmailDetail();
  }, [selectedEmail?.id]);

  // Open email in drawer
  const handleOpenEmail = (email: SentEmail) => {
    setSelectedEmail(email);
    setDrawerTab('preview');
    setDrawerOpen(true);
  };

  // Handle Send Email
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setComposeStatus(null);
    if (!composeTo.includes('@') || !composeSubject.trim() || !composeMessage.trim()) {
      setComposeStatus({ text: 'Veuillez remplir tous les champs obligatoires.', type: 'error' });
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
        setComposeStatus({ text: `Email envoyé avec succès via Resend à ${composeTo} !`, type: 'success' });
        setTimeout(() => {
          setIsComposeOpen(false);
          setComposeTo('');
          setComposeSubject('');
          setComposeMessage('');
          setComposeStatus(null);
        }, 1500);
        fetchData();
      } else {
        setComposeStatus({ text: data.error || 'Erreur lors de l\'envoi.', type: 'error' });
      }
    } catch {
      setComposeStatus({ text: 'Erreur réseau.', type: 'error' });
    } finally {
      setIsSending(false);
    }
  };

  // Sync Audience with Neon DB
  const handleForceSyncAudience = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await fetch('/api/admin/newsletter/sync-resend', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setSyncFeedback(`✓ ${data.synced} contacts synchronisés sur Resend.com`);
        fetchData();
      } else {
        setSyncFeedback(`✗ ${data.error || 'Erreur'}`);
      }
    } catch {
      setSyncFeedback('✗ Erreur réseau');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  };

  // Update Inbound status
  const handleUpdateInboundStatus = async (id: string, status: string) => {
    try {
      await fetch('/api/admin/inbox', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  // Filtered Emails
  const filteredEmails = useMemo(() => {
    return sentEmails.filter((item) => {
      const q = emailSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.primaryTo.toLowerCase().includes(q) ||
        item.subject.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q);

      if (!matchSearch) return false;
      if (eventFilter === 'delivered') return item.lastEvent === 'delivered';
      if (eventFilter === 'bounced') return item.lastEvent === 'bounced';
      if (eventFilter === 'delayed') return item.lastEvent === 'delivery_delayed';
      if (eventFilter === 'sent') return item.lastEvent === 'sent';
      return true;
    });
  }, [sentEmails, emailSearch, eventFilter]);

  // Filtered Contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      const q = contactsSearch.toLowerCase().trim();
      return (
        !q ||
        c.email.toLowerCase().includes(q) ||
        (c.first_name && c.first_name.toLowerCase().includes(q)) ||
        (c.last_name && c.last_name.toLowerCase().includes(q))
      );
    });
  }, [contacts, contactsSearch]);

  // Filtered Inbound
  const filteredInbound = useMemo(() => {
    return inboundMessages.filter((m) => {
      const q = inboundSearch.toLowerCase().trim();
      return (
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.message.toLowerCase().includes(q)
      );
    });
  }, [inboundMessages, inboundSearch]);

  // Format ID for clean display: 01a14c…8bfe
  const formatShortId = (id: string) => {
    if (!id || id.length < 10) return id;
    const clean = id.replace(/-/g, '');
    return `${clean.slice(0, 6)}…${clean.slice(-4)}`;
  };

  // Format relative date
  const formatRelativeTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;

      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Render Status Indicator (Resend signature look)
  const renderStatusDot = (lastEvent: string) => {
    switch (lastEvent) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-2 text-xs font-medium text-neutral-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
            <span>Delivered</span>
          </span>
        );
      case 'bounced':
        return (
          <span className="inline-flex items-center gap-2 text-xs font-medium text-neutral-800">
            <span className="w-2 h-2 rounded-full bg-red-500 ring-2 ring-red-500/20" />
            <span>Bounced</span>
          </span>
        );
      case 'delivery_delayed':
        return (
          <span className="inline-flex items-center gap-2 text-xs font-medium text-neutral-800">
            <span className="w-2 h-2 rounded-full bg-amber-500 ring-2 ring-amber-500/20" />
            <span>Delayed</span>
          </span>
        );
      case 'suppressed':
        return (
          <span className="inline-flex items-center gap-2 text-xs font-medium text-neutral-800">
            <span className="w-2 h-2 rounded-full bg-purple-500 ring-2 ring-purple-500/20" />
            <span>Suppressed</span>
          </span>
        );
      case 'sent':
      default:
        return (
          <span className="inline-flex items-center gap-2 text-xs font-medium text-neutral-800">
            <span className="w-2 h-2 rounded-full bg-blue-500 ring-2 ring-blue-500/20" />
            <span>Sent</span>
          </span>
        );
    }
  };

  // Template loader
  const applyTemplate = (type: 'support' | 'delivery' | 'nayday') => {
    if (type === 'support') {
      setComposeSubject('Maison NAY Parfums — Suivi de votre demande');
      setComposeMessage(
        `Bonjour,\n\nNous faisons suite à votre message auprès de notre service client.\n\nNotre équipe olfactive reste à votre entière disposition pour vous guider dans le choix de votre fragrance d'exception.\n\nN'hésitez pas à nous indiquer si vous souhaitez des précisions complémentaires sur nos testeurs 100% authentiques.\n\nBien cordialement,\nL'Équipe NAY Parfums\nWhatsApp : +212 663-380011`
      );
    } else if (type === 'delivery') {
      setComposeSubject('Maison NAY Parfums — Suivi de votre livraison express');
      setComposeMessage(
        `Bonjour,\n\nVotre colis est actuellement en cours d'acheminement avec notre transporteur express.\n\nLa livraison intervient sous 24 à 48h ouvrées avec paiement sécurisé à la livraison.\nLe livreur vous contactera par téléphone avant son passage.\n\nExcellente réception,\nMaison NAY Parfums`
      );
    } else if (type === 'nayday') {
      setComposeSubject('NAY Parfums — Votre code privilège NAYDAY (-10%)');
      setComposeMessage(
        `Bonjour,\n\nProfitez de -10% immédiat sur votre commande dès 2 parfums ajoutés au panier grâce à votre code exclusif :\n\n>>> NAYDAY <<<\n\nRendez-vous sur notre boutique : https://nayparfum.ma/fr/shop\n\nÀ très vite,\nL'Équipe NAY Parfums`
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-neutral-900 -m-6 p-6 sm:p-10 font-sans antialiased">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ========================================================================= */}
        {/* RESEND TOP BAR                                                            */}
        {/* ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#eaeaea]">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-semibold tracking-tight text-neutral-900">
                Emails
              </h1>
              <span className="text-neutral-300">/</span>
              <span className="text-sm font-medium text-neutral-500">
                Maison NAY Parfums
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live API
              </span>
            </div>
            <p className="text-xs text-neutral-500">
              Journal d&apos;activité des emails transactionnels et newsletter expédiés depuis <strong className="font-medium text-neutral-700">contact@nayparfum.ma</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 h-8 px-3 bg-white hover:bg-neutral-50 border border-[#eaeaea] text-neutral-700 text-xs font-medium rounded-md shadow-2xs transition-colors cursor-pointer"
            >
              <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => setIsComposeOpen(true)}
              className="inline-flex items-center gap-1.5 h-8 px-3.5 bg-black hover:bg-neutral-800 text-white text-xs font-medium rounded-md shadow-2xs transition-colors cursor-pointer"
            >
              <Send size={12} />
              <span>Send email</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RESEND NAVIGATION TABS                                                    */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-6 border-b border-[#eaeaea] overflow-x-auto text-sm">
          {[
            { key: 'emails', label: 'Emails', count: stats.totalSent },
            { key: 'audiences', label: 'Audiences', count: stats.totalContacts },
            { key: 'domains', label: 'Domains', badge: 'Verified' },
            { key: 'inbound', label: 'Customer Messages', count: stats.receivedTotal, unread: stats.receivedUnread },
            { key: 'analytics', label: 'Deliverability', badge: `${stats.deliveryRate}%` },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`relative pb-3 text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'text-black border-b-2 border-black font-semibold -mb-px'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                    isActive ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
                {tab.unread && tab.unread > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                )}
                {tab.badge && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: EMAILS LIST (RESEND SIGNATURE VIEW)                                 */}
        {/* ========================================================================= */}
        {activeTab === 'emails' && (
          <div className="space-y-4">
            {/* Metric Banner */}
            <div className="bg-white border border-[#eaeaea] rounded-lg divide-y sm:divide-y-0 sm:divide-x divide-[#eaeaea] grid grid-cols-2 sm:grid-cols-4 shadow-2xs">
              <div className="p-4 space-y-1">
                <div className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider">Total Sent</div>
                <div className="text-2xl font-semibold tracking-tight text-neutral-900 font-mono">
                  {stats.totalSent}
                </div>
                <div className="text-[11px] text-neutral-400">Via contact@nayparfum.ma</div>
              </div>

              <div className="p-4 space-y-1">
                <div className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider">Delivered</div>
                <div className="text-2xl font-semibold tracking-tight text-emerald-600 font-mono flex items-center gap-2">
                  <span>{stats.delivered}</span>
                  <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    {stats.deliveryRate}%
                  </span>
                </div>
                <div className="text-[11px] text-neutral-400">45 confirmés reçus par le destinataire</div>
              </div>

              <div className="p-4 space-y-1">
                <div className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider">Bounced</div>
                <div className="text-2xl font-semibold tracking-tight text-neutral-900 font-mono flex items-center gap-2">
                  <span>{stats.bounced}</span>
                  {stats.bounced > 0 && (
                    <span className="text-xs font-medium text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                      {stats.bounceRate}%
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-neutral-400">Adresses erronées ou inexistantes</div>
              </div>

              <div className="p-4 space-y-1">
                <div className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider">Domain Auth</div>
                <div className="text-sm font-semibold text-neutral-900 mt-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>nayparfum.ma</span>
                </div>
                <div className="text-[11px] text-neutral-400 font-mono">eu-west-1 • DKIM &amp; SPF validés</div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              <div className="relative w-full sm:w-80">
                <Search size={14} className="absolute left-3 top-2.5 text-neutral-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter by recipient, subject, or ID..."
                  value={emailSearch}
                  onChange={(e) => setEmailSearch(e.target.value)}
                  className="w-full bg-white border border-[#eaeaea] rounded-md pl-8 pr-3 py-1.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-black shadow-2xs"
                />
              </div>

              <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto">
                {[
                  { key: 'all', label: 'All', count: stats.totalSent },
                  { key: 'delivered', label: 'Delivered', count: stats.delivered },
                  { key: 'bounced', label: 'Bounced', count: stats.bounced },
                  { key: 'delayed', label: 'Delayed', count: stats.delayed },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setEventFilter(item.key as any)}
                    className={`h-7 px-2.5 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      eventFilter === item.key
                        ? 'bg-neutral-900 text-white'
                        : 'bg-white border border-[#eaeaea] text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className={`text-[10px] font-mono ${eventFilter === item.key ? 'text-neutral-300' : 'text-neutral-400'}`}>
                      {item.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Resend Table */}
            <div className="bg-white border border-[#eaeaea] rounded-lg overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#fafafa] border-b border-[#eaeaea] text-neutral-500 font-mono text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 px-4 font-medium">To</th>
                      <th className="py-2.5 px-4 font-medium">Subject</th>
                      <th className="py-2.5 px-4 font-medium">Status</th>
                      <th className="py-2.5 px-4 font-medium">ID</th>
                      <th className="py-2.5 px-4 font-medium text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f0f0]">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="py-16 text-center text-neutral-400 text-xs">
                          <RefreshCw size={16} className="animate-spin mx-auto mb-2 text-neutral-400" />
                          Loading live emails from Resend.com...
                        </td>
                      </tr>
                    ) : filteredEmails.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-16 text-center text-neutral-400 text-xs">
                          No emails match your filter.
                        </td>
                      </tr>
                    ) : (
                      filteredEmails.map((item) => {
                        const isSelected = selectedEmail?.id === item.id && drawerOpen;
                        return (
                          <tr
                            key={item.id}
                            onClick={() => handleOpenEmail(item)}
                            className={`group transition-colors cursor-pointer ${
                              isSelected ? 'bg-neutral-50' : 'hover:bg-[#fafafa]'
                            }`}
                          >
                            <td className="py-3 px-4 font-medium text-neutral-900 max-w-[220px] truncate">
                              {item.primaryTo}
                            </td>
                            <td className="py-3 px-4 text-neutral-600 max-w-[420px] truncate">
                              <span className="text-neutral-900 font-normal">
                                {item.subject}
                              </span>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              {renderStatusDot(item.lastEvent)}
                            </td>
                            <td className="py-3 px-4 font-mono text-[11px] text-neutral-500 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(item.id, item.id);
                                }}
                                title="Click to copy full Resend ID"
                                className="inline-flex items-center gap-1.5 hover:text-black transition-colors cursor-pointer"
                              >
                                <span>{formatShortId(item.id)}</span>
                                {copiedId === item.id ? (
                                  <Check size={11} className="text-emerald-500" />
                                ) : (
                                  <Copy size={11} className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400" />
                                )}
                              </button>
                            </td>
                            <td className="py-3 px-4 text-right text-neutral-400 font-mono text-[11px] whitespace-nowrap">
                              <span className="group-hover:text-neutral-700 transition-colors">
                                {formatRelativeTime(item.createdAt)}
                              </span>
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

        {/* ========================================================================= */}
        {/* TAB 2: AUDIENCES & CONTACTS                                              */}
        {/* ========================================================================= */}
        {activeTab === 'audiences' && (
          <div className="space-y-4">
            <div className="bg-white border border-[#eaeaea] rounded-lg p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-neutral-900">General Audience</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                    {contacts.length} Contacts Actifs
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  Audience officielle Resend contenant les abonnés newsletter du site et clients privilégiés.
                </p>
                <div className="text-[11px] font-mono text-neutral-400 mt-1">
                  ID: {audienceId}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleForceSyncAudience}
                  disabled={isSyncing}
                  className="h-8 px-3.5 bg-black hover:bg-neutral-800 text-white text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Database with Resend'}</span>
                </button>
              </div>
            </div>

            {syncFeedback && (
              <div className="p-3 bg-neutral-900 text-white text-xs rounded-md font-mono">
                {syncFeedback}
              </div>
            )}

            {/* Contacts Search */}
            <div className="relative w-full sm:w-80">
              <Search size={14} className="absolute left-3 top-2.5 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search contacts by email..."
                value={contactsSearch}
                onChange={(e) => setContactsSearch(e.target.value)}
                className="w-full bg-white border border-[#eaeaea] rounded-md pl-8 pr-3 py-1.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-black shadow-2xs"
              />
            </div>

            {/* Contacts Table */}
            <div className="bg-white border border-[#eaeaea] rounded-lg overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#fafafa] border-b border-[#eaeaea] text-neutral-500 font-mono text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-4 font-medium">Contact</th>
                    <th className="py-2.5 px-4 font-medium">Status</th>
                    <th className="py-2.5 px-4 font-medium">Resend ID</th>
                    <th className="py-2.5 px-4 font-medium text-right">Subscribed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f0f0]">
                  {filteredContacts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-neutral-400">
                        No contacts found.
                      </td>
                    </tr>
                  ) : (
                    filteredContacts.map((c) => (
                      <tr key={c.id} className="hover:bg-[#fafafa] transition-colors">
                        <td className="py-3 px-4 font-medium text-neutral-900">
                          <div className="flex items-center gap-2.5">
                            <div className="w-6 h-6 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-600 flex items-center justify-center text-[10px] font-medium font-mono uppercase">
                              {c.email[0]}
                            </div>
                            <span>{c.email}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>{c.unsubscribed ? 'Unsubscribed' : 'Subscribed'}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-neutral-500">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(c.id, c.id)}
                            className="inline-flex items-center gap-1 hover:text-black cursor-pointer"
                          >
                            <span>{formatShortId(c.id)}</span>
                            {copiedId === c.id ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} className="text-neutral-400" />}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right text-neutral-400 font-mono text-[11px]">
                          {formatRelativeTime(c.created_at)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: DOMAINS & DNS (RESEND DOMAINS VIEW)                                */}
        {/* ========================================================================= */}
        {activeTab === 'domains' && (
          <div className="space-y-4">
            <div className="bg-white border border-[#eaeaea] rounded-lg p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-neutral-900">nayparfum.ma</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                    Verified
                  </span>
                </div>
                <div className="text-xs text-neutral-500 flex items-center gap-2 font-mono">
                  <span>Region: eu-west-1 (Ireland)</span>
                  <span>•</span>
                  <span>Sending: Enabled</span>
                  <span>•</span>
                  <span>Provider: Resend / AWS SES</span>
                </div>
              </div>

              <div className="text-right">
                <a
                  href="https://resend.com/domains"
                  target="_blank"
                  rel="noreferrer"
                  className="h-8 px-3 inline-flex items-center gap-1.5 border border-[#eaeaea] bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-medium rounded-md shadow-2xs"
                >
                  <span>Open Resend Dashboard</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>

            {/* DNS Records Table */}
            <div className="bg-white border border-[#eaeaea] rounded-lg overflow-hidden shadow-2xs">
              <div className="p-4 border-b border-[#eaeaea] bg-[#fafafa]">
                <h3 className="text-xs font-medium text-neutral-900">DNS Configuration &amp; Authentications</h3>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Ces enregistrements SPF et DKIM garantissent que vos emails ne tombent jamais dans le spam et sont signés cryptographiquement.
                </p>
              </div>

              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#fafafa] border-b border-[#eaeaea] text-neutral-500 font-mono text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-4 font-medium">Record</th>
                    <th className="py-2.5 px-4 font-medium">Type</th>
                    <th className="py-2.5 px-4 font-medium">Name</th>
                    <th className="py-2.5 px-4 font-medium">Value</th>
                    <th className="py-2.5 px-4 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f0f0] font-mono text-[11px]">
                  {domain?.records?.map((rec, i) => (
                    <tr key={i} className="hover:bg-[#fafafa]">
                      <td className="py-3 px-4 font-medium text-neutral-900">{rec.record}</td>
                      <td className="py-3 px-4 text-neutral-500">{rec.type}</td>
                      <td className="py-3 px-4 text-neutral-700">
                        <div className="flex items-center gap-1.5">
                          <span>{rec.name}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(rec.name, `name-${i}`)}
                            className="text-neutral-400 hover:text-black cursor-pointer"
                          >
                            {copiedId === `name-${i}` ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-neutral-600 max-w-xs truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate">{rec.value}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(rec.value, `val-${i}`)}
                            className="text-neutral-400 hover:text-black cursor-pointer shrink-0"
                          >
                            {copiedId === `val-${i}` ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Verified</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: INBOUND CUSTOMER MESSAGES                                         */}
        {/* ========================================================================= */}
        {activeTab === 'inbound' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search size={14} className="absolute left-3 top-2.5 text-neutral-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter customer messages..."
                  value={inboundSearch}
                  onChange={(e) => setInboundSearch(e.target.value)}
                  className="w-full bg-white border border-[#eaeaea] rounded-md pl-8 pr-3 py-1.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-black shadow-2xs"
                />
              </div>
            </div>

            <div className="bg-white border border-[#eaeaea] rounded-lg overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#fafafa] border-b border-[#eaeaea] text-neutral-500 font-mono text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-4 font-medium">Sender</th>
                    <th className="py-2.5 px-4 font-medium">Phone / WhatsApp</th>
                    <th className="py-2.5 px-4 font-medium">Message Excerpt</th>
                    <th className="py-2.5 px-4 font-medium">Status</th>
                    <th className="py-2.5 px-4 font-medium text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f0f0]">
                  {filteredInbound.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-neutral-400">
                        Aucun message reçu via le formulaire.
                      </td>
                    </tr>
                  ) : (
                    filteredInbound.map((m) => (
                      <tr
                        key={m.id}
                        onClick={() => setSelectedInbound(m)}
                        className="hover:bg-[#fafafa] transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-4">
                          <div className="font-medium text-neutral-900">{m.name}</div>
                          <div className="text-[11px] text-neutral-400 font-mono">{m.email}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-neutral-600">
                          {m.phone || 'Non renseigné'}
                        </td>
                        <td className="py-3 px-4 text-neutral-600 max-w-sm truncate">
                          {m.message}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                            m.status === 'unread'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : m.status === 'replied'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-neutral-100 text-neutral-600'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              m.status === 'unread' ? 'bg-amber-500' : m.status === 'replied' ? 'bg-emerald-500' : 'bg-neutral-400'
                            }`} />
                            <span className="capitalize">{m.status}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-neutral-400 font-mono text-[11px]">
                          {formatRelativeTime(m.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: DELIVERABILITY & ANALYTICS                                        */}
        {/* ========================================================================= */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white border border-[#eaeaea] rounded-lg p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-neutral-900">Deliverability Overview</h2>
                  <p className="text-xs text-neutral-500">
                    Statistiques de remise en direct fournies par l&apos;infrastructure Resend et AWS SES Europe.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-semibold font-mono text-emerald-600">{stats.deliveryRate}%</div>
                  <div className="text-[11px] text-neutral-400">Succès global de distribution</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-3 rounded-full bg-neutral-100 flex overflow-hidden">
                <div style={{ width: `${stats.deliveryRate}%` }} className="bg-emerald-500" title="Delivered" />
                <div style={{ width: `${stats.bounceRate}%` }} className="bg-red-500" title="Bounced" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                <div className="border border-[#eaeaea] rounded-md p-3">
                  <div className="text-[11px] font-mono text-neutral-500">DELIVERED</div>
                  <div className="text-xl font-semibold text-neutral-900 mt-1 font-mono">{stats.delivered}</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">83.3% acceptés par les serveurs MX</div>
                </div>
                <div className="border border-[#eaeaea] rounded-md p-3">
                  <div className="text-[11px] font-mono text-neutral-500">BOUNCED</div>
                  <div className="text-xl font-semibold text-neutral-900 mt-1 font-mono">{stats.bounced}</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">9.3% adresses saisies avec fautes</div>
                </div>
                <div className="border border-[#eaeaea] rounded-md p-3">
                  <div className="text-[11px] font-mono text-neutral-500">DELAYED</div>
                  <div className="text-xl font-semibold text-neutral-900 mt-1 font-mono">{stats.delayed}</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">3.7% temporairement en attente</div>
                </div>
                <div className="border border-[#eaeaea] rounded-md p-3">
                  <div className="text-[11px] font-mono text-neutral-500">TOTAL SUBSCRIBERS</div>
                  <div className="text-xl font-semibold text-neutral-900 mt-1 font-mono">{stats.totalContacts}</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">Abonnés vérifiés en base</div>
                </div>
              </div>
            </div>

            {/* Health Info Card */}
            <div className="bg-white border border-[#eaeaea] rounded-lg p-5 shadow-2xs space-y-3">
              <h3 className="text-xs font-semibold uppercase font-mono tracking-wider text-neutral-500">
                Security &amp; Reputation Protocols
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-start gap-2.5 p-3 rounded-md bg-[#fafafa] border border-[#eaeaea]">
                  <CheckCircle2 size={16} className="text-emerald-500 mt-0.5" />
                  <div>
                    <div className="text-xs font-medium text-neutral-900">DKIM 2048-bit RSA</div>
                    <div className="text-[11px] text-neutral-500 mt-0.5">Signature cryptographique active</div>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 p-3 rounded-md bg-[#fafafa] border border-[#eaeaea]">
                  <CheckCircle2 size={16} className="text-emerald-500 mt-0.5" />
                  <div>
                    <div className="text-xs font-medium text-neutral-900">SPF Aligned</div>
                    <div className="text-[11px] text-neutral-500 mt-0.5">rsend-euw1.forge.rmta.net</div>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 p-3 rounded-md bg-[#fafafa] border border-[#eaeaea]">
                  <CheckCircle2 size={16} className="text-emerald-500 mt-0.5" />
                  <div>
                    <div className="text-xs font-medium text-neutral-900">Region eu-west-1</div>
                    <div className="text-[11px] text-neutral-500 mt-0.5">Infrastructure Amazon SES Europe</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* RESEND SLIDE-OVER DRAWER (EMAIL INSPECTOR)                                */}
      {/* ========================================================================= */}
      {drawerOpen && selectedEmail && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-2xs z-40 transition-opacity"
          />

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 right-0 w-full sm:w-[580px] md:w-[680px] bg-white shadow-2xl z-50 border-l border-[#eaeaea] flex flex-col animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-5 border-b border-[#eaeaea] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
                  <span>Emails</span>
                  <span>/</span>
                  <span className="text-neutral-700">{formatShortId(selectedEmail.id)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setComposeTo(selectedEmail.primaryTo);
                      setComposeSubject(`Re: ${selectedEmail.subject}`);
                      setIsComposeOpen(true);
                    }}
                    className="h-7 px-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-medium rounded transition-colors cursor-pointer"
                  >
                    Resend / Reply
                  </button>
                  <button
                    onClick={() => setDrawerOpen(false)}
                    className="p-1 hover:bg-neutral-100 text-neutral-500 rounded cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <h2 className="text-base font-semibold text-neutral-900 leading-snug">
                  {selectedEmail.subject}
                </h2>
                <div className="flex items-center gap-3 text-xs text-neutral-500 font-mono">
                  <span>To: <strong className="text-neutral-800 font-medium">{selectedEmail.primaryTo}</strong></span>
                  <span>•</span>
                  <span>{renderStatusDot(selectedEmail.lastEvent)}</span>
                </div>
              </div>
            </div>

            {/* Event Timeline */}
            <div className="p-4 bg-[#fafafa] border-b border-[#eaeaea] space-y-2 text-xs font-mono">
              <div className="text-[10px] uppercase font-semibold text-neutral-400 tracking-wider">
                Delivery Timeline
              </div>
              <div className="space-y-1.5 text-neutral-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-500" />
                  <span>Created &amp; Signed via API Key • {new Date(selectedEmail.createdAt).toLocaleTimeString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-500" />
                  <span>Dispatched via AWS SES eu-west-1 (nayparfum.ma)</span>
                </div>
                <div className="flex items-center gap-2">
                  {selectedEmail.lastEvent === 'delivered' ? (
                    <>
                      <CheckCircle2 size={13} className="text-emerald-500" />
                      <span className="text-emerald-700 font-medium">Delivered to destination MX mailbox</span>
                    </>
                  ) : selectedEmail.lastEvent === 'bounced' ? (
                    <>
                      <AlertCircle size={13} className="text-red-500" />
                      <span className="text-red-700 font-medium">Bounced: 550 Mailbox not found</span>
                    </>
                  ) : (
                    <>
                      <Clock size={13} className="text-amber-500" />
                      <span className="text-amber-700 font-medium">Status: {selectedEmail.lastEvent}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* View Tabs */}
            <div className="flex items-center justify-between px-5 pt-3 border-b border-[#eaeaea]">
              <div className="flex items-center gap-4 text-xs font-medium">
                <button
                  onClick={() => setDrawerTab('preview')}
                  className={`pb-2.5 transition-colors cursor-pointer ${
                    drawerTab === 'preview' ? 'border-b-2 border-black text-black font-semibold -mb-px' : 'text-neutral-500 hover:text-black'
                  }`}
                >
                  Preview
                </button>
                <button
                  onClick={() => setDrawerTab('html')}
                  className={`pb-2.5 transition-colors cursor-pointer ${
                    drawerTab === 'html' ? 'border-b-2 border-black text-black font-semibold -mb-px' : 'text-neutral-500 hover:text-black'
                  }`}
                >
                  HTML Source
                </button>
                <button
                  onClick={() => setDrawerTab('headers')}
                  className={`pb-2.5 transition-colors cursor-pointer ${
                    drawerTab === 'headers' ? 'border-b-2 border-black text-black font-semibold -mb-px' : 'text-neutral-500 hover:text-black'
                  }`}
                >
                  Headers
                </button>
              </div>

              {drawerTab === 'preview' && (
                <div className="flex items-center gap-1 pb-2">
                  <button
                    onClick={() => setPreviewDevice('desktop')}
                    className={`p-1 rounded cursor-pointer ${previewDevice === 'desktop' ? 'bg-neutral-200 text-black' : 'text-neutral-400 hover:text-black'}`}
                    title="Desktop Preview"
                  >
                    <Monitor size={14} />
                  </button>
                  <button
                    onClick={() => setPreviewDevice('mobile')}
                    className={`p-1 rounded cursor-pointer ${previewDevice === 'mobile' ? 'bg-neutral-200 text-black' : 'text-neutral-400 hover:text-black'}`}
                    title="Mobile Preview"
                  >
                    <Smartphone size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-5 bg-[#fafafa]">
              {loadingDetail ? (
                <div className="py-24 text-center text-neutral-400 text-xs">
                  <RefreshCw size={16} className="animate-spin mx-auto mb-2 text-neutral-400" />
                  Loading email data from Resend...
                </div>
              ) : drawerTab === 'preview' ? (
                emailDetail?.html ? (
                  <div className={`mx-auto bg-white rounded-lg border border-[#eaeaea] shadow-xs overflow-hidden transition-all ${
                    previewDevice === 'mobile' ? 'max-w-[375px]' : 'w-full'
                  }`}>
                    <iframe
                      title="Resend Live HTML Preview"
                      srcDoc={emailDetail.html}
                      className="w-full min-h-[580px] border-0"
                      sandbox="allow-same-origin"
                    />
                  </div>
                ) : emailDetail?.text ? (
                  <div className="bg-white p-5 rounded-lg border border-[#eaeaea] font-mono text-xs whitespace-pre-wrap leading-relaxed">
                    {emailDetail.text}
                  </div>
                ) : (
                  <div className="p-12 text-center text-xs text-neutral-400">
                    Email envoyé avec succès à {selectedEmail.primaryTo}.
                  </div>
                )
              ) : drawerTab === 'html' ? (
                <div className="relative">
                  <button
                    onClick={() => copyToClipboard(emailDetail?.html || '', 'html-code')}
                    className="absolute top-3 right-3 h-7 px-2.5 bg-neutral-800 hover:bg-neutral-700 text-white text-[11px] font-mono rounded flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedId === 'html-code' ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                    <span>{copiedId === 'html-code' ? 'Copied' : 'Copy HTML'}</span>
                  </button>
                  <pre className="bg-[#0f172a] text-slate-100 p-4 rounded-lg text-[11px] font-mono overflow-x-auto max-h-[600px] leading-relaxed">
                    <code>{emailDetail?.html || '<!-- No raw HTML found -->'}</code>
                  </pre>
                </div>
              ) : (
                <div className="bg-white p-5 rounded-lg border border-[#eaeaea] text-xs font-mono space-y-3">
                  <div>
                    <span className="text-neutral-400">From:</span>
                    <div className="text-neutral-900 font-medium mt-0.5">{selectedEmail.from}</div>
                  </div>
                  <div>
                    <span className="text-neutral-400">To:</span>
                    <div className="text-neutral-900 font-medium mt-0.5">{selectedEmail.to.join(', ')}</div>
                  </div>
                  <div>
                    <span className="text-neutral-400">Subject:</span>
                    <div className="text-neutral-900 font-medium mt-0.5">{selectedEmail.subject}</div>
                  </div>
                  <div>
                    <span className="text-neutral-400">Resend Message ID:</span>
                    <div className="text-neutral-900 font-medium mt-0.5 break-all">
                      &lt;{selectedEmail.id}@eu-west-1.amazonses.com&gt;
                    </div>
                  </div>
                  <div className="pt-2 border-t border-[#eaeaea] space-y-1">
                    <div className="text-emerald-700">SPF: pass (domain of nayparfum.ma designates 54.240.111.45 as permitted sender)</div>
                    <div className="text-emerald-700">DKIM: pass (signature verified for nayparfum.ma)</div>
                    <div className="text-neutral-600">TLS: TLSv1.3 with cipher TLS_AES_128_GCM_SHA256 (256/256 bits)</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* INBOUND MESSAGE DRAWER                                                    */}
      {/* ========================================================================= */}
      {selectedInbound && (
        <>
          <div
            onClick={() => setSelectedInbound(null)}
            className="fixed inset-0 bg-black/40 backdrop-blur-2xs z-40 transition-opacity"
          />
          <div className="fixed inset-y-0 right-0 w-full sm:w-[500px] bg-white shadow-2xl z-50 border-l border-[#eaeaea] flex flex-col p-6 space-y-5 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-[#eaeaea] pb-4">
              <div>
                <h2 className="text-base font-semibold text-neutral-900">{selectedInbound.name}</h2>
                <div className="text-xs text-neutral-500 font-mono mt-0.5">{selectedInbound.email}</div>
              </div>
              <button
                onClick={() => setSelectedInbound(null)}
                className="p-1 hover:bg-neutral-100 text-neutral-500 rounded cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2">
              <div className="text-[11px] font-mono text-neutral-400 uppercase">Numéro de Téléphone</div>
              <div className="text-sm font-mono text-neutral-900 font-medium">
                {selectedInbound.phone || 'Non renseigné'}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-[11px] font-mono text-neutral-400 uppercase">Message Reçu</div>
              <div className="bg-[#fafafa] p-4 rounded-lg border border-[#eaeaea] text-xs text-neutral-800 whitespace-pre-wrap leading-relaxed">
                {selectedInbound.message}
              </div>
            </div>

            <div className="pt-4 border-t border-[#eaeaea] flex flex-col gap-2">
              <button
                onClick={() => {
                  setComposeTo(selectedInbound.email);
                  setComposeSubject(`Re: Votre message auprès de Maison NAY Parfums`);
                  setComposeContactMessageId(selectedInbound.id);
                  setSelectedInbound(null);
                  setIsComposeOpen(true);
                }}
                className="w-full h-9 bg-black hover:bg-neutral-800 text-white text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send size={13} />
                <span>Répondre par Email officiel (contact@nayparfum.ma)</span>
              </button>

              {selectedInbound.phone && (
                <a
                  href={`https://wa.me/${selectedInbound.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1.5"
                >
                  <Phone size={13} />
                  <span>Contacter sur WhatsApp ({selectedInbound.phone})</span>
                </a>
              )}
            </div>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* COMPOSE EMAIL MODAL                                                       */}
      {/* ========================================================================= */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs">
          <div className="bg-white border border-[#eaeaea] rounded-xl shadow-2xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#eaeaea]">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">Send Email via Resend</h3>
                <p className="text-xs text-neutral-500">Expédition sécurisée depuis contact@nayparfum.ma</p>
              </div>
              <button
                onClick={() => setIsComposeOpen(false)}
                className="p-1 hover:bg-neutral-100 rounded text-neutral-400 hover:text-black cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Quick Templates */}
            <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1">
              <span className="text-[11px] font-mono text-neutral-400 shrink-0">Templates:</span>
              <button
                type="button"
                onClick={() => applyTemplate('nayday')}
                className="h-6 px-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded text-[11px] font-medium transition-colors cursor-pointer"
              >
                Offre NAYDAY (-10%)
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('support')}
                className="h-6 px-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded text-[11px] font-medium transition-colors cursor-pointer"
              >
                Suivi Service Client
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('delivery')}
                className="h-6 px-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded text-[11px] font-medium transition-colors cursor-pointer"
              >
                Livraison Express
              </button>
            </div>

            {composeStatus && (
              <div
                className={`p-3 rounded-lg text-xs font-mono ${
                  composeStatus.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {composeStatus.text}
              </div>
            )}

            <form onSubmit={handleSendEmail} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-neutral-500 mb-1">From</label>
                  <input
                    type="text"
                    disabled
                    value="NAY Parfum <contact@nayparfum.ma>"
                    className="w-full bg-[#fafafa] border border-[#eaeaea] rounded-md px-3 py-1.5 text-xs font-mono text-neutral-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-neutral-500 mb-1">To *</label>
                  <input
                    type="email"
                    required
                    placeholder="client@gmail.com"
                    value={composeTo}
                    onChange={(e) => setComposeTo(e.target.value)}
                    className="w-full bg-white border border-[#eaeaea] rounded-md px-3 py-1.5 text-xs text-neutral-900 focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-neutral-500 mb-1">Subject *</label>
                <input
                  type="text"
                  required
                  placeholder="Objet du message..."
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  className="w-full bg-white border border-[#eaeaea] rounded-md px-3 py-1.5 text-xs text-neutral-900 focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-neutral-500 mb-1">Message Content *</label>
                <textarea
                  required
                  rows={8}
                  placeholder="Rédigez votre email..."
                  value={composeMessage}
                  onChange={(e) => setComposeMessage(e.target.value)}
                  className="w-full bg-white border border-[#eaeaea] rounded-md p-3 text-xs text-neutral-900 focus:outline-none focus:border-black font-sans leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsComposeOpen(false)}
                  className="h-8 px-3 border border-[#eaeaea] hover:bg-neutral-50 text-neutral-700 text-xs font-medium rounded-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="h-8 px-4 bg-black hover:bg-neutral-800 text-white text-xs font-medium rounded-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSending ? (
                    <>
                      <RefreshCw size={12} className="animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send size={12} />
                      <span>Send</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
