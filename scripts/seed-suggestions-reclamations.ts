import prisma from '../src/lib/prisma';

async function main() {
  console.log('Seeding Suggestions and Reclamations...');

  const users = await prisma.adminUser.findMany();
  const owner = users.find(u => u.role === 'OWNER') || users[0];
  const members = users.filter(u => u.id !== owner?.id);
  const member1 = members[0] || owner;
  const member2 = members[1] || member1;

  // 1. Seed Employee Suggestions (Boîte à Idées)
  const countSuggestions = await prisma.employeeSuggestion.count();
  if (countSuggestions === 0) {
    await prisma.employeeSuggestion.createMany({
      data: [
        {
          title: "Échantillon VIP Offert avec chaque commande supérieure à 800 MAD",
          description: "Ajouter automatiquement un mini-vaporisateur testeur de 5ml de notre gamme Master Copy dans les colis > 800 MAD. Cela incite au réachat et surprend positivement le client lors de l'unboxing.",
          category: "SALES_BOOST",
          impact: "HIGH",
          status: "APPROVED",
          isAnonymous: false,
          authorId: member1?.id,
          authorName: member1?.name || "Kenza Tazi",
          authorRole: "Responsable Confirmation",
          authorAvatar: member1?.avatar,
          likesCount: 5,
          likedBy: JSON.stringify([owner?.id, member2?.id].filter(Boolean)),
          adminFeedback: "Excellente idée commerciale ! Nous allons l'intégrer dans le workflow de préparation des colis dès ce lundi.",
          rewardNotes: "Prime d'innovation commerciale validée",
          createdAt: new Date(Date.now() - 4 * 86400000)
        },
        {
          title: "Double ruban adhésif renforcé 'NAY Luxury' pour sécuriser les bouteilles",
          description: "Pour éviter tout risque de fuite ou de micro-choc pendant le transport CTM / Amana sur les longues distances (Agadir, Oujda, Laâyoune), utiliser un scellé adhésif personnalisé étanche sur le bouchon.",
          category: "LOGISTICS_PACKAGING",
          impact: "GAME_CHANGER",
          status: "IMPLEMENTED",
          isAnonymous: false,
          authorId: member2?.id,
          authorName: member2?.name || "Omar Benjelloun",
          authorRole: "Logistique & Expéditions",
          authorAvatar: member2?.avatar,
          likesCount: 8,
          likedBy: JSON.stringify([owner?.id, member1?.id].filter(Boolean)),
          adminFeedback: "Validé et déployé dans l'atelier de conditionnement. Les retours pour casse ont diminué de 80%.",
          rewardNotes: "Prime Qualité 500 MAD attribuée",
          implementedAt: new Date(Date.now() - 2 * 86400000),
          createdAt: new Date(Date.now() - 7 * 86400000)
        },
        {
          title: "Relance automatique par WhatsApp à H+2 pour les paniers non finalisés",
          description: "Beaucoup de clients hésitent sur le choix du parfum (homme/femme ou notes ambrées). Un message WhatsApp courtois proposant l'aide d'un conseiller olfactif augmente le taux de conversion.",
          category: "MARKETING_ADS",
          impact: "HIGH",
          status: "IN_PROGRESS",
          isAnonymous: false,
          authorId: member1?.id,
          authorName: member1?.name || "Kenza Tazi",
          authorRole: "Service Client & Vente",
          authorAvatar: member1?.avatar,
          likesCount: 4,
          likedBy: JSON.stringify([owner?.id].filter(Boolean)),
          adminFeedback: "En cours d'intégration avec l'API WhatsApp Business.",
          createdAt: new Date(Date.now() - 1 * 86400000)
        },
        {
          title: "Programme Ambassadeurs : Code promo exclusif pour les salons de coiffure & barbiers haut de gamme",
          description: "Créer des partenariats avec 15 barbiers premium à Casablanca et Rabat avec un présentoir testeurs et un QR code d'affiliation. Commission de 10% par commande générée.",
          category: "PRODUCT_CURATION",
          impact: "MEDIUM",
          status: "SUBMITTED",
          isAnonymous: true,
          authorName: "Membre Équipe (Anonyme)",
          authorRole: "Collaborateur",
          likesCount: 3,
          likedBy: JSON.stringify([]),
          createdAt: new Date()
        }
      ]
    });
    console.log('Seeded 4 suggestions.');
  }

  // 2. Seed Employee Reclamations (Signalements & Tickets RH)
  const countReclamations = await prisma.employeeReclamation.count();
  if (countReclamations === 0) {
    await prisma.employeeReclamation.createMany({
      data: [
        {
          ticketNumber: "REC-2026-001",
          subject: "Problème d'imprimante thermique d'étiquettes à l'atelier d'expédition",
          description: "L'imprimante Xprinter des bordereaux de livraison Amana saute des lignes une fois sur trois, ce qui ralentit la préparation des commandes lors des pics de 16h.",
          category: "EQUIPMENT_TOOLS",
          priority: "HIGH",
          confidentiality: "STANDARD",
          status: "RESOLVED",
          isAnonymous: false,
          authorId: member2?.id,
          authorName: member2?.name || "Omar Benjelloun",
          authorRole: "Logistique & Stock",
          authorPhone: "+212 661-223344",
          authorAvatar: member2?.avatar,
          assignedToId: owner?.id,
          assignedToName: owner?.name || "Ayoub Ait Yahya",
          resolutionNotes: "Remplacement du rouleau thermique et mise à jour du pilote d'impression effectuée. Fonctionnement 100% nominal.",
          actionPlan: "Achat d'une seconde imprimante de secours en réserve.",
          resolvedAt: new Date(Date.now() - 1 * 86400000),
          resolvedByName: owner?.name || "Ayoub Ait Yahya",
          createdAt: new Date(Date.now() - 3 * 86400000)
        },
        {
          ticketNumber: "REC-2026-002",
          subject: "Aménagement d'une zone de repos / pause café plus calme",
          description: "L'espace actuel est directement accolé à la zone d'emballage bruyante. Il serait bénéfique d'avoir un petit coin isolé pour les pauses déjeuner de l'équipe de confirmation téléphonique.",
          category: "WORK_ENVIRONMENT",
          priority: "MEDIUM",
          confidentiality: "STANDARD",
          status: "ACTION_TAKEN",
          isAnonymous: false,
          authorId: member1?.id,
          authorName: member1?.name || "Kenza Tazi",
          authorRole: "Télé-conseillère",
          authorPhone: "+212 662-889900",
          authorAvatar: member1?.avatar,
          assignedToId: owner?.id,
          assignedToName: owner?.name || "Ayoub Ait Yahya",
          actionPlan: "Installation d'une cloison acoustique et ajout d'un canapé confortable prévu ce jeudi.",
          createdAt: new Date(Date.now() - 2 * 86400000)
        },
        {
          ticketNumber: "REC-2026-003",
          subject: "Demande de clarification sur le calcul des primes de confirmation de fin de mois",
          description: "Je souhaiterais avoir le récapitulatif détaillé du barème appliqué aux commandes confirmées et livrées pour vérifier l'adéquation avec la fiche de paie de septembre.",
          category: "REMUNERATION_BONUS",
          priority: "MEDIUM",
          confidentiality: "CONFIDENTIAL_OWNER",
          status: "OPEN",
          isAnonymous: false,
          authorId: member1?.id,
          authorName: member1?.name || "Kenza Tazi",
          authorRole: "Agent Confirmation",
          authorPhone: "+212 662-889900",
          authorAvatar: member1?.avatar,
          assignedToId: owner?.id,
          assignedToName: owner?.name || "Ayoub Ait Yahya",
          createdAt: new Date(Date.now() - 12 * 3600000)
        }
      ]
    });
    console.log('Seeded 3 reclamations.');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
