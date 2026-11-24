import React from 'react';
import prisma from '@/lib/prisma';
import { FlaskConical } from 'lucide-react';
import NewExperimentButton from './NewExperimentButton';

export const dynamic = 'force-dynamic';

export default async function SeoExperimentsPage() {
  const experiments = await prisma.seoExperiment.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">SEO Experiments</h1>
          <p className="text-muted-foreground mt-2">Track before/after impact of your optimizations.</p>
        </div>
        <NewExperimentButton />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <FlaskConical size={18} className="text-emerald-500" />
            Active & Past Experiments
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-4 text-xs font-semibold text-gray-600 uppercase">Experiment</th>
                <th className="p-4 text-xs font-semibold text-gray-600 uppercase">Target URL</th>
                <th className="p-4 text-xs font-semibold text-gray-600 uppercase">Started</th>
                <th className="p-4 text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="p-4 text-xs font-semibold text-gray-600 uppercase">Impact (Est)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {experiments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    No experiments running. Apply an opportunity to start tracking.
                  </td>
                </tr>
              ) : (
                experiments.map((exp) => (
                  <tr key={exp.id} className="hover:bg-gray-50">
                    <td className="p-4 text-sm font-medium text-gray-900">{exp.name}</td>
                    <td className="p-4 text-sm text-gray-500 max-w-[200px] truncate">{exp.url}</td>
                    <td className="p-4 text-sm text-gray-500">{new Date(exp.startDate).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${exp.status === 'RUNNING' ? 'bg-blue-100 text-blue-800' : exp.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {exp.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm font-semibold text-gray-400">Measuring...</td>
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
