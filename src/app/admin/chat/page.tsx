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
  Pin, 
  Eye, 
  Zap, 
  Crown, 
  Copy, 
  Mic, 
  Play, 
  Pause, 
  FileText, 
  Download, 
  Film, 
  Image as ImageIcon,
  MoreHorizontal
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
  {
    icon: '✅',
    label: 'Validation Commande',
    text: '✅ Commande vérifiée par téléphone et transmise au livreur pour expédition.',
  },
  {
    icon: '📦',
    label: 'Réassort Stocks',
    text: '📦 Contrôle des stocks terminé : prévoir un réassort sur cette référence.',
  },
  {
    icon: '🚨',
    label: 'Alerte Rupture',
    text: '🚨 Attention : stock critique signalé sur ce parfum.',
  },
  {
    icon: '🎯',
    label: 'Objectif Atteint',
    text: '🎯 Objectif quotidien de commandes dépassé ! Bravo à toute l\'équipe.',
  },
  {
    icon: '📞',
    label: 'Confirmation Client',
    text: '📞 Client joint par téléphone : adresse confirmée, livraison en cours.',
  },
  {
    icon: '💎',
    label: 'Traitement VIP',
    text: '💎 Client VIP récurrent : joindre un échantillon 5ml de prestige.',
  },
];

// ── ATTACHMENT PARSER ────────────────────────────────────────────────
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

// ── REACTIONS PARSER ─────────────────────────────────────────────────
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

  // In-channel search & filter
  const [showInChatSearch, setShowInChatSearch] = useState(false);
  const [inChatSearchQuery, setInChatSearchQuery] = useState('');
  const [chatFilter, setChatFilter] = useState<'ALL' | 'MEDIA' | 'PRODUCTS' | 'ORDERS'>('ALL');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // Sidebar Filter (Tous / Salons / Directs)
  const [sidebarTab, setSidebarTab] = useState<'ALL' | 'CHANNELS' | 'DIRECT'>('ALL');

  // Group Modals
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showManageMembersModal, setShowManageMembersModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [isSavingGroup, setIsSavingGroup] = useState(false);

  // Mentionables
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

  // Real-time Polling
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

  // Clean up recording timer
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

      // Try uploading to /api/admin/upload
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

      // Fallback to base64 DataURL
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

    // Server PATCH
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

  // Handle Input Changes & Mentions
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
          color: 'slate',
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

  // Read Receipts
  const renderReadReceipt = (msg: ChatMessage, isMe: boolean) => {
    if (activeChatType === 'DIRECT') {
      if (!isMe) return null;
      if (msg.isRead) {
        return (
          <div className="flex items-center gap-1 text-[10px] text-sky-500 font-medium justify-end">
            <CheckCheck size={12} className="stroke-[2.5]" />
            <span>Vu</span>
          </div>
        );
      }
      return (
        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium justify-end">
          <Check size={11} />
          <span>Envoyé</span>
        </div>
      );
    }

    if (isMe) {
      let readersCount = 0;
      try {
        if (msg.readBy) {
          const parsed = JSON.parse(msg.readBy);
          if (Array.isArray(parsed)) {
            readersCount = parsed.filter((r) => r.userId !== msg.senderId).length;
          }
        }
      } catch {}

      if (readersCount > 0) {
        return (
          <div className="flex items-center gap-1 text-[10px] text-sky-500 font-medium justify-end">
            <CheckCheck size={12} className="stroke-[2.5]" />
            <span>Lu par {readersCount}</span>
          </div>
        );
      }
      return (
        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium justify-end">
          <Check size={11} />
          <span>Envoyé</span>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="h-[calc(100vh-130px)] flex font-sans text-slate-900 dark:text-slate-100 bg-white dark:bg-[#0c1017] rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-xs overflow-hidden">
      
      {/* ── 1. LEFT SIDEBAR: CLEAN & PROFESSIONAL ─────────────────── */}
      <aside className="w-72 sm:w-80 border-r border-slate-200 dark:border-neutral-800 bg-slate-50/40 dark:bg-[#0e1420] flex flex-col shrink-0">
        
        {/* Sidebar Header */}
        <div className="p-3.5 border-b border-slate-200/80 dark:border-neutral-800 space-y-2.5 bg-white dark:bg-[#0c1017]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Discussions</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Équipe & canaux internes</p>
            </div>

            <button
              onClick={() => {
                setSelectedMemberIds(allTeamMembers.map(u => u.id));
                setShowCreateGroupModal(true);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
              title="Créer un salon"
            >
              <Plus size={12} />
              <span>Nouveau</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchContact}
              onChange={(e) => setSearchContact(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 bg-slate-100 dark:bg-[#141b29] border-0 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
            {searchContact && (
              <button
                onClick={() => setSearchContact('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={11} />
              </button>
            )}
          </div>

          {/* Clean Segment Tabs */}
          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-[#141b29] rounded-lg text-[11px] font-medium text-slate-600 dark:text-slate-400">
            <button
              onClick={() => setSidebarTab('ALL')}
              className={`flex-1 py-1 rounded-md transition-all ${
                sidebarTab === 'ALL' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setSidebarTab('CHANNELS')}
              className={`flex-1 py-1 rounded-md transition-all ${
                sidebarTab === 'CHANNELS' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              Salons ({channels.length})
            </button>
            <button
              onClick={() => setSidebarTab('DIRECT')}
              className={`flex-1 py-1 rounded-md transition-all ${
                sidebarTab === 'DIRECT' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              Directs ({contacts.length})
            </button>
          </div>
        </div>

        {/* Sidebar List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-3 custom-scrollbar">
          
          {/* CHANNELS */}
          {(sidebarTab === 'ALL' || sidebarTab === 'CHANNELS') && (
            <div className="space-y-0.5">
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Canaux ({filteredChannels.length})
              </div>

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
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`text-xs font-bold ${isActive ? 'text-amber-400 dark:text-amber-600' : 'text-slate-400'}`}>
                        #
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate leading-tight">
                          {channel.name}
                        </p>
                        <p className={`text-[10px] truncate ${isActive ? 'text-slate-300 dark:text-slate-600' : 'text-slate-400'}`}>
                          {channel.description}
                        </p>
                      </div>
                    </div>

                    {!channel.isDefault && (
                      <span className={`text-[9px] px-1.5 py-0.2 rounded ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600'
                      }`}>
                        Groupe
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* DIRECT CONTACTS */}
          {(sidebarTab === 'ALL' || sidebarTab === 'DIRECT') && (
            <div className="space-y-0.5 pt-1 border-t border-slate-200/60 dark:border-neutral-800">
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Membres ({filteredContacts.length})
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
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative shrink-0">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                        }`}>
                          {contact.avatar ? (
                            <img src={contact.avatar} alt={contact.name} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            <span>{contact.name.slice(0, 2).toUpperCase()}</span>
                          )}
                        </div>
                        <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border ${
                          isActive ? 'border-slate-900 dark:border-white' : 'border-white dark:border-[#0c1017]'
                        } ${online ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate leading-tight">
                          {contact.name}
                        </p>
                        <p className={`text-[10px] truncate ${isActive ? 'text-slate-300 dark:text-slate-600' : 'text-slate-400'}`}>
                          {contact.jobTitle || contact.role}
                        </p>
                      </div>
                    </div>

                    {(contact.unreadCount || 0) > 0 && (
                      <span className="w-4 h-4 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[9px] font-bold flex items-center justify-center shrink-0">
                        {contact.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

        </div>
      </aside>

      {/* ── 2. MAIN CONVERSATION: CLEAN & HUMAN-CRAFTED ───────────── */}
      <main className="flex-1 flex flex-col bg-white dark:bg-[#0c1017] overflow-hidden">
        
        {/* Chat Top Header */}
        <div className="px-5 py-3 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between bg-white dark:bg-[#0c1017] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {activeChatType === 'CHANNEL' ? `# ${activeChannel?.name}` : activeContact?.name}
                </h3>
                {activeChatType === 'CHANNEL' && activeChannel?.memberCount && (
                  <span className="text-[10px] text-slate-400 font-medium">
                    ({activeChannel.memberCount} membres)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {activeChatType === 'CHANNEL' 
                  ? activeChannel?.description
                  : (isUserOnline(activeContact?.lastActivityAt) ? 'En ligne' : formatLastSeen(activeContact?.lastActivityAt).text)}
              </p>
            </div>
          </div>

          {/* Header Action Tools */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowInChatSearch(!showInChatSearch)}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                showInChatSearch || inChatSearchQuery
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
              title="Rechercher dans la discussion"
            >
              <Search size={15} />
            </button>

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
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Gérer les membres"
              >
                <Users size={15} />
              </button>
            )}

            <button
              onClick={() => fetchMessages(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Actualiser"
            >
              <RefreshCw size={14} className={isLoadingMessages ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* In-Chat Search Bar */}
        {showInChatSearch && (
          <div className="px-4 py-2 bg-slate-50 dark:bg-[#111827] border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between gap-2 text-xs">
            <div className="flex-1 relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher des messages..."
                value={inChatSearchQuery}
                onChange={(e) => setInChatSearchQuery(e.target.value)}
                className="w-full pl-7 pr-6 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-neutral-700 rounded-md text-xs"
              />
              {inChatSearchQuery && (
                <button onClick={() => setInChatSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
                  <X size={11} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 text-[10px]">
              <button
                onClick={() => setChatFilter('ALL')}
                className={`px-2 py-0.5 rounded ${chatFilter === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-500'}`}
              >
                Tous
              </button>
              <button
                onClick={() => setChatFilter('MEDIA')}
                className={`px-2 py-0.5 rounded ${chatFilter === 'MEDIA' ? 'bg-slate-900 text-white' : 'text-slate-500'}`}
              >
                Fichiers
              </button>
              <button
                onClick={() => setChatFilter('PRODUCTS')}
                className={`px-2 py-0.5 rounded ${chatFilter === 'PRODUCTS' ? 'bg-slate-900 text-white' : 'text-slate-500'}`}
              >
                Parfums
              </button>
              <button
                onClick={() => setChatFilter('ORDERS')}
                className={`px-2 py-0.5 rounded ${chatFilter === 'ORDERS' ? 'bg-slate-900 text-white' : 'text-slate-500'}`}
              >
                Commandes
              </button>
            </div>

            <button onClick={() => setShowInChatSearch(false)} className="text-slate-400 hover:text-slate-600">
              <X size={13} />
            </button>
          </div>
        )}

        {/* ── 2.1 MESSAGES FEED & HUMAN-CRAFTED START OF CHANNEL ─── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/20 dark:bg-[#0a0e17] custom-scrollbar">
          
          {isLoadingMessages && messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs gap-2">
              <RefreshCw size={16} className="animate-spin" />
              <span>Chargement...</span>
            </div>
          ) : displayedMessages.length === 0 ? (
            
            /* Clean start-of-channel (Slack / Telegram style) */
            <div className="pt-12 pb-6 max-w-md mx-auto text-left space-y-3">
              <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold text-sm">
                #
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Bienvenue dans #{activeChatType === 'CHANNEL' ? activeChannel?.name : activeContact?.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {activeChatType === 'CHANNEL'
                    ? `C'est le début du salon #${activeChannel?.name}. Tous les messages et fichiers partagés ici sont synchronisés en direct avec l'équipe.`
                    : `C'est le début de votre conversation privée avec ${activeContact?.name}.`}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  onClick={() => {
                    if (allProducts.length > 0) insertProductMention(allProducts[0]);
                    else {
                      setMessageInput('# ');
                      inputRef.current?.focus();
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Sparkles size={12} className="text-amber-500" />
                  <span>Fiche Parfum</span>
                </button>

                <button
                  onClick={() => {
                    if (allOrders.length > 0) insertOrderMention(allOrders[0]);
                    else {
                      setMessageInput('$ ');
                      inputRef.current?.focus();
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ShoppingBag size={12} className="text-indigo-500" />
                  <span>Lier une Commande</span>
                </button>

                <button
                  onClick={startAudioRecording}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Mic size={12} className="text-rose-500" />
                  <span>Note Vocale</span>
                </button>

                <button
                  onClick={() => triggerUpload('.pdf,application/pdf')}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileText size={12} className="text-sky-500" />
                  <span>Joindre un PDF</span>
                </button>
              </div>
            </div>
          ) : (
            
            /* Messages Stream */
            displayedMessages.map((msg) => {
              const isMe = msg.senderId === currentUser?.id;
              const attachments = parseAttachments(msg.attachments);
              const reactions = parseReactions(msg.reactions);

              return (
                <div key={msg.id} className={`flex gap-3 group/msg ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  
                  {/* Sender Avatar */}
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center shrink-0 overflow-hidden">
                    {msg.senderAvatar ? (
                      <img src={msg.senderAvatar} alt={msg.senderName} className="w-full h-full object-cover" />
                    ) : (
                      <span>{(msg.senderName || 'NA').slice(0, 2).toUpperCase()}</span>
                    )}
                  </div>

                  {/* Bubble Container */}
                  <div className={`max-w-lg lg:max-w-xl space-y-1 ${isMe ? 'items-end' : 'items-start'}`}>
                    
                    {/* Meta info */}
                    <div className={`flex items-center gap-2 px-1 text-[11px] ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{msg.senderName}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="relative group/bubble">
                      <div className={`p-3 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                        isMe 
                          ? 'bg-slate-900 text-white rounded-tr-xs dark:bg-slate-800' 
                          : 'bg-white text-slate-900 border border-slate-200/90 rounded-tl-xs dark:bg-[#151c28] dark:text-slate-100 dark:border-neutral-700/80'
                      }`}>
                        
                        {/* Text Content */}
                        {msg.content && <RenderMessageContent content={msg.content} isMe={isMe} />}

                        {/* Attachments */}
                        {attachments.length > 0 && (
                          <div className="mt-2 space-y-2">
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
                                <div key={i} className="rounded-xl overflow-hidden border border-slate-200 dark:border-neutral-700 max-h-72">
                                  <img src={att.url} alt={att.name || 'Photo'} className="w-full h-full object-cover" />
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Hover Action Bar */}
                      <div className={`absolute top-1/2 -translate-y-1/2 hidden group-hover/bubble:flex items-center gap-0.5 p-1 bg-white dark:bg-slate-900 rounded-lg shadow-md border border-slate-200 dark:border-neutral-700 z-10 ${
                        isMe ? 'right-full mr-2' : 'left-full ml-2'
                      }`}>
                        {QUICK_REACTION_EMOJIS.slice(0, 4).map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => handleToggleReaction(msg.id, emoji)}
                            className="w-6 h-6 rounded hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-xs transition-transform hover:scale-110 cursor-pointer"
                            title={`Réagir ${emoji}`}
                          >
                            {emoji}
                          </button>
                        ))}
                        <button
                          onClick={() => handleCopyMessage(msg.id, msg.content)}
                          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700"
                          title="Copier"
                        >
                          {copiedMessageId === msg.id ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                        </button>
                      </div>
                    </div>

                    {/* Reactions Row */}
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

        {/* ── 3. COMPOSER: CLEAN UNIFIED BOX (SLACK / TELEGRAM STYLE) ── */}
        <div className="p-3 sm:p-4 border-t border-slate-200/90 dark:border-neutral-800 bg-white dark:bg-[#0c1017]">
          
          {/* Autocomplete Dropdown */}
          {mentionMenu.type && (
            <div className="mb-2 bg-white dark:bg-[#111827] rounded-xl shadow-lg border border-slate-200 dark:border-neutral-700 overflow-hidden max-h-52 overflow-y-auto animate-in fade-in slide-in-from-bottom-2">
              <div className="p-2 bg-slate-50 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center justify-between">
                <span>
                  {mentionMenu.type === 'MEMBER' && 'Mentionner un collaborateur (@)'}
                  {mentionMenu.type === 'PRODUCT' && 'Insérer un parfum (#)'}
                  {mentionMenu.type === 'ORDER' && 'Lier une commande ($)'}
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

                {mentionMenu.type === 'PRODUCT' && (
                  allProducts
                    .filter(p => p.name.toLowerCase().includes(mentionMenu.query) || p.brand.toLowerCase().includes(mentionMenu.query))
                    .slice(0, 6)
                    .map(p => (
                      <button
                        key={p.id}
                        onClick={() => insertProductMention(p)}
                        className="w-full p-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between text-xs text-left"
                      >
                        <div className="truncate">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{p.name}</span>
                          <span className="text-[10px] text-slate-400 ml-2">{p.brand}</span>
                        </div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white shrink-0">{p.price} MAD</span>
                      </button>
                    ))
                )}

                {mentionMenu.type === 'ORDER' && (
                  allOrders
                    .filter(o => o.orderNumber.toLowerCase().includes(mentionMenu.query) || o.customerName.toLowerCase().includes(mentionMenu.query))
                    .slice(0, 6)
                    .map(o => (
                      <button
                        key={o.id}
                        onClick={() => insertOrderMention(o)}
                        className="w-full p-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between text-xs text-left"
                      >
                        <div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">#{o.orderNumber}</span>
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
                <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
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
            <div className="flex items-center justify-between p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl">
              <div className="flex items-center gap-2.5">
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
                  className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700"
                >
                  Terminer
                </button>
              </div>
            </div>
          ) : (
            
            /* Clean Unified Composer Box */
            <div className="border border-slate-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-[#111827] focus-within:border-slate-400 transition-all">
              
              {/* Text Field */}
              <input
                ref={inputRef}
                type="text"
                placeholder={
                  activeChatType === 'CHANNEL'
                    ? `Écrire dans #${activeChannel?.name || 'Canal'}...`
                    : `Écrire à ${activeContact?.name}...`
                }
                value={messageInput}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="w-full px-3.5 pt-2.5 pb-2 text-xs font-normal text-slate-900 dark:text-white placeholder:text-slate-400 bg-transparent border-0 focus:outline-none"
              />

              {/* Action Toolbar */}
              <div className="px-2 pb-2 flex items-center justify-between gap-1 text-slate-500">
                <div className="flex items-center gap-0.5">
                  
                  {/* Attach File Button */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowAttachMenu(!showAttachMenu)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                      title="Joindre un fichier"
                    >
                      <Paperclip size={15} />
                    </button>

                    {showAttachMenu && (
                      <div className="absolute bottom-full left-0 mb-1.5 w-44 bg-white dark:bg-[#111827] rounded-xl shadow-xl border border-slate-200 dark:border-neutral-700 p-1 space-y-0.5 text-xs z-30">
                        <button
                          type="button"
                          onClick={() => triggerUpload('.pdf,application/pdf')}
                          className="w-full p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 text-left"
                        >
                          <FileText size={14} className="text-rose-500" />
                          <span>Document PDF</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => triggerUpload('video/*,.mp4,.webm,.mov')}
                          className="w-full p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 text-left"
                        >
                          <Film size={14} className="text-purple-500" />
                          <span>Vidéo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => triggerUpload('image/*')}
                          className="w-full p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 text-left"
                        >
                          <ImageIcon size={14} className="text-sky-500" />
                          <span>Photo</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Mic Voice Record */}
                  <button
                    type="button"
                    onClick={startAudioRecording}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Enregistrer une note vocale"
                  >
                    <Mic size={15} />
                  </button>

                  {/* @ Mention */}
                  <button
                    type="button"
                    onClick={() => setMentionMenu({ type: 'MEMBER', query: '' })}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                    title="Mentionner (@)"
                  >
                    <AtSign size={15} />
                  </button>

                  {/* # Perfume */}
                  <button
                    type="button"
                    onClick={() => setMentionMenu({ type: 'PRODUCT', query: '' })}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                    title="Parfum (#)"
                  >
                    <Sparkles size={15} />
                  </button>

                  {/* $ Order */}
                  <button
                    type="button"
                    onClick={() => setMentionMenu({ type: 'ORDER', query: '' })}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                    title="Commande ($)"
                  >
                    <ShoppingBag size={15} />
                  </button>

                  {/* Quick Templates */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowTemplatesMenu(!showTemplatesMenu)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                      title="Modèles de messages"
                    >
                      <Zap size={15} />
                    </button>

                    {showTemplatesMenu && (
                      <div className="absolute bottom-full left-0 mb-1.5 w-72 bg-white dark:bg-[#111827] rounded-xl shadow-xl border border-slate-200 dark:border-neutral-700 p-1.5 space-y-1 text-xs z-30">
                        <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase">
                          Modèles Rapides
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
                            className="w-full text-left p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                          >
                            <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{tmpl.icon}</span>
                              <span>{tmpl.label}</span>
                            </p>
                            <p className="text-[10px] text-slate-500 truncate mt-0.5">{tmpl.text}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Emojis */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                      title="Emojis"
                    >
                      <Smile size={15} />
                    </button>

                    {showEmojiPicker && (
                      <div className="absolute bottom-full left-0 mb-1.5 flex flex-wrap gap-1 p-2 bg-white dark:bg-[#111827] rounded-xl shadow-xl border border-slate-200 dark:border-neutral-700 w-64 z-30">
                        {EXTENDED_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => {
                              setMessageInput((prev) => prev + emoji);
                              setShowEmojiPicker(false);
                              inputRef.current?.focus();
                            }}
                            className="w-7 h-7 rounded hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-sm"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Hidden Input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </div>

                {/* Send Button */}
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={(!messageInput.trim() && pendingAttachments.length === 0) || isSending}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-black dark:hover:bg-slate-100 text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
                >
                  {isSending ? (
                    <RefreshCw size={12} className="animate-spin" />
                  ) : (
                    <Send size={12} />
                  )}
                  <span>Envoyer</span>
                </button>
              </div>

            </div>
          )}

        </div>

      </main>

      {/* ── 4. CREATE GROUP MODAL ────────────────────────────────────── */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#111827] rounded-2xl p-5 w-full max-w-md shadow-xl border border-slate-200 dark:border-neutral-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-neutral-800 pb-2.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Créer un salon</h3>
              <button onClick={() => setShowCreateGroupModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nom *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Équipe Influenceurs & RP"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-neutral-700 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Ex: Coordination des campagnes et envois"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-neutral-700 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Membres ({selectedMemberIds.length}/{allTeamMembers.length})
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
                          isSelected ? 'bg-slate-200 dark:bg-slate-700 font-semibold' : 'hover:bg-slate-100'
                        }`}
                      >
                        <span>{member.name}</span>
                        {isSelected && <Check size={12} className="text-slate-900 dark:text-white" />}
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
                  className="px-3.5 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-black"
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
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
                        isSelected ? 'bg-slate-200 dark:bg-slate-700 font-semibold' : 'hover:bg-slate-100'
                      }`}
                    >
                      <span>{member.name}</span>
                      {isSelected && <Check size={12} />}
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
                  className="px-3.5 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-black"
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

// ── HUMAN-CRAFTED MINIMAL AUDIO PLAYER ───────────────────────────────
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
    <div className={`p-2.5 rounded-xl flex items-center gap-2.5 my-1.5 max-w-xs ${
      isMe ? 'bg-white/10 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
    }`}>
      <button
        onClick={togglePlay}
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 cursor-pointer ${
          isMe ? 'bg-white text-slate-900' : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
        }`}
      >
        {isPlaying ? <Pause size={12} /> : <Play size={12} className="ml-0.5" />}
      </button>

      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-0.5 h-4 overflow-hidden">
          {[40, 70, 50, 90, 60, 80, 40, 95, 65, 45, 80, 60, 90, 70, 40, 80].map((h, i) => {
            const barProgress = (i / 16) * 100;
            const isFilled = progressPct >= barProgress;
            return (
              <span
                key={i}
                style={{ height: `${h}%` }}
                className={`w-1 rounded-full ${
                  isFilled ? (isMe ? 'bg-white' : 'bg-slate-900 dark:bg-white') : (isMe ? 'bg-white/20' : 'bg-slate-300 dark:bg-slate-600')
                }`}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(totalDuration)}</span>
        </div>
      </div>

      <button
        onClick={cyclePlaybackRate}
        className={`px-1 rounded text-[10px] font-semibold border ${
          isMe ? 'border-white/20 text-white' : 'border-slate-300 dark:border-neutral-700 text-slate-600 dark:text-slate-300'
        }`}
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
      isMe ? 'bg-white/10 border-white/20 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white'
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
          className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-[10px]"
        >
          Ouvrir
        </a>
        <a
          href={url}
          download={name || 'document.pdf'}
          className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"
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
    <div className="flex flex-wrap items-center gap-1 mt-0.5">
      {Object.entries(grouped).map(([emoji, data]) => (
        <button
          key={emoji}
          onClick={() => onToggleReaction(emoji)}
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border transition-colors cursor-pointer ${
            data.hasReacted
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-900 dark:text-amber-200'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
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
    <div className="whitespace-pre-wrap leading-relaxed">
      {tokens.map((token, idx) => {
        
        // PRODUCT CARD
        if (token.startsWith('#[product:')) {
          const match = token.match(/#\[product:(\d+):([^:]+):([^:]+):([^:]+):([^\]]+)\]/);
          if (match) {
            const [, id, name, price, brand, slug] = match;
            return (
              <div 
                key={idx} 
                className="my-1.5 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-neutral-700 flex items-center justify-between gap-2.5 text-slate-900 dark:text-white"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center font-bold shrink-0">
                    <Sparkles size={13} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-xs truncate leading-tight">{name}</p>
                    <p className="text-[10px] text-slate-400">{brand} • {price} MAD</p>
                  </div>
                </div>
                
                <Link
                  href={`/products/${slug}`}
                  target="_blank"
                  className="px-2 py-1 rounded-md bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[10px] font-semibold shrink-0"
                >
                  Voir
                </Link>
              </div>
            );
          }
        }

        // ORDER CARD
        if (token.startsWith('#[order:')) {
          const match = token.match(/#\[order:([^:]+):([^:]+):([^:]+):([^:]+):([^\]]+)\]/);
          if (match) {
            const [, id, number, client, total, status] = match;
            return (
              <div 
                key={idx} 
                className="my-1.5 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-neutral-700 flex items-center justify-between gap-2.5 text-slate-900 dark:text-white"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                    <ShoppingBag size={13} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-xs truncate leading-tight">Commande #{number}</p>
                    <p className="text-[10px] text-slate-400">{client} • {total} MAD</p>
                  </div>
                </div>
                
                <Link
                  href={`/admin/orders?highlight=${id}&orderNumber=${encodeURIComponent(number)}`}
                  className="px-2 py-1 rounded-md bg-indigo-600 text-white text-[10px] font-semibold shrink-0"
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
                isMe ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
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
