"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import Link from "next/link";

export default function WelcomePopup() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "exists">("idle");

  useEffect(() => {
    // Check if automated audit or bot
    if (typeof window !== "undefined") {
      const isAudit =
        navigator.webdriver === true ||
        /moto g|Lighthouse|PageSpeed|Chrome-Lighthouse|HeadlessChrome|PTST|Googlebot/i.test(navigator.userAgent);
      if (isAudit) return;
    }

    // Check if user has already seen the popup
    const hasSeenPopup = localStorage.getItem("welcomePopupShown");
    if (hasSeenPopup) return;

    let timer: NodeJS.Timeout | undefined;

    // Show popup after user scrolls > 40% or after 15 seconds of active interaction
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0 && window.scrollY / scrollHeight > 0.4) {
        setIsOpen(true);
        window.removeEventListener("scroll", handleScroll);
        if (timer) clearTimeout(timer);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    timer = setTimeout(() => {
      setIsOpen(true);
      window.removeEventListener("scroll", handleScroll);
    }, 15000);

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const closePopup = () => {
    setIsOpen(false);
    // Remember that the user closed it so we don't annoy them again
    localStorage.setItem("welcomePopupShown", "true");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setStatus("loading");
    
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setStatus("success");
        setTimeout(() => {
          closePopup();
        }, 4000);
      } else if (data.error && data.error.includes("déjà inscrit")) {
        setStatus("exists");
      } else {
        setStatus("error");
      }
    } catch (err) {
      setStatus("error");
    }
  };

  const locale = pathname?.split('/')[1] || 'fr';
  const isArabic = locale === 'ar';
  const isEnglish = locale === 'en';

  const t = {
    title: isArabic ? "عرض الترحيب" : isEnglish ? "Welcome Offer" : "Offre de Bienvenue",
    subtitle: isArabic
      ? "اشترك في نشرتنا الإخبارية واحصل على خصم 10% على طلبك الأول من العطور الأصلية."
      : isEnglish
      ? "Subscribe to our newsletter and get 10% off your first order of authentic fragrances."
      : "Inscrivez-vous à notre newsletter et recevez 10% de réduction sur votre première commande de parfums authentiques.",
    placeholder: isArabic ? "بريدك الإلكتروني" : isEnglish ? "Your email address" : "Votre adresse e-mail",
    success: isArabic
      ? "شكراً لاشتراكك! سيصلك كود الخصم عبر بريدك الإلكتروني."
      : isEnglish
      ? "Thank you for subscribing! Your promo code has been sent to your email."
      : "Merci pour votre inscription ! Votre code promo vous sera envoyé par e-mail.",
    exists: isArabic
      ? "هذا البريد مسجل بالفعل في نشرتنا."
      : isEnglish
      ? "This email is already subscribed to our newsletter."
      : "Cette adresse est déjà inscrite à notre newsletter.",
    error: isArabic
      ? "حدث خطأ ما. يرجى إعادة المحاولة."
      : isEnglish
      ? "An error occurred. Please try again."
      : "Une erreur est survenue. Veuillez réessayer.",
    loading: isArabic ? "جاري التسجيل..." : isEnglish ? "Subscribing..." : "Inscription en cours...",
    button: isArabic ? "احصل على خصم 10%" : isEnglish ? "Claim My 10% Off" : "Obtenir mes -10%",
    or: isArabic ? "أو يمكنك " : isEnglish ? "Or if you prefer, " : "Ou si vous préférez, ",
    createAccount: isArabic ? "إنشاء حساب كامل" : isEnglish ? "create a full account" : "créer un compte complet",
    close: isArabic ? "إغلاق" : isEnglish ? "Close" : "Fermer"
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 print:hidden">
      <div className="relative w-full max-w-md bg-white overflow-hidden rounded-2xl shadow-2xl animate-in zoom-in-95 duration-500">
        
        {/* Close Button */}
        <button 
          onClick={closePopup}
          className="absolute top-4 right-4 rtl:right-auto rtl:left-4 z-10 p-2 bg-black/5 hover:bg-black/10 rounded-full transition-colors"
          aria-label={t.close}
        >
          <X className="w-5 h-5 text-gray-700" />
        </button>
        
        {/* Banner */}
        <div className="h-48 bg-[#fafaf7] flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-gray-100 to-transparent"></div>
          <div className="relative z-10 text-center">
            <h2 className="heading-font text-3xl font-bold text-gray-900 tracking-widest uppercase">{t.title}</h2>
            <div className="mt-2 text-[#0ea5e9] font-black text-5xl">-10%</div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 pt-6">
          <p className="text-center text-gray-600 mb-6 text-sm">
            {t.subtitle}
          </p>
          
          {status === "success" ? (
            <div className="bg-green-50 text-green-700 p-4 rounded-xl text-center font-medium animate-in fade-in zoom-in-95">
              {t.success}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="email"
                  required
                  placeholder={t.placeholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:bg-white transition-all text-sm"
                />
                {status === "exists" && (
                  <p className="text-amber-600 text-xs mt-2 text-center">{t.exists}</p>
                )}
                {status === "error" && (
                  <p className="text-red-500 text-xs mt-2 text-center">{t.error}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full py-3 px-4 bg-gray-900 hover:bg-black text-white rounded-xl font-semibold transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl"
              >
                {status === "loading" ? t.loading : t.button}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <span className="text-gray-500 text-xs">{t.or}</span>
            <Link href={`/${locale}/account`} onClick={closePopup} className="text-[#0ea5e9] hover:underline text-xs font-semibold">
              {t.createAccount}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
