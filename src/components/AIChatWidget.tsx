'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useChat } from 'ai/react';
import { MessageSquare, X, Send, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import ReactMarkdown from 'react-markdown';

export default function AIChatWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>('');

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

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    body: {
      conversationId,
      sessionId,
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
        content: "Bonjour et bienvenue chez NAY Parfums. Je suis votre Conseiller virtuel. Quel type de parfum recherchez-vous aujourd'hui ?",
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
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (pathname?.includes('/invoice')) {
    return null;
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-[165px] right-4 sm:right-6 w-[380px] max-w-[calc(100vw-2rem)] h-[550px] max-h-[calc(100vh-6rem)] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col z-[100] overflow-hidden print:hidden"
          >
            {/* Header */}
            <div className="bg-[#1A1A1A] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 bg-white"
                  style={{
                    maskImage: 'url("/images/nay/Artboard%202.png")',
                    WebkitMaskImage: 'url("/images/nay/Artboard%202.png")',
                    maskSize: 'contain',
                    WebkitMaskSize: 'contain',
                    maskRepeat: 'no-repeat',
                    WebkitMaskRepeat: 'no-repeat',
                    maskPosition: 'center',
                    WebkitMaskPosition: 'center',
                  }}
                />
                <div className="font-semibold text-[14px]">Conseiller NAY</div>
              </div>
              <button 
                onClick={toggleChat} 
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Fermer la fenêtre du conseiller virtuel"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-[#f8fafc]">
              {messages.map((m) => (
                <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-[#1A1A1A] flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot size={16} className="text-white" />
                    </div>
                  )}
                  <div
                    className={`px-4 py-3 rounded-2xl max-w-[85%] text-[13.5px] leading-relaxed shadow-sm ${
                      m.role === 'user'
                        ? 'bg-[#0ea5e9] text-white rounded-tr-sm'
                        : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'
                    }`}
                  >
                    {m.role === 'user' ? (
                      m.content
                    ) : (
                      <div className="text-gray-800 space-y-2">
                        <ReactMarkdown
                          components={{
                            p: ({ node, ...props }) => (
                              <p className="mb-2 leading-relaxed last:mb-0" {...props} />
                            ),
                            a: ({ node, ...props }) => (
                              <a target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-[#0ea5e9] bg-[#0ea5e9]/10 px-2 py-0.5 rounded-md hover:bg-[#0ea5e9]/20 transition-colors mt-1" {...props} />
                            ),
                            strong: ({ node, ...props }) => (
                              <strong className="font-semibold text-[#111]" {...props} />
                            ),
                            ul: ({ node, ...props }) => (
                              <ul className="pl-5 my-2 space-y-1.5 list-disc marker:text-gray-400" {...props} />
                            ),
                            li: ({ node, ...props }) => (
                              <li className="pl-1 leading-relaxed" {...props} />
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
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-[#1A1A1A] flex items-center justify-center flex-shrink-0">
                    <Bot size={16} className="text-white" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-white border border-gray-100 rounded-tl-sm flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-gray-100">
              <div className="flex items-center gap-2 bg-[#f8fafc] border border-gray-200 rounded-full pr-2 pl-4 py-1">
                <input
                  type="text"
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Posez votre question..."
                  aria-label="Message au conseiller virtuel"
                  className="flex-1 bg-transparent text-[13px] outline-none text-gray-700 py-2"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  aria-label="Envoyer le message"
                  className="w-8 h-8 flex items-center justify-center bg-[#1A1A1A] text-white rounded-full disabled:opacity-50 hover:bg-[#0ea5e9] transition-colors"
                >
                  <Send size={14} className="-ml-0.5" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <button
        onClick={toggleChat}
        aria-label={isOpen ? "Fermer le conseiller virtuel" : "Ouvrir le conseiller virtuel IA"}
        className="fixed bottom-[100px] right-4 sm:right-6 w-14 h-14 bg-[#1A1A1A] text-white rounded-full shadow-xl flex items-center justify-center hover:scale-105 hover:bg-[#0ea5e9] active:scale-95 transition-all z-50 border-2 border-white/10 print:hidden"
      >
        {isOpen ? (
          <X size={24} />
        ) : (
          <div className="relative">
            <MessageSquare size={24} />
            {hasUnread && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-[#1A1A1A] rounded-full" />
            )}
          </div>
        )}
      </button>
    </>
  );
}
