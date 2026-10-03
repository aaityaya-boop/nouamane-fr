'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  User, 
  ShieldCheck, 
  History, 
  Save, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Calendar, 
  Clock, 
  Globe, 
  Search, 
  RefreshCw,
  Eye,
  EyeOff,
  Lock,
  Mail,
  UploadCloud,
  Camera,
  Trash2,
  Image as ImageIcon,
  Loader2,
  Check
} from 'lucide-react';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  avatar?: string | null;
  lastLoginAt?: string | null;
  lastActivityAt?: string | null;
  createdAt?: string | null;
}

interface ActivityLog {
  id: string;
  userId?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  description: string;
  oldValue?: string | null;
  newValue?: string | null;
  ipAddress?: string | null;
  createdAt: string;
}

const AVATAR_PRESETS = [
  { id: '1', label: 'Noir & Or', url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=300&auto=format&fit=crop&q=80' },
  { id: '2', label: 'Bleu NAY', url: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=300&auto=format&fit=crop&q=80' },
  { id: '3', label: 'Ambre Luxe', url: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=300&auto=format&fit=crop&q=80' },
  { id: '4', label: 'Flacon Cristal', url: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=300&auto=format&fit=crop&q=80' },
  { id: '5', label: 'Oud Royal', url: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=300&auto=format&fit=crop&q=80' },
];

function AdminProfileContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'profile';
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'activity'>(
    initialTab === 'security' || initialTab === 'activity' ? initialTab : 'profile'
  );

  // User state
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Profile Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Security Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Activity Logs state
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);

  // Load user data
  const loadUserData = async () => {
    setIsLoadingUser(true);
    try {
      const res = await fetch('/api/admin/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setCurrentUser(data.user);
          setName(data.user.name || '');
          setEmail(data.user.email || '');
          setAvatar(data.user.avatar || '');
        }
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setIsLoadingUser(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  // Handle direct file upload with client-side optimization and resilient server upload
  const uploadImageFile = async (file: File) => {
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Veuillez sélectionner un fichier image valide (JPG, PNG, WebP).');
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      // 1. Client-side canvas compression for instant high-quality avatar (max 800x800)
      const compressedDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const maxDim = 800;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > maxDim) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              }
            } else {
              if (height > maxDim) {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
              resolve(dataUrl);
            } else {
              resolve((e.target?.result as string) || '');
            }
          };
          img.onerror = () => resolve((e.target?.result as string) || '');
          img.src = (e.target?.result as string) || '';
        };
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
      });

      if (!compressedDataUrl) {
        throw new Error('Lecture de l\'image impossible');
      }

      // Immediately set the preview in UI
      setAvatar(compressedDataUrl);

      // 2. Upload to server via API
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataUrl: compressedDataUrl,
          filename: file.name || 'avatar.jpg',
          mimeType: 'image/jpeg',
        }),
      });

      const data = await res.json();

      if (res.ok && data.url) {
        setAvatar(data.url);
        setProfileMessage({ 
          type: 'success', 
          text: 'Photo prête ! N\'oubliez pas de cliquer sur "Enregistrer mes modifications" ci-dessous.' 
        });
      } else {
        // Even if remote server had an issue, the optimized local data URI is already active
        setProfileMessage({ 
          type: 'success', 
          text: 'Photo prête ! Cliquez sur "Enregistrer mes modifications" ci-dessous.' 
        });
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      // Fallback: read directly as data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        if (url) {
          setAvatar(url);
          setProfileMessage({ 
            type: 'success', 
            text: 'Photo chargée ! Cliquez sur "Enregistrer mes modifications" ci-dessous.' 
          });
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadImageFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // Load activity logs (filtered by current user)
  const loadActivityLogs = async (currentPage = page) => {
    if (!currentUser) return;
    setIsLoadingLogs(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(currentPage));
      params.set('limit', '25');
      params.set('userId', currentUser.id);
      if (filterType !== 'ALL') params.set('entityType', filterType);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/admin/auth/activity?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setLogs(data.logs || []);
          setTotalPages(data.pagination.totalPages || 1);
          setTotalLogs(data.pagination.total || 0);
        }
      }
    } catch (err) {
      console.error('Failed to load activity logs:', err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'activity' && currentUser) {
      loadActivityLogs(1);
      setPage(1);
    }
  }, [activeTab, filterType, currentUser]);

  // Handle Profile Update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    setIsSavingProfile(true);

    try {
      const res = await fetch('/api/admin/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          avatar: avatar.trim() || null,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setProfileMessage({ type: 'success', text: 'Vos informations personnelles et votre photo ont été mises à jour avec succès.' });
        setCurrentUser(data.user);
      } else {
        setProfileMessage({ type: 'error', text: data.error || 'Erreur lors de la mise à jour.' });
      }
    } catch (err) {
      setProfileMessage({ type: 'error', text: 'Erreur réseau lors de la mise à jour.' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Password Update
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Le nouveau mot de passe et sa confirmation ne correspondent pas.' });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'Le nouveau mot de passe doit comporter au moins 8 caractères.' });
      return;
    }

    setIsSavingPassword(true);

    try {
      const res = await fetch('/api/admin/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPasswordMessage({ type: 'success', text: 'Votre mot de passe personnel a été modifié avec succès !' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMessage({ type: 'error', text: data.error || 'Erreur lors du changement de mot de passe.' });
      }
    } catch (err) {
      setPasswordMessage({ type: 'error', text: 'Erreur réseau lors du changement de mot de passe.' });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const getInitials = (nameStr?: string) => {
    if (!nameStr) return 'NA';
    const parts = nameStr.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return nameStr.slice(0, 2).toUpperCase();
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Jamais';
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRelativeTime = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "À l'instant";
    if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)} h`;
    if (diffInSeconds < 604800) return `Il y a ${Math.floor(diffInSeconds / 86400)} j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const calculatePasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (pass.length >= 12) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const passStrength = calculatePasswordStrength(newPassword);

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-neutral-900 text-white flex items-center justify-center text-lg font-bold shrink-0 overflow-hidden shadow-2xs">
            {avatar || currentUser?.avatar ? (
              <img src={avatar || currentUser?.avatar || ''} alt={name || 'Avatar'} className="w-full h-full object-cover" />
            ) : (
              <span>{getInitials(name || currentUser?.name)}</span>
            )}
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-100 text-neutral-700 border border-neutral-200">
                {currentUser?.role === 'OWNER' ? 'Propriétaire' : currentUser?.role || 'Compte'}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Actif
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
              {currentUser?.name || 'Mon Compte'}
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              {currentUser?.email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 px-3 py-1.5 rounded-lg text-xs text-neutral-600">
          <Clock size={13} className="text-neutral-400" />
          <span>Dernière connexion : <strong>{formatDate(currentUser?.lastActivityAt || currentUser?.lastLoginAt)}</strong></span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-neutral-100 rounded-xl max-w-fit border border-neutral-200/70">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <User size={14} />
          <span>Informations & Photo</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            activeTab === 'security'
              ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <ShieldCheck size={14} />
          <span>Sécurité & Mot de Passe</span>
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            activeTab === 'activity'
              ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <History size={14} />
          <span>Mon Activité</span>
        </button>
      </div>

      {/* TAB 1: Mon Profil & Photo */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6 shadow-2xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-neutral-900">Détails de mon compte</h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Ces informations vous identifient sur le panneau d'administration.
            </p>
          </div>

          {profileMessage && (
            <div className={`p-3 rounded-lg flex items-center gap-2.5 text-xs font-medium ${
              profileMessage.type === 'success' 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              {profileMessage.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
              <span>{profileMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-5 max-w-3xl">
            {/* NAME & EMAIL FIELDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                  Nom & Prénom
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                    <User size={14} />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nom complet"
                    className="w-full pl-9 pr-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:bg-white focus:outline-none focus:border-neutral-900 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                  Email de connexion
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                    <Mail size={14} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nom@nayparfum.ma"
                    className="w-full pl-9 pr-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:bg-white focus:outline-none focus:border-neutral-900 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* PHOTO UPLOAD & AVATAR SECTION */}
            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-medium text-neutral-900">
                    Photo de profil
                  </label>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Téléversez une photo (PNG, JPG, WebP jusqu'à 10MB).
                  </p>
                </div>

                {avatar && (
                  <button
                    type="button"
                    onClick={() => setAvatar('')}
                    className="px-2.5 py-1 text-[11px] font-medium text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={12} />
                    <span>Retirer</span>
                  </button>
                )}
              </div>

              {/* Hidden Native File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/avif"
                className="hidden"
                onChange={handleFileChange}
              />

              {uploadError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Upload Dropzone & Live Preview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-center">
                {/* Preview Circle */}
                <div className="flex flex-col items-center justify-center p-3.5 bg-white rounded-xl border border-neutral-200 shadow-2xs text-center">
                  <div className="w-16 h-16 rounded-xl bg-neutral-900 text-white flex items-center justify-center text-xl font-bold shadow-xs overflow-hidden mb-1.5">
                    {avatar ? (
                      <img src={avatar} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{getInitials(name)}</span>
                    )}
                  </div>
                  <span className="text-[11px] font-medium text-neutral-500 truncate max-w-full">
                    {avatar ? 'Photo actuelle' : 'Initiales'}
                  </span>
                </div>

                {/* Upload Button Box / Dropzone */}
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`sm:col-span-2 p-5 rounded-xl border-2 border-dashed transition-colors cursor-pointer flex flex-col items-center justify-center text-center group ${
                    isDragging
                      ? 'border-neutral-900 bg-neutral-100'
                      : 'border-neutral-300 hover:border-neutral-400 bg-white hover:bg-neutral-50'
                  }`}
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center py-2 text-neutral-600 gap-2">
                      <Loader2 size={20} className="animate-spin text-neutral-900" />
                      <span className="text-xs font-medium">Téléversement...</span>
                    </div>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-700 flex items-center justify-center mb-1.5">
                        <UploadCloud size={16} />
                      </div>
                      <div className="text-xs font-semibold text-neutral-800">
                        Cliquez ou glissez une photo ici
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        PNG, JPG, WebP jusqu'à 10 Mo
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Presets Avatars */}
              <div className="pt-2.5 border-t border-neutral-200/70">
                <span className="block text-[11px] font-medium text-neutral-500 mb-2">
                  Ou choisir parmi nos modèles Haute Parfumerie :
                </span>
                
                <div className="flex items-center gap-2 overflow-x-auto py-0.5">
                  <button
                    type="button"
                    onClick={() => setAvatar('')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer ${
                      !avatar ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-200 text-neutral-600 bg-white hover:bg-neutral-50'
                    }`}
                  >
                    <span>Initiales ({getInitials(name)})</span>
                  </button>

                  {AVATAR_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setAvatar(p.url)}
                      className={`p-1 rounded-lg border flex items-center gap-1.5 text-xs transition-colors shrink-0 bg-white cursor-pointer ${
                        avatar === p.url ? 'border-neutral-900 ring-1 ring-neutral-900' : 'border-neutral-200 hover:border-neutral-400'
                      }`}
                    >
                      <img src={p.url} alt={p.label} className="w-5 h-5 rounded object-cover" />
                      <span className="pr-1.5 text-neutral-700 text-[11px]">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* SAVE BUTTON */}
            <div className="pt-3 border-t border-neutral-100 flex justify-end">
              <button
                type="submit"
                disabled={isSavingProfile || isUploading}
                className="px-4 py-2 bg-neutral-900 hover:bg-black text-white rounded-lg text-xs font-medium transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isSavingProfile ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Enregistrement...</span>
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    <span>Enregistrer</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: Sécurité & Mot de Passe */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6 shadow-2xs max-w-xl space-y-5">
          <div>
            <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <Lock size={16} className="text-neutral-700" />
              <span>Modifier mon mot de passe</span>
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Votre mot de passe est strictement personnel.
            </p>
          </div>

          {passwordMessage && (
            <div className={`p-3 rounded-lg flex items-center gap-2.5 text-xs font-medium ${
              passwordMessage.type === 'success' 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              {passwordMessage.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
              <span>{passwordMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleSavePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Mot de passe actuel
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-3.5 pr-9 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:bg-white focus:outline-none focus:border-neutral-900 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-700 cursor-pointer"
                >
                  {showCurrentPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-3.5 pr-9 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:bg-white focus:outline-none focus:border-neutral-900 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-700 cursor-pointer"
                >
                  {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              {newPassword && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-neutral-500">Robustesse :</span>
                    <span className={`font-semibold ${
                      passStrength <= 2 ? 'text-amber-600' : passStrength <= 4 ? 'text-sky-600' : 'text-emerald-600'
                    }`}>
                      {passStrength <= 2 ? 'Moyen' : passStrength <= 4 ? 'Bon' : 'Excellent'}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden flex gap-1">
                    <div className={`h-full flex-1 rounded-full ${passStrength >= 1 ? (passStrength <= 2 ? 'bg-amber-500' : 'bg-neutral-800') : 'bg-neutral-200'}`} />
                    <div className={`h-full flex-1 rounded-full ${passStrength >= 3 ? (passStrength <= 4 ? 'bg-neutral-700' : 'bg-emerald-500') : 'bg-neutral-200'}`} />
                    <div className={`h-full flex-1 rounded-full ${passStrength >= 5 ? 'bg-emerald-500' : 'bg-neutral-200'}`} />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Confirmer le nouveau mot de passe
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:bg-white focus:outline-none focus:border-neutral-900 transition-colors"
              />
            </div>

            <div className="pt-3 border-t border-neutral-100 flex justify-end">
              <button
                type="submit"
                disabled={isSavingPassword}
                className="px-4 py-2 bg-neutral-900 hover:bg-black text-white rounded-lg text-xs font-medium transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isSavingPassword ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Modification...</span>
                  </>
                ) : (
                  <>
                    <KeyRound size={14} />
                    <span>Changer mot de passe</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: Mon Activité */}
      {activeTab === 'activity' && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-neutral-900">Mon Journal d'Activité Personnel</h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Historique des actions enregistrées sous votre compte.
              </p>
            </div>

            <button
              onClick={() => loadActivityLogs(page)}
              className="px-3 py-1.5 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer shadow-2xs"
            >
              <RefreshCw size={12} className={isLoadingLogs ? 'animate-spin' : ''} />
              <span>Actualiser</span>
            </button>
          </div>

          {isLoadingLogs ? (
            <div className="py-16 text-center text-neutral-400 flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-neutral-500">Chargement de votre journal...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-14 text-center text-neutral-400 bg-neutral-50 rounded-xl border border-neutral-200">
              <History size={24} className="mx-auto text-neutral-300 mb-1.5" />
              <p className="text-xs font-medium text-neutral-600">Aucune activité récente pour votre compte</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-xl overflow-hidden">
              {logs.map((log) => (
                <div key={log.id} className="p-3.5 hover:bg-neutral-50/60 transition-colors flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-100 text-neutral-700 border border-neutral-200">
                        {log.action}
                      </span>
                      <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider bg-neutral-50 px-1.5 py-0.5 rounded border border-neutral-200/50">
                        {log.entityType}
                      </span>
                    </div>

                    <p className="text-xs text-neutral-800 leading-relaxed break-words">
                      {log.description}
                    </p>

                    <div className="flex items-center gap-3 mt-1 text-[11px] text-neutral-400">
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {getRelativeTime(log.createdAt)} ({formatDate(log.createdAt)})
                      </span>
                      {log.ipAddress && (
                        <span className="flex items-center gap-1">
                          <Globe size={11} />
                          IP: {log.ipAddress}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-3 border-t border-neutral-200 text-xs">
              <span className="text-neutral-500">
                Page <strong>{page}</strong> sur <strong>{totalPages}</strong> ({totalLogs} actions)
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={page <= 1}
                  onClick={() => {
                    setPage(page - 1);
                    loadActivityLogs(page - 1);
                  }}
                  className="px-2.5 py-1.5 bg-white hover:bg-neutral-50 border border-neutral-200 disabled:opacity-40 rounded-lg text-xs font-medium text-neutral-700 transition-colors cursor-pointer"
                >
                  Précédent
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => {
                    setPage(page + 1);
                    loadActivityLogs(page + 1);
                  }}
                  className="px-2.5 py-1.5 bg-white hover:bg-neutral-50 border border-neutral-200 disabled:opacity-40 rounded-lg text-xs font-medium text-neutral-700 transition-colors cursor-pointer"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 md:p-10 max-w-5xl mx-auto flex items-center justify-center py-24 text-neutral-500 text-xs gap-2">
          <RefreshCw className="animate-spin text-neutral-600" size={16} />
          <span>Chargement du profil...</span>
        </div>
      }
    >
      <AdminProfileContent />
    </Suspense>
  );
}

