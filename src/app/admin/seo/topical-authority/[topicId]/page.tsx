import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { calculateTopicalAuthorityScore } from '@/lib/seo-ai/topical-authority';
import { ArrowLeft, Target, FileText, Link as LinkIcon, AlertTriangle } from 'lucide-react';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function TopicDetailPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = await params;
  const topic = await prisma.seoTopic.findUnique({
    where: { id: topicId }
  });

  if (!topic) {
    notFound();
  }

  const scoreInfo = await calculateTopicalAuthorityScore(topic.id);
  
  const topicKeywords = await prisma.seoTopicKeyword.findMany({
    where: { topicId: topic.id }
  });
  
  const keywordNames = topicKeywords.map(k => k.keyword);
  const keywordsData = await prisma.seoKeyword.findMany({
    where: { keyword: { in: keywordNames } },
    orderBy: { impressions: 'desc' }
  });

  // Calculate intent distribution
  const intentMap: Record<string, number> = {};
  keywordsData.forEach(k => {
    intentMap[k.searchIntent] = (intentMap[k.searchIntent] || 0) + 1;
  });

  // Gaps (Keywords without URLs)
  const gaps = keywordsData.filter(k => !k.url || k.url.trim() === '');
  const covered = keywordsData.filter(k => k.url && k.url.trim() !== '');

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/admin/seo/topical-authority" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">{topic.name}</h1>
          <p className="text-muted-foreground mt-1">Topic Analysis & Strategy</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
          <div className="text-sm font-medium text-gray-500 mb-1">Authority Score</div>
          <div className="text-3xl font-bold text-gray-900">{scoreInfo?.score || 0}/100</div>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
          <div className="text-sm font-medium text-gray-500 mb-1">Coverage</div>
          <div className="text-3xl font-bold text-gray-900">{scoreInfo?.coverage || 0}%</div>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
          <div className="text-sm font-medium text-gray-500 mb-1">Keywords</div>
          <div className="text-3xl font-bold text-gray-900">{keywordsData.length}</div>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
          <div className="text-sm font-medium text-gray-500 mb-1">Top 10 Rankings</div>
          <div className="text-3xl font-bold text-emerald-600">{scoreInfo?.top10Keywords || 0}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
             <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 flex items-center justify-between">
               <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                 <AlertTriangle size={18} className="text-orange-500" /> Content Gaps ({gaps.length})
               </h3>
             </div>
             <div className="p-6">
               {gaps.length === 0 ? (
                 <p className="text-sm text-gray-500">No content gaps detected. All tracked keywords have a target URL.</p>
               ) : (
                 <div className="space-y-4">
                   {gaps.slice(0, 10).map((g) => (
                     <div key={g.id} className="flex justify-between items-center p-4 bg-orange-50 border border-orange-100 rounded-lg">
                       <div>
                         <div className="font-medium text-gray-900">{g.keyword}</div>
                         <div className="text-xs text-gray-500 mt-1">
                           Intent: {g.searchIntent} | Impressions: {g.impressions.toLocaleString()}
                         </div>
                       </div>
                       <Link
                         href="/admin/blog/new"
                         className="text-xs font-semibold bg-white border border-orange-200 text-orange-700 px-3 py-1.5 rounded hover:bg-orange-100 transition-colors shrink-0"
                       >
                         Create Content
                       </Link>
                     </div>
                   ))}
                   {gaps.length > 10 && (
                     <div className="text-center text-sm text-gray-500 pt-2">+ {gaps.length - 10} more gaps</div>
                   )}
                 </div>
               )}
             </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
             <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 flex items-center justify-between">
               <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                 <Target size={18} className="text-blue-500" /> Ranking URLs
               </h3>
             </div>
             <div className="p-6">
               {covered.length === 0 ? (
                 <p className="text-sm text-gray-500">No ranking URLs found for this topic.</p>
               ) : (
                 <div className="space-y-4">
                   {covered.slice(0, 10).map((c) => (
                     <div key={c.id} className="flex justify-between items-center p-4 bg-blue-50 border border-blue-100 rounded-lg">
                       <div>
                         <div className="font-medium text-gray-900">{c.keyword}</div>
                         <div className="text-xs text-blue-600 mt-1 font-mono">{c.url}</div>
                         <div className="text-xs text-gray-500 mt-1">
                           Position: {c.currentPosition} | Clicks: {c.clicks}
                         </div>
                       </div>
                       <Link
                         href="/admin/seo/ai-assistant"
                         className="text-xs font-semibold bg-white border border-blue-200 text-blue-700 px-3 py-1.5 rounded hover:bg-blue-100 transition-colors shrink-0"
                       >
                         Optimize
                       </Link>
                     </div>
                   ))}
                 </div>
               )}
             </div>
          </div>

        </div>
        
        <div className="space-y-8">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText size={18} className="text-gray-400" /> Intent Distribution
            </h3>
            <div className="space-y-3">
              {Object.entries(intentMap).map(([intent, count]) => (
                <div key={intent}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{intent}</span>
                    <span className="font-medium text-gray-900">{count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div 
                      className="bg-indigo-600 h-2 rounded-full" 
                      style={{ width: `${(count / keywordsData.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <LinkIcon size={18} className="text-gray-400" /> Recommended Actions
            </h3>
            <div className="space-y-4">
               {scoreInfo?.opportunity === 'HIGH' && (
                 <div className="p-3 bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg">
                   <strong>High Opportunity:</strong> Create a Pillar Page for this topic immediately to capture unserved Moroccan demand.
                 </div>
               )}
               {gaps.length > 5 && (
                 <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg">
                   <strong>Content Gap:</strong> Missing {gaps.length} important subtopics. Generate AI Briefs for top 3 missing intents.
                 </div>
               )}
               {covered.length > 0 && (
                 <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-lg">
                   <strong>Internal Linking:</strong> Ensure all {covered.length} covered URLs link back to a central Pillar Page.
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
