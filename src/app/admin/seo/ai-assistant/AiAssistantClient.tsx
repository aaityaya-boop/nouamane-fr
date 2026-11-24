"use client";

import React, { useState } from "react";
import { Sparkles, Brain, Search, Package, CheckCircle2 } from "lucide-react";

export default function AiAssistantClient({ keywords, products }: { keywords: any[], products: any[] }) {
  const [activeTab, setActiveTab] = useState("keyword");
  const [selectedKeywordId, setSelectedKeywordId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [applyStatus, setApplyStatus] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeKeyword = async () => {
    if (!selectedKeywordId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/seo/ai/analyze-keyword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywordId: selectedKeywordId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const optimizeProduct = async () => {
    if (!selectedProductId) return;
    setIsLoading(true);
    setError(null);
    setApplyStatus(null);
    try {
      const res = await fetch("/api/admin/seo/ai/product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: Number(selectedProductId) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyToProduct = async () => {
    if (!selectedProductId || !result?.aiAnalysis) return;
    setIsApplying(true);
    setError(null);
    setApplyStatus(null);
    try {
      const res = await fetch("/api/admin/seo/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: Number(selectedProductId),
          seoTitle: result.aiAnalysis.seoTitle,
          metaDescription: result.aiAnalysis.metaDescription,
          focusKeyword: result.aiAnalysis.focusKeyword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to apply SEO metadata");
      setApplyStatus("SEO Title, Meta Description & Focus Keyword applied to product.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">AI SEO Assistant</h1>
        <p className="text-muted-foreground mt-2">Analyze intents, optimize products, and find opportunities specifically for Morocco.</p>
      </div>

      <div className="flex space-x-2 border-b">
        <button
          onClick={() => { setActiveTab("keyword"); setResult(null); }}
          className={`pb-3 px-4 text-sm font-medium border-b-2 flex items-center gap-2 ${activeTab === "keyword" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
        >
          <Search className="w-4 h-4" /> Keyword Analysis
        </button>
        <button
          onClick={() => { setActiveTab("product"); setResult(null); }}
          className={`pb-3 px-4 text-sm font-medium border-b-2 flex items-center gap-2 ${activeTab === "product" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
        >
          <Package className="w-4 h-4" /> Product Optimizer
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        {activeTab === "keyword" && (
          <div className="max-w-2xl space-y-4">
            <label className="block text-sm font-medium text-gray-700">Select Keyword from GSC to Analyze</label>
            <div className="flex gap-4">
              <select 
                className="flex-1 rounded-md border border-gray-300 p-2.5 text-sm"
                value={selectedKeywordId}
                onChange={(e) => setSelectedKeywordId(e.target.value)}
              >
                <option value="">-- Choose a Keyword --</option>
                {keywords.map(k => (
                  <option key={k.id} value={k.id}>{k.keyword}</option>
                ))}
              </select>
              <button 
                onClick={analyzeKeyword}
                disabled={isLoading || !selectedKeywordId}
                className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Brain className="w-4 h-4" /> {isLoading ? "Analyzing..." : "Analyze"}
              </button>
            </div>
          </div>
        )}

        {activeTab === "product" && (
          <div className="max-w-2xl space-y-4">
            <label className="block text-sm font-medium text-gray-700">Select Product to Optimize</label>
            <div className="flex gap-4">
              <select 
                className="flex-1 rounded-md border border-gray-300 p-2.5 text-sm"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
              >
                <option value="">-- Choose a Product --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <button 
                onClick={optimizeProduct}
                disabled={isLoading || !selectedProductId}
                className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> {isLoading ? "Optimizing..." : "Optimize"}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {result && activeTab === "keyword" && (
          <div className="mt-8 border-t pt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Analysis Result</h3>
              <div className="bg-gray-50 p-4 rounded-lg border text-sm space-y-2">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">Determined Intent</span>
                  <span className="font-semibold text-indigo-700">{result.aiAnalysis.intent.intent}</span>
                </div>
                <div className="flex justify-between border-b pb-2 pt-2">
                  <span className="text-gray-500">Confidence</span>
                  <span className="font-semibold text-gray-900">{Math.round(result.aiAnalysis.intent.confidence * 100)}%</span>
                </div>
                <div className="flex justify-between border-b pb-2 pt-2">
                  <span className="text-gray-500">Business Opportunity Score</span>
                  <span className="font-semibold text-green-600">{result.opportunityScore} / 100 ({result.impact})</span>
                </div>
                <div className="pt-2">
                  <span className="block text-gray-500 mb-1">Reasoning</span>
                  <p className="text-gray-800">{result.aiAnalysis.intent.reason}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900">AI Recommendations</h3>
              <ul className="space-y-3">
                {result.aiAnalysis.recommendedActions?.map((action: string, i: number) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-700 bg-blue-50 p-3 rounded border border-blue-100">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    {action}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex justify-end">
                <p className="text-xs text-gray-500 italic">Saved to SeoOpportunity pending review.</p>
              </div>
            </div>
          </div>
        )}

        {result && activeTab === "product" && (
          <div className="mt-8 border-t pt-8 space-y-6">
             <h3 className="text-lg font-bold text-gray-900">AI Optimization Result</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Suggested SEO Title</label>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm font-medium text-blue-900">
                    {result.aiAnalysis.seoTitle}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Focus Keyword</label>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm font-medium text-gray-900">
                    {result.aiAnalysis.focusKeyword}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Suggested Meta Description</label>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm text-blue-900 h-24">
                    {result.aiAnalysis.metaDescription}
                  </div>
                </div>
             </div>
             {applyStatus && (
               <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm font-medium">
                 {applyStatus}
               </div>
             )}
             <div className="flex gap-3 justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setResult(null);
                    setApplyStatus(null);
                  }}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50 cursor-pointer"
                >
                  Reject
                </button>
                <button
                  type="button"
                  disabled={isApplying}
                  onClick={handleApplyToProduct}
                  className="px-4 py-2 text-sm text-white bg-indigo-600 rounded hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isApplying ? "Applying..." : "Apply to Product"}</span>
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

