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
  const isAr = currentLocale === 'ar';

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
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isAr ? `تغيير اللغة (الحالية: ${currentLang.name})` : `Changer de langue (actuelle : ${currentLang.name})`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        title={isAr ? `تغيير اللغة (${currentLang.name})` : `Changer de langue (${currentLang.name})`}
        className="flex items-center gap-1.5 text-[12px] font-semibold tracking-wider hover:text-gray-600 transition-colors uppercase cursor-pointer"
      >
        <Globe size={16} aria-hidden="true" />
        <span className="text-[11.5px] font-bold uppercase">{currentLang.code}</span>
        <span className="sr-only">{isAr ? 'تغيير لغة الموقع' : 'Changer la langue du site'}</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0" onClick={() => setIsOpen(false)} aria-hidden="true" />
          <div 
            role="listbox"
            aria-label={isAr ? 'قائمة اللغات' : 'Choix de la langue'}
            className="absolute right-0 rtl:right-auto rtl:left-0 top-full mt-2 w-40 bg-white border border-gray-200 shadow-xl rounded-xl overflow-hidden py-1 z-50"
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                type="button"
                role="option"
                aria-selected={currentLocale === lang.code}
                aria-label={`Passer en ${lang.name}`}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full text-left rtl:text-right px-4 py-2 text-sm flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer ${
                  currentLocale === lang.code ? 'font-bold bg-gray-50 text-[#0284c7]' : 'text-gray-700'
                }`}
                dir={lang.code === 'ar' ? 'rtl' : 'ltr'}
              >
                <span>{lang.name}</span>
                <span aria-hidden="true">{lang.flag}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
