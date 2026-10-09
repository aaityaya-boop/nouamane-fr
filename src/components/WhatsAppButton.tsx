'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function WhatsAppButton() {
  const [url, setUrl] = useState('https://api.whatsapp.com/send?phone=212663380011');
  const [isHovered, setIsHovered] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const isProductPage = pathname?.includes('/product/');

  useEffect(() => {
    setMounted(true);
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data && data.whatsappUrl) {
          setUrl(data.whatsappUrl);
        }
      })
      .catch(console.error);
  }, []);

  const getSmartUrl = () => {
    if (!mounted) return url;
    let text = "Bonjour, j'ai besoin de conseils.";
    if (isProductPage) {
      text = `Bonjour, je suis intéressé(e) par ce parfum : ${window.location.href}`;
    }
    const baseUrl = url.includes('?') ? url : `${url}?`;
    return `${baseUrl}&text=${encodeURIComponent(text)}`;
  };

  const isInvoicePage = pathname?.includes('/invoice');

  if (isProductPage || isInvoicePage) return null;
  if (!mounted) return null; // Avoid rendering until mounted to prevent hydration mismatches on styles/href

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center justify-end print:hidden">
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, x: 10, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.9 }}
            className="mr-4 bg-white text-[#1A1A1A] text-[12px] font-semibold tracking-wide px-5 py-3 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-[#e0ddd4] whitespace-nowrap"
          >
            Besoin d'aide ?
          </motion.div>
        )}
      </AnimatePresence>

      <motion.a
        href={getSmartUrl()}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative flex items-center justify-center w-[60px] h-[60px] bg-[#1A1A1A] text-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:bg-black transition-colors focus:outline-none"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.5 }}
        aria-label="Contactez-nous sur WhatsApp"
      >
        {/* Subtle Pulse Ring */}
        <motion.div
          className="absolute inset-0 rounded-full border border-[#1A1A1A] opacity-20"
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0, 0.2] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
        
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-7 h-7"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51h-.57c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </motion.a>
    </div>
  );
}
