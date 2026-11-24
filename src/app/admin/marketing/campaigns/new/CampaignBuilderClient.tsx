'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Save, 
  Send, 
  Sparkles, 
  MessageSquare, 
  Mail, 
  Users, 
  Crown, 
  Flame, 
  Clock, 
  Check, 
  Smartphone,
  Info,
  Gift
} from 'lucide-react';

interface TemplatePreset {
  id: string;
  name: string;
  tag: string;
  channel: 'WHATSAPP' | 'EMAIL';
  type: 'VIP' | 'PROMOTION' | 'ABANDONED_CART' | 'REACTIVATION';
  audience: string;
  subject?: string;
  message: string;
  badgeColor: string;
}

const PRESET_TEMPLATES: TemplatePreset[] = [
  {
    id: 'vip_privilege',
    name: 'Offre Privilège VIP (-15%)',
    tag: 'Haute Valeur',
    channel: 'WHATSAPP',
    type: 'VIP',
    audience: 'VIP',
    subject: 'Votre invitation privilégiée NAY Parfum ✨',
    message: 'Salam {{first_name}} ✨, en tant que client VIP d\'honneur chez NAY Parfum, nous vous réservons une remise exclusive de -15% sur toute notre collection et nos testeurs rares avec le code VIP15. Livraison express offerte et échantillon surprise inclus dans votre colis 🎁. Profitez-en ici : https://nayparfum.ma',
    badgeColor: 'bg-sky-50 text-[#0ea5e9] border-sky-200'
  },
  {
    id: 'cart_gift',
    name: 'Relance Panier + Échantillon Offert',
    tag: 'Forte Conversion',
    channel: 'WHATSAPP',
    type: 'ABANDONED_CART',
    audience: 'ALL',
    subject: 'Votre sélection NAY Parfum vous attend',
    message: 'Salam {{first_name}} 👋, votre panier chez NAY Parfum est toujours réservé ! Pour toute finalisation aujourd\'hui, nous vous ajoutons un échantillon de luxe offert dans votre commande. Cliquez ici pour valider : https://nayparfum.ma/cart ✨',
    badgeColor: 'bg-red-50 text-red-700 border-red-200'
  },
  {
    id: 'new_testers',
    name: 'Arrivage Nouveautés & Testeurs',
    tag: 'Nouveautés',
    channel: 'WHATSAPP',
    type: 'PROMOTION',
    audience: 'ALL',
    subject: 'Nouveaux testeurs authentiques disponibles chez NAY Parfum',
    message: 'Salam {{first_name}}, découvrez nos nouveaux arrivages de testeurs de luxe (Dior, Tom Ford, Creed, YSL) à prix direct importateur sur NAY Parfum. Quantités limitées ! Accédez à la boutique : https://nayparfum.ma/products',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  {
    id: 'winback_reactivation',
    name: 'Réactivation Client Fidèle (Win-Back)',
    tag: 'Réactivation',
    channel: 'WHATSAPP',
    type: 'REACTIVATION',
    audience: 'AT_RISK',
    subject: 'Une attention spéciale pour votre retour chez NAY Parfum',
    message: 'Salam {{first_name}} ✨, vous nous manquez chez NAY Parfum ! Profitez de la livraison gratuite et d\'un cadeau olfactif offert sur votre prochaine commande avec le code RETOURNAY. Découvrez nos nouveautés : https://nayparfum.ma',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200'
  }
];

export default function CampaignBuilderClient({
  initialAudience,
  saveCampaignAction
}: {
  initialAudience: string;
  saveCampaignAction: (formData: FormData) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [channel, setChannel] = useState<'WHATSAPP' | 'EMAIL'>('WHATSAPP');
  const [type, setType] = useState('VIP');
  const [audience, setAudience] = useState(initialAudience || 'ALL');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState(PRESET_TEMPLATES[0].message);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('vip_privilege');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const applyTemplate = (tpl: TemplatePreset) => {
    setSelectedTemplate(tpl.id);
    setName(tpl.name);
    setChannel(tpl.channel);
    setType(tpl.type);
    setAudience(tpl.audience);
    if (tpl.subject) setSubject(tpl.subject);
    setMessage(tpl.message);
  };

  const previewMessage = message.replace('{{first_name}}', 'Ayoub').replace('{{last_order_date}}', '12 Février');

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Top Breadcrumb & Title */}
      <div className="flex items-center gap-3.5">
        <Link 
          href="/admin/marketing/campaigns" 
          className="text-neutral-600 hover:text-neutral-900 bg-white hover:bg-neutral-50 p-2 rounded-lg border border-neutral-200 transition-colors shadow-2xs"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <Sparkles size={18} className="text-neutral-700" />
            Créateur de Campagne & Studio de Diffusion
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Sélectionnez un modèle prédéfini ou composez votre message personnalisé.
          </p>
        </div>
      </div>

      {/* Template Presets Picker */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-neutral-800 flex items-center gap-1.5">
            <Sparkles size={13} className="text-neutral-500" /> Modèles Prédéfinis (1-Clic)
          </label>
          <span className="text-[11px] text-neutral-400">Cliquez pour pré-remplir</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 nay-stagger">
          {PRESET_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => applyTemplate(tpl)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                selectedTemplate === tpl.id
                  ? 'border-[#0ea5e9] bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] text-white shadow-md shadow-sky-500/20'
                  : 'border-slate-200 bg-white hover:border-sky-300 text-slate-900 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  selectedTemplate === tpl.id ? 'bg-white/20 text-white border-white/25' : tpl.badgeColor
                }`}>
                  {tpl.tag}
                </span>
                {selectedTemplate === tpl.id && <Check size={13} className="text-white" />}
              </div>
              <h4 className="font-bold text-xs line-clamp-1">{tpl.name}</h4>
              <p className={`text-[11px] mt-1 line-clamp-2 ${selectedTemplate === tpl.id ? 'text-sky-100' : 'text-slate-500'}`}>
                {tpl.message}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Left Form | Right Phone Mockup Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Container (7 Cols) */}
        <div className="lg:col-span-7">
          <form 
            action={async (fd) => {
              setIsSubmitting(true);
              await saveCampaignAction(fd);
            }} 
            className="space-y-5"
          >
            <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-2xs space-y-4">
              {/* Campaign Name & Channel */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Nom de la Campagne *
                  </label>
                  <input 
                    name="name" 
                    type="text" 
                    required 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Offre VIP Printemps 2026" 
                    className="w-full border border-neutral-200 rounded-lg p-2.5 bg-neutral-50 focus:bg-white text-xs font-medium focus:border-neutral-900 focus:outline-none transition-colors" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Canal de Diffusion *
                  </label>
                  <select
                    name="channel"
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as any)}
                    className="w-full border border-neutral-200 rounded-lg p-2.5 bg-neutral-50 focus:bg-white text-xs font-medium focus:border-neutral-900 focus:outline-none transition-colors cursor-pointer"
                  >
                    <option value="WHATSAPP">WhatsApp Direct (Prioritaire)</option>
                    <option value="EMAIL">Email Marketing Haute Définition</option>
                  </select>
                </div>
              </div>

              {/* Target Audience & Objective */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Audience Cible *
                  </label>
                  <select
                    name="audience"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    className="w-full border border-neutral-200 rounded-lg p-2.5 bg-neutral-50 focus:bg-white text-xs font-medium focus:border-neutral-900 focus:outline-none transition-colors cursor-pointer"
                  >
                    <option value="ALL">Tous les Clients (Base Complète)</option>
                    <option value="VIP">Membres VIP Privilège Seuls</option>
                    <option value="REPEAT_BUYERS">Acheteurs Récurents (&gt;1 commande)</option>
                    <option value="ONE_TIME">Premiers Acheteurs (1 commande)</option>
                    <option value="ABANDONED_CART">Paniers Abandonnés</option>
                    <option value="AT_RISK">Clients Inactifs (&gt;45 jours)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Objectif Stratégique
                  </label>
                  <select
                    name="type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full border border-neutral-200 rounded-lg p-2.5 bg-neutral-50 focus:bg-white text-xs font-medium focus:border-neutral-900 focus:outline-none transition-colors cursor-pointer"
                  >
                    <option value="VIP">Avantage VIP Privilège</option>
                    <option value="PROMOTION">Lancement & Promotion Spéciale</option>
                    <option value="ABANDONED_CART">Relance Panier Incomplet</option>
                    <option value="REACTIVATION">Réactivation & Win-Back</option>
                  </select>
                </div>
              </div>

              {/* Subject (If Email) */}
              {channel === 'EMAIL' && (
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Objet de l'Email *
                  </label>
                  <input 
                    name="subject" 
                    type="text" 
                    required 
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Ex: Votre invitation privée NAY Parfum ✨" 
                    className="w-full border border-neutral-200 rounded-lg p-2.5 bg-neutral-50 focus:bg-white text-xs font-medium focus:border-neutral-900 focus:outline-none transition-colors" 
                  />
                </div>
              )}

              {/* Message Content */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-neutral-700">
                    Corps du Message *
                  </label>
                  <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                    <span>Variables :</span>
                    <code className="bg-neutral-100 text-neutral-700 px-1 py-0.5 rounded font-mono">{'{{first_name}}'}</code>
                  </div>
                </div>
                <textarea 
                  name="message" 
                  rows={6}
                  required 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Écrivez votre message..." 
                  className="w-full border border-neutral-200 rounded-lg p-3 bg-neutral-50 focus:bg-white text-xs font-medium focus:border-neutral-900 focus:outline-none leading-relaxed transition-colors"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2.5">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] hover:opacity-95 text-white font-semibold text-xs rounded-xl shadow-sm shadow-sky-500/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Save size={14} />
                <span>{isSubmitting ? 'Enregistrement...' : 'Enregistrer la Campagne'}</span>
              </button>

              <Link
                href="/admin/marketing/campaigns"
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 transition-colors shadow-2xs"
              >
                Annuler
              </Link>
            </div>
          </form>
        </div>

        {/* Live Smartphone Simulator Preview (5 Cols) */}
        <div className="lg:col-span-5">
          <div className="sticky top-20 bg-white p-5 rounded-xl border border-neutral-200 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Smartphone size={14} className="text-neutral-500" />
                <span className="text-xs font-semibold text-neutral-800">
                  Aperçu Smartphone
                </span>
              </div>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200">
                {channel}
              </span>
            </div>

            {/* Simulated Phone Screen */}
            <div className="bg-neutral-50 rounded-xl p-3.5 border border-neutral-200 space-y-3">
              {/* Top Contact Bar */}
              <div className="flex items-center gap-2.5 pb-2.5 border-b border-neutral-200/80">
                <div className="w-7 h-7 rounded-full bg-neutral-900 text-white font-bold flex items-center justify-center text-[10px]">
                  NAY
                </div>
                <div>
                  <div className="font-semibold text-xs text-neutral-900">NAY Parfum Officiel</div>
                  <div className="text-[10px] text-emerald-600 font-medium">Compte Professionnel Vérifié</div>
                </div>
              </div>

              {/* Chat Bubble */}
              <div className="bg-white text-neutral-900 rounded-xl rounded-tl-xs p-3.5 text-xs leading-relaxed space-y-1.5 border border-neutral-200 shadow-2xs">
                {channel === 'EMAIL' && subject && (
                  <div className="text-[11px] font-semibold text-neutral-800 pb-1 border-b border-neutral-100">
                    Objet : {subject}
                  </div>
                )}
                <div className="whitespace-pre-wrap text-neutral-800">
                  {previewMessage || 'Votre message apparaîtra ici...'}
                </div>
                <div className="text-right text-[10px] text-neutral-400">
                  12:45 • Reçu
                </div>
              </div>
            </div>

            {/* Simulation Info */}
            <div className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-200/70 text-[11px] text-neutral-500 flex items-center gap-2">
              <Info size={13} className="shrink-0 text-neutral-400" />
              <span>Aperçu en temps réel tel que reçu par vos clients.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
