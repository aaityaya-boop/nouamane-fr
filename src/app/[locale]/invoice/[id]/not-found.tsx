import Link from 'next/link';
import { FileX2, ArrowLeft, Search } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function InvoiceNotFound() {
  return (
    <div className="min-h-screen bg-[#fafaf7] text-[#111827] flex flex-col justify-between">
      <Header />

      <main className="flex-1 pt-36 pb-20 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white border border-[#e3ded3] rounded-3xl p-7 sm:p-9 text-center shadow-[0_12px_36px_-12px_rgba(15,23,42,0.08)]">
          <div className="mx-auto mb-5 w-14 h-14 rounded-2xl bg-[#f4f8fc] border border-sky-100 text-[#0284c7] flex items-center justify-center">
            <FileX2 size={26} strokeWidth={1.7} />
          </div>

          <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#64748b] block">
            Facture introuvable
          </span>

          <h1 className="heading-font text-2xl sm:text-3xl font-extrabold text-[#111827] mt-2 tracking-tight">
            Référence non disponible
          </h1>

          <p className="mt-3 text-[13.5px] text-[#5f5a52] leading-relaxed">
            Cette facture correspond à un aperçu ou à une commande archivée qui n&apos;est plus présente dans notre registre.
          </p>

          <div className="mt-7 space-y-2.5">
            <Link
              href="/fr/suivi-commande"
              className="w-full h-12 px-5 rounded-xl bg-[#111827] hover:bg-[#0284c7] text-white text-[13px] font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Search size={15} />
              <span>Rechercher une commande</span>
            </Link>

            <Link
              href="/fr/shop"
              className="w-full h-11 px-5 rounded-xl bg-[#faf8f4] hover:bg-[#efece4] text-[#111827] border border-[#ded8cc] text-[12.5px] font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Retour à la boutique</span>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
