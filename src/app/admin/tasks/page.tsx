'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  User, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  RefreshCw, 
  MoreVertical, 
  Trash2, 
  Edit3, 
  MessageSquare, 
  Send, 
  Tag, 
  Flame, 
  ArrowRight, 
  LayoutGrid, 
  List, 
  X, 
  Layers,
  ChevronRight,
  ShieldCheck,
  Check
} from 'lucide-react';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  role: string;
}

interface TaskComment {
  id: string;
  taskId: string;
  userId?: string | null;
  userName: string;
  userAvatar?: string | null;
  content: string;
  createdAt: string;
  user?: AdminUser | null;
}

interface AdminTask {
  id: string;
  title: string;
  description?: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED' | 'CANCELLED';
  dueDate?: string | null;
  createdById?: string | null;
  creatorName: string;
  assignedToId?: string | null;
  assigneeName?: string | null;
  tags?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  creator?: AdminUser | null;
  assignee?: AdminUser | null;
  comments?: TaskComment[];
  _count?: {
    comments: number;
  };
}

interface TaskStats {
  total: number;
  todo: number;
  inProgress: number;
  inReview: number;
  completed: number;
  urgent: number;
  myTasks: number;
}

const PREDEFINED_TAGS = ['Stock', 'Commandes', 'Marketing', 'Fournisseurs', 'VIP', 'Vitrine', 'Urgent', 'SEO'];

const COLUMNS: { id: AdminTask['status']; title: string; color: string; bg: string; dot: string }[] = [
  { id: 'TODO', title: 'À faire', color: 'text-slate-700', bg: 'bg-slate-100/80 border-slate-200', dot: 'bg-slate-400' },
  { id: 'IN_PROGRESS', title: 'En cours', color: 'text-blue-700', bg: 'bg-blue-50/60 border-blue-200/80', dot: 'bg-blue-500' },
  { id: 'IN_REVIEW', title: 'En revue / Vérification', color: 'text-purple-700', bg: 'bg-purple-50/60 border-purple-200/80', dot: 'bg-purple-500' },
  { id: 'COMPLETED', title: 'Terminé', color: 'text-emerald-700', bg: 'bg-emerald-50/60 border-emerald-200/80', dot: 'bg-emerald-500' },
];

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  // Filters
  const [filterAssignee, setFilterAssignee] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Drawers
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditingTask, setIsEditingTask] = useState<AdminTask | null>(null);
  const [selectedTask, setSelectedTask] = useState<AdminTask | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // New/Edit Task Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPriority, setFormPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [formStatus, setFormStatus] = useState<AdminTask['status']>('TODO');
  const [formDueDate, setFormDueDate] = useState('');
  const [formAssignedToId, setFormAssignedToId] = useState('');
  const [formTags, setFormTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Comment Form State
  const [commentText, setCommentText] = useState('');
  const [isSendingComment, setIsSendingComment] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Fetch current user and admin users list
  useEffect(() => {
    async function loadMeta() {
      try {
        const [meRes, usersRes] = await Promise.all([
          fetch('/api/admin/auth/me'),
          fetch('/api/admin/users'),
        ]);

        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.success) setCurrentAdmin(meData.user);
        }

        if (usersRes.ok) {
          const usersData = await usersRes.json();
          if (usersData.success) setUsers(usersData.users || []);
        }
      } catch (err) {
        console.error('Failed to load metadata:', err);
      }
    }
    loadMeta();
  }, []);

  // Fetch Tasks
  const loadTasks = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterAssignee !== 'ALL') params.set('assignedToId', filterAssignee);
      if (filterPriority !== 'ALL') params.set('priority', filterPriority);
      if (filterStatus !== 'ALL') params.set('status', filterStatus);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/admin/tasks?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setTasks(data.tasks || []);
          setStats(data.stats || null);
        }
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filterAssignee, filterPriority, filterStatus, searchQuery]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Open Task Detail Drawer
  const openTaskDetails = async (task: AdminTask) => {
    setSelectedTask(task);
    setIsLoadingDetails(true);
    try {
      const res = await fetch(`/api/admin/tasks/${task.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSelectedTask(data.task);
        }
      }
    } catch (err) {
      console.error('Failed to load full task details:', err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Open Create Modal
  const openCreateModal = () => {
    setIsEditingTask(null);
    setFormTitle('');
    setFormDescription('');
    setFormPriority('MEDIUM');
    setFormStatus('TODO');
    setFormDueDate('');
    setFormAssignedToId(currentAdmin?.id || '');
    setFormTags([]);
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (task: AdminTask) => {
    setIsEditingTask(task);
    setFormTitle(task.title);
    setFormDescription(task.description || '');
    setFormPriority(task.priority);
    setFormStatus(task.status);
    setFormDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
    setFormAssignedToId(task.assignedToId || '');
    setFormTags(task.tags ? task.tags.split(',').map((t) => t.trim()).filter(Boolean) : []);
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  // Toggle Tag in Form
  const toggleTag = (tag: string) => {
    if (formTags.includes(tag)) {
      setFormTags(formTags.filter((t) => t !== tag));
    } else {
      setFormTags([...formTags, tag]);
    }
  };

  const addCustomTag = () => {
    if (!customTagInput.trim()) return;
    const cleanTag = customTagInput.trim();
    if (!formTags.includes(cleanTag)) {
      setFormTags([...formTags, cleanTag]);
    }
    setCustomTagInput('');
  };

  // Save Task (Create or Update)
  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('Veuillez saisir un titre pour la mission.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const payload = {
        title: formTitle.trim(),
        description: formDescription.trim() || null,
        priority: formPriority,
        status: formStatus,
        dueDate: formDueDate || null,
        assignedToId: formAssignedToId || null,
        tags: formTags.length > 0 ? formTags.join(', ') : null,
      };

      const url = isEditingTask ? `/api/admin/tasks/${isEditingTask.id}` : '/api/admin/tasks';
      const method = isEditingTask ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsCreateModalOpen(false);
        loadTasks(false);
        if (selectedTask && isEditingTask && selectedTask.id === isEditingTask.id) {
          setSelectedTask(data.task);
        }
      } else {
        setFormError(data.error || 'Erreur lors de l\'enregistrement de la mission.');
      }
    } catch (err) {
      setFormError('Erreur réseau lors de la sauvegarde.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Status Change
  const updateTaskStatus = async (taskId: string, newStatus: AdminTask['status'], e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask({ ...selectedTask, status: newStatus });
      }

      const res = await fetch(`/api/admin/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        loadTasks(false);
      }
    } catch (err) {
      console.error('Error changing task status:', err);
    }
  };

  // Delete Task
  const deleteTask = async (taskId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette mission ?')) return;

    try {
      const res = await fetch(`/api/admin/tasks/${taskId}`, { method: 'DELETE' });
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        if (selectedTask && selectedTask.id === taskId) {
          setSelectedTask(null);
        }
        loadTasks(false);
      }
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  // Send Comment
  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedTask) return;

    setIsSendingComment(true);
    try {
      const res = await fetch(`/api/admin/tasks/${selectedTask.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentText.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCommentText('');
        setSelectedTask((prev) => {
          if (!prev) return prev;
          const currentComments = prev.comments || [];
          return {
            ...prev,
            comments: [...currentComments, data.comment],
            _count: { comments: (prev._count?.comments || 0) + 1 },
          };
        });
        loadTasks(false);
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setIsSendingComment(false);
    }
  };

  const getInitials = (nameStr?: string | null) => {
    if (!nameStr) return 'NA';
    const parts = nameStr.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return nameStr.slice(0, 2).toUpperCase();
  };

  const getPriorityBadge = (priority: AdminTask['priority']) => {
    switch (priority) {
      case 'URGENT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
            <Flame size={11} className="text-rose-600" />
            Urgente
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
            Haute
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-sky-50 text-sky-800 border border-sky-200">
            Moyenne
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-neutral-100 text-neutral-600 border border-neutral-200">
            Basse
          </span>
        );
    }
  };

  const formatDueDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const isOverdue = d < now;

    return {
      text: d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
      isOverdue,
    };
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-semibold tracking-wider bg-neutral-100 text-neutral-700 border border-neutral-200">
              NAY Workspace
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Collaboration Équipe
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 flex items-center gap-2">
            <CheckSquare size={22} className="text-neutral-900" />
            <span>Missions & Tâches</span>
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Organisez, assignez et suivez l&apos;avancement des tâches opérationnelles de l&apos;équipe.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openCreateModal}
            className="px-3.5 py-2 bg-neutral-900 hover:bg-black text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Plus size={15} />
            <span>Nouvelle Mission</span>
          </button>
        </div>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 p-4 rounded-xl shadow-2xs">
          <span className="text-[11px] text-neutral-500 font-medium block">Total des Missions</span>
          <div className="text-2xl font-bold text-neutral-900 mt-1">
            {stats?.total ?? '—'}
          </div>
        </div>

        <div className="bg-white border border-neutral-200 p-4 rounded-xl shadow-2xs">
          <span className="text-[11px] text-neutral-500 font-medium block">Mes Missions (Assignées)</span>
          <div className="text-2xl font-bold text-neutral-900 mt-1">
            {stats?.myTasks ?? 0}
          </div>
        </div>

        <div className="bg-white border border-neutral-200 p-4 rounded-xl shadow-2xs">
          <span className="text-[11px] text-neutral-500 font-medium block">Urgentes / Prioritaires</span>
          <div className="text-2xl font-bold text-rose-600 mt-1">
            {stats?.urgent ?? 0}
          </div>
        </div>

        <div className="bg-white border border-neutral-200 p-4 rounded-xl shadow-2xs">
          <span className="text-[11px] text-neutral-500 font-medium block">Missions Terminées</span>
          <div className="text-2xl font-bold text-emerald-700 mt-1">
            {stats?.completed ?? 0}
          </div>
        </div>
      </div>

      {/* FILTER & VIEW TOGGLE BAR */}
      <div className="bg-white rounded-xl border border-neutral-200 p-3 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 w-full md:w-auto flex-1">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
              <Search size={14} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une mission..."
              className="w-full pl-8 pr-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:border-neutral-900"
            />
          </div>

          {/* Assignee Filter */}
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-700 font-medium focus:bg-white focus:outline-none focus:border-neutral-900"
          >
            <option value="ALL">Tous les assignés</option>
            <option value="ME">Mes missions ({currentAdmin?.name || 'Moi'})</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
            <option value="UNASSIGNED">Non assigné</option>
          </select>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-700 font-medium focus:bg-white focus:outline-none focus:border-neutral-900"
          >
            <option value="ALL">Toutes les priorités</option>
            <option value="URGENT">Urgente</option>
            <option value="HIGH">Haute</option>
            <option value="MEDIUM">Moyenne</option>
            <option value="LOW">Basse</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-700 font-medium focus:bg-white focus:outline-none focus:border-neutral-900"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="TODO">À faire</option>
            <option value="IN_PROGRESS">En cours</option>
            <option value="IN_REVIEW">En revue</option>
            <option value="COMPLETED">Terminé</option>
          </select>
        </div>

        {/* View Switcher (Kanban vs List) & Refresh */}
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          <div className="flex items-center bg-neutral-100 p-0.5 rounded-lg border border-neutral-200">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-white text-neutral-900 shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
              title="Vue Tableau"
            >
              <LayoutGrid size={14} />
              <span className="hidden sm:inline">Tableau</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-neutral-900 shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
              title="Vue Liste"
            >
              <List size={14} />
              <span className="hidden sm:inline">Liste</span>
            </button>
          </div>

          <button
            onClick={() => loadTasks(false)}
            className="p-1.5 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 rounded-lg transition-colors cursor-pointer"
            title="Actualiser"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      {isLoading ? (
        <div className="py-24 text-center text-neutral-400 bg-white rounded-xl border border-neutral-200 flex flex-col items-center justify-center gap-3">
          <div className="w-7 h-7 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-medium">Chargement des missions...</span>
        </div>
      ) : tasks.length === 0 ? (
        <div className="py-20 text-center text-neutral-500 bg-white rounded-xl border border-dashed border-neutral-300 flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-neutral-100 text-neutral-800 flex items-center justify-center">
            <CheckSquare size={24} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Aucune mission trouvée</h3>
            <p className="text-xs text-neutral-500 mt-0.5 max-w-sm">
              Commencez par créer votre première mission pour vous organiser avec votre associé.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="px-3.5 py-2 bg-neutral-900 hover:bg-black text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus size={14} />
            <span>Créer une mission</span>
          </button>
        </div>
      ) : viewMode === 'kanban' ? (
        /* KANBAN VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {COLUMNS.map((col) => {
            const columnTasks = tasks.filter((t) => t.status === col.id);

            return (
              <div
                key={col.id}
                className="bg-neutral-50/70 rounded-xl p-3.5 border border-neutral-200/80 flex flex-col min-h-[500px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-neutral-200">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                    <h3 className={`font-semibold text-xs uppercase tracking-wider ${col.color}`}>
                      {col.title}
                    </h3>
                  </div>
                  <span className="px-2 py-0.2 bg-white border border-neutral-200 rounded-full text-[11px] font-semibold text-neutral-700 shadow-2xs">
                    {columnTasks.length}
                  </span>
                </div>

                {/* Column Tasks */}
                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
                  {columnTasks.length === 0 ? (
                    <div className="py-10 text-center text-neutral-400 text-xs border border-dashed border-neutral-200 rounded-lg bg-white/40">
                      Aucune mission
                    </div>
                  ) : (
                    columnTasks.map((task) => {
                      const due = formatDueDate(task.dueDate);
                      const isCompleted = task.status === 'COMPLETED';

                      return (
                        <div
                          key={task.id}
                          onClick={() => openTaskDetails(task)}
                          className="bg-white rounded-lg p-3.5 border border-neutral-200 shadow-2xs hover:border-neutral-300 transition-all cursor-pointer group space-y-2.5"
                        >
                          {/* Top Badges & Priority */}
                          <div className="flex items-center justify-between gap-2">
                            {getPriorityBadge(task.priority)}

                            {due && (
                              <span
                                className={`text-[10px] font-medium flex items-center gap-1 ${
                                  due.isOverdue && !isCompleted
                                    ? 'text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200'
                                    : 'text-neutral-500'
                                }`}
                              >
                                <Calendar size={11} />
                                {due.text}
                              </span>
                            )}
                          </div>

                          {/* Title */}
                          <h4
                            className={`text-xs font-semibold text-neutral-900 group-hover:text-neutral-950 transition-colors leading-snug ${
                              isCompleted ? 'line-through text-neutral-400' : ''
                            }`}
                          >
                            {task.title}
                          </h4>

                          {/* Description snippet */}
                          {task.description && (
                            <p className="text-[11px] text-neutral-500 line-clamp-2 leading-relaxed">
                              {task.description}
                            </p>
                          )}

                          {/* Tags */}
                          {task.tags && (
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {task.tags.split(',').map((t, i) => (
                                <span
                                  key={i}
                                  className="px-1.5 py-0.2 bg-neutral-100 rounded text-[10px] font-medium text-neutral-600 border border-neutral-200/60"
                                >
                                  #{t.trim()}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Footer: Assignee, Comments count, & Action */}
                          <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
                            {/* Assignee Avatar */}
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-full bg-neutral-900 text-white flex items-center justify-center text-[9px] font-bold overflow-hidden shadow-2xs">
                                {task.assignee?.avatar ? (
                                  <img
                                    src={task.assignee.avatar}
                                    alt={task.assigneeName || 'Avatar'}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span>{getInitials(task.assigneeName)}</span>
                                )}
                              </div>
                              <span className="text-[11px] font-medium text-neutral-700 truncate max-w-[100px]">
                                {task.assigneeName || 'Non assigné'}
                              </span>
                            </div>

                            {/* Comment bubble count */}
                            {(task._count?.comments || 0) > 0 && (
                              <div className="flex items-center gap-1 text-[11px] text-neutral-400 font-medium">
                                <MessageSquare size={12} />
                                <span>{task._count?.comments}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Quick Add at bottom of column */}
                <button
                  onClick={() => {
                    openCreateModal();
                    setFormStatus(col.id);
                  }}
                  className="mt-2.5 py-1.5 w-full border border-dashed border-neutral-300 rounded-lg text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:border-neutral-400 hover:bg-white/60 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Ajouter une mission</span>
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-[11px] uppercase font-semibold text-neutral-600 tracking-wider">
                  <th className="py-3 px-4 sm:px-6">Statut</th>
                  <th className="py-3 px-4">Titre de la mission</th>
                  <th className="py-3 px-4">Priorité</th>
                  <th className="py-3 px-4">Assigné à</th>
                  <th className="py-3 px-4">Échéance</th>
                  <th className="py-3 px-4">Créateur</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-xs text-neutral-700">
                {tasks.map((task) => {
                  const due = formatDueDate(task.dueDate);
                  const isCompleted = task.status === 'COMPLETED';

                  return (
                    <tr
                      key={task.id}
                      onClick={() => openTaskDetails(task)}
                      className="hover:bg-neutral-50/60 transition-colors cursor-pointer"
                    >
                      {/* Status Checkbox / Pill */}
                      <td className="py-3 px-4 sm:px-6 whitespace-nowrap">
                        <button
                          onClick={(e) =>
                            updateTaskStatus(
                              task.id,
                              isCompleted ? 'TODO' : 'COMPLETED',
                              e
                            )
                          }
                          className={`w-5 h-5 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                            isCompleted
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-neutral-300 hover:border-neutral-900 bg-white'
                          }`}
                        >
                          {isCompleted && <Check size={12} />}
                        </button>
                      </td>

                      {/* Title & tags */}
                      <td className="py-3 px-4 max-w-sm">
                        <div
                          className={`font-semibold text-neutral-900 ${
                            isCompleted ? 'line-through text-neutral-400' : ''
                          }`}
                        >
                          {task.title}
                        </div>
                        {task.tags && (
                          <div className="flex gap-1 mt-1">
                            {task.tags.split(',').map((t, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.2 bg-neutral-100 rounded text-[10px] text-neutral-600 font-medium border border-neutral-200/60"
                              >
                                #{t.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getPriorityBadge(task.priority)}
                      </td>

                      {/* Assignee */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-neutral-900 text-white flex items-center justify-center text-[9px] font-bold overflow-hidden">
                            {task.assignee?.avatar ? (
                              <img
                                src={task.assignee.avatar}
                                alt={task.assigneeName || 'Avatar'}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span>{getInitials(task.assigneeName)}</span>
                            )}
                          </div>
                          <span className="font-medium text-neutral-900">
                            {task.assigneeName || 'Non assigné'}
                          </span>
                        </div>
                      </td>

                      {/* Due Date */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {due ? (
                          <span
                            className={`font-medium ${
                              due.isOverdue && !isCompleted ? 'text-rose-700 font-semibold' : 'text-neutral-600'
                            }`}
                          >
                            {due.text}
                          </span>
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                      </td>

                      {/* Creator */}
                      <td className="py-3 px-4 whitespace-nowrap text-neutral-500">
                        {task.creatorName}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => openEditModal(task)}
                            className="p-1 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors cursor-pointer"
                            title="Modifier"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={(e) => deleteTask(task.id, e)}
                            className="p-1 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Supprimer"
                          >
                            <Trash2 size={14} />
                          </button>
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

      {/* CREATE / EDIT TASK MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-neutral-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-800 flex items-center justify-center">
                  <CheckSquare size={18} />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 text-sm">
                    {isEditingTask ? 'Modifier la mission' : 'Créer une nouvelle mission'}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Définissez les détails et assignez la tâche à un membre.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-md hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700">
                <AlertCircle size={15} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveTask} className="space-y-4 text-xs">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Titre de la mission *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ex: Réapprovisionner le stock des testeurs Bestsellers"
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:bg-white focus:outline-none focus:border-neutral-900"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Description & Consignes (optionnel)
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Détails, liens de produits, instructions spécifiques..."
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:bg-white focus:outline-none focus:border-neutral-900 leading-relaxed"
                />
              </div>

              {/* Assignee & Due Date Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Assigner à
                  </label>
                  <select
                    value={formAssignedToId}
                    onChange={(e) => setFormAssignedToId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-800 font-medium focus:bg-white focus:outline-none focus:border-neutral-900"
                  >
                    <option value="">Non assigné / Équipe</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role === 'OWNER' ? 'Propriétaire' : u.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Date d&apos;échéance
                  </label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-800 focus:bg-white focus:outline-none focus:border-neutral-900"
                  />
                </div>
              </div>

              {/* Priority & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Niveau de Priorité
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-800 font-medium focus:bg-white focus:outline-none focus:border-neutral-900"
                  >
                    <option value="LOW">Basse</option>
                    <option value="MEDIUM">Moyenne</option>
                    <option value="HIGH">Haute</option>
                    <option value="URGENT">Urgente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Statut initial
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-800 font-medium focus:bg-white focus:outline-none focus:border-neutral-900"
                  >
                    <option value="TODO">À faire</option>
                    <option value="IN_PROGRESS">En cours</option>
                    <option value="IN_REVIEW">En revue</option>
                    <option value="COMPLETED">Terminé</option>
                  </select>
                </div>
              </div>

              {/* Tags Selector */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Catégories & Tags
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {PREDEFINED_TAGS.map((t) => {
                    const isSelected = formTags.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => toggleTag(t)}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-medium border transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-neutral-900 text-white border-neutral-900'
                            : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomTag();
                      }
                    }}
                    placeholder="Ajouter un tag personnalisé..."
                    className="flex-1 px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-800 focus:bg-white focus:outline-none focus:border-neutral-900"
                  />
                  <button
                    type="button"
                    onClick={addCustomTag}
                    className="px-3 py-1.5 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 rounded-lg font-medium text-xs cursor-pointer"
                  >
                    Ajouter
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-1.5 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 font-medium rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-neutral-900 hover:bg-black text-white rounded-lg text-xs font-medium transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Enregistrement...' : isEditingTask ? 'Mettre à jour' : 'Créer la mission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TASK DETAILS & COMMENTS DRAWER */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-lg h-full shadow-2xl border-l border-neutral-200 flex flex-col">
            {/* Drawer Header */}
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
              <div className="flex items-center gap-2">
                {getPriorityBadge(selectedTask.priority)}
                <span className="text-xs text-neutral-300">•</span>
                <span className="text-xs text-neutral-500 font-medium">
                  Créée par {selectedTask.creatorName}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEditModal(selectedTask)}
                  className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors cursor-pointer"
                  title="Modifier la mission"
                >
                  <Edit3 size={15} />
                </button>
                <button
                  onClick={() => deleteTask(selectedTask.id)}
                  className="p-1.5 text-neutral-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                  title="Supprimer la mission"
                >
                  <Trash2 size={15} />
                </button>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors cursor-pointer ml-1"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Drawer Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
              {/* Title & Status Bar */}
              <div>
                <h2 className="text-base font-semibold text-neutral-900 leading-snug">
                  {selectedTask.title}
                </h2>

                {/* Status Switcher Buttons */}
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {COLUMNS.map((c) => {
                    const isActive = selectedTask.status === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => updateTaskStatus(selectedTask.id, c.id)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer border ${
                          isActive
                            ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs'
                            : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                        <span>{c.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Task Meta Grid */}
              <div className="grid grid-cols-2 gap-3 bg-neutral-50 p-3.5 rounded-lg border border-neutral-100">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-neutral-400 block mb-1">
                    Assigné à
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center text-[9px] font-bold overflow-hidden shadow-2xs">
                      {selectedTask.assignee?.avatar ? (
                        <img
                          src={selectedTask.assignee.avatar}
                          alt={selectedTask.assigneeName || 'Avatar'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{getInitials(selectedTask.assigneeName)}</span>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-neutral-900 text-xs">
                        {selectedTask.assigneeName || 'Non assigné'}
                      </div>
                      <div className="text-[10px] text-neutral-400">
                        {selectedTask.assignee?.role || 'Équipe NAY'}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-semibold text-neutral-400 block mb-1">
                    Échéance
                  </span>
                  <div className="flex items-center gap-1 text-neutral-800 font-medium mt-1">
                    <Calendar size={13} className="text-neutral-400" />
                    <span>
                      {selectedTask.dueDate
                        ? new Date(selectedTask.dueDate).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })
                        : 'Aucune date'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedTask.description && (
                <div>
                  <h4 className="text-[10px] uppercase font-semibold text-neutral-400 tracking-wider mb-1.5">
                    Description & Instructions
                  </h4>
                  <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100 text-neutral-700 leading-relaxed whitespace-pre-line text-xs">
                    {selectedTask.description}
                  </div>
                </div>
              )}

              {/* Tags */}
              {selectedTask.tags && (
                <div>
                  <h4 className="text-[10px] uppercase font-semibold text-neutral-400 tracking-wider mb-1.5">
                    Tags & Catégories
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedTask.tags.split(',').map((t, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-neutral-100 text-neutral-700 rounded-md text-xs font-medium border border-neutral-200/60"
                      >
                        #{t.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* COMMENTS SECTION */}
              <div className="pt-3 border-t border-neutral-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare size={13} className="text-neutral-500" />
                    <span>Discussion & Échanges ({selectedTask.comments?.length || 0})</span>
                  </h4>
                </div>

                {/* Comments List */}
                <div className="space-y-2">
                  {(!selectedTask.comments || selectedTask.comments.length === 0) ? (
                    <p className="text-center py-5 text-neutral-400 text-xs italic bg-neutral-50 rounded-lg border border-neutral-100">
                      Aucun message pour l&apos;instant. Laissez une note ci-dessous.
                    </p>
                  ) : (
                    selectedTask.comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="p-3 bg-neutral-50 rounded-lg border border-neutral-100 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-neutral-900 text-white flex items-center justify-center text-[9px] font-bold overflow-hidden">
                              {comment.userAvatar ? (
                                <img
                                  src={comment.userAvatar}
                                  alt={comment.userName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span>{getInitials(comment.userName)}</span>
                              )}
                            </div>
                            <span className="font-semibold text-neutral-800 text-[11px]">
                              {comment.userName}
                            </span>
                          </div>
                          <span className="text-[10px] text-neutral-400">
                            {new Date(comment.createdAt).toLocaleString('fr-FR', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-700 pl-6 leading-relaxed whitespace-pre-line">
                          {comment.content}
                        </p>
                      </div>
                    ))
                  )}
                  <div ref={commentsEndRef} />
                </div>
              </div>
            </div>

            {/* Drawer Footer: Send Comment */}
            <div className="p-3.5 border-t border-neutral-100 bg-white">
              <form onSubmit={handleSendComment} className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Écrire un commentaire..."
                  className="flex-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-800 focus:bg-white focus:outline-none focus:border-neutral-900"
                />
                <button
                  type="submit"
                  disabled={isSendingComment || !commentText.trim()}
                  className="px-3 py-2 bg-neutral-900 hover:bg-black text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-40 flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <Send size={12} />
                  <span>Envoyer</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
