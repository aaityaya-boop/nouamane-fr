"use client";

import React, { useState } from "react";
import { Play, X, Copy, Check } from "lucide-react";

interface BriefResult {
  id: string;
  title: string;
  h1: string;
  metaDescription: string;
  targetKeywords: string[];
  outline: string[];
  suggestedWordCount: number;
}

export default function GenerateBriefButton({
  opportunityId,
  label,
}: {
  opportunityId: string;
  label: string;
}) {
  const [loading, setLoading] = useState(false);
  const [brief, setBrief] = useState<BriefResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/seo/ai/generate-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunityId }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to generate brief");
      }
      setBrief(json.data);
    } catch (err: any) {
      setError(err.message || "Error generating brief");
    } finally {
      setLoading(false);
    }
  };

  const copyBriefText = () => {
    if (!brief) return;
    const text = [
      `SEO Title: ${brief.title}`,
      `H1: ${brief.h1}`,
      `Meta Description: ${brief.metaDescription}`,
      `Keywords: ${brief.targetKeywords.join(", ")}`,
      `Target Word Count: ${brief.suggestedWordCount}`,
      `Outline:\n${brief.outline.map((item, idx) => `${idx + 1}. ${item}`).join("\n")}`,
    ].join("\n\n");
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading}
        className="flex items-center gap-1.5 text-xs font-semibold bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors cursor-pointer"
      >
        <Play size={14} />
        <span>{loading ? "Generating..." : "Generate AI Brief"}</span>
      </button>

      {error && (
        <span className="text-xs text-rose-600 font-medium ml-2">{error}</span>
      )}

      {brief && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-xl p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                  AI Content Brief • {label}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mt-0.5">
                  {brief.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setBrief(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                <div className="text-[11px] font-bold uppercase text-gray-500">H1 Heading</div>
                <div className="font-semibold text-gray-900 mt-0.5">{brief.h1}</div>
              </div>

              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                <div className="text-[11px] font-bold uppercase text-gray-500">Meta Description</div>
                <div className="text-gray-700 mt-0.5">{brief.metaDescription}</div>
              </div>

              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                <div className="text-[11px] font-bold uppercase text-gray-500 mb-1.5">
                  Recommended Structure ({brief.suggestedWordCount} words)
                </div>
                <ol className="list-decimal pl-5 space-y-1 text-gray-700">
                  {brief.outline.map((sec, idx) => (
                    <li key={idx}>{sec}</li>
                  ))}
                </ol>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={copyBriefText}
                className="px-3.5 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 inline-flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                <span>{copied ? "Copied" : "Copy Brief"}</span>
              </button>
              <button
                type="button"
                onClick={() => setBrief(null)}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
