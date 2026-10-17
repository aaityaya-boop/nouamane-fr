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
  ArrowUpRight
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

export default function ResendStyleInboxPage() {
  const [activeTab, setActiveTab] = useState<'emails' | 'audiences' | 'domains' | 'inbound' | 'overview'>('emails');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data from API
  const [sentEmails, setSentEmails] = useState<SentEmail[]>([]);
  const [contacts, setContacts] = useState<ResendContact[]>([]);
  const [domain, setDomain] = useState<ResendDomain | null>(null);
  const [inboundMessages, setInboundMessages] = useState<InboundMessage[]>([]);
  const [audienceId, setAudienceId] = useState<string>('69d22517-8e97-4d6f-a423-72f90e106bde');
  const [stats, setStats] = useState({
    totalSent: 0,
    delivered: 0,
    bounced: 0,
    deliveryRate: 100,
    totalContacts: 0,
    receivedTotal: 0,
    receivedUnread: 0,
  });

  // Selected Email Drawer (Resend slide-over)
  const [selectedEmail, setSelectedEmail] = useState<SentEmail | null>(null);
  const [emailDetail, setEmailDetail] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'preview' | 'html' | 'headers'>('preview');

  // Search & Filter
  const [emailSearch, setEmailSearch] = useState('');
  const [eventFilter, setEventFilter] = useState<'all' | 'delivered' | 'sent' | 'bounced'>('all');
  const [contactsSearch, setContactsSearch] = useState('');
  const [inboundSearch, setInboundSearch] = useState('');
  const [inboundFilter, setInboundFilter] = useState<'all' | 'unread' | 'read' | 'replied'>('all');

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
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

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

        // Auto select first email if none selected
        if (!selectedEmail && data.emails?.length > 0) {
          setSelectedEmail(data.emails[0]);
        }
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

  // Fetch email details when drawer opens / selected
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
        console.error('Error fetching detail:', err);
      } finally {
        setLoadingDetail(false);
      }
    };
    fetchEmailDetail();
  }, [selectedEmail?.id]);

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
      const match =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.message.toLowerCase().includes(q);
      if (!match) return false;
      if (inboundFilter === 'unread') return m.status === 'unread';
      if (inboundFilter === 'read') return m.status === 'read';
      if (inboundFilter === 'replied') return m.status === 'replied';
      return true;
    });
  }, [inboundMessages, inboundSearch, inboundFilter]);

  // Quick Template Injector
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
    <div className="min-h-screen bg-[#fafafa] text-[#0f172a] -m-6 p-6 sm:p-8 font-sans">
      {/* Resend Top Header Bar */}
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#eaeaea]">
          <div className="flex items-center gap-3">
            {/* Resend Style Brand Icon */}
            <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-bold text-lg shadow-sm">
              <span className="tracking-tighter">N</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-neutral-900">
                  Resend.com
                </h1>
                <span className="text-neutral-400">/</span>
                <span className="text-sm font-semibold text-neutral-600">
                  Maison NAY Parfums
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live API
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5 font-mono">
                <span>nayparfum.ma</span>
                <span>•</span>
                <span>contact@nayparfum.ma</span>
                <span>•</span>
                <span>eu-west-1</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-neutral-50 border border-[#eaeaea] text-neutral-700 text-xs font-semibold rounded-lg shadow-2xs transition-all cursor-pointer"
            >
              <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
              <span>Actualiser</span>
            </button>

            <button
              onClick={() => setIsComposeOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-all cursor-pointer"
            >
              <Send size={12} />
              <span>Send Email</span>
            </button>
          </div>
        </div>

        {/* Resend Top Navigation Tabs */}
        <div className="flex items-center gap-1 border-b border-[#eaeaea] pb-px overflow-x-auto">
          {[
            { key: 'emails', label: 'Emails', count: stats.totalSent },
            { key: 'audiences', label: 'Audiences & Contacts', count: stats.totalContacts },
            { key: 'domains', label: 'Domains (nayparfum.ma)', badge: 'Verified' },
            { key: 'inbound', label: 'Messages Formulaire', count: stats.receivedTotal, unread: stats.receivedUnread },
            { key: 'overview', label: 'Analytics & Delivery', badge: `${stats.deliveryRate}%` },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`relative px-4 py-2.5 text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'text-neutral-900 border-b-2 border-black font-bold -mb-px'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-neutral-900 text-white' : 'bg-neutral-200/80 text-neutral-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
                {tab.unread && tab.unread > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                )}
                {tab.badge && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-700 font-bold border border-emerald-500/20">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: RESEND EMAILS TABLE                                                */}
        {/* ========================================================================= */}
        {activeTab === 'emails' && (
          <div className="space-y-4">
            {/* Metric Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white border border-[#eaeaea] rounded-xl p-3.5 shadow-2xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 font-mono">Total Sent</div>
                <div className="text-xl font-bold text-neutral-900 mt-1 font-mono">{stats.totalSent}</div>
                <div className="text-[10px] text-neutral-500 mt-0.5">Via contact@nayparfum.ma</div>
              </div>

              <div className="bg-white border border-[#eaeaea] rounded-xl p-3.5 shadow-2xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 font-mono">Delivered Rate</div>
                <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">{stats.deliveryRate}%</div>
                <div className="text-[10px] text-emerald-700 mt-0.5">{stats.delivered} emails confirmés</div>
              </div>

              <div className="bg-white border border-[#eaeaea] rounded-xl p-3.5 shadow-2xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 font-mono">Bounced</div>
                <div className="text-xl font-bold text-neutral-900 mt-1 font-mono">{stats.bounced}</div>
                <div className="text-[10px] text-neutral-500 mt-0.5">Adresses erronées rejetées</div>
              </div>

              <div className="bg-white border border-[#eaeaea] rounded-xl p-3.5 shadow-2xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 font-mono">Domain Auth</div>
                <div className="text-base font-bold text-neutral-900 mt-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Verified</span>
                </div>
                <div className="text-[10px] text-neutral-500 mt-0.5 font-mono">SPF &amp; DKIM active</div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white border border-[#eaeaea] rounded-xl p-3 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-96">
                <Search size={14} className="absolute left-3 top-2.5 text-neutral-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter emails by recipient, subject or ID..."
                  value={emailSearch}
                  onChange={(e) => setEmailSearch(e.target.value)}
                  className="w-full bg-[#fafafa] border border-[#eaeaea] rounded-lg pl-8 pr-3 py-1.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-black focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                {(['all', 'delivered', 'sent', 'bounced'] as const).map((filterKey) => (
                  <button
                    key={filterKey}
                    onClick={() => setEventFilter(filterKey)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                      eventFilter === filterKey
                        ? 'bg-neutral-900 text-white shadow-2xs'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/80'
                    }`}
                  >
                    {filterKey === 'all' ? 'All Events' : filterKey}
                  </button>
                ))}
              </div>
            </div>

            {/* Resend Table Layout */}
            <div className="bg-white border border-[#eaeaea] rounded-xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#fcfcfc] border-b border-[#eaeaea] text-neutral-500 font-mono text-[10px] uppercase tracking-wider">
                      <th className="py-2.5 px-4 font-semibold">To</th>
                      <th className="py-2.5 px-4 font-semibold">Subject</th>
                      <th className="py-2.5 px-4 font-semibold">Status</th>
                      <th className="py-2.5 px-4 font-semibold">ID</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eaeaea]">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="py-16 text-center text-neutral-400 text-xs">
                          <RefreshCw size={16} className="animate-spin mx-auto mb-2" />
                          Loading emails from Resend.com...
                        </td>
                      </tr>
                    ) : filteredEmails.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-16 text-center text-neutral-400 text-xs">
                          No emails match your search.
                        </td>
                      </tr>
                    ) : (
                      filteredEmails.map((item) => {
                        const isSelected = selectedEmail?.id === item.id;
                        const isDelivered = item.lastEvent === 'delivered';
                        const isBounced = item.lastEvent === 'bounced';
                        return (
                          <tr
                            key={item.id}
                            onClick={() => setSelectedEmail(item)}
                            className={`transition-colors cursor-pointer ${
                              isSelected ? 'bg-neutral-100/80' : 'hover:bg-[#fcfcfc]'
                            }`}
                          >
                            <td className="py-3 px-4 font-semibold text-neutral-900 max-w-[220px] truncate">
                              {item.primaryTo}
                            </td>
                            <td className="py-3 px-4 text-neutral-700 max-w-[340px] truncate">
                              <span className="mr-2 px-1.5 py-0.5 rounded text-[10px] bg-neutral-100 font-medium text-neutral-600 border border-neutral-200">
                                {item.category.label}
                              </span>
                              <span>{item.subject}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                                isDelivered
                                  ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
                                  : isBounced
                                  ? 'bg-rose-500/10 text-rose-700 border-rose-500/20'
                                  : 'bg-neutral-500/10 text-neutral-700 border-neutral-500/20'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  isDelivered ? 'bg-emerald-500' : isBounced ? 'bg-rose-500' : 'bg-neutral-400'
                                }`} />
                                <span className="capitalize">{item.lastEvent}</span>
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-[11px] text-neutral-500">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(item.id, item.id);
                                }}
                                className="hover:text-black flex items-center gap-1 cursor-pointer"
                              >
                                <span>{item.id.substring(0, 8)}...</span>
                                {copiedText === item.id ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                              </button>
                            </td>
                            <td className="py-3 px-4 text-right text-neutral-500 font-mono text-[11px] whitespace-nowrap">
                              {new Date(item.createdAt).toLocaleString('fr-FR', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Resend Style Inspector Slide-over Drawer (below table on small screen or split) */}
            {selectedEmail && (
              <div className="bg-white border border-[#eaeaea] rounded-xl p-5 shadow-sm space-y-4">
                {/* Inspector Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#eaeaea]">
                  <div>
                    <h2 className="text-sm font-bold text-neutral-900">{selectedEmail.subject}</h2>
                    <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5 font-mono">
                      <span>To: <strong>{selectedEmail.primaryTo}</strong></span>
                      <span>•</span>
                      <span>ID: {selectedEmail.id}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      selectedEmail.lastEvent === 'delivered'
                        ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
                        : 'bg-neutral-500/10 text-neutral-700 border-neutral-500/20'
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="capitalize">{selectedEmail.lastEvent}</span>
                    </span>

                    <button
                      onClick={() => {
                        setComposeTo(selectedEmail.primaryTo);
                        setComposeSubject(`Re: ${selectedEmail.subject}`);
                        setIsComposeOpen(true);
                      }}
                      className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Resend / Reply
                    </button>
                  </div>
                </div>

                {/* Delivery Timeline (Resend style) */}
                <div className="bg-[#fafafa] p-3 rounded-lg border border-[#eaeaea] text-xs font-mono space-y-1.5">
                  <div className="text-[10px] uppercase font-bold text-neutral-400">Delivery Event Timeline</div>
                  <div className="flex items-center gap-2 text-neutral-700">
                    <CheckCircle2 size={13} className="text-emerald-500" />
                    <span>Created &amp; Handed to AWS SES (eu-west-1) at {new Date(selectedEmail.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-700">
                    <CheckCircle2 size={13} className="text-emerald-500" />
                    <span>Delivered to recipient mailbox ({selectedEmail.lastEvent})</span>
                  </div>
                </div>

                {/* Drawer Tabs */}
                <div className="flex items-center gap-2 border-b border-[#eaeaea] pb-2 text-xs font-semibold">
                  <button
                    onClick={() => setDrawerTab('preview')}
                    className={`px-3 py-1 rounded cursor-pointer ${
                      drawerTab === 'preview' ? 'bg-black text-white' : 'text-neutral-600 hover:bg-neutral-100'
                    }`}
                  >
                    HTML Preview
                  </button>
                  <button
                    onClick={() => setDrawerTab('html')}
                    className={`px-3 py-1 rounded cursor-pointer ${
                      drawerTab === 'html' ? 'bg-black text-white' : 'text-neutral-600 hover:bg-neutral-100'
                    }`}
                  >
                    Raw HTML Source
                  </button>
                  <button
                    onClick={() => setDrawerTab('headers')}
                    className={`px-3 py-1 rounded cursor-pointer ${
                      drawerTab === 'headers' ? 'bg-black text-white' : 'text-neutral-600 hover:bg-neutral-100'
                    }`}
                  >
                    Headers &amp; Metadata
                  </button>
                </div>

                {/* Rendered View */}
                {loadingDetail ? (
                  <div className="py-12 text-center text-neutral-400 text-xs">
                    <RefreshCw size={14} className="animate-spin mx-auto mb-1" />
                    Loading preview...
                  </div>
                ) : drawerTab === 'preview' ? (
                  emailDetail?.html ? (
                    <div className="bg-white rounded-lg border border-[#eaeaea] overflow-hidden">
                      <iframe
                        title="Resend Email Preview"
                        srcDoc={emailDetail.html}
                        className="w-full min-h-[460px] border-0"
                        sandbox="allow-same-origin"
                      />
                    </div>
                  ) : emailDetail?.text ? (
                    <div className="bg-white p-4 rounded-lg border border-[#eaeaea] font-mono text-xs whitespace-pre-wrap">
                      {emailDetail.text}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-xs text-neutral-400">
                      Message délivré avec succès à {selectedEmail.primaryTo}.
                    </div>
                  )
                ) : drawerTab === 'html' ? (
                  <pre className="bg-[#0f172a] text-slate-100 p-4 rounded-lg text-[11px] font-mono overflow-x-auto max-h-96">
                    <code>{emailDetail?.html || '<!-- Pas de code HTML disponible -->'}</code>
                  </pre>
                ) : (
                  <div className="bg-white p-4 rounded-lg border border-[#eaeaea] text-xs font-mono space-y-2">
                    <div><strong>From:</strong> {selectedEmail.from}</div>
                    <div><strong>To:</strong> {selectedEmail.to.join(', ')}</div>
                    <div><strong>Subject:</strong> {selectedEmail.subject}</div>
                    <div><strong>Message-ID:</strong> &lt;{selectedEmail.id}@eu-west-1.amazonses.com&gt;</div>
                    <div><strong>SPF:</strong> pass (domain nayparfum.ma)</div>
                    <div><strong>DKIM:</strong> pass (domain nayparfum.ma)</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: RESEND AUDIENCES & CONTACTS                                       */}
        {/* ========================================================================= */}
        {activeTab === 'audiences' && (
          <div className="space-y-4">
            {/* Header info */}
            <div className="bg-white border border-[#eaeaea] rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-neutral-900">Audience: General</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 font-bold">
                    {contacts.length} Contacts Certifiés
                  </span>
                </div>
                <div className="text-xs text-neutral-500 mt-0.5 font-mono">
                  Audience ID: {audienceId} • Resend.com
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleForceSyncAudience}
                  disabled={isSyncing}
                  className="px-3.5 py-1.5 bg-black hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync with Database'}</span>
                </button>

                <a
                  href="https://resend.com/audiences"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                >
                  <span>Open in Resend.com</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>

            {syncFeedback && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold">
                {syncFeedback}
              </div>
            )}

            {/* Search */}
            <div className="bg-white border border-[#eaeaea] rounded-xl p-3 shadow-2xs">
              <div className="relative w-full sm:w-96">
                <Search size={14} className="absolute left-3 top-2.5 text-neutral-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search contacts by email or name..."
                  value={contactsSearch}
                  onChange={(e) => setContactsSearch(e.target.value)}
                  className="w-full bg-[#fafafa] border border-[#eaeaea] rounded-lg pl-8 pr-3 py-1.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-black focus:bg-white"
                />
              </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-[#eaeaea] rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#fcfcfc] border-b border-[#eaeaea] text-neutral-500 font-mono text-[10px] uppercase tracking-wider">
                    <th className="py-2.5 px-4 font-semibold">Email</th>
                    <th className="py-2.5 px-4 font-semibold">Name</th>
                    <th className="py-2.5 px-4 font-semibold">Status</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Subscribed At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeaea]">
                  {filteredContacts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-neutral-400 text-xs">
                        No contacts found.
                      </td>
                    </tr>
                  ) : (
                    filteredContacts.map((c) => (
                      <tr key={c.id} className="hover:bg-[#fcfcfc] transition-colors">
                        <td className="py-3 px-4 font-semibold text-neutral-900 font-mono">
                          {c.email}
                        </td>
                        <td className="py-3 px-4 text-neutral-600">
                          {c.first_name || c.last_name ? `${c.first_name || ''} ${c.last_name || ''}`.trim() : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>Subscribed</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-neutral-500 font-mono text-[11px]">
                          {new Date(c.created_at).toLocaleString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
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
        {/* TAB 3: RESEND DOMAINS (nayparfum.ma)                                     */}
        {/* ========================================================================= */}
        {activeTab === 'domains' && (
          <div className="space-y-4">
            <div className="bg-white border border-[#eaeaea] rounded-xl p-5 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#eaeaea]">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-neutral-900 font-mono">nayparfum.ma</h2>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Verified</span>
                    </span>
                  </div>
                  <div className="text-xs text-neutral-500 mt-1 font-mono">
                    Domain ID: 8d1c3457-c2f3-4f97-81a9-55d939c65b42 • Region: eu-west-1
                  </div>
                </div>

                <div className="text-xs text-neutral-500 font-mono">
                  Capabilities: Sending: <span className="text-emerald-600 font-bold">Enabled</span>
                </div>
              </div>

              {/* DNS Records Table */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 font-mono mb-2">
                  Configured DNS Records (Resend Authentication)
                </h3>
                <div className="border border-[#eaeaea] rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#fafafa] border-b border-[#eaeaea] text-[10px] text-neutral-500 uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Name</th>
                        <th className="py-2.5 px-3">Value</th>
                        <th className="py-2.5 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eaeaea]">
                      {domain?.records && domain.records.length > 0 ? (
                        domain.records.map((r, idx) => (
                          <tr key={idx} className="hover:bg-[#fcfcfc]">
                            <td className="py-2.5 px-3 font-bold text-neutral-900">{r.record}</td>
                            <td className="py-2.5 px-3 text-neutral-700">{r.name}</td>
                            <td className="py-2.5 px-3 text-neutral-500 max-w-md truncate">{r.value}</td>
                            <td className="py-2.5 px-3 text-right">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-700 font-semibold border border-emerald-500/20">
                                <Check size={10} />
                                <span>Verified</span>
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <>
                          <tr>
                            <td className="py-2.5 px-3 font-bold text-neutral-900">DKIM</td>
                            <td className="py-2.5 px-3 text-neutral-700">resend._domainkey</td>
                            <td className="py-2.5 px-3 text-neutral-500">p=MIGfMA0GCSqGSIb3DQE...</td>
                            <td className="py-2.5 px-3 text-right">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-700 font-semibold border border-emerald-500/20">
                                <Check size={10} />
                                <span>Verified</span>
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-3 font-bold text-neutral-900">SPF</td>
                            <td className="py-2.5 px-3 text-neutral-700">rsend</td>
                            <td className="py-2.5 px-3 text-neutral-500">rsend-euw1.forge.rmta.net</td>
                            <td className="py-2.5 px-3 text-right">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-700 font-semibold border border-emerald-500/20">
                                <Check size={10} />
                                <span>Verified</span>
                              </span>
                            </td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: INBOUND MESSAGES (FORMULAIRE DE CONTACT)                           */}
        {/* ========================================================================= */}
        {activeTab === 'inbound' && (
          <div className="space-y-4">
            <div className="bg-white border border-[#eaeaea] rounded-xl p-3 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-96">
                <Search size={14} className="absolute left-3 top-2.5 text-neutral-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Rechercher nom, email ou contenu..."
                  value={inboundSearch}
                  onChange={(e) => setInboundSearch(e.target.value)}
                  className="w-full bg-[#fafafa] border border-[#eaeaea] rounded-lg pl-8 pr-3 py-1.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-black focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-1.5">
                {(['all', 'unread', 'read', 'replied'] as const).map((k) => (
                  <button
                    key={k}
                    onClick={() => setInboundFilter(k)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                      inboundFilter === k
                        ? 'bg-neutral-900 text-white shadow-2xs'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/80'
                    }`}
                  >
                    {k === 'all' ? 'Tous' : k === 'unread' ? 'Non lus' : k === 'read' ? 'Lus' : 'Répondus'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {filteredInbound.length === 0 ? (
                <div className="bg-white border border-[#eaeaea] rounded-xl p-12 text-center text-xs text-neutral-400">
                  Aucun message reçu.
                </div>
              ) : (
                filteredInbound.map((msg) => (
                  <div key={msg.id} className="bg-white border border-[#eaeaea] rounded-xl p-4 shadow-2xs space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-neutral-900">{msg.name}</h3>
                          {msg.status === 'unread' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20">
                              Nouveau
                            </span>
                          )}
                          {msg.status === 'replied' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-700 border border-purple-500/20">
                              Répondu
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-neutral-500 font-mono mt-0.5">
                          {msg.email} {msg.phone ? `• Tél: ${msg.phone}` : ''} • Reçu le {new Date(msg.createdAt).toLocaleString('fr-FR')}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setComposeTo(msg.email);
                            setComposeSubject(`Re: Votre message à Maison NAY Parfums`);
                            setComposeMessage(`Bonjour ${msg.name},\n\nNous faisons suite à votre message.\n\n\nBien cordialement,\nMaison NAY Parfums\ncontact@nayparfum.ma`);
                            setComposeContactMessageId(msg.id);
                            setIsComposeOpen(true);
                          }}
                          className="px-3 py-1.5 bg-black hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Reply size={12} />
                          <span>Répondre par Email</span>
                        </button>

                        {msg.phone && (
                          <a
                            href={`https://wa.me/${msg.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                          >
                            <Phone size={12} />
                            <span>WhatsApp</span>
                          </a>
                        )}

                        <button
                          onClick={() => handleUpdateInboundStatus(msg.id, msg.status === 'unread' ? 'read' : 'unread')}
                          className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 cursor-pointer"
                          title="Changer statut lu/non-lu"
                        >
                          <CheckCircle2 size={15} />
                        </button>
                      </div>
                    </div>

                    <div className="bg-[#fafafa] p-3.5 rounded-lg border border-[#eaeaea] text-xs text-neutral-800 leading-relaxed whitespace-pre-wrap">
                      {msg.message}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: OVERVIEW & DELIVERY METRICS                                       */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-[#eaeaea] rounded-xl p-5 shadow-2xs space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 font-mono">Délivrabilité Globale</div>
                <div className="text-3xl font-black text-emerald-600 font-mono">{stats.deliveryRate}%</div>
                <p className="text-xs text-neutral-500">
                  {stats.delivered} emails confirmés reçus en boîte de réception sur un total de {stats.totalSent} expédiés.
                </p>
              </div>

              <div className="bg-white border border-[#eaeaea] rounded-xl p-5 shadow-2xs space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 font-mono">Audience Resend</div>
                <div className="text-3xl font-black text-neutral-900 font-mono">{stats.totalContacts}</div>
                <p className="text-xs text-neutral-500">
                  Contacts actifs certifiés dans l'Audience officielle <code>General</code> sur Resend.com.
                </p>
              </div>

              <div className="bg-white border border-[#eaeaea] rounded-xl p-5 shadow-2xs space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 font-mono">Expéditeur Vérifié</div>
                <div className="text-base font-bold text-neutral-900 font-mono">contact@nayparfum.ma</div>
                <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <Check size={12} />
                  <span>DKIM 2048-bit &amp; SPF actifs sur nayparfum.ma</span>
                </p>
              </div>
            </div>

            <div className="bg-white border border-[#eaeaea] rounded-xl p-5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Accéder directement à votre Console Resend.com</h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Gérez vos clés API, vos webhooks et vos logs d'événements avancés sur la plateforme officielle Resend.
                </p>
              </div>

              <a
                href="https://resend.com/emails"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg flex items-center gap-2 shadow-2xs"
              >
                <span>Ouvrir Resend.com Dashboard</span>
                <ArrowUpRight size={13} />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* COMPOSE MODAL (RESEND STYLE DIALOG)                                       */}
      {/* ========================================================================= */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#eaeaea] max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#eaeaea] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-black text-white flex items-center justify-center">
                  <Send size={12} />
                </div>
                <h3 className="text-sm font-bold text-neutral-900">
                  Send Email via Resend.com
                </h3>
              </div>
              <button
                onClick={() => setIsComposeOpen(false)}
                className="text-neutral-400 hover:text-neutral-900 p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Quick Templates */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold uppercase text-neutral-400 font-mono">Modèles :</span>
              <button
                type="button"
                onClick={() => applyTemplate('support')}
                className="px-2.5 py-1 bg-[#fafafa] hover:bg-neutral-100 border border-[#eaeaea] rounded text-[11px] font-medium text-neutral-700 cursor-pointer"
              >
                Support Client
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('delivery')}
                className="px-2.5 py-1 bg-[#fafafa] hover:bg-neutral-100 border border-[#eaeaea] rounded text-[11px] font-medium text-neutral-700 cursor-pointer"
              >
                Suivi Colis
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('nayday')}
                className="px-2.5 py-1 bg-[#fafafa] hover:bg-neutral-100 border border-[#eaeaea] rounded text-[11px] font-medium text-neutral-700 cursor-pointer"
              >
                Code NAYDAY (-10%)
              </button>
            </div>

            <form onSubmit={handleSendEmail} className="space-y-3">
              {composeStatus && (
                <div className={`p-3 rounded-lg text-xs font-semibold ${
                  composeStatus.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {composeStatus.text}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-neutral-500 mb-1">From</label>
                  <input
                    type="text"
                    disabled
                    value="contact@nayparfum.ma"
                    className="w-full bg-[#fafafa] border border-[#eaeaea] rounded-lg px-3 py-2 text-xs font-mono text-neutral-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-neutral-500 mb-1">To *</label>
                  <input
                    type="email"
                    required
                    placeholder="recipient@example.com"
                    value={composeTo}
                    onChange={(e) => setComposeTo(e.target.value)}
                    className="w-full bg-white border border-[#eaeaea] rounded-lg px-3 py-2 text-xs font-mono text-neutral-900 focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-neutral-500 mb-1">Subject *</label>
                <input
                  type="text"
                  required
                  placeholder="Subject line..."
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  className="w-full bg-white border border-[#eaeaea] rounded-lg px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-neutral-500 mb-1">Message Content *</label>
                <textarea
                  required
                  rows={8}
                  placeholder="Write your email message..."
                  value={composeMessage}
                  onChange={(e) => setComposeMessage(e.target.value)}
                  className="w-full bg-white border border-[#eaeaea] rounded-lg p-3 text-xs text-neutral-900 focus:outline-none focus:border-black font-sans leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsComposeOpen(false)}
                  className="px-4 py-2 border border-[#eaeaea] hover:bg-neutral-50 text-neutral-700 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="px-5 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
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
