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
  SlidersHorizontal,
  Mic,
  MicOff,
  Play,
  Pause,
  Volume2,
  FileText,
  Download,
  Film,
  Heart,
  ThumbsUp
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

export interface ChatAttachment {
  url: string;
  type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'PDF';
  name?: string;
  size?: number; // bytes
  duration?: number; // seconds
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
  attachments?: string | null; // JSON string of (string | ChatAttachment)[]
  reactions?: string | null;   // JSON string of ChatReaction[]
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

// Preset definitions for executive default channels
const CHANNEL_PRESETS: Record<string, {
  tag: string;
  icon: any;
  color: string;
  badgeBg: string;
  badgeText: string;
  mission: string;
  pinnedAnnouncement: string;
}> = {
  GENERAL: {
    tag: 'HQ',
    icon: Crown,
    color: 'amber',
    badgeBg: 'bg-amber-500/10 dark:bg-amber-500/20',
    badgeText: 'text-amber-700 dark:text-amber-400 border-amber-300/40 dark:border-amber-500/30',
    mission: 'Coordination générale & vision Maison NAY Parfums',
    pinnedAnnouncement: 'Note de Direction : Priorité absolue à l\'excellence du service client et au suivi en temps réel des commandes VIP. N\'hésitez pas à taguer vos associés (@) ou à lier directement un parfum (#).',
  },
  STOCK: {
    tag: 'INVENTAIRE',
    icon: Package,
    color: 'emerald',
    badgeBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    badgeText: 'text-emerald-700 dark:text-emerald-400 border-emerald-300/40 dark:border-emerald-500/30',
    mission: 'Suivi des niveaux de flacons, concentrés et packagings de luxe',
    pinnedAnnouncement: 'Protocole Stock : Contrôle biquotidien des niveaux de flacons 50ml/100ml. Signalez immédiatement toute référence dont le stock passe sous le seuil d\'alerte.',
  },
  ORDERS: {
    tag: 'VIP SUIVI',
    icon: ShoppingBag,
    color: 'indigo',
    badgeBg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
    badgeText: 'text-indigo-700 dark:text-indigo-400 border-indigo-300/40 dark:border-indigo-500/30',
    mission: 'Surveillance des commandes prioritaires et clients fidèles',
    pinnedAnnouncement: 'Protocole VIP : Dès 2 parfums achetés (-10% automatique) ou pour toute commande > 800 MAD, joindre systématiquement un flacon testeur 5ml de prestige.',
  },
  MARKETING: {
    tag: 'ACQUISITION',
    icon: Megaphone,
    color: 'purple',
    badgeBg: 'bg-purple-500/10 dark:bg-purple-500/20',
    badgeText: 'text-purple-700 dark:text-purple-400 border-purple-300/40 dark:border-purple-500/30',
    mission: 'Optimisation de l\'acquisition, campagnes Ads et ROAS',
    pinnedAnnouncement: 'Performance Ads : Offre Duo (-10% dès 2 parfums) active sur Meta et TikTok Ads. Surveiller les taux de conversion et les retours clients quotidiens.',
  },
  LOGISTICS: {
    tag: 'LIVRAISONS',
    icon: Truck,
    color: 'sky',
    badgeBg: 'bg-sky-500/10 dark:bg-sky-500/20',
    badgeText: 'text-sky-700 dark:text-sky-400 border-sky-300/40 dark:border-sky-500/30',
    mission: 'Confirmations téléphoniques COD et suivi des transporteurs express',
    pinnedAnnouncement: 'Procédure Enlèvements : Tous les colis confirmés avant 15h30 sont expédiés le jour même. Mentionnez impérativement le numéro de bordereau dans le suivi.',
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

// ── ATTACHMENT PARSER HELPER ─────────────────────────────────────────
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
          name: type === 'PDF' ? 'Document_NAY.pdf' : type === 'AUDIO' ? 'Note_vocale.webm' : type === 'VIDEO' ? 'Vidéo.mp4' : 'Photo' 
        };
      }
      return item as ChatAttachment;
    });
  } catch {
    return [];
  }
}

// ── REACTIONS PARSER HELPER ──────────────────────────────────────────
function parseReactions(raw: string | null | undefined): ChatReaction[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
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

  // ── ATTACHMENTS STATE (Audio, Video, PDF, Image) ────────────────────
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadCategory, setActiveUploadCategory] = useState<'ALL' | 'PDF' | 'VIDEO' | 'AUDIO' | 'IMAGE'>('ALL');

  // ── AUDIO VOICE NOTE RECORDING STATE ────────────────────────────────
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Clean up recording timer on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);

  // ── VOICE RECORDER CONTROLS ──────────────────────────────────────────
  const startAudioRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('L\'enregistrement audio n\'est pas supporté par votre navigateur.');
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

        const audioFile = new File([audioBlob], `vocal_${Date.now()}.webm`, { type: 'audio/webm' });
        await handleUploadFile(audioFile, 'AUDIO');
      };

      mediaRecorder.start();
      setIsRecordingAudio(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied:', err);
      alert('Veuillez autoriser l\'accès au microphone pour enregistrer une note vocale.');
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

  // ── FILE UPLOAD (PDF, Video, Audio, Photo) ───────────────────────────
  const handleUploadFile = async (file: File, forceType?: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'PDF') => {
    setIsUploadingAttachment(true);
    try {
      let type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'PDF' = forceType || 'IMAGE';
      const name = file.name.toLowerCase();
      const mime = file.type.toLowerCase();

      if (!forceType) {
        if (mime.includes('pdf') || name.endsWith('.pdf')) {
          type = 'PDF';
        } else if (mime.startsWith('video/') || name.endsWith('.mp4') || name.endsWith('.webm') || name.endsWith('.mov')) {
          type = 'VIDEO';
        } else if (mime.startsWith('audio/') || name.endsWith('.mp3') || name.endsWith('.wav') || name.endsWith('.m4a') || name.endsWith('.ogg')) {
          type = 'AUDIO';
        } else {
          type = 'IMAGE';
        }
      }

      // 1. Try uploading to /api/admin/upload for a permanent URL
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

      // 2. Fallback to base64 DataURL if needed
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
  };

  const openFilePicker = (category: 'ALL' | 'PDF' | 'VIDEO' | 'AUDIO' | 'IMAGE') => {
    setActiveUploadCategory(category);
    if (!fileInputRef.current) return;

    if (category === 'PDF') fileInputRef.current.accept = '.pdf,application/pdf';
    else if (category === 'VIDEO') fileInputRef.current.accept = 'video/*,.mp4,.webm,.mov';
    else if (category === 'AUDIO') fileInputRef.current.accept = 'audio/*,.mp3,.wav,.m4a,.ogg';
    else if (category === 'IMAGE') fileInputRef.current.accept = 'image/*';
    else fileInputRef.current.accept = 'image/*,video/*,audio/*,.pdf';

    fileInputRef.current.click();
  };

  // ── TOGGLE EMOJI REACTION ───────────────────────────────────────────
  const handleToggleReaction = async (messageId: string, emoji: string) => {
    if (!currentUser) return;

    // 1. Optimistic Update
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg;
        const current = parseReactions(msg.reactions);
        const existingIdx = current.findIndex(
          (r) => r.userId === currentUser.id && r.emoji === emoji
        );
        let updated: ChatReaction[];
        if (existingIdx !== -1) {
          updated = current.filter((_, i) => i !== existingIdx);
        } else {
          updated = [...current, { emoji, userId: currentUser.id, userName: currentUser.name }];
        }
        return {
          ...msg,
          reactions: JSON.stringify(updated),
        };
      })
    );

    // 2. Server PATCH Request
    try {
      await fetch('/api/admin/chat/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, emoji }),
      });
    } catch (err) {
      console.error('Failed to update reaction:', err);
    }
  };

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
    if ((!messageInput.trim() && pendingAttachments.length === 0) || isSending) return;

    const textToSend = messageInput.trim();
    const attachmentsToSend = [...pendingAttachments];

    setMessageInput('');
    setPendingAttachments([]);
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
    if (!confirm('Voulez-vous vraiment supprimer ce salon de discussion ?')) return;

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
        const atts = parseAttachments(msg.attachments);
        return atts.length > 0;
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

    // Channel Read By Parsing
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
            title="Message envoyé au salon"
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
          title={`Lu par :\n${readers.map(r => `• ${r.userName}`).join('\n')}`}
        >
          <CheckCheck size={13} className="text-sky-500 dark:text-sky-400 stroke-[2.5]" />
          <span>Lu par : <strong className="font-bold text-sky-700 dark:text-sky-300">{displayText}</strong></span>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col font-sans text-slate-900 dark:text-slate-100 bg-white dark:bg-[#0c1017] rounded-3xl border border-slate-200/90 dark:border-neutral-800/80 shadow-md overflow-hidden animate-fadeIn">
      
      {/* ── TOP SLIM LUXURY STATUS BAR ────────────────────────────── */}
      <div className="px-5 py-2 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 text-xs shrink-0 select-none">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold tracking-wider text-[11px] uppercase text-amber-300">
            NAY Parfums • Hub Studio & Collaboration
          </span>
          <span className="hidden md:inline-block text-slate-500 text-[10px]">•</span>
          <span className="hidden md:inline-flex items-center gap-1 text-slate-300 text-[11px]">
            <Lock size={10} className="text-emerald-400" />
            Canal Sécurisé Interne
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span><strong>{onlineCount}</strong> en ligne</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* ── 1. LEFT SIDEBAR: HUBS, SALONS & ASSOCIÉS ──────────────── */}
        <aside className="w-80 sm:w-84 border-r border-slate-200/80 dark:border-neutral-800/80 bg-slate-50/70 dark:bg-[#0e1420] flex flex-col shrink-0">
          
          {/* Header & Quick Action */}
          <div className="p-3.5 border-b border-slate-200/70 dark:border-neutral-800/70 space-y-2.5 bg-white dark:bg-[#0c1017]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center font-bold shadow-xs">
                  <Crown size={15} />
                </div>
                <div>
                  <h2 className="text-xs font-black text-slate-900 dark:text-white tracking-wider uppercase">
                    Salons & Équipe
                  </h2>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    {channels.length} canaux • {contacts.length + 1} associés
                  </p>
                </div>
              </div>

              {/* Create Group Button */}
              <button
                onClick={() => {
                  setSelectedMemberIds(allTeamMembers.map(u => u.id));
                  setShowCreateGroupModal(true);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-black dark:hover:bg-slate-100 text-[11px] font-bold transition-all shadow-xs cursor-pointer"
                title="Créer un salon thématique"
              >
                <Plus size={11} />
                <span>Nouveau</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher salon, associé..."
                value={searchContact}
                onChange={(e) => setSearchContact(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 bg-slate-100/80 dark:bg-[#141b29] border border-slate-200/80 dark:border-neutral-700/80 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
              {searchContact && (
                <button
                  onClick={() => setSearchContact('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600"
                >
                  <X size={11} />
                </button>
              )}
            </div>

            {/* Filter Tabs (Tous / Salons / Directs) */}
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-[#141b29] rounded-xl text-[10px] font-bold">
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
          <div className="flex-1 overflow-y-auto p-2.5 space-y-3 custom-scrollbar">
            
            {/* SALONS STRATÉGIQUES */}
            {(sidebarTab === 'ALL' || sidebarTab === 'CHANNELS') && (
              <div className="space-y-1">
                <div className="flex items-center justify-between px-2 mb-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <Layers size={11} /> Salons Métier ({filteredChannels.length})
                  </span>
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
                      className={`w-full flex items-center justify-between p-2.5 rounded-2xl text-left transition-all cursor-pointer group ${
                        isActive
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                          : 'hover:bg-white dark:hover:bg-[#151c28] text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-transform group-hover:scale-105 ${
                          isActive
                            ? 'bg-amber-400 text-slate-950 font-black'
                            : preset
                              ? `bg-slate-100 dark:bg-[#182234] text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-neutral-700/80`
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}>
                          <IconComp size={15} />
                        </div>

                        <div className="min-w-0">
                          <p className={`text-xs font-bold truncate ${isActive ? 'text-white dark:text-slate-900' : 'text-slate-900 dark:text-white'}`}>
                            {channel.name}
                          </p>
                          <p className={`text-[10px] truncate ${isActive ? 'text-slate-300 dark:text-slate-600' : 'text-slate-400 dark:text-slate-500'}`}>
                            {channel.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {preset ? (
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
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
                            Pôle
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* COLLABORATEURS DIRECTS */}
            {(sidebarTab === 'ALL' || sidebarTab === 'DIRECT') && (
              <div className="space-y-1 pt-2 border-t border-slate-200/60 dark:border-neutral-800/60">
                <div className="px-2 mb-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <UserPlus size={11} /> Associés ({filteredContacts.length})
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
                      className={`w-full flex items-center justify-between p-2.5 rounded-2xl text-left transition-all cursor-pointer ${
                        isActive
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                          : 'hover:bg-white dark:hover:bg-[#151c28] text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative shrink-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
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
                          <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border-2 ${
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

                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {online && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            isActive ? 'bg-emerald-400/20 text-emerald-300' : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50'
                          }`}>
                            En ligne
                          </span>
                        )}

                        {(contact.unreadCount || 0) > 0 && (
                          <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
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
          
          {/* 2.1 Top Clean Chat Header */}
          <div className="p-3.5 border-b border-slate-200/80 dark:border-neutral-800/80 flex items-center justify-between bg-white dark:bg-[#0c1017] shadow-2xs z-10">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ${
                activeChatType === 'CHANNEL'
                  ? currentPreset
                    ? 'bg-gradient-to-br from-slate-900 to-slate-800 text-amber-300 border border-amber-500/30'
                    : 'bg-slate-900 text-white'
                  : 'bg-gradient-to-br from-indigo-600 to-sky-500 text-white'
              }`}>
                {activeChatType === 'CHANNEL' ? (
                  currentPreset?.icon ? <currentPreset.icon size={18} /> : <Hash size={18} />
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
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border uppercase tracking-wider ${currentPreset.badgeBg} ${currentPreset.badgeText}`}>
                      {currentPreset.tag}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {activeChatType === 'CHANNEL' 
                    ? (currentPreset?.mission || activeChannel?.description)
                    : (isUserOnline(activeContact?.lastActivityAt) ? '🟢 En ligne' : formatLastSeen(activeContact?.lastActivityAt).text)}
                </p>
              </div>
            </div>

            {/* Header Right Tools */}
            <div className="flex items-center gap-1.5 shrink-0">
              
              {/* Search Toggle */}
              <button
                onClick={() => setShowInChatSearch(!showInChatSearch)}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  showInChatSearch || inChatSearchQuery
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                    : 'text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Rechercher"
              >
                <Search size={15} />
              </button>

              {/* Members Manager */}
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
                  className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all cursor-pointer"
                >
                  <Users size={12} />
                  <span>Membres</span>
                </button>
              )}

              {/* Refresh Button */}
              <button
                onClick={() => fetchMessages(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Actualiser"
              >
                <RefreshCw size={14} className={isLoadingMessages ? 'animate-spin text-amber-500' : ''} />
              </button>
            </div>
          </div>

          {/* 2.2 Collapsible Search & Filter Bar */}
          {showInChatSearch && (
            <div className="p-2.5 bg-slate-50 dark:bg-[#101726] border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between gap-2.5 animate-fadeIn">
              <div className="flex-1 relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher messages, fichiers, notes..."
                  value={inChatSearchQuery}
                  onChange={(e) => setInChatSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 bg-white dark:bg-[#161f30] border border-slate-200 dark:border-neutral-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
                {inChatSearchQuery && (
                  <button
                    onClick={() => setInChatSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600"
                  >
                    <X size={11} />
                  </button>
                )}
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1 text-[10px] font-bold">
                <button
                  onClick={() => setChatFilter('ALL')}
                  className={`px-2 py-1 rounded-lg transition-all ${chatFilter === 'ALL' ? 'bg-slate-900 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                >
                  Tous
                </button>
                <button
                  onClick={() => setChatFilter('MEDIA')}
                  className={`px-2 py-1 rounded-lg transition-all ${chatFilter === 'MEDIA' ? 'bg-sky-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                >
                  📎 Fichiers
                </button>
                <button
                  onClick={() => setChatFilter('PRODUCTS')}
                  className={`px-2 py-1 rounded-lg transition-all ${chatFilter === 'PRODUCTS' ? 'bg-amber-500 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                >
                  💎 Parfums
                </button>
                <button
                  onClick={() => setChatFilter('ORDERS')}
                  className={`px-2 py-1 rounded-lg transition-all ${chatFilter === 'ORDERS' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                >
                  📦 Commandes
                </button>
              </div>

              <button
                onClick={() => {
                  setShowInChatSearch(false);
                  setInChatSearchQuery('');
                  setChatFilter('ALL');
                }}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* 2.3 Pinned Note (Clean & Compact) */}
          {activeChatType === 'CHANNEL' && currentPreset && showPinnedBanner && (
            <div className="px-4 py-2 bg-amber-500/10 dark:bg-amber-500/15 border-b border-amber-300/40 dark:border-amber-500/20 flex items-center justify-between gap-3 text-xs animate-fadeIn">
              <div className="flex items-center gap-2 min-w-0">
                <Pin size={13} className="text-amber-600 dark:text-amber-400 shrink-0" />
                <p className="text-[11px] font-medium text-amber-950 dark:text-amber-200 leading-normal truncate sm:whitespace-normal">
                  {currentPreset.pinnedAnnouncement}
                </p>
              </div>
              <button
                onClick={() => setShowPinnedBanner(false)}
                className="text-amber-700/60 dark:text-amber-400/60 hover:text-amber-900 p-0.5 shrink-0"
                title="Masquer"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {/* 2.4 Messages Stream & Simple Creative Empty State */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-slate-50/50 dark:bg-[#0a0e17] custom-scrollbar">
            {isLoadingMessages && messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
                <RefreshCw size={20} className="animate-spin text-amber-500" />
                <span>Chargement du salon...</span>
              </div>
            ) : displayedMessages.length === 0 ? (
              
              /* ── SIMPLE & CREATIVE SHOWCASE ── */
              <div className="h-full flex flex-col items-center justify-center p-4 max-w-lg mx-auto animate-fadeIn">
                <div className="w-full bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md rounded-3xl p-6 border border-slate-200/80 dark:border-neutral-800 shadow-lg text-center space-y-4">
                  
                  {/* Creative Monogram Emblem */}
                  <div className="relative inline-block">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20 mx-auto">
                      <Sparkles size={24} />
                    </div>
                  </div>

                  {/* Title & Mission */}
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      #{activeChatType === 'CHANNEL' ? activeChannel?.name : activeContact?.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                      {activeChatType === 'CHANNEL' ? currentPreset?.mission : `Canal direct et partages privés`}
                    </p>
                  </div>

                  {/* 4 Creative Quick Action Chips */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      onClick={() => {
                        if (allProducts.length > 0) insertProductMention(allProducts[0]);
                        else {
                          setMessageInput('# ');
                          inputRef.current?.focus();
                        }
                      }}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 hover:border-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-all text-left flex items-center gap-2 cursor-pointer group"
                    >
                      <Sparkles size={14} className="text-amber-500" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-amber-600 truncate">
                        Fiche Parfum
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        if (allOrders.length > 0) insertOrderMention(allOrders[0]);
                        else {
                          setMessageInput('$ ');
                          inputRef.current?.focus();
                        }
                      }}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all text-left flex items-center gap-2 cursor-pointer group"
                    >
                      <ShoppingBag size={14} className="text-indigo-500" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 truncate">
                        Commande VIP
                      </span>
                    </button>

                    <button
                      onClick={startAudioRecording}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 hover:border-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-all text-left flex items-center gap-2 cursor-pointer group"
                    >
                      <Mic size={14} className="text-rose-500" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-rose-600 truncate">
                        Note Vocale
                      </span>
                    </button>

                    <button
                      onClick={() => openFilePicker('PDF')}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 hover:border-sky-400 hover:bg-sky-50/50 dark:hover:bg-sky-950/20 transition-all text-left flex items-center gap-2 cursor-pointer group"
                    >
                      <FileText size={14} className="text-sky-500" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-sky-600 truncate">
                        Document PDF
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              
              /* ── MESSAGES FEED WITH AUDIOS, VIDEOS, PDFS, REACTIONS ── */
              displayedMessages.map((msg) => {
                const isMe = msg.senderId === currentUser?.id;
                const attachments = parseAttachments(msg.attachments);
                const reactions = parseReactions(msg.reactions);

                return (
                  <div key={msg.id} className={`flex gap-2.5 group/msg ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    
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
                      
                      {/* Sender Meta */}
                      <div className={`flex items-center gap-2 px-1 text-[11px] ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{msg.senderName}</span>
                        {isMe && (
                          <span className="text-[9px] font-extrabold uppercase px-1 py-0.2 bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded">
                            Moi
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                          {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Bubble with Embedded Rich Content */}
                      <div className="relative group/bubble">
                        <div className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs transition-all ${
                          isMe 
                            ? 'bg-slate-900 dark:bg-slate-800 text-white rounded-tr-xs border border-slate-800 dark:border-slate-700' 
                            : 'bg-white dark:bg-[#151c28] text-slate-900 dark:text-slate-100 border border-slate-200/90 dark:border-neutral-700/80 rounded-tl-xs shadow-2xs'
                        }`}>
                          
                          {/* Text Content */}
                          {msg.content && <RenderMessageContent content={msg.content} isMe={isMe} />}

                          {/* ── ATTACHMENTS (Images, Videos, Audios, PDFs) ── */}
                          {attachments.length > 0 && (
                            <div className="mt-2.5 space-y-2">
                              {attachments.map((att, i) => {
                                if (att.type === 'AUDIO') {
                                  return (
                                    <ChatAudioPlayer
                                      key={i}
                                      src={att.url}
                                      duration={att.duration}
                                      isMe={isMe}
                                    />
                                  );
                                }
                                if (att.type === 'VIDEO') {
                                  return (
                                    <ChatVideoPlayer
                                      key={i}
                                      src={att.url}
                                      name={att.name}
                                    />
                                  );
                                }
                                if (att.type === 'PDF') {
                                  return (
                                    <ChatPdfViewer
                                      key={i}
                                      url={att.url}
                                      name={att.name}
                                      size={att.size}
                                      isMe={isMe}
                                    />
                                  );
                                }
                                // IMAGE
                                return (
                                  <div key={i} className="rounded-2xl overflow-hidden border border-slate-200/80 dark:border-neutral-700 max-h-72 shadow-2xs">
                                    <img src={att.url} alt={att.name || 'Photo'} className="w-full h-full object-cover" />
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Hover Emoji Reaction Bar */}
                        <div className={`absolute top-1/2 -translate-y-1/2 hidden group-hover/bubble:flex items-center gap-0.5 p-1 bg-white dark:bg-slate-900 rounded-full shadow-xl border border-slate-200 dark:border-neutral-700 z-20 ${
                          isMe ? 'right-full mr-2' : 'left-full ml-2'
                        }`}>
                          {QUICK_REACTION_EMOJIS.slice(0, 5).map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => handleToggleReaction(msg.id, emoji)}
                              className="w-6 h-6 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-xs transition-transform hover:scale-125 cursor-pointer"
                              title={`Réagir avec ${emoji}`}
                            >
                              {emoji}
                            </button>
                          ))}
                          <button
                            onClick={() => handleCopyMessage(msg.id, msg.content)}
                            className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-800 transition-colors"
                            title="Copier le texte"
                          >
                            {copiedMessageId === msg.id ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                          </button>
                        </div>
                      </div>

                      {/* Displayed Emoji Reactions on Message */}
                      <MessageReactionsRow
                        reactions={reactions}
                        currentUserId={currentUser?.id}
                        onToggleReaction={(emoji) => handleToggleReaction(msg.id, emoji)}
                      />

                      {/* Read Receipts */}
                      {renderReadReceipt(msg, isMe)}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ── 3. RICH COMPOSER WITH AUDIO, VIDEO, PDF & TEMPLATES ───── */}
          <div className="p-3 border-t border-slate-200/90 dark:border-neutral-800/90 bg-white dark:bg-[#0c1017] relative">
            
            {/* 3.1 Mention Autocomplete Dropdown */}
            {mentionMenu.type && (
              <div className="absolute bottom-full left-4 right-4 mb-2 bg-white dark:bg-[#111827] rounded-2xl shadow-2xl border border-slate-200 dark:border-neutral-700 overflow-hidden z-30 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-bottom-2">
                <div className="p-2.5 bg-slate-50 dark:bg-[#151c28] border-b border-slate-100 dark:border-neutral-800 flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  <span>
                    {mentionMenu.type === 'MEMBER' && '👥 Mentionner un Associé (@)'}
                    {mentionMenu.type === 'PRODUCT' && '💎 Lier un Parfum (#)'}
                    {mentionMenu.type === 'ORDER' && '📦 Lier une Commande ($)'}
                  </span>
                  <button onClick={() => setMentionMenu({ type: null, query: '' })} className="p-0.5 text-slate-400 hover:text-slate-600">
                    <X size={12} />
                  </button>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-neutral-800">
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

                  {mentionMenu.type === 'PRODUCT' && (
                    allProducts
                      .filter(p => p.name.toLowerCase().includes(mentionMenu.query) || p.brand.toLowerCase().includes(mentionMenu.query))
                      .slice(0, 8)
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
                          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-lg border border-amber-200/50">
                            Insérer Fiche
                          </span>
                        </button>
                      ))
                  )}

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
                            <p className="text-[10px] text-slate-400">{o.shippingCity} • <strong className="text-indigo-600 dark:text-indigo-400">{o.total} MAD</strong></p>
                          </div>
                          <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-lg border border-indigo-200/50">
                            Lier
                          </span>
                        </button>
                      ))
                  )}
                </div>
              </div>
            )}

            {/* 3.2 Action Toolbar */}
            <div className="flex items-center gap-1.5 mb-2 overflow-x-auto pb-0.5 text-xs">
              
              {/* @ Membre */}
              <button
                type="button"
                onClick={() => setMentionMenu({ type: 'MEMBER', query: '' })}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-[11px] transition-all cursor-pointer"
              >
                <AtSign size={11} className="text-sky-500" />
                <span>Membre</span>
              </button>

              {/* 💎 Parfum */}
              <button
                type="button"
                onClick={() => setMentionMenu({ type: 'PRODUCT', query: '' })}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold text-[11px] border border-amber-300/40 transition-all cursor-pointer"
              >
                <Sparkles size={11} className="text-amber-500" />
                <span>Parfum</span>
              </button>

              {/* 📦 Commande */}
              <button
                type="button"
                onClick={() => setMentionMenu({ type: 'ORDER', query: '' })}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] border border-indigo-200/60 transition-all cursor-pointer"
              >
                <ShoppingBag size={11} className="text-indigo-500" />
                <span>Commande</span>
              </button>

              {/* 📄 PDF Document Upload */}
              <button
                type="button"
                onClick={() => openFilePicker('PDF')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-bold text-[11px] border border-rose-200/60 transition-all cursor-pointer"
                title="Joindre un PDF"
              >
                <FileText size={11} className="text-rose-500" />
                <span>PDF</span>
              </button>

              {/* 🎬 Video Upload */}
              <button
                type="button"
                onClick={() => openFilePicker('VIDEO')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 text-purple-700 dark:text-purple-300 font-bold text-[11px] border border-purple-200/60 transition-all cursor-pointer"
                title="Joindre une vidéo"
              >
                <Film size={11} className="text-purple-500" />
                <span>Vidéo</span>
              </button>

              {/* 📷 Photo Upload */}
              <button
                type="button"
                onClick={() => openFilePicker('IMAGE')}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 text-[11px] transition-all cursor-pointer"
                title="Joindre une photo"
              >
                <Paperclip size={12} />
                <span>Photo</span>
              </button>

              {/* ⚡ Modèles Rapides */}
              <button
                type="button"
                onClick={() => setShowTemplatesMenu(!showTemplatesMenu)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-[11px] transition-all cursor-pointer"
              >
                <Zap size={11} className="text-amber-500" />
                <span>Modèles</span>
                <ChevronDown size={10} />
              </button>

              {/* 😊 Emojis */}
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 text-[11px] transition-all cursor-pointer"
              >
                <Smile size={12} />
              </button>

              {/* Hidden Unified File Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>

            {/* Quick Templates Menu */}
            {showTemplatesMenu && (
              <div className="absolute bottom-full left-4 mb-2 bg-white dark:bg-[#111827] rounded-2xl shadow-2xl border border-slate-200 dark:border-neutral-700 p-2 z-30 w-80 space-y-1 animate-in fade-in zoom-in-95">
                <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-neutral-800">
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

            {/* Quick Emojis Bar */}
            {showEmojiPicker && (
              <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 dark:bg-[#131b2b] rounded-2xl mb-2 border border-slate-200 dark:border-neutral-700 animate-fadeIn">
                {EXTENDED_EMOJIS.map((emoji) => (
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

            {/* Pending Attachments Strip */}
            {pendingAttachments.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-2 p-2 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-neutral-800 animate-fadeIn">
                {pendingAttachments.map((att, idx) => (
                  <div key={idx} className="relative flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-neutral-700 text-xs">
                    {att.type === 'PDF' && <FileText size={14} className="text-rose-500" />}
                    {att.type === 'VIDEO' && <Film size={14} className="text-purple-500" />}
                    {att.type === 'AUDIO' && <Volume2 size={14} className="text-amber-500" />}
                    {att.type === 'IMAGE' && <ImageIcon size={14} className="text-sky-500" />}
                    
                    <span className="font-semibold text-slate-800 dark:text-slate-200 max-w-[120px] truncate">
                      {att.name || att.type}
                    </span>

                    <button
                      type="button"
                      onClick={() => setPendingAttachments(prev => prev.filter((_, i) => i !== idx))}
                      className="ml-1 p-0.5 rounded-full text-slate-400 hover:text-rose-500"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 3.3 Main Form Input OR Audio Recording State */}
            {isRecordingAudio ? (
              <div className="flex items-center justify-between p-2.5 bg-rose-500/10 border border-rose-300 dark:border-rose-500/30 rounded-2xl animate-fadeIn">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                      Enregistrement vocal en cours...
                    </span>
                    <span className="text-xs font-mono font-extrabold text-slate-900 dark:text-white px-2 py-0.5 bg-white dark:bg-slate-800 rounded-lg shadow-2xs">
                      {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={cancelAudioRecording}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-xs"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={stopAudioRecording}
                    className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check size={13} />
                    <span>Terminer & Joindre</span>
                  </button>
                </div>
              </div>
            ) : (
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
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#141c2c] border border-slate-200 dark:border-neutral-700/80 rounded-2xl text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all shadow-inner"
                  />
                </div>

                {/* Voice Record Mic Trigger */}
                <button
                  type="button"
                  onClick={startAudioRecording}
                  className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-300 hover:text-rose-600 transition-colors shadow-2xs cursor-pointer shrink-0"
                  title="Enregistrer un vocal"
                >
                  <Mic size={16} />
                </button>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={(!messageInput.trim() && pendingAttachments.length === 0) || isSending}
                  className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-black dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  {isSending ? (
                    <RefreshCw size={13} className="animate-spin" />
                  ) : (
                    <Send size={13} />
                  )}
                  <span className="hidden sm:inline">Envoyer</span>
                </button>
              </form>
            )}

          </div>

        </main>

      </div>

      {/* ── 4. CREATE GROUP MODAL ────────────────────────────────────── */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-slate-100 dark:border-neutral-800 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
                  <Crown size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Créer un Nouveau Salon</h3>
                  <p className="text-[11px] text-slate-500">Rassemblez l&apos;équipe autour d&apos;une mission</p>
                </div>
              </div>
              <button onClick={() => setShowCreateGroupModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nom du Salon *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Équipe Influenceurs & RP..."
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161f30] border border-slate-200 dark:border-neutral-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Objectif & Consignes</label>
                <input
                  type="text"
                  placeholder="Ex: Suivi des créatifs et validations"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161f30] border border-slate-200 dark:border-neutral-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Membres autorisés ({selectedMemberIds.length}/{allTeamMembers.length})
                </label>
                <div className="max-h-40 overflow-y-auto p-2 bg-slate-50 dark:bg-[#161f30] rounded-2xl border border-slate-200 dark:border-neutral-700 space-y-1.5 custom-scrollbar">
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
                            : 'bg-white dark:bg-[#1a2336] hover:bg-slate-100 border border-slate-200/60 dark:border-neutral-700/60'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center">
                            {member.name.slice(0, 2).toUpperCase()}
                          </div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{member.name}</p>
                        </div>
                        <div className={`w-4 h-4 rounded flex items-center justify-center ${isSelected ? 'bg-amber-500 text-white' : 'border border-slate-300'}`}>
                          {isSelected && <Check size={10} />}
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
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!newGroupName.trim() || isSavingGroup}
                  className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all disabled:opacity-40"
                >
                  {isSavingGroup ? 'Création...' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 5. MANAGE GROUP MEMBERS MODAL ──────────────────────────── */}
      {showManageMembersModal && activeChannel && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-slate-100 dark:border-neutral-800 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-neutral-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Membres du salon : #{activeChannel.name}
                </h3>
                <p className="text-[11px] text-slate-500">Gérer les accès des associés</p>
              </div>
              <button onClick={() => setShowManageMembersModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X size={15} />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Membres actifs ({selectedMemberIds.length} autorisés)
              </label>

              <div className="max-h-52 overflow-y-auto p-2 bg-slate-50 dark:bg-[#161f30] rounded-2xl border border-slate-200 dark:border-neutral-700 space-y-1.5 custom-scrollbar">
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
                          : 'bg-white dark:bg-[#1a2336] hover:bg-slate-100 border border-slate-200/60 dark:border-neutral-700/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center">
                          {member.name.slice(0, 2).toUpperCase()}
                        </div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{member.name}</p>
                      </div>

                      <div className={`w-4 h-4 rounded flex items-center justify-center ${isSelected ? 'bg-amber-500 text-white' : 'border border-slate-300'}`}>
                        {isSelected && <Check size={10} />}
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
                  className="px-3 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Trash2 size={12} />
                  <span>Supprimer</span>
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowManageMembersModal(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Fermer
                </button>
                <button
                  type="button"
                  onClick={handleUpdateGroupMembers}
                  disabled={isSavingGroup}
                  className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-xs"
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

// ── CUSTOM LUXURY AUDIO VOICE NOTE PLAYER ────────────────────────────
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

    audio.ontimeupdate = () => {
      setCurrentTime(Math.round(audio.currentTime));
    };

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
    <div className={`p-3 rounded-2xl flex items-center gap-3 my-2 max-w-sm ${
      isMe ? 'bg-white/10 text-white' : 'bg-slate-100 dark:bg-[#182234] text-slate-900 dark:text-white'
    }`}>
      <button
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-transform hover:scale-105 cursor-pointer ${
          isMe ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950'
        }`}
      >
        {isPlaying ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
      </button>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-1 h-5 overflow-hidden">
          {[40, 75, 55, 90, 60, 85, 45, 95, 70, 50, 80, 65, 90, 75, 40, 85, 60, 95, 55, 70].map((h, i) => {
            const barProgress = (i / 20) * 100;
            const isFilled = progressPct >= barProgress;
            return (
              <span
                key={i}
                style={{ height: `${h}%` }}
                className={`w-1 rounded-full transition-all ${
                  isFilled
                    ? isMe ? 'bg-amber-400' : 'bg-amber-500 dark:bg-amber-400'
                    : isMe ? 'bg-white/20' : 'bg-slate-300 dark:bg-slate-700'
                } ${isPlaying ? 'animate-pulse' : ''}`}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(totalDuration)}</span>
        </div>
      </div>

      <button
        onClick={cyclePlaybackRate}
        className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold border transition-colors ${
          isMe ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-neutral-700 text-slate-700 dark:text-slate-300'
        }`}
        title="Vitesse de lecture"
      >
        {playbackRate}x
      </button>
    </div>
  );
}

// ── CUSTOM VIDEO PLAYER ──────────────────────────────────────────────
function ChatVideoPlayer({ src, name }: { src: string; name?: string }) {
  return (
    <div className="my-2 rounded-2xl overflow-hidden border border-slate-200/90 dark:border-neutral-700 bg-black shadow-sm max-w-md">
      <video
        src={src}
        controls
        playsInline
        className="w-full max-h-80 object-contain rounded-2xl bg-black"
      />
      {name && (
        <div className="p-2 bg-slate-900/90 text-white text-[11px] flex items-center gap-1.5 truncate">
          <Film size={13} className="text-amber-400 shrink-0" />
          <span className="truncate">{name}</span>
        </div>
      )}
    </div>
  );
}

// ── CUSTOM PDF VIEWER / DOWNLOAD CARD ────────────────────────────────
function ChatPdfViewer({ url, name, size, isMe }: { url: string; name?: string; size?: number; isMe: boolean }) {
  const formattedSize = size ? (size > 1024 * 1024 ? `${(size / (1024 * 1024)).toFixed(1)} Mo` : `${Math.round(size / 1024)} Ko`) : '';

  return (
    <div className={`my-2 p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs max-w-md shadow-2xs ${
      isMe
        ? 'bg-white/10 border-white/20 text-white'
        : 'bg-white dark:bg-[#161f30] border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white'
    }`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-300/40 flex items-center justify-center font-bold shrink-0">
          <FileText size={18} />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-xs truncate">{name || 'Document_NAY.pdf'}</p>
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <span className="font-bold text-rose-500">PDF</span>
            {formattedSize && <span>• {formattedSize}</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-[10px] shadow-2xs transition-transform hover:scale-105"
        >
          <Eye size={12} />
          <span>Aperçu</span>
        </a>
        <a
          href={url}
          download={name || 'document.pdf'}
          className={`p-1.5 rounded-xl border transition-colors ${
            isMe ? 'border-white/20 hover:bg-white/10 text-white' : 'border-slate-200 dark:border-neutral-700 hover:bg-slate-100 text-slate-600 dark:text-slate-300'
          }`}
          title="Télécharger"
        >
          <Download size={13} />
        </a>
      </div>
    </div>
  );
}

// ── MESSAGE REACTIONS ROW ────────────────────────────────────────────
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
    <div className="flex flex-wrap items-center gap-1 mt-1">
      {Object.entries(grouped).map(([emoji, data]) => (
        <button
          key={emoji}
          onClick={() => onToggleReaction(emoji)}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border transition-all hover:scale-105 cursor-pointer ${
            data.hasReacted
              ? 'bg-amber-100 dark:bg-amber-950/70 border-amber-400 text-amber-900 dark:text-amber-200 shadow-2xs'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
          }`}
          title={`Réactions : ${data.users.join(', ')}`}
        >
          <span>{emoji}</span>
          <span className="text-[10px]">{data.count}</span>
        </button>
      ))}
    </div>
  );
}

// ── RICH MESSAGE CONTENT PARSER & RENDERER ──────────────────────────
function RenderMessageContent({ content, isMe }: { content: string; isMe: boolean }) {
  if (!content) return null;

  const tokens = content.split(/(#\[product:[^\]]+\]|#\[order:[^\]]+\]|@[a-zA-Z0-9_\u00C0-\u017F]+)/g);

  return (
    <div className="space-y-1.5">
      <div className="whitespace-pre-wrap leading-relaxed">
        {tokens.map((token, idx) => {
          
          // PRODUCT CARD TOKEN
          if (token.startsWith('#[product:')) {
            const match = token.match(/#\[product:(\d+):([^:]+):([^:]+):([^:]+):([^\]]+)\]/);
            if (match) {
              const [, id, name, price, brand, slug] = match;
              return (
                <div 
                  key={idx} 
                  className="my-2 p-2.5 rounded-2xl bg-white dark:bg-[#141d2c] border border-amber-300/60 dark:border-amber-500/40 shadow-xs flex items-center justify-between gap-3 text-slate-900 dark:text-white"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-300/40 flex items-center justify-center font-bold shrink-0">
                      <Sparkles size={16} />
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
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[10px] shrink-0 shadow-xs transition-transform hover:scale-105"
                  >
                    <span>Fiche</span>
                    <ArrowUpRight size={11} />
                  </Link>
                </div>
              );
            }
          }

          // ORDER CARD TOKEN
          if (token.startsWith('#[order:')) {
            const match = token.match(/#\[order:([^:]+):([^:]+):([^:]+):([^:]+):([^\]]+)\]/);
            if (match) {
              const [, id, number, client, total, status] = match;
              return (
                <div 
                  key={idx} 
                  className="my-2 p-2.5 rounded-2xl bg-white dark:bg-[#141d2c] border border-indigo-300/60 dark:border-indigo-500/40 shadow-xs flex items-center justify-between gap-3 text-slate-900 dark:text-white"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-300/40 flex items-center justify-center font-bold shrink-0">
                      <ShoppingBag size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-extrabold text-xs text-slate-900 dark:text-white truncate">#{number}</p>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                          {status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {client} • <strong className="text-slate-900 dark:text-white font-bold">{total} MAD</strong>
                      </p>
                    </div>
                  </div>
                  
                  <Link
                    href={`/admin/orders?highlight=${id}&orderNumber=${encodeURIComponent(number)}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] shrink-0 shadow-xs transition-transform hover:scale-105"
                  >
                    <span>Gérer</span>
                    <ChevronRight size={11} />
                  </Link>
                </div>
              );
            }
          }

          // MEMBER MENTION TOKEN
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
