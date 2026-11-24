'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  ALL_ROLES, 
  ROLE_DEPARTMENTS, 
  RoleDepartment, 
  RoleDefinition 
} from '@/lib/auth/rbac/roles';
import { ALL_PERMISSIONS, PERMISSION_MODULES, PermissionModule } from '@/lib/auth/rbac/permissions';
import { 
  ShieldCheck, 
  Users, 
  Search, 
  Filter, 
  ArrowLeft, 
  Check, 
  Key, 
  Layers, 
  ShieldAlert, 
  UserPlus, 
  ChevronDown, 
  ChevronUp,
  Sparkles
} from 'lucide-react';

export default function RolesDirectoryPage() {
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedRoleId, setExpandedRoleId] = useState<string | null>(null);

  // Group all permissions by module for quick lookup
  const permMap = useMemo(() => {
    return new Map(ALL_PERMISSIONS.map((p) => [p.key, p]));
  }, []);

  const filteredRoles = useMemo(() => {
    return ALL_ROLES.filter((role) => {
      const matchDept = selectedDept === 'ALL' || role.department === selectedDept;
      const query = searchQuery.toLowerCase().trim();
      const matchSearch =
        !query ||
        role.name.toLowerCase().includes(query) ||
        role.id.toLowerCase().includes(query) ||
        role.description.toLowerCase().includes(query) ||
        role.department.toLowerCase().includes(query);

      return matchDept && matchSearch;
    });
  }, [selectedDept, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedRoleId(expandedRoleId === id ? null : id);
  };

  return (
    <div className="p-5 sm:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Executive Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/team"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-sky-700 transition-colors bg-white hover:bg-sky-50 border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs"
            >
              <ArrowLeft size={13} />
              <span>Retour à l&apos;Équipe</span>
            </Link>
            <span className="text-[10px] font-bold uppercase tracking-widest text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
              NAY PARFUMS • {ALL_ROLES.length} RÔLES &amp; {ALL_PERMISSIONS.length} PERMISSIONS
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="text-sky-600" size={26} />
            <span>Annuaire des Rôles &amp; Matrice RBAC</span>
          </h1>
          <p className="text-[13px] text-slate-500">
            Architecture complète des {ALL_ROLES.length} rôles opérationnels NAY Parfums classés par département avec leurs droits par défaut.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/team?openNew=true"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] hover:from-[#0284c7] hover:to-[#0369a1] text-white font-semibold text-xs transition-all shadow-sm"
          >
            <UserPlus size={14} />
            <span>Ajouter un Collaborateur</span>
          </Link>
        </div>
      </div>

      {/* Hero KPI Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 nay-stagger">
        <div className="nay-hero-shine nay-card-lift rounded-2xl p-5 bg-gradient-to-br from-[#0ea5e9] via-[#0284c7] to-[#0369a1] text-white shadow-md">
          <div className="text-[11px] font-bold uppercase tracking-wider text-sky-100 flex items-center gap-1.5">
            <ShieldCheck size={14} />
            <span>Architecture RBAC</span>
          </div>
          <div className="text-3xl font-extrabold mt-2 tabular-nums">
            {ALL_ROLES.length} <span className="text-sm font-semibold text-sky-100">rôles</span>
          </div>
          <div className="text-[11px] text-sky-50 mt-2">
            Répartis sur {ROLE_DEPARTMENTS.length} départements opérationnels
          </div>
        </div>

        <div className="nay-card-lift bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Key size={13} className="text-sky-600" />
              <span>Clés de Sécurité</span>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 mt-2 tabular-nums">
              {ALL_PERMISSIONS.length}
            </div>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            Permissions granulaires réparties sur {PERMISSION_MODULES.length} modules
          </div>
        </div>

        <div className="nay-card-lift bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Layers size={13} className="text-sky-600" />
              <span>Vue Filtrée</span>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 mt-2 tabular-nums">
              {filteredRoles.length}
            </div>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            {selectedDept === 'ALL' ? 'Tous départements affichés' : `Département : ${selectedDept}`}
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
        {/* Department Pills */}
        <div className="flex flex-wrap items-center gap-2 pb-1">
          <button
            onClick={() => setSelectedDept('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap border cursor-pointer ${
              selectedDept === 'ALL'
                ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                : 'bg-white text-slate-600 hover:text-sky-700 hover:bg-sky-50 border-slate-200'
            }`}
          >
            Tous ({ALL_ROLES.length})
          </button>
          {ROLE_DEPARTMENTS.map((dept) => {
            const count = ALL_ROLES.filter((r) => r.department === dept).length;
            const isSelected = selectedDept === dept;
            return (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 border cursor-pointer ${
                  isSelected
                    ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                    : 'bg-white text-slate-600 hover:text-sky-700 hover:bg-sky-50 border-slate-200'
                }`}
              >
                <span>{dept}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-sky-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            type="text"
            placeholder="Rechercher un rôle par titre, identifiant ou description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50/70 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-sky-500 transition-colors"
          />
        </div>
      </div>

      {/* Roles Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 nay-stagger">
        {filteredRoles.map((role) => {
          const isExpanded = expandedRoleId === role.id;
          const isOwnerRole = role.isOwnerRole;

          // Group permissions of this role by module
          const roleModulesMap: Record<string, typeof ALL_PERMISSIONS> = {};
          role.defaultPermissions.forEach((key) => {
            const def = permMap.get(key);
            if (def) {
              if (!roleModulesMap[def.module]) roleModulesMap[def.module] = [];
              roleModulesMap[def.module].push(def);
            }
          });

          return (
            <div
              key={role.id}
              className={`nay-card-lift bg-white border rounded-2xl p-5 flex flex-col justify-between transition-all shadow-2xs ${
                isOwnerRole
                  ? 'border-sky-300 ring-1 ring-sky-100'
                  : 'border-slate-200 hover:border-sky-300'
              }`}
            >
              <div className="space-y-3.5">
                {/* Badge Header */}
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-lg border ${role.badgeBg} ${role.badgeText} ${role.badgeBorder}`}>
                    {role.department}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {role.id}
                  </span>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    {isOwnerRole && <Sparkles size={14} className="text-sky-600 shrink-0" />}
                    <span>{role.name}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {role.description}
                  </p>
                </div>

                {/* Stats / Permissions count */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-600 font-medium">
                    <Key size={13} className="text-sky-600" />
                    <span>Permissions par défaut</span>
                  </div>
                  <span className="font-bold text-slate-900 bg-white border border-slate-200 px-2.5 py-0.5 rounded-lg text-[11px]">
                    {isOwnerRole ? `Toutes (${ALL_PERMISSIONS.length})` : `${role.defaultPermissions.length} clés`}
                  </span>
                </div>

                {/* Permissions Breakdown when Expanded */}
                {isExpanded && (
                  <div className="pt-3 border-t border-slate-100 space-y-2.5">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Modules &amp; Actions autorisées :
                    </div>
                    {isOwnerRole ? (
                      <div className="text-xs text-sky-900 bg-sky-50 border border-sky-200 p-3 rounded-xl flex items-center gap-2">
                        <Sparkles size={14} className="shrink-0 text-sky-600" />
                        <span>Accès irrévocable à 100% des modules, logs, finances et configuration système.</span>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-52 overflow-y-auto pr-1 text-xs">
                        {Object.entries(roleModulesMap).map(([modId, perms]) => {
                          const modMeta = PERMISSION_MODULES.find((m) => m.id === modId);
                          return (
                            <div key={modId} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                              <div className="text-[10px] font-bold text-slate-800 uppercase mb-1">
                                {modMeta?.label || modId} ({perms.length})
                              </div>
                              <div className="space-y-1">
                                {perms.map((p) => (
                                  <div key={p.key} className="flex items-start gap-1.5 text-[11px] text-slate-700">
                                    <Check size={12} className="text-emerald-600 mt-0.5 shrink-0" />
                                    <span>{p.label}</span>
                                    {p.isSensitive && (
                                      <span className="text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-1 py-0.2 rounded shrink-0">
                                        Sensible
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => toggleExpand(role.id)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-sky-700 transition-colors cursor-pointer"
                >
                  <span>{isExpanded ? 'Masquer' : 'Détails permissions'}</span>
                  {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>

                <Link
                  href={`/admin/team?role=${role.id}&openNew=true`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-600 text-sky-700 hover:text-white font-semibold text-xs transition-all border border-sky-200 hover:border-sky-600"
                >
                  <UserPlus size={12} />
                  <span>Assigner</span>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
