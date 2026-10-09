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
    // Check if user has already seen the popup
    const hasSeenPopup = localStorage.getItem("welcomePopupShown");
    
    // Only show if not seen before
    if (!hasSeenPopup) {
      // Show popup after 5 seconds
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
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

  if (!isOpen || pathname?.includes('/invoice')) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 print:hidden">
      <div className="relative w-full max-w-md bg-white overflow-hidden rounded-2xl shadow-2xl animate-in zoom-in-95 duration-500">
        
        {/* Close Button */}
        <button 
          onClick={closePopup}
          className="absolute top-4 right-4 z-10 p-2 bg-black/5 hover:bg-black/10 rounded-full transition-colors"
          aria-label="Fermer"
        >
          <X className="w-5 h-5 text-gray-700" />
        </button>
        
        {/* Banner */}
        <div className="h-48 bg-[#fafaf7] flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-gray-100 to-transparent"></div>
          <div className="relative z-10 text-center">
            <h2 className="heading-font text-3xl font-bold text-gray-900 tracking-widest uppercase">Offre de Bienvenue</h2>
            <div className="mt-2 text-[#0ea5e9] font-black text-5xl">-10%</div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 pt-6">
          <p className="text-center text-gray-600 mb-6 text-sm">
            Inscrivez-vous à notre newsletter et recevez 10% de réduction sur votre première commande de parfums authentiques.
          </p>
          
          {status === "success" ? (
            <div className="bg-green-50 text-green-700 p-4 rounded-xl text-center font-medium animate-in fade-in zoom-in-95">
              Merci pour votre inscription ! Votre code promo vous sera envoyé par e-mail.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="email"
                  required
                  placeholder="Votre adresse e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:bg-white transition-all text-sm"
                />
                {status === "exists" && (
                  <p className="text-amber-600 text-xs mt-2 text-center">Cette adresse est déjà inscrite à notre newsletter.</p>
                )}
                {status === "error" && (
                  <p className="text-red-500 text-xs mt-2 text-center">Une erreur est survenue. Veuillez réessayer.</p>
                )}
              </div>
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full py-3 px-4 bg-gray-900 hover:bg-black text-white rounded-xl font-semibold transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl"
              >
                {status === "loading" ? "Inscription en cours..." : "Obtenir mes -10%"}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <span className="text-gray-500 text-xs">Ou si vous préférez, </span>
            <Link href="/account" onClick={closePopup} className="text-[#0ea5e9] hover:underline text-xs font-semibold">
              créer un compte complet
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
