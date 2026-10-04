# NAY Admin - Application Mobile Privée (iOS & Android)

Application mobile native sécurisée pour les propriétaires et collaborateurs autorisés de **NAY Parfum** ([nayparfum.ma](https://nayparfum.ma)).

---

## 📱 Caractéristiques Principales

1. **Synchronisation Temps Réel Multi-Plateforme**
   - Directement connectée à la base de données PostgreSQL (Neon) et aux API Next.js de la boutique.
   - Toute modification de stock, confirmation de commande ou note est immédiatement répercutée sur le site web client et sur le panneau web admin.

2. **Sécurité & Contrôle d'Accès Strict (RBAC)**
   - Aucune inscription publique. Accès strictement réservé aux comptes créés par un Propriétaire/Admin.
   - Authentification par jeton JWT stocké dans le trousseau sécurisé (`SecureStore`).
   - Déverrouillage biométrique matériel : Face ID (iOS) & Empreinte digitale (Android).
   - Masquage automatique des indicateurs financiers sensibles (bénéfices nets, marges, prix d'achat) pour les rôles non-propriétaires.

3. **Modules Complets**
   - **Tableau de Bord** : Chiffre d'affaires en direct, commandes du jour, hier, 7 jours, 30 jours, alertes stock faible, top ventes, activité récente.
   - **Commandes** : Filtres par statut (En attente, Confirmée, Expédiée, Livrée...), coordonnées client avec appels et WhatsApp en un clic, changement de statut immédiat, historique et notes.
   - **Gestion de Stock** : Inventaire complet avec ajustement instantané (+ / -) synchronisé avec la boutique.
   - **Caisse & Encaissements (COD)** : Suivi des fonds collectés vs en cours chez les livreurs (Amana, Cathedis, etc.).
   - **Clients & CRM** : Segmentation VIP, historique d'achats, panier moyen, contact direct.
   - **Équipe & Permissions** : Liste des collaborateurs, statuts en ligne, rôles et permissions.
   - **Journal d'Audit** : Traçabilité complète des actions.
   - **Paramètres** : Bascule biométrique, configuration de l'URL du serveur API, tests de notification push.

---

## 🚀 Démarrage Rapide

### Prérequis
- Node.js >= 18
- Application mobile **Expo Go** (disponible gratuitement sur l'App Store et Google Play Store) OU un émulateur Android Studio / Xcode.

### 1. Installation des dépendances
```bash
cd mobile-admin
npm install
```

### 2. Démarrer le serveur de développement Expo
```bash
npm run start
```
ou :
```bash
npx expo start
```

### 3. Tester sur votre smartphone
- Scannez le **QR Code** affiché dans le terminal avec l'application **Expo Go** (sur Android) ou avec l'appareil photo (sur iOS).
- L'application se charge instantanément sur votre téléphone !

### 4. Générer l'APK Android ou le build iOS (Production)
```bash
# Pour générer un APK Android distribuable
npx eas-cli build --platform android --profile preview

# Pour un build iOS
npx eas-cli build --platform ios --profile preview
```
