'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  ALL_ROLES, 
  ROLE_DEPARTMENTS, 
  getRoleDefinition, 
  RoleDefinition 
} from '@/lib/auth/rbac/roles';
import { 
  ALL_PERMISSIONS, 
  PERMISSION_MODULES, 
  PermissionModule, 
  PermissionDefinition 
} from '@/lib/auth/rbac/permissions';
import { parseCustomPermissions } from '@/lib/auth/rbac/accessControl';
import AdminAccessDenied from '@/components/AdminAccessDenied';
import { 
  ShieldCheck, 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Key, 
  Lock, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  ShieldAlert, 
  Sparkles, 
  ChevronRight, 
  RotateCcw, 
  Save, 
  X, 
  Phone, 
  Mail, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Activity, 
  CheckSquare, 
  Calendar,
  AlertCircle,
  Clock,
  Layers,
  Power,
  Banknote,
  Coins,
  Wallet,
  Trash2,
  LayoutGrid,
  List,
  Building2,
  MessageCircle,
  ArrowUpRight,
  Briefcase,
  Check
} from 'lucide-react';

interface PayrollExpenseSummary {
  id: string;
  title: string;
  amount: number;
  date: string;
  description?: string | null;
  paymentMethod?: string | null;
  creatorName?: string | null;
}

interface PayrollSummaryData {
  monthKey: string;
  monthLabel: string;
  totalMonthlyPayrollMAD: number;
  paidThisMonthMAD: number;
  pendingThisMonthMAD: number;
  paidMemberIds: string[];
  recentExpenses: PayrollExpenseSummary[];
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  jobTitle?: string | null;
  phone?: string | null;
  salary?: number | null;
  salaryType?: string | null;
  status: string;
  avatar?: string | null;
  customPermissions?: string | null;
  lastLoginAt: string | null;
  lastActivityAt: string | null;
  createdAt: string;
  roleDefinition: RoleDefinition;
  effectivePermissionsCount: number;
  isOnline: boolean;
  _count?: {
    assignedTasks: number;
    createdTasks: number;
    activities: number;
  };
}

interface CurrentAdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isOwner?: boolean;
  effectivePermissions?: string[];
}

function TeamManagementContent() {
  const searchParams = useSearchParams();
  const initialRoleParam = searchParams.get('role');
  const openNewParam = searchParams.get('openNew');

  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [payrollData, setPayrollData] = useState<PayrollSummaryData | null>(null);
  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);
  const [selectedPayrollIds, setSelectedPayrollIds] = useState<string[]>([]);
  const [payrollPaymentMethod, setPayrollPaymentMethod] = useState<string>('BANK_TRANSFER');
  const [payrollNote, setPayrollNote] = useState<string>('');
  const [payrollSyncing, setPayrollSyncing] = useState(false);
  const [inspectedMember, setInspectedMember] = useState<TeamMember | null>(null);

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, disabled: 0, online: 0, totalPayrollMAD: 0 });
  const [currentUser, setCurrentUser] = useState<CurrentAdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [isNewMemberModalOpen, setIsNewMemberModalOpen] = useState(openNewParam === 'true');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPermissionsDrawerOpen, setIsPermissionsDrawerOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  // New Member Form
  const [newMemberForm, setNewMemberForm] = useState({
    name: '',
    email: '',
    password: '',
    role: initialRoleParam || 'CUSTOMER_SUPPORT_AGENT',
    jobTitle: '',
    phone: '',
    salary: '' as string | number,
    salaryType: 'MONTHLY',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  });
  const [newMemberLoading, setNewMemberLoading] = useState(false);
  const [newMemberError, setNewMemberError] = useState('');

  // Edit Member Form
  const [editMemberForm, setEditMemberForm] = useState({
    name: '',
    role: '',
    jobTitle: '',
    phone: '',
    salary: 0 as number,
    salaryType: 'MONTHLY',
    avatar: '',
    newPassword: '',
    status: 'ACTIVE',
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete Member State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Granular Permissions State for Drawer
  const [activeModuleTab, setActiveModuleTab] = useState<PermissionModule>('dashboard');
  const [permissionOverrides, setPermissionOverrides] = useState<{ granted: string[]; revoked: string[] }>({
    granted: [],
    revoked: [],
  });
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch Current Admin & Members
  const loadData = async () => {
    try {
      setLoading(true);
      const [authRes, teamRes] = await Promise.all([
        fetch('/api/admin/auth/me'),
        fetch('/api/admin/team'),
      ]);

      if (authRes.ok) {
        const authData = await authRes.json();
        if (authData.success) {
          setCurrentUser(authData.user);
        }
      }

      if (teamRes.ok) {
        const teamData = await teamRes.json();
        if (teamData.success) {
          setMembers(teamData.members || []);
          setStats(teamData.stats || { total: 0, active: 0, disabled: 0, online: 0, totalPayrollMAD: 0 });
        }
      }
    } catch (err) {
      console.error('Error loading team data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        member.name.toLowerCase().includes(q) ||
        member.email.toLowerCase().includes(q) ||
        (member.jobTitle && member.jobTitle.toLowerCase().includes(q)) ||
        member.role.toLowerCase().includes(q);

      const matchesRole = roleFilter === 'ALL' || member.role === roleFilter;
      const matchesStatus = statusFilter === 'ALL' || member.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [members, searchQuery, roleFilter, statusFilter]);

  // Open Edit Modal
  const handleOpenEdit = (member: TeamMember) => {
    setSelectedMember(member);
    setEditMemberForm({
      name: member.name,
      role: member.role,
      jobTitle: member.jobTitle || '',
      phone: member.phone || '',
      salary: member.salary || 0,
      salaryType: member.salaryType || 'MONTHLY',
      avatar: member.avatar || '',
      newPassword: '',
      status: member.status,
    });
    setEditError('');
    setIsEditModalOpen(true);
  };

  // Submit Edit Member
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;

    try {
      setEditLoading(true);
      setEditError('');

      const payload: any = {
        name: editMemberForm.name,
        role: editMemberForm.role,
        jobTitle: editMemberForm.jobTitle,
        phone: editMemberForm.phone,
        salary: Number(editMemberForm.salary) || 0,
        salaryType: editMemberForm.salaryType,
        avatar: editMemberForm.avatar,
        status: editMemberForm.status,
      };

      if (editMemberForm.newPassword) {
        payload.newPassword = editMemberForm.newPassword;
      }

      const res = await fetch(`/api/admin/team/${selectedMember.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error || 'Erreur lors de la mise à jour');
        return;
      }

      showToast(`Profil et rémunération de "${editMemberForm.name}" mis à jour avec succès.`);
      setIsEditModalOpen(false);
      loadData();
    } catch (err: any) {
      setEditError(err.message || 'Erreur réseau');
    } finally {
      setEditLoading(false);
    }
  };

  // Submit Create Member
  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setNewMemberLoading(true);
      setNewMemberError('');

      const payload = {
        ...newMemberForm,
        salary: Number(newMemberForm.salary) || 0,
      };

      const res = await fetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setNewMemberError(data.error || 'Erreur lors de la création du compte');
        return;
      }

      showToast(`Compte créé avec succès pour ${newMemberForm.name} (Salaire: ${payload.salary} MAD) !`);
      setIsNewMemberModalOpen(false);
      setNewMemberForm({
        name: '',
        email: '',
        password: '',
        role: 'CUSTOMER_SUPPORT_AGENT',
        jobTitle: '',
        phone: '',
        salary: '',
        salaryType: 'MONTHLY',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      });
      loadData();
    } catch (err: any) {
      setNewMemberError(err.message || 'Erreur réseau');
    } finally {
      setNewMemberLoading(false);
    }
  };

  // Open Granular Permissions Drawer
  const handleOpenPermissionsDrawer = (member: TeamMember) => {
    setSelectedMember(member);
    const parsed = parseCustomPermissions(member.customPermissions);
    setPermissionOverrides({
      granted: parsed.granted || [],
      revoked: parsed.revoked || [],
    });
    setIsPermissionsDrawerOpen(true);
  };

  // Toggle Single Permission in Drawer
  const handleTogglePermission = (permKey: string, isRoleDefault: boolean) => {
    if (!selectedMember) return;
    const isCurrentlyGranted = permissionOverrides.granted.includes(permKey);
    const isCurrentlyRevoked = permissionOverrides.revoked.includes(permKey);

    // Current effective state
    const isEffectivelyActive = isRoleDefault ? !isCurrentlyRevoked : isCurrentlyGranted;

    if (isEffectivelyActive) {
      // Deactivate it
      if (isRoleDefault) {
        // Mark as revoked
        setPermissionOverrides({
          granted: permissionOverrides.granted.filter((k) => k !== permKey),
          revoked: Array.from(new Set([...permissionOverrides.revoked, permKey])),
        });
      } else {
        // Remove from granted
        setPermissionOverrides({
          ...permissionOverrides,
          granted: permissionOverrides.granted.filter((k) => k !== permKey),
        });
      }
    } else {
      // Activate it
      if (isRoleDefault) {
        // Remove from revoked
        setPermissionOverrides({
          ...permissionOverrides,
          revoked: permissionOverrides.revoked.filter((k) => k !== permKey),
        });
      } else {
        // Add to granted
        setPermissionOverrides({
          revoked: permissionOverrides.revoked.filter((k) => k !== permKey),
          granted: Array.from(new Set([...permissionOverrides.granted, permKey])),
        });
      }
    }
  };

  // Reset Permissions to Role Defaults
  const handleResetToRoleDefaults = async () => {
    if (!selectedMember) return;
    try {
      setSavingPermissions(true);
      const res = await fetch(`/api/admin/team/${selectedMember.id}/reset-permissions`, {
        method: 'POST',
      });
      if (res.ok) {
        setPermissionOverrides({ granted: [], revoked: [] });
        showToast('Permissions réinitialisées aux valeurs par défaut du rôle.');
        loadData();
      }
    } catch (err) {
      console.error('Reset error:', err);
    } finally {
      setSavingPermissions(false);
    }
  };

  // Save Custom Permissions
  const handleSavePermissions = async () => {
    if (!selectedMember) return;
    try {
      setSavingPermissions(true);
      const hasOverrides =
        permissionOverrides.granted.length > 0 || permissionOverrides.revoked.length > 0;

      const res = await fetch(`/api/admin/team/${selectedMember.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customPermissions: hasOverrides ? permissionOverrides : null,
        }),
      });

      if (res.ok) {
        showToast(`Permissions granulaires enregistrées pour ${selectedMember.name}`);
        setIsPermissionsDrawerOpen(false);
        loadData();
      } else {
        const d = await res.json();
        alert(d.error || 'Erreur lors de la sauvegarde des permissions');
      }
    } catch (err) {
      console.error('Save permissions error:', err);
    } finally {
      setSavingPermissions(false);
    }
  };

  // Toggle Active / Disabled Status
  const handleToggleStatus = async (member: TeamMember) => {
    const newStatus = member.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    const confirmMsg =
      newStatus === 'DISABLED'
        ? `Êtes-vous sûr de vouloir DÉSACTIVER l'accès de "${member.name}" ? Il sera immédiatement déconnecté.`
        : `Réactiver l'accès pour "${member.name}" ?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/admin/team/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const d = await res.json();
      if (res.ok) {
        showToast(`Statut de ${member.name} modifié en ${newStatus === 'ACTIVE' ? 'ACTIF' : 'DÉSACTIVÉ'}`);
        loadData();
      } else {
        alert(d.error || 'Erreur lors du changement de statut');
      }
    } catch (err) {
      console.error('Toggle status error:', err);
    }
  };

  // Open Delete Confirmation Modal
  const handleOpenDelete = (member: TeamMember) => {
    setMemberToDelete(member);
    setDeleteError('');
    setIsDeleteModalOpen(true);
  };

  // Execute Delete Member (Permanent or Disable)
  const handleDeleteMember = async (permanent: boolean = true) => {
    if (!memberToDelete) return;
    try {
      setDeleteLoading(true);
      setDeleteError('');

      const url = permanent 
        ? `/api/admin/team/${memberToDelete.id}?permanent=true` 
        : `/api/admin/team/${memberToDelete.id}`;

      const res = await fetch(url, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) {
        setDeleteError(data.error || 'Erreur lors de la suppression du collaborateur');
        return;
      }

      showToast(
        permanent
          ? `Le compte de "${memberToDelete.name}" a été supprimé définitivement.`
          : `Le compte de "${memberToDelete.name}" a été désactivé.`
      );
      setIsDeleteModalOpen(false);
      setIsEditModalOpen(false);
      setMemberToDelete(null);
      loadData();
    } catch (err: any) {
      setDeleteError(err.message || 'Erreur réseau');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Generate random secure password helper
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pwd = 'Nay';
    for (let i = 0; i < 8; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    pwd += '!';
    setNewMemberForm({ ...newMemberForm, password: pwd });
  };

  // Format Salary type label
  const getSalaryTypeLabel = (type?: string | null) => {
    if (type === 'COMMISSION') return 'Fixe + Commission';
    if (type === 'HOURLY') return 'Horaire';
    return 'Mensuel';
  };

  // Avatar presets
  const AVATAR_PRESETS = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80',
  ];

  const loadPayrollData = async () => {
    try {
      const res = await fetch('/api/admin/team/payroll');
      if (res.ok) {
        const data = await res.json();
        setPayrollData(data);
      }
    } catch (err) {
      console.error('Error loading payroll ledger:', err);
    }
  };

  useEffect(() => {
    loadPayrollData();
  }, [members.length]);

  const openPayrollModal = () => {
    const paidIds = new Set(payrollData?.paidMemberIds || []);
    const unpaidSalaried = members
      .filter((m) => m.status === 'ACTIVE' && (m.salary || 0) > 0 && !paidIds.has(m.id))
      .map((m) => m.id);
    setSelectedPayrollIds(unpaidSalaried);
    setIsPayrollModalOpen(true);
  };

  const handleTogglePayrollMember = (id: string) => {
    setSelectedPayrollIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSyncPayrollToFinance = async () => {
    if (selectedPayrollIds.length === 0) {
      showToast('Sélectionnez au moins un collaborateur à verser.');
      return;
    }
    setPayrollSyncing(true);
    try {
      const res = await fetch('/api/admin/team/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberIds: selectedPayrollIds,
          paymentMethod: payrollPaymentMethod,
          notes: payrollNote,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Erreur lors du versement');
        return;
      }
      showToast(data.message || 'Salaires comptabilisés en Finance.');
      setPayrollNote('');
      setIsPayrollModalOpen(false);
      await loadPayrollData();
    } catch {
      showToast('Erreur réseau lors de la synchronisation Finance.');
    } finally {
      setPayrollSyncing(false);
    }
  };

  const formatWhatsappUrl = (phone?: string | null) => {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, '');
    if (!digits) return null;
    if (digits.startsWith('0')) return `https://wa.me/212${digits.slice(1)}`;
    if (digits.startsWith('212')) return `https://wa.me/${digits}`;
    return `https://wa.me/${digits}`;
  };

  const displayedMembers = useMemo(() => {
    if (deptFilter === 'ALL') return filteredMembers;
    return filteredMembers.filter((m) => {
      const roleDef = m.roleDefinition || getRoleDefinition(m.role);
      return roleDef.department === deptFilter;
    });
  }, [filteredMembers, deptFilter]);

  const departmentBreakdown = useMemo(() => {
    const map = new Map<
      string,
      { department: string; count: number; onlineCount: number; payrollMAD: number; tasksCount: number }
    >();
    for (const m of members) {
      const roleDef = m.roleDefinition || getRoleDefinition(m.role);
      const dept = roleDef.department || 'Autres';
      const existing = map.get(dept) || {
        department: dept,
        count: 0,
        onlineCount: 0,
        payrollMAD: 0,
        tasksCount: 0,
      };
      existing.count += 1;
      if (m.isOnline) existing.onlineCount += 1;
      if (m.status === 'ACTIVE') existing.payrollMAD += m.salary || 0;
      existing.tasksCount += m._count?.assignedTasks || 0;
      map.set(dept, existing);
    }
    return Array.from(map.values()).sort((a, b) => b.payrollMAD - a.payrollMAD || b.count - a.count);
  }, [members]);

  const teamMetrics = useMemo(() => {
    const totalAssignedTasks = members.reduce((sum, m) => sum + (m._count?.assignedTasks || 0), 0);
    const totalActivities = members.reduce((sum, m) => sum + (m._count?.activities || 0), 0);
    const customOverridesCount = members.filter((m) => {
      const parsed = parseCustomPermissions(m.customPermissions);
      return (parsed.granted?.length || 0) > 0 || (parsed.revoked?.length || 0) > 0;
    }).length;
    const salariedActiveCount = members.filter((m) => m.status === 'ACTIVE' && (m.salary || 0) > 0).length;
    const avgSalaryMAD =
      salariedActiveCount > 0 ? Math.round((stats.totalPayrollMAD || 0) / salariedActiveCount) : 0;
    const onlinePct = stats.total > 0 ? Math.round((stats.online / stats.total) * 100) : 0;
    const activePct = stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0;
    return {
      totalAssignedTasks,
      totalActivities,
      customOverridesCount,
      salariedActiveCount,
      avgSalaryMAD,
      onlinePct,
      activePct,
    };
  }, [members, stats]);

  // If user does not have permission, show 403
  const canViewTeam =
    currentUser?.isOwner ||
    currentUser?.role === 'HR_ADMIN' ||
    (currentUser?.effectivePermissions || []).includes('team.view');

  if (!loading && currentUser && !canViewTeam) {
    return <AdminAccessDenied requiredPermission="team.view" userRole={currentUser.role} />;
  }

  const canEditTeam =
    currentUser?.isOwner ||
    currentUser?.role === 'HR_ADMIN' ||
    (currentUser?.effectivePermissions || []).includes('team.edit');

  const canCreateTeam =
    currentUser?.isOwner ||
    (currentUser?.effectivePermissions || []).includes('team.create');

  const paidMemberSet = new Set(payrollData?.paidMemberIds || []);
  const pendingSalariedCount = members.filter(
    (m) => m.status === 'ACTIVE' && (m.salary || 0) > 0 && !paidMemberSet.has(m.id)
  ).length;

  return (
    <div className="p-5 sm:p-8 max-w-[1600px] mx-auto text-slate-900 space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700/60 flex items-center gap-2.5 text-xs font-medium animate-in fade-in">
          <CheckCircle2 size={16} className="text-sky-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Executive Top Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-full">
              NAY PARFUMS • HUMAN CAPITAL, PAYROLL &amp; RBAC OS
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{stats.online} collaborateur(s) en direct</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Équipe, Paie &amp; Gouvernance
          </h1>
          <p className="text-[13px] text-slate-500 max-w-xl">
            Pilotez les collaborateurs, la paie en MAD synchronisée avec la Trésorerie, la charge de missions et les 26 rôles RBAC.
          </p>
        </div>

        <div className="flex flex-wrap xl:flex-nowrap items-center gap-2 shrink-0">
          <Link
            href="/admin/tasks"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:border-sky-300 hover:bg-sky-50/40 text-slate-700 text-xs font-semibold transition-all shadow-2xs whitespace-nowrap"
          >
            <CheckSquare size={14} className="text-sky-600" />
            <span>Missions ({teamMetrics.totalAssignedTasks})</span>
          </Link>

          <Link
            href="/admin/team/roles"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:border-sky-300 hover:bg-sky-50/40 text-slate-700 text-xs font-semibold transition-all shadow-2xs whitespace-nowrap"
          >
            <ShieldCheck size={14} className="text-sky-600" />
            <span>Matrice 26 Rôles</span>
          </Link>

          {canEditTeam && (
            <button
              type="button"
              onClick={openPayrollModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 text-xs font-semibold transition-all cursor-pointer shadow-2xs whitespace-nowrap"
            >
              <Wallet size={14} />
              <span>Paie &rarr; Finance</span>
              {pendingSalariedCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-sky-600 text-white text-[10px] font-bold">
                  {pendingSalariedCount}
                </span>
              )}
            </button>
          )}

          {canCreateTeam && (
            <button
              type="button"
              onClick={() => setIsNewMemberModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] hover:from-[#0284c7] hover:to-[#0369a1] text-white text-xs font-semibold transition-all shadow-sm cursor-pointer whitespace-nowrap"
            >
              <UserPlus size={14} />
              <span>Ajouter Collaborateur</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Executive Bento KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 nay-stagger">
        {/* Hero Card: Masse Salariale Mensuelle */}
        <div className="nay-hero-shine nay-card-lift rounded-2xl p-5 bg-gradient-to-br from-[#0ea5e9] via-[#0284c7] to-[#0369a1] text-white shadow-md relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-sky-100 flex items-center gap-1.5">
                <Coins size={13} />
                <span>Masse Salariale Mensuelle</span>
              </div>
              <div className="text-3xl font-extrabold tracking-tight mt-2 tabular-nums">
                {(stats.totalPayrollMAD || 0).toLocaleString('fr-FR')}{' '}
                <span className="text-sm font-semibold text-sky-100">MAD</span>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/20 text-white backdrop-blur-xs">
              {payrollData?.monthLabel || 'Mensuel'}
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between gap-2 text-[11px] text-sky-50">
            <div>
              Moy.{' '}
              <span className="font-bold text-white">
                {teamMetrics.avgSalaryMAD.toLocaleString('fr-FR')} MAD
              </span>
              /salarié • Versé :{' '}
              <span className="font-bold text-white">
                {(payrollData?.paidThisMonthMAD || 0).toLocaleString('fr-FR')} MAD
              </span>
            </div>
            {canEditTeam && (
              <button
                type="button"
                onClick={openPayrollModal}
                style={{ backgroundColor: '#ffffff', color: '#0284c7' }}
                className="px-2.5 py-1 rounded-lg hover:opacity-90 font-bold text-[10px] transition-opacity shrink-0 cursor-pointer shadow-2xs"
              >
                Verser
              </button>
            )}
          </div>
        </div>

        {/* KPI 2: Effectif & Presence Live */}
        <div className="nay-card-lift bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Effectif &amp; Présence Live
              </div>
              <div className="text-3xl font-extrabold text-slate-900 mt-2 tabular-nums">
                {stats.online}
                <span className="text-base font-semibold text-slate-400"> / {stats.total}</span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{teamMetrics.onlinePct}% actifs</span>
            </span>
          </div>

          <div className="mt-4 space-y-1.5">
            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="nay-progress-fill h-full rounded-full bg-emerald-500"
                style={{ width: `${Math.max(teamMetrics.onlinePct, 4)}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-500 flex items-center justify-between">
              <span>{departmentBreakdown.length} pôle(s) opérationnels</span>
              <span className="font-medium text-slate-700">{stats.total} compte(s)</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Comptes & Gouvernance RBAC */}
        <div className="nay-card-lift bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Comptes &amp; Sécurité RBAC
              </div>
              <div className="text-3xl font-extrabold text-slate-900 mt-2 tabular-nums">
                {stats.active}
                <span className="text-sm font-semibold text-slate-400"> actifs</span>
              </div>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                stats.disabled > 0
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-sky-50 text-sky-700 border-sky-200'
              }`}
            >
              {stats.disabled > 0 ? `${stats.disabled} bloqué(s)` : '100% conforme'}
            </span>
          </div>

          <div className="mt-4 space-y-1.5">
            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="nay-progress-fill h-full rounded-full bg-sky-500"
                style={{ width: `${Math.max(teamMetrics.activePct, 4)}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-500 flex items-center justify-between">
              <span>{teamMetrics.customOverridesCount} profil(s) sur-mesure</span>
              <Link href="/admin/team/roles" className="font-semibold text-sky-600 hover:underline">
                26 Rôles &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* KPI 4: Charge Operationnelle & Audit */}
        <div className="nay-card-lift bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Charge &amp; Activité Équipe
              </div>
              <div className="text-3xl font-extrabold text-slate-900 mt-2 tabular-nums">
                {teamMetrics.totalAssignedTasks}
                <span className="text-sm font-semibold text-slate-400"> missions</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
              <Activity size={17} />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>{teamMetrics.totalActivities.toLocaleString('fr-FR')} actions auditées</span>
            <Link
              href="/admin/activity"
              className="inline-flex items-center gap-0.5 font-semibold text-sky-600 hover:text-sky-700"
            >
              <span>Journal</span>
              <ArrowUpRight size={12} />
            </Link>
          </div>
        </div>
      </div>

      {/* Department Org Breakdown Strip */}
      {departmentBreakdown.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Building2 size={15} className="text-sky-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Pôles &amp; Répartition Salariale par Département
              </h2>
            </div>
            {deptFilter !== 'ALL' && (
              <button
                type="button"
                onClick={() => setDeptFilter('ALL')}
                className="text-[11px] font-semibold text-sky-600 hover:text-sky-700 self-start sm:self-auto cursor-pointer"
              >
                Afficher tous les pôles ({members.length})
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {departmentBreakdown.map((dept) => {
              const isSelected = deptFilter === dept.department;
              const payrollSharePct =
                stats.totalPayrollMAD > 0
                  ? Math.round((dept.payrollMAD / stats.totalPayrollMAD) * 100)
                  : Math.round((dept.count / Math.max(members.length, 1)) * 100);
              return (
                <button
                  key={dept.department}
                  type="button"
                  onClick={() =>
                    setDeptFilter(isSelected ? 'ALL' : dept.department)
                  }
                  className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-sky-50 border-sky-400 ring-1 ring-sky-200'
                      : 'bg-slate-50/70 hover:bg-slate-50 border-slate-200/80 hover:border-sky-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {dept.department}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 shrink-0">
                      {dept.count} pers.
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700 tabular-nums">
                      {dept.payrollMAD.toLocaleString('fr-FR')} MAD/m
                    </span>
                    <span className="flex items-center gap-1">
                      {dept.onlineCount > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      )}
                      <span>{dept.onlineCount} en ligne</span>
                    </span>
                  </div>
                  <div className="mt-2 h-1 w-full rounded-full bg-slate-200/80 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-sky-500 transition-all"
                      style={{ width: `${Math.max(payrollSharePct, 6)}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Search, Filters & View Mode Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Rechercher par nom, email, poste, département..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50/60 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-sky-500 transition-colors"
          />
        </div>

        <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full sm:w-auto sm:max-w-[240px] bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">Tous les Rôles ({members.length})</option>
            {ALL_ROLES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">Tous les Statuts</option>
            <option value="ACTIVE">Actifs uniquement</option>
            <option value="DISABLED">Désactivés uniquement</option>
          </select>

          {/* View Switcher: Tableau vs Organigramme Cartes */}
          <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-100 border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-sky-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Vue Tableau Exécutif"
            >
              <List size={13} />
              <span>Liste</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white text-sky-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Vue Organigramme Cartes"
            >
              <LayoutGrid size={13} />
              <span>Organigramme</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              loadData();
              loadPayrollData();
            }}
            className="p-2 rounded-xl bg-white hover:bg-sky-50 text-slate-600 hover:text-sky-700 border border-slate-200 transition-colors cursor-pointer"
            title="Actualiser"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Team Workspace: Table View OR Executive Cards Grid */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl py-16 text-center text-slate-500 shadow-2xs">
          <div className="inline-flex items-center gap-2 text-xs font-medium">
            <RefreshCw size={16} className="animate-spin text-sky-500" />
            <span>Chargement des collaborateurs NAY...</span>
          </div>
        </div>
      ) : displayedMembers.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl py-14 text-center space-y-2 shadow-2xs">
          <Users size={26} className="mx-auto text-slate-300" />
          <div className="text-sm font-semibold text-slate-700">
            Aucun collaborateur trouvé
          </div>
          <p className="text-xs text-slate-500">
            Ajustez vos filtres de rôle, département ou recherche.
          </p>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 nay-stagger">
          {displayedMembers.map((member) => {
            const isOwner = member.role === 'OWNER' || member.role === 'CO_OWNER';
            const roleDef = member.roleDefinition || getRoleDefinition(member.role);
            const isSelf = currentUser?.id === member.id;
            const customOverrides = parseCustomPermissions(member.customPermissions);
            const grantedCount = customOverrides.granted?.length || 0;
            const revokedCount = customOverrides.revoked?.length || 0;
            const isPaidThisMonth = paidMemberSet.has(member.id);
            const waUrl = formatWhatsappUrl(member.phone);

            return (
              <div
                key={member.id}
                className={`nay-card-lift bg-white border rounded-2xl overflow-hidden shadow-2xs flex flex-col justify-between transition-all ${
                  member.status === 'DISABLED'
                    ? 'border-rose-200 opacity-65'
                    : isOwner
                    ? 'border-sky-200 ring-1 ring-sky-100'
                    : 'border-slate-200 hover:border-sky-300'
                }`}
              >
                {/* Top Card Accent */}
                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] text-white flex items-center justify-center text-sm font-bold overflow-hidden shadow-xs">
                          {member.avatar ? (
                            <img
                              src={member.avatar}
                              alt={member.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{member.name.slice(0, 2).toUpperCase()}</span>
                          )}
                        </div>
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                            member.status === 'DISABLED'
                              ? 'bg-rose-500'
                              : member.isOnline
                              ? 'bg-emerald-500'
                              : 'bg-slate-300'
                          }`}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-slate-900 text-sm truncate">
                            {member.name}
                          </h3>
                          {isSelf && (
                            <span className="text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 px-1.5 py-0.2 rounded-md shrink-0">
                              Vous
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">{member.email}</div>
                        <div className="text-[11px] font-medium text-slate-600 mt-0.5 truncate">
                          {member.jobTitle || 'Poste non spécifié'}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setInspectedMember(member)}
                      className="p-1.5 rounded-lg bg-slate-50 hover:bg-sky-50 text-slate-500 hover:text-sky-600 border border-slate-200 transition-colors shrink-0 cursor-pointer"
                      title="Fiche 360° Collaborateur"
                    >
                      <Eye size={14} />
                    </button>
                  </div>

                  {/* Role Pill */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${roleDef.badgeBg} ${roleDef.badgeText} ${roleDef.badgeBorder}`}
                    >
                      <span>{roleDef.name}</span>
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {roleDef.department}
                    </span>
                  </div>

                  {/* Metrics Grid inside Card */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 border border-slate-100 rounded-xl p-3">
                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Salaire</div>
                      <div className="text-xs font-extrabold text-slate-900 mt-0.5 tabular-nums">
                        {(member.salary || 0) > 0
                          ? `${(member.salary || 0).toLocaleString('fr-FR')} MAD`
                          : 'Non défini'}
                      </div>
                      {(member.salary || 0) > 0 && (
                        <span
                          className={`inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            isPaidThisMonth
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isPaidThisMonth ? 'Payé' : 'À verser'}
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Missions</div>
                      <div className="text-xs font-extrabold text-slate-900 mt-0.5">
                        {member._count?.assignedTasks || 0} active(s)
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {member._count?.activities || 0} logs
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">RBAC</div>
                      <div className="text-xs font-extrabold text-slate-900 mt-0.5">
                        {isOwner ? 'Total' : `${member.effectivePermissionsCount} clés`}
                      </div>
                      {(grantedCount > 0 || revokedCount > 0) && (
                        <div className="text-[10px] font-semibold text-sky-600">
                          +{grantedCount} / -{revokedCount}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="text-[11px] font-medium text-slate-500">
                    {member.status === 'DISABLED'
                      ? 'Accès suspendu'
                      : member.isOnline
                      ? 'Actif en ce moment'
                      : member.lastActivityAt
                      ? `Vu ${new Date(member.lastActivityAt).toLocaleDateString('fr-MA', { day: 'numeric', month: 'short' })}`
                      : 'Jamais connecté'}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {waUrl && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                        title="Contacter sur WhatsApp"
                      >
                        <MessageCircle size={13} />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOpenPermissionsDrawer(member)}
                      className="p-1.5 rounded-lg bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 transition-colors cursor-pointer"
                      title="Permissions Granulaires"
                    >
                      <Key size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(member)}
                      className="p-1.5 rounded-lg bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 transition-colors cursor-pointer"
                      title="Modifier"
                    >
                      <Edit3 size={13} />
                    </button>
                    {!isOwner && !isSelf && (
                      <button
                        type="button"
                        onClick={() => handleOpenDelete(member)}
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3.5 px-4">Collaborateur</th>
                  <th className="py-3.5 px-4">Rôle &amp; Département</th>
                  <th className="py-3.5 px-4">Poste &amp; Charge</th>
                  <th className="py-3.5 px-4">Rémunération &amp; Paie</th>
                  <th className="py-3.5 px-4">Statut &amp; Activité</th>
                  <th className="py-3.5 px-4 text-center">Permissions RBAC</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedMembers.map((member) => {
                  const isOwner = member.role === 'OWNER' || member.role === 'CO_OWNER';
                  const roleDef = member.roleDefinition || getRoleDefinition(member.role);
                  const isSelf = currentUser?.id === member.id;
                  const customOverrides = parseCustomPermissions(member.customPermissions);
                  const grantedCount = customOverrides.granted?.length || 0;
                  const revokedCount = customOverrides.revoked?.length || 0;
                  const hasCustomOverrides = grantedCount > 0 || revokedCount > 0;
                  const isPaidThisMonth = paidMemberSet.has(member.id);
                  const waUrl = formatWhatsappUrl(member.phone);

                  return (
                    <tr
                      key={member.id}
                      className={`hover:bg-sky-50/35 transition-colors ${
                        member.status === 'DISABLED' ? 'opacity-55 bg-rose-50/25' : ''
                      }`}
                    >
                      {/* Member Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] text-white flex items-center justify-center text-xs font-bold overflow-hidden shadow-2xs">
                              {member.avatar ? (
                                <img
                                  src={member.avatar}
                                  alt={member.name}
                                  className="w-full h-full object-cover rounded-full"
                                />
                              ) : (
                                <span>{member.name.slice(0, 2).toUpperCase()}</span>
                              )}
                            </div>
                            <span
                              className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                                member.status === 'DISABLED'
                                  ? 'bg-rose-500'
                                  : member.isOnline
                                  ? 'bg-emerald-500'
                                  : 'bg-slate-300'
                              }`}
                            />
                          </div>

                          <div>
                            <button
                              type="button"
                              onClick={() => setInspectedMember(member)}
                              className="font-bold text-slate-900 hover:text-sky-600 flex items-center gap-1.5 text-left transition-colors cursor-pointer"
                            >
                              <span>{member.name}</span>
                              {isSelf && (
                                <span className="text-[10px] bg-sky-50 text-sky-700 border border-sky-200 px-1.5 py-0.2 rounded-md font-semibold">
                                  Vous
                                </span>
                              )}
                            </button>
                            <div className="text-slate-400 text-[11px] flex items-center gap-2 mt-0.5">
                              <span>{member.email}</span>
                              {member.phone && <span>• {member.phone}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role & Department */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold border ${roleDef.badgeBg} ${roleDef.badgeText} ${roleDef.badgeBorder}`}
                          >
                            <span>{roleDef.name}</span>
                          </span>
                          <div className="text-[10px] text-slate-400 font-semibold">
                            {roleDef.department}
                          </div>
                        </div>
                      </td>

                      {/* Job Title / Workload */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-900 font-semibold text-xs">
                          {member.jobTitle || 'Non spécifié'}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{member._count?.assignedTasks || 0} mission(s)</span>
                          <span>•</span>
                          <span>{member._count?.activities || 0} log(s)</span>
                        </div>
                      </td>

                      {/* Salary & Payroll Sync Status */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 tabular-nums">
                              {(member.salary || 0) > 0
                                ? `${(member.salary || 0).toLocaleString('fr-FR')} MAD`
                                : 'Non défini'}
                            </span>
                            {(member.salary || 0) > 0 && member.status === 'ACTIVE' && (
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                                  isPaidThisMonth
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                              >
                                {isPaidThisMonth ? 'Payé Finance' : 'À verser'}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">
                            {getSalaryTypeLabel(member.salaryType)}
                          </div>
                        </div>
                      </td>

                      {/* Status & Activity */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div>
                            {member.status === 'ACTIVE' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                                <CheckCircle2 size={12} />
                                <span>Actif</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700">
                                <XCircle size={12} />
                                <span>Désactivé</span>
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {member.isOnline
                              ? 'En ligne maintenant'
                              : member.lastActivityAt
                              ? `Vu le ${new Date(member.lastActivityAt).toLocaleDateString('fr-MA', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}`
                              : 'Jamais connecté'}
                          </div>
                        </div>
                      </td>

                      {/* Permissions Summary */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center gap-1">
                          <span className="font-mono text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold">
                            {isOwner ? 'Toutes' : `${member.effectivePermissionsCount} clés`}
                          </span>
                          {hasCustomOverrides && !isOwner && (
                            <span className="text-[9px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-1.5 py-0.2 rounded">
                              +{grantedCount} / -{revokedCount} perso
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setInspectedMember(member)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-700 transition-colors cursor-pointer"
                            title="Fiche 360°"
                          >
                            <Eye size={13} />
                          </button>

                          {waUrl && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                              title="Message WhatsApp"
                            >
                              <MessageCircle size={13} />
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenPermissionsDrawer(member)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-700 transition-colors cursor-pointer"
                            title="Permissions"
                          >
                            <Key size={13} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(member)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-700 transition-colors cursor-pointer"
                            title="Modifier"
                          >
                            <Edit3 size={13} />
                          </button>

                          {!isOwner && !isSelf && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(member)}
                                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                  member.status === 'ACTIVE'
                                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                                }`}
                                title={member.status === 'ACTIVE' ? "Désactiver l'accès" : "Réactiver l'accès"}
                              >
                                <Power size={13} />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenDelete(member)}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                                title="Supprimer définitivement"
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: AJOUTER UN COLLABORATEUR */}
      {isNewMemberModalOpen && (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative my-8 text-slate-900 animate-in fade-in">
            <button
              onClick={() => setIsNewMemberModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X size={16} />
            </button>

            <div>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
                  <UserPlus size={16} />
                </div>
                <span>Ajouter un collaborateur</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Identifiants d&apos;accès, rôle attribué et salaire mensuel en MAD.
              </p>
            </div>

            {newMemberError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{newMemberError}</span>
              </div>
            )}

            <form onSubmit={handleCreateMember} className="space-y-3.5 text-xs">
              {/* Avatar Selector */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">Photo de Profil</label>
                <div className="flex items-center gap-3">
                  <img
                    src={typeof newMemberForm.avatar === 'string' ? newMemberForm.avatar : ''}
                    alt="Preview"
                    className="w-10 h-10 rounded-full object-cover border-2 border-sky-200"
                  />
                  <div className="flex items-center gap-2 flex-wrap">
                    {AVATAR_PRESETS.map((av, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setNewMemberForm({ ...newMemberForm, avatar: av })}
                        className={`w-7 h-7 rounded-full overflow-hidden border-2 transition-all ${
                          newMemberForm.avatar === av ? 'border-sky-600 scale-110' : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={av} alt="avatar" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Nom Complet *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Yassine Benali"
                    value={newMemberForm.name}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, name: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Email Professionnel *</label>
                  <input
                    type="email"
                    required
                    placeholder="Ex: yassine@nayparfum.ma"
                    value={newMemberForm.email}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, email: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Rôle Assigné (26 Rôles) *</label>
                <select
                  value={newMemberForm.role}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, role: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500"
                >
                  {ROLE_DEPARTMENTS.map((dept) => {
                    const deptRoles = ALL_ROLES.filter((r) => r.department === dept);
                    return (
                      <optgroup key={dept} label={`--- ${dept} ---`}>
                        {deptRoles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  {getRoleDefinition(newMemberForm.role).description}
                </p>
              </div>

              {/* Job Title & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Poste / Spécialité</label>
                  <input
                    type="text"
                    placeholder="Ex: Confirmateur Casablanca"
                    value={newMemberForm.jobTitle}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, jobTitle: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Téléphone / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="Ex: +212 6 XX XX XX XX"
                    value={newMemberForm.phone}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, phone: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Salary & Salary Type (MAD) */}
              <div className="bg-sky-50/60 p-3.5 rounded-xl border border-sky-200/80 space-y-2.5">
                <div className="flex items-center gap-2 text-sky-900 font-bold">
                  <Banknote size={15} className="text-sky-600" />
                  <span>Rémunération &amp; Salaire (MAD)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Montant du Salaire (MAD)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="100"
                        placeholder="Ex: 6500"
                        value={newMemberForm.salary}
                        onChange={(e) => setNewMemberForm({ ...newMemberForm, salary: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:border-sky-500 pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        MAD
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Type de Rémunération</label>
                    <select
                      value={newMemberForm.salaryType}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, salaryType: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500"
                    >
                      <option value="MONTHLY">Mensuel Fixe</option>
                      <option value="COMMISSION">Fixe + Commission</option>
                      <option value="HOURLY">Par Heure / Prestation</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-slate-700 font-semibold">Mot de Passe Initial *</label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[11px] text-sky-600 hover:text-sky-700 font-semibold underline cursor-pointer"
                  >
                    Générer mot de passe
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Minimum 6 caractères"
                  value={newMemberForm.password}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, password: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNewMemberModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={newMemberLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] hover:from-[#0284c7] hover:to-[#0369a1] text-white text-xs font-semibold shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {newMemberLoading ? <RefreshCw size={13} className="animate-spin" /> : <UserPlus size={13} />}
                  <span>Créer le Compte</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MODIFIER COLLABORATEUR */}
      {isEditModalOpen && selectedMember && (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative my-8 text-slate-900 animate-in fade-in">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100"
            >
              <X size={16} />
            </button>

            <div>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
                  <Edit3 size={15} />
                </div>
                <span>Modifier : {selectedMember.name}</span>
              </h2>
            </div>

            {editError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nom Complet</label>
                <input
                  type="text"
                  required
                  value={editMemberForm.name}
                  onChange={(e) => setEditMemberForm({ ...editMemberForm, name: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Email</label>
                <input
                  type="email"
                  disabled
                  value={selectedMember.email}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Rôle Assigné</label>
                <select
                  value={editMemberForm.role}
                  onChange={(e) => setEditMemberForm({ ...editMemberForm, role: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500"
                >
                  {ROLE_DEPARTMENTS.map((dept) => {
                    const deptRoles = ALL_ROLES.filter((r) => r.department === dept);
                    return (
                      <optgroup key={dept} label={`--- ${dept} ---`}>
                        {deptRoles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Poste</label>
                  <input
                    type="text"
                    value={editMemberForm.jobTitle}
                    onChange={(e) => setEditMemberForm({ ...editMemberForm, jobTitle: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Téléphone</label>
                  <input
                    type="text"
                    value={editMemberForm.phone}
                    onChange={(e) => setEditMemberForm({ ...editMemberForm, phone: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="bg-sky-50/60 p-3.5 rounded-xl border border-sky-200/80 space-y-2.5">
                <div className="flex items-center gap-2 text-sky-900 font-bold">
                  <Banknote size={15} className="text-sky-600" />
                  <span>Rémunération &amp; Salaire (MAD)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Salaire (MAD)</label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={editMemberForm.salary}
                      onChange={(e) => setEditMemberForm({ ...editMemberForm, salary: Number(e.target.value) || 0 })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Type</label>
                    <select
                      value={editMemberForm.salaryType}
                      onChange={(e) => setEditMemberForm({ ...editMemberForm, salaryType: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500"
                    >
                      <option value="MONTHLY">Mensuel Fixe</option>
                      <option value="COMMISSION">Fixe + Commission</option>
                      <option value="HOURLY">Par Heure / Prestation</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nouveau mot de passe (laisser vide si inchangé)</label>
                <input
                  type="text"
                  placeholder="Laisser vide pour ne pas modifier"
                  value={editMemberForm.newPassword}
                  onChange={(e) => setEditMemberForm({ ...editMemberForm, newPassword: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Danger Zone: Delete Option in Edit Modal */}
              {selectedMember.role !== 'OWNER' && selectedMember.role !== 'CO_OWNER' && selectedMember.id !== currentUser?.id && (
                <div className="pt-2 border-t border-slate-100">
                  <div className="bg-rose-50/70 border border-rose-200/80 rounded-xl p-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold text-rose-900 flex items-center gap-1.5">
                        <Trash2 size={13} className="text-rose-600" />
                        <span>Zone de Danger</span>
                      </div>
                      <p className="text-[11px] text-rose-700/90 mt-0.5">
                        Supprimer définitivement le compte ou désactiver les accès de ce collaborateur.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const m = selectedMember;
                        setIsEditModalOpen(false);
                        handleOpenDelete(m);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shrink-0 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Trash2 size={13} />
                      <span>Supprimer</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] hover:from-[#0284c7] hover:to-[#0369a1] text-white text-xs font-semibold shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {editLoading ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                  <span>Enregistrer les modifications</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: SUPPRESSION D'UN COLLABORATEUR                    */}
      {/* ======================================================== */}
      {isDeleteModalOpen && memberToDelete && (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95 text-slate-900">
            <button
              onClick={() => {
                setIsDeleteModalOpen(false);
                setMemberToDelete(null);
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>

            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 size={22} />
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Supprimer le collaborateur
                </h2>
                <p className="text-xs text-slate-500">
                  Cette action aura un impact immédiat sur les accès du collaborateur.
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] text-white flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden">
                {memberToDelete.avatar ? (
                  <img
                    src={memberToDelete.avatar}
                    alt={memberToDelete.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{memberToDelete.name.slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-slate-900 text-xs truncate">
                  {memberToDelete.name}
                </div>
                <div className="text-slate-500 text-[11px] truncate">
                  {memberToDelete.email}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded">
                    {memberToDelete.role}
                  </span>
                  {memberToDelete.jobTitle && (
                    <span className="text-[10px] text-slate-500 truncate">
                      • {memberToDelete.jobTitle}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-1.5 text-xs text-amber-900">
              <div className="font-semibold flex items-center gap-1.5 text-amber-800">
                <AlertCircle size={14} className="shrink-0 text-amber-600" />
                <span>Conséquences de la suppression :</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-800/90 pl-1 leading-relaxed">
                <li>Toutes les sessions actives seront révoquées sur-le-champ.</li>
                <li>Le collaborateur ne pourra plus se connecter au tableau de bord.</li>
                <li>Les historiques d&apos;activité et missions existantes seront conservés dans les audits.</li>
              </ul>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setMemberToDelete(null);
                }}
                className="w-full sm:w-auto px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors text-center order-3 sm:order-1 cursor-pointer"
              >
                Annuler
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end order-1 sm:order-2">
                <button
                  type="button"
                  disabled={deleteLoading}
                  onClick={() => handleDeleteMember(false)}
                  className="w-full sm:w-auto px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors disabled:opacity-50 text-center cursor-pointer"
                >
                  Désactiver uniquement
                </button>

                <button
                  type="button"
                  disabled={deleteLoading}
                  onClick={() => handleDeleteMember(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {deleteLoading ? (
                    <RefreshCw size={13} className="animate-spin" />
                  ) : (
                    <Trash2 size={13} />
                  )}
                  <span>Supprimer Définitivement</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: SYNCHRONISATION PAIE MENSUELLE -> FINANCE         */}
      {/* ======================================================== */}
      {isPayrollModalOpen && (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative my-8 text-slate-900 animate-in fade-in">
            <button
              type="button"
              onClick={() => setIsPayrollModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X size={16} />
            </button>

            <div className="space-y-1 pr-8">
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                <Wallet size={12} />
                <span>Comptabilité Paie &rarr; Charges Finance</span>
              </div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Versement des Salaires — {payrollData?.monthLabel || 'Mois en cours'}
              </h2>
              <p className="text-xs text-slate-500">
                Enregistrez en 1 clic les salaires versés en charges de catégorie{' '}
                <span className="font-mono font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">SALARY</span>{' '}
                dans votre P&amp;L Finance.
              </p>
            </div>

            {/* Summary KPI Strip */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="text-[10px] font-bold uppercase text-slate-400">Masse Totale</div>
                <div className="text-base font-extrabold text-slate-900 mt-0.5 tabular-nums">
                  {(payrollData?.totalMonthlyPayrollMAD ?? stats.totalPayrollMAD ?? 0).toLocaleString('fr-FR')} MAD
                </div>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <div className="text-[10px] font-bold uppercase text-emerald-700">Déjà Versé</div>
                <div className="text-base font-extrabold text-emerald-800 mt-0.5 tabular-nums">
                  {(payrollData?.paidThisMonthMAD || 0).toLocaleString('fr-FR')} MAD
                </div>
              </div>
              <div className="bg-sky-50 border border-sky-200 rounded-xl p-3">
                <div className="text-[10px] font-bold uppercase text-sky-700">Reste à Payer</div>
                <div className="text-base font-extrabold text-sky-800 mt-0.5 tabular-nums">
                  {(payrollData?.pendingThisMonthMAD ?? stats.totalPayrollMAD ?? 0).toLocaleString('fr-FR')} MAD
                </div>
              </div>
            </div>

            {/* Eligible Salaried Members List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Collaborateurs actifs rémunérés
              </div>
              {members.filter((m) => m.status === 'ACTIVE' && (m.salary || 0) > 0).length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-500 text-center">
                  Aucun collaborateur actif n&apos;a encore de salaire configuré (&gt; 0 MAD). Cliquez sur Modifier sur un profil pour renseigner sa rémunération.
                </div>
              ) : (
                members
                  .filter((m) => m.status === 'ACTIVE' && (m.salary || 0) > 0)
                  .map((m) => {
                    const alreadyPaid = paidMemberSet.has(m.id);
                    const checked = selectedPayrollIds.includes(m.id);
                    const rDef = m.roleDefinition || getRoleDefinition(m.role);
                    return (
                      <label
                        key={m.id}
                        className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                          alreadyPaid
                            ? 'bg-emerald-50/50 border-emerald-200 opacity-80'
                            : checked
                            ? 'bg-sky-50 border-sky-300 cursor-pointer'
                            : 'bg-white border-slate-200 hover:border-sky-200 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {alreadyPaid ? (
                            <div className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center shrink-0">
                              <Check size={12} />
                            </div>
                          ) : (
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleTogglePayrollMember(m.id)}
                              className="w-4 h-4 accent-sky-600 rounded shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 truncate">{m.name}</div>
                            <div className="text-[10px] text-slate-500 truncate">
                              {rDef.name} • {getSalaryTypeLabel(m.salaryType)}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-extrabold text-slate-900 tabular-nums">
                            {(m.salary || 0).toLocaleString('fr-FR')} MAD
                          </span>
                          {alreadyPaid && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                              Payé ce mois
                            </span>
                          )}
                        </div>
                      </label>
                    );
                  })
              )}
            </div>

            {/* Payment Method & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-200">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mode de Règlement</label>
                <select
                  value={payrollPaymentMethod}
                  onChange={(e) => setPayrollPaymentMethod(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500"
                >
                  <option value="BANK_TRANSFER">Virement Bancaire</option>
                  <option value="CASH">Espèces / Caisse</option>
                  <option value="CHECK">Chèque Bancaire</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Note Comptable (optionnel)</label>
                <input
                  type="text"
                  placeholder="Ex: Virement Attijari + prime objectif"
                  value={payrollNote}
                  onChange={(e) => setPayrollNote(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Recent Salary Ledger Preview */}
            {payrollData?.recentExpenses && payrollData.recentExpenses.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <span>Derniers versements enregistrés en Finance</span>
                  <Link href="/admin/bills" className="text-sky-600 hover:underline normal-case font-semibold">
                    Ouvrir Charges &amp; Dépenses &rarr;
                  </Link>
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1.5">
                  {payrollData.recentExpenses.slice(0, 4).map((exp) => (
                    <div
                      key={exp.id}
                      className="flex items-center justify-between text-[11px] bg-slate-50 border border-slate-100 rounded-lg px-3 py-2"
                    >
                      <span className="font-semibold text-slate-800 truncate pr-2">{exp.title}</span>
                      <span className="font-bold text-slate-900 shrink-0 tabular-nums">
                        {exp.amount.toLocaleString('fr-FR')} MAD
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsPayrollModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Fermer
              </button>
              <button
                type="button"
                disabled={payrollSyncing || selectedPayrollIds.length === 0}
                onClick={handleSyncPayrollToFinance}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] hover:from-[#0284c7] hover:to-[#0369a1] text-white text-xs font-semibold shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {payrollSyncing ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                <span>Comptabiliser ({selectedPayrollIds.length}) en Finance</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: FICHE 360° COLLABORATEUR                          */}
      {/* ======================================================== */}
      {inspectedMember && (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl relative animate-in fade-in text-slate-900">
            {/* Banner Header */}
            <div className="bg-gradient-to-r from-[#0ea5e9] via-[#0284c7] to-[#0369a1] p-6 text-white relative">
              <button
                type="button"
                onClick={() => setInspectedMember(null)}
                className="absolute top-4 right-4 text-white/80 hover:text-white p-1.5 rounded-lg bg-white/15 hover:bg-white/25 transition-colors"
              >
                <X size={16} />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-lg font-extrabold overflow-hidden shrink-0">
                  {inspectedMember.avatar ? (
                    <img
                      src={inspectedMember.avatar}
                      alt={inspectedMember.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{inspectedMember.name.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-sky-100">
                    {(inspectedMember.roleDefinition || getRoleDefinition(inspectedMember.role)).department}
                  </div>
                  <h2 className="text-lg font-extrabold truncate">{inspectedMember.name}</h2>
                  <p className="text-xs text-sky-100 truncate">
                    {(inspectedMember.roleDefinition || getRoleDefinition(inspectedMember.role)).name} •{' '}
                    {inspectedMember.jobTitle || 'Poste non spécifié'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                {(inspectedMember.roleDefinition || getRoleDefinition(inspectedMember.role)).description}
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Rémunération</div>
                  <div className="text-sm font-extrabold text-slate-900 mt-0.5 tabular-nums">
                    {inspectedMember.salary && inspectedMember.salary > 0
                      ? `${inspectedMember.salary.toLocaleString('fr-FR')} MAD`
                      : 'Non défini'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {getSalaryTypeLabel(inspectedMember.salaryType)}
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Activité &amp; Charge</div>
                  <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                    {inspectedMember._count?.assignedTasks || 0} mission(s)
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {inspectedMember._count?.activities || 0} actions auditées
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Email</span>
                  <span className="font-semibold text-slate-800">{inspectedMember.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Téléphone</span>
                  <span className="font-semibold text-slate-800">{inspectedMember.phone || 'Non renseigné'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Permissions effectives</span>
                  <span className="font-mono font-bold text-sky-700">
                    {inspectedMember.role === 'OWNER' || inspectedMember.role === 'CO_OWNER'
                      ? 'Accès Total (Owner)'
                      : `${inspectedMember.effectivePermissionsCount} clés RBAC`}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-200">
                {formatWhatsappUrl(inspectedMember.phone) && (
                  <a
                    href={formatWhatsappUrl(inspectedMember.phone) || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold"
                  >
                    <MessageCircle size={13} />
                    <span>WhatsApp</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const m = inspectedMember;
                    setInspectedMember(null);
                    handleOpenPermissionsDrawer(m);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-700 font-semibold cursor-pointer"
                >
                  <Key size={13} />
                  <span>Permissions</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const m = inspectedMember;
                    setInspectedMember(null);
                    handleOpenEdit(m);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] text-white font-semibold cursor-pointer"
                >
                  <Edit3 size={13} />
                  <span>Modifier Profil</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DRAWER 3: PERSONNALISATION DES PERMISSIONS GRANULAIRES   */}
      {/* ======================================================== */}
      {isPermissionsDrawerOpen && selectedMember && (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs z-50 flex justify-end">
          <div className="bg-white border-l border-slate-200 w-full max-w-2xl h-full flex flex-col shadow-2xl">
            {/* Drawer Header */}
            <div className="p-5 sm:p-6 border-b border-slate-200 flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200 flex items-center gap-1">
                    <Key size={12} />
                    <span>Permissions Granulaires RBAC</span>
                  </span>
                  <span className="text-xs text-slate-300">•</span>
                  <span className="text-xs text-slate-500 font-mono">{selectedMember.role}</span>
                </div>
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                  {selectedMember.name}
                </h2>
                <p className="text-xs text-slate-500">
                  {selectedMember.role === 'OWNER' || selectedMember.role === 'CO_OWNER'
                    ? "Ce collaborateur est Propriétaire (Owner). Il dispose d'un accès complet et irrévocable à toutes les fonctionnalités."
                    : "Le rôle fournit les permissions par défaut. Vous pouvez accorder ou révoquer individuellement chaque droit d'accès."}
                </p>
              </div>

              <button
                onClick={() => setIsPermissionsDrawerOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Overrides Diff Bar */}
            {selectedMember.role !== 'OWNER' && selectedMember.role !== 'CO_OWNER' && (
              <div className="bg-slate-50 px-6 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="text-slate-500 text-[11px]">Modifications manuelles :</span>
                  {permissionOverrides.granted.length > 0 && (
                    <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[11px]">
                      +{permissionOverrides.granted.length} accordée(s)
                    </span>
                  )}
                  {permissionOverrides.revoked.length > 0 && (
                    <span className="text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 text-[11px]">
                      -{permissionOverrides.revoked.length} révoquée(s)
                    </span>
                  )}
                  {permissionOverrides.granted.length === 0 && permissionOverrides.revoked.length === 0 && (
                    <span className="text-slate-400 italic text-[11px]">Strictement identique au rôle</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleResetToRoleDefaults}
                  disabled={savingPermissions}
                  className="inline-flex items-center gap-1.5 text-xs text-sky-700 hover:text-sky-800 font-semibold transition-colors cursor-pointer"
                >
                  <RotateCcw size={12} />
                  <span>Réinitialiser</span>
                </button>
              </div>
            )}

            {/* Module Tabs */}
            <div className="px-6 pt-2 flex items-center gap-1.5 overflow-x-auto border-b border-slate-200">
              {PERMISSION_MODULES.map((mod) => {
                const isActive = activeModuleTab === mod.id;
                const modPerms = ALL_PERMISSIONS.filter((p) => p.module === mod.id);
                return (
                  <button
                    key={mod.id}
                    onClick={() => setActiveModuleTab(mod.id)}
                    className={`px-3 py-2 text-xs font-semibold rounded-t-xl transition-all whitespace-nowrap flex items-center gap-1.5 border-b-2 cursor-pointer ${
                      isActive
                        ? 'border-sky-600 text-sky-700 bg-sky-50/70'
                        : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <span>{mod.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-sky-200/70 text-sky-800' : 'text-slate-500 bg-slate-200/70'}`}>
                      {modPerms.length}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Module Permissions List */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-2.5">
              {ALL_PERMISSIONS.filter((p) => p.module === activeModuleTab).map((perm) => {
                const roleDef = selectedMember.roleDefinition || getRoleDefinition(selectedMember.role);
                const isRoleDefault = roleDef.defaultPermissions.includes(perm.key);
                const isManuallyGranted = permissionOverrides.granted.includes(perm.key);
                const isManuallyRevoked = permissionOverrides.revoked.includes(perm.key);
                const isOwner = selectedMember.role === 'OWNER' || selectedMember.role === 'CO_OWNER';

                const isEffectiveActive = isOwner || (isRoleDefault ? !isManuallyRevoked : isManuallyGranted);

                return (
                  <div
                    key={perm.key}
                    className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                      isEffectiveActive
                        ? 'bg-white border-sky-200 shadow-2xs'
                        : 'bg-slate-50/60 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-xs">{perm.label}</span>
                        {perm.isSensitive && (
                          <span className="text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.2 rounded">
                            Sensible / Financier
                          </span>
                        )}
                        {isManuallyGranted && (
                          <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded">
                            Accordé manuellement
                          </span>
                        )}
                        {isManuallyRevoked && (
                          <span className="text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.2 rounded">
                            Révoqué manuellement
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        {perm.description}
                      </p>
                      <div className="text-[10px] font-mono text-slate-400">{perm.key}</div>
                    </div>

                    {/* Switch */}
                    <div className="pt-1">
                      {isOwner ? (
                        <span className="text-[11px] font-semibold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-lg border border-sky-200 whitespace-nowrap">
                          Toujours Actif
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleTogglePermission(perm.key, isRoleDefault)}
                          className={`w-10 h-5 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                            isEffectiveActive ? 'bg-sky-600' : 'bg-slate-200'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full bg-white transition-transform shadow-2xs ${
                              isEffectiveActive ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsPermissionsDrawerOpen(false)}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
              >
                Fermer
              </button>

              {selectedMember.role !== 'OWNER' && selectedMember.role !== 'CO_OWNER' && (
                <button
                  type="button"
                  onClick={handleSavePermissions}
                  disabled={savingPermissions}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] hover:from-[#0284c7] hover:to-[#0369a1] text-white font-semibold text-xs shadow-sm disabled:opacity-50 transition-all cursor-pointer"
                >
                  {savingPermissions ? (
                    <RefreshCw size={13} className="animate-spin" />
                  ) : (
                    <Save size={13} />
                  )}
                  <span>Enregistrer les Permissions</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TeamManagementPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-[#888888] flex items-center justify-center gap-2">
          <RefreshCw size={16} className="animate-spin text-sky-400" />
          <span>Chargement de l&apos;équipe NAY...</span>
        </div>
      }
    >
      <TeamManagementContent />
    </Suspense>
  );
}
