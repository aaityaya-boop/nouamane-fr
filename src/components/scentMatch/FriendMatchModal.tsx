'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Copy, Check, MessageCircle, ArrowRight, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface FriendMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  hostSessionId: string;
  locale?: string;
}

export default function FriendMatchModal({
  isOpen,
  onClose,
  hostSessionId,
  locale = 'fr'
}: FriendMatchModalProps) {
  const isAr = locale === 'ar';
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [hostName, setHostName] = useState('');
  const [friendName, setFriendName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleCreateRoom = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/scent-match/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          hostSessionId,
          hostName: hostName.trim() || (isAr ? 'صاحب الدعوة' : 'Hôte')
        })
      });
      const data = await res.json();
      if (data.success && data.inviteCode) {
        setInviteCode(data.inviteCode);
      }
    } catch (e) {
      console.error('Error creating friend room:', e);
    } finally {
      setLoading(false);
    }
  };

  const inviteUrl = inviteCode && typeof window !== 'undefined'
    ? `${window.location.origin}/${locale}/scent-match/friends/${inviteCode}`
    : '';

  const handleCopyLink = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleJoinRoom = () => {
    if (!joinCode.trim()) return;
    router.push(`/${locale}/scent-match/friends/${joinCode.trim().toUpperCase()}`);
    onClose();
  };

  const whatsappMessage = encodeURIComponent(
    isAr
      ? `أدعوك لتحدي التوافق العطري NAY Scent Match! انضم إلى جلستي لاكتشاف نسبة التوافق بيننا وعطورنا المشتركة المفضلة: ${inviteUrl}`
      : `Je t'invite à défier notre harmonie olfactive sur NAY Scent Match ! Rejoins ma session pour voir nos coups de cœur communs : ${inviteUrl}`
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-white dark:bg-[#0f172a] rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-sky-50 dark:bg-sky-950 flex items-center justify-center text-sky-500">
                <Users size={18} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">
                  {isAr ? 'المطابقة بين صديقين' : 'Match Entre Amis'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {isAr ? 'اكتشفوا تناغمكم العطري والعطور المشتركة' : 'Découvrez votre complicité et vos parfums communs'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
              aria-label="Fermer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tab Selector */}
          <div className="grid grid-cols-2 p-2 bg-slate-100 dark:bg-slate-900/60 m-4 rounded-2xl gap-1">
            <button
              onClick={() => setActiveTab('create')}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'create'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isAr ? 'إنشاء جلسة ثنائية' : 'Créer une invitation'}
            </button>
            <button
              onClick={() => setActiveTab('join')}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'join'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isAr ? 'الانضمام بكود' : 'Rejoindre une session'}
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-5">
            {activeTab === 'create' ? (
              !inviteCode ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {isAr ? 'اسمك المستعار' : 'Votre Prénom'}
                    </label>
                    <input
                      type="text"
                      placeholder={isAr ? 'مثال: يوسف' : 'Ex: Karim, Sarah...'}
                      value={hostName}
                      onChange={(e) => setHostName(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-sm font-semibold outline-none focus:border-sky-500 transition-colors"
                    />
                  </div>

                  <button
                    onClick={handleCreateRoom}
                    disabled={loading}
                    className="w-full py-3.5 bg-slate-900 hover:bg-sky-600 dark:bg-sky-500 dark:hover:bg-sky-400 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <Sparkles size={16} />
                    <span>{loading ? (isAr ? 'جارٍ الإنشاء...' : 'Création en cours...') : (isAr ? 'توليد رابط التحدي' : 'Générer mon Invitation Duo')}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 text-center space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                      {isAr ? 'كود الدعوة الخاص بك' : 'Code Invitation Duo'}
                    </span>
                    <p className="text-2xl font-black text-slate-900 dark:text-white tracking-wider">
                      {inviteCode}
                    </p>
                  </div>

                  {/* Share Link Row */}
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <input
                      type="text"
                      readOnly
                      value={inviteUrl}
                      className="flex-1 bg-transparent px-2 text-xs text-slate-600 dark:text-slate-300 outline-none select-all"
                    />
                    <button
                      onClick={handleCopyLink}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                        copied ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white dark:bg-sky-500'
                      }`}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copied ? (isAr ? 'تم النسخ' : 'Copié') : (isAr ? 'نسخ' : 'Copier')}</span>
                    </button>
                  </div>

                  {/* WhatsApp CTA */}
                  <a
                    href={`https://wa.me/?text=${whatsappMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <MessageCircle size={16} />
                    <span>{isAr ? 'إرسال الرابط عبر واتساب' : 'Envoyer par WhatsApp'}</span>
                  </a>

                  {/* Open Room Button */}
                  <button
                    onClick={() => {
                      router.push(`/${locale}/scent-match/friends/${inviteCode}`);
                      onClose();
                    }}
                    className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-2xl transition-colors flex items-center justify-center gap-2"
                  >
                    <span>{isAr ? 'فتح شاشة المقارنة الثنائية' : 'Accéder au Salon Duo'}</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              )
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {isAr ? 'كود الدعوة المستلم' : 'Code d\'invitation'}
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: NAY-A1B2C3"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-sm font-black uppercase tracking-wider outline-none focus:border-sky-500 transition-colors"
                  />
                </div>

                <button
                  onClick={handleJoinRoom}
                  disabled={!joinCode.trim()}
                  className="w-full py-3.5 bg-slate-900 hover:bg-sky-600 dark:bg-sky-500 dark:hover:bg-sky-400 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span>{isAr ? 'دخول الجلسة ومقارنة الأذواق' : 'Rejoindre & Comparer'}</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
