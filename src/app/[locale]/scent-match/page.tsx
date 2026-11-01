'use client';

import React, { useState, use } from 'react';
import Header from '@/components/Header';
import { useScentMatchSession } from '@/lib/scentMatch/useScentMatchSession';
import { QueueProduct } from '@/lib/scentMatch/types';
import ScentMatchDesktop from '@/components/scentMatch/ScentMatchDesktop';
import ScentMatchMobile from '@/components/scentMatch/ScentMatchMobile';
import ScentMatchResultsView from '@/components/scentMatch/ScentMatchResultsView';
import ScentMatchDetailsModal from '@/components/scentMatch/ScentMatchDetailsModal';
import ScentMatchFilterDrawer from '@/components/scentMatch/ScentMatchFilterDrawer';
import FriendMatchModal from '@/components/scentMatch/FriendMatchModal';

export default function ScentMatchPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = use(params);
  const locale = resolvedParams?.locale || 'fr';
  const isAr = locale === 'ar';

  const {
    sessionId,
    filters,
    updateFilters,
    queue,
    totalEligible,
    currentIndex,
    currentProduct,
    likedProducts,
    passedProducts,
    savedProducts,
    undoStack,
    recommendedSwipes,
    minSwipes,
    isLoadingQueue,
    isAnalyzing,
    analysisResult,
    swipe,
    undo,
    finishAnalysis,
    restart
  } = useScentMatchSession(locale);

  const [detailsProduct, setDetailsProduct] = useState<QueueProduct | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isFriendMatchOpen, setIsFriendMatchOpen] = useState(false);

  return (
    <div className={`min-h-screen flex flex-col bg-[#FAF9F5] dark:bg-[#090d16] text-[#1A1A1A] dark:text-slate-100 ${isAr ? 'font-arabic' : 'font-sans'}`}>
      <Header />

      <main className="flex-1 flex flex-col">
        {analysisResult ? (
          <ScentMatchResultsView
            analysis={analysisResult}
            locale={locale}
            onRestart={restart}
            onOpenFriendMatch={() => setIsFriendMatchOpen(true)}
          />
        ) : (
          <>
            {/* Desktop Experience (lg+) */}
            <div className="hidden lg:block w-full">
              <ScentMatchDesktop
                queue={queue}
                totalEligible={totalEligible}
                currentIndex={currentIndex}
                currentProduct={currentProduct}
                likedProducts={likedProducts}
                passedProducts={passedProducts}
                savedProducts={savedProducts}
                filters={filters}
                onUpdateFilters={updateFilters}
                onOpenFilterDrawer={() => setIsFilterOpen(true)}
                onSwipe={swipe}
                onUndo={undo}
                canUndo={undoStack.length > 0}
                onOpenDetails={(p) => setDetailsProduct(p)}
                onFinishAnalysis={finishAnalysis}
                onOpenFriendMatch={() => setIsFriendMatchOpen(true)}
                isAnalyzing={isAnalyzing}
                recommendedSwipes={recommendedSwipes}
                minSwipes={minSwipes}
                locale={locale}
              />
            </div>

            {/* Mobile Experience (<lg) */}
            <div className="block lg:hidden w-full">
              <ScentMatchMobile
                queue={queue}
                totalEligible={totalEligible}
                currentIndex={currentIndex}
                currentProduct={currentProduct}
                likedProducts={likedProducts}
                passedProducts={passedProducts}
                savedProducts={savedProducts}
                filters={filters}
                onUpdateFilters={updateFilters}
                onOpenFilterDrawer={() => setIsFilterOpen(true)}
                onSwipe={swipe}
                onUndo={undo}
                canUndo={undoStack.length > 0}
                onOpenDetails={(p) => setDetailsProduct(p)}
                onFinishAnalysis={finishAnalysis}
                onOpenFriendMatch={() => setIsFriendMatchOpen(true)}
                isAnalyzing={isAnalyzing}
                recommendedSwipes={recommendedSwipes}
                minSwipes={minSwipes}
                locale={locale}
              />
            </div>
          </>
        )}
      </main>

      {/* Global Modals */}
      <ScentMatchDetailsModal
        product={detailsProduct}
        isOpen={Boolean(detailsProduct)}
        onClose={() => setDetailsProduct(null)}
        locale={locale}
      />

      <ScentMatchFilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onUpdateFilters={updateFilters}
        locale={locale}
        totalEligible={totalEligible}
      />

      <FriendMatchModal
        isOpen={isFriendMatchOpen}
        onClose={() => setIsFriendMatchOpen(false)}
        hostSessionId={sessionId}
        locale={locale}
      />
    </div>
  );
}
