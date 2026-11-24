"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, ExternalLink, X } from "lucide-react";

interface OpportunityData {
  id: string;
  title: string | null;
  keyword: string | null;
  description: string | null;
  recommendation: string | null;
  targetUrl: string | null;
  businessValue: number;
  impact: string;
  effort: string;
  impressions: number | null;
  clicks: number | null;
  status: string;
}

export default function OpportunityDetailsButton({
  opp,
}: {
  opp: OpportunityData;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center gap-1 cursor-pointer"
      >
        View Details <ArrowRight size={14} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-lg p-6 space-y-4 text-left">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700">
                  Value Score: {opp.businessValue} • {opp.status}
                </span>
                <h3 className="text-lg font-bold text-gray-900 mt-1">
                  {opp.title || opp.keyword || "SEO Opportunity"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {opp.description && (
              <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200">
                {opp.description}
              </div>
            )}

            {opp.recommendation && (
              <div className="text-sm text-indigo-950 bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                <strong>Recommended Action:</strong> {opp.recommendation}
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-gray-50 border">
                <div className="text-gray-500">Impact / Effort</div>
                <div className="font-bold text-gray-900 mt-0.5">
                  {opp.impact} / {opp.effort}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-gray-50 border">
                <div className="text-gray-500">Impressions</div>
                <div className="font-bold text-gray-900 mt-0.5">
                  {opp.impressions?.toLocaleString() || "-"}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-gray-50 border">
                <div className="text-gray-500">Clicks</div>
                <div className="font-bold text-gray-900 mt-0.5">
                  {opp.clicks?.toLocaleString() || "-"}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              {opp.targetUrl ? (
                <a
                  href={opp.targetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-indigo-600 hover:underline inline-flex items-center gap-1"
                >
                  Open Target URL <ExternalLink size={12} />
                </a>
              ) : (
                <span />
              )}

              <div className="flex items-center gap-2">
                <Link
                  href="/admin/seo/ai-assistant"
                  className="px-3.5 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
                >
                  Open AI Assistant
                </Link>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
