import React from 'react';
import prisma from '@/lib/prisma';
import { Calendar, CheckCircle2 } from 'lucide-react';
import GenerateBriefButton from './GenerateBriefButton';

export const dynamic = 'force-dynamic';

export default async function ContentStrategyPage() {
  const opportunities = await prisma.seoOpportunity.findMany({
    where: { 
      status: { not: "RESOLVED" }
    },
    orderBy: [
      { priority: 'desc' }
    ]
  });

  // Group into THIS WEEK (High impact, Medium/Low effort), THIS MONTH (High impact, High effort), NEXT
  const thisWeek = opportunities.filter(o => o.impact === 'HIGH' && (o.effort === 'LOW' || o.effort === 'MEDIUM'));
  const thisMonth = opportunities.filter(o => o.impact === 'HIGH' && o.effort === 'HIGH');
  const next = opportunities.filter(o => o.impact !== 'HIGH');

  const renderOpportunityCard = (opp: any, index: number) => (
    <div key={opp.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-700 text-sm">
            {index + 1}
          </div>
          <div>
            <h4 className="font-bold text-gray-900">{opp.keyword || opp.title || "Topic / Content Optimization"}</h4>
            <div className="text-xs text-gray-500 mt-0.5">Type: {opp.type} {opp.targetUrl && `| URL: ${opp.targetUrl}`}</div>
          </div>
        </div>
        <div className="flex gap-2">
          <span className={`text-xs font-semibold px-2 py-1 rounded ${opp.impact === 'HIGH' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
            Impact: {opp.impact}
          </span>
          <span className={`text-xs font-semibold px-2 py-1 rounded ${opp.effort === 'LOW' ? 'bg-green-100 text-green-700' : opp.effort === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
            Effort: {opp.effort}
          </span>
        </div>
      </div>
      
      <div className="bg-gray-50 p-3 rounded-lg border text-sm text-gray-700 mb-4">
        <strong>Action:</strong> {opp.recommendation || "Optimize content and intent matching"}
      </div>

      <div className="flex justify-between items-center border-t pt-4">
        <div className="flex gap-4 text-xs text-gray-500">
          <span>Priority Score: <strong className="text-gray-900">{opp.priority}</strong></span>
          <span>Impressions: <strong className="text-gray-900">{opp.impressions?.toLocaleString() || "-"}</strong></span>
        </div>
        <GenerateBriefButton
          opportunityId={opp.id}
          label={opp.keyword || opp.title || "Content Optimization"}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">SEO Content Strategy</h1>
        <p className="text-muted-foreground mt-2">Prioritized roadmap based on deterministic SEO opportunity scoring.</p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-2 border-b pb-2">
          <CheckCircle2 className="text-emerald-500" />
          <h2 className="text-xl font-bold text-gray-900">This Week</h2>
          <span className="text-sm text-gray-500 ml-2">(High Impact, Low/Medium Effort)</span>
        </div>
        {thisWeek.length === 0 ? (
          <p className="text-gray-500 text-sm">No immediate tasks.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {thisWeek.map((opp, i) => renderOpportunityCard(opp, i))}
          </div>
        )}
      </div>

      <div className="space-y-6 pt-6">
        <div className="flex items-center gap-2 border-b pb-2">
          <Calendar className="text-blue-500" />
          <h2 className="text-xl font-bold text-gray-900">This Month</h2>
          <span className="text-sm text-gray-500 ml-2">(High Impact, High Effort)</span>
        </div>
        {thisMonth.length === 0 ? (
          <p className="text-gray-500 text-sm">No tasks for this month.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {thisMonth.map((opp, i) => renderOpportunityCard(opp, i))}
          </div>
        )}
      </div>

      <div className="space-y-6 pt-6 opacity-75">
        <div className="flex items-center gap-2 border-b pb-2">
          <Calendar className="text-gray-400" />
          <h2 className="text-xl font-bold text-gray-900">Next</h2>
          <span className="text-sm text-gray-500 ml-2">(Medium/Low Impact)</span>
        </div>
        {next.length === 0 ? (
          <p className="text-gray-500 text-sm">No upcoming tasks.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {next.slice(0, 6).map((opp, i) => renderOpportunityCard(opp, i))}
          </div>
        )}
      </div>
    </div>
  );
}
