export interface PermissionDefinition {
  key: string;
  label: string;
  description: string;
  module: PermissionModule;
  isSensitive?: boolean;
}

export type PermissionModule =
  | 'dashboard'
  | 'orders'
  | 'products'
  | 'inventory'
  | 'customers'
  | 'finance'
  | 'marketing'
  | 'messages'
  | 'reviews'
  | 'team'
  | 'tasks'
  | 'activity'
  | 'settings';

export const PERMISSION_MODULES: { id: PermissionModule; label: string; iconName: string }[] = [
  { id: 'dashboard', label: 'Tableau de Bord & KPIs', iconName: 'LayoutDashboard' },
  { id: 'orders', label: 'Commandes & Expéditions', iconName: 'ShoppingBag' },
  { id: 'products', label: 'Produits & Testeurs', iconName: 'PackageSearch' },
  { id: 'inventory', label: 'Inventaire & Stock', iconName: 'Archive' },
  { id: 'customers', label: 'Clients & CRM', iconName: 'Users' },
  { id: 'finance', label: 'Finance & Comptabilité', iconName: 'TrendingUp' },
  { id: 'marketing', label: 'Marketing, Ads & Campagnes', iconName: 'Mail' },
  { id: 'messages', label: 'Support & Messagerie', iconName: 'MessageSquare' },
  { id: 'reviews', label: 'Avis Clients & Témoignages', iconName: 'Star' },
  { id: 'team', label: 'Gestion de l\'Équipe & RH', iconName: 'ShieldCheck' },
  { id: 'tasks', label: 'Missions & Tâches', iconName: 'CheckSquare' },
  { id: 'activity', label: 'Journal d\'Activité & Audit', iconName: 'History' },
  { id: 'settings', label: 'Paramètres & Configuration', iconName: 'Settings' },
];

export const ALL_PERMISSIONS: PermissionDefinition[] = [
  // --- DASHBOARD ---
  {
    key: 'dashboard.view',
    label: 'Accéder au Tableau de Bord',
    description: 'Accès visuel à l\'accueil du panneau d\'administration',
    module: 'dashboard',
  },
  {
    key: 'dashboard.view_financials',
    label: 'Voir les KPIs Financiers',
    description: 'Afficher le chiffre d\'affaires, bénéfice net et marges sur le dashboard',
    module: 'dashboard',
    isSensitive: true,
  },
  {
    key: 'dashboard.view_operations',
    label: 'Voir les KPIs Opérationnels',
    description: 'Commandes à préparer, alertes de stock et logistique',
    module: 'dashboard',
  },
  {
    key: 'dashboard.view_marketing',
    label: 'Voir les KPIs Marketing',
    description: 'Dépenses publicitaires, ROAS, conversions et paniers en direct',
    module: 'dashboard',
  },
  {
    key: 'dashboard.view_support',
    label: 'Voir les KPIs Support Client',
    description: 'Messages en attente, avis clients et confirmations',
    module: 'dashboard',
  },

  // --- ORDERS ---
  {
    key: 'orders.view',
    label: 'Voir les Commandes',
    description: 'Consulter la liste et le détail des commandes clients',
    module: 'orders',
  },
  {
    key: 'orders.create',
    label: 'Créer une Commande Manuelle',
    description: 'Saisir une commande passée par téléphone, WhatsApp ou direct',
    module: 'orders',
  },
  {
    key: 'orders.edit',
    label: 'Modifier une Commande',
    description: 'Modifier les articles, coordonnées et adresses de livraison',
    module: 'orders',
  },
  {
    key: 'orders.change_status',
    label: 'Changer le Statut de Commande',
    description: 'Passer les commandes en Expédiée, Livrée, Annulée, etc.',
    module: 'orders',
  },
  {
    key: 'orders.confirm',
    label: 'Confirmer / Refuser une Commande',
    description: 'Appel client, confirmation téléphonique et validation',
    module: 'orders',
  },
  {
    key: 'orders.prepare',
    label: 'Préparer & Emballer la Commande',
    description: 'Marquer les commandes comme préparées pour l\'expédition',
    module: 'orders',
  },
  {
    key: 'orders.cancel',
    label: 'Annuler une Commande',
    description: 'Annuler une commande non validée ou refusée',
    module: 'orders',
  },
  {
    key: 'orders.refund',
    label: 'Traiter les Remboursements / Retours',
    description: 'Gérer les retours colis et remboursements',
    module: 'orders',
    isSensitive: true,
  },
  {
    key: 'orders.export',
    label: 'Exporter les Commandes (CSV / Excel)',
    description: 'Télécharger les listings complets de commandes',
    module: 'orders',
    isSensitive: true,
  },
  {
    key: 'orders.delete',
    label: 'Supprimer Définitivement une Commande',
    description: 'Supprimer un enregistrement de commande',
    module: 'orders',
    isSensitive: true,
  },
  {
    key: 'orders.view_sensitive_financials',
    label: 'Voir les Coûts d\'Achat des Commandes',
    description: 'Consulter le coût de revient et la marge nette par commande',
    module: 'orders',
    isSensitive: true,
  },
  {
    key: 'orders.manage_attachments',
    label: 'Gérer les Pièces Jointes des Commandes',
    description: 'Téléverser et consulter les bordereaux de transport, justificatifs et photos de colis',
    module: 'orders',
  },

  // --- PRODUCTS ---
  {
    key: 'products.view',
    label: 'Consulter le Catalogue Produits & Testeurs',
    description: 'Voir les 199 testeurs, coffrets et parfums originaux',
    module: 'products',
  },
  {
    key: 'products.create',
    label: 'Ajouter un Nouveau Produit / Testeur',
    description: 'Créer une fiche produit avec photos, notes olfactives et descriptif',
    module: 'products',
  },
  {
    key: 'products.edit',
    label: 'Modifier les Informations Produits',
    description: 'Modifier la description, photos, marques et catégories',
    module: 'products',
  },
  {
    key: 'products.edit_price',
    label: 'Modifier les Prix de Vente',
    description: 'Changer les prix normaux et prix barrés/promos',
    module: 'products',
    isSensitive: true,
  },
  {
    key: 'products.edit_cost',
    label: 'Modifier les Coûts d\'Achat Fournisseurs',
    description: 'Gérer le prix de revient secret des parfums',
    module: 'products',
    isSensitive: true,
  },
  {
    key: 'products.delete',
    label: 'Supprimer un Produit du Catalogue',
    description: 'Supprimer définitivement un testeur ou coffret',
    module: 'products',
    isSensitive: true,
  },

  // --- INVENTORY ---
  {
    key: 'inventory.view',
    label: 'Consulter l\'Inventaire & les Stocks',
    description: 'Voir les niveaux de stock actuels de tous les parfums',
    module: 'inventory',
  },
  {
    key: 'inventory.adjust',
    label: 'Ajuster les Quantités en Stock',
    description: 'Entrées et sorties manuelles de stock suite à comptage',
    module: 'inventory',
  },
  {
    key: 'inventory.inventory_count',
    label: 'Effectuer un Inventaire Physique',
    description: 'Session de comptage global et validation des écarts',
    module: 'inventory',
  },
  {
    key: 'inventory.suppliers',
    label: 'Gérer les Fournisseurs & Approvisionnements',
    description: 'Contacts fournisseurs, bons de commande et réassort',
    module: 'inventory',
    isSensitive: true,
  },

  // --- CUSTOMERS ---
  {
    key: 'customers.view',
    label: 'Consulter le Fichier Clients',
    description: 'Voir les fiches clients et historique d\'achats',
    module: 'customers',
  },
  {
    key: 'customers.edit',
    label: 'Modifier une Fiche Client',
    description: 'Mettre à jour l\'adresse, téléphone ou notes internes',
    module: 'customers',
  },
  {
    key: 'customers.contact',
    label: 'Contacter le Client (WhatsApp / Appel)',
    description: 'Boutons directs d\'appel et message WhatsApp',
    module: 'customers',
  },
  {
    key: 'customers.export',
    label: 'Exporter la Base Clients (CSV)',
    description: 'Téléchargement de la liste complète des clients',
    module: 'customers',
    isSensitive: true,
  },
  {
    key: 'customers.view_vip',
    label: 'Gérer les Clients VIP & Fidélité',
    description: 'Accéder à la liste des clients VIP à forte valeur',
    module: 'customers',
  },
  {
    key: 'customers.delete',
    label: 'Supprimer un Client',
    description: 'Supprimer un compte client du CRM',
    module: 'customers',
    isSensitive: true,
  },

  // --- FINANCE ---
  {
    key: 'finance.view_revenue',
    label: 'Voir le Chiffre d\'Affaires Global',
    description: 'Consulter les ventes totales et moyennes journalières',
    module: 'finance',
    isSensitive: true,
  },
  {
    key: 'finance.view_costs',
    label: 'Voir les Coûts & Dépenses de l\'Entreprise',
    description: 'Coûts des marchandises, livraisons, publicité et frais',
    module: 'finance',
    isSensitive: true,
  },
  {
    key: 'finance.view_profit',
    label: 'Voir le Bénéfice Net & la Rentabilité',
    description: 'Bénéfice net, ROI et marge globale de l\'entreprise',
    module: 'finance',
    isSensitive: true,
  },
  {
    key: 'finance.add_expense',
    label: 'Ajouter une Dépense / Facture',
    description: 'Enregistrer une charge opérationnelle ou paiement fournisseur',
    module: 'finance',
  },
  {
    key: 'finance.edit_expense',
    label: 'Modifier / Supprimer une Dépense',
    description: 'Mettre à jour les écritures comptables',
    module: 'finance',
    isSensitive: true,
  },
  {
    key: 'finance.export',
    label: 'Exporter les Rapports Financiers',
    description: 'Télécharger les bilans comptables et rapports financiers',
    module: 'finance',
    isSensitive: true,
  },

  // --- MARKETING ---
  {
    key: 'marketing.view',
    label: 'Accéder aux Outils Marketing',
    description: 'Consulter le hub marketing, rétention et analytics',
    module: 'marketing',
  },
  {
    key: 'marketing.manage_campaigns',
    label: 'Gérer les Campagnes Publicitaires & Emailing',
    description: 'Créer et lancer des campagnes d\'acquisition et relances',
    module: 'marketing',
  },
  {
    key: 'marketing.manage_promotions',
    label: 'Gérer les Codes Promo & Offres',
    description: 'Créer des réductions, coupons et offres limitées',
    module: 'marketing',
  },
  {
    key: 'marketing.manage_creatives',
    label: 'Gérer le Hub Créatifs Publicitaires (Ads)',
    description: 'Téléverser et organiser les vidéos TikTok, Reels et UGC',
    module: 'marketing',
  },
  {
    key: 'marketing.manage_landing_pages',
    label: 'Gérer les Landing Pages & Vitrines Spéciales',
    description: 'Créer et modifier les pages d\'atterrissage promotionnelles',
    module: 'marketing',
  },
  {
    key: 'marketing.manage_affiliates',
    label: 'Gérer les Ambassadeurs & Affiliation',
    description: 'Suivre les commissions des partenaires et influenceurs',
    module: 'marketing',
  },
  {
    key: 'marketing.manage_seo',
    label: 'Gérer le Référencement Naturel (SEO) & Blog',
    description: 'Optimisation des mots-clés, articles de blog et balises',
    module: 'marketing',
  },
  {
    key: 'marketing.manage_newsletter',
    label: 'Gérer les Abonnés Newsletter',
    description: 'Consulter la liste des abonnés et envoyer des e-mails',
    module: 'marketing',
  },
  {
    key: 'marketing.view_analytics',
    label: 'Consulter l\'Audience & Statistiques Avancées',
    description: 'Trafic en temps réel, sources de trafic et taux de rebond',
    module: 'marketing',
  },

  // --- MESSAGES & REVIEWS ---
  {
    key: 'messages.view',
    label: 'Consulter les Messages des Clients',
    description: 'Voir les demandes de contact et questions formulaires',
    module: 'messages',
  },
  {
    key: 'messages.reply',
    label: 'Répondre aux Messages Clients',
    description: 'Envoyer des e-mails ou réponses directes au client',
    module: 'messages',
  },
  {
    key: 'reviews.view',
    label: 'Consulter les Avis Clients',
    description: 'Voir les témoignages et évaluations reçues',
    module: 'reviews',
  },
  {
    key: 'reviews.moderate',
    label: 'Modérer les Avis (Valider / Supprimer)',
    description: 'Approuver ou masquer un avis sur la boutique en ligne',
    module: 'reviews',
  },

  // --- TEAM MANAGEMENT ---
  {
    key: 'team.view',
    label: 'Consulter la Liste de l\'Équipe',
    description: 'Voir les collaborateurs, rôles et statuts d\'activité',
    module: 'team',
  },
  {
    key: 'team.create',
    label: 'Créer un Compte Employé',
    description: 'Ajouter un nouveau membre dans l\'équipe NAY',
    module: 'team',
    isSensitive: true,
  },
  {
    key: 'team.edit',
    label: 'Modifier les Informations d\'un Collaborateur',
    description: 'Modifier le nom, email, titre et photo d\'un membre',
    module: 'team',
    isSensitive: true,
  },
  {
    key: 'team.change_role',
    label: 'Modifier le Rôle d\'un Collaborateur',
    description: 'Changer le poste assigné à un employé',
    module: 'team',
    isSensitive: true,
  },
  {
    key: 'team.manage_permissions',
    label: 'Personnaliser les Permissions Granulaires',
    description: 'Accorder ou révoquer des accès spécifiques par employé',
    module: 'team',
    isSensitive: true,
  },
  {
    key: 'team.disable',
    label: 'Désactiver / Réactiver un Employé',
    description: 'Bloquer immédiatement l\'accès d\'un collaborateur',
    module: 'team',
    isSensitive: true,
  },
  {
    key: 'team.delete',
    label: 'Supprimer Définitivement un Employé',
    description: 'Supprimer complètement un compte collaborateur de la base de données',
    module: 'team',
    isSensitive: true,
  },

  // --- TASKS & MISSIONS ---
  {
    key: 'tasks.view',
    label: 'Consulter les Missions & Tâches',
    description: 'Voir les tâches opérationnelles du tableau Kanban',
    module: 'tasks',
  },
  {
    key: 'tasks.create',
    label: 'Créer & Assigner une Mission',
    description: 'Créer une tâche pour soi-même ou un collègue',
    module: 'tasks',
  },
  {
    key: 'tasks.edit',
    label: 'Modifier / Compléter une Mission',
    description: 'Changer le statut, la priorité ou laisser des commentaires',
    module: 'tasks',
  },
  {
    key: 'tasks.delete',
    label: 'Supprimer une Mission',
    description: 'Retirer une tâche du tableau de gestion',
    module: 'tasks',
  },

  // --- ACTIVITY & AUDIT ---
  {
    key: 'activity.view_all',
    label: 'Consulter le Journal d\'Activité Global',
    description: 'Voir l\'historique d\'actions de tous les collaborateurs',
    module: 'activity',
  },
  {
    key: 'activity.view_own',
    label: 'Consulter son Propre Historique',
    description: 'Voir uniquement ses propres actions enregistrées',
    module: 'activity',
  },
  {
    key: 'activity.export',
    label: 'Exporter le Journal d\'Audit (CSV)',
    description: 'Télécharger les logs complets d\'activité',
    module: 'activity',
    isSensitive: true,
  },

  // --- SETTINGS ---
  {
    key: 'settings.view',
    label: 'Consulter les Paramètres Généraux',
    description: 'Voir les paramètres de la boutique et coordonnées',
    module: 'settings',
  },
  {
    key: 'settings.edit',
    label: 'Modifier les Paramètres de la Boutique',
    description: 'Frais de livraison, coordonnées et textes vitrine',
    module: 'settings',
    isSensitive: true,
  },
  {
    key: 'settings.manage_security',
    label: 'Paramètres Avancés & Sécurité',
    description: 'Gestion des clés API, intégrations et sécurité',
    module: 'settings',
    isSensitive: true,
  },
];

export const PERMISSION_MAP = new Map<string, PermissionDefinition>(
  ALL_PERMISSIONS.map((p) => [p.key, p])
);
