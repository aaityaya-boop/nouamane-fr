'use client';

import React, { useState } from 'react';
import {
  Sliders,
  ShieldCheck,
  Mail,
  MessageSquare,
  Zap,
  CheckCircle2,
  Clock,
  Sparkles,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';

interface Props {
  initialSettings: {
    whatsappConfigured: boolean;
    emailConfigured: boolean;
    automationEnabled: boolean;
  };
}

export default function MarketingSettingsClient({ initialSettings }: Props) {
  const [settings, setSettings] = useState(initialSettings);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const toggle = async (key: keyof Props['initialSettings']) => {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    setSavingKey(key);
    try {
      const res = await fetch('/api/admin/marketing/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
      if (!res.ok) throw new Error('Erreur');
      setSavedNotice('Paramètres synchronisés en base de données');
      setTimeout(() => setSavedNotice(null), 2500);
    } catch {
      setSettings(settings);
    } finally {
      setSavingKey(null);
    }
  };

  const templates = [
    {
      title: '1. Relance Panier Abandonné + Échantillon',
      code: `Salam {{first_name}} 👋, votre sélection NAY Parfum est toujours réservée ! Validez votre commande aujourd'hui pour recevoir un échantillon découverte 5ml offert dans votre colis ✨`,
    },
    {
      title: '2. Offre Privilège Membre VIP',
      code: `Salam {{first_name}} ✨, en tant que client VIP de la Maison NAY Parfum, profitez d'une remise exclusive de -15% avec le code {{promo_code}} + livraison express offerte !`,
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl nay-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <Sliders size={19} className="text-[#0ea5e9]" />
            Paramètres &amp; Automatisations Rétention
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pilotez les déclencheurs automatiques, la normalisation WhatsApp +212 et les modèles haute conversion NAY.
          </p>
        </div>

        {savedNotice && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
            <CheckCircle2 size={13} />
            {savedNotice}
          </span>
        )}
      </div>

      <div className="grid gap-5">
        {/* Channels Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 nay-stagger">
          {[
            {
              key: 'automationEnabled' as const,
              title: 'Moteur Rétention Auto',
              desc: 'Calcul des paniers abandonnés & qualification des paliers VIP en direct.',
              icon: <Zap size={17} />,
              active: settings.automationEnabled,
            },
            {
              key: 'whatsappConfigured' as const,
              title: 'Canal WhatsApp +212',
              desc: 'Normalisation 06/07 → +212 & génération des liens wa.me 1-clic.',
              icon: <MessageSquare size={17} />,
              active: settings.whatsappConfigured,
            },
            {
              key: 'emailConfigured' as const,
              title: 'Canal Email Rétention',
              desc: 'Prise en charge des campagnes éditoriales et confirmations VIP.',
              icon: <Mail size={17} />,
              active: settings.emailConfigured,
            },
          ].map((item) => (
            <div
              key={item.key}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs nay-card-lift flex flex-col justify-between gap-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#0ea5e9] border border-sky-200 flex items-center justify-center shrink-0">
                  {item.icon}
                </div>
                <button
                  type="button"
                  disabled={savingKey === item.key}
                  onClick={() => toggle(item.key)}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors ${
                    item.active ? 'bg-[#0ea5e9]' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform flex items-center justify-center ${
                      item.active ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  >
                    {savingKey === item.key && (
                      <Loader2 size={10} className="animate-spin text-[#0ea5e9]" />
                    )}
                  </div>
                </button>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{item.title}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
              </div>
              <span
                className={`w-fit text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                  item.active
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {item.active ? 'Actif & Opérationnel' : 'Désactivé'}
              </span>
            </div>
          ))}
        </div>

        {/* Pipeline Rules */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-[#0ea5e9] border border-sky-200 flex items-center justify-center">
              <ShieldCheck size={17} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Règles &amp; Seuils Intelligents</h3>
              <p className="text-xs text-slate-500">
                Calibrés pour maximiser la délivrabilité et la conversion au Maroc.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 gap-3">
              <div>
                <div className="font-semibold text-xs text-slate-900 flex items-center gap-1.5">
                  <Clock size={13} className="text-[#0ea5e9]" />
                  Seuil Panier Abandonné (60 minutes)
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Toute session boutique inactive depuis 1h bascule automatiquement dans la file de relance.
                </p>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                Actif (60 min)
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 gap-3">
              <div>
                <div className="font-semibold text-xs text-slate-900 flex items-center gap-1.5">
                  <Sparkles size={13} className="text-amber-500" />
                  Qualification Paliers VIP (Diamant &gt;5k • Or &gt;2.5k • Argent &gt;1k)
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Recalcul dynamique en fonction du CA livré cumulé et du nombre de commandes.
                </p>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-sky-50 text-[#0284c7] border border-sky-200 shrink-0">
                Temps Réel
              </span>
            </div>
          </div>
        </div>

        {/* Luxury Templates Vault */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-50 text-[#0ea5e9] border border-sky-200 flex items-center justify-center">
                <Sparkles size={17} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Bibliothèque de Scripts Haute Conversion</h3>
                <p className="text-xs text-slate-500">Copiez en 1 clic pour vos équipes WhatsApp</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
            {templates.map((t, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-900 text-xs">{t.title}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(t.code);
                      setCopiedIdx(idx);
                      setTimeout(() => setCopiedIdx(null), 2000);
                    }}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-slate-200 text-[10px] font-bold text-[#0284c7] hover:bg-sky-50"
                  >
                    {copiedIdx === idx ? <Check size={11} /> : <Copy size={11} />}
                    <span>{copiedIdx === idx ? 'Copié' : 'Copier'}</span>
                  </button>
                </div>
                <p className="text-slate-600 leading-relaxed font-mono text-[11px] bg-white p-3 rounded-lg border border-slate-200">
                  {t.code}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
