'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  MessageSquare, 
  Send, 
  Paperclip, 
  Smile, 
  Search, 
  Check, 
  CheckCheck, 
  Clock, 
  Users, 
  Sparkles, 
  Package, 
  ShoppingBag, 
  Plus, 
  X, 
  Trash2, 
  RefreshCw, 
  Image as ImageIcon, 
  UserPlus, 
  AtSign, 
  Hash, 
  DollarSign, 
  ArrowUpRight, 
  ChevronRight, 
  MoreVertical, 
  MapPin, 
  ShieldCheck, 
  Info,
  CheckCircle2,
  Lock,
  Tag,
  Pin,
  Megaphone,
  Truck,
  Flame,
  Bell,
  Filter,
  Eye,
  ChevronDown,
  CheckCircle,
  Zap,
  Shield,
  Crown,
  AlertCircle,
  Compass,
  Layers,
  Copy,
  ExternalLink,
  SlidersHorizontal
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { formatLastSeen, isUserOnline } from '@/lib/userStatus';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  role: string;
  jobTitle?: string | null;
  lastActivityAt?: string | null;
  lastLoginAt?: string | null;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string | null;
  recipientId?: string | null;
  channel: string;
  content: string;
  attachments?: string | null;
  isRead: boolean;
  readAt?: string | null;
  readBy?: string | null;
  createdAt: string;
  sender?: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  } | null;
}

interface ConversationContact extends AdminUser {
  lastMessage?: ChatMessage | null;
  unreadCount?: number;
}

interface ConversationChannel {
  id: string;
  slug: string;
  dbId?: string;
  name: string;
  description: string;
  type: string;
  color?: string;
  isDefault?: boolean;
  memberIds?: string;
  members?: AdminUser[];
  memberCount?: number;
  lastMessage?: ChatMessage | null;
}

interface ProductMentionItem {
  id: number;
  name: string;
  slug: string;
  price: number;
  brand: string;
  stock: number;
  image: string;
}

interface OrderMentionItem {
  id: string;
  orderNumber: string;
  customerName: string;
  shippingCity: string;
  total: number;
  status: string;
  createdAt: string;
}

const QUICK_EMOJIS = ['👍', '🔥', '✅', '❤️', '📦', '🚀', '⏳', '👏', '✨', '👌', '💎', '🎉'];

// Preset definitions for executive default channels
const CHANNEL_PRESETS: Record<string, {
  tag: string;
  icon: any;
  color: string;
  badgeBg: string;
  badgeText: string;
  glowColor: string;
  mission: string;
  pinnedAnnouncement: string;
}> = {
  GENERAL: {
    tag: 'HQ',
    icon: Crown,
    color: 'amber',
    badgeBg: 'bg-amber-500/10 dark:bg-amber-500/20',
    badgeText: 'text-amber-700 dark:text-amber-400 border-amber-300/40 dark:border-amber-500/30',
    glowColor: 'from-amber-500 to-yellow-600',
    mission: 'Coordination générale & vision Maison NAY Parfums',
    pinnedAnnouncement: '📢 Note de Direction : Priorité absolue à l\'excellence du service client et au suivi en temps réel des commandes VIP. Pour toute décision stratégique, taguez @Nouamane ou liez directement le parfum concerné.',
  },
  STOCK: {
    tag: 'INVENTAIRE',
    icon: Package,
    color: 'emerald',
    badgeBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    badgeText: 'text-emerald-700 dark:text-emerald-400 border-emerald-300/40 dark:border-emerald-500/30',
    glowColor: 'from-emerald-500 to-teal-600',
    mission: 'Suivi des niveaux de flacons, concentrés et packagings de luxe',
    pinnedAnnouncement: '📦 Protocole Stock : Vérification biquotidienne des niveaux de flacons 50ml/100ml. Signalez immédiatement toute référence dont le stock physique passe sous le seuil d\'alerte.',
  },
  ORDERS: {
    tag: 'VIP SUIVI',
    icon: ShoppingBag,
    color: 'indigo',
    badgeBg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
    badgeText: 'text-indigo-700 dark:text-indigo-400 border-indigo-300/40 dark:border-indigo-500/30',
    glowColor: 'from-indigo-500 to-blue-600',
    mission: 'Surveillance des paniers à haute valeur et clients fidèles',
    pinnedAnnouncement: '💎 Protocole VIP : Pour toute commande supérieure à 2 parfums (-10% automatique) ou montant > 800 MAD, joindre un vaporisateur testeur offert et vérifier les coordonnées avant expédition.',
  },
  MARKETING: {
    tag: 'ACQUISITION',
    icon: Megaphone,
    color: 'purple',
    badgeBg: 'bg-purple-500/10 dark:bg-purple-500/20',
    badgeText: 'text-purple-700 dark:text-purple-400 border-purple-300/40 dark:border-purple-500/30',
    glowColor: 'from-purple-500 to-pink-600',
    mission: 'Optimisation de l\'acquisition, campagnes Ads et ROAS',
    pinnedAnnouncement: '🎯 Performance Ads : Offre Duo (-10% dès 2 parfums) active sur Meta et TikTok Ads. Surveiller les taux d\'abandon panier et les retours d\'audience quotidiens.',
  },
  LOGISTICS: {
    tag: 'LIVRAISONS',
    icon: Truck,
    color: 'sky',
    badgeBg: 'bg-sky-500/10 dark:bg-sky-500/20',
    badgeText: 'text-sky-700 dark:text-sky-400 border-sky-300/40 dark:border-sky-500/30',
    glowColor: 'from-sky-500 to-cyan-600',
    mission: 'Confirmations téléphoniques COD et suivi des coursiers express',
    pinnedAnnouncement: '🚚 Procédure Enlèvements : Tous les colis validés avant 15h30 partent le jour même. Mentionnez impérativement le numéro de bordereau transporteur pour chaque client.',
  },
};

const QUICK_TEMPLATES = [
  {
    icon: '✅',
    label: 'Validation Commande',
    text: '✅ Commande vérifiée par téléphone et transmise au livreur pour expédition rapide.',
  },
  {
    icon: '📦',
    label: 'Réassort Stocks',
    text: '📦 Contrôle des stocks terminé : prévoir un réassort prioritaire sur cette référence.',
  },
  {
    icon: '🚨',
    label: 'Alerte Rupture',
    text: '🚨 Attention : stock critique signalé sur ce parfum. Veuillez ajuster les campagnes.',
  },
  {
    icon: '🎯',
    label: 'Objectif Atteint',
    text: '🎯 Objectif quotidien de commandes dépassé avec succès ! Félicitations à toute l\'équipe.',
  },
  {
    icon: '📞',
    label: 'Confirmation Client',
    text: '📞 Client joint par téléphone : adresse confirmée, livraison programmée dans les 24h.',
  },
  {
    icon: '💎',
    label: 'Traitement VIP',
    text: '💎 Client VIP récurrent : insérer un flacon testeur 5ml de prestige dans le colis.',
  },
];

export default function AdminTeamChatPage() {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [contacts, setContacts] = useState<ConversationContact[]>([]);
  const [channels, setChannels] = useState<ConversationChannel[]>([]);
  const [allTeamMembers, setAllTeamMembers] = useState<AdminUser[]>([]);
  const [activeChatType, setActiveChatType] = useState<'CHANNEL' | 'DIRECT'>('CHANNEL');
  const [activeId, setActiveId] = useState<string>('GENERAL'); // channel slug or contact ID

  // Messages State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [searchContact, setSearchContact] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTemplatesMenu, setShowTemplatesMenu] = useState(false);

  // In-channel search & filter
  const [showInChatSearch, setShowInChatSearch] = useState(false);
  const [inChatSearchQuery, setInChatSearchQuery] = useState('');
  const [chatFilter, setChatFilter] = useState<'ALL' | 'MEDIA' | 'PRODUCTS' | 'ORDERS'>('ALL');
  const [showPinnedBanner, setShowPinnedBanner] = useState(true);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // Sidebar Tabs Filter
  const [sidebarTab, setSidebarTab] = useState<'ALL' | 'CHANNELS' | 'DIRECT'>('ALL');

  // Group Creation & Management Modals
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showManageMembersModal, setShowManageMembersModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('sky');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [isSavingGroup, setIsSavingGroup] = useState(false);

  // Mentionables (Members, Products, Orders)
  const [allProducts, setAllProducts] = useState<ProductMentionItem[]>([]);
  const [allOrders, setAllOrders] = useState<OrderMentionItem[]>([]);
  const [mentionMenu, setMentionMenu] = useState<{
    type: 'MEMBER' | 'PRODUCT' | 'ORDER' | null;
    query: string;
  }>({ type: null, query: '' });

  // File Upload State
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Conversations & Team
  const fetchConversations = useCallback(async () => {
    try {
      const [meRes, convsRes, mentionablesRes] = await Promise.all([
        fetch('/api/admin/auth/me'),
        fetch('/api/admin/chat/conversations'),
        fetch('/api/admin/chat/mentionables'),
      ]);

      if (meRes.ok) {
        const meData = await meRes.json();
        if (meData.success) setCurrentUser(meData.user);
      }

      if (convsRes.ok) {
        const convsData = await convsRes.json();
        if (convsData.success) {
          setContacts(convsData.contacts || []);
          setChannels(convsData.channels || []);
          setAllTeamMembers(convsData.allTeamMembers || []);
        }
      }

      if (mentionablesRes.ok) {
        const mData = await mentionablesRes.json();
        if (mData.success) {
          setAllProducts(mData.products || []);
          setAllOrders(mData.orders || []);
        }
      }
    } catch (err) {
      console.error('Failed to load chat conversations:', err);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // 2. Fetch Messages for Active Chat
  const fetchMessages = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoadingMessages(true);
    try {
      const params = new URLSearchParams();
      if (activeChatType === 'DIRECT') {
        params.set('contactId', activeId);
      } else {
        params.set('channel', activeId);
      }

      const res = await fetch(`/api/admin/chat/messages?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setMessages(data.messages || []);
        }
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      if (!isSilent) setIsLoadingMessages(false);
    }
  }, [activeChatType, activeId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Real-time Polling (4 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMessages(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Auto Scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Input Changes & Mention Autocomplete Detection
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMessageInput(val);

    const lastAt = val.lastIndexOf('@');
    const lastHash = val.lastIndexOf('#');
    const lastDollar = val.lastIndexOf('$');

    if (lastAt !== -1 && lastAt >= val.length - 20) {
      const query = val.slice(lastAt + 1).toLowerCase();
      setMentionMenu({ type: 'MEMBER', query });
      return;
    }

    if (lastHash !== -1 && lastHash >= val.length - 20) {
      const query = val.slice(lastHash + 1).toLowerCase();
      setMentionMenu({ type: 'PRODUCT', query });
      return;
    }

    if (lastDollar !== -1 && lastDollar >= val.length - 20) {
      const query = val.slice(lastDollar + 1).toLowerCase();
      setMentionMenu({ type: 'ORDER', query });
      return;
    }

    setMentionMenu({ type: null, query: '' });
  };

  // Insert Member Mention
  const insertMemberMention = (member: AdminUser) => {
    const lastAt = messageInput.lastIndexOf('@');
    const prefix = lastAt !== -1 ? messageInput.slice(0, lastAt) : messageInput;
    const cleanName = member.name.replace(/\s+/g, '_');
    setMessageInput(`${prefix}@${cleanName} `);
    setMentionMenu({ type: null, query: '' });
    inputRef.current?.focus();
  };

  // Insert Product Mention Card Token
  const insertProductMention = (product: ProductMentionItem) => {
    const lastHash = messageInput.lastIndexOf('#');
    const prefix = lastHash !== -1 ? messageInput.slice(0, lastHash) : messageInput;
    const token = `#[product:${product.id}:${product.name}:${product.price}:${product.brand}:${product.slug}]`;
    setMessageInput(`${prefix}${token} `);
    setMentionMenu({ type: null, query: '' });
    inputRef.current?.focus();
  };

  // Insert Order Mention Token
  const insertOrderMention = (order: OrderMentionItem) => {
    const lastDollar = messageInput.lastIndexOf('$');
    const prefix = lastDollar !== -1 ? messageInput.slice(0, lastDollar) : messageInput;
    const token = `#[order:${order.id}:${order.orderNumber}:${order.customerName}:${order.total}:${order.status}]`;
    setMessageInput(`${prefix}${token} `);
    setMentionMenu({ type: null, query: '' });
    inputRef.current?.focus();
  };

  // Send Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!messageInput.trim() && !attachmentPreview) || isSending) return;

    const textToSend = messageInput.trim();
    const attachmentToSend = attachmentPreview;

    setMessageInput('');
    setAttachmentPreview(null);
    setShowEmojiPicker(false);
    setShowTemplatesMenu(false);
    setMentionMenu({ type: null, query: '' });

    // Optimistic message
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: tempId,
      senderId: currentUser?.id || 'me',
      senderName: currentUser?.name || 'Moi',
      senderAvatar: currentUser?.avatar,
      recipientId: activeChatType === 'DIRECT' ? activeId : null,
      channel: activeChatType === 'DIRECT' ? 'DIRECT' : activeId,
      content: textToSend,
      attachments: attachmentToSend ? JSON.stringify([attachmentToSend]) : null,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setIsSending(true);

    try {
      const res = await fetch('/api/admin/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: textToSend,
          channel: activeChatType === 'DIRECT' ? 'DIRECT' : activeId,
          recipientId: activeChatType === 'DIRECT' ? activeId : null,
          attachments: attachmentToSend ? [attachmentToSend] : undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.message) {
          setMessages((prev) => prev.map((m) => (m.id === tempId ? data.message : m)));
          fetchConversations();
        }
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  // Create Group
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || isSavingGroup) return;

    setIsSavingGroup(true);
    try {
      const res = await fetch('/api/admin/chat/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGroupName.trim(),
          description: newGroupDesc.trim(),
          color: newGroupColor,
          memberIds: selectedMemberIds,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.group) {
          await fetchConversations();
          setActiveChatType('CHANNEL');
          setActiveId(data.group.slug);
          setShowCreateGroupModal(false);
          setNewGroupName('');
          setNewGroupDesc('');
          setSelectedMemberIds([]);
        }
      }
    } catch (err) {
      console.error('Failed to create group:', err);
    } finally {
      setIsSavingGroup(false);
    }
  };

  // Update Group Members
  const handleUpdateGroupMembers = async () => {
    const currentChannel = channels.find(c => c.slug === activeId);
    if (!currentChannel || !currentChannel.dbId || isSavingGroup) return;

    setIsSavingGroup(true);
    try {
      const res = await fetch('/api/admin/chat/groups', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentChannel.dbId,
          memberIds: selectedMemberIds,
        }),
      });

      if (res.ok) {
        await fetchConversations();
        setShowManageMembersModal(false);
      }
    } catch (err) {
      console.error('Failed to update group members:', err);
    } finally {
      setIsSavingGroup(false);
    }
  };

  // Delete Group
  const handleDeleteGroup = async (dbId: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce groupe de discussion ?')) return;

    try {
      const res = await fetch(`/api/admin/chat/groups?id=${dbId}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchConversations();
        setActiveChatType('CHANNEL');
        setActiveId('GENERAL');
        setShowManageMembersModal(false);
      }
    } catch (err) {
      console.error('Failed to delete group:', err);
    }
  };

  // Handle Photo Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAttachment(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachmentPreview(event.target?.result as string);
      setIsUploadingAttachment(false);
    };
    reader.readAsDataURL(file);
  };

  // Copy Message to clipboard
  const handleCopyMessage = (msgId: string, content: string) => {
    navigator.clipboard?.writeText(content);
    setCopiedMessageId(msgId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  // Active Chat Header Info
  const activeChannel = channels.find((c) => c.slug === activeId);
  const activeContact = contacts.find((c) => c.id === activeId);
  const currentPreset = activeChatType === 'CHANNEL' ? CHANNEL_PRESETS[activeId] : null;

  // Filtered Contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) =>
      c.name.toLowerCase().includes(searchContact.toLowerCase()) ||
      c.role.toLowerCase().includes(searchContact.toLowerCase()) ||
      (c.jobTitle && c.jobTitle.toLowerCase().includes(searchContact.toLowerCase()))
    );
  }, [contacts, searchContact]);

  // Filtered Channels
  const filteredChannels = useMemo(() => {
    return channels.filter((c) =>
      c.name.toLowerCase().includes(searchContact.toLowerCase()) ||
      c.description.toLowerCase().includes(searchContact.toLowerCase())
    );
  }, [channels, searchContact]);

  // Online count calculation
  const onlineCount = useMemo(() => {
    const directOnline = contacts.filter((c) => isUserOnline(c.lastActivityAt)).length;
    return directOnline + (currentUser ? 1 : 0);
  }, [contacts, currentUser]);

  // Filtered Messages based on search & media/product filter
  const displayedMessages = useMemo(() => {
    return messages.filter((msg) => {
      // 1. In-Chat search query filter
      if (inChatSearchQuery.trim()) {
        const q = inChatSearchQuery.toLowerCase();
        const matchesContent = msg.content.toLowerCase().includes(q);
        const matchesSender = msg.senderName.toLowerCase().includes(q);
        if (!matchesContent && !matchesSender) return false;
      }

      // 2. Chat type filter (ALL, MEDIA, PRODUCTS, ORDERS)
      if (chatFilter === 'MEDIA') {
        return !!msg.attachments && msg.attachments !== '[]';
      }
      if (chatFilter === 'PRODUCTS') {
        return msg.content.includes('#[product:');
      }
      if (chatFilter === 'ORDERS') {
        return msg.content.includes('#[order:');
      }

      return true;
    });
  }, [messages, inChatSearchQuery, chatFilter]);

  // Render Read Receipts (Vu / Lu par : ...)
  const renderReadReceipt = (msg: ChatMessage, isMe: boolean) => {
    if (activeChatType === 'DIRECT') {
      if (!isMe) return null;
      if (msg.isRead) {
        const readTime = msg.readAt
          ? new Date(msg.readAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
          : '';
        return (
          <div
            className="flex items-center gap-1 text-[10px] text-sky-500 dark:text-sky-400 font-semibold mt-0.5 justify-end"
            title={readTime ? `Vu à ${readTime}` : 'Message vu'}
          >
            <CheckCheck size={13} className="text-sky-500 dark:text-sky-400 stroke-[2.5]" />
            <span>Vu {readTime ? `à ${readTime}` : ''}</span>
          </div>
        );
      }
      return (
        <div
          className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 justify-end"
          title="Message envoyé, en attente de lecture"
        >
          <Check size={12} className="stroke-[2]" />
          <span>Envoyé</span>
        </div>
      );
    }

    // CHANNEL / GROUP CHAT
    let readers: Array<{ userId: string; userName: string; readAt?: string }> = [];
    try {
      if (msg.readBy) {
        const parsed = JSON.parse(msg.readBy);
        if (Array.isArray(parsed)) {
          readers = parsed.filter((r) => r.userId !== msg.senderId);
        }
      }
    } catch {
      readers = [];
    }

    if (isMe) {
      if (readers.length === 0) {
        return (
          <div
            className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 justify-end"
            title="Message envoyé au groupe, en attente de lecture"
          >
            <Check size={12} className="stroke-[2]" />
            <span>Envoyé</span>
          </div>
        );
      }

      const namesList = readers.map((r) => r.userName);
      const displayText =
        namesList.length <= 2
          ? namesList.join(', ')
          : `${namesList.slice(0, 2).join(', ')} +${namesList.length - 2}`;

      return (
        <div
          className="flex items-center gap-1 text-[10px] text-sky-600 dark:text-sky-400 font-semibold mt-0.5 justify-end group/read cursor-help relative"
          title={`Lu par :\n${readers.map(r => `• ${r.userName} (${r.readAt ? new Date(r.readAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'récemment'})`).join('\n')}`}
        >
          <CheckCheck size={13} className="text-sky-500 dark:text-sky-400 stroke-[2.5]" />
          <span>
            Lu par : <strong className="font-bold text-sky-700 dark:text-sky-300">{displayText}</strong>
          </span>

          <div className="absolute right-0 bottom-full mb-1 hidden group-hover/read:flex flex-col gap-1 p-2.5 bg-slate-900 dark:bg-black text-white rounded-xl shadow-xl z-30 min-w-[200px] text-[10px] font-normal animate-in fade-in zoom-in-95 pointer-events-none border border-slate-800">
            <div className="font-bold text-[10px] text-slate-300 border-b border-slate-800 pb-1 flex items-center justify-between">
              <span>Membres ayant lu ({readers.length})</span>
              <CheckCheck size={11} className="text-sky-400" />
            </div>
            {readers.map((r, i) => (
              <div key={i} className="flex items-center justify-between gap-2 text-slate-200">
                <span className="font-semibold text-white truncate max-w-[120px]">{r.userName}</span>
                <span className="text-[9px] text-slate-400 font-mono">
                  {r.readAt ? new Date(r.readAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'Vu'}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (readers.length > 0) {
      const namesList = readers.map((r) => r.userName);
      const displayText =
        namesList.length <= 2
          ? namesList.join(', ')
          : `${namesList.slice(0, 2).join(', ')} +${namesList.length - 2}`;

      return (
        <div
          className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 justify-start group/read cursor-help relative"
          title={`Lu par :\n${readers.map(r => `• ${r.userName}`).join('\n')}`}
        >
          <CheckCheck size={12} className="text-sky-500" />
          <span>
            Lu par : <strong className="text-slate-600 dark:text-slate-300 font-semibold">{displayText}</strong>
          </span>

          <div className="absolute left-0 bottom-full mb-1 hidden group-hover/read:flex flex-col gap-1 p-2.5 bg-slate-900 dark:bg-black text-white rounded-xl shadow-xl z-30 min-w-[200px] text-[10px] font-normal animate-in fade-in zoom-in-95 pointer-events-none border border-slate-800">
            <div className="font-bold text-[10px] text-slate-300 border-b border-slate-800 pb-1">
              <span>Lu par ({readers.length})</span>
            </div>
            {readers.map((r, i) => (
              <div key={i} className="flex items-center justify-between gap-2 text-slate-200">
                <span className="font-semibold text-white truncate max-w-[120px]">{r.userName}</span>
                <span className="text-[9px] text-slate-400 font-mono">
                  {r.readAt ? new Date(r.readAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'Vu'}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col font-sans text-slate-900 dark:text-slate-100 bg-white dark:bg-[#0c1017] rounded-3xl border border-slate-200/90 dark:border-neutral-800/80 shadow-md overflow-hidden animate-fadeIn">
      
      {/* ── TOP LUXURY EXECUTIVE STATUS BAR ────────────────────────── */}
      <div className="px-5 py-2.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 text-xs shrink-0 select-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold tracking-wider text-[11px] uppercase text-amber-300">
              NAY HQ • Centre de Coordination Interne
            </span>
          </div>
          <span className="hidden md:inline-block text-slate-400 text-[11px]">•</span>
          <span className="hidden md:inline-flex items-center gap-1.5 text-slate-300 text-[11px]">
            <Lock size={11} className="text-emerald-400" />
            Chiffrement SSL Interne
          </span>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span><strong>{onlineCount}</strong> associé(s) en ligne</span>
          </div>
          <div className="hidden sm:flex items-center gap-1 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10">
            <Sparkles size={11} className="text-amber-400" />
            <span className="font-medium text-slate-200">Haute Parfumerie</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* ── 1. LEFT SIDEBAR: HUBS, SALONS & ASSOCIÉS ──────────────── */}
        <aside className="w-80 sm:w-88 border-r border-slate-200/80 dark:border-neutral-800/80 bg-slate-50/70 dark:bg-[#0e1420] flex flex-col shrink-0">
          
          {/* Header & Quick Action */}
          <div className="p-4 border-b border-slate-200/70 dark:border-neutral-800/70 space-y-3 bg-white dark:bg-[#0c1017]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center font-bold shadow-xs">
                  <Crown size={18} />
                </div>
                <div>
                  <h2 className="text-xs font-black text-slate-900 dark:text-white tracking-wider uppercase">
                    Salons & Équipe
                  </h2>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    {channels.length} canaux • {contacts.length + 1} collaborateurs
                  </p>
                </div>
              </div>

              {/* Create Group Button */}
              <button
                onClick={() => {
                  setSelectedMemberIds(allTeamMembers.map(u => u.id));
                  setShowCreateGroupModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-black dark:hover:bg-slate-100 text-[11px] font-bold transition-all shadow-xs cursor-pointer"
                title="Créer un groupe thématique"
              >
                <Plus size={12} />
                <span>Nouveau</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher salon, associé, fonction..."
                value={searchContact}
                onChange={(e) => setSearchContact(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-100/80 dark:bg-[#141b29] border border-slate-200/80 dark:border-neutral-700/80 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
              />
              {searchContact && (
                <button
                  onClick={() => setSearchContact('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Filter Tabs (Tous / Salons / Directs) */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-[#141b29] rounded-xl text-[11px] font-bold">
              <button
                onClick={() => setSidebarTab('ALL')}
                className={`flex-1 py-1 rounded-lg transition-all ${
                  sidebarTab === 'ALL'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                }`}
              >
                Tous
              </button>
              <button
                onClick={() => setSidebarTab('CHANNELS')}
                className={`flex-1 py-1 rounded-lg transition-all ${
                  sidebarTab === 'CHANNELS'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                }`}
              >
                Salons ({channels.length})
              </button>
              <button
                onClick={() => setSidebarTab('DIRECT')}
                className={`flex-1 py-1 rounded-lg transition-all ${
                  sidebarTab === 'DIRECT'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                }`}
              >
                Directs ({contacts.length})
              </button>
            </div>
          </div>

          {/* Navigation List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
            
            {/* 1.1 GROUPES & SALONS STRATÉGIQUES */}
            {(sidebarTab === 'ALL' || sidebarTab === 'CHANNELS') && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-2 mb-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                    <Layers size={11} /> Salons Stratégiques ({filteredChannels.length})
                  </span>
                  <button
                    onClick={() => {
                      setSelectedMemberIds(allTeamMembers.map(u => u.id));
                      setShowCreateGroupModal(true);
                    }}
                    className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-0.5"
                    title="Ajouter un salon"
                  >
                    <Plus size={13} />
                  </button>
                </div>

                {filteredChannels.map((channel) => {
                  const isActive = activeChatType === 'CHANNEL' && activeId === channel.slug;
                  const preset = CHANNEL_PRESETS[channel.slug];
                  const IconComp = preset?.icon || Hash;

                  return (
                    <button
                      key={channel.slug}
                      onClick={() => {
                        setActiveChatType('CHANNEL');
                        setActiveId(channel.slug);
                        setInChatSearchQuery('');
                        setShowInChatSearch(false);
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all cursor-pointer group ${
                        isActive
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md scale-[1.01]'
                          : 'hover:bg-white dark:hover:bg-[#151c28] text-slate-700 dark:text-slate-300 hover:shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Channel Emblem */}
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-transform group-hover:scale-105 ${
                          isActive
                            ? 'bg-amber-400 text-slate-950 font-black'
                            : preset
                              ? `bg-slate-100 dark:bg-[#182234] text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-neutral-700/80`
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}>
                          <IconComp size={16} />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className={`text-xs font-bold truncate ${isActive ? 'text-white dark:text-slate-900' : 'text-slate-900 dark:text-white'}`}>
                              {channel.name}
                            </p>
                          </div>
                          <p className={`text-[10px] truncate ${isActive ? 'text-slate-300 dark:text-slate-600' : 'text-slate-400 dark:text-slate-500'}`}>
                            {channel.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {preset ? (
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border tracking-wider uppercase ${
                            isActive
                              ? 'bg-white/20 text-white dark:bg-slate-900 dark:text-amber-300 border-transparent'
                              : `${preset.badgeBg} ${preset.badgeText}`
                          }`}>
                            {preset.tag}
                          </span>
                        ) : (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            isActive ? 'bg-white/20 text-white' : 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                          }`}>
                            Groupe
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 1.2 COLLABORATEURS DIRECTS (MESSAGERIE PRIVÉE) */}
            {(sidebarTab === 'ALL' || sidebarTab === 'DIRECT') && (
              <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-neutral-800/60">
                <div className="px-2 mb-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                    <UserPlus size={11} /> Associés & Équipe ({filteredContacts.length})
                  </span>
                </div>

                {filteredContacts.map((contact) => {
                  const isActive = activeChatType === 'DIRECT' && activeId === contact.id;
                  const online = isUserOnline(contact.lastActivityAt);

                  return (
                    <button
                      key={contact.id}
                      onClick={() => {
                        setActiveChatType('DIRECT');
                        setActiveId(contact.id);
                        setInChatSearchQuery('');
                        setShowInChatSearch(false);
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all cursor-pointer ${
                        isActive
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md scale-[1.01]'
                          : 'hover:bg-white dark:hover:bg-[#151c28] text-slate-700 dark:text-slate-300 hover:shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
                            isActive
                              ? 'bg-white/20 text-white dark:bg-slate-900 dark:text-white'
                              : 'bg-gradient-to-br from-sky-400 to-indigo-600 text-white shadow-2xs'
                          }`}>
                            {contact.avatar ? (
                              <img src={contact.avatar} alt={contact.name} className="w-full h-full object-cover rounded-full" />
                            ) : (
                              <span>{contact.name.slice(0, 2).toUpperCase()}</span>
                            )}
                          </div>
                          <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 ${
                            isActive ? 'border-slate-900 dark:border-white' : 'border-white dark:border-[#0c1017]'
                          } ${online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-600'}`} />
                        </div>

                        <div className="min-w-0">
                          <p className={`text-xs font-bold truncate ${isActive ? 'text-white dark:text-slate-900' : 'text-slate-900 dark:text-white'}`}>
                            {contact.name}
                          </p>
                          <p className={`text-[10px] truncate ${isActive ? 'text-slate-300 dark:text-slate-600' : 'text-slate-400 dark:text-slate-500'}`}>
                            {contact.jobTitle || contact.role}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {online && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            isActive ? 'bg-emerald-400/20 text-emerald-300' : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50'
                          }`}>
                            En ligne
                          </span>
                        )}

                        {(contact.unreadCount || 0) > 0 && (
                          <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-xs animate-bounce">
                            {contact.unreadCount}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

          </div>
        </aside>

        {/* ── 2. MAIN ACTIVE CONVERSATION WINDOW ──────────────────────── */}
        <main className="flex-1 flex flex-col bg-white dark:bg-[#0c1017] overflow-hidden">
          
          {/* 2.1 Top Luxury Chat Header */}
          <div className="p-4 border-b border-slate-200/80 dark:border-neutral-800/80 flex items-center justify-between bg-white dark:bg-[#0c1017] shadow-2xs z-10">
            <div className="flex items-center gap-3.5 min-w-0">
              {/* Channel / Contact Emblem */}
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 shadow-xs ${
                activeChatType === 'CHANNEL'
                  ? currentPreset
                    ? 'bg-gradient-to-br from-slate-900 to-slate-800 text-amber-300 border border-amber-500/30'
                    : 'bg-slate-900 text-white'
                  : 'bg-gradient-to-br from-indigo-600 to-sky-500 text-white'
              }`}>
                {activeChatType === 'CHANNEL' ? (
                  currentPreset?.icon ? <currentPreset.icon size={20} /> : <Hash size={20} />
                ) : (
                  <span>{(activeContact?.name || '@').slice(0, 2).toUpperCase()}</span>
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                    {activeChatType === 'CHANNEL' ? `# ${activeChannel?.name}` : activeContact?.name}
                  </h3>
                  
                  {activeChatType === 'CHANNEL' && currentPreset && (
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wider ${currentPreset.badgeBg} ${currentPreset.badgeText}`}>
                      {currentPreset.tag}
                    </span>
                  )}

                  {activeChatType === 'CHANNEL' && activeChannel?.memberCount && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {activeChannel.memberCount} membres
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {activeChatType === 'CHANNEL' 
                    ? (currentPreset?.mission || activeChannel?.description)
                    : (isUserOnline(activeContact?.lastActivityAt) ? '🟢 En ligne actuellement' : formatLastSeen(activeContact?.lastActivityAt).text)}
                </p>
              </div>
            </div>

            {/* Header Right Tools */}
            <div className="flex items-center gap-2 shrink-0">
              
              {/* Search Toggle in Active Chat */}
              <button
                onClick={() => setShowInChatSearch(!showInChatSearch)}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  showInChatSearch || inChatSearchQuery
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold'
                    : 'text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Rechercher dans cette discussion"
              >
                <Search size={16} />
              </button>

              {/* Pinned Announcement Toggle */}
              {activeChatType === 'CHANNEL' && currentPreset && (
                <button
                  onClick={() => setShowPinnedBanner(!showPinnedBanner)}
                  className={`p-2 rounded-xl transition-all cursor-pointer ${
                    showPinnedBanner
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                      : 'text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  title="Afficher/Masquer la note de direction"
                >
                  <Pin size={16} />
                </button>
              )}

              {/* Members Manager Modal Trigger */}
              {activeChatType === 'CHANNEL' && (
                <button
                  onClick={() => {
                    let currentMemberIds: string[] = [];
                    try {
                      currentMemberIds = JSON.parse(activeChannel?.memberIds || '[]');
                    } catch {
                      currentMemberIds = allTeamMembers.map(u => u.id);
                    }
                    setSelectedMemberIds(currentMemberIds);
                    setShowManageMembersModal(true);
                  }}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all cursor-pointer"
                >
                  <Users size={13} />
                  <span>Membres ({activeChannel?.memberCount || activeChannel?.members?.length || 0})</span>
                </button>
              )}

              {/* Refresh Button */}
              <button
                onClick={() => fetchMessages(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Actualiser la conversation"
              >
                <RefreshCw size={15} className={isLoadingMessages ? 'animate-spin text-amber-500' : ''} />
              </button>
            </div>
          </div>

          {/* 2.2 Collapsible Search & Filter Bar inside Active Chat */}
          {showInChatSearch && (
            <div className="p-3 bg-slate-50 dark:bg-[#101726] border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between gap-3 animate-fadeIn">
              <div className="flex-1 relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher des messages, mentions, mots clés..."
                  value={inChatSearchQuery}
                  onChange={(e) => setInChatSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-1.5 bg-white dark:bg-[#161f30] border border-slate-200 dark:border-neutral-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
                {inChatSearchQuery && (
                  <button
                    onClick={() => setInChatSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1 text-[10px] font-bold">
                <button
                  onClick={() => setChatFilter('ALL')}
                  className={`px-2 py-1 rounded-lg transition-all ${chatFilter === 'ALL' ? 'bg-slate-900 text-white' : 'bg-white dark:bg-slate-800 text-slate-600'}`}
                >
                  Tous
                </button>
                <button
                  onClick={() => setChatFilter('PRODUCTS')}
                  className={`px-2 py-1 rounded-lg transition-all ${chatFilter === 'PRODUCTS' ? 'bg-amber-500 text-white' : 'bg-white dark:bg-slate-800 text-slate-600'}`}
                >
                  💎 Parfums
                </button>
                <button
                  onClick={() => setChatFilter('ORDERS')}
                  className={`px-2 py-1 rounded-lg transition-all ${chatFilter === 'ORDERS' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600'}`}
                >
                  📦 Commandes
                </button>
                <button
                  onClick={() => setChatFilter('MEDIA')}
                  className={`px-2 py-1 rounded-lg transition-all ${chatFilter === 'MEDIA' ? 'bg-sky-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600'}`}
                >
                  📷 Médias
                </button>
              </div>

              <button
                onClick={() => {
                  setShowInChatSearch(false);
                  setInChatSearchQuery('');
                  setChatFilter('ALL');
                }}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={15} />
              </button>
            </div>
          )}

          {/* 2.3 Pinned Executive Note / Channel Guidelines Banner */}
          {activeChatType === 'CHANNEL' && currentPreset && showPinnedBanner && (
            <div className="px-4 py-2.5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-500/15 dark:via-amber-500/5 border-b border-amber-200/60 dark:border-amber-500/20 flex items-center justify-between gap-3 text-xs animate-fadeIn">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Pin size={13} />
                </div>
                <p className="text-[11px] font-medium text-slate-800 dark:text-slate-200 leading-relaxed truncate sm:whitespace-normal">
                  {currentPreset.pinnedAnnouncement}
                </p>
              </div>

              <button
                onClick={() => setShowPinnedBanner(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 shrink-0"
                title="Masquer la note"
              >
                <X size={13} />
              </button>
            </div>
          )}

          {/* 2.4 Messages Stream & Luxury Showcase for Empty State */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50 dark:bg-[#0a0e17] custom-scrollbar">
            {isLoadingMessages && messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs gap-3">
                <RefreshCw size={24} className="animate-spin text-amber-500" />
                <span className="font-semibold text-slate-600 dark:text-slate-300">Synchronisation des messages du salon...</span>
              </div>
            ) : displayedMessages.length === 0 ? (
              
              /* ── LUXURY SHOWCASE / EMPTY STATE HUB ── */
              <div className="h-full flex flex-col items-center justify-center p-4 sm:p-8 max-w-2xl mx-auto animate-fadeIn">
                <div className="w-full bg-white dark:bg-[#111827] rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-neutral-800 shadow-xl text-center space-y-6 relative overflow-hidden">
                  
                  {/* Decorative glowing background */}
                  <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                  {/* Emblem */}
                  <div className="relative inline-block">
                    <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/20 mx-auto">
                      {activeChatType === 'CHANNEL' ? (
                        currentPreset?.icon ? <currentPreset.icon size={30} /> : <Crown size={30} />
                      ) : (
                        <Users size={30} />
                      )}
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#111827] flex items-center justify-center text-[10px] text-white">
                      ✓
                    </span>
                  </div>

                  {/* Title & Mission Statement */}
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-300/40 dark:border-amber-500/30 text-[10px] font-extrabold uppercase tracking-widest">
                      <Sparkles size={11} />
                      {activeChatType === 'CHANNEL' ? (currentPreset?.tag || 'CANAL OFFICIEL') : 'CONVERSATION DIRECTE'}
                    </div>

                    <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                      {activeChatType === 'CHANNEL' ? `Salon #${activeChannel?.name}` : `Échange avec ${activeContact?.name}`}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                      {activeChatType === 'CHANNEL' 
                        ? (currentPreset?.mission || activeChannel?.description)
                        : `Canal privé de synchronisation et de décision avec ${activeContact?.jobTitle || activeContact?.role}.`}
                    </p>
                  </div>

                  {/* Trust & Security Badges */}
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1 border-t border-slate-100 dark:border-neutral-800">
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80">
                      <Lock size={10} className="text-emerald-500" />
                      Chiffré SSL
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80">
                      <Zap size={10} className="text-amber-500" />
                      Temps Réel 4s
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80">
                      <ShieldCheck size={10} className="text-sky-500" />
                      Accès Restreint Admin
                    </span>
                  </div>

                  {/* 4 Interactive Quick Action Starters */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left pt-2">
                    
                    {/* Starter 1: Share Perfume */}
                    <button
                      onClick={() => {
                        if (allProducts.length > 0) {
                          insertProductMention(allProducts[0]);
                        } else {
                          setMessageInput('# ');
                          inputRef.current?.focus();
                        }
                      }}
                      className="p-3 rounded-2xl border border-slate-200 dark:border-neutral-700 hover:border-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-all text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 mb-1">
                        <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold">
                          <Sparkles size={14} />
                        </div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">
                          Fiche Parfum Express
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Partager la fiche d&apos;un parfum vedette pour décision ou réassort.
                      </p>
                    </button>

                    {/* Starter 2: Link Order */}
                    <button
                      onClick={() => {
                        if (allOrders.length > 0) {
                          insertOrderMention(allOrders[0]);
                        } else {
                          setMessageInput('$ ');
                          inputRef.current?.focus();
                        }
                      }}
                      className="p-3 rounded-2xl border border-slate-200 dark:border-neutral-700 hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 mb-1">
                        <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold">
                          <ShoppingBag size={14} />
                        </div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                          Lier une Commande VIP
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Insérer la dernière commande passée pour validation ou suivi transporteur.
                      </p>
                    </button>

                    {/* Starter 3: Official Announcement */}
                    <button
                      onClick={() => {
                        setMessageInput('📢 [ANNONCE NAY] : ');
                        inputRef.current?.focus();
                      }}
                      className="p-3 rounded-2xl border border-slate-200 dark:border-neutral-700 hover:border-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 transition-all text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 mb-1">
                        <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold">
                          <Megaphone size={14} />
                        </div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors">
                          Annonce Équipe
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Diffuser une consigne ou un nouveau palier d&apos;objectifs à l&apos;équipe.
                      </p>
                    </button>

                    {/* Starter 4: Daily Check-in */}
                    <button
                      onClick={() => {
                        setMessageInput('🎯 [POINT DU JOUR] : Commandes traitées =  | Expéditions =  | Objectif = ');
                        inputRef.current?.focus();
                      }}
                      className="p-3 rounded-2xl border border-slate-200 dark:border-neutral-700 hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 mb-1">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                          <Zap size={14} />
                        </div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                          Point Opérationnel
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Partager le statut des expéditions et des conversions de la journée.
                      </p>
                    </button>

                  </div>
                </div>
              </div>
            ) : (
              
              /* ── 2.5 MESSAGES FEED STREAM ── */
              displayedMessages.map((msg, index) => {
                const isMe = msg.senderId === currentUser?.id;
                let attachmentsArr: string[] = [];
                try {
                  if (msg.attachments) attachmentsArr = JSON.parse(msg.attachments);
                } catch {}

                return (
                  <div key={msg.id} className={`flex gap-3 group/msg ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    
                    {/* User Avatar */}
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] flex items-center justify-center shrink-0 overflow-hidden border border-slate-300 dark:border-neutral-700 shadow-2xs">
                      {msg.senderAvatar ? (
                        <img src={msg.senderAvatar} alt={msg.senderName} className="w-full h-full object-cover" />
                      ) : (
                        <span>{(msg.senderName || 'NA').slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>

                    {/* Message Bubble Column */}
                    <div className={`max-w-lg lg:max-w-xl space-y-1 ${isMe ? 'items-end' : 'items-start'}`}>
                      
                      {/* Sender Meta Info */}
                      <div className={`flex items-center gap-2 px-1 text-[11px] ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{msg.senderName}</span>
                        {isMe && (
                          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded">
                            Moi
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                          {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Bubble Container */}
                      <div className="relative group/bubble">
                        <div className={`p-4 rounded-3xl text-xs leading-relaxed shadow-xs transition-all ${
                          isMe 
                            ? 'bg-slate-900 dark:bg-slate-800 text-white rounded-tr-xs border border-slate-800 dark:border-slate-700' 
                            : 'bg-white dark:bg-[#151c28] text-slate-900 dark:text-slate-100 border border-slate-200/90 dark:border-neutral-700/80 rounded-tl-xs shadow-2xs'
                        }`}>
                          <RenderMessageContent content={msg.content} isMe={isMe} />

                          {/* Image Attachments */}
                          {attachmentsArr.length > 0 && (
                            <div className="mt-3 grid grid-cols-1 gap-2">
                              {attachmentsArr.map((url, i) => (
                                <div key={i} className="rounded-2xl overflow-hidden border border-slate-200/80 dark:border-neutral-700 max-h-72 shadow-2xs">
                                  <img src={url} alt="Pièce jointe" className="w-full h-full object-cover" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Hover Quick Action Pill (Copy & Reaction) */}
                        <div className={`absolute top-1/2 -translate-y-1/2 hidden group-hover/bubble:flex items-center gap-1 p-1 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-neutral-700 z-10 ${
                          isMe ? 'right-full mr-2' : 'left-full ml-2'
                        }`}>
                          <button
                            onClick={() => handleCopyMessage(msg.id, msg.content)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                            title="Copier le texte"
                          >
                            {copiedMessageId === msg.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                          </button>
                          <button
                            onClick={() => {
                              setMessageInput((prev) => `${prev} 👍`);
                              inputRef.current?.focus();
                            }}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs transition-transform hover:scale-110"
                            title="Réagir 👍"
                          >
                            👍
                          </button>
                        </div>
                      </div>

                      {/* Read Receipts */}
                      {renderReadReceipt(msg, isMe)}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ── 3. COMPOSER & MENTION AUTOCOMPLETE OVERLAY ────────────── */}
          <div className="p-3.5 sm:p-4 border-t border-slate-200/90 dark:border-neutral-800/90 bg-white dark:bg-[#0c1017] relative">
            
            {/* 3.1 Mention Autocomplete Dropdown */}
            {mentionMenu.type && (
              <div className="absolute bottom-full left-4 right-4 mb-2 bg-white dark:bg-[#111827] rounded-2xl shadow-2xl border border-slate-200 dark:border-neutral-700 overflow-hidden z-30 max-h-64 overflow-y-auto animate-in fade-in slide-in-from-bottom-2">
                <div className="p-2.5 bg-slate-50 dark:bg-[#151c28] border-b border-slate-100 dark:border-neutral-800 flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1.5">
                    {mentionMenu.type === 'MEMBER' && '👥 Mentionner un Associé (@)'}
                    {mentionMenu.type === 'PRODUCT' && '💎 Lier la fiche d\'un Parfum (#)'}
                    {mentionMenu.type === 'ORDER' && '📦 Lier une Commande Boutique ($)'}
                  </span>
                  <button onClick={() => setMentionMenu({ type: null, query: '' })} className="p-0.5 text-slate-400 hover:text-slate-600">
                    <X size={13} />
                  </button>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-neutral-800">
                  {/* Member Suggestions */}
                  {mentionMenu.type === 'MEMBER' && (
                    allTeamMembers
                      .filter(m => m.name.toLowerCase().includes(mentionMenu.query))
                      .map(m => (
                        <button
                          key={m.id}
                          onClick={() => insertMemberMention(m)}
                          className="w-full p-2.5 hover:bg-slate-50 dark:hover:bg-[#151c28] flex items-center justify-between text-xs transition-colors cursor-pointer text-left"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold text-xs flex items-center justify-center">
                              {m.avatar ? <img src={m.avatar} alt={m.name} className="w-full h-full object-cover rounded-full" /> : m.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">@{m.name}</p>
                              <p className="text-[10px] text-slate-400">{m.jobTitle || m.role}</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">Taguer</span>
                        </button>
                      ))
                  )}

                  {/* Product Suggestions */}
                  {mentionMenu.type === 'PRODUCT' && (
                    allProducts
                      .filter(p => p.name.toLowerCase().includes(mentionMenu.query) || p.brand.toLowerCase().includes(mentionMenu.query))
                      .slice(0, 10)
                      .map(p => (
                        <button
                          key={p.id}
                          onClick={() => insertProductMention(p)}
                          className="w-full p-2.5 hover:bg-slate-50 dark:hover:bg-[#151c28] flex items-center justify-between text-xs transition-colors cursor-pointer text-left"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center p-0.5 border border-slate-200 dark:border-neutral-700">
                              {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-contain" /> : <Package size={14} className="text-slate-400" />}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 dark:text-white truncate">{p.name}</p>
                              <p className="text-[10px] text-slate-400">{p.brand} • <strong className="text-amber-600 dark:text-amber-400">{p.price} MAD</strong></p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-lg shrink-0 border border-amber-200/50">
                            Insérer Fiche
                          </span>
                        </button>
                      ))
                  )}

                  {/* Order Suggestions */}
                  {mentionMenu.type === 'ORDER' && (
                    allOrders
                      .filter(o => o.orderNumber.toLowerCase().includes(mentionMenu.query) || o.customerName.toLowerCase().includes(mentionMenu.query))
                      .slice(0, 8)
                      .map(o => (
                        <button
                          key={o.id}
                          onClick={() => insertOrderMention(o)}
                          className="w-full p-2.5 hover:bg-slate-50 dark:hover:bg-[#151c28] flex items-center justify-between text-xs transition-colors cursor-pointer text-left"
                        >
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">#{o.orderNumber} • {o.customerName}</p>
                            <p className="text-[10px] text-slate-400">{o.shippingCity} • <strong className="text-indigo-600 dark:text-indigo-400">{o.total} MAD</strong> • Statut: {o.status}</p>
                          </div>
                          <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-lg border border-indigo-200/50">
                            Lier Commande
                          </span>
                        </button>
                      ))
                  )}
                </div>
              </div>
            )}

            {/* 3.2 Quick Action Pills Toolbar */}
            <div className="flex items-center gap-1.5 mb-2.5 overflow-x-auto pb-1 text-xs">
              
              {/* @ Member */}
              <button
                type="button"
                onClick={() => setMentionMenu({ type: 'MEMBER', query: '' })}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[11px] transition-all cursor-pointer shadow-2xs"
              >
                <AtSign size={12} className="text-sky-500" />
                <span>Membre</span>
              </button>

              {/* # Perfume */}
              <button
                type="button"
                onClick={() => setMentionMenu({ type: 'PRODUCT', query: '' })}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold text-[11px] border border-amber-300/40 dark:border-amber-500/30 transition-all cursor-pointer shadow-2xs"
              >
                <Sparkles size={12} className="text-amber-500" />
                <span>Parfum ({allProducts.length})</span>
              </button>

              {/* $ Order */}
              <button
                type="button"
                onClick={() => setMentionMenu({ type: 'ORDER', query: '' })}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] border border-indigo-200/60 dark:border-indigo-800/60 transition-all cursor-pointer shadow-2xs"
              >
                <ShoppingBag size={12} className="text-indigo-500" />
                <span>Commande ({allOrders.length})</span>
              </button>

              {/* Quick Template Popover Trigger */}
              <button
                type="button"
                onClick={() => setShowTemplatesMenu(!showTemplatesMenu)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[11px] transition-all cursor-pointer shadow-2xs"
              >
                <Zap size={12} className="text-amber-500" />
                <span>Modèles Rapides</span>
                <ChevronDown size={11} />
              </button>

              {/* Quick Emoji Bar Trigger */}
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 text-[11px] transition-all cursor-pointer"
              >
                <Smile size={13} />
                <span>Emoji</span>
              </button>

              {/* Photo Upload Trigger */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 text-[11px] transition-all cursor-pointer"
              >
                <Paperclip size={13} />
                <span>Photo</span>
              </button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* 3.3 Quick Templates Dropdown Menu */}
            {showTemplatesMenu && (
              <div className="absolute bottom-full left-4 mb-2 bg-white dark:bg-[#111827] rounded-2xl shadow-2xl border border-slate-200 dark:border-neutral-700 p-2 z-30 w-80 space-y-1 animate-in fade-in zoom-in-95">
                <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-neutral-800">
                  Modèles de Messages Officiels
                </div>
                {QUICK_TEMPLATES.map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setMessageInput(tmpl.text);
                      setShowTemplatesMenu(false);
                      inputRef.current?.focus();
                    }}
                    className="w-full text-left p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group"
                  >
                    <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>{tmpl.icon}</span>
                      <span>{tmpl.label}</span>
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {tmpl.text}
                    </p>
                  </button>
                ))}
              </div>
            )}

            {/* 3.4 Quick Emojis Bar */}
            {showEmojiPicker && (
              <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 dark:bg-[#131b2b] rounded-2xl mb-2 border border-slate-200 dark:border-neutral-700 animate-fadeIn">
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      setMessageInput((prev) => prev + emoji);
                      inputRef.current?.focus();
                    }}
                    className="w-8 h-8 rounded-xl hover:bg-white dark:hover:bg-slate-800 flex items-center justify-center text-sm transition-transform hover:scale-125 cursor-pointer shadow-2xs"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* 3.5 Attachment Preview Box */}
            {attachmentPreview && (
              <div className="relative inline-block mb-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-neutral-700">
                <img src={attachmentPreview} alt="Preview" className="h-16 w-16 object-cover rounded-xl" />
                <button
                  onClick={() => setAttachmentPreview(null)}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs shadow-md cursor-pointer hover:bg-rose-600 transition-colors"
                >
                  <X size={13} />
                </button>
              </div>
            )}

            {/* 3.6 Main Form Input & Send Button */}
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={
                    activeChatType === 'CHANNEL'
                      ? `Message dans #${activeChannel?.name || 'Canal'} (Tapez @ pour un membre, # pour un parfum)...`
                      : `Message direct à ${activeContact?.name}...`
                  }
                  value={messageInput}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-[#141c2c] border border-slate-200 dark:border-neutral-700/80 rounded-2xl text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all shadow-inner"
                />
              </div>

              <button
                type="submit"
                disabled={(!messageInput.trim() && !attachmentPreview) || isSending}
                className="px-5 py-3 rounded-2xl bg-slate-900 hover:bg-black dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md flex items-center gap-2 cursor-pointer shrink-0"
              >
                {isSending ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                <span className="hidden sm:inline">Envoyer</span>
              </button>
            </form>

          </div>

        </main>

      </div>

      {/* ── 4. CREATE GROUP MODAL ────────────────────────────────────── */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-slate-100 dark:border-neutral-800 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
                  <Crown size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Créer un Nouveau Salon Équipe</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Rassemblez les associés autour d&apos;une mission précise</p>
                </div>
              </div>
              <button onClick={() => setShowCreateGroupModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nom du Salon *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Équipe Influenceurs & RP, Suivi Frais..."
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#161f30] border border-slate-200 dark:border-neutral-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Objectif & Consignes</label>
                <input
                  type="text"
                  placeholder="Ex: Coordination des campagnes influenceurs et suivi des envois coffrets"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#161f30] border border-slate-200 dark:border-neutral-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              {/* Members Selection Checklist */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Membres autorisés ({selectedMemberIds.length}/{allTeamMembers.length})
                </label>
                <div className="max-h-44 overflow-y-auto p-2 bg-slate-50 dark:bg-[#161f30] rounded-2xl border border-slate-200 dark:border-neutral-700 space-y-1.5 custom-scrollbar">
                  {allTeamMembers.map((member) => {
                    const isSelected = selectedMemberIds.includes(member.id);
                    return (
                      <div
                        key={member.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedMemberIds(selectedMemberIds.filter(id => id !== member.id));
                          } else {
                            setSelectedMemberIds([...selectedMemberIds, member.id]);
                          }
                        }}
                        className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors ${
                          isSelected 
                            ? 'bg-amber-50 dark:bg-amber-950/40 border border-amber-300/60 dark:border-amber-500/40' 
                            : 'bg-white dark:bg-[#1a2336] hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-neutral-700/60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center">
                            {member.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{member.name}</p>
                            <p className="text-[10px] text-slate-400">{member.jobTitle || member.role}</p>
                          </div>
                        </div>

                        <div className={`w-5 h-5 rounded-lg flex items-center justify-center ${
                          isSelected ? 'bg-amber-500 text-white' : 'border border-slate-300 dark:border-neutral-600'
                        }`}>
                          {isSelected && <Check size={12} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowCreateGroupModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!newGroupName.trim() || isSavingGroup}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-black dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 text-xs font-bold transition-all shadow-xs disabled:opacity-40"
                >
                  {isSavingGroup ? 'Création...' : 'Créer le Salon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 5. MANAGE GROUP MEMBERS MODAL ──────────────────────────── */}
      {showManageMembersModal && activeChannel && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-slate-100 dark:border-neutral-800 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-neutral-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Membres du salon : #{activeChannel.name}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Gérer les accès des associés à cette discussion
                </p>
              </div>
              <button onClick={() => setShowManageMembersModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Membres actifs ({selectedMemberIds.length} autorisés)
              </label>

              <div className="max-h-56 overflow-y-auto p-2 bg-slate-50 dark:bg-[#161f30] rounded-2xl border border-slate-200 dark:border-neutral-700 space-y-1.5 custom-scrollbar">
                {allTeamMembers.map((member) => {
                  const isSelected = selectedMemberIds.includes(member.id);
                  return (
                    <div
                      key={member.id}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedMemberIds(selectedMemberIds.filter(id => id !== member.id));
                        } else {
                          setSelectedMemberIds([...selectedMemberIds, member.id]);
                        }
                      }}
                      className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-amber-50 dark:bg-amber-950/40 border border-amber-300/60 dark:border-amber-500/40' 
                          : 'bg-white dark:bg-[#1a2336] hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-neutral-700/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center">
                          {member.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{member.name}</p>
                          <p className="text-[10px] text-slate-400">{member.jobTitle || member.role}</p>
                        </div>
                      </div>

                      <div className={`w-5 h-5 rounded-lg flex items-center justify-center ${
                        isSelected ? 'bg-amber-500 text-white' : 'border border-slate-300 dark:border-neutral-600'
                      }`}>
                        {isSelected && <Check size={12} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-neutral-800">
              {!activeChannel.isDefault && activeChannel.dbId ? (
                <button
                  onClick={() => handleDeleteGroup(activeChannel.dbId!)}
                  className="px-3 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Trash2 size={13} />
                  <span>Supprimer le salon</span>
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowManageMembersModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Fermer
                </button>
                <button
                  type="button"
                  onClick={handleUpdateGroupMembers}
                  disabled={isSavingGroup}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-black dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 text-xs font-bold transition-all shadow-xs"
                >
                  {isSavingGroup ? 'Enregistrement...' : 'Enregistrer les Accès'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ── RICH MESSAGE CONTENT PARSER & RENDERER ──────────────────────────
function RenderMessageContent({ content, isMe }: { content: string; isMe: boolean }) {
  if (!content) return null;

  const tokens = content.split(/(#\[product:[^\]]+\]|#\[order:[^\]]+\]|@[a-zA-Z0-9_\u00C0-\u017F]+)/g);

  return (
    <div className="space-y-2">
      <div className="whitespace-pre-wrap leading-relaxed">
        {tokens.map((token, idx) => {
          
          // 1. PRODUCT CARD TOKEN
          if (token.startsWith('#[product:')) {
            const match = token.match(/#\[product:(\d+):([^:]+):([^:]+):([^:]+):([^\]]+)\]/);
            if (match) {
              const [, id, name, price, brand, slug] = match;
              return (
                <div 
                  key={idx} 
                  className="my-2.5 p-3 rounded-2xl bg-white dark:bg-[#141d2c] border border-amber-300/60 dark:border-amber-500/40 shadow-sm flex items-center justify-between gap-3 text-slate-900 dark:text-white"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-300/40 flex items-center justify-center font-bold shrink-0">
                      <Sparkles size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-xs text-slate-900 dark:text-white truncate">{name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {brand} • <strong className="text-amber-600 dark:text-amber-400 font-bold">{price} MAD</strong>
                      </p>
                    </div>
                  </div>
                  
                  <Link
                    href={`/products/${slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[10px] shrink-0 shadow-xs transition-transform hover:scale-105"
                  >
                    <span>Fiche Produit</span>
                    <ArrowUpRight size={11} />
                  </Link>
                </div>
              );
            }
          }

          // 2. ORDER CARD TOKEN
          if (token.startsWith('#[order:')) {
            const match = token.match(/#\[order:([^:]+):([^:]+):([^:]+):([^:]+):([^\]]+)\]/);
            if (match) {
              const [, id, number, client, total, status] = match;
              return (
                <div 
                  key={idx} 
                  className="my-2.5 p-3 rounded-2xl bg-white dark:bg-[#141d2c] border border-indigo-300/60 dark:border-indigo-500/40 shadow-sm flex items-center justify-between gap-3 text-slate-900 dark:text-white"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-300/40 flex items-center justify-center font-bold shrink-0">
                      <ShoppingBag size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-extrabold text-xs text-slate-900 dark:text-white truncate">Commande #{number}</p>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                          {status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Client : {client} • <strong className="text-slate-900 dark:text-white font-bold">{total} MAD</strong>
                      </p>
                    </div>
                  </div>
                  
                  <Link
                    href={`/admin/orders?highlight=${id}&orderNumber=${encodeURIComponent(number)}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] shrink-0 shadow-xs transition-transform hover:scale-105"
                  >
                    <span>Gérer</span>
                    <ChevronRight size={12} />
                  </Link>
                </div>
              );
            }
          }

          // 3. MEMBER MENTION TOKEN
          if (token.startsWith('@')) {
            const clean = token.slice(1).replace(/_/g, ' ');
            return (
              <span 
                key={idx} 
                className={`inline-flex items-center px-1.5 py-0.5 rounded-lg font-bold mx-0.5 ${
                  isMe 
                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' 
                    : 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200/50'
                }`}
              >
                @{clean}
              </span>
            );
          }

          return <span key={idx}>{token}</span>;
        })}
      </div>
    </div>
  );
}
