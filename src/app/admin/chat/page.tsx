'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Send,
  Paperclip,
  Smile,
  Search,
  Check,
  CheckCheck,
  Users,
  Sparkles,
  Package,
  ShoppingBag,
  Plus,
  X,
  Trash2,
  RefreshCw,
  AtSign,
  Hash,
  Pin,
  PinOff,
  Zap,
  Copy,
  Mic,
  Play,
  Pause,
  FileText,
  Download,
  Film,
  Image as ImageIcon,
  Store,
  Reply,
  CheckSquare,
  PanelRightOpen,
  PanelRightClose,
  Truck,
  Megaphone,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Crown,
  ArrowLeft,
} from 'lucide-react';
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

export interface ChatAttachment {
  url: string;
  type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'PDF';
  name?: string;
  size?: number;
  duration?: number;
}

export interface ChatReaction {
  emoji: string;
  userId: string;
  userName: string;
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
  reactions?: string | null;
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

const QUICK_REACTION_EMOJIS = ['❤️', '🔥', '👍', '👏', '😂', '🎉', '💎', '📦'];
const EXTENDED_EMOJIS = ['👍', '🔥', '✅', '❤️', '📦', '🚀', '⏳', '👏', '✨', '👌', '💎', '🎉', '😂', '😍', '🙏', '💯'];

const QUICK_TEMPLATES = [
  { icon: '✅', label: 'Commande Validée', text: '✅ Commande validée par téléphone et transmise au coursier pour expédition.' },
  { icon: '📦', label: 'Contrôle Stock', text: '📦 Contrôle des stocks terminé : prévoir un réassort sur cette référence.' },
  { icon: '🚨', label: 'Alerte Rupture', text: '🚨 Attention : stock critique signalé sur ce parfum.' },
  { icon: '🎯', label: 'Objectif Atteint', text: '🎯 Objectif quotidien de commandes dépassé ! Félicitations à toute l\'équipe.' },
  { icon: '📞', label: 'Confirmation Client', text: '📞 Client joint par téléphone : adresse confirmée, livraison programmée.' },
  { icon: '💎', label: 'Cadeau VIP', text: '💎 Client VIP récurrent : insérer un flacon testeur 5ml de prestige dans le colis.' },
];

const CHANNEL_STARTERS: Record<string, Array<{ title: string; prompt: string }>> = {
  GENERAL: [
    { title: 'Point du matin NAY', prompt: '☀️ Point équipe du jour : priorités commandes COD, stock testeurs et objectifs ROAS du jour.' },
    { title: 'Nouvelle idée boutique', prompt: '✨ Idée pour améliorer la conversion vitrine et le panier moyen :' },
    { title: 'Validation livraison VIP', prompt: '💎 Client VIP à prioriser pour expédition express aujourd\'hui :' },
  ],
  STOCK: [
    { title: 'Alerte Réassort Flacon', prompt: '📦 Réassort urgent à prévoir sur cette référence :' },
    { title: 'Réception Fournisseur', prompt: '✅ Nouvel arrivage réceptionné et contrôlé en atelier.' },
    { title: 'Contrôle Packaging', prompt: '🎁 Vérification stock coffrets cadeaux & rubans NAY terminée.' },
  ],
  ORDERS: [
    { title: 'Grosse Commande COD', prompt: '🔥 Nouvelle commande importante à confirmer par appel prioritaire :' },
    { title: 'Relance Client', prompt: '📞 Client injoignable au premier appel, relance WhatsApp planifiée.' },
    { title: 'Cadeau Testeur 5ml', prompt: '💎 Merci d\'ajouter un testeur 5ml offert dans cette commande.' },
  ],
  MARKETING: [
    { title: 'Perf Meta Ads / ROAS', prompt: '📈 Bilan campagnes Ads du jour : CPA, CTR et créas gagnantes à scaler :' },
    { title: 'Brief Créatif UGC', prompt: '🎬 Nouveau script vidéo / créa à tourner pour notre prochain best-seller :' },
    { title: 'Relance Panier', prompt: '💬 Campagne rétention WhatsApp prête pour les paniers abandonnés.' },
  ],
  LOGISTICS: [
    { title: 'Ramassage Livreur', prompt: '🚚 Bordereau prêt : colis remis au transporteur pour tournée du jour.' },
    { title: 'Changement d\'adresse', prompt: '📍 Mise à jour ville / adresse client avant expédition :' },
    { title: 'Retour / Échange', prompt: '🔄 Colis retour réceptionné en entrepôt pour vérification.' },
  ],
};

function getChannelVisual(slug: string, color?: string) {
  switch (slug) {
    case 'GENERAL':
      return {
        icon: Sparkles,
        bg: 'bg-sky-500/15',
        text: 'text-sky-600',
        border: 'border-sky-500/25',
        solid: 'bg-gradient-to-br from-[#0ea5e9] to-[#0284c7]',
      };
    case 'STOCK':
      return {
        icon: Package,
        bg: 'bg-emerald-500/15',
        text: 'text-emerald-600',
        border: 'border-emerald-500/25',
        solid: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
      };
    case 'ORDERS':
      return {
        icon: ShoppingBag,
        bg: 'bg-indigo-500/15',
        text: 'text-indigo-600',
        border: 'border-indigo-500/25',
        solid: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
      };
    case 'MARKETING':
      return {
        icon: Megaphone,
        bg: 'bg-violet-500/15',
        text: 'text-violet-600',
        border: 'border-violet-500/25',
        solid: 'bg-gradient-to-br from-violet-500 to-violet-600',
      };
    case 'LOGISTICS':
      return {
        icon: Truck,
        bg: 'bg-amber-500/15',
        text: 'text-amber-600',
        border: 'border-amber-500/25',
        solid: 'bg-gradient-to-br from-amber-500 to-amber-600',
      };
    default:
      return {
        icon: color === 'emerald' ? Package : Hash,
        bg: 'bg-sky-500/15',
        text: 'text-sky-600',
        border: 'border-sky-500/25',
        solid: 'bg-gradient-to-br from-[#0ea5e9] to-[#0284c7]',
      };
  }
}

function parseAttachments(raw: string | null | undefined): ChatAttachment[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item: any) => {
      if (typeof item === 'string') {
        const lower = item.toLowerCase();
        let type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'PDF' = 'IMAGE';
        if (lower.endsWith('.pdf') || item.startsWith('data:application/pdf')) type = 'PDF';
        else if (lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.mov') || item.startsWith('data:video/')) type = 'VIDEO';
        else if (lower.endsWith('.mp3') || lower.endsWith('.wav') || lower.endsWith('.ogg') || lower.endsWith('.m4a') || item.startsWith('data:audio/')) type = 'AUDIO';
        return {
          url: item,
          type,
          name: type === 'PDF' ? 'Document.pdf' : type === 'AUDIO' ? 'Vocal.webm' : type === 'VIDEO' ? 'Vidéo.mp4' : 'Photo',
        };
      }
      return item as ChatAttachment;
    });
  } catch {
    return [];
  }
}

function parseAllReactionEntries(raw: string | null | undefined): ChatReaction[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseVisibleReactions(raw: string | null | undefined): ChatReaction[] {
  return parseAllReactionEntries(raw).filter((r) => r.emoji !== '__PIN__');
}

function isMessagePinned(raw: string | null | undefined): boolean {
  return parseAllReactionEntries(raw).some((r) => r.emoji === '__PIN__');
}

function stripReplyPrefix(content: string): { replyName?: string; replySnippet?: string; body: string } {
  const match = content.match(/^> \[reply:([^:\]]+):([^\]]*)\]\n?([\s\S]*)$/);
  if (!match) return { body: content };
  return {
    replyName: match[1],
    replySnippet: match[2],
    body: match[3] || '',
  };
}

function formatPreviewSnippet(content: string): string {
  const clean = stripReplyPrefix(content).body;
  return clean
    .replace(/#\[product:\d+:([^:]+):[^\]]+\]/g, '💎 $1')
    .replace(/#\[order:[^:]+:([^:]+):[^\]]+\]/g, '📦 Commande #$1');
}

function formatCompactTime(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default function AdminTeamChatPage() {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [contacts, setContacts] = useState<ConversationContact[]>([]);
  const [channels, setChannels] = useState<ConversationChannel[]>([]);
  const [allTeamMembers, setAllTeamMembers] = useState<AdminUser[]>([]);
  const [activeChatType, setActiveChatType] = useState<'CHANNEL' | 'DIRECT'>('CHANNEL');
  const [activeId, setActiveId] = useState<string>('GENERAL');

  // Messages State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [searchContact, setSearchContact] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTemplatesMenu, setShowTemplatesMenu] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; senderName: string; snippet: string } | null>(null);

  // Toast feedback
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // In-channel search & Right Inspector
  const [showInChatSearch, setShowInChatSearch] = useState(false);
  const [inChatSearchQuery, setInChatSearchQuery] = useState('');
  const [chatFilter, setChatFilter] = useState<'ALL' | 'MEDIA' | 'PRODUCTS' | 'ORDERS' | 'PINNED'>('ALL');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [showInspector, setShowInspector] = useState(true);
  const [inspectorTab, setInspectorTab] = useState<'OVERVIEW' | 'SHARED' | 'PINNED'>('OVERVIEW');

  // Mobile 2-pane Navigation (Conversations List <-> Active Chat Room)
  const [mobileChatView, setMobileChatView] = useState<'LIST' | 'ROOM'>('LIST');

  // Sidebar Filter (Toutes / Salons / Directs / Non-lus)
  const [sidebarTab, setSidebarTab] = useState<'ALL' | 'CHANNELS' | 'DIRECT' | 'UNREAD'>('ALL');

  // NAY Connect Product Catalog Modal
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');

  // Group Modals
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showManageMembersModal, setShowManageMembersModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [isSavingGroup, setIsSavingGroup] = useState(false);

  // Chat -> Mission Modal
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('HIGH');
  const [taskAssigneeId, setTaskAssigneeId] = useState<string>('');
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  // Mentionables (ALL products, orders, members)
  const [allProducts, setAllProducts] = useState<ProductMentionItem[]>([]);
  const [allOrders, setAllOrders] = useState<OrderMentionItem[]>([]);
  const [mentionMenu, setMentionMenu] = useState<{
    type: 'MEMBER' | 'PRODUCT' | 'ORDER' | null;
    query: string;
  }>({ type: null, query: '' });

  // Attachments State
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Audio Recording State
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Conversations & Mentionables
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
      console.error('Failed to load conversations:', err);
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

  // Real-time Polling (4s)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMessages(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);

  // ── VOICE RECORDER CONTROLS ──────────────────────────────────────────
  const startAudioRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showToast("L'enregistrement audio n'est pas supporté par ce navigateur.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());
        const audioFile = new window.File([audioBlob], `vocal_${Date.now()}.webm`, { type: 'audio/webm' });
        await handleUploadFile(audioFile, 'AUDIO');
      };

      mediaRecorder.start();
      setIsRecordingAudio(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone error:', err);
      showToast("Veuillez autoriser l'accès au microphone pour enregistrer un vocal.");
    }
  };

  const stopAudioRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaRecorderRef.current && isRecordingAudio) {
      mediaRecorderRef.current.stop();
      setIsRecordingAudio(false);
    }
  };

  const cancelAudioRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaRecorderRef.current && isRecordingAudio) {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream?.getTracks().forEach((t) => t.stop());
      setIsRecordingAudio(false);
      setRecordingDuration(0);
    }
  };

  // ── FILE UPLOAD ──────────────────────────────────────────────────────
  const handleUploadFile = async (file: File, forceType?: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'PDF') => {
    setIsUploadingAttachment(true);
    try {
      let type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'PDF' = forceType || 'IMAGE';
      const name = file.name.toLowerCase();
      const mime = file.type.toLowerCase();

      if (!forceType) {
        if (mime.includes('pdf') || name.endsWith('.pdf')) type = 'PDF';
        else if (mime.startsWith('video/') || name.endsWith('.mp4') || name.endsWith('.webm') || name.endsWith('.mov')) type = 'VIDEO';
        else if (mime.startsWith('audio/') || name.endsWith('.mp3') || name.endsWith('.wav') || name.endsWith('.m4a') || name.endsWith('.ogg')) type = 'AUDIO';
        else type = 'IMAGE';
      }

      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          const newAtt: ChatAttachment = {
            url: data.url,
            type,
            name: file.name,
            size: file.size,
            duration: type === 'AUDIO' ? recordingDuration || undefined : undefined,
          };
          setPendingAttachments((prev) => [...prev, newAtt]);
          return;
        }
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const newAtt: ChatAttachment = {
          url: e.target?.result as string,
          type,
          name: file.name,
          size: file.size,
          duration: type === 'AUDIO' ? recordingDuration || undefined : undefined,
        };
        setPendingAttachments((prev) => [...prev, newAtt]);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('File upload error:', err);
    } finally {
      setIsUploadingAttachment(false);
      setRecordingDuration(0);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleUploadFile(file);
    e.target.value = '';
    setShowAttachMenu(false);
  };

  const triggerUpload = (acceptType: string) => {
    if (!fileInputRef.current) return;
    fileInputRef.current.accept = acceptType;
    fileInputRef.current.click();
    setShowAttachMenu(false);
  };

  // ── TOGGLE EMOJI REACTION ───────────────────────────────────────────
  const handleToggleReaction = async (messageId: string, emoji: string) => {
    if (!currentUser) return;

    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg;
        const current = parseAllReactionEntries(msg.reactions);
        const existingIdx = current.findIndex(
          (r) => r.userId === currentUser.id && r.emoji === emoji
        );
        const updated =
          existingIdx !== -1
            ? current.filter((_, i) => i !== existingIdx)
            : [...current, { emoji, userId: currentUser.id, userName: currentUser.name }];
        return { ...msg, reactions: JSON.stringify(updated) };
      })
    );

    try {
      await fetch('/api/admin/chat/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, emoji }),
      });
    } catch (err) {
      console.error('Reaction error:', err);
    }
  };

  // ── TOGGLE PIN MESSAGE ──────────────────────────────────────────────
  const handleTogglePin = async (messageId: string) => {
    if (!currentUser) return;
    const targetMsg = messages.find((m) => m.id === messageId);
    const wasPinned = isMessagePinned(targetMsg?.reactions);

    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg;
        const current = parseAllReactionEntries(msg.reactions);
        const updated = wasPinned
          ? current.filter((r) => r.emoji !== '__PIN__')
          : [...current, { emoji: '__PIN__', userId: currentUser.id, userName: currentUser.name }];
        return { ...msg, reactions: JSON.stringify(updated) };
      })
    );

    try {
      await fetch('/api/admin/chat/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, action: 'TOGGLE_PIN' }),
      });
      showToast(wasPinned ? 'Message désépinglé.' : 'Message épinglé au salon !');
    } catch (err) {
      console.error('Pin error:', err);
    }
  };

  // ── DELETE MESSAGE ──────────────────────────────────────────────────
  const handleDeleteMessage = async (messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    try {
      const res = await fetch(`/api/admin/chat/messages?id=${encodeURIComponent(messageId)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showToast('Message supprimé.');
        fetchConversations();
      }
    } catch (err) {
      console.error('Delete message error:', err);
    }
  };

  // Autocomplete Mentions
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

  const insertMemberMention = (member: AdminUser) => {
    const lastAt = messageInput.lastIndexOf('@');
    const prefix = lastAt !== -1 ? messageInput.slice(0, lastAt) : messageInput;
    const cleanName = member.name.replace(/\s+/g, '_');
    setMessageInput(`${prefix}@${cleanName} `);
    setMentionMenu({ type: null, query: '' });
    inputRef.current?.focus();
  };

  const insertProductMention = (product: ProductMentionItem) => {
    const lastHash = messageInput.lastIndexOf('#');
    const prefix = lastHash !== -1 ? messageInput.slice(0, lastHash) : messageInput;
    const token = `#[product:${product.id}:${product.name}:${product.price}:${product.brand}:${product.slug}]`;
    setMessageInput(`${prefix}${token} `);
    setMentionMenu({ type: null, query: '' });
    setShowCatalogModal(false);
    inputRef.current?.focus();
  };

  const insertOrderMention = (order: OrderMentionItem) => {
    const lastDollar = messageInput.lastIndexOf('$');
    const prefix = lastDollar !== -1 ? messageInput.slice(0, lastDollar) : messageInput;
    const token = `#[order:${order.id}:${order.orderNumber}:${order.customerName}:${order.total}:${order.status}]`;
    setMessageInput(`${prefix}${token} `);
    setMentionMenu({ type: null, query: '' });
    inputRef.current?.focus();
  };

  // Send Message
  const handleSendMessage = async (e?: React.FormEvent, overrideText?: string) => {
    if (e) e.preventDefault();
    const rawInput = overrideText !== undefined ? overrideText : messageInput;
    if ((!rawInput.trim() && pendingAttachments.length === 0) || isSending) return;

    const replyPrefix = replyingTo
      ? `> [reply:${replyingTo.senderName}:${replyingTo.snippet.replace(/[\r\n:\]]+/g, ' ').slice(0, 75)}]\n`
      : '';

    const textToSend = `${replyPrefix}${rawInput.trim()}`.trim();
    const attachmentsToSend = [...pendingAttachments];

    if (overrideText === undefined) setMessageInput('');
    setPendingAttachments([]);
    setReplyingTo(null);
    setShowEmojiPicker(false);
    setShowTemplatesMenu(false);
    setShowAttachMenu(false);
    setMentionMenu({ type: null, query: '' });

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: tempId,
      senderId: currentUser?.id || 'me',
      senderName: currentUser?.name || 'Moi',
      senderAvatar: currentUser?.avatar,
      recipientId: activeChatType === 'DIRECT' ? activeId : null,
      channel: activeChatType === 'DIRECT' ? 'DIRECT' : activeId,
      content: textToSend,
      attachments: attachmentsToSend.length > 0 ? JSON.stringify(attachmentsToSend) : null,
      reactions: '[]',
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
          attachments: attachmentsToSend.length > 0 ? attachmentsToSend : undefined,
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

  // Create Task from Chat Message
  const openCreateTaskFromMessage = (msg?: ChatMessage) => {
    const clean = msg ? stripReplyPrefix(msg.content).body.slice(0, 120) : '';
    setTaskTitle(clean ? `Action Chat: ${clean.slice(0, 60)}` : `Action depuis #${activeChannel?.name || activeContact?.name || 'NAY Chat'}`);
    setTaskDesc(
      msg
        ? `Créée depuis NAY Connect (${msg.senderName}) :\n\n"${stripReplyPrefix(msg.content).body}"`
        : ''
    );
    setTaskPriority('HIGH');
    setTaskAssigneeId(activeChatType === 'DIRECT' ? activeId : currentUser?.id || '');
    setTaskModalOpen(true);
  };

  const handleCreateTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || isCreatingTask) return;
    setIsCreatingTask(true);
    try {
      const res = await fetch('/api/admin/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskTitle.trim(),
          description: taskDesc.trim(),
          priority: taskPriority,
          assignedToId: taskAssigneeId || null,
          tags: activeChatType === 'CHANNEL' ? activeId : 'NAY Chat',
        }),
      });
      if (res.ok) {
        setTaskModalOpen(false);
        showToast('Mission créée dans Missions & Tâches !');
      } else {
        showToast('Impossible de créer la mission.');
      }
    } catch {
      showToast('Erreur réseau lors de la création de la mission.');
    } finally {
      setIsCreatingTask(false);
    }
  };

  // Export Transcript (.txt)
  const handleExportTranscript = () => {
    const roomTitle = activeChatType === 'CHANNEL' ? activeChannel?.name || activeId : activeContact?.name || 'Direct';
    const lines = messages.map(
      (m) =>
        `[${new Date(m.createdAt).toLocaleString('fr-FR')}] ${m.senderName}: ${stripReplyPrefix(m.content).body}`
    );
    const blob = new Blob([`=== TRANSCRIPT NAY CONNECT : ${roomTitle} ===\n\n${lines.join('\n')}`], {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nay-chat-${activeId.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Transcript téléchargé.');
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
          color: 'sky',
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
          showToast(`Salon "${data.group.name}" créé !`);
        }
      }
    } catch (err) {
      console.error('Failed to create group:', err);
    } finally {
      setIsSavingGroup(false);
    }
  };

  const handleUpdateGroupMembers = async () => {
    const currentChannel = channels.find((c) => c.slug === activeId);
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
        showToast('Membres du salon mis à jour.');
      }
    } catch (err) {
      console.error('Failed to update group members:', err);
    } finally {
      setIsSavingGroup(false);
    }
  };

  const handleDeleteGroup = async (dbId: string) => {
    if (!confirm('Supprimer ce salon ?')) return;

    try {
      const res = await fetch(`/api/admin/chat/groups?id=${dbId}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchConversations();
        setActiveChatType('CHANNEL');
        setActiveId('GENERAL');
        setShowManageMembersModal(false);
        showToast('Salon supprimé.');
      }
    } catch (err) {
      console.error('Failed to delete group:', err);
    }
  };

  const handleCopyMessage = (msgId: string, content: string) => {
    navigator.clipboard?.writeText(stripReplyPrefix(content).body);
    setCopiedMessageId(msgId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  // Active Chat Header Info
  const activeChannel = channels.find((c) => c.slug === activeId);
  const activeContact = contacts.find((c) => c.id === activeId);
  const activeVisual = getChannelVisual(activeId, activeChannel?.color);
  const ActiveChannelIcon = activeVisual.icon;

  // Global stats
  const totalUnreadCount = useMemo(
    () => contacts.reduce((sum, c) => sum + (c.unreadCount || 0), 0),
    [contacts]
  );

  const onlineMembersCount = useMemo(
    () => allTeamMembers.filter((u) => u.id === currentUser?.id || isUserOnline(u.lastActivityAt)).length,
    [allTeamMembers, currentUser]
  );

  // Filtered Contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      if (sidebarTab === 'UNREAD' && (c.unreadCount || 0) === 0) return false;
      const q = searchContact.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q) ||
        (c.jobTitle && c.jobTitle.toLowerCase().includes(q))
      );
    });
  }, [contacts, searchContact, sidebarTab]);

  // Filtered Channels
  const filteredChannels = useMemo(() => {
    if (sidebarTab === 'UNREAD') return [];
    return channels.filter((c) => {
      const q = searchContact.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      );
    });
  }, [channels, searchContact, sidebarTab]);

  // Catalog Products filtered
  const catalogFilteredProducts = useMemo(() => {
    if (!catalogSearch.trim()) return allProducts;
    const q = catalogSearch.toLowerCase();
    return allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.price.toString().includes(q)
    );
  }, [allProducts, catalogSearch]);

  // Pinned & Extracted Shared Objects
  const pinnedMessages = useMemo(
    () => messages.filter((m) => isMessagePinned(m.reactions)),
    [messages]
  );

  const sharedArtifacts = useMemo(() => {
    const products: Array<{ id: string; name: string; price: string; brand: string; slug: string }> = [];
    const orders: Array<{ id: string; number: string; client: string; total: string; status: string }> = [];
    const files: Array<ChatAttachment & { msgId: string }> = [];

    for (const msg of messages) {
      const pMatches = msg.content.matchAll(/#\[product:(\d+):([^:]+):([^:]+):([^:]+):([^\]]+)\]/g);
      for (const m of pMatches) {
        if (!products.some((p) => p.id === m[1])) {
          products.push({ id: m[1], name: m[2], price: m[3], brand: m[4], slug: m[5] });
        }
      }
      const oMatches = msg.content.matchAll(/#\[order:([^:]+):([^:]+):([^:]+):([^:]+):([^\]]+)\]/g);
      for (const m of oMatches) {
        if (!orders.some((o) => o.id === m[1])) {
          orders.push({ id: m[1], number: m[2], client: m[3], total: m[4], status: m[5] });
        }
      }
      for (const att of parseAttachments(msg.attachments)) {
        files.push({ ...att, msgId: msg.id });
      }
    }
    return { products, orders, files };
  }, [messages]);

  // Filtered Messages
  const displayedMessages = useMemo(() => {
    return messages.filter((msg) => {
      if (inChatSearchQuery.trim()) {
        const q = inChatSearchQuery.toLowerCase();
        const matchesContent = msg.content.toLowerCase().includes(q);
        const matchesSender = msg.senderName.toLowerCase().includes(q);
        if (!matchesContent && !matchesSender) return false;
      }

      if (chatFilter === 'MEDIA') return parseAttachments(msg.attachments).length > 0;
      if (chatFilter === 'PRODUCTS') return msg.content.includes('#[product:');
      if (chatFilter === 'ORDERS') return msg.content.includes('#[order:');
      if (chatFilter === 'PINNED') return isMessagePinned(msg.reactions);
      return true;
    });
  }, [messages, inChatSearchQuery, chatFilter]);

  // Sky Blue Double Tick Checkmarks
  const renderSkyTicks = (msg: ChatMessage, isMe: boolean) => {
    if (!isMe) return null;
    const isRead = msg.isRead || (activeChatType === 'CHANNEL' && msg.readBy && msg.readBy !== '[]');
    return (
      <span className="inline-flex items-center ml-1 text-[11px]" title={isRead ? 'Vu' : 'Envoyé'}>
        {isRead ? (
          <CheckCheck size={14} className="text-sky-500 stroke-[2.5]" />
        ) : (
          <Check size={13} className="text-slate-400 stroke-[2]" />
        )}
      </span>
    );
  };

  const currentStarters = CHANNEL_STARTERS[activeId] || CHANNEL_STARTERS.GENERAL;

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-110px)] font-sans text-slate-900">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-24 lg:bottom-6 right-3 lg:right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2.5 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 size={15} className="text-sky-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ── TOP EXECUTIVE NAY CONNECT COMMAND STRIP ─────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3 shrink-0">
        <div className="flex flex-wrap items-center gap-3">
          <div className="nay-hero-shine w-10 h-10 rounded-xl bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] text-white flex items-center justify-center shadow-sm shrink-0">
            <MessageSquare size={18} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900">
                NAY Connect • Hub Collaboration
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                PRO OS
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{onlineMembersCount} en ligne</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Messagerie d&apos;équipe temps réel : partagez vos {allProducts.length} parfums, commandes COD et transformez un message en mission.
            </p>
          </div>
        </div>

        {/* Executive Metric Pills & Quick Actions */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto shrink-0">
          {totalUnreadCount > 0 && (
            <button
              type="button"
              onClick={() => setSidebarTab(sidebarTab === 'UNREAD' ? 'ALL' : 'UNREAD')}
              className="col-span-2 sm:col-span-1 h-9 inline-flex items-center justify-center gap-1.5 px-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold cursor-pointer"
            >
              <AlertCircle size={13} />
              <span>{totalUnreadCount} non-lu(s)</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setShowInspector(true);
              setInspectorTab('PINNED');
            }}
            className="h-9 inline-flex items-center justify-center gap-1.5 px-3 rounded-xl bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
          >
            <Pin size={13} className="text-sky-600 shrink-0" />
            <span>Épinglés ({pinnedMessages.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCatalogModal(true)}
            className="h-9 inline-flex items-center justify-center gap-1.5 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 text-xs font-bold transition-all cursor-pointer"
          >
            <Store size={13} className="shrink-0" />
            <span>Catalogue ({allProducts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedMemberIds(allTeamMembers.map((u) => u.id));
              setShowCreateGroupModal(true);
            }}
            style={{ backgroundColor: 'var(--admin-accent, #0ea5e9)' }}
            className="col-span-2 sm:col-span-1 h-9 inline-flex items-center justify-center gap-1.5 px-3.5 rounded-xl text-white text-xs font-semibold shadow-xs hover:opacity-95 transition-all cursor-pointer"
          >
            <Plus size={14} className="shrink-0" />
            <span>Nouveau Salon</span>
          </button>
        </div>
      </div>

      {/* ── MAIN 3-COLUMN MESSAGING STUDIO SHELL ─────────────────────── */}
      <div className="flex-1 min-h-0 flex bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* ── 1. LEFT SIDEBAR RAIL (Full width on phone LIST view) ── */}
        <aside className={`${mobileChatView === 'LIST' ? 'flex w-full' : 'hidden'} lg:flex lg:w-80 border-r border-slate-200 bg-slate-50/70 flex-col shrink-0`}>
          {/* Quick Online Teammates Strip */}
          {allTeamMembers.length > 0 && (
            <div className="px-3.5 py-2.5 bg-white border-b border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <span>Équipe en Direct</span>
                <span className="text-emerald-600">{onlineMembersCount} actif(s)</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
                {allTeamMembers.map((member) => {
                  const isMe = member.id === currentUser?.id;
                  const online = isMe || isUserOnline(member.lastActivityAt);
                  const isSelectedDirect = activeChatType === 'DIRECT' && activeId === member.id;
                  return (
                    <button
                      key={member.id}
                      type="button"
                      disabled={isMe}
                      onClick={() => {
                        if (isMe) return;
                        setActiveChatType('DIRECT');
                        setActiveId(member.id);
                        setMobileChatView('ROOM');
                      }}
                      title={`${member.name}${isMe ? ' (Vous)' : online ? ' • En ligne' : ''}`}
                      className={`group flex flex-col items-center gap-1 shrink-0 ${
                        isMe ? 'cursor-default' : 'cursor-pointer'
                      }`}
                    >
                      <div
                        className={`relative w-9 h-9 rounded-full p-0.5 transition-all ${
                          isSelectedDirect
                            ? 'ring-2 ring-sky-500 bg-sky-50'
                            : online
                            ? 'ring-1 ring-emerald-400'
                            : 'ring-1 ring-slate-200'
                        }`}
                      >
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] text-white font-bold text-[10px] flex items-center justify-center overflow-hidden">
                          {member.avatar ? (
                            <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                          ) : (
                            <span>{member.name.slice(0, 2).toUpperCase()}</span>
                          )}
                        </div>
                        <span
                          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                            online ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-slate-600 max-w-[52px] truncate">
                        {isMe ? 'Vous' : member.name.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search & Segmented Tabs */}
          <div className="p-2.5 border-b border-slate-200/80 space-y-2 bg-white">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher salon, collègue..."
                value={searchContact}
                onChange={(e) => setSearchContact(e.target.value)}
                className="w-full pl-9 pr-7 py-1.5 bg-slate-100 border border-transparent focus:border-sky-400 focus:bg-white rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors"
              />
              {searchContact && (
                <button
                  type="button"
                  onClick={() => setSearchContact('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-0.5 rounded-xl text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setSidebarTab('ALL')}
                className={`py-1 rounded-lg transition-all cursor-pointer ${
                  sidebarTab === 'ALL'
                    ? 'bg-white text-sky-700 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Toutes
              </button>
              <button
                type="button"
                onClick={() => setSidebarTab('CHANNELS')}
                className={`py-1 rounded-lg transition-all cursor-pointer ${
                  sidebarTab === 'CHANNELS'
                    ? 'bg-white text-sky-700 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Salons ({channels.length})
              </button>
              <button
                type="button"
                onClick={() => setSidebarTab('DIRECT')}
                className={`py-1 rounded-lg transition-all cursor-pointer ${
                  sidebarTab === 'DIRECT'
                    ? 'bg-white text-sky-700 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Directs ({contacts.length})
              </button>
            </div>
          </div>

          {/* Conversations Feed */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
            {/* 1. CHANNELS */}
            {(sidebarTab === 'ALL' || sidebarTab === 'CHANNELS') && filteredChannels.length > 0 && (
              <div>
                <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/90">
                  Salons Opérationnels
                </div>
                {filteredChannels.map((channel) => {
                  const isActive = activeChatType === 'CHANNEL' && activeId === channel.slug;
                  const vis = getChannelVisual(channel.slug, channel.color);
                  const ChanIcon = vis.icon;
                  const lastPreview = channel.lastMessage
                    ? `${channel.lastMessage.senderName.split(' ')[0]}: ${formatPreviewSnippet(channel.lastMessage.content) || '📎 Pièce jointe'}`
                    : channel.description;

                  return (
                    <button
                      key={channel.slug}
                      type="button"
                      onClick={() => {
                        setActiveChatType('CHANNEL');
                        setActiveId(channel.slug);
                        setInChatSearchQuery('');
                        setShowInChatSearch(false);
                        setMobileChatView('ROOM');
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-3 text-left transition-all cursor-pointer border-l-3 ${
                        isActive
                          ? 'bg-sky-50 border-sky-500'
                          : 'border-transparent hover:bg-slate-100'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                          isActive
                            ? `${vis.solid} text-white border-transparent shadow-xs`
                            : `${vis.bg} ${vis.text} ${vis.border}`
                        }`}
                      >
                        <ChanIcon size={17} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1.5">
                          <p className={`text-xs truncate ${isActive ? 'font-extrabold text-sky-900' : 'font-bold text-slate-900'}`}>
                            {channel.name}
                          </p>
                          <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                            {channel.lastMessage ? formatCompactTime(channel.lastMessage.createdAt) : `${channel.memberCount || 0} m.`}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {lastPreview}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 2. DIRECT CONTACTS */}
            {(sidebarTab === 'ALL' || sidebarTab === 'DIRECT' || sidebarTab === 'UNREAD') && filteredContacts.length > 0 && (
              <div>
                <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/90">
                  Messages Directs
                </div>
                {filteredContacts.map((contact) => {
                  const isActive = activeChatType === 'DIRECT' && activeId === contact.id;
                  const online = isUserOnline(contact.lastActivityAt);
                  const lastPreview = contact.lastMessage
                    ? formatPreviewSnippet(contact.lastMessage.content) || '📎 Pièce jointe'
                    : contact.jobTitle || contact.role;

                  return (
                    <button
                      key={contact.id}
                      type="button"
                      onClick={() => {
                        setActiveChatType('DIRECT');
                        setActiveId(contact.id);
                        setInChatSearchQuery('');
                        setShowInChatSearch(false);
                        setMobileChatView('ROOM');
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-3 text-left transition-all cursor-pointer border-l-3 ${
                        isActive
                          ? 'bg-sky-50 border-sky-500'
                          : 'border-transparent hover:bg-slate-100'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center overflow-hidden">
                          {contact.avatar ? (
                            <img src={contact.avatar} alt={contact.name} className="w-full h-full object-cover" />
                          ) : (
                            <span>{contact.name.slice(0, 2).toUpperCase()}</span>
                          )}
                        </div>
                        <span
                          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                            online ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1.5">
                          <p className="text-xs font-bold text-slate-900 truncate flex items-center gap-1">
                            <span>{contact.name}</span>
                            {contact.role === 'OWNER' && <Crown size={11} className="text-amber-500 shrink-0" />}
                          </p>
                          <span className="text-[10px] text-sky-600 shrink-0 font-semibold">
                            {contact.lastMessage ? formatCompactTime(contact.lastMessage.createdAt) : online ? 'en ligne' : ''}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-1 mt-0.5">
                          <p className="text-[11px] text-slate-500 truncate">{lastPreview}</p>
                          {(contact.unreadCount || 0) > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full bg-sky-600 text-white text-[9px] font-bold shrink-0">
                              {contact.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* ── 2. CENTER CONVERSATION CANVAS ─────────────────────────── */}
        <main className={`${mobileChatView === 'ROOM' ? 'flex w-full' : 'hidden'} lg:flex flex-1 flex-col bg-slate-50/70 overflow-hidden relative min-w-0`}>
          {/* Active Room Header */}
          <div className="px-3 sm:px-5 py-3 bg-white border-b border-slate-200 flex items-center justify-between gap-2 sm:gap-3 z-10 shrink-0">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileChatView('LIST')}
                className="lg:hidden w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 cursor-pointer"
                aria-label="Retour aux discussions"
              >
                <ArrowLeft size={16} />
              </button>
              <div
                className={`w-10 h-10 rounded-xl text-white font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden shadow-xs ${
                  activeChatType === 'CHANNEL' ? activeVisual.solid : 'bg-gradient-to-br from-[#0ea5e9] to-[#0284c7]'
                }`}
              >
                {activeChatType === 'CHANNEL' ? (
                  <ActiveChannelIcon size={18} />
                ) : activeContact?.avatar ? (
                  <img src={activeContact.avatar} alt={activeContact.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{(activeContact?.name || '@').slice(0, 2).toUpperCase()}</span>
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-extrabold text-slate-900 truncate">
                    {activeChatType === 'CHANNEL' ? activeChannel?.name : activeContact?.name}
                  </h2>
                  {activeChatType === 'CHANNEL' && activeChannel && (
                    <span className="hidden sm:inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {activeChannel.memberCount || 0} membre(s)
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 truncate">
                  {activeChatType === 'CHANNEL'
                    ? activeChannel?.description
                    : isUserOnline(activeContact?.lastActivityAt)
                    ? 'En ligne maintenant • Canal chiffré'
                    : formatLastSeen(activeContact?.lastActivityAt).text}
                </p>
              </div>
            </div>

            {/* Right Header Tools */}
            <div className="flex items-center gap-1.5 shrink-0">
              {activeChatType === 'CHANNEL' && activeChannel && !activeChannel.isDefault && (
                <button
                  type="button"
                  onClick={() => {
                    try {
                      setSelectedMemberIds(JSON.parse(activeChannel.memberIds || '[]'));
                    } catch {
                      setSelectedMemberIds([]);
                    }
                    setShowManageMembersModal(true);
                  }}
                  className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-700 text-xs font-semibold transition-colors cursor-pointer"
                  title="Gérer les membres du salon"
                >
                  <Users size={13} />
                  <span>Membres</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleExportTranscript}
                className="p-2 rounded-xl text-slate-500 hover:text-sky-700 hover:bg-sky-50 transition-colors cursor-pointer"
                title="Exporter la discussion (.txt)"
              >
                <Download size={15} />
              </button>

              <button
                type="button"
                onClick={() => setShowInChatSearch(!showInChatSearch)}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  showInChatSearch
                    ? 'bg-sky-100 text-sky-700'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
                title="Rechercher & Filtrer"
              >
                <Search size={15} />
              </button>

              <button
                type="button"
                onClick={() => fetchMessages(false)}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Actualiser"
              >
                <RefreshCw size={15} className={isLoadingMessages ? 'animate-spin text-sky-500' : ''} />
              </button>

              <button
                type="button"
                onClick={() => setShowInspector(!showInspector)}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  showInspector
                    ? 'bg-sky-50 text-sky-700 border border-sky-200'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
                title="Panneau Contexte & Infos"
              >
                {showInspector ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />}
              </button>
            </div>
          </div>

          {/* In-Chat Search Bar */}
          {showInChatSearch && (
            <div className="px-4 py-2 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs z-10">
              <div className="flex-1 min-w-[200px] relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filtrer par mot-clé, auteur..."
                  value={inChatSearchQuery}
                  onChange={(e) => setInChatSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-7 py-1.5 bg-slate-100 rounded-xl text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-sky-400"
                />
                {inChatSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setInChatSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1 text-[11px]">
                {(['ALL', 'PRODUCTS', 'ORDERS', 'MEDIA', 'PINNED'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setChatFilter(f)}
                    className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer ${
                      chatFilter === f ? 'bg-sky-600 text-white' : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {f === 'ALL'
                      ? 'Tous'
                      : f === 'PRODUCTS'
                      ? 'Parfums'
                      : f === 'ORDERS'
                      ? 'Commandes'
                      : f === 'MEDIA'
                      ? 'Médias'
                      : 'Épinglés'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pinned Banner */}
          {pinnedMessages.length > 0 && (
            <div className="px-4 py-2 bg-sky-50/90 border-b border-sky-200 flex items-center justify-between gap-2 text-xs shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <Pin size={13} className="text-sky-600 shrink-0" />
                <span className="font-bold text-sky-800 shrink-0">Épinglé :</span>
                <span className="text-slate-700 truncate">
                  {stripReplyPrefix(pinnedMessages[pinnedMessages.length - 1].content).body}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowInspector(true);
                  setInspectorTab('PINNED');
                }}
                className="text-[11px] font-bold text-sky-700 hover:underline shrink-0 cursor-pointer"
              >
                Voir tout ({pinnedMessages.length})
              </button>
            </div>
          )}

          {/* ── 2.1 MESSAGES FEED STREAM ────────────────────────────── */}
          <div
            className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 z-0 custom-scrollbar"
            style={{
              backgroundImage: 'radial-gradient(rgba(14, 165, 233, 0.08) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          >
            {/* Centered Date Pill */}
            <div className="flex justify-center my-1">
              <span className="bg-white border border-slate-200 text-slate-500 text-[10px] px-3 py-1 rounded-full uppercase tracking-wider font-bold shadow-2xs">
                Aujourd&apos;hui • Espace Sécurisé NAY
              </span>
            </div>

            {isLoadingMessages && messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs gap-2">
                <RefreshCw size={16} className="animate-spin text-sky-500" />
                <span>Chargement des échanges...</span>
              </div>
            ) : displayedMessages.length === 0 ? (
              /* Creative Ops Launchpad Empty State */
              <div className="py-8 max-w-xl mx-auto space-y-5 animate-in fade-in">
                <div className="bg-white border border-slate-200 rounded-3xl p-6 text-center shadow-xs space-y-3">
                  <div className={`w-14 h-14 rounded-2xl ${activeVisual.solid} text-white flex items-center justify-center mx-auto shadow-md`}>
                    <ActiveChannelIcon size={24} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Bienvenue dans {activeChatType === 'CHANNEL' ? `#${activeChannel?.name}` : activeContact?.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                      Lancez la discussion en 1 clic ci-dessous ou insérez directement une fiche parfum (<span className="font-mono font-bold text-sky-600">#</span>), une commande COD (<span className="font-mono font-bold text-indigo-600">$</span>) ou un collègue (<span className="font-mono font-bold text-slate-700">@</span>).
                    </p>
                  </div>

                  {/* Quick Ops Action Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCatalogModal(true)}
                      className="p-3 rounded-2xl bg-sky-50 hover:bg-sky-100 border border-sky-200/80 text-sky-700 text-left transition-all cursor-pointer"
                    >
                      <Store size={16} className="mb-1.5" />
                      <div className="text-[11px] font-bold">Parfum ({allProducts.length})</div>
                      <div className="text-[10px] text-sky-600/80">Fiche produit</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMentionMenu({ type: 'ORDER', query: '' })}
                      className="p-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 text-indigo-700 text-left transition-all cursor-pointer"
                    >
                      <ShoppingBag size={16} className="mb-1.5" />
                      <div className="text-[11px] font-bold">Commande ($)</div>
                      <div className="text-[10px] text-indigo-600/80">Suivi client</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowTemplatesMenu(true)}
                      className="p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200/80 text-amber-800 text-left transition-all cursor-pointer"
                    >
                      <Zap size={16} className="mb-1.5" />
                      <div className="text-[11px] font-bold">Modèles</div>
                      <div className="text-[10px] text-amber-700/80">Réponses rapides</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => openCreateTaskFromMessage()}
                      className="p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 text-emerald-700 text-left transition-all cursor-pointer"
                    >
                      <CheckSquare size={16} className="mb-1.5" />
                      <div className="text-[11px] font-bold">Mission</div>
                      <div className="text-[10px] text-emerald-600/80">Créer tâche</div>
                    </button>
                  </div>
                </div>

                {/* Conversation Starters */}
                <div className="space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">
                    Démarrages Rapides du Canal
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {currentStarters.map((starter, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setMessageInput(starter.prompt);
                          inputRef.current?.focus();
                        }}
                        className="p-3 rounded-2xl bg-white hover:bg-sky-50/70 border border-slate-200 hover:border-sky-300 text-left transition-all shadow-2xs cursor-pointer"
                      >
                        <div className="text-xs font-bold text-slate-900">{starter.title}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{starter.prompt}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              displayedMessages.map((msg) => {
                const isMe = msg.senderId === currentUser?.id;
                const attachments = parseAttachments(msg.attachments);
                const visibleReactions = parseVisibleReactions(msg.reactions);
                const pinned = isMessagePinned(msg.reactions);
                const parsedBody = stripReplyPrefix(msg.content);

                return (
                  <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'} group/msg`}>
                    {/* Incoming Avatar */}
                    {!isMe && (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] text-white text-[10px] font-bold flex items-center justify-center shrink-0 overflow-hidden shadow-2xs mb-1">
                        {msg.senderAvatar || msg.sender?.avatar ? (
                          <img
                            src={msg.senderAvatar || msg.sender?.avatar || ''}
                            alt={msg.senderName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{msg.senderName.slice(0, 2).toUpperCase()}</span>
                        )}
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div
                      className={`relative max-w-md sm:max-w-lg p-3.5 rounded-2xl shadow-2xs transition-all ${
                        pinned ? 'ring-2 ring-amber-300/80' : ''
                      } ${
                        isMe
                          ? 'bg-gradient-to-br from-[#e0f2fe] to-[#bae6fd]/70 text-slate-900 rounded-br-xs border border-sky-200'
                          : 'bg-white text-slate-900 rounded-bl-xs border border-slate-200'
                      }`}
                    >
                      {pinned && (
                        <div className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded mb-1.5">
                          <Pin size={10} />
                          <span>Message épinglé</span>
                        </div>
                      )}

                      {!isMe && activeChatType === 'CHANNEL' && (
                        <p className="text-[11px] font-extrabold text-sky-700 mb-1">
                          {msg.senderName}
                        </p>
                      )}

                      {/* Quoted Reply Box */}
                      {parsedBody.replyName && (
                        <div className="mb-2 pl-2.5 py-1 pr-2 rounded-lg bg-slate-900/5 border-l-3 border-sky-500 text-[11px]">
                          <div className="font-bold text-sky-700">↩ {parsedBody.replyName}</div>
                          <div className="text-slate-600 truncate">{parsedBody.replySnippet}</div>
                        </div>
                      )}

                      {/* Content (Text + Product/Order Tokens) */}
                      {parsedBody.body && <RenderMessageContent content={parsedBody.body} isMe={isMe} />}

                      {/* Attachments */}
                      {attachments.length > 0 && (
                        <div className="mt-2 space-y-1.5">
                          {attachments.map((att, i) => {
                            if (att.type === 'AUDIO') {
                              return <ChatAudioPlayer key={i} src={att.url} duration={att.duration} isMe={isMe} />;
                            }
                            if (att.type === 'VIDEO') {
                              return <ChatVideoPlayer key={i} src={att.url} name={att.name} />;
                            }
                            if (att.type === 'PDF') {
                              return <ChatPdfViewer key={i} url={att.url} name={att.name} size={att.size} isMe={isMe} />;
                            }
                            return (
                              <div key={i} className="rounded-xl overflow-hidden max-h-72 border border-slate-200">
                                <img src={att.url} alt={att.name || 'Photo'} className="w-full h-full object-cover" />
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Timestamp & Double Ticks */}
                      <div className="flex items-center justify-end gap-1 text-[10px] text-slate-500 mt-1.5 select-none font-mono">
                        <span>{formatCompactTime(msg.createdAt)}</span>
                        {renderSkyTicks(msg, isMe)}
                      </div>

                      {/* Rich Hover Action Toolbar */}
                      <div
                        className={`absolute -top-3 opacity-0 group-hover/msg:opacity-100 pointer-events-none group-hover/msg:pointer-events-auto transition-opacity flex items-center gap-0.5 px-1.5 py-1 bg-white rounded-full shadow-lg border border-slate-200 z-20 ${
                          isMe ? 'right-1' : 'left-1'
                        }`}
                      >
                        {QUICK_REACTION_EMOJIS.slice(0, 4).map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleToggleReaction(msg.id, emoji)}
                            className="w-5 h-5 rounded-full hover:bg-slate-100 flex items-center justify-center text-xs transition-transform hover:scale-125 cursor-pointer"
                          >
                            {emoji}
                          </button>
                        ))}
                        <span className="w-px h-3.5 bg-slate-200 mx-0.5" />
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingTo({
                              id: msg.id,
                              senderName: msg.senderName,
                              snippet: parsedBody.body || 'Pièce jointe',
                            });
                            inputRef.current?.focus();
                          }}
                          className="p-1 text-slate-500 hover:text-sky-600 cursor-pointer"
                          title="Répondre"
                        >
                          <Reply size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTogglePin(msg.id)}
                          className={`p-1 cursor-pointer ${pinned ? 'text-amber-600' : 'text-slate-500 hover:text-amber-600'}`}
                          title={pinned ? 'Désépingler' : 'Épingler'}
                        >
                          {pinned ? <PinOff size={12} /> : <Pin size={12} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => openCreateTaskFromMessage(msg)}
                          className="p-1 text-slate-500 hover:text-emerald-600 cursor-pointer"
                          title="Convertir en Mission"
                        >
                          <CheckSquare size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(msg.id, msg.content)}
                          className="p-1 text-slate-500 hover:text-slate-800 cursor-pointer"
                          title="Copier"
                        >
                          {copiedMessageId === msg.id ? <Check size={12} className="text-sky-500" /> : <Copy size={12} />}
                        </button>
                        {(isMe || currentUser?.role === 'OWNER' || currentUser?.role === 'CO_OWNER') && (
                          <button
                            type="button"
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                            title="Supprimer"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>

                      {/* Emoji Reactions Badge */}
                      <MessageReactionsRow
                        reactions={visibleReactions}
                        currentUserId={currentUser?.id}
                        onToggleReaction={(emoji) => handleToggleReaction(msg.id, emoji)}
                      />
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ── 3. ELEVATED COMPOSER DOCK ─────────────────────────────── */}
          <div className="p-3 bg-white border-t border-slate-200 z-10 shrink-0 space-y-2 relative">
            {/* Reply Preview Banner */}
            {replyingTo && (
              <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-sky-50 border border-sky-200 rounded-xl text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <Reply size={13} className="text-sky-600 shrink-0" />
                  <span className="font-bold text-sky-800 shrink-0">Réponse à {replyingTo.senderName} :</span>
                  <span className="text-slate-600 truncate">{replyingTo.snippet}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X size={13} />
                </button>
              </div>
            )}

            {/* Quick-Insert Chips Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => setShowCatalogModal(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 font-semibold shrink-0 cursor-pointer"
              >
                <Hash size={11} />
                <span>Parfum ({allProducts.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setMentionMenu({ type: 'ORDER', query: '' })}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold shrink-0 cursor-pointer"
              >
                <ShoppingBag size={11} />
                <span>Commande ($)</span>
              </button>
              <button
                type="button"
                onClick={() => setMentionMenu({ type: 'MEMBER', query: '' })}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-semibold shrink-0 cursor-pointer"
              >
                <AtSign size={11} />
                <span>Mentionner</span>
              </button>
              <button
                type="button"
                onClick={() => setShowTemplatesMenu(!showTemplatesMenu)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-semibold shrink-0 cursor-pointer"
              >
                <Zap size={11} />
                <span>Modèles</span>
              </button>
              <button
                type="button"
                onClick={() => openCreateTaskFromMessage()}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold shrink-0 cursor-pointer"
              >
                <CheckSquare size={11} />
                <span>Nouvelle Mission</span>
              </button>
            </div>

            {/* Inline Autocomplete (Mentions, Perfumes, Orders) */}
            {mentionMenu.type && (
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden max-h-56 overflow-y-auto">
                <div className="p-2.5 bg-sky-50 text-[11px] font-bold text-sky-900 flex items-center justify-between border-b border-sky-100">
                  <span>
                    {mentionMenu.type === 'MEMBER' && 'Mentionner un collaborateur (@)'}
                    {mentionMenu.type === 'PRODUCT' && `💎 Parfums (${allProducts.length} disponibles)`}
                    {mentionMenu.type === 'ORDER' && `📦 Commandes Récentes (${allOrders.length})`}
                  </span>
                  <button type="button" onClick={() => setMentionMenu({ type: null, query: '' })}>
                    <X size={12} />
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  {mentionMenu.type === 'MEMBER' &&
                    allTeamMembers
                      .filter((m) => m.name.toLowerCase().includes(mentionMenu.query))
                      .map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => insertMemberMention(m)}
                          className="w-full p-2.5 hover:bg-sky-50/50 flex items-center justify-between text-xs text-left cursor-pointer"
                        >
                          <span className="font-semibold text-slate-800">@{m.name}</span>
                          <span className="text-[10px] text-slate-400">{m.jobTitle || m.role}</span>
                        </button>
                      ))}

                  {mentionMenu.type === 'PRODUCT' &&
                    allProducts
                      .filter(
                        (p) =>
                          p.name.toLowerCase().includes(mentionMenu.query) ||
                          p.brand.toLowerCase().includes(mentionMenu.query)
                      )
                      .slice(0, 30)
                      .map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => insertProductMention(p)}
                          className="w-full p-2.5 hover:bg-sky-50/60 flex items-center justify-between text-xs text-left transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center p-0.5">
                              {p.image ? (
                                <img src={p.image} alt={p.name} className="w-full h-full object-contain" />
                              ) : (
                                <Package size={14} className="text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 truncate">{p.name}</p>
                              <p className="text-[10px] text-slate-500">
                                {p.brand} • <strong className="text-sky-600 font-bold">{p.price} MAD</strong>
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full shrink-0 border border-sky-200">
                            Insérer
                          </span>
                        </button>
                      ))}

                  {mentionMenu.type === 'ORDER' &&
                    allOrders
                      .filter(
                        (o) =>
                          o.orderNumber.toLowerCase().includes(mentionMenu.query) ||
                          o.customerName.toLowerCase().includes(mentionMenu.query)
                      )
                      .slice(0, 25)
                      .map((o) => (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() => insertOrderMention(o)}
                          className="w-full p-2.5 hover:bg-sky-50/50 flex items-center justify-between text-xs text-left cursor-pointer"
                        >
                          <div>
                            <span className="font-bold text-slate-900">#{o.orderNumber}</span>
                            <span className="text-[10px] text-slate-400 ml-2">{o.customerName}</span>
                          </div>
                          <span className="text-xs font-bold text-sky-600">{o.total} MAD</span>
                        </button>
                      ))}
                </div>
              </div>
            )}

            {/* Pending Attachments List */}
            {(pendingAttachments.length > 0 || isUploadingAttachment) && (
              <div className="flex flex-wrap items-center gap-1.5">
                {pendingAttachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 px-3 py-1 bg-sky-50 rounded-xl text-xs border border-sky-200 shadow-2xs"
                  >
                    {att.type === 'PDF' && <FileText size={13} className="text-rose-500" />}
                    {att.type === 'VIDEO' && <Film size={13} className="text-purple-500" />}
                    {att.type === 'AUDIO' && <Mic size={13} className="text-sky-500" />}
                    {att.type === 'IMAGE' && <ImageIcon size={13} className="text-sky-500" />}
                    <span className="truncate max-w-[140px] text-[11px] font-medium">{att.name || att.type}</span>
                    <button
                      type="button"
                      onClick={() => setPendingAttachments((prev) => prev.filter((_, i) => i !== idx))}
                      className="p-0.5 text-slate-400 hover:text-slate-700"
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
                {isUploadingAttachment && (
                  <span className="text-[11px] text-sky-600 font-semibold flex items-center gap-1">
                    <RefreshCw size={11} className="animate-spin" /> Envoi fichier...
                  </span>
                )}
              </div>
            )}

            {/* Voice Recording Active Bar or Standard Input */}
            {isRecordingAudio ? (
              <div className="flex items-center justify-between p-2.5 bg-sky-50 border border-sky-300 rounded-2xl">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse" />
                  <span className="text-xs font-semibold text-sky-800">
                    Enregistrement vocal : {Math.floor(recordingDuration / 60)}:
                    {(recordingDuration % 60).toString().padStart(2, '0')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={cancelAudioRecording}
                    className="px-3 py-1 rounded-xl text-xs font-medium text-slate-600 hover:bg-white cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={stopAudioRecording}
                    className="px-3.5 py-1 bg-sky-600 text-white rounded-xl text-xs font-bold hover:bg-sky-700 cursor-pointer shadow-xs"
                  >
                    Terminer
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2 text-slate-500 hover:text-sky-600 transition-colors cursor-pointer"
                    title="Emojis"
                  >
                    <Smile size={20} />
                  </button>

                  {showEmojiPicker && (
                    <div className="absolute bottom-full left-0 mb-2 flex flex-wrap gap-1 p-2.5 bg-white rounded-2xl shadow-2xl border border-slate-200 w-64 z-30">
                      {EXTENDED_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            setMessageInput((prev) => prev + emoji);
                            setShowEmojiPicker(false);
                            inputRef.current?.focus();
                          }}
                          className="w-7 h-7 rounded hover:bg-slate-100 flex items-center justify-center text-sm cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowAttachMenu(!showAttachMenu)}
                    className="p-2 text-slate-500 hover:text-sky-600 transition-colors cursor-pointer"
                    title="Joindre un fichier ou média"
                  >
                    <Paperclip size={20} />
                  </button>

                  {showAttachMenu && (
                    <div className="absolute bottom-full left-0 mb-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 space-y-1 text-xs z-30">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAttachMenu(false);
                          setShowCatalogModal(true);
                        }}
                        className="w-full p-2 rounded-xl hover:bg-sky-50 flex items-center gap-2.5 text-left font-bold text-sky-600 cursor-pointer"
                      >
                        <Store size={16} />
                        <span>Catalogue ({allProducts.length} Parfums)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => triggerUpload('.pdf,application/pdf')}
                        className="w-full p-2 rounded-xl hover:bg-slate-50 flex items-center gap-2.5 text-left font-medium cursor-pointer"
                      >
                        <FileText size={16} className="text-rose-500" />
                        <span>Document PDF</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => triggerUpload('video/*,.mp4,.webm,.mov')}
                        className="w-full p-2 rounded-xl hover:bg-slate-50 flex items-center gap-2.5 text-left font-medium cursor-pointer"
                      >
                        <Film size={16} className="text-purple-500" />
                        <span>Vidéo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => triggerUpload('image/*')}
                        className="w-full p-2 rounded-xl hover:bg-slate-50 flex items-center gap-2.5 text-left font-medium cursor-pointer"
                      >
                        <ImageIcon size={16} className="text-sky-500" />
                        <span>Photos &amp; Médias</span>
                      </button>
                    </div>
                  )}
                </div>

                {showTemplatesMenu && (
                  <div className="absolute bottom-full left-12 mb-2 w-76 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 space-y-1 text-xs z-30">
                    <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase flex items-center justify-between">
                      <span>Réponses Rapides NAY</span>
                      <button type="button" onClick={() => setShowTemplatesMenu(false)}>
                        <X size={12} />
                      </button>
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
                        className="w-full text-left p-2 rounded-xl hover:bg-sky-50 cursor-pointer"
                      >
                        <p className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{tmpl.icon}</span>
                          <span>{tmpl.label}</span>
                        </p>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">{tmpl.text}</p>
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder={
                      activeChatType === 'CHANNEL'
                        ? `Écrire dans #${activeChannel?.name || 'Canal'} (# parfum, $ commande, @ membre)...`
                        : `Écrire à ${activeContact?.name || 'Collaborateur'}...`
                    }
                    value={messageInput}
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 border border-transparent focus:border-sky-400 focus:bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors"
                  />
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                {messageInput.trim() || pendingAttachments.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => handleSendMessage()}
                    disabled={isSending}
                    className="w-10 h-10 rounded-full bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] hover:from-[#0284c7] hover:to-[#0369a1] text-white flex items-center justify-center shadow-md transition-transform hover:scale-105 cursor-pointer shrink-0"
                    title="Envoyer"
                  >
                    {isSending ? <RefreshCw size={15} className="animate-spin" /> : <Send size={15} className="ml-0.5" />}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startAudioRecording}
                    className="w-10 h-10 rounded-full bg-slate-100 hover:bg-sky-500 hover:text-white text-slate-500 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    title="Enregistrer un vocal"
                  >
                    <Mic size={17} />
                  </button>
                )}
              </div>
            )}
          </div>
        </main>

        {/* ── 3. RIGHT CONTEXT & OPS INSPECTOR SIDEBAR ───────────────── */}
        {showInspector && (
          <aside className="hidden lg:flex w-72 xl:w-80 border-l border-slate-200 bg-slate-50/70 flex-col shrink-0">
            {/* Inspector Tabs */}
            <div className="p-2.5 bg-white border-b border-slate-200 grid grid-cols-3 gap-1 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setInspectorTab('OVERVIEW')}
                className={`py-1.5 rounded-lg cursor-pointer transition-all ${
                  inspectorTab === 'OVERVIEW'
                    ? 'bg-sky-50 text-sky-700 font-bold border border-sky-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Aperçu
              </button>
              <button
                type="button"
                onClick={() => setInspectorTab('SHARED')}
                className={`py-1.5 rounded-lg cursor-pointer transition-all ${
                  inspectorTab === 'SHARED'
                    ? 'bg-sky-50 text-sky-700 font-bold border border-sky-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Partages ({sharedArtifacts.products.length + sharedArtifacts.orders.length + sharedArtifacts.files.length})
              </button>
              <button
                type="button"
                onClick={() => setInspectorTab('PINNED')}
                className={`py-1.5 rounded-lg cursor-pointer transition-all ${
                  inspectorTab === 'PINNED'
                    ? 'bg-sky-50 text-sky-700 font-bold border border-sky-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Épinglés ({pinnedMessages.length})
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {inspectorTab === 'OVERVIEW' && (
                <>
                  {/* Context Profile Box */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-xl text-white flex items-center justify-center shrink-0 overflow-hidden ${
                          activeChatType === 'CHANNEL'
                            ? activeVisual.solid
                            : 'bg-gradient-to-br from-[#0ea5e9] to-[#0284c7]'
                        }`}
                      >
                        {activeChatType === 'CHANNEL' ? (
                          <ActiveChannelIcon size={20} />
                        ) : activeContact?.avatar ? (
                          <img src={activeContact.avatar} alt={activeContact.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-bold text-sm">{(activeContact?.name || '@').slice(0, 2).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-extrabold text-slate-900 truncate">
                          {activeChatType === 'CHANNEL' ? activeChannel?.name : activeContact?.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 truncate">
                          {activeChatType === 'CHANNEL' ? `${activeChannel?.memberCount || 0} membres` : activeContact?.jobTitle || activeContact?.role}
                        </p>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                      {activeChatType === 'CHANNEL'
                        ? activeChannel?.description
                        : `Email : ${activeContact?.email || '—'}`}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-2">
                        <div className="text-sm font-extrabold text-slate-900 tabular-nums">{messages.length}</div>
                        <div className="text-[10px] text-slate-500">Messages</div>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-2">
                        <div className="text-sm font-extrabold text-sky-700 tabular-nums">
                          {sharedArtifacts.products.length + sharedArtifacts.orders.length}
                        </div>
                        <div className="text-[10px] text-slate-500">Fiches liées</div>
                      </div>
                    </div>
                  </div>

                  {/* Active Roster in Channel */}
                  {activeChatType === 'CHANNEL' && activeChannel?.members && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5 shadow-2xs">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Participants ({activeChannel.members.length})
                      </div>
                      <div className="space-y-2">
                        {activeChannel.members.map((m) => {
                          const isMe = m.id === currentUser?.id;
                          const online = isMe || isUserOnline(m.lastActivityAt);
                          return (
                            <div key={m.id} className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="relative w-7 h-7 rounded-full bg-sky-100 text-sky-700 font-bold text-[10px] flex items-center justify-center overflow-hidden shrink-0">
                                  {m.avatar ? (
                                    <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <span>{m.name.slice(0, 2).toUpperCase()}</span>
                                  )}
                                  <span
                                    className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white ${
                                      online ? 'bg-emerald-500' : 'bg-slate-300'
                                    }`}
                                  />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-semibold text-slate-800 truncate">
                                    {m.name} {isMe && <span className="text-[10px] text-sky-600">(Vous)</span>}
                                  </div>
                                  <div className="text-[10px] text-slate-400 truncate">{m.role}</div>
                                </div>
                              </div>
                              {!isMe && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveChatType('DIRECT');
                                    setActiveId(m.id);
                                  }}
                                  className="text-[10px] font-semibold text-sky-600 hover:underline shrink-0 cursor-pointer"
                                >
                                  Direct
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Quick Ops Navigation */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-2xs">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Raccourcis NAY OS
                    </div>
                    <Link
                      href="/admin/orders"
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-sky-50 text-xs font-semibold text-slate-700 hover:text-sky-700 transition-colors"
                    >
                      <span>Commandes &amp; COD</span>
                      <ExternalLink size={12} />
                    </Link>
                    <Link
                      href="/admin/tasks"
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-sky-50 text-xs font-semibold text-slate-700 hover:text-sky-700 transition-colors"
                    >
                      <span>Missions &amp; Tâches</span>
                      <ExternalLink size={12} />
                    </Link>
                    <Link
                      href="/admin/inventory"
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-sky-50 text-xs font-semibold text-slate-700 hover:text-sky-700 transition-colors"
                    >
                      <span>Inventaire &amp; Stock</span>
                      <ExternalLink size={12} />
                    </Link>
                  </div>
                </>
              )}

              {inspectorTab === 'SHARED' && (
                <div className="space-y-3">
                  {sharedArtifacts.products.length === 0 &&
                  sharedArtifacts.orders.length === 0 &&
                  sharedArtifacts.files.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center text-xs text-slate-500">
                      Aucun parfum, commande ou fichier partagé dans cette conversation.
                    </div>
                  ) : (
                    <>
                      {sharedArtifacts.products.length > 0 && (
                        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-2">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Parfums Cités ({sharedArtifacts.products.length})
                          </div>
                          {sharedArtifacts.products.map((p) => (
                            <Link
                              key={p.id}
                              href={`/products/${p.slug}`}
                              target="_blank"
                              className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 hover:bg-sky-50 text-xs"
                            >
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 truncate">{p.name}</div>
                                <div className="text-[10px] text-sky-600 font-semibold">{p.price} MAD</div>
                              </div>
                              <ExternalLink size={12} className="text-slate-400 shrink-0" />
                            </Link>
                          ))}
                        </div>
                      )}

                      {sharedArtifacts.orders.length > 0 && (
                        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-2">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Commandes Liées ({sharedArtifacts.orders.length})
                          </div>
                          {sharedArtifacts.orders.map((o) => (
                            <Link
                              key={o.id}
                              href={`/admin/orders?highlight=${o.id}&orderNumber=${encodeURIComponent(o.number)}`}
                              className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 hover:bg-indigo-50 text-xs"
                            >
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900">#{o.number}</div>
                                <div className="text-[10px] text-slate-500 truncate">
                                  {o.client} • {o.total} MAD
                                </div>
                              </div>
                              <ExternalLink size={12} className="text-slate-400 shrink-0" />
                            </Link>
                          ))}
                        </div>
                      )}

                      {sharedArtifacts.files.length > 0 && (
                        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-2">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Médias &amp; Fichiers ({sharedArtifacts.files.length})
                          </div>
                          {sharedArtifacts.files.map((f, i) => (
                            <a
                              key={`${f.msgId}-${i}`}
                              href={f.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 hover:bg-sky-50 text-xs"
                            >
                              <span className="font-semibold text-slate-800 truncate">{f.name || f.type}</span>
                              <span className="text-[10px] font-mono text-slate-400 shrink-0">{f.type}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {inspectorTab === 'PINNED' && (
                <div className="space-y-2.5">
                  {pinnedMessages.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center text-xs text-slate-500 space-y-1">
                      <Pin size={18} className="mx-auto text-slate-300" />
                      <div className="font-semibold text-slate-700">Aucun message épinglé</div>
                      <p className="text-[11px] text-slate-400">
                        Survolez un message important et cliquez sur l&apos;icône épingle.
                      </p>
                    </div>
                  ) : (
                    pinnedMessages.map((pm) => (
                      <div key={pm.id} className="bg-white border border-amber-200 rounded-2xl p-3 space-y-1.5 shadow-2xs">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-sky-700">{pm.senderName}</span>
                          <button
                            type="button"
                            onClick={() => handleTogglePin(pm.id)}
                            className="text-slate-400 hover:text-rose-600 cursor-pointer"
                            title="Désépingler"
                          >
                            <PinOff size={12} />
                          </button>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">
                          {stripReplyPrefix(pm.content).body}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* ── 4. PRODUCT CATALOG MODAL ─────────────────────────────────── */}
      {showCatalogModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
            <div className="p-4 bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Store size={20} />
                <div>
                  <h3 className="text-sm font-extrabold">Catalogue Produits NAY Connect</h3>
                  <p className="text-[11px] text-sky-100">
                    {allProducts.length} parfums disponibles • Cliquez pour insérer la fiche interactive
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setShowCatalogModal(false)} className="p-1 text-white/80 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-3 border-b border-slate-200 bg-slate-50">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher par nom de parfum, marque ou prix..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-sky-500"
                  autoFocus
                />
                {catalogSearch && (
                  <button
                    type="button"
                    onClick={() => setCatalogSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 divide-y divide-slate-100 custom-scrollbar">
              {catalogFilteredProducts.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">Aucun parfum correspondant trouvé</div>
              ) : (
                catalogFilteredProducts.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 hover:bg-sky-50/50 rounded-xl flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center p-1">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-full h-full object-contain" />
                        ) : (
                          <Package size={18} className="text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-slate-900 truncate">{p.name}</p>
                        <p className="text-[11px] text-slate-500">{p.brand}</p>
                        <p className="text-xs font-bold text-sky-600">{p.price} MAD</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          p.stock > 0 ? 'bg-sky-50 text-sky-700' : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {p.stock > 0 ? `${p.stock} en stock` : 'Rupture'}
                      </span>

                      <button
                        type="button"
                        onClick={() => insertProductMention(p)}
                        className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                      >
                        Partager
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 text-right">
              <button
                type="button"
                onClick={() => setShowCatalogModal(false)}
                className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. CHAT -> CREATE MISSION MODAL ──────────────────────────── */}
      {taskModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <CheckSquare size={16} className="text-sky-600" />
                <span>Créer une Mission depuis NAY Chat</span>
              </h3>
              <button type="button" onClick={() => setTaskModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateTaskSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Titre de la Mission *</label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contexte / Détails</label>
                <textarea
                  rows={3}
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priorité</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500"
                  >
                    <option value="LOW">Basse</option>
                    <option value="MEDIUM">Normale</option>
                    <option value="HIGH">Haute</option>
                    <option value="URGENT">Urgente</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigner à</label>
                  <select
                    value={taskAssigneeId}
                    onChange={(e) => setTaskAssigneeId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500"
                  >
                    <option value="">Non assignée</option>
                    {allTeamMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTaskModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isCreatingTask || !taskTitle.trim()}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] text-white font-semibold cursor-pointer disabled:opacity-50"
                >
                  {isCreatingTask ? 'Création...' : 'Créer la Mission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 6. CREATE GROUP MODAL ────────────────────────────────────── */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-5 w-full max-w-md shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-extrabold text-slate-900">Créer un salon d&apos;équipe</h3>
              <button type="button" onClick={() => setShowCreateGroupModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nom du Salon *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Équipe Influenceurs & RP"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Ex: Coordination des campagnes et envois"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Membres autorisés ({selectedMemberIds.length}/{allTeamMembers.length})
                </label>
                <div className="max-h-36 overflow-y-auto p-1.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  {allTeamMembers.map((member) => {
                    const isSelected = selectedMemberIds.includes(member.id);
                    return (
                      <div
                        key={member.id}
                        onClick={() => {
                          if (isSelected) setSelectedMemberIds(selectedMemberIds.filter((id) => id !== member.id));
                          else setSelectedMemberIds([...selectedMemberIds, member.id]);
                        }}
                        className={`flex items-center justify-between p-1.5 rounded-lg cursor-pointer text-xs ${
                          isSelected ? 'bg-sky-50 font-semibold text-sky-900' : 'hover:bg-slate-100'
                        }`}
                      >
                        <span>{member.name}</span>
                        {isSelected && <Check size={12} className="text-sky-600" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateGroupModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!newGroupName.trim() || isSavingGroup}
                  className="px-4 py-1.5 bg-sky-600 text-white text-xs font-bold rounded-xl hover:bg-sky-700 cursor-pointer"
                >
                  {isSavingGroup ? 'Création...' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 7. MANAGE GROUP MEMBERS MODAL ──────────────────────────── */}
      {showManageMembersModal && activeChannel && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-5 w-full max-w-md shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-extrabold text-slate-900">Membres : #{activeChannel.name}</h3>
              <button type="button" onClick={() => setShowManageMembersModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={15} />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Membres actifs ({selectedMemberIds.length})
              </label>

              <div className="max-h-48 overflow-y-auto p-1.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                {allTeamMembers.map((member) => {
                  const isSelected = selectedMemberIds.includes(member.id);
                  return (
                    <div
                      key={member.id}
                      onClick={() => {
                        if (isSelected) setSelectedMemberIds(selectedMemberIds.filter((id) => id !== member.id));
                        else setSelectedMemberIds([...selectedMemberIds, member.id]);
                      }}
                      className={`flex items-center justify-between p-1.5 rounded-lg cursor-pointer text-xs ${
                        isSelected ? 'bg-sky-50 font-semibold text-sky-900' : 'hover:bg-slate-100'
                      }`}
                    >
                      <span>{member.name}</span>
                      {isSelected && <Check size={12} className="text-sky-600" />}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              {!activeChannel.isDefault && activeChannel.dbId ? (
                <button
                  type="button"
                  onClick={() => handleDeleteGroup(activeChannel.dbId!)}
                  className="px-2.5 py-1 text-rose-600 text-xs font-semibold hover:bg-rose-50 rounded-lg cursor-pointer"
                >
                  Supprimer
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowManageMembersModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Fermer
                </button>
                <button
                  type="button"
                  onClick={handleUpdateGroupMembers}
                  disabled={isSavingGroup}
                  className="px-4 py-1.5 bg-sky-600 text-white text-xs font-bold rounded-xl hover:bg-sky-700 cursor-pointer"
                >
                  {isSavingGroup ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── CUSTOM AUDIO VOICE NOTE PLAYER ───────────────────────────────────
function ChatAudioPlayer({ src, duration, isMe }: { src: string; duration?: number; isMe: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;

    audio.onloadedmetadata = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setTotalDuration(Math.round(audio.duration));
      }
    };
    audio.ontimeupdate = () => setCurrentTime(Math.round(audio.currentTime));
    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const cyclePlaybackRate = () => {
    if (!audioRef.current) return;
    const nextRate = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    audioRef.current.playbackRate = nextRate;
    setPlaybackRate(nextRate);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPct = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div
      className={`p-2.5 rounded-xl flex items-center gap-2.5 my-1 min-w-[220px] max-w-xs ${
        isMe ? 'bg-black/5' : 'bg-slate-100'
      }`}
    >
      <button
        type="button"
        onClick={togglePlay}
        className="w-8 h-8 rounded-full bg-sky-600 text-white flex items-center justify-center shrink-0 cursor-pointer shadow-xs"
      >
        {isPlaying ? <Pause size={13} /> : <Play size={13} className="ml-0.5" />}
      </button>

      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-0.5 h-4 overflow-hidden">
          {[40, 75, 55, 90, 60, 85, 45, 95, 70, 50, 80, 65, 90, 75, 40, 85].map((h, i) => {
            const barProgress = (i / 16) * 100;
            const isFilled = progressPct >= barProgress;
            return (
              <span
                key={i}
                style={{ height: `${h}%` }}
                className={`w-1 rounded-full ${isFilled ? 'bg-sky-600' : 'bg-slate-300'}`}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(totalDuration)}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={cyclePlaybackRate}
        className="px-1.5 py-0.5 rounded text-[10px] font-bold border border-slate-300 text-slate-700 cursor-pointer"
      >
        {playbackRate}x
      </button>
    </div>
  );
}

// ── VIDEO PLAYER ─────────────────────────────────────────────────────
function ChatVideoPlayer({ src, name }: { src: string; name?: string }) {
  return (
    <div className="my-1.5 rounded-xl overflow-hidden border border-slate-200 bg-black max-w-sm">
      <video src={src} controls playsInline className="w-full max-h-72 object-contain bg-black" />
      {name && (
        <div className="px-2 py-1 bg-slate-900 text-white text-[10px] flex items-center gap-1.5 truncate">
          <Film size={12} className="text-slate-400 shrink-0" />
          <span className="truncate">{name}</span>
        </div>
      )}
    </div>
  );
}

// ── PDF VIEWER ───────────────────────────────────────────────────────
function ChatPdfViewer({ url, name, size, isMe }: { url: string; name?: string; size?: number; isMe: boolean }) {
  const formattedSize = size
    ? size > 1024 * 1024
      ? `${(size / (1024 * 1024)).toFixed(1)} Mo`
      : `${Math.round(size / 1024)} Ko`
    : '';

  return (
    <div
      className={`my-1.5 p-2.5 rounded-xl border flex items-center justify-between gap-2.5 text-xs max-w-xs ${
        isMe ? 'bg-white/70 border-sky-200' : 'bg-white border-slate-200'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold shrink-0">
          <FileText size={16} />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-xs truncate leading-tight">{name || 'Document.pdf'}</p>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <span>PDF</span>
            {formattedSize && <span>• {formattedSize}</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-2.5 py-1 rounded-md bg-sky-600 text-white font-medium text-[10px] shadow-2xs hover:bg-sky-700"
        >
          Ouvrir
        </a>
        <a href={url} download={name || 'document.pdf'} className="p-1 rounded-md hover:bg-slate-100 text-slate-500" title="Télécharger">
          <Download size={12} />
        </a>
      </div>
    </div>
  );
}

// ── EMOJI REACTIONS ROW ──────────────────────────────────────────────
function MessageReactionsRow({
  reactions,
  currentUserId,
  onToggleReaction,
}: {
  reactions: ChatReaction[];
  currentUserId?: string;
  onToggleReaction: (emoji: string) => void;
}) {
  if (reactions.length === 0) return null;

  const grouped: Record<string, { count: number; users: string[]; hasReacted: boolean }> = {};
  reactions.forEach((r) => {
    if (!grouped[r.emoji]) {
      grouped[r.emoji] = { count: 0, users: [], hasReacted: false };
    }
    grouped[r.emoji].count += 1;
    grouped[r.emoji].users.push(r.userName);
    if (r.userId === currentUserId) {
      grouped[r.emoji].hasReacted = true;
    }
  });

  return (
    <div className="flex flex-wrap items-center gap-1 -mb-1 mt-1.5">
      {Object.entries(grouped).map(([emoji, data]) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onToggleReaction(emoji)}
          className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-medium border shadow-2xs transition-colors cursor-pointer ${
            data.hasReacted ? 'bg-sky-50 border-sky-300 text-sky-900' : 'bg-white border-slate-200 text-slate-700'
          }`}
          title={data.users.join(', ')}
        >
          <span>{emoji}</span>
          <span>{data.count}</span>
        </button>
      ))}
    </div>
  );
}

// ── RICH MESSAGE CONTENT PARSER ──────────────────────────────────────
function RenderMessageContent({ content, isMe }: { content: string; isMe: boolean }) {
  if (!content) return null;

  const tokens = content.split(/(#\[product:[^\]]+\]|#\[order:[^\]]+\]|@[a-zA-Z0-9_\u00C0-\u017F]+)/g);

  return (
    <div className="whitespace-pre-wrap leading-relaxed text-[13px]">
      {tokens.map((token, idx) => {
        if (token.startsWith('#[product:')) {
          const match = token.match(/#\[product:(\d+):([^:]+):([^:]+):([^:]+):([^\]]+)\]/);
          if (match) {
            const [, , name, price, brand, slug] = match;
            return (
              <div
                key={idx}
                className="my-2 p-2.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between gap-3 text-slate-900"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 shrink-0 border border-sky-200 flex items-center justify-center">
                    <Sparkles size={16} className="text-sky-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-xs truncate leading-tight text-slate-900">{name}</p>
                    <p className="text-[10px] text-slate-500">
                      {brand} • <strong className="text-sky-600 font-bold">{price} MAD</strong>
                    </p>
                  </div>
                </div>

                <Link
                  href={`/products/${slug}`}
                  target="_blank"
                  className="px-2.5 py-1 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-[10px] font-bold shrink-0 shadow-2xs transition-colors"
                >
                  Voir fiche
                </Link>
              </div>
            );
          }
        }

        if (token.startsWith('#[order:')) {
          const match = token.match(/#\[order:([^:]+):([^:]+):([^:]+):([^:]+):([^\]]+)\]/);
          if (match) {
            const [, id, number, client, total, status] = match;
            return (
              <div
                key={idx}
                className="my-2 p-2.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between gap-3 text-slate-900"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                    <ShoppingBag size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-xs truncate leading-tight">Commande #{number}</p>
                      <span className="text-[9px] font-bold px-1.5 rounded bg-indigo-100 text-indigo-700">{status}</span>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      {client} • <strong className="text-slate-900">{total} MAD</strong>
                    </p>
                  </div>
                </div>

                <Link
                  href={`/admin/orders?highlight=${id}&orderNumber=${encodeURIComponent(number)}`}
                  className="px-2.5 py-1 rounded-xl bg-indigo-600 text-white text-[10px] font-bold shrink-0 shadow-2xs hover:bg-indigo-700"
                >
                  Gérer
                </Link>
              </div>
            );
          }
        }

        if (token.startsWith('@')) {
          const clean = token.slice(1).replace(/_/g, ' ');
          return (
            <span
              key={idx}
              className={`font-semibold px-1.5 py-0.2 rounded-md ${
                isMe ? 'bg-sky-600/15 text-sky-900' : 'bg-sky-100 text-sky-700'
              }`}
            >
              @{clean}
            </span>
          );
        }

        return <span key={idx}>{token}</span>;
      })}
    </div>
  );
}
