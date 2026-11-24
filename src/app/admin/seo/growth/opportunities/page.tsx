import React from 'react';
import prisma from '@/lib/prisma';
import { Target, ExternalLink } from 'lucide-react';
import OpportunityDetailsButton from './OpportunityDetailsButton';

export const dynamic = 'force-dynamic';

export default async function TopOpportunitiesPage() {
  const opportunities = await prisma.seoOpportunity.findMany({
    orderBy: { businessValue: 'desc' },
    take: 20
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Top 20 SEO Opportunities</h1>
        <p className="text-muted-foreground mt-2">Highest impact quick wins based on GSC and ecommerce conversion data.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Target size={18} className="text-indigo-500" />
            Prioritized Action List
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-4 text-xs font-semibold text-gray-600 uppercase">Rank</th>
                <th className="p-4 text-xs font-semibold text-gray-600 uppercase">Opportunity</th>
                <th className="p-4 text-xs font-semibold text-gray-600 uppercase">Target URL</th>
                <th className="p-4 text-xs font-semibold text-gray-600 uppercase">Score</th>
                <th className="p-4 text-xs font-semibold text-gray-600 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {opportunities.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    No opportunities found. Run a new analysis.
                  </td>
                </tr>
              ) : (
                opportunities.map((opp, idx) => (
                  <tr key={opp.id} className="hover:bg-gray-50">
                    <td className="p-4 text-sm font-medium text-gray-900">#{idx + 1}</td>
                    <td className="p-4">
                      <div className="font-medium text-gray-900">{opp.title}</div>
                      <div className="text-xs text-gray-500 max-w-md truncate mt-0.5">{opp.description}</div>
                    </td>
                    <td className="p-4 text-sm">
                      {opp.targetUrl ? (
                         <a href={opp.targetUrl} target="_blank" className="text-indigo-600 hover:underline flex items-center gap-1">
                           {new URL(opp.targetUrl, 'https://nayparfum.ma').pathname} <ExternalLink size={12} />
                         </a>
                      ) : '-'}
                    </td>
                    <td className="p-4">
                      <div className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-800">
                        {opp.businessValue}
                      </div>
                    </td>
                    <td className="p-4 text-sm">
                      <OpportunityDetailsButton opp={opp} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
