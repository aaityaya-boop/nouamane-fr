'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { User, Package, MapPin, Heart, LogOut, ChevronLeft, ChevronRight, CheckCircle2, Truck, Clock, Check, X, KeyRound, ShieldCheck, ArrowLeft, Lock, Mail, RotateCcw, Eye, EyeOff, UserPlus, ArrowRight } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { formatMAD } from '@/lib/products';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '@/components/ProductCard';

const OrderTimeline = ({ status }: { status: string }) => {
  const steps = [
    { id: 'pending', label: 'En attente', icon: Clock },
    { id: 'confirmed', label: 'Confirmée', icon: CheckCircle2 },
    { id: 'shipped', label: 'Expédiée', icon: Truck },
    { id: 'delivered', label: 'Livrée', icon: Check },
  ];

  const currentIndex = steps.findIndex(s => s.id === status) === -1 ? 0 : steps.findIndex(s => s.id === status);
  const isCancelled = status === 'cancelled';

  if (isCancelled) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100">
        <X className="w-5 h-5" />
        <span className="font-bold text-[14px]">Commande Annulée</span>
      </div>
    );
  }

  return (
    <div className="relative pt-8 pb-4">
      {/* Background Line */}
      <div className="absolute top-11 left-[10%] right-[10%] h-[2px] bg-[#e0ddd4] z-0"></div>
      
      {/* Active Line */}
      <div 
        className="absolute top-11 left-[10%] h-[2px] bg-[#0ea5e9] z-0 transition-all duration-700 ease-in-out" 
        style={{ width: `${(currentIndex / (steps.length - 1)) * 80}%` }}
      ></div>

      <div className="relative z-10 flex justify-between">
        {steps.map((step, index) => {
          const isActive = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const Icon = step.icon;
          
          return (
            <div key={step.id} className="flex flex-col items-center gap-3">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                  isActive 
                    ? 'bg-[#0ea5e9] text-white shadow-md shadow-[#0ea5e9]/30 scale-110' 
                    : 'bg-white border-2 border-[#e0ddd4] text-[#9A9A9A]'
                }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[11px] font-bold uppercase tracking-wider ${isActive ? 'text-[#1A1A1A]' : 'text-[#9A9A9A]'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function AccountClient() {
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'fr';
  const isArabic = locale === 'ar';
  const [showPassword, setShowPassword] = useState(false);
  const { customer, setCustomer, isLoading, logout } = useAuth();
  const [authStep, setAuthStep] = useState<'login' | 'signup' | 'forgot' | 'verify_reset'>('login');
  const [authData, setAuthData] = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [loadingAuth, setLoadingAuth] = useState(false);

  // Forgot password & Verification code state
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetStatus, setResetStatus] = useState<{ loading: boolean; error: string; success: string }>({
    loading: false,
    error: '',
    success: '',
  });
  const [orders, setOrders] = useState<any[]>([]);
  
  const [wishlistProducts, setWishlistProducts] = useState<any[]>([]);
  const [loadingWishlist, setLoadingWishlist] = useState(false);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'info' | 'address' | 'wishlist'>('dashboard');

  const [infoForm, setInfoForm] = useState({ name: '', email: '', currentPassword: '', newPassword: '' });
  const [addressForm, setAddressForm] = useState({ phone: '', address: '', city: '', postalCode: '' });
  const [formStatus, setFormStatus] = useState({ loading: false, success: '', error: '' });

  useEffect(() => {
    if (customer) {
      const fetchOrders = async () => {
        try {
          const res = await fetch('/api/account/orders');
          if (res.ok) {
            const data = await res.json();
            setOrders(data.orders);
          }
        } catch (error) {
          console.error('Error fetching orders:', error);
        }
      };
      fetchOrders();

      setInfoForm({
        name: customer.name || '',
        email: customer.email || '',
        currentPassword: '',
        newPassword: ''
      });
      setAddressForm({
        phone: customer.phone || '',
        address: customer.address || '',
        city: customer.city || '',
        postalCode: customer.postalCode || ''
      });
    }
  }, [customer]);

  useEffect(() => {
    if (activeTab === 'wishlist' && customer?.wishlist && customer.wishlist.length > 0) {
      const fetchWishlist = async () => {
        setLoadingWishlist(true);
        try {
          const slugs = customer.wishlist!.join(',');
          const res = await fetch(`/api/products/wishlist?slugs=${slugs}`);
          if (res.ok) {
            const data = await res.json();
            setWishlistProducts(data.products || []);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingWishlist(false);
        }
      };
      fetchWishlist();
    }
  }, [activeTab, customer?.wishlist]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setLoadingAuth(true);

    const endpoint = authStep === 'login' ? '/api/auth/login' : '/api/auth/register';
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authData),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setCustomer(data.customer);
      } else {
        setAuthError(data.error || 'Une erreur est survenue');
      }
    } catch (error) {
      setAuthError('Erreur de connexion au serveur');
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setAuthError('');
      setLoadingAuth(true);
      
      const { signInWithPopup } = await import('firebase/auth');
      const { auth, googleProvider } = await import('@/lib/firebase');
      
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setCustomer(data.customer);
      } else {
        setAuthError(data.error || 'Erreur lors de la connexion Google');
      }
    } catch (error: any) {
      console.error("Google Auth Full Error:", error);
      if (error.code !== 'auth/popup-closed-by-user') {
        setAuthError(`Erreur Google: ${error.message || error.code || 'Inconnue'}`);
      }
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !forgotEmail.includes('@')) {
      setResetStatus({ loading: false, error: 'Veuillez renseigner une adresse e-mail valide.', success: '' });
      return;
    }
    setResetStatus({ loading: true, error: '', success: '' });
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAuthStep('verify_reset');
        setResetStatus({
          loading: false,
          error: '',
          success: 'Code envoyé ! Consultez votre boîte de réception (et vos spams).',
        });
      } else {
        setResetStatus({ loading: false, error: data.error || "Erreur lors de l'envoi du code.", success: '' });
      }
    } catch {
      setResetStatus({ loading: false, error: 'Erreur de connexion au serveur.', success: '' });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCode || resetCode.trim().length !== 6) {
      setResetStatus({ loading: false, error: 'Veuillez saisir le code à 6 chiffres reçu par e-mail.', success: '' });
      return;
    }
    if (resetNewPassword.length < 6) {
      setResetStatus({ loading: false, error: 'Le nouveau mot de passe doit contenir au moins 6 caractères.', success: '' });
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      setResetStatus({ loading: false, error: 'Les deux mots de passe ne correspondent pas.', success: '' });
      return;
    }

    setResetStatus({ loading: true, error: '', success: '' });
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail,
          code: resetCode.trim(),
          newPassword: resetNewPassword,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCustomer(data.customer);
        setResetStatus({
          loading: false,
          error: '',
          success: 'Mot de passe réinitialisé avec succès ! Connexion réussie.',
        });
      } else {
        setResetStatus({ loading: false, error: data.error || 'Erreur lors de la réinitialisation.', success: '' });
      }
    } catch {
      setResetStatus({ loading: false, error: 'Erreur de connexion au serveur.', success: '' });
    }
  };

  const handleUpdate = async (e: React.FormEvent, action: 'updateInfo' | 'updateAddress') => {
    e.preventDefault();
    setFormStatus({ loading: true, success: '', error: '' });

    const payload = action === 'updateInfo' ? { action, ...infoForm } : { action, ...addressForm };

    try {
      const res = await fetch('/api/account/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setFormStatus({ loading: false, success: data.message, error: '' });
        const meRes = await fetch('/api/auth/me');
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.authenticated && meData.customer) {
            setCustomer(meData.customer);
          }
        }
        if (action === 'updateInfo') {
          setInfoForm(prev => ({ ...prev, currentPassword: '', newPassword: '' }));
        }
      } else {
        setFormStatus({ loading: false, success: '', error: data.error || 'Erreur lors de la mise à jour' });
      }
    } catch (err) {
      setFormStatus({ loading: false, success: '', error: 'Erreur serveur' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F3] flex flex-col items-center justify-center">
        <Header />
        <div className="text-[#9A9A9A] tracking-wider text-[12px] uppercase animate-pulse">Chargement...</div>
        <Footer />
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'Tableau de bord', icon: Package },
    { id: 'orders', label: 'Mes commandes', icon: Package },
    { id: 'wishlist', label: "Ma liste d'envies", icon: Heart },
    { id: 'info', label: 'Mes informations', icon: User },
    { id: 'address', label: "Carnet d'adresses", icon: MapPin },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F3] font-sans selection:bg-[#1A1A1A] selection:text-white flex flex-col">
      <Header />

      <main className={`flex-1 ${!customer ? "pt-[60px] lg:pt-[120px] pb-0 lg:pb-16 bg-[#f8fafc]" : "pt-[100px] lg:pt-[130px] pb-20"}`}>
        <div className={!customer ? "w-full max-w-5xl mx-auto px-0 sm:px-6 lg:px-8" : "max-w-[1400px] mx-auto px-6 lg:px-10"}>
          
          {customer ? (
            <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
              
              {/* SIDEBAR NAVIGATION */}
              <aside className="lg:w-72 flex-shrink-0">
                <div className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-sm rounded-3xl p-8 sticky top-[150px]">
                  <div className="mb-8">
                    <div className="w-16 h-16 bg-[#0ea5e9]/10 text-[#0ea5e9] rounded-2xl flex items-center justify-center mb-4">
                      <User size={28} />
                    </div>
                    <h2 className="heading-font text-2xl text-[#1A1A1A]">Bonjour, {customer.name.split(' ')[0]}</h2>
                    <p className="text-[13px] text-[#9A9A9A] mt-1">{customer.email}</p>
                  </div>
                  
                  <nav className="space-y-2">
                    {tabs.map(tab => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => { setActiveTab(tab.id as any); setFormStatus({loading: false, success: '', error: ''}); }}
                          className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 ${
                            isActive 
                              ? 'bg-[#1A1A1A] text-white shadow-lg shadow-black/10 scale-[1.02]' 
                              : 'hover:bg-white text-[#6B6B6B] hover:text-[#1A1A1A]'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <Icon size={18} />
                            <span className="text-[13px] font-bold tracking-wider">{tab.label}</span>
                          </div>
                          {isActive && <ChevronRight size={16} className="opacity-50" />}
                        </button>
                      );
                    })}
                  </nav>

                  <div className="mt-8 pt-8 border-t border-[#e0ddd4]">
                    <button 
                      onClick={logout}
                      className="flex items-center gap-3 text-red-500 hover:text-red-700 transition-colors w-full p-4 rounded-2xl hover:bg-red-50"
                    >
                      <LogOut size={18} />
                      <span className="text-[13px] font-bold tracking-wider">Déconnexion</span>
                    </button>
                  </div>
                </div>
              </aside>

              {/* MAIN CONTENT AREA */}
              <div className="flex-1">
                <AnimatePresence mode="wait">
                  
                  {activeTab === 'dashboard' && (
                    <motion.div
                      key="dashboard"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-8"
                    >
                      <div className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-sm rounded-3xl p-10 lg:p-12">
                        <h3 className="heading-font text-3xl mb-4">Bienvenue sur votre espace personnel</h3>
                        <p className="text-[#6B6B6B] text-[15px] leading-relaxed max-w-2xl">
                          Gérez vos informations personnelles, suivez l'état de vos commandes en temps réel, et gardez un œil sur vos parfums préférés grâce à votre liste d'envies.
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
                          <div onClick={() => setActiveTab('orders')} className="bg-[#F5F5F3] p-8 rounded-2xl hover:bg-white hover:shadow-lg transition-all cursor-pointer group border border-transparent hover:border-[#e0ddd4]">
                            <Package className="w-8 h-8 text-[#0ea5e9] mb-4 group-hover:scale-110 transition-transform" />
                            <h4 className="heading-font text-xl mb-2">Suivi de Commandes</h4>
                            <p className="text-[13px] text-[#9A9A9A]">Vérifiez l'état de vos livraisons.</p>
                          </div>
                          
                          <div onClick={() => setActiveTab('wishlist')} className="bg-[#F5F5F3] p-8 rounded-2xl hover:bg-white hover:shadow-lg transition-all cursor-pointer group border border-transparent hover:border-[#e0ddd4]">
                            <Heart className="w-8 h-8 text-[#0ea5e9] mb-4 group-hover:scale-110 transition-transform" />
                            <h4 className="heading-font text-xl mb-2">Liste d'envies</h4>
                            <p className="text-[13px] text-[#9A9A9A]">{customer.wishlist?.length || 0} produits sauvegardés.</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'orders' && (
                    <motion.div
                      key="orders"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-8"
                    >
                      <div className="flex items-center justify-between mb-8">
                        <h2 className="heading-font text-3xl text-[#1A1A1A]">Historique & Suivi</h2>
                      </div>
                      
                      {orders.length === 0 ? (
                        <div className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-sm rounded-3xl p-16 text-center">
                          <Package className="w-16 h-16 text-[#e0ddd4] mx-auto mb-6" />
                          <h3 className="heading-font text-2xl text-[#1A1A1A] mb-2">Aucune commande</h3>
                          <p className="text-[#9A9A9A] text-[14px] mb-8">Vous n'avez passé aucune commande pour le moment.</p>
                          <a href="/shop" className="btn-blue py-4 px-10 rounded-full text-[13px] font-bold tracking-wider inline-block">Découvrir nos parfums</a>
                        </div>
                      ) : (
                        <div className="space-y-8">
                          {orders.map(order => (
                            <div key={order.id} className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-sm rounded-3xl overflow-hidden">
                              <div className="bg-[#1A1A1A] text-white p-6 lg:px-10 flex flex-col md:flex-row justify-between md:items-center gap-4">
                                <div>
                                  <span className="text-[11px] text-[#9A9A9A] uppercase tracking-wider block mb-1">Commande N°</span>
                                  <span className="font-bold text-[18px]">{order.orderNumber}</span>
                                </div>
                                <div className="flex gap-8">
                                  <div>
                                    <span className="text-[11px] text-[#9A9A9A] uppercase tracking-wider block mb-1">Date</span>
                                    <span className="font-bold text-[14px]">{new Date(order.createdAt).toLocaleDateString('fr-FR')}</span>
                                  </div>
                                  <div>
                                    <span className="text-[11px] text-[#9A9A9A] uppercase tracking-wider block mb-1">Total</span>
                                    <span className="font-bold text-[14px] text-[#0ea5e9]">{formatMAD(order.total)}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="p-6 lg:p-10">
                                <h4 className="text-[14px] font-bold text-[#1A1A1A] mb-6">Suivi de la livraison</h4>
                                <OrderTimeline status={order.status} />
                                
                                <div className="mt-8 pt-8 border-t border-[#e0ddd4] text-[13px] text-[#6B6B6B] bg-[#F5F5F3] p-6 rounded-2xl">
                                  <div className="flex items-start gap-4">
                                    <MapPin className="w-5 h-5 text-[#9A9A9A] mt-0.5" />
                                    <div>
                                      <strong className="text-[#1A1A1A] block mb-1">Adresse de livraison :</strong>
                                      {order.shippingAddress}, <br/>{order.shippingCity} {order.shippingPostalCode}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {activeTab === 'wishlist' && (
                    <motion.div
                      key="wishlist"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <div className="flex items-center justify-between mb-8">
                        <h2 className="heading-font text-3xl text-[#1A1A1A]">Ma liste d'envies</h2>
                        <span className="bg-white px-4 py-1.5 rounded-full text-[12px] font-bold text-[#9A9A9A] border border-[#e0ddd4]">
                          {customer.wishlist?.length || 0} articles
                        </span>
                      </div>

                      {loadingWishlist ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {[1, 2].map(i => (
                            <div key={i} className="bg-white/50 animate-pulse aspect-[3/4] rounded-3xl border border-white/40"></div>
                          ))}
                        </div>
                      ) : wishlistProducts.length === 0 ? (
                        <div className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-sm rounded-3xl p-16 text-center">
                          <Heart className="w-16 h-16 text-[#e0ddd4] mx-auto mb-6" />
                          <h3 className="heading-font text-2xl text-[#1A1A1A] mb-2">Votre liste d'envies est vide</h3>
                          <p className="text-[#9A9A9A] text-[14px] max-w-sm mx-auto mb-8">
                            Découvrez nos parfums et ajoutez-les à vos favoris pour les retrouver ici plus tard.
                          </p>
                          <a href="/shop" className="btn-blue py-4 px-10 rounded-full text-[13px] font-bold tracking-wider inline-block">
                            Découvrir le catalogue
                          </a>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                          {wishlistProducts.map(product => (
                            <ProductCard key={product.id} product={product} />
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {activeTab === 'info' && (
                    <motion.div
                      key="info"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <h2 className="heading-font text-3xl text-[#1A1A1A] mb-8">Informations Personnelles</h2>
                      <div className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-sm rounded-3xl p-8 lg:p-10 max-w-2xl">
                        {formStatus.success && <div className="bg-green-50 text-green-700 p-4 rounded-xl text-[13px] mb-8 border border-green-200 flex items-center gap-3"><CheckCircle2 size={18}/> {formStatus.success}</div>}
                        {formStatus.error && <div className="bg-red-50 text-red-700 p-4 rounded-xl text-[13px] mb-8 border border-red-200 flex items-center gap-3"><X size={18}/> {formStatus.error}</div>}
                        
                        <form onSubmit={(e) => handleUpdate(e, 'updateInfo')} className="space-y-6">
                          <div className="grid md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-[11px] font-bold text-[#9A9A9A] mb-2 uppercase tracking-wider">Nom complet</label>
                              <input required type="text" value={infoForm.name} onChange={e => setInfoForm({...infoForm, name: e.target.value})} className="w-full bg-[#F5F5F3] border-transparent rounded-xl px-5 py-4 text-[14px] focus:bg-white focus:outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] transition-all" />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-[#9A9A9A] mb-2 uppercase tracking-wider">Adresse e-mail</label>
                              <input required type="email" value={infoForm.email} onChange={e => setInfoForm({...infoForm, email: e.target.value})} className="w-full bg-[#F5F5F3] border-transparent rounded-xl px-5 py-4 text-[14px] focus:bg-white focus:outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] transition-all" />
                            </div>
                          </div>

                          <div className="pt-8 mt-8 border-t border-[#e0ddd4]">
                            <h4 className="text-[16px] font-bold mb-6 text-[#1A1A1A]">Sécurité</h4>
                            <div className="space-y-6">
                              <div>
                                <label className="block text-[11px] font-bold text-[#9A9A9A] mb-2 uppercase tracking-wider">Mot de passe actuel</label>
                                <input type="password" placeholder="Laisser vide si inchangé" value={infoForm.currentPassword} onChange={e => setInfoForm({...infoForm, currentPassword: e.target.value})} className="w-full bg-[#F5F5F3] border-transparent rounded-xl px-5 py-4 text-[14px] focus:bg-white focus:outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] transition-all" />
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-[#9A9A9A] mb-2 uppercase tracking-wider">Nouveau mot de passe</label>
                                <input type="password" placeholder="Nouveau mot de passe" minLength={6} value={infoForm.newPassword} onChange={e => setInfoForm({...infoForm, newPassword: e.target.value})} className="w-full bg-[#F5F5F3] border-transparent rounded-xl px-5 py-4 text-[14px] focus:bg-white focus:outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] transition-all" />
                              </div>
                            </div>
                          </div>
                          
                          <div className="pt-6">
                            <button type="submit" disabled={formStatus.loading} className="w-full md:w-auto btn-blue py-4 px-10 rounded-full text-[13px] font-bold tracking-wider disabled:opacity-70 transition-transform hover:scale-105 active:scale-95">
                              {formStatus.loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                            </button>
                          </div>
                        </form>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'address' && (
                    <motion.div
                      key="address"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <h2 className="heading-font text-3xl text-[#1A1A1A] mb-8">Carnet d'adresses</h2>
                      <div className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-sm rounded-3xl p-8 lg:p-10 max-w-2xl">
                        {formStatus.success && <div className="bg-green-50 text-green-700 p-4 rounded-xl text-[13px] mb-8 border border-green-200 flex items-center gap-3"><CheckCircle2 size={18}/> {formStatus.success}</div>}
                        {formStatus.error && <div className="bg-red-50 text-red-700 p-4 rounded-xl text-[13px] mb-8 border border-red-200 flex items-center gap-3"><X size={18}/> {formStatus.error}</div>}
                        
                        <form onSubmit={(e) => handleUpdate(e, 'updateAddress')} className="space-y-6">
                          <div>
                            <label className="block text-[11px] font-bold text-[#9A9A9A] mb-2 uppercase tracking-wider">Téléphone</label>
                            <input type="tel" value={addressForm.phone} onChange={e => setAddressForm({...addressForm, phone: e.target.value})} className="w-full bg-[#F5F5F3] border-transparent rounded-xl px-5 py-4 text-[14px] focus:bg-white focus:outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] transition-all" />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-[#9A9A9A] mb-2 uppercase tracking-wider">Adresse complète</label>
                            <input type="text" value={addressForm.address} onChange={e => setAddressForm({...addressForm, address: e.target.value})} className="w-full bg-[#F5F5F3] border-transparent rounded-xl px-5 py-4 text-[14px] focus:bg-white focus:outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] transition-all" />
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <label className="block text-[11px] font-bold text-[#9A9A9A] mb-2 uppercase tracking-wider">Ville</label>
                              <input type="text" value={addressForm.city} onChange={e => setAddressForm({...addressForm, city: e.target.value})} className="w-full bg-[#F5F5F3] border-transparent rounded-xl px-5 py-4 text-[14px] focus:bg-white focus:outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] transition-all" />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-[#9A9A9A] mb-2 uppercase tracking-wider">Code Postal</label>
                              <input type="text" value={addressForm.postalCode} onChange={e => setAddressForm({...addressForm, postalCode: e.target.value})} className="w-full bg-[#F5F5F3] border-transparent rounded-xl px-5 py-4 text-[14px] focus:bg-white focus:outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] transition-all" />
                            </div>
                          </div>
                          
                          <div className="pt-6">
                            <button type="submit" disabled={formStatus.loading} className="w-full md:w-auto btn-blue py-4 px-10 rounded-full text-[13px] font-bold tracking-wider disabled:opacity-70 transition-transform hover:scale-105 active:scale-95">
                              {formStatus.loading ? 'Enregistrement...' : 'Enregistrer l\'adresse'}
                            </button>
                          </div>
                        </form>
                      </div>
                    </motion.div>
                  )}
                  
                </AnimatePresence>
              </div>
            </div>
                                                  ) : (
            <div className="max-w-5xl mx-auto my-0 sm:my-8 bg-white sm:rounded-[32px] shadow-none sm:shadow-[0_20px_60px_rgba(15,23,42,0.06)] border-0 sm:border sm:border-slate-100 overflow-hidden min-h-[600px]">
              
              {/* ========================================================= */}
              {/* MOBILE ONLY: CURVED LUXURY APP SHEET (< lg)               */}
              {/* ========================================================= */}
              <div className="lg:hidden flex flex-col">
                
                {/* 1. IMMERSIVE TOP BRAND HERO */}
                <div className="relative bg-gradient-to-br from-[#0284c7] via-[#0369a1] to-[#081b33] text-white pt-6 pb-10 px-5 relative overflow-hidden">
                  {/* Floating ambient orbs */}
                  <motion.div
                    animate={{
                      y: [0, -12, 0],
                      x: [0, 8, 0],
                      scale: [1, 1.08, 1],
                      opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{ repeat: Infinity, duration: 6.5, ease: "easeInOut" }}
                    className="absolute -top-10 -right-10 w-52 h-52 bg-sky-300/30 rounded-full blur-3xl pointer-events-none"
                  />
                  <motion.div
                    animate={{
                      y: [0, 14, 0],
                      x: [0, -10, 0],
                      scale: [1, 1.1, 1],
                      opacity: [0.2, 0.4, 0.2],
                    }}
                    transition={{ repeat: Infinity, duration: 8, ease: "easeInOut", delay: 1 }}
                    className="absolute -bottom-10 -left-10 w-56 h-56 bg-blue-600/35 rounded-full blur-3xl pointer-events-none"
                  />

                  {/* Dot Grid */}
                  <div
                    className="absolute inset-0 opacity-[0.04] pointer-events-none"
                    style={{
                      backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                      backgroundSize: '20px 20px',
                    }}
                  />

                  {/* Top Bar */}
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-18 h-7 bg-white"
                        style={{
                          maskImage: 'url("/images/nay/Artboard%202.png")',
                          WebkitMaskImage: 'url("/images/nay/Artboard%202.png")',
                          maskSize: 'contain',
                          WebkitMaskSize: 'contain',
                          maskRepeat: 'no-repeat',
                          WebkitMaskRepeat: 'no-repeat',
                          maskPosition: isArabic ? 'right center' : 'left center',
                          WebkitMaskPosition: isArabic ? 'right center' : 'left center',
                        }}
                      />
                      <div className="h-3 w-[1px] bg-white/20" />
                      <span className={`text-[9.5px] text-sky-200 uppercase font-semibold ${isArabic ? 'font-arabic' : 'font-display tracking-wider'}`}>
                        {isArabic ? "دار العطور" : "Haute Parfumerie"}
                      </span>
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] text-sky-200">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
                      </span>
                      <span>{isArabic ? "توصيل بالمغرب" : "Livraison Maroc"}</span>
                    </div>
                  </div>

                  {/* Hero Headline */}
                  <div className="relative z-10 mt-4 text-center sm:text-left rtl:sm:text-right">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[10px] font-semibold text-sky-100 mb-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-300"></span>
                      <span>{isArabic ? "فضاء الزبناء المميزين" : "Cercle Privilège NAY"}</span>
                    </div>
                    <h2 className={`text-[20px] font-extrabold text-white tracking-tight leading-snug ${isArabic ? 'font-arabic' : 'font-display'}`}>
                      {isArabic ? (
                        <>عالمك العطري الخاص<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-200 via-white to-sky-300">في انتظارك الآن</span></>
                      ) : (
                        <>Votre Signature Olfactive<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-100 via-white to-sky-200">Vous Attend</span></>
                      )}
                    </h2>
                    <p className="text-sky-100/85 text-[11.5px] leading-relaxed mt-1 max-w-xs mx-auto sm:mx-0">
                      {isArabic
                        ? "سجّل دخولك لتتبع طلبياتك في الوقت الفعلي وحفظ عطورك المفضلة."
                        : "Suivez vos commandes en direct, sauvegardez vos favoris et profitez d'offres VIP."}
                    </p>
                  </div>

                  {/* 3 Step Mini Glass Cards */}
                  <div className="relative z-10 grid grid-cols-3 gap-1.5 mt-3 text-[10px]">
                    <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-2 text-center flex flex-col items-center">
                      <div className="w-4 h-4 rounded-full bg-sky-400 text-slate-900 font-extrabold text-[9px] flex items-center justify-center mb-0.5">1</div>
                      <span className="font-bold text-white text-[10px] truncate w-full">{isArabic ? "توصيل 24-48h" : "Suivi direct"}</span>
                      <span className="text-sky-200/80 text-[8.5px] truncate w-full">{isArabic ? "معاينة قبل الدفع" : "Inspection colis"}</span>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-2 text-center flex flex-col items-center">
                      <div className="w-4 h-4 rounded-full bg-white/20 text-white font-extrabold text-[9px] flex items-center justify-center mb-0.5">2</div>
                      <span className="font-bold text-white text-[10px] truncate w-full">{isArabic ? "قائمة رغبات" : "Wishlist"}</span>
                      <span className="text-sky-200/80 text-[8.5px] truncate w-full">{isArabic ? "عطور محفوظة" : "Favoris sauvés"}</span>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-2 text-center flex flex-col items-center">
                      <div className="w-4 h-4 rounded-full bg-white/20 text-white font-extrabold text-[9px] flex items-center justify-center mb-0.5">3</div>
                      <span className="font-bold text-white text-[10px] truncate w-full">{isArabic ? "عروض VIP" : "Offres VIP"}</span>
                      <span className="text-sky-200/80 text-[8.5px] truncate w-full">{isArabic ? "تيسترات حصرية" : "Testeurs"}</span>
                    </div>
                  </div>
                </div>

                {/* 2. CURVED FLOATING FORM SHEET */}
                <div className="relative z-20 -mt-4 bg-white rounded-t-[28px] shadow-[0_-10px_30px_rgba(15,23,42,0.08)] px-5 pt-4 pb-36 flex flex-col">
                  {/* Subtle Grab Handle */}
                  <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4" />

                  {/* Mobile Segmented Switcher */}
                  {(authStep === 'login' || authStep === 'signup') && (
                    <div className="flex bg-slate-100 p-1 rounded-xl mb-4 relative border border-slate-200/70 select-none">
                      <button
                        type="button"
                        onClick={() => { setAuthStep('login'); setAuthError(''); }}
                        className={`relative z-10 flex-1 py-2 text-center text-[12.5px] font-bold transition-colors ${
                          authStep === 'login' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {authStep === 'login' && (
                          <motion.div
                            layoutId="mobile-sheet-tab"
                            className="absolute inset-0 bg-white rounded-lg shadow-xs"
                            transition={{ type: "spring", stiffness: 450, damping: 32 }}
                          />
                        )}
                        <span className={`relative z-10 ${isArabic ? 'font-arabic' : 'font-display'}`}>
                          {isArabic ? "تسجيل الدخول" : "Se Connecter"}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => { setAuthStep('signup'); setAuthError(''); }}
                        className={`relative z-10 flex-1 py-2 text-center text-[12.5px] font-bold transition-colors ${
                          authStep === 'signup' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {authStep === 'signup' && (
                          <motion.div
                            layoutId="mobile-sheet-tab"
                            className="absolute inset-0 bg-white rounded-lg shadow-xs"
                            transition={{ type: "spring", stiffness: 450, damping: 32 }}
                          />
                        )}
                        <span className={`relative z-10 ${isArabic ? 'font-arabic' : 'font-display'}`}>
                          {isArabic ? "إنشاء حساب" : "Créer un compte"}
                        </span>
                      </button>
                    </div>
                  )}

                  {/* Form rendered through AnimatePresence */}
                  <AnimatePresence mode="wait">
                    {authStep === 'login' && (
                      <motion.div
                        key="mobile-login"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.18 }}
                      >
                        {authError && (
                          <div className="bg-red-50 text-red-600 border border-red-100 rounded-xl p-3 text-[12.5px] mb-3.5 flex items-center gap-2">
                            <X size={15} className="flex-shrink-0" />
                            <span>{authError}</span>
                          </div>
                        )}

                        <form className="space-y-3.5" onSubmit={handleAuth}>
                          <div>
                            <label className="block text-[11.5px] font-semibold text-slate-700 mb-1">
                              {isArabic ? "البريد الإلكتروني" : "Adresse e-mail"}
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 rtl:left-auto rtl:right-0 pl-3 rtl:pl-0 rtl:pr-3 flex items-center pointer-events-none text-slate-400">
                                <Mail size={15} />
                              </div>
                              <input
                                required
                                type="email"
                                placeholder={isArabic ? "name@example.com" : "votre@email.com"}
                                value={authData.email}
                                onChange={e => setAuthData({...authData, email: e.target.value})}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 rtl:pl-3.5 rtl:pr-9 py-2.5 text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all"
                              />
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[11.5px] font-semibold text-slate-700">
                                {isArabic ? "كلمة المرور" : "Mot de passe"}
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  setForgotEmail(authData.email);
                                  setResetStatus({ loading: false, error: '', success: '' });
                                  setAuthStep('forgot');
                                }}
                                className="text-[11.5px] text-sky-600 hover:text-sky-700 font-semibold"
                              >
                                {isArabic ? "نسيت كلمة المرور؟" : "Mot de passe oublié ?"}
                              </button>
                            </div>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 rtl:left-auto rtl:right-0 pl-3 rtl:pl-0 rtl:pr-3 flex items-center pointer-events-none text-slate-400">
                                <Lock size={15} />
                              </div>
                              <input
                                required
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={authData.password}
                                onChange={e => setAuthData({...authData, password: e.target.value})}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-9 rtl:pl-9 rtl:pr-9 py-2.5 text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 pr-3 rtl:pr-0 rtl:pl-3 flex items-center text-slate-400 hover:text-slate-600"
                              >
                                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                              </button>
                            </div>
                          </div>

                          <button
                            type="submit"
                            disabled={loadingAuth}
                            className="w-full bg-sky-500 hover:bg-sky-600 active:scale-[0.99] text-white py-3 rounded-xl text-[13.5px] font-bold shadow-md shadow-sky-500/20 transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-1"
                          >
                            {loadingAuth ? (isArabic ? 'جاري الدخول...' : 'Connexion en cours...') : (isArabic ? 'تسجيل الدخول' : 'Se Connecter')}
                          </button>

                          <div className="relative flex py-1 items-center">
                            <div className="flex-grow border-t border-slate-200"></div>
                            <span className="flex-shrink-0 mx-3 text-slate-400 text-[10.5px] font-medium uppercase tracking-wider">
                              {isArabic ? "أو عبر" : "Ou continuer avec"}
                            </span>
                            <div className="flex-grow border-t border-slate-200"></div>
                          </div>

                          <button
                            type="button"
                            onClick={handleGoogleAuth}
                            disabled={loadingAuth}
                            className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-2.5 rounded-xl text-[12.5px] font-semibold transition-all flex items-center justify-center gap-2.5 shadow-2xs"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            <span>{isArabic ? "متابعة باستخدام Google" : "Continuer avec Google"}</span>
                          </button>
                        </form>

                        <div className="mt-4 text-center text-[12.5px] text-slate-500">
                          {isArabic ? "ليس لديك حساب بعد؟" : "Nouveau chez NAY ?"}{' '}
                          <button
                            onClick={() => { setAuthStep('signup'); setAuthError(''); }}
                            className="text-sky-600 font-bold hover:underline ml-1"
                          >
                            {isArabic ? "إنشاء حساب جديد" : "Créer un compte"}
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {authStep === 'signup' && (
                      <motion.div
                        key="mobile-signup"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.18 }}
                      >
                        {authError && (
                          <div className="bg-red-50 text-red-600 border border-red-100 rounded-xl p-3 text-[12.5px] mb-3.5 flex items-center gap-2">
                            <X size={15} className="flex-shrink-0" />
                            <span>{authError}</span>
                          </div>
                        )}

                        <form className="space-y-3.5" onSubmit={handleAuth}>
                          <div>
                            <label className="block text-[11.5px] font-semibold text-slate-700 mb-1">
                              {isArabic ? "الاسم الكامل" : "Nom complet"}
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 rtl:left-auto rtl:right-0 pl-3 rtl:pl-0 rtl:pr-3 flex items-center pointer-events-none text-slate-400">
                                <User size={15} />
                              </div>
                              <input
                                required
                                type="text"
                                placeholder={isArabic ? "الاسم الكامل" : "Votre nom et prénom"}
                                value={authData.name}
                                onChange={e => setAuthData({...authData, name: e.target.value})}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 rtl:pl-3.5 rtl:pr-9 py-2.5 text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11.5px] font-semibold text-slate-700 mb-1">
                              {isArabic ? "البريد الإلكتروني" : "Adresse e-mail"}
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 rtl:left-auto rtl:right-0 pl-3 rtl:pl-0 rtl:pr-3 flex items-center pointer-events-none text-slate-400">
                                <Mail size={15} />
                              </div>
                              <input
                                required
                                type="email"
                                placeholder={isArabic ? "name@example.com" : "votre@email.com"}
                                value={authData.email}
                                onChange={e => setAuthData({...authData, email: e.target.value})}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 rtl:pl-3.5 rtl:pr-9 py-2.5 text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11.5px] font-semibold text-slate-700 mb-1">
                              {isArabic ? "كلمة المرور" : "Mot de passe"}
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 rtl:left-auto rtl:right-0 pl-3 rtl:pl-0 rtl:pr-3 flex items-center pointer-events-none text-slate-400">
                                <Lock size={15} />
                              </div>
                              <input
                                required
                                type={showPassword ? "text" : "password"}
                                minLength={6}
                                placeholder="••••••••"
                                value={authData.password}
                                onChange={e => setAuthData({...authData, password: e.target.value})}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-9 rtl:pl-9 rtl:pr-9 py-2.5 text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 pr-3 rtl:pr-0 rtl:pl-3 flex items-center text-slate-400 hover:text-slate-600"
                              >
                                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                              </button>
                            </div>
                          </div>

                          <button
                            type="submit"
                            disabled={loadingAuth}
                            className="w-full bg-sky-500 hover:bg-sky-600 active:scale-[0.99] text-white py-3 rounded-xl text-[13.5px] font-bold shadow-md shadow-sky-500/20 transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-1"
                          >
                            {loadingAuth ? (isArabic ? 'جاري الإنشاء...' : 'Création en cours...') : (isArabic ? 'إنشاء حسابي' : "Créer mon compte")}
                          </button>

                          <div className="relative flex py-1 items-center">
                            <div className="flex-grow border-t border-slate-200"></div>
                            <span className="flex-shrink-0 mx-3 text-slate-400 text-[10.5px] font-medium uppercase tracking-wider">
                              {isArabic ? "أو عبر" : "Ou continuer avec"}
                            </span>
                            <div className="flex-grow border-t border-slate-200"></div>
                          </div>

                          <button
                            type="button"
                            onClick={handleGoogleAuth}
                            disabled={loadingAuth}
                            className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-2.5 rounded-xl text-[12.5px] font-semibold transition-all flex items-center justify-center gap-2.5 shadow-2xs"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            <span>{isArabic ? "متابعة باستخدام Google" : "Continuer avec Google"}</span>
                          </button>
                        </form>

                        <div className="mt-4 text-center text-[12.5px] text-slate-500">
                          {isArabic ? "لديك حساب بالفعل؟" : "Déjà un compte ?"}{' '}
                          <button
                            onClick={() => { setAuthStep('login'); setAuthError(''); }}
                            className="text-sky-600 font-bold hover:underline ml-1"
                          >
                            {isArabic ? "تسجيل الدخول" : "Se connecter"}
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {authStep === 'forgot' && (
                      <motion.div
                        key="mobile-forgot"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.18 }}
                      >
                        <div className="w-10 h-10 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center mb-3">
                          <KeyRound size={20} />
                        </div>
                        <h3 className={`text-xl font-extrabold text-slate-900 mb-1.5 ${isArabic ? 'font-arabic' : 'font-display'}`}>
                          {isArabic ? "استرجاع كلمة المرور" : "Mot de passe oublié"}
                        </h3>
                        <p className="text-slate-500 text-[12.5px] mb-4">
                          {isArabic ? "أدخل بريدك الإلكتروني لتلقي رمز الأمان." : "Saisissez votre e-mail pour recevoir le code."}
                        </p>
                        {resetStatus.error && (
                          <div className="bg-red-50 text-red-600 border border-red-100 rounded-xl p-3 text-[12.5px] mb-3.5 flex items-center gap-2">
                            <X size={15} className="flex-shrink-0" /> {resetStatus.error}
                          </div>
                        )}
                        {resetStatus.success && (
                          <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl p-3 text-[12.5px] mb-3.5 flex items-center gap-2">
                            <CheckCircle2 size={15} className="flex-shrink-0" /> {resetStatus.success}
                          </div>
                        )}
                        <form className="space-y-3.5" onSubmit={handleSendResetCode}>
                          <input
                            required
                            type="email"
                            placeholder={isArabic ? "name@example.com" : "votre@email.com"}
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[13.5px] text-slate-900 focus:bg-white focus:border-sky-500 outline-none"
                          />
                          <button
                            type="submit"
                            disabled={resetStatus.loading}
                            className="w-full bg-sky-500 hover:bg-sky-600 text-white py-3 rounded-xl text-[13.5px] font-bold shadow-md shadow-sky-500/20"
                          >
                            {resetStatus.loading ? (isArabic ? 'جاري الإرسال...' : 'Envoi...') : (isArabic ? 'إرسال الرمز' : 'Envoyer le code')}
                          </button>
                        </form>
                        <div className="mt-4">
                          <button
                            type="button"
                            onClick={() => { setAuthStep('login'); setResetStatus({ loading: false, error: '', success: '' }); }}
                            className="text-slate-600 text-[12.5px] font-semibold inline-flex items-center gap-1.5"
                          >
                            <ArrowLeft size={14} className="rtl:rotate-180" />
                            <span>{isArabic ? "العودة لتسجيل الدخول" : "Retour"}</span>
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {authStep === 'verify_reset' && (
                      <motion.div
                        key="mobile-verify"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.18 }}
                      >
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-3">
                          <ShieldCheck size={20} />
                        </div>
                        <h3 className={`text-xl font-extrabold text-slate-900 mb-1.5 ${isArabic ? 'font-arabic' : 'font-display'}`}>
                          {isArabic ? "رمز الأمان" : "Code de vérification"}
                        </h3>
                        <p className="text-slate-500 text-[12px] mb-3">
                          {isArabic ? `أدخل الرمز المرسل إلى ${forgotEmail}` : `Code envoyé à ${forgotEmail}`}
                        </p>
                        {resetStatus.error && (
                          <div className="bg-red-50 text-red-600 border border-red-100 rounded-xl p-2.5 text-[12px] mb-3">
                            {resetStatus.error}
                          </div>
                        )}
                        <form className="space-y-3" onSubmit={handleResetPassword}>
                          <input
                            required
                            type="tel"
                            maxLength={6}
                            placeholder="123456"
                            value={resetCode}
                            onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-center font-mono text-[18px] tracking-widest text-slate-900 focus:bg-white focus:border-sky-500 outline-none"
                          />
                          <input
                            required
                            type="password"
                            minLength={6}
                            placeholder={isArabic ? "كلمة المرور الجديدة" : "Nouveau mot de passe"}
                            value={resetNewPassword}
                            onChange={(e) => setResetNewPassword(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[13px] text-slate-900 focus:bg-white focus:border-sky-500 outline-none"
                          />
                          <input
                            required
                            type="password"
                            minLength={6}
                            placeholder={isArabic ? "تأكيد كلمة المرور" : "Confirmer le mot de passe"}
                            value={resetConfirmPassword}
                            onChange={(e) => setResetConfirmPassword(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[13px] text-slate-900 focus:bg-white focus:border-sky-500 outline-none"
                          />
                          <button
                            type="submit"
                            disabled={resetStatus.loading}
                            className="w-full bg-sky-500 hover:bg-sky-600 text-white py-3 rounded-xl text-[13px] font-bold shadow-md shadow-sky-500/20"
                          >
                            {resetStatus.loading ? (isArabic ? 'جاري التحديث...' : 'En cours...') : (isArabic ? 'تأكيد والدخول' : 'Confirmer')}
                          </button>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* ========================================================= */}
              {/* DESKTOP ONLY: 2-COLUMN LUXURY GRID (lg+)                  */}
              {/* ========================================================= */}
              <div className="hidden lg:grid lg:grid-cols-12 min-h-[620px]">
                
                {/* DESKTOP LEFT BANNER */}
                <div className="lg:col-span-5 p-3.5 xl:p-4.5 flex flex-col">
                  <div className="h-full rounded-[26px] p-8 xl:p-9 flex flex-col justify-between relative overflow-hidden text-white bg-gradient-to-br from-[#0284c7] via-[#0369a1] to-[#0c1f38] shadow-inner">
                    
                    {/* Ambient orbs */}
                    <motion.div
                      animate={{
                        y: [0, -14, 0],
                        x: [0, 8, 0],
                        scale: [1, 1.06, 1],
                        opacity: [0.25, 0.45, 0.25],
                      }}
                      transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
                      className="absolute -top-12 -right-12 w-64 h-64 bg-sky-300/30 rounded-full blur-3xl pointer-events-none"
                    />
                    <motion.div
                      animate={{
                        y: [0, 16, 0],
                        x: [0, -10, 0],
                        scale: [1, 1.1, 1],
                        opacity: [0.2, 0.38, 0.2],
                      }}
                      transition={{ repeat: Infinity, duration: 8.5, ease: "easeInOut", delay: 1 }}
                      className="absolute -bottom-16 -left-16 w-72 h-72 bg-blue-600/30 rounded-full blur-3xl pointer-events-none"
                    />

                    <div
                      className="absolute inset-0 opacity-[0.04] pointer-events-none"
                      style={{
                        backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                        backgroundSize: '22px 22px',
                      }}
                    />

                    {/* Top: Logo */}
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-20 h-9 bg-white"
                          style={{
                            maskImage: 'url("/images/nay/Artboard%202.png")',
                            WebkitMaskImage: 'url("/images/nay/Artboard%202.png")',
                            maskSize: 'contain',
                            WebkitMaskSize: 'contain',
                            maskRepeat: 'no-repeat',
                            WebkitMaskRepeat: 'no-repeat',
                            maskPosition: isArabic ? 'right center' : 'left center',
                            WebkitMaskPosition: isArabic ? 'right center' : 'left center',
                          }}
                        />
                        <div className="h-4 w-[1px] bg-white/20" />
                        <span className={`text-[10px] text-sky-200 tracking-wider uppercase font-medium ${isArabic ? 'font-arabic' : 'font-display'}`}>
                          {isArabic ? "دار العطور والـ Testeurs" : "Haute Parfumerie"}
                        </span>
                      </div>

                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[10px] text-sky-200">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
                        </span>
                        <span>{isArabic ? "خدمة نشطة" : "En direct"}</span>
                      </div>
                    </div>

                    {/* Middle: Headline */}
                    <div className="relative z-10 my-auto py-8">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[11px] font-semibold text-sky-200 w-fit mb-4 shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-300"></span>
                        <span className={isArabic ? 'font-arabic' : 'font-display tracking-wider uppercase text-[10px]'}>
                          {isArabic ? "فضاء الزبناء المميزين" : "Cercle Privilège NAY"}
                        </span>
                      </div>

                      <h2 className={`text-2xl xl:text-3xl font-extrabold text-white tracking-tight leading-[1.25] ${isArabic ? 'font-arabic' : 'font-display'}`}>
                        {isArabic ? (
                          <>عالمك العطري الخاص<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-200 via-white to-sky-300">في انتظارك الآن</span></>
                        ) : (
                          <>Votre Signature Olfactive<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-100 via-white to-sky-200">Vous Attend</span></>
                        )}
                      </h2>

                      <p className="text-white/85 text-[13px] leading-relaxed mt-3.5 max-w-xs font-normal">
                        {isArabic
                          ? "سجّل دخولك لمتابعة طلبياتك في الوقت الفعلي، حفظ عطرك المفضل والاستفادة من أسبقية الحصول على تشكيلات التيستور الحصرية."
                          : "Accédez à votre compte pour suivre vos commandes en temps réel, sauvegarder vos parfums favoris et profiter de nos offres testeurs exclusives."}
                      </p>
                    </div>

                    {/* Bottom: 3 Step Cards */}
                    <div className="relative z-10 grid grid-cols-3 gap-2 pt-4 border-t border-white/15">
                      <div className="bg-white text-slate-900 rounded-xl p-2.5 shadow-md flex flex-col justify-between">
                        <div className="w-5 h-5 rounded-full bg-sky-500 text-white text-[10px] font-bold flex items-center justify-center mb-1.5 shadow-xs">1</div>
                        <div>
                          <div className={`font-bold text-[10.5px] leading-tight text-slate-900 truncate ${isArabic ? 'font-arabic' : 'font-display'}`}>
                            {isArabic ? "توصيل 24-48h" : "Suivi 24-48h"}
                          </div>
                          <div className="text-[9px] text-slate-500 leading-tight mt-0.5 truncate">
                            {isArabic ? "معاينة قبل الدفع" : "Inspection colis"}
                          </div>
                        </div>
                      </div>

                      <div className="bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl p-2.5 flex flex-col justify-between">
                        <div className="w-5 h-5 rounded-full bg-white/20 text-white text-[10px] font-bold flex items-center justify-center mb-1.5">2</div>
                        <div>
                          <div className={`font-bold text-[10.5px] leading-tight text-white truncate ${isArabic ? 'font-arabic' : 'font-display'}`}>
                            {isArabic ? "قائمة الرغبات" : "Wishlist"}
                          </div>
                          <div className="text-[9px] text-white/70 leading-tight mt-0.5 truncate">
                            {isArabic ? "عطورك المحفوظة" : "Favoris sauvés"}
                          </div>
                        </div>
                      </div>

                      <div className="bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl p-2.5 flex flex-col justify-between">
                        <div className="w-5 h-5 rounded-full bg-white/20 text-white text-[10px] font-bold flex items-center justify-center mb-1.5">3</div>
                        <div>
                          <div className={`font-bold text-[10.5px] leading-tight text-white truncate ${isArabic ? 'font-arabic' : 'font-display'}`}>
                            {isArabic ? "عروض VIP" : "Offres VIP"}
                          </div>
                          <div className="text-[9px] text-white/70 leading-tight mt-0.5 truncate">
                            {isArabic ? "تيسترات حصرية" : "Testeurs exclusifs"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* DESKTOP RIGHT FORM COLUMN */}
                <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center">
                  
                  {/* Desktop Tab Switcher */}
                  {(authStep === 'login' || authStep === 'signup') && (
                    <div className="flex bg-slate-100/90 p-1 rounded-xl mb-6 relative border border-slate-200/60 max-w-xs select-none">
                      <button
                        type="button"
                        onClick={() => { setAuthStep('login'); setAuthError(''); }}
                        className={`relative z-10 flex-1 py-2 text-center text-[13px] font-bold transition-colors ${
                          authStep === 'login' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {authStep === 'login' && (
                          <motion.div
                            layoutId="desktop-auth-pill"
                            className="absolute inset-0 bg-white rounded-lg shadow-xs"
                            transition={{ type: "spring", stiffness: 450, damping: 32 }}
                          />
                        )}
                        <span className={`relative z-10 ${isArabic ? 'font-arabic' : 'font-display'}`}>
                          {isArabic ? "تسجيل الدخول" : "Se Connecter"}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => { setAuthStep('signup'); setAuthError(''); }}
                        className={`relative z-10 flex-1 py-2 text-center text-[13px] font-bold transition-colors ${
                          authStep === 'signup' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {authStep === 'signup' && (
                          <motion.div
                            layoutId="desktop-auth-pill"
                            className="absolute inset-0 bg-white rounded-lg shadow-xs"
                            transition={{ type: "spring", stiffness: 450, damping: 32 }}
                          />
                        )}
                        <span className={`relative z-10 ${isArabic ? 'font-arabic' : 'font-display'}`}>
                          {isArabic ? "إنشاء حساب" : "Créer un compte"}
                        </span>
                      </button>
                    </div>
                  )}

                  <AnimatePresence mode="wait">
                    {/* Desktop Login */}
                    {authStep === 'login' && (
                      <motion.div
                        key="desktop-login"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="mb-6">
                          <span className={`text-[11px] font-bold uppercase tracking-wider text-sky-600 mb-1 block ${isArabic ? 'font-arabic' : 'font-display tracking-[0.15em]'}`}>
                            {isArabic ? "مرحباً بكم من جديد" : "ESPACE PERSONNEL"}
                          </span>
                          <h3 className={`text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1.5 tracking-tight ${isArabic ? 'font-arabic' : 'font-display'}`}>
                            {isArabic ? "تسجيل الدخول" : "Se Connecter"}
                          </h3>
                          <p className="text-slate-500 text-[13px]">
                            {isArabic
                              ? "أدخل بريدك الإلكتروني وكلمة المرور للوصول إلى حسابك وتتبع طلبياتك."
                              : "Saisissez vos identifiants pour accéder à vos commandes et privilèges."}
                          </p>
                        </div>

                        {authError && (
                          <div className="bg-red-50 text-red-600 border border-red-100 rounded-xl p-3 text-[13px] mb-5 flex items-center gap-2">
                            <X size={16} className="flex-shrink-0" />
                            <span>{authError}</span>
                          </div>
                        )}

                        <form className="space-y-4" onSubmit={handleAuth}>
                          <div>
                            <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                              {isArabic ? "البريد الإلكتروني" : "Adresse e-mail"}
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 rtl:left-auto rtl:right-0 pl-3.5 rtl:pl-0 rtl:pr-3.5 flex items-center pointer-events-none text-slate-400">
                                <Mail size={16} />
                              </div>
                              <input
                                required
                                type="email"
                                placeholder={isArabic ? "name@example.com" : "votre@email.com"}
                                value={authData.email}
                                onChange={e => setAuthData({...authData, email: e.target.value})}
                                className="w-full bg-slate-50 border border-slate-200/90 rounded-xl pl-10 pr-4 rtl:pl-4 rtl:pr-10 py-3 text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 outline-none transition-all"
                              />
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="text-[12px] font-semibold text-slate-700">
                                {isArabic ? "كلمة المرور" : "Mot de passe"}
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  setForgotEmail(authData.email);
                                  setResetStatus({ loading: false, error: '', success: '' });
                                  setAuthStep('forgot');
                                }}
                                className="text-[12px] text-sky-600 hover:text-sky-700 font-semibold transition-colors"
                              >
                                {isArabic ? "نسيت كلمة المرور؟" : "Mot de passe oublié ?"}
                              </button>
                            </div>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 rtl:left-auto rtl:right-0 pl-3.5 rtl:pl-0 rtl:pr-3.5 flex items-center pointer-events-none text-slate-400">
                                <Lock size={16} />
                              </div>
                              <input
                                required
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={authData.password}
                                onChange={e => setAuthData({...authData, password: e.target.value})}
                                className="w-full bg-slate-50 border border-slate-200/90 rounded-xl pl-10 pr-10 rtl:pl-10 rtl:pr-10 py-3 text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 outline-none transition-all"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 pr-3.5 rtl:pr-0 rtl:pl-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                              >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                          </div>

                          <button
                            type="submit"
                            disabled={loadingAuth}
                            className="w-full bg-sky-500 hover:bg-sky-600 active:scale-[0.99] text-white py-3.5 rounded-xl text-[13.5px] font-bold tracking-wide shadow-md shadow-sky-500/20 hover:shadow-sky-500/30 transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
                          >
                            {loadingAuth ? (isArabic ? 'جاري الدخول...' : 'Connexion en cours...') : (isArabic ? 'تسجيل الدخول' : 'Se Connecter')}
                          </button>

                          <div className="relative flex py-2 items-center my-1">
                            <div className="flex-grow border-t border-slate-200"></div>
                            <span className="flex-shrink-0 mx-4 text-slate-400 text-[11px] font-medium uppercase tracking-wider">
                              {isArabic ? "أو المتابعة عبر" : "Ou continuer avec"}
                            </span>
                            <div className="flex-grow border-t border-slate-200"></div>
                          </div>

                          <button
                            type="button"
                            onClick={handleGoogleAuth}
                            disabled={loadingAuth}
                            className="w-full bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 py-3 rounded-xl text-[13px] font-semibold transition-all flex items-center justify-center gap-3 shadow-2xs"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            <span>{isArabic ? "متابعة باستخدام Google" : "Continuer avec Google"}</span>
                          </button>
                        </form>

                        <div className="mt-6 text-center text-[13px] text-slate-500">
                          {isArabic ? "ليس لديك حساب بعد؟" : "Nouveau chez NAY ?"}{' '}
                          <button
                            onClick={() => { setAuthStep('signup'); setAuthError(''); }}
                            className="text-sky-600 font-bold hover:underline hover:text-sky-700 ml-1"
                          >
                            {isArabic ? "إنشاء حساب جديد" : "Créer un compte"}
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* Desktop Signup */}
                    {authStep === 'signup' && (
                      <motion.div
                        key="desktop-signup"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="mb-6">
                          <span className={`text-[11px] font-bold uppercase tracking-wider text-sky-600 mb-1 block ${isArabic ? 'font-arabic' : 'font-display tracking-[0.15em]'}`}>
                            {isArabic ? "انضم إلى عائلة ناي" : "NOUVEAU MEMBRE"}
                          </span>
                          <h3 className={`text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1.5 tracking-tight ${isArabic ? 'font-arabic' : 'font-display'}`}>
                            {isArabic ? "إنشاء حساب جديد" : "Créer un compte"}
                          </h3>
                          <p className="text-slate-500 text-[13px]">
                            {isArabic
                              ? "أنشئ حسابك واستفد من متابعة طلبياتك والعروض الحصرية."
                              : "Créez votre compte pour suivre vos commandes et bénéficier d'avantages VIP."}
                          </p>
                        </div>

                        {authError && (
                          <div className="bg-red-50 text-red-600 border border-red-100 rounded-xl p-3 text-[13px] mb-5 flex items-center gap-2">
                            <X size={16} className="flex-shrink-0" />
                            <span>{authError}</span>
                          </div>
                        )}

                        <form className="space-y-4" onSubmit={handleAuth}>
                          <div>
                            <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                              {isArabic ? "الاسم الكامل" : "Nom complet"}
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 rtl:left-auto rtl:right-0 pl-3.5 rtl:pl-0 rtl:pr-3.5 flex items-center pointer-events-none text-slate-400">
                                <User size={16} />
                              </div>
                              <input
                                required
                                type="text"
                                placeholder={isArabic ? "الاسم الكامل" : "Votre nom et prénom"}
                                value={authData.name}
                                onChange={e => setAuthData({...authData, name: e.target.value})}
                                className="w-full bg-slate-50 border border-slate-200/90 rounded-xl pl-10 pr-4 rtl:pl-4 rtl:pr-10 py-3 text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 outline-none transition-all"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                              {isArabic ? "البريد الإلكتروني" : "Adresse e-mail"}
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 rtl:left-auto rtl:right-0 pl-3.5 rtl:pl-0 rtl:pr-3.5 flex items-center pointer-events-none text-slate-400">
                                <Mail size={16} />
                              </div>
                              <input
                                required
                                type="email"
                                placeholder={isArabic ? "name@example.com" : "votre@email.com"}
                                value={authData.email}
                                onChange={e => setAuthData({...authData, email: e.target.value})}
                                className="w-full bg-slate-50 border border-slate-200/90 rounded-xl pl-10 pr-4 rtl:pl-4 rtl:pr-10 py-3 text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 outline-none transition-all"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                              {isArabic ? "كلمة المرور" : "Mot de passe"}
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 rtl:left-auto rtl:right-0 pl-3.5 rtl:pl-0 rtl:pr-3.5 flex items-center pointer-events-none text-slate-400">
                                <Lock size={16} />
                              </div>
                              <input
                                required
                                type={showPassword ? "text" : "password"}
                                minLength={6}
                                placeholder="••••••••"
                                value={authData.password}
                                onChange={e => setAuthData({...authData, password: e.target.value})}
                                className="w-full bg-slate-50 border border-slate-200/90 rounded-xl pl-10 pr-10 rtl:pl-10 rtl:pr-10 py-3 text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 outline-none transition-all"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 pr-3.5 rtl:pr-0 rtl:pl-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                              >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                          </div>

                          <button
                            type="submit"
                            disabled={loadingAuth}
                            className="w-full bg-sky-500 hover:bg-sky-600 active:scale-[0.99] text-white py-3.5 rounded-xl text-[13.5px] font-bold tracking-wide shadow-md shadow-sky-500/20 hover:shadow-sky-500/30 transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
                          >
                            {loadingAuth ? (isArabic ? 'جاري الإنشاء...' : 'Création en cours...') : (isArabic ? 'إنشاء حسابي' : "Créer mon compte")}
                          </button>

                          <div className="relative flex py-2 items-center my-1">
                            <div className="flex-grow border-t border-slate-200"></div>
                            <span className="flex-shrink-0 mx-4 text-slate-400 text-[11px] font-medium uppercase tracking-wider">
                              {isArabic ? "أو المتابعة عبر" : "Ou continuer avec"}
                            </span>
                            <div className="flex-grow border-t border-slate-200"></div>
                          </div>

                          <button
                            type="button"
                            onClick={handleGoogleAuth}
                            disabled={loadingAuth}
                            className="w-full bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 py-3 rounded-xl text-[13px] font-semibold transition-all flex items-center justify-center gap-3 shadow-2xs"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            <span>{isArabic ? "متابعة باستخدام Google" : "Continuer avec Google"}</span>
                          </button>
                        </form>

                        <div className="mt-6 text-center text-[13px] text-slate-500">
                          {isArabic ? "لديك حساب بالفعل؟" : "Déjà un compte ?"}{' '}
                          <button
                            onClick={() => { setAuthStep('login'); setAuthError(''); }}
                            className="text-sky-600 font-bold hover:underline hover:text-sky-700 ml-1"
                          >
                            {isArabic ? "تسجيل الدخول" : "Se connecter"}
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* Desktop Forgot */}
                    {authStep === 'forgot' && (
                      <motion.div
                        key="desktop-forgot"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mb-4 shadow-xs">
                          <KeyRound size={22} />
                        </div>
                        <h3 className={`text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2 tracking-tight ${isArabic ? 'font-arabic' : 'font-display'}`}>
                          {isArabic ? "استرجاع كلمة المرور" : "Mot de passe oublié"}
                        </h3>
                        <p className="text-slate-500 text-[13px] mb-6 leading-relaxed">
                          {isArabic ? "أدخل بريدك الإلكتروني لتلقي رمز الأمان المكون من 6 أرقام." : "Saisissez votre e-mail pour recevoir le code de vérification à 6 chiffres."}
                        </p>
                        {resetStatus.error && (
                          <div className="bg-red-50 text-red-600 border border-red-100 rounded-xl p-3 text-[13px] mb-5 flex items-center gap-2">
                            <X size={16} className="flex-shrink-0" /> {resetStatus.error}
                          </div>
                        )}
                        {resetStatus.success && (
                          <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl p-3 text-[13px] mb-5 flex items-center gap-2">
                            <CheckCircle2 size={16} className="flex-shrink-0" /> {resetStatus.success}
                          </div>
                        )}
                        <form className="space-y-4" onSubmit={handleSendResetCode}>
                          <div>
                            <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                              {isArabic ? "البريد الإلكتروني" : "Adresse e-mail"}
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 rtl:left-auto rtl:right-0 pl-3.5 rtl:pl-0 rtl:pr-3.5 flex items-center pointer-events-none text-slate-400">
                                <Mail size={16} />
                              </div>
                              <input
                                required
                                type="email"
                                placeholder={isArabic ? "name@example.com" : "votre@email.com"}
                                value={forgotEmail}
                                onChange={(e) => setForgotEmail(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200/90 rounded-xl pl-10 pr-4 rtl:pl-4 rtl:pr-10 py-3.5 text-[14px] text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 outline-none transition-all"
                              />
                            </div>
                          </div>
                          <button
                            type="submit"
                            disabled={resetStatus.loading}
                            className="w-full bg-sky-500 hover:bg-sky-600 text-white py-3.5 rounded-xl text-[13.5px] font-bold tracking-wide shadow-md shadow-sky-500/20"
                          >
                            {resetStatus.loading ? (isArabic ? 'جاري الإرسال...' : 'Envoi...') : (isArabic ? 'إرسال الرمز' : 'Envoyer le code')}
                          </button>
                        </form>
                        <div className="mt-8">
                          <button
                            type="button"
                            onClick={() => { setAuthStep('login'); setResetStatus({ loading: false, error: '', success: '' }); }}
                            className="text-slate-600 hover:text-sky-600 text-[13px] font-semibold inline-flex items-center gap-1.5"
                          >
                            <ArrowLeft size={14} className="rtl:rotate-180" />
                            <span>{isArabic ? "العودة لتسجيل الدخول" : "Retour à la connexion"}</span>
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* Desktop Verify */}
                    {authStep === 'verify_reset' && (
                      <motion.div
                        key="desktop-verify"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-xs">
                          <ShieldCheck size={24} />
                        </div>
                        <h3 className={`text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2 tracking-tight ${isArabic ? 'font-arabic' : 'font-display'}`}>
                          {isArabic ? "رمز الأمان والتأكيد" : "Code de vérification"}
                        </h3>
                        <p className="text-slate-500 text-[13px] mb-6 leading-relaxed">
                          {isArabic ? `أدخل الرمز المكون من 6 أرقام المرسل إلى ${forgotEmail}` : `Saisissez le code à 6 chiffres envoyé à ${forgotEmail}`}
                        </p>
                        {resetStatus.error && (
                          <div className="bg-red-50 text-red-600 border border-red-100 rounded-xl p-3 text-[13px] mb-5 flex items-center gap-2">
                            <X size={16} className="flex-shrink-0" /> {resetStatus.error}
                          </div>
                        )}
                        <form className="space-y-4" onSubmit={handleResetPassword}>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">
                              {isArabic ? "رمز الأمان (6 أرقام)" : "Code de sécurité (6 chiffres)"}
                            </label>
                            <input
                              id="account-reset-code-input-desktop"
                              required
                              type="tel"
                              pattern="[0-9]*"
                              inputMode="numeric"
                              maxLength={6}
                              value={resetCode}
                              onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              className="w-full bg-slate-50 border border-slate-200/90 rounded-xl py-3.5 text-center font-mono text-[22px] tracking-widest text-slate-900 focus:bg-white focus:border-sky-500 outline-none"
                              autoFocus
                            />
                          </div>
                          <div>
                            <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                              {isArabic ? "كلمة المرور الجديدة" : "Nouveau mot de passe"}
                            </label>
                            <input
                              required
                              type="password"
                              minLength={6}
                              value={resetNewPassword}
                              onChange={(e) => setResetNewPassword(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-3 text-[13.5px] text-slate-900 focus:bg-white focus:border-sky-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                              {isArabic ? "تأكيد كلمة المرور" : "Confirmer le mot de passe"}
                            </label>
                            <input
                              required
                              type="password"
                              minLength={6}
                              value={resetConfirmPassword}
                              onChange={(e) => setResetConfirmPassword(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-3 text-[13.5px] text-slate-900 focus:bg-white focus:border-sky-500 outline-none"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={resetStatus.loading}
                            className="w-full bg-sky-500 hover:bg-sky-600 text-white py-3.5 rounded-xl text-[13.5px] font-bold shadow-md shadow-sky-500/20"
                          >
                            {resetStatus.loading ? (isArabic ? 'جاري التحديث...' : 'En cours...') : (isArabic ? 'تأكيد والدخول' : 'Réinitialiser & Se Connecter')}
                          </button>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>
              </div>

            </div>
          )}

        </div>
      </main>

      <Footer />
      <CartDrawer />
    </div>
  );
}
