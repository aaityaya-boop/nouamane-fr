import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { detectCannibalization } from '@/lib/seo-ai/topical-authority';
import { AlertOctagon, FileWarning, SearchX, Target } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ContentGapsPage() {
  // 1. Detect Cannibalization
  const cannibalizationIssues = await detectCannibalization();

  // 2. Keyword Gaps (High impressions, no URL)
  const keywordGaps = await prisma.seoKeyword.findMany({
    where: {
      OR: [
        { url: null },
        { url: "" }
      ],
      impressions: { gt: 100 }
    },
    orderBy: { impressions: 'desc' },
    take: 20
  });

  // 3. Topic Gaps (Topics with low coverage - calculated dynamically)
  const allTopics = await prisma.seoTopic.findMany();
  const allTopicKeywords = await prisma.seoTopicKeyword.findMany();
  
  const topics = allTopics.map(t => {
    return {
      ...t,
      keywordCount: allTopicKeywords.filter(tk => tk.topicId === t.id).length
    };
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Content Gaps & Cannibalization</h1>
        <p className="text-muted-foreground mt-2">Identify missing content opportunities and resolve keyword conflicts.</p>
      </div>

      {cannibalizationIssues.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl overflow-hidden shadow-sm">
          <div className="border-b border-red-200 bg-red-100/50 px-6 py-4 flex items-center gap-2">
            <AlertOctagon className="text-red-600" />
            <h3 className="font-semibold text-red-900">Cannibalization Detected ({cannibalizationIssues.length})</h3>
          </div>
          <div className="p-6 divide-y divide-red-100">
            {cannibalizationIssues.map((issue, i) => (
              <div key={i} className="py-4 first:pt-0 last:pb-0">
                <div className="font-bold text-red-900 mb-2">Keyword: {issue.keyword}</div>
                <div className="text-sm text-red-800 mb-2">Multiple URLs competing for this keyword:</div>
                <ul className="list-disc pl-5 space-y-1 text-sm text-red-700 font-mono">
                  {issue.urls.map(url => (
                    <li key={url}>{url}</li>
                  ))}
                </ul>
                <div className="mt-4 p-3 bg-white/50 border border-red-200 rounded text-sm text-red-900">
                  <strong>Recommended Action:</strong> Define a Primary URL and consolidate the supporting URLs using 301 redirects or canonical tags.
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
           <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 flex items-center gap-2">
             <SearchX className="text-orange-500" />
             <h3 className="font-semibold text-gray-900">Keyword & Intent Gaps</h3>
           </div>
           <div className="p-6">
             {keywordGaps.length === 0 ? (
               <p className="text-gray-500 text-sm">No significant keyword gaps found.</p>
             ) : (
               <div className="space-y-4">
                 {keywordGaps.map(kw => (
                   <div key={kw.id} className="p-4 bg-orange-50 border border-orange-100 rounded-lg">
                     <div className="flex justify-between items-start mb-2">
                       <h4 className="font-bold text-gray-900">{kw.keyword}</h4>
                       <span className="text-xs font-semibold px-2 py-1 bg-orange-200 text-orange-800 rounded">
                         {kw.searchIntent}
                       </span>
                     </div>
                     <div className="flex gap-4 text-xs text-gray-600 mb-3">
                       <span>Impressions: {kw.impressions.toLocaleString()}</span>
                       <span>Position: {kw.currentPosition || "-"}</span>
                     </div>
                     <div className="text-sm text-gray-700 bg-white p-2 rounded border border-orange-100">
                       <strong>Action:</strong> Create new content targeting this intent. No existing page ranks well.
                     </div>
                   </div>
                 ))}
               </div>
             )}
           </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
           <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 flex items-center gap-2">
             <Target className="text-blue-500" />
             <h3 className="font-semibold text-gray-900">Topic Gaps</h3>
           </div>
           <div className="p-6">
             <p className="text-sm text-gray-600 mb-6">Topics with mapped keywords that require further pillar content development.</p>
             <div className="space-y-4">
               {topics.filter(t => t.keywordCount > 0).slice(0, 10).map(t => (
                 <div key={t.id} className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex justify-between items-center">
                   <div>
                     <h4 className="font-bold text-gray-900">{t.name}</h4>
                     <p className="text-xs text-gray-500 mt-1">{t.keywordCount} associated keywords</p>
                   </div>
                   <Link
                     href={`/admin/seo/topical-authority/${t.id}`}
                     className="text-xs font-semibold bg-white border border-blue-200 text-blue-700 px-3 py-1.5 rounded hover:bg-blue-100 transition-colors shrink-0"
                   >
                     Analyze Cluster
                   </Link>
                 </div>
               ))}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
