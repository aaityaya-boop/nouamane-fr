'use client';

import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, Clock, Search, Archive, MessageSquare, Phone, Send, Trash2, Check, RefreshCw } from 'lucide-react';

export default function AdminMessages() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/messages');
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch('/api/admin/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      fetchMessages();
      if (selectedMessage && selectedMessage.id === id) {
        setSelectedMessage({ ...selectedMessage, status });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const filtered = messages.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    m.email.toLowerCase().includes(search.toLowerCase()) ||
    m.message.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-semibold tracking-wider bg-neutral-100 text-neutral-700 border border-neutral-200">
              Support Client
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 flex items-center gap-2">
            <Mail size={22} className="text-neutral-900" />
            <span>Messages de Contact</span>
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Consultez et répondez directement aux messages envoyés depuis le formulaire de contact.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <a
            href="/admin/inbox"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-neutral-900 hover:bg-black text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Mail size={13} />
            <span>Ouvrir la Boîte de Réception Complète</span>
          </a>
          <button
            onClick={fetchMessages}
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors text-xs font-medium text-neutral-800 shadow-2xs cursor-pointer"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Liste des messages */}
        <div className="lg:col-span-1 bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-2xs flex flex-col h-[650px]">
          <div className="p-3.5 border-b border-neutral-200 bg-neutral-50/50">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-neutral-400 pointer-events-none" />
              <input 
                type="text" 
                placeholder="Rechercher un message, nom, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-neutral-200 rounded-xl pl-8 pr-3.5 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 transition-colors"
              />
            </div>
          </div>
          
          <div className="overflow-y-auto flex-1 p-2 space-y-1.5" style={{ scrollbarWidth: 'thin' }}>
            {loading ? (
              <div className="text-center py-16 text-neutral-400 text-xs">Chargement des messages...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-neutral-400 text-xs">Aucun message trouvé.</div>
            ) : (
              filtered.map((msg) => {
                const isSelected = selectedMessage?.id === msg.id;
                return (
                  <button
                    key={msg.id}
                    onClick={() => setSelectedMessage(msg)}
                    className={`w-full text-left p-3.5 rounded-xl transition-all cursor-pointer border ${
                      isSelected 
                        ? 'bg-neutral-50 border-neutral-900 shadow-2xs ring-1 ring-neutral-900/10' 
                        : 'hover:bg-neutral-50/70 border-transparent'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-xs font-semibold truncate ${msg.status === 'unread' ? 'text-neutral-950 font-bold' : 'text-neutral-700'}`}>
                        {msg.name}
                      </span>
                      <span className="text-[10px] text-neutral-400 shrink-0 ml-1">
                        {new Date(msg.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-500 line-clamp-2 leading-relaxed mb-2">{msg.message}</div>
                    <div className="flex gap-1.5">
                      {msg.status === 'unread' && (
                        <span className="bg-sky-50 text-sky-700 border border-sky-200 text-[10px] px-2 py-0.2 rounded-full font-semibold uppercase tracking-wider">
                          Nouveau
                        </span>
                      )}
                      {msg.status === 'read' && (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] px-2 py-0.2 rounded-full font-semibold uppercase tracking-wider">
                          Lu
                        </span>
                      )}
                      {msg.status === 'archived' && (
                        <span className="bg-neutral-100 text-neutral-600 border border-neutral-200 text-[10px] px-2 py-0.2 rounded-full font-semibold uppercase tracking-wider">
                          Archivé
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Détail du message */}
        <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-2xl shadow-2xs h-[650px] flex flex-col">
          {selectedMessage ? (
            <>
              <div className="p-5 border-b border-neutral-200 flex justify-between items-start bg-neutral-50/40">
                <div>
                  <h2 className="text-base font-bold text-neutral-900">{selectedMessage.name}</h2>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500 mt-1">
                    <span>Email: <a href={`mailto:${selectedMessage.email}`} className="text-neutral-900 underline underline-offset-2 hover:text-black font-medium">{selectedMessage.email}</a></span>
                    {selectedMessage.phone && <span>• Tél: <strong className="text-neutral-800">{selectedMessage.phone}</strong></span>}
                    <span>• Reçu le {new Date(selectedMessage.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  {selectedMessage.status === 'unread' && (
                    <button 
                      onClick={() => updateStatus(selectedMessage.id, 'read')} 
                      className="p-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer" 
                      title="Marquer comme lu"
                    >
                      <CheckCircle size={15} />
                    </button>
                  )}
                  {selectedMessage.status !== 'archived' && (
                    <button 
                      onClick={() => updateStatus(selectedMessage.id, 'archived')} 
                      className="p-2 bg-neutral-100 text-neutral-700 border border-neutral-200 rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer" 
                      title="Archiver"
                    >
                      <Archive size={15} />
                    </button>
                  )}
                  {selectedMessage.status === 'archived' && (
                    <button 
                      onClick={() => updateStatus(selectedMessage.id, 'read')} 
                      className="p-2 bg-sky-50 text-sky-700 border border-sky-200 rounded-lg hover:bg-sky-100 transition-colors cursor-pointer" 
                      title="Désarchiver"
                    >
                      <Clock size={15} />
                    </button>
                  )}
                </div>
              </div>
              <div className="p-6 flex-1 overflow-y-auto flex flex-col justify-between">
                <div className="bg-[#f8fafc] p-5 rounded-xl text-xs leading-relaxed text-neutral-800 whitespace-pre-wrap border border-neutral-200/80">
                  {selectedMessage.message}
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-2.5 pt-4 border-t border-neutral-100">
                  <a 
                    href={`mailto:${selectedMessage.email}`} 
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-black text-white rounded-lg text-xs font-medium transition-all shadow-xs"
                  >
                    <Mail size={13} />
                    <span>Répondre par Email</span>
                  </a>
                  {selectedMessage.phone && (
                    <a 
                      href={`https://wa.me/${selectedMessage.phone.replace(/[^0-9]/g, '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-1.5 px-4 py-2 border border-neutral-200 text-neutral-800 rounded-lg text-xs font-medium hover:bg-neutral-50 transition-colors shadow-2xs"
                    >
                      <Phone size={13} />
                      <span>Contacter sur WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 gap-2">
              <div className="w-12 h-12 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-400">
                <Mail size={22} />
              </div>
              <p className="text-xs font-semibold text-neutral-700">Sélectionnez un message</p>
              <p className="text-[11px] text-neutral-400">Cliquez sur un message dans la colonne de gauche pour lire son contenu.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
