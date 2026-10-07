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
  UserPlus, 
  AtSign, 
  Hash, 
  DollarSign, 
  ArrowUpRight, 
  ChevronRight, 
  MoreVertical, 
  Pin, 
  Eye, 
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
  Phone,
  Video
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
  { icon: '✅', label: 'Commande Validée', text: '✅ Commande validée par téléphone et transmise au livreur pour expédition.' },
  { icon: '📦', label: 'Contrôle Stock', text: '📦 Contrôle des stocks terminé : prévoir un réassort sur cette référence.' },
  { icon: '🚨', label: 'Alerte Rupture', text: '🚨 Attention : stock critique signalé sur ce parfum.' },
  { icon: '🎯', label: 'Objectif Atteint', text: '🎯 Objectif quotidien de commandes dépassé ! Félicitations à toute l\'équipe.' },
  { icon: '📞', label: 'Confirmation Client', text: '📞 Client joint par téléphone : adresse confirmée, livraison programmée.' },
  { icon: '💎', label: 'Cadeau VIP', text: '💎 Client VIP récurrent : insérer un échantillon 5ml de prestige dans le colis.' },
];

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
          name: type === 'PDF' ? 'Document.pdf' : type === 'AUDIO' ? 'Vocal.webm' : type === 'VIDEO' ? 'Vidéo.mp4' : 'Photo' 
        };
      }
      return item as ChatAttachment;
    });
  } catch {
    return [];
  }
}

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
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  // In-channel search
  const [showInChatSearch, setShowInChatSearch] = useState(false);
  const [inChatSearchQuery, setInChatSearchQuery] = useState('');
  const [chatFilter, setChatFilter] = useState<'ALL' | 'MEDIA' | 'PRODUCTS' | 'ORDERS'>('ALL');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // Sidebar Filter (Tous / Salons / Directs)
  const [sidebarTab, setSidebarTab] = useState<'ALL' | 'CHANNELS' | 'DIRECT'>('ALL');

  // WhatsApp Business Catalog Modal
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');

  // Group Modals
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showManageMembersModal, setShowManageMembersModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [isSavingGroup, setIsSavingGroup] = useState(false);

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

  // 1. Fetch Conversations & Mentionables (199 Products)
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
      alert('Veuillez autoriser l\'accès au microphone pour enregistrer un message vocal.');
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

    // Optimistic Update
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
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!messageInput.trim() && pendingAttachments.length === 0) || isSending) return;

    const textToSend = messageInput.trim();
    const attachmentsToSend = [...pendingAttachments];

    setMessageInput('');
    setPendingAttachments([]);
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
          color: 'teal',
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

  const handleDeleteGroup = async (dbId: string) => {
    if (!confirm('Supprimer ce salon ?')) return;

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

  const handleCopyMessage = (msgId: string, content: string) => {
    navigator.clipboard?.writeText(content);
    setCopiedMessageId(msgId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  // Active Chat Header Info
  const activeChannel = channels.find((c) => c.slug === activeId);
  const activeContact = contacts.find((c) => c.id === activeId);

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

  // Catalog Products filtered (search among all 199 products)
  const catalogFilteredProducts = useMemo(() => {
    if (!catalogSearch.trim()) return allProducts;
    const q = catalogSearch.toLowerCase();
    return allProducts.filter(p => 
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.price.toString().includes(q)
    );
  }, [allProducts, catalogSearch]);

  // Filtered Messages
  const displayedMessages = useMemo(() => {
    return messages.filter((msg) => {
      if (inChatSearchQuery.trim()) {
        const q = inChatSearchQuery.toLowerCase();
        const matchesContent = msg.content.toLowerCase().includes(q);
        const matchesSender = msg.senderName.toLowerCase().includes(q);
        if (!matchesContent && !matchesSender) return false;
      }

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

  // WhatsApp-style Double Blue Tick Checkmarks
  const renderWhatsAppTicks = (msg: ChatMessage, isMe: boolean) => {
    if (!isMe) return null;
    const isRead = msg.isRead || (activeChatType === 'CHANNEL' && msg.readBy && msg.readBy !== '[]');

    return (
      <span className="inline-flex items-center ml-1 text-[11px]" title={isRead ? 'Vu' : 'Envoyé'}>
        {isRead ? (
          <CheckCheck size={14} className="text-[#53bdeb] stroke-[2.5]" />
        ) : (
          <Check size={13} className="text-slate-400 stroke-[2]" />
        )}
      </span>
    );
  };

  return (
    <div className="h-[calc(100vh-125px)] flex font-sans text-slate-900 dark:text-slate-100 bg-[#f0f2f5] dark:bg-[#111b21] rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-md overflow-hidden">
      
      {/* ── 1. LEFT SIDEBAR: WHATSAPP BUSINESS CONVERSATIONS LIST ─── */}
      <aside className="w-80 sm:w-88 border-r border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#111b21] flex flex-col shrink-0">
        
        {/* WhatsApp Top Header */}
        <div className="p-3 bg-[#f0f2f5] dark:bg-[#202c33] border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {currentUser?.avatar ? (
                <img src={currentUser.avatar} alt="Me" className="w-full h-full object-cover rounded-full" />
              ) : (
                <span>{(currentUser?.name || 'NA').slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <div>
              <h2 className="text-xs font-bold text-[#111b21] dark:text-[#e9edef] leading-tight flex items-center gap-1.5">
                <span>NAY WhatsApp</span>
                <span className="px-1.5 py-0.2 bg-emerald-500/10 text-[#00a884] dark:text-emerald-400 font-extrabold text-[9px] rounded">PRO</span>
              </h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Hub Équipe & Salons</p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
            {/* Catalog Button in Header */}
            <button
              onClick={() => setShowCatalogModal(true)}
              className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-[#00a884] transition-colors cursor-pointer"
              title="Catalogue Parfums (199 références)"
            >
              <Store size={18} />
            </button>

            {/* New Group Button */}
            <button
              onClick={() => {
                setSelectedMemberIds(allTeamMembers.map(u => u.id));
                setShowCreateGroupModal(true);
              }}
              className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title="Nouveau salon"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        {/* WhatsApp Search Bar */}
        <div className="p-2 border-b border-slate-100 dark:border-neutral-800 space-y-2 bg-white dark:bg-[#111b21]">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher ou démarrer une discussion..."
              value={searchContact}
              onChange={(e) => setSearchContact(e.target.value)}
              className="w-full pl-9 pr-7 py-1.5 bg-[#f0f2f5] dark:bg-[#202c33] border-0 rounded-lg text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none"
            />
            {searchContact && (
              <button onClick={() => setSearchContact('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
                <X size={12} />
              </button>
            )}
          </div>

          {/* Quick Segment Tabs */}
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            <button
              onClick={() => setSidebarTab('ALL')}
              className={`px-3 py-1 rounded-full text-xs transition-colors ${
                sidebarTab === 'ALL' ? 'bg-[#e7fce8] text-[#00a884] font-bold' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Toutes
            </button>
            <button
              onClick={() => setSidebarTab('CHANNELS')}
              className={`px-3 py-1 rounded-full text-xs transition-colors ${
                sidebarTab === 'CHANNELS' ? 'bg-[#e7fce8] text-[#00a884] font-bold' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Salons ({channels.length})
            </button>
            <button
              onClick={() => setSidebarTab('DIRECT')}
              className={`px-3 py-1 rounded-full text-xs transition-colors ${
                sidebarTab === 'DIRECT' ? 'bg-[#e7fce8] text-[#00a884] font-bold' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Directs ({contacts.length})
            </button>
          </div>
        </div>

        {/* WhatsApp Conversations Feed */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-neutral-800/60 custom-scrollbar">
          
          {/* 1. CHANNELS */}
          {(sidebarTab === 'ALL' || sidebarTab === 'CHANNELS') && (
            <div>
              {filteredChannels.map((channel) => {
                const isActive = activeChatType === 'CHANNEL' && activeId === channel.slug;

                return (
                  <button
                    key={channel.slug}
                    onClick={() => {
                      setActiveChatType('CHANNEL');
                      setActiveId(channel.slug);
                      setInChatSearchQuery('');
                      setShowInChatSearch(false);
                    }}
                    className={`w-full flex items-center gap-3 p-3 text-left transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#f0f2f5] dark:bg-[#2a3942]'
                        : 'hover:bg-slate-50 dark:hover:bg-[#202c33]'
                    }`}
                  >
                    <div className="w-11 h-11 rounded-full bg-emerald-700/10 dark:bg-emerald-500/20 text-[#00a884] font-black text-sm flex items-center justify-center shrink-0 border border-emerald-500/20">
                      #
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-[#111b21] dark:text-[#e9edef] truncate">
                          {channel.name}
                        </p>
                        <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                          {channel.memberCount || 5} m.
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {channel.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* 2. DIRECT CONTACTS */}
          {(sidebarTab === 'ALL' || sidebarTab === 'DIRECT') && (
            <div>
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
                    className={`w-full flex items-center gap-3 p-3 text-left transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#f0f2f5] dark:bg-[#2a3942]'
                        : 'hover:bg-slate-50 dark:hover:bg-[#202c33]'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs flex items-center justify-center overflow-hidden">
                        {contact.avatar ? (
                          <img src={contact.avatar} alt={contact.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{contact.name.slice(0, 2).toUpperCase()}</span>
                        )}
                      </div>
                      <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-[#111b21] ${
                        online ? 'bg-[#25d366]' : 'bg-slate-300'
                      }`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-[#111b21] dark:text-[#e9edef] truncate">
                          {contact.name}
                        </p>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {online ? 'en ligne' : ''}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {contact.jobTitle || contact.role}
                        </p>
                        {(contact.unreadCount || 0) > 0 && (
                          <span className="w-4 h-4 rounded-full bg-[#25d366] text-white text-[9px] font-bold flex items-center justify-center shrink-0">
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

      {/* ── 2. MAIN ACTIVE WINDOW: WHATSAPP BUSINESS WEB LAYOUT ────── */}
      <main className="flex-1 flex flex-col bg-[#efeae2] dark:bg-[#0b141a] overflow-hidden relative">
        
        {/* Subtle WhatsApp doodle background watermark */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.035] dark:opacity-[0.025]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* WhatsApp Top Chat Header */}
        <div className="px-4 py-2.5 bg-[#f0f2f5] dark:bg-[#202c33] border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
              {activeChatType === 'CHANNEL' ? (
                <span>#</span>
              ) : activeContact?.avatar ? (
                <img src={activeContact.avatar} alt={activeContact.name} className="w-full h-full object-cover" />
              ) : (
                <span>{(activeContact?.name || '@').slice(0, 2).toUpperCase()}</span>
              )}
            </div>

            <div className="min-w-0">
              <h3 className="text-sm font-bold text-[#111b21] dark:text-[#e9edef] truncate">
                {activeChatType === 'CHANNEL' ? activeChannel?.name : activeContact?.name}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {activeChatType === 'CHANNEL' 
                  ? activeChannel?.description
                  : (isUserOnline(activeContact?.lastActivityAt) ? <span className="text-[#00a884] font-semibold">en ligne</span> : formatLastSeen(activeContact?.lastActivityAt).text)}
              </p>
            </div>
          </div>

          {/* Right Header Tools (WhatsApp Business Catalogue Signature Button) */}
          <div className="flex items-center gap-1.5 shrink-0">
            
            {/* Open Catalog Button (199 Products) */}
            <button
              onClick={() => setShowCatalogModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#e7fce8] text-[#00a884] dark:bg-emerald-950/60 dark:text-emerald-400 font-bold text-xs hover:bg-[#d0fad2] transition-colors shadow-2xs cursor-pointer"
              title="Catalogue Parfums (199 références)"
            >
              <Store size={14} />
              <span>Catalogue (199)</span>
            </button>

            {/* In-chat search */}
            <button
              onClick={() => setShowInChatSearch(!showInChatSearch)}
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                showInChatSearch ? 'bg-slate-200 dark:bg-slate-700 text-slate-900' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title="Rechercher"
            >
              <Search size={16} />
            </button>

            {/* Refresh */}
            <button
              onClick={() => fetchMessages(false)}
              className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title="Actualiser"
            >
              <RefreshCw size={15} className={isLoadingMessages ? 'animate-spin text-[#00a884]' : ''} />
            </button>
          </div>
        </div>

        {/* In-Chat Search Bar */}
        {showInChatSearch && (
          <div className="px-4 py-2 bg-white dark:bg-[#111827] border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between gap-2 text-xs z-10 animate-fadeIn">
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher dans cette discussion..."
                value={inChatSearchQuery}
                onChange={(e) => setInChatSearchQuery(e.target.value)}
                className="w-full pl-9 pr-7 py-1 bg-[#f0f2f5] dark:bg-[#202c33] border-0 rounded-lg text-xs"
              />
              {inChatSearchQuery && (
                <button onClick={() => setInChatSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
                  <X size={12} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 text-[11px]">
              <button
                onClick={() => setChatFilter('ALL')}
                className={`px-2 py-0.5 rounded ${chatFilter === 'ALL' ? 'bg-[#00a884] text-white font-bold' : 'text-slate-500'}`}
              >
                Tous
              </button>
              <button
                onClick={() => setChatFilter('PRODUCTS')}
                className={`px-2 py-0.5 rounded ${chatFilter === 'PRODUCTS' ? 'bg-[#00a884] text-white font-bold' : 'text-slate-500'}`}
              >
                Parfums
              </button>
              <button
                onClick={() => setChatFilter('ORDERS')}
                className={`px-2 py-0.5 rounded ${chatFilter === 'ORDERS' ? 'bg-[#00a884] text-white font-bold' : 'text-slate-500'}`}
              >
                Commandes
              </button>
            </div>

            <button onClick={() => setShowInChatSearch(false)} className="text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          </div>
        )}

        {/* ── 2.1 MESSAGES FEED STREAM (WHATSAPP WEB CHAT STYLE) ────── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5 z-0 custom-scrollbar">
          
          {/* Centered WhatsApp Date Pill */}
          <div className="flex justify-center my-1">
            <span className="bg-white/90 dark:bg-[#182229] text-[#54656f] dark:text-[#8696a0] text-[11px] px-3 py-1 rounded-lg uppercase tracking-wider font-semibold shadow-2xs">
              Aujourd&apos;hui • Discussion Sécurisée
            </span>
          </div>

          {isLoadingMessages && messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs gap-2">
              <RefreshCw size={16} className="animate-spin text-[#00a884]" />
              <span>Chargement des messages...</span>
            </div>
          ) : displayedMessages.length === 0 ? (
            
            /* Start of WhatsApp Conversation */
            <div className="py-8 max-w-sm mx-auto text-center space-y-2.5">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-[#00a884] flex items-center justify-center mx-auto shadow-2xs">
                <Store size={22} />
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Discussion avec #{activeChatType === 'CHANNEL' ? activeChannel?.name : activeContact?.name}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Les messages et appels sont chiffrés. Mentionnez un parfum (#) ou ouvrez le catalogue de 199 références pour partager une fiche.
              </p>
              <button
                onClick={() => setShowCatalogModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#00a884] hover:bg-[#06cf9c] text-white text-xs font-bold transition-all shadow-xs cursor-pointer mt-2"
              >
                <Store size={14} />
                <span>Ouvrir le Catalogue (199 Parfums)</span>
              </button>
            </div>
          ) : (
            
            /* WhatsApp Messages List */
            displayedMessages.map((msg) => {
              const isMe = msg.senderId === currentUser?.id;
              const attachments = parseAttachments(msg.attachments);
              const reactions = parseReactions(msg.reactions);

              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group/msg my-1`}>
                  
                  {/* WhatsApp Message Bubble */}
                  <div className={`relative max-w-md sm:max-w-lg p-2.5 rounded-2xl shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] ${
                    isMe 
                      ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef] rounded-tr-xs' 
                      : 'bg-white dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef] rounded-tl-xs'
                  }`}>
                    
                    {/* Sender name for channel group messages */}
                    {!isMe && activeChatType === 'CHANNEL' && (
                      <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 mb-0.5">
                        {msg.senderName}
                      </p>
                    )}

                    {/* Content (Text + Tokens) */}
                    {msg.content && <RenderMessageContent content={msg.content} isMe={isMe} />}

                    {/* Attachments */}
                    {attachments.length > 0 && (
                      <div className="mt-2 space-y-1.5">
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
                          return (
                            <div key={i} className="rounded-xl overflow-hidden max-h-72">
                              <img src={att.url} alt={att.name || 'Photo'} className="w-full h-full object-cover" />
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* WhatsApp Timestamp & Blue Double Ticks inside bubble bottom right */}
                    <div className="flex items-center justify-end gap-1 text-[10px] text-slate-500 dark:text-slate-400 mt-1 select-none font-mono">
                      <span>{new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                      {renderWhatsAppTicks(msg, isMe)}
                    </div>

                    {/* Hover Reaction Toolbar */}
                    <div className={`absolute top-0 -translate-y-1/2 hidden group-hover/msg:flex items-center gap-0.5 p-1 bg-white dark:bg-[#202c33] rounded-full shadow-md border border-slate-200 dark:border-neutral-700 z-10 ${
                      isMe ? 'right-0' : 'left-0'
                    }`}>
                      {QUICK_REACTION_EMOJIS.slice(0, 4).map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleToggleReaction(msg.id, emoji)}
                          className="w-5 h-5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-xs transition-transform hover:scale-125 cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                      <button
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        className="p-1 text-slate-400 hover:text-slate-700"
                        title="Copier"
                      >
                        {copiedMessageId === msg.id ? <Check size={11} className="text-[#00a884]" /> : <Copy size={11} />}
                      </button>
                    </div>

                    {/* Emoji Reactions Badge */}
                    <MessageReactionsRow
                      reactions={reactions}
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

        {/* ── 3. COMPOSER: WHATSAPP WEB STYLE ───────────────────────── */}
        <div className="p-2 sm:p-3 bg-[#f0f2f5] dark:bg-[#202c33] border-t border-slate-200 dark:border-neutral-800 z-10 shrink-0">
          
          {/* Inline Autocomplete (Mentions, Perfumes, Orders) */}
          {mentionMenu.type && (
            <div className="mb-2 bg-white dark:bg-[#111827] rounded-xl shadow-xl border border-slate-200 dark:border-neutral-700 overflow-hidden max-h-60 overflow-y-auto animate-in fade-in slide-in-from-bottom-2">
              <div className="p-2 bg-slate-50 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between">
                <span>
                  {mentionMenu.type === 'MEMBER' && 'Mentionner un collaborateur (@)'}
                  {mentionMenu.type === 'PRODUCT' && `💎 Parfums (${allProducts.length} disponibles) - Tapez pour filtrer`}
                  {mentionMenu.type === 'ORDER' && `📦 Commandes Récentes (${allOrders.length})`}
                </span>
                <button onClick={() => setMentionMenu({ type: null, query: '' })}>
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
                        className="w-full p-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between text-xs text-left"
                      >
                        <span className="font-semibold text-slate-800 dark:text-slate-200">@{m.name}</span>
                        <span className="text-[10px] text-slate-400">{m.jobTitle || m.role}</span>
                      </button>
                    ))
                )}

                {/* ALL 199 PRODUCTS AVAILABLE TO MENTION */}
                {mentionMenu.type === 'PRODUCT' && (
                  allProducts
                    .filter(p => p.name.toLowerCase().includes(mentionMenu.query) || p.brand.toLowerCase().includes(mentionMenu.query))
                    .map(p => (
                      <button
                        key={p.id}
                        onClick={() => insertProductMention(p)}
                        className="w-full p-2.5 hover:bg-emerald-50/50 dark:hover:bg-slate-800 flex items-center justify-between text-xs text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center p-0.5">
                            {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-contain" /> : <Package size={14} className="text-slate-400" />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white truncate">{p.name}</p>
                            <p className="text-[10px] text-slate-500">{p.brand} • <strong className="text-emerald-600 font-bold">{p.price} MAD</strong></p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-[#00a884] bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">
                          Insérer
                        </span>
                      </button>
                    ))
                )}

                {mentionMenu.type === 'ORDER' && (
                  allOrders
                    .filter(o => o.orderNumber.toLowerCase().includes(mentionMenu.query) || o.customerName.toLowerCase().includes(mentionMenu.query))
                    .map(o => (
                      <button
                        key={o.id}
                        onClick={() => insertOrderMention(o)}
                        className="w-full p-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between text-xs text-left"
                      >
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white">#{o.orderNumber}</span>
                          <span className="text-[10px] text-slate-400 ml-2">{o.customerName}</span>
                        </div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{o.total} MAD</span>
                      </button>
                    ))
                )}
              </div>
            </div>
          )}

          {/* Pending Attachments List */}
          {pendingAttachments.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {pendingAttachments.map((att, idx) => (
                <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-800 rounded-lg text-xs shadow-2xs">
                  {att.type === 'PDF' && <FileText size={13} className="text-rose-500" />}
                  {att.type === 'VIDEO' && <Film size={13} className="text-purple-500" />}
                  {att.type === 'AUDIO' && <Mic size={13} className="text-amber-500" />}
                  {att.type === 'IMAGE' && <ImageIcon size={13} className="text-sky-500" />}
                  <span className="truncate max-w-[140px] text-[11px] font-medium">{att.name || att.type}</span>
                  <button
                    onClick={() => setPendingAttachments(prev => prev.filter((_, i) => i !== idx))}
                    className="p-0.5 text-slate-400 hover:text-slate-700"
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Voice Recording Active Bar */}
          {isRecordingAudio ? (
            <div className="flex items-center justify-between p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-xs font-semibold text-rose-700 dark:text-rose-300">
                  Enregistrement vocal : {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={cancelAudioRecording}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 hover:bg-white"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={stopAudioRecording}
                  className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 cursor-pointer"
                >
                  Terminer
                </button>
              </div>
            </div>
          ) : (
            
            /* WhatsApp Input Bar */
            <div className="flex items-center gap-2">
              
              {/* Left Emojis Trigger */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer"
                  title="Emojis"
                >
                  <Smile size={20} />
                </button>

                {showEmojiPicker && (
                  <div className="absolute bottom-full left-0 mb-2 flex flex-wrap gap-1 p-2.5 bg-white dark:bg-[#111827] rounded-2xl shadow-2xl border border-slate-200 dark:border-neutral-700 w-64 z-30">
                    {EXTENDED_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => {
                          setMessageInput((prev) => prev + emoji);
                          setShowEmojiPicker(false);
                          inputRef.current?.focus();
                        }}
                        className="w-7 h-7 rounded hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-sm cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* WhatsApp Plus / Attach Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowAttachMenu(!showAttachMenu)}
                  className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer"
                  title="Joindre un élément"
                >
                  <Paperclip size={20} />
                </button>

                {showAttachMenu && (
                  <div className="absolute bottom-full left-0 mb-2 w-56 bg-white dark:bg-[#111827] rounded-2xl shadow-2xl border border-slate-200 dark:border-neutral-700 p-2 space-y-1 text-xs z-30 animate-in fade-in zoom-in-95">
                    
                    {/* Catalog item */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowAttachMenu(false);
                        setShowCatalogModal(true);
                      }}
                      className="w-full p-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-slate-800 flex items-center gap-2.5 text-left font-bold text-emerald-700 dark:text-emerald-400"
                    >
                      <Store size={16} />
                      <span>Catalogue (199 Parfums)</span>
                    </button>

                    {/* PDF item */}
                    <button
                      type="button"
                      onClick={() => triggerUpload('.pdf,application/pdf')}
                      className="w-full p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 text-left font-medium"
                    >
                      <FileText size={16} className="text-rose-500" />
                      <span>Document PDF</span>
                    </button>

                    {/* Video item */}
                    <button
                      type="button"
                      onClick={() => triggerUpload('video/*,.mp4,.webm,.mov')}
                      className="w-full p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 text-left font-medium"
                    >
                      <Film size={16} className="text-purple-500" />
                      <span>Vidéo</span>
                    </button>

                    {/* Image item */}
                    <button
                      type="button"
                      onClick={() => triggerUpload('image/*')}
                      className="w-full p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 text-left font-medium"
                    >
                      <ImageIcon size={16} className="text-sky-500" />
                      <span>Photos & Médias</span>
                    </button>

                    {/* Order item */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowAttachMenu(false);
                        setMentionMenu({ type: 'ORDER', query: '' });
                      }}
                      className="w-full p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 text-left font-medium"
                    >
                      <ShoppingBag size={16} className="text-indigo-500" />
                      <span>Lier Commande ($)</span>
                    </button>

                    {/* Templates item */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowAttachMenu(false);
                        setShowTemplatesMenu(true);
                      }}
                      className="w-full p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 text-left font-medium border-t border-slate-100 dark:border-neutral-800 pt-1.5"
                    >
                      <Zap size={16} className="text-amber-500" />
                      <span>Réponses Rapides</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Template Popover */}
              {showTemplatesMenu && (
                <div className="absolute bottom-full left-12 mb-2 w-72 bg-white dark:bg-[#111827] rounded-2xl shadow-2xl border border-slate-200 dark:border-neutral-700 p-2 space-y-1 text-xs z-30 animate-in fade-in zoom-in-95">
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase">
                    Réponses Rapides Officielles
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
                      className="w-full text-left p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{tmpl.icon}</span>
                        <span>{tmpl.label}</span>
                      </p>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">{tmpl.text}</p>
                    </button>
                  ))}
                </div>
              )}

              {/* Main Pill Input Field */}
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={
                    activeChatType === 'CHANNEL'
                      ? `Tapez un message dans #${activeChannel?.name || 'Canal'} (tapez # pour les 199 parfums)...`
                      : `Tapez un message à ${activeContact?.name}...`
                  }
                  value={messageInput}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#2a3942] text-xs font-normal text-[#111b21] dark:text-[#e9edef] placeholder:text-slate-500 border-0 focus:outline-none shadow-2xs"
                />
              </div>

              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                className="hidden"
              />

              {/* Right Action: Send Button (WhatsApp Circular Green Button) or Mic */}
              {messageInput.trim() || pendingAttachments.length > 0 ? (
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={isSending}
                  className="w-10 h-10 rounded-full bg-[#00a884] hover:bg-[#06cf9c] text-white flex items-center justify-center shadow-md transition-transform hover:scale-105 cursor-pointer shrink-0"
                  title="Envoyer"
                >
                  {isSending ? (
                    <RefreshCw size={15} className="animate-spin" />
                  ) : (
                    <Send size={15} className="ml-0.5" />
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startAudioRecording}
                  className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-[#00a884] hover:text-white text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  title="Enregistrer un vocal"
                >
                  <Mic size={17} />
                </button>
              )}

            </div>
          )}

        </div>

      </main>

      {/* ── 4. WHATSAPP BUSINESS FULL CATALOG MODAL (ALL 199 PERFUMES) ── */}
      {showCatalogModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-[#111827] rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 dark:border-neutral-800 overflow-hidden animate-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="p-4 bg-[#00a884] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Store size={20} />
                <div>
                  <h3 className="text-sm font-bold">Catalogue Produits NAY</h3>
                  <p className="text-[11px] text-emerald-100">
                    {allProducts.length} parfums disponibles • Cliquez pour partager dans la discussion
                  </p>
                </div>
              </div>
              <button onClick={() => setShowCatalogModal(false)} className="p-1 text-white/80 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {/* Search Bar in Catalog */}
            <div className="p-3 border-b border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-slate-900">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher par nom de parfum, marque ou prix..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-white dark:bg-[#161f30] border border-slate-200 dark:border-neutral-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  autoFocus
                />
                {catalogSearch && (
                  <button onClick={() => setCatalogSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Products List (All 199 products) */}
            <div className="flex-1 overflow-y-auto p-3 divide-y divide-slate-100 dark:divide-neutral-800 custom-scrollbar">
              {catalogFilteredProducts.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Aucun parfum correspondant trouvé
                </div>
              ) : (
                catalogFilteredProducts.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl flex items-center justify-between gap-3 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-neutral-700 flex items-center justify-center p-1">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-full h-full object-contain" />
                        ) : (
                          <Package size={18} className="text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-slate-900 dark:text-white truncate">{p.name}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{p.brand}</p>
                        <p className="text-xs font-bold text-[#00a884]">{p.price} MAD</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        p.stock > 0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {p.stock > 0 ? `${p.stock} en stock` : 'Rupture'}
                      </span>

                      <button
                        type="button"
                        onClick={() => insertProductMention(p)}
                        className="px-3 py-1.5 rounded-xl bg-[#00a884] hover:bg-[#06cf9c] text-white font-bold text-xs shadow-xs transition-transform hover:scale-105 cursor-pointer"
                      >
                        Partager
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-neutral-800 text-right">
              <button
                type="button"
                onClick={() => setShowCatalogModal(false)}
                className="px-4 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. CREATE GROUP MODAL ────────────────────────────────────── */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#111827] rounded-2xl p-5 w-full max-w-md shadow-xl border border-slate-200 dark:border-neutral-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-neutral-800 pb-2.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Créer un salon d&apos;équipe</h3>
              <button onClick={() => setShowCreateGroupModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nom du Salon *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Équipe Influenceurs & RP"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-neutral-700 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Ex: Coordination des campagnes et envois"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-neutral-700 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Membres autorisés ({selectedMemberIds.length}/{allTeamMembers.length})
                </label>
                <div className="max-h-36 overflow-y-auto p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-neutral-700 space-y-1">
                  {allTeamMembers.map((member) => {
                    const isSelected = selectedMemberIds.includes(member.id);
                    return (
                      <div
                        key={member.id}
                        onClick={() => {
                          if (isSelected) setSelectedMemberIds(selectedMemberIds.filter(id => id !== member.id));
                          else setSelectedMemberIds([...selectedMemberIds, member.id]);
                        }}
                        className={`flex items-center justify-between p-1.5 rounded-md cursor-pointer text-xs ${
                          isSelected ? 'bg-emerald-50 dark:bg-slate-700 font-semibold' : 'hover:bg-slate-100'
                        }`}
                      >
                        <span>{member.name}</span>
                        {isSelected && <Check size={12} className="text-[#00a884]" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowCreateGroupModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!newGroupName.trim() || isSavingGroup}
                  className="px-4 py-1.5 bg-[#00a884] text-white text-xs font-bold rounded-lg hover:bg-[#06cf9c]"
                >
                  {isSavingGroup ? 'Création...' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 6. MANAGE GROUP MEMBERS MODAL ──────────────────────────── */}
      {showManageMembersModal && activeChannel && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#111827] rounded-2xl p-5 w-full max-w-md shadow-xl border border-slate-200 dark:border-neutral-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-neutral-800 pb-2.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Membres : #{activeChannel.name}</h3>
              <button onClick={() => setShowManageMembersModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={15} />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Membres actifs ({selectedMemberIds.length})
              </label>

              <div className="max-h-48 overflow-y-auto p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-neutral-700 space-y-1">
                {allTeamMembers.map((member) => {
                  const isSelected = selectedMemberIds.includes(member.id);
                  return (
                    <div
                      key={member.id}
                      onClick={() => {
                        if (isSelected) setSelectedMemberIds(selectedMemberIds.filter(id => id !== member.id));
                        else setSelectedMemberIds([...selectedMemberIds, member.id]);
                      }}
                      className={`flex items-center justify-between p-1.5 rounded-md cursor-pointer text-xs ${
                        isSelected ? 'bg-emerald-50 dark:bg-slate-700 font-semibold' : 'hover:bg-slate-100'
                      }`}
                    >
                      <span>{member.name}</span>
                      {isSelected && <Check size={12} className="text-[#00a884]" />}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-neutral-800">
              {!activeChannel.isDefault && activeChannel.dbId ? (
                <button
                  onClick={() => handleDeleteGroup(activeChannel.dbId!)}
                  className="px-2 py-1 text-rose-600 text-xs font-semibold hover:bg-rose-50 rounded"
                >
                  Supprimer
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowManageMembersModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Fermer
                </button>
                <button
                  type="button"
                  onClick={handleUpdateGroupMembers}
                  disabled={isSavingGroup}
                  className="px-4 py-1.5 bg-[#00a884] text-white text-xs font-bold rounded-lg hover:bg-[#06cf9c]"
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

// ── CUSTOM WHATSAPP AUDIO VOICE NOTE PLAYER ──────────────────────────
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
    <div className={`p-2.5 rounded-xl flex items-center gap-2.5 my-1 min-w-[220px] max-w-xs ${
      isMe ? 'bg-black/5 dark:bg-white/10' : 'bg-slate-100 dark:bg-slate-800'
    }`}>
      <button
        onClick={togglePlay}
        className="w-8 h-8 rounded-full bg-[#00a884] text-white flex items-center justify-center shrink-0 cursor-pointer shadow-xs"
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
                className={`w-1 rounded-full ${
                  isFilled ? 'bg-[#00a884]' : 'bg-slate-300 dark:bg-slate-600'
                }`}
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
        onClick={cyclePlaybackRate}
        className="px-1.5 py-0.5 rounded text-[10px] font-bold border border-slate-300 dark:border-neutral-600 text-slate-700 dark:text-slate-300"
      >
        {playbackRate}x
      </button>
    </div>
  );
}

// ── VIDEO PLAYER ─────────────────────────────────────────────────────
function ChatVideoPlayer({ src, name }: { src: string; name?: string }) {
  return (
    <div className="my-1.5 rounded-xl overflow-hidden border border-slate-200 dark:border-neutral-700 bg-black max-w-sm">
      <video
        src={src}
        controls
        playsInline
        className="w-full max-h-72 object-contain bg-black"
      />
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
  const formattedSize = size ? (size > 1024 * 1024 ? `${(size / (1024 * 1024)).toFixed(1)} Mo` : `${Math.round(size / 1024)} Ko`) : '';

  return (
    <div className={`my-1.5 p-2.5 rounded-xl border flex items-center justify-between gap-2.5 text-xs max-w-xs ${
      isMe ? 'bg-black/5 dark:bg-white/10 border-black/10' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-neutral-700'
    }`}>
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
          className="px-2 py-1 rounded-md bg-emerald-600 text-white font-medium text-[10px]"
        >
          Ouvrir
        </a>
        <a
          href={url}
          download={name || 'document.pdf'}
          className="p-1 rounded-md hover:bg-slate-100 text-slate-500"
          title="Télécharger"
        >
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
    <div className="flex flex-wrap items-center gap-1 -mb-1 mt-0.5">
      {Object.entries(grouped).map(([emoji, data]) => (
        <button
          key={emoji}
          onClick={() => onToggleReaction(emoji)}
          className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-medium border shadow-2xs transition-colors cursor-pointer ${
            data.hasReacted
              ? 'bg-[#e7fce8] border-emerald-300 text-emerald-900'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-slate-300'
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

// ── RICH MESSAGE CONTENT PARSER (WHATSAPP BUSINESS CATALOG CARDS) ───
function RenderMessageContent({ content, isMe }: { content: string; isMe: boolean }) {
  if (!content) return null;

  const tokens = content.split(/(#\[product:[^\]]+\]|#\[order:[^\]]+\]|@[a-zA-Z0-9_\u00C0-\u017F]+)/g);

  return (
    <div className="whitespace-pre-wrap leading-relaxed">
      {tokens.map((token, idx) => {
        
        // PRODUCT CARD (WHATSAPP BUSINESS PRODUCT CARD)
        if (token.startsWith('#[product:')) {
          const match = token.match(/#\[product:(\d+):([^:]+):([^:]+):([^:]+):([^\]]+)\]/);
          if (match) {
            const [, id, name, price, brand, slug] = match;
            return (
              <div 
                key={idx} 
                className="my-2 p-2.5 rounded-xl bg-white dark:bg-[#161f30] border border-slate-200 dark:border-neutral-700 shadow-xs flex items-center justify-between gap-3 text-slate-900 dark:text-white"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center p-0.5">
                    <Sparkles size={16} className="text-[#00a884]" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-xs truncate leading-tight text-slate-900 dark:text-white">{name}</p>
                    <p className="text-[10px] text-slate-500">{brand} • <strong className="text-[#00a884] font-bold">{price} MAD</strong></p>
                  </div>
                </div>
                
                <Link
                  href={`/products/${slug}`}
                  target="_blank"
                  className="px-2.5 py-1 rounded-lg bg-[#00a884] hover:bg-[#06cf9c] text-white text-[10px] font-bold shrink-0 shadow-2xs"
                >
                  Voir fiche
                </Link>
              </div>
            );
          }
        }

        // ORDER CARD (WHATSAPP BUSINESS ORDER SUMMARY)
        if (token.startsWith('#[order:')) {
          const match = token.match(/#\[order:([^:]+):([^:]+):([^:]+):([^:]+):([^\]]+)\]/);
          if (match) {
            const [, id, number, client, total, status] = match;
            return (
              <div 
                key={idx} 
                className="my-2 p-2.5 rounded-xl bg-white dark:bg-[#161f30] border border-slate-200 dark:border-neutral-700 shadow-xs flex items-center justify-between gap-3 text-slate-900 dark:text-white"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                    <ShoppingBag size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-xs truncate leading-tight">Commande #{number}</p>
                      <span className="text-[9px] font-bold px-1.5 rounded bg-indigo-100 text-indigo-700">
                        {status}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500">{client} • <strong className="text-slate-900 dark:text-white">{total} MAD</strong></p>
                  </div>
                </div>
                
                <Link
                  href={`/admin/orders?highlight=${id}&orderNumber=${encodeURIComponent(number)}`}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-[10px] font-bold shrink-0 shadow-2xs hover:bg-indigo-700"
                >
                  Gérer
                </Link>
              </div>
            );
          }
        }

        // MEMBER MENTION
        if (token.startsWith('@')) {
          const clean = token.slice(1).replace(/_/g, ' ');
          return (
            <span 
              key={idx} 
              className={`font-semibold px-1 py-0.2 rounded ${
                isMe ? 'bg-black/10 text-emerald-900 dark:bg-white/20 dark:text-white' : 'bg-emerald-100 dark:bg-emerald-950/60 text-[#00a884]'
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
