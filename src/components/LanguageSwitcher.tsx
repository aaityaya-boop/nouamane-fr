'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Globe } from 'lucide-react';
import { useDictionary } from '@/context/DictionaryContext';

const languages = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ar', name: 'العربية', flag: '🇲🇦' }
];

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const dict = useDictionary();
  const [isOpen, setIsOpen] = useState(false);

  // Extract current locale from pathname
  const currentLocale = pathname.split('/')[1];
  const currentLang = languages.find(l => l.code === currentLocale) || languages[0];

  const handleLanguageChange = (newLocale: string) => {
    setIsOpen(false);
    if (newLocale === currentLocale) return;

    const regex = new RegExp(`^/${currentLocale}(/|$)`);
    const newPath = pathname.replace(regex, `/${newLocale}$1`);
    const search = typeof window !== 'undefined' ? window.location.search : '';
    router.push(`${newPath || `/${newLocale}`}${search}`);
  };

  return (
    <div className="relative z-50">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-[12px] font-semibold tracking-wider hover:text-gray-600 transition-colors uppercase"
      >
        <Globe size={16} />
        <span className="hidden md:inline">{currentLang.code}</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-40 bg-white border border-gray-200 shadow-xl rounded-xl overflow-hidden py-1">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-gray-50 transition-colors ${
                  currentLocale === lang.code ? 'font-bold bg-gray-50' : 'text-gray-700'
                }`}
                dir="ltr"
              >
                <span>{lang.name}</span>
                <span>{lang.flag}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
