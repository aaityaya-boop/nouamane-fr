'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useChat } from 'ai/react';
import {
  X,
  Plus,
  ArrowUp,
  Camera,
  Mic,
  MessageCircle,
  PackageCheck,
  ShieldCheck,
  Gem,
  Crown,
  Sparkles,
  CheckCircle2,
  CornerDownLeft,
  ArrowRight,
  RotateCcw,
  Volume2,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '@/context/AuthContext';

interface AttachedPhoto {
  file: File;
  previewUrl: string;
  base64: string;
  name: string;
}

export default function AIChatWidget() {
  const pathname = usePathname();
  const { customer } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [showInvitation, setShowInvitation] = useState(true);
  const [isLauncherHovered, setIsLauncherHovered] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [attachedImage, setAttachedImage] = useState<AttachedPhoto | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      let vid = localStorage.getItem('nay_vid');
      if (!vid) {
        vid = 'v_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
        localStorage.setItem('nay_vid', vid);
      }
      setSessionId(vid);

      const savedConv = sessionStorage.getItem('nay_advisor_conv_id');
      if (savedConv) {
        setConversationId(savedConv);
      }
    }
  }, []);

  const locale = pathname?.split('/')[1] || 'fr';
  const isArabic = locale === 'ar';
  const isEnglish = locale === 'en';

  const welcomeContent = isArabic
    ? "مرحباً بكم في **دار NAY Parfums** · خدمة الزبناء والكونسيرج الخاص 🏛️\n\nأنا مستشاركم ومساعدكم المعتمد. يسعدني مرافقتكم والإجابة على **كافة استفساراتكم** حول الموقع، الطلبيات، والعطور:\n\n• 📷 **البحث عن عطر بالصورة :** يمكنكم تحميل صورة أي قنينة تبحثون عنها عبر أيقونة الكاميرا بالأسفل وسنتحقق من توفرها فوراً.\n• 📦 **تتبع طلبيتكم :** المساعدة في معرفة حالة شحنتكم وتاريخ وصولها في أي مدينة بالمغرب عبر صفحة [تتبع الطلبية](/ar/suivi-commande).\n• 💎 **اختيار وتنسيق العطور :** ترشيح أفضل العطور الثابتة والفواحة من عطور التيستور (Testers) أو العلب الأصلية المختومة.\n• 🛡️ **ضمانات الشراء :** توصيل سريع 24-48 ساعة، 0 درهم تسبيق، مع **الحق الكامل في فتح الطرد ومعاينة القنينة قبل سداد المبلغ**."
    : isEnglish
    ? "Welcome to **NAY Parfums Atelier** · Customer Support & Private Concierge 🏛️\n\nI am your dedicated boutique client advisor. I am at your service to assist you with **everything on our website and boutique**:\n\n• 📷 **Search by Bottle Photo:** You can upload a photo of any perfume bottle using the camera button below to check immediate stock and pricing.\n• 📦 **Order Tracking:** Real-time updates on your shipment status via our [Order Tracking page](/en/suivi-commande).\n• 💎 **Bespoke Olfactory Advice:** Tailored recommendations from our curated Tester catalog (299-499 DH) or sealed retail editions.\n• 🛡️ **Risk-Free Guarantees:** 24-48h express delivery, 0 DH advance, and **full right to inspect your bottle before paying the courier**."
    : "Bienvenue à l'**Atelier NAY Parfums** · Service Client & Conseil Privé 🏛️\n\nJe suis votre conseiller dédié de la Maison. Je suis à votre entière disposition pour vous accompagner sur **l'ensemble de nos services et du catalogue** :\n\n• 📷 **Recherche par photo de flacon :** Vous pouvez envoyer la photo de n'importe quel parfum grâce au bouton caméra ci-dessous pour vérifier sa disponibilité et son tarif.\n• 📦 **Suivi de commande direct :** Localisation de votre colis en temps réel via notre page [Suivi de Commande](/fr/suivi-commande).\n• 💎 **Conseil & Authenticité :** Explications détaillées sur nos Testeurs de prestige (299-499 DH) et nos parfums originaux scellés.\n• 🛡️ **Garanties NAY :** Expédition express 24-48h dans tout le Maroc, 0 DH d'avance, avec **droit d'ouvrir et inspecter votre flacon avant tout paiement au livreur**.";

  const { messages, input, handleInputChange, handleSubmit, isLoading, append, setMessages } = useChat({
    api: '/api/chat',
    body: {
      conversationId,
      sessionId,
      locale,
    },
    onResponse: (res) => {
      const headerConvId = res.headers.get('x-conversation-id');
      if (headerConvId && headerConvId !== conversationId) {
        setConversationId(headerConvId);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('nay_advisor_conv_id', headerConvId);
        }
      }
    },
    initialMessages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: welcomeContent,
      }
    ],
    onFinish: () => {
      if (!isOpen) {
        setHasUnread(true);
      }
    }
  });

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHasUnread(false);
      setShowInvitation(false);
    }
  };

  const handleNewChat = () => {
    setConversationId(null);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('nay_advisor_conv_id');
    }
    setAttachedImage(null);
    setMessages([
      {
        id: 'welcome-' + Date.now(),
        role: 'assistant',
        content: welcomeContent,
      }
    ]);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert(isArabic ? 'يرجى اختيار ملف صورة صالح' : 'Veuillez sélectionner un fichier image valide.');
      return;
    }

    // Limit to 15MB
    if (file.size > 15 * 1024 * 1024) {
      alert(isArabic ? 'حجم الصورة كبير جداً (الحد الأقصى 15 ميغابايت)' : 'La taille de l\'image est trop grande (maximum 15 Mo).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawBase64 = event.target?.result as string;
      const img = new window.Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 900;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
            setAttachedImage({
              file,
              previewUrl: URL.createObjectURL(file),
              base64: compressedBase64,
              name: file.name
            });
            return;
          }
        } catch (canvasErr) {
          console.warn('Canvas resize failed, falling back to raw image:', canvasErr);
        }
        setAttachedImage({
          file,
          previewUrl: URL.createObjectURL(file),
          base64: rawBase64,
          name: file.name
        });
      };
      img.onerror = () => {
        setAttachedImage({
          file,
          previewUrl: URL.createObjectURL(file),
          base64: rawBase64,
          name: file.name
        });
      };
      img.src = rawBase64;
    };
    reader.readAsDataURL(file);

    // Reset input value so re-selecting same file works
    e.target.value = '';
  };

  const removeAttachedImage = () => {
    if (attachedImage?.previewUrl) {
      URL.revokeObjectURL(attachedImage.previewUrl);
    }
    setAttachedImage(null);
  };

  const handleCustomSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return;

    if (attachedImage) {
      const defaultPhotoPrompt = isArabic
        ? "هاهي صورة العطر اللي كنقلب عليه، واش متوفر عندكم وبشحال؟"
        : isEnglish
        ? "Here is the perfume photo I am looking for, is it available and what is the price?"
        : "Voici la photo du flacon que je recherche, l'avez-vous en stock et à quel tarif ?";

      const userText = input.trim() ? input.trim() : defaultPhotoPrompt;

      const attachmentObj = {
        name: attachedImage.name,
        contentType: attachedImage.file.type || 'image/jpeg',
        url: attachedImage.base64
      };

      append(
        {
          role: 'user',
          content: userText,
          experimental_attachments: [attachmentObj]
        },
        {
          experimental_attachments: [attachmentObj],
          body: {
            imageAttachment: attachedImage.base64,
            imageName: attachedImage.name,
            imageContentType: attachedImage.file.type || 'image/jpeg'
          }
        }
      );

      removeAttachedImage();
      handleInputChange({ target: { value: '' } } as any);
      return;
    }

    if (!input.trim()) return;
    handleSubmit(e);
  };

  const handleChipClick = (suggestionItem: { query: string; action?: string }) => {
    if (suggestionItem.action === 'upload') {
      fileInputRef.current?.click();
      return;
    }
    append({
      role: 'user',
      content: suggestionItem.query,
    });
  };

  useEffect(() => {
    if (messagesEndRef.current && isOpen && messages.length > 1) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  const isInvoice = pathname?.includes('/invoice');
  const isAdmin = pathname?.startsWith('/admin');
  const isProductPage = pathname?.includes('/product/');

  if (isInvoice || isAdmin) {
    return null;
  }

  // HeyGen-style quick suggestion list
  const suggestions = isArabic
    ? [
        { icon: Clock, label: 'لدي استفسار أو مشكلة في طلبيتي', query: 'كيفاش نتبع الطلبية ديالي وفوقاش كتوصل الكولية بالمغرب؟' },
        { icon: Camera, label: 'البحث عن عطر بصورة القنينة', action: 'upload', query: 'هاهي صورة العطر اللي كنقلب عليه، واش متوفر عندكم وبشحال؟' },
        { icon: Gem, label: 'ما هي عطور التيستور (Testers 299-499 DH) ؟', query: 'شنو الفرق الدقيق بين عطور التيستور والعطور بالبواكي العادية؟' },
        { icon: ShieldCheck, label: 'كيف تتم معاينة وفحص الكولية قبل الخلاص ؟', query: 'كيفاش كدوز عملية التوصيل ومعاينة الكولية قبل ما نخلص لفرور؟' },
        { icon: Crown, label: 'أفضل العطور الأكثر ثباتاً وسياجاً اليوم', query: 'شنو هوما أفضل العطور الأكثر مبيعاً واللي كيدوموا نهار كامل؟' },
        { icon: MessageCircle, label: 'التحدث مع كونسيرج البوتيك عبر واتساب', query: 'أرغب في التحدث مع كونسيرج الدار عبر واتساب' },
      ]
    : isEnglish
    ? [
        { icon: Clock, label: 'I have a question about my order', query: 'How can I track my order delivery in Morocco?' },
        { icon: Camera, label: 'Search a perfume by bottle photo', action: 'upload', query: 'Here is the perfume photo I am looking for, is it available and what is the price?' },
        { icon: Gem, label: 'Understand Boutique Testers (299-499 DH)', query: 'What is the exact difference between your imported testers and retail flacons?' },
        { icon: ShieldCheck, label: 'How does parcel inspection before pay work?', query: 'How does your 24-48h delivery and parcel inspection before payment work?' },
        { icon: Crown, label: 'Top-selling fragrances with max sillage', query: 'What are your best-selling fragrances with outstanding longevity and sillage?' },
        { icon: MessageCircle, label: 'Chat with VIP Concierge on WhatsApp', query: 'I would like to chat with VIP concierge on WhatsApp' },
      ]
    : [
        { icon: Clock, label: "J'ai une question sur ma commande", query: 'Comment suivre ma commande et sous quel délai est-elle livrée ?' },
        { icon: Camera, label: 'Rechercher un parfum par photo de flacon', action: 'upload', query: "Voici la photo du flacon que je recherche, l'avez-vous en stock et à quel tarif ?" },
        { icon: Gem, label: 'Comprendre nos Testeurs de luxe (299-499 DH)', query: 'Quelle est la différence exacte entre vos testeurs de parfumerie et les boîtes scellées ?' },
        { icon: ShieldCheck, label: "Modalités d'inspection du colis avant paiement", query: "Comment fonctionne la livraison 24-48h et l'inspection du colis avant paiement ?" },
        { icon: Crown, label: 'Nos Eaux de Parfum Best-Sellers du moment', query: 'Quels sont vos meilleurs parfums avec une tenue et un sillage exceptionnels ?' },
        { icon: MessageCircle, label: 'Échanger avec la Conciergerie sur WhatsApp', query: 'Je souhaite échanger directement avec un conseiller sur WhatsApp' },
      ];

  const whatsappMessage = encodeURIComponent(
    isArabic
      ? "السلام عليكم، أرغب في استشارة أو تتبع طلبيتي مع كونسيرج NAY Parfums"
      : "Bonjour, je souhaite contacter directement le Service Client Atelier NAY Parfums"
  );
  const whatsappUrl = `https://wa.me/212663380011?text=${whatsappMessage}`;

  const userName = customer?.name ? customer.name.split(' ')[0] : 'Ayoub';

  return (
    <>
      {/* ========================================================
          HEYGEN-INSPIRED AI AGENT PANEL (DARK OBSIDIAN THEME)
          ======================================================== */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-2 sm:bottom-20 right-2 sm:right-6 rtl:right-auto rtl:left-2 rtl:sm:left-6 w-[410px] max-w-[calc(100vw-1rem)] h-[670px] max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-88px)] bg-[#0c1017] text-white rounded-[28px] shadow-[0_25px_60px_-10px_rgba(0,0,0,0.85)] border border-[#1e293b] flex flex-col z-[150] overflow-hidden print:hidden"
          >
            {/* Top Cyan Glowing Line */}
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#0ea5e9] to-transparent shrink-0 opacity-80" />

            {/* Header: HeyGen Minimal Utility Bar (+, Mode Pill, Close) */}
            <div className="px-4 py-3 flex items-center justify-between border-b border-[#1b2434]/80 shrink-0">
              {/* New Conversation Button (+) */}
              <button
                type="button"
                onClick={handleNewChat}
                className="w-8 h-8 rounded-full bg-[#161f2e] hover:bg-[#202c40] text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
                title="Nouvelle conversation"
                aria-label="Nouvelle conversation"
              >
                <Plus size={16} strokeWidth={2.2} />
              </button>

              {/* Center Mode / Status Pill */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#161f2e]/80 border border-[#232f44] text-[11px] font-bold text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="tracking-wide">NAY AI Agent</span>
              </div>

              {/* Close Button (✕) */}
              <button
                type="button"
                onClick={toggleChat}
                className="w-8 h-8 rounded-full bg-[#161f2e] hover:bg-[#202c40] text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
                aria-label="Fermer"
              >
                <X size={16} strokeWidth={2.2} />
              </button>
            </div>

            {/* Messages & Hero Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              
              {/* HEYGEN HERO GREETING WITH 3D MASCOT (Only shown at start) */}
              {messages.length <= 1 && (
                <div className="text-center pt-2 pb-2">
                  {/* Glowing 3D Mascot Character */}
                  <div className="relative mx-auto mb-3 flex items-center justify-center">
                    <div className="absolute w-24 h-24 rounded-full bg-gradient-to-tr from-sky-500/25 via-cyan-400/20 to-amber-500/20 blur-xl pointer-events-none animate-pulse" />
                    <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-sky-400/60 shadow-[0_10px_30px_rgba(14,165,233,0.35)] bg-[#070e18]">
                      <Image
                        src="/images/agent_avatar_head.png"
                        alt="NAY AI Avatar"
                        fill
                        className="object-cover"
                        priority
                      />
                    </div>
                    {/* Live Online Badge */}
                    <span className="absolute bottom-0 right-1/2 translate-x-7 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#0c1017] shadow-xs" />
                  </div>

                  {/* HeyGen-style Greeting Headline */}
                  <h3 className="heading-font text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                    {isArabic
                      ? `أهلاً بك، ${userName}.`
                      : `Bonjour, ${userName}.`}
                  </h3>
                  <p className="text-[13px] text-slate-400 font-medium mt-1">
                    {isArabic
                      ? 'كيف يمكنني مساعدتك اليوم؟'
                      : "Comment puis-je vous guider aujourd'hui ?"}
                  </p>

                  {/* HeyGen-style Quick Action Prompts (Vertical Pills) */}
                  <div className="mt-5 space-y-2 text-left rtl:text-right">
                    {suggestions.map((item, idx) => {
                      const IconComp = item.icon;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleChipClick(item)}
                          className="w-full px-3.5 py-3 rounded-2xl bg-[#141b27] hover:bg-[#1c2637] border border-[#212d40] hover:border-sky-500/40 text-slate-200 hover:text-white transition-all flex items-center justify-between group cursor-pointer shadow-2xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-slate-400 group-hover:text-sky-400 transition-colors shrink-0">
                              <IconComp size={16} strokeWidth={2.2} />
                            </span>
                            <span className="text-[12.5px] font-medium truncate">
                              {item.label}
                            </span>
                          </div>
                          <ArrowRight size={14} className="text-slate-500 group-hover:text-sky-400 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 rtl:rotate-180 transition-all shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Messages Thread (When chatting) */}
              {messages.length > 1 && (
                <div className="space-y-3.5 pt-1">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {m.role === 'assistant' && (
                        <div className="w-7 h-7 rounded-full overflow-hidden relative border border-sky-400/60 shadow-xs shrink-0 mt-0.5 bg-[#070e18]">
                          <Image
                            src="/images/agent_avatar_head.png"
                            alt="NAY AI"
                            fill
                            sizes="28px"
                            className="object-cover"
                          />
                        </div>
                      )}

                      <div
                        className={`px-4 py-3 rounded-2xl max-w-[88%] text-[13px] leading-relaxed shadow-sm transition-all ${
                          m.role === 'user'
                            ? 'bg-[#1a2333] text-white rounded-tr-xs border border-slate-700/60'
                            : 'bg-[#131b28] text-slate-200 border border-[#222f44] rounded-tl-xs'
                        }`}
                      >
                        {m.role === 'user' ? (
                          <div className="space-y-2">
                            {/* Attached Images */}
                            {m.experimental_attachments && m.experimental_attachments.length > 0 && (
                              <div className="flex flex-wrap gap-2 pt-0.5 pb-1">
                                {m.experimental_attachments.map((att: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className="relative rounded-xl overflow-hidden border border-white/20 bg-black/40 shadow-sm max-w-[200px]"
                                  >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={att.url}
                                      alt={att.name || 'Photo'}
                                      className="w-full h-auto max-h-44 object-cover"
                                    />
                                    <div className="px-2 py-1 text-[10px] text-slate-300 truncate flex items-center gap-1.5 bg-black/60">
                                      <Camera size={11} className="text-sky-300 shrink-0" />
                                      <span className="truncate">{att.name || 'Photo flacon'}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            <p className="whitespace-pre-wrap">{m.content}</p>
                          </div>
                        ) : (
                          <div className="space-y-2 text-slate-200">
                            <ReactMarkdown
                              components={{
                                p: ({ node, ...props }) => (
                                  <p className="mb-2 leading-relaxed last:mb-0" {...props} />
                                ),
                                a: ({ node, href, children, ...props }) => {
                                  const isProductLink = href?.includes('/product/');
                                  const isSuiviLink = href?.includes('/suivi-commande');
                                  const isWhatsApp = href?.includes('wa.me');
                                  
                                  if (isWhatsApp) {
                                    return (
                                      <a
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 rounded-xl hover:bg-emerald-500/25 transition-all my-1.5 text-[12px] group"
                                        {...props}
                                      >
                                        <MessageCircle size={14} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                                        <span>{children}</span>
                                      </a>
                                    );
                                  }

                                  if (isSuiviLink) {
                                    return (
                                      <a
                                        href={href}
                                        className="inline-flex items-center justify-between gap-2 font-semibold text-sky-300 bg-sky-500/15 border border-sky-400/40 hover:border-sky-400 px-3 py-1.5 rounded-xl transition-all my-1.5 text-[12.5px] group w-full sm:w-auto"
                                        {...props}
                                      >
                                        <span className="flex items-center gap-1.5">
                                          <PackageCheck size={14} className="text-sky-400" />
                                          <span>{children}</span>
                                        </span>
                                        <ArrowRight size={13} className="text-sky-400 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 rtl:rotate-180 transition-transform shrink-0" />
                                      </a>
                                    );
                                  }

                                  if (isProductLink) {
                                    return (
                                      <a
                                        href={href}
                                        className="inline-flex items-center justify-between gap-2 font-medium text-white bg-gradient-to-r from-sky-500/20 via-sky-400/10 to-transparent border border-sky-400/30 hover:border-sky-400 px-3 py-1.5 rounded-xl transition-all my-1.5 text-[12.5px] group w-full sm:w-auto"
                                        {...props}
                                      >
                                        <span className="flex items-center gap-1.5">
                                          <Gem size={13} className="text-[#38bdf8]" />
                                          <span className="font-bold text-white">{children}</span>
                                        </span>
                                        <ArrowRight size={13} className="text-sky-400 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 rtl:rotate-180 transition-transform shrink-0" />
                                      </a>
                                    );
                                  }

                                  return (
                                    <a
                                      href={href}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 font-semibold text-sky-400 underline hover:text-sky-300 transition-colors"
                                      {...props}
                                    >
                                      {children}
                                    </a>
                                  );
                                },
                                strong: ({ node, ...props }) => (
                                  <strong className="font-bold text-white" {...props} />
                                ),
                                ul: ({ node, ...props }) => (
                                  <ul className="pl-4 rtl:pl-0 rtl:pr-4 my-2 space-y-1 list-disc marker:text-sky-400" {...props} />
                                ),
                                ol: ({ node, ...props }) => (
                                  <ol className="pl-4 rtl:pl-0 rtl:pr-4 my-2 space-y-1 list-decimal marker:text-sky-400 font-medium" {...props} />
                                ),
                                li: ({ node, ...props }) => (
                                  <li className="leading-relaxed text-[12.5px]" {...props} />
                                )
                              }}
                            >
                              {m.content}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Typing Indicator */}
                  {isLoading && (
                    <div className="flex gap-2.5 justify-start items-center">
                      <div className="w-7 h-7 rounded-full overflow-hidden relative border border-sky-400/60 shadow-xs shrink-0 bg-[#070e18]">
                        <Image
                          src="/images/agent_avatar_head.png"
                          alt="NAY AI"
                          fill
                          sizes="28px"
                          className="object-cover"
                        />
                      </div>
                      <div className="px-4 py-2.5 rounded-2xl bg-[#131b28] border border-[#222f44] rounded-tl-xs flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce" />
                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                        <span className="text-[11.5px] text-slate-400 font-medium ml-1">
                          {isArabic ? 'جارٍ إعداد الإجابة...' : 'NAY AI réfléchit...'}
                        </span>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Photo Attachment Preview Bar */}
            {attachedImage && (
              <div className="px-3.5 py-2 bg-[#141b27] border-t border-[#1f293d] flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-sky-400/80 shrink-0 shadow-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={attachedImage.previewUrl}
                      alt="Aperçu"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11.5px] font-semibold text-white truncate max-w-[210px] sm:max-w-[260px]">
                      {attachedImage.name}
                    </p>
                    <p className="text-[9.5px] text-sky-400 flex items-center gap-1">
                      <Camera size={10} />
                      <span>Photo prête pour recherche & stock</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeAttachedImage}
                  aria-label="Supprimer la photo jointe"
                  className="p-1 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>
            )}

            {/* HeyGen-Style Bottom Chat Input Capsule */}
            <form onSubmit={handleCustomSubmit} className="p-3 bg-[#0c1017] border-t border-[#1b2434]/90 shrink-0">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />

              <div className="flex items-center gap-2 bg-[#131924] border border-[#232d42] focus-within:border-sky-500/80 rounded-2xl px-2.5 py-1.5 shadow-inner transition-all">
                {/* Camera Photo Upload Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-2 rounded-xl transition-all shrink-0 cursor-pointer ${
                    attachedImage
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'text-slate-400 hover:text-sky-400 hover:bg-white/5'
                  }`}
                  title="Rechercher par photo de flacon"
                  aria-label="Upload photo"
                >
                  <Camera size={18} />
                </button>

                {/* Main Text Input */}
                <input
                  type="text"
                  value={input}
                  onChange={handleInputChange}
                  placeholder={
                    attachedImage
                      ? (isArabic ? 'أضف رسالة مع الصورة...' : 'Ajoutez un mot ou envoyez directement...')
                      : isArabic
                      ? 'عما تبحث اليوم ؟'
                      : 'What are you looking for ?'
                  }
                  className="flex-1 bg-transparent text-[13px] outline-none text-white placeholder:text-slate-500 py-1.5 px-1 font-normal"
                />

                {/* Voice Mic Icon Indicator */}
                <button
                  type="button"
                  className="p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Entrée vocale"
                  aria-label="Microphone"
                >
                  <Mic size={17} />
                </button>

                {/* HeyGen Upward Arrow Send Button (↑) */}
                <button
                  type="submit"
                  disabled={(!input.trim() && !attachedImage) || isLoading}
                  aria-label="Envoyer"
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                    input.trim() || attachedImage
                      ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30 hover:scale-105 active:scale-95'
                      : 'bg-[#1e2738] text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <ArrowUp size={16} strokeWidth={2.5} />
                </button>
              </div>

              {/* Bottom Subtle Disclaimer & Privacy Disclosure */}
              <div className="flex items-center justify-between text-[9.5px] text-slate-500 mt-2 px-1">
                <span title="Assistance olfactive confidentielle - Aucune donnée personnelle n'est transmise aux modèles d'IA">
                  {isArabic ? 'NAY AI · توجيه عطري محمي' : 'NAY AI · Conseil Olfactif Protégé'}
                </span>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <MessageCircle size={10} />
                  <span>WhatsApp VIP</span>
                </a>
              </div>
              <p className="text-[8px] text-slate-500/70 text-center mt-1 leading-tight px-1">
                {isArabic
                  ? 'الصور والرسائل تُعالج حصرياً للتعرف على العطور. للطلبيات والشؤون الخاصة استخدم واتساب.'
                  : 'Photos & messages analysés pour le conseil olfactif. Confidentialité garantie.'}
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================
          LUXURY CIRCULAR FLOATING LAUNCHER (WHATSAPP-MATCHED AESTHETICS)
          ======================================================== */}
      <AnimatePresence>
        {!isOpen && (
          <div
            className={`fixed bottom-[140px] lg:bottom-[86px] right-3 sm:right-6 rtl:right-auto rtl:left-3 rtl:sm:left-6 z-[110] flex items-center justify-end rtl:justify-start print:hidden ${
              isProductPage ? 'hidden lg:flex' : 'flex'
            }`}
          >
            {/* Flyout Luxury Tooltip on Hover (matching WhatsApp tooltip) */}
            <AnimatePresence>
              {isLauncherHovered && (
                <motion.div
                  initial={{ opacity: 0, x: 10, scale: 0.92 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 10, scale: 0.92 }}
                  className="mr-3 rtl:mr-0 rtl:ml-3 bg-[#0c1017] text-white text-[12px] font-bold tracking-wide px-4 py-2.5 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.5)] border border-[#232d42] whitespace-nowrap flex items-center gap-2 pointer-events-none"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                  <span>
                    {isArabic
                      ? 'اسأل مستشار العطور الذكي'
                      : isEnglish
                      ? 'Ask NAY AI Fragrance Concierge'
                      : 'Conseiller IA Atelier NAY'}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Circular Floating Button (Identical Dimensions & Elegance to WhatsApp Button) */}
            <motion.button
              onClick={toggleChat}
              onMouseEnter={() => setIsLauncherHovered(true)}
              onMouseLeave={() => setIsLauncherHovered(false)}
              aria-label="Ask NAY AI Agent"
              className="relative flex items-center justify-center w-12 h-12 sm:w-[54px] sm:h-[54px] rounded-full bg-[#0c1017] hover:bg-[#0284c7] border border-[#232d42] hover:border-sky-400 shadow-[0_10px_28px_rgba(0,0,0,0.4)] text-white transition-colors duration-300 group cursor-pointer focus:outline-none"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.4 }}
            >
              {/* Subtle Concentric Pulse Ring (Matching WhatsApp animation) */}
              <div className="absolute inset-0 rounded-full border border-sky-400/50 opacity-25 animate-ping pointer-events-none" />

              {/* 3D Mascot Avatar Head */}
              <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border border-sky-400/80 shrink-0 bg-[#070e18] shadow-xs">
                <Image
                  src="/images/agent_avatar_head.png"
                  alt="NAY AI Avatar"
                  fill
                  sizes="32px"
                  priority
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>

              {/* Glowing Online Green Dot with Ping */}
              <div className="absolute top-0 right-0 flex items-center justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0c1017]" />
                <span className="absolute w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping opacity-75" />
              </div>

              {/* Unread Notification Badge */}
              {hasUnread && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-[#0c1017]" />
              )}
            </motion.button>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
