import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- SEEDING ENTERPRISE SUPPLIERS & PROCUREMENT DATA ---');

  // Clear existing suppliers and purchase orders
  await prisma.supplierPurchaseOrder.deleteMany({});
  await prisma.supplier.deleteMany({});

  const suppliersData = [
    {
      name: 'Laboratoire Arômes & Essences de Grasse SAS',
      code: 'FRN-GRS-01',
      category: 'ESSENCES',
      tier: 'TIER_1',
      contactName: 'Jean-Marc Delacroix (Directeur Export)',
      phone: '+33 4 93 36 00 12',
      email: 'export.maroc@aromes-grasse.fr',
      city: 'Grasse',
      country: 'FR',
      address: '14 Boulevard des Parfums, 06130 Grasse, France',
      taxId: 'FR 89 452 119 820',
      incoterms: 'DDP Casablanca',
      certifications: JSON.stringify(['IFRA Compliant 51st Edition', 'ISO 22716 BPF Cosmétique', 'Cosmos Organic', 'Ecolabel EU']),
      currency: 'MAD',
      minOrderValueMAD: 15000,
      paymentTerms: '30_JOURS',
      bankName: 'BNP Paribas International / Attijariwafa Bank Correspondent',
      bankRib: '007 780 0001452698741235 88',
      leadTimeDays: 7,
      rating: 4.95,
      qualityScore: 99.4,
      onTimeDeliveryRate: 98.2,
      status: 'VIP',
      notes: 'Partenaire stratégique pour les concentrés de parfum haute macération et huiles de synthèse premium. Accords exclusifs pour les accords Oud Boisé, Vanille Bourbon et Rose de Mai.',
      pricingList: JSON.stringify([
        { sku: 'CONC-OUD-ROYAL', name: 'Concentré Huile Oud Royal (5kg)', unitCostMAD: 4800, minQty: 1, leadTimeDays: 7 },
        { sku: 'CONC-VAN-SMK', name: 'Absolue Vanille Fumée & Fève Tonka (5kg)', unitCostMAD: 3600, minQty: 1, leadTimeDays: 7 },
        { sku: 'CONC-AMB-NOIR', name: 'Base Ambre Gris & Musc Blanc (10kg)', unitCostMAD: 5200, minQty: 1, leadTimeDays: 7 }
      ])
    },
    {
      name: 'Gulf Oud & Oriental Fragrances FZ-LLC',
      code: 'FRN-DXB-02',
      category: 'PARFUMS',
      tier: 'TIER_1',
      contactName: 'Tariq Al-Mansoor (VP Commercial MENA)',
      phone: '+971 4 398 5544',
      email: 'orders@gulfoud-dubai.ae',
      city: 'Dubaï',
      country: 'AE',
      address: 'Al Quoz Industrial Area 3, Warehouse B12, Dubai, UAE',
      taxId: 'TRN 100348920100003',
      incoterms: 'CIF Casablanca Airport',
      certifications: JSON.stringify(['Halal Certified Gulf Authority', 'ISO 9001:2015', 'GMP Perfumery Standards']),
      currency: 'MAD',
      minOrderValueMAD: 10000,
      paymentTerms: '50_AVANCE',
      bankName: 'Emirates NBD / Banque Centrale Populaire',
      bankRib: '101 780 0005849632145879 44',
      leadTimeDays: 5,
      rating: 4.9,
      qualityScore: 98.8,
      onTimeDeliveryRate: 96.5,
      status: 'VIP',
      notes: 'Importation directe de testeurs 100ml prestige, extraits de parfum orientaux et bakhoors de collection. Expéditions rapides via Emirates Cargo.',
      pricingList: JSON.stringify([
        { sku: 'TEST-LAT-ASAD', name: 'Lattafa Asad 100ml Testeur Batch VIP', unitCostMAD: 195, minQty: 20, leadTimeDays: 5 },
        { sku: 'TEST-AFN-9PM', name: 'Afnan 9 PM Testeur Original 100ml', unitCostMAD: 220, minQty: 20, leadTimeDays: 5 },
        { sku: 'TEST-KHAM-LAT', name: 'Khamrah Qahwa Lattafa 100ml', unitCostMAD: 240, minQty: 15, leadTimeDays: 5 },
        { sku: 'TEST-CLUB-NUIT', name: 'Club de Nuit Intense Man Armaf 105ml', unitCostMAD: 275, minQty: 15, leadTimeDays: 5 }
      ])
    },
    {
      name: 'Distributeur Parfums & Cosmétiques Aïn Sebaâ SARL',
      code: 'FRN-CAS-03',
      category: 'PARFUMS',
      tier: 'TIER_1',
      contactName: 'Mehdi Benkaddour (Directeur des Comptes)',
      phone: '+212 661-458920',
      email: 'm.benkaddour@luxeparfums-maroc.ma',
      city: 'Casablanca',
      country: 'MA',
      address: 'Zone Industrielle Aïn Sebaâ, Allée des Lilas, Lot 45, Casablanca',
      taxId: 'ICE 002348911000045 / RC 349811 Casa',
      incoterms: 'DDP Magasin NAY',
      certifications: JSON.stringify(['Agrément Ministère de la Santé Maroc', 'Certificat d’Origine Authentique']),
      currency: 'MAD',
      minOrderValueMAD: 5000,
      paymentTerms: 'A_LA_LIVRAISON',
      bankName: 'Attijariwafa Bank - Agence Boulevard Chefchaouni',
      bankRib: '007 780 0002145698741258 12',
      leadTimeDays: 1,
      rating: 4.85,
      qualityScore: 99.0,
      onTimeDeliveryRate: 99.2,
      status: 'ACTIVE',
      notes: 'Grossiste local officiel à Casablanca. Réassort sous 24h avec livraison directe en boutique ou entrepôt. Conditions de paiement préférentielles.',
      pricingList: JSON.stringify([
        { sku: 'TEST-SAUV-ELIX', name: 'Dior Sauvage Elixir 60ml Testeur Agréé', unitCostMAD: 580, minQty: 5, leadTimeDays: 1 },
        { sku: 'TEST-BDC-EDP', name: 'Bleu de Chanel Eau de Parfum 100ml Testeur', unitCostMAD: 620, minQty: 5, leadTimeDays: 1 },
        { sku: 'TEST-YSL-MYSLF', name: 'YSL MYSLF Eau de Parfum 100ml', unitCostMAD: 540, minQty: 5, leadTimeDays: 1 },
        { sku: 'TEST-TOM-TF-OW', name: 'Tom Ford Oud Wood 100ml Master Testeur', unitCostMAD: 690, minQty: 3, leadTimeDays: 1 }
      ])
    },
    {
      name: 'Manufacture Verrerie & Cristallerie Tanger Med SA',
      code: 'FRN-TNG-04',
      category: 'FLACONS',
      tier: 'TIER_2',
      contactName: 'Hicham Tahiri (Responsable Grands Comptes Flaconnage)',
      phone: '+212 539-392010',
      email: 'h.tahiri@verrerie-tanger.ma',
      city: 'Tanger',
      country: 'MA',
      address: 'Zone Franche Tanger Automotive City, Îlot 12, Tanger',
      taxId: 'ICE 001928472000088 / RC 78210 Tanger',
      incoterms: 'DDP Casablanca Hub',
      certifications: JSON.stringify(['ISO 9001:2015 Qualité Verre', 'Norme Européenne Flaconnage FEA']),
      currency: 'MAD',
      minOrderValueMAD: 8000,
      paymentTerms: '50_AVANCE',
      bankName: 'Banque Centrale Populaire - Agence Tanger Centre',
      bankRib: '101 780 0003412569874512 65',
      leadTimeDays: 4,
      rating: 4.8,
      qualityScore: 97.5,
      onTimeDeliveryRate: 95.0,
      status: 'ACTIVE',
      notes: 'Fabricant de flacons verre extra-blanc 50ml, 100ml à fond lourd, cols sertis ou à vis FEA 15, et pompes sprays dorées haute micronisation (0.08ml).',
      pricingList: JSON.stringify([
        { sku: 'FLAC-100-HEAVY', name: 'Flacon Verre Lourd 100ml Finition Luxe (x100)', unitCostMAD: 1200, minQty: 1, leadTimeDays: 4 },
        { sku: 'POMP-GOLD-FEA15', name: 'Pompe Spray Micro-Diffusion Dorée 24k (x200)', unitCostMAD: 600, minQty: 1, leadTimeDays: 4 },
        { sku: 'CAP-MAGNET-BLK', name: 'Capot Magnétique Zamak Noir Mat (x100)', unitCostMAD: 850, minQty: 1, leadTimeDays: 4 }
      ])
    },
    {
      name: 'Cartonnage & Packaging Prestige Casablanca SARL',
      code: 'FRN-PKG-05',
      category: 'PACKAGING',
      tier: 'TIER_1',
      contactName: 'Nadia El Fassi (Directrice Artistique & Print)',
      phone: '+212 662-894711',
      email: 'contact@packluxe-casablanca.ma',
      city: 'Casablanca',
      country: 'MA',
      address: 'Parc Industriel Sidi Maârouf, Rue 8, Casablanca',
      taxId: 'ICE 001837492000019 / RC 41290 Casablanca',
      incoterms: 'DDP Atelier NAY',
      certifications: JSON.stringify(['FSC Certified Paper', 'ISO 14001', 'Dorure à Chaud Haute Précision']),
      currency: 'MAD',
      minOrderValueMAD: 6000,
      paymentTerms: '30_JOURS',
      bankName: 'Bank of Africa (BOA) - Agence Sidi Maârouf',
      bankRib: '011 780 0009852147854123 33',
      leadTimeDays: 3,
      rating: 4.9,
      qualityScore: 99.1,
      onTimeDeliveryRate: 97.8,
      status: 'VIP',
      notes: 'Concepteur des coffrets rigides aimantés NAY Parfums, fourreaux gaufrés avec dorure or à chaud, mousses de calage haute densité et sacs kraft luxe 250g.',
      pricingList: JSON.stringify([
        { sku: 'BOX-COFF-MAGNET', name: 'Coffret Rigide Aimanté Noir & Or NAY (x100)', unitCostMAD: 1800, minQty: 1, leadTimeDays: 3 },
        { sku: 'SAC-KRAFT-LUX', name: 'Sac Boutique Kraft Épais Ruban Satin (x250)', unitCostMAD: 750, minQty: 1, leadTimeDays: 3 },
        { sku: 'ETIQ-DOR-RELIEF', name: 'Étiquette Métallique Dorée Relief (x500)', unitCostMAD: 650, minQty: 1, leadTimeDays: 3 }
      ])
    },
    {
      name: 'Amana Express & SDTM Logistique Maroc',
      code: 'FRN-LOG-06',
      category: 'LOGISTIQUE',
      tier: 'TIER_2',
      contactName: 'Yassine Chraibi (Responsable Messagerie)',
      phone: '+212 522-889900',
      email: 'b2b.logistique@amana-express.ma',
      city: 'Casablanca',
      country: 'MA',
      address: 'Plateforme Logistique Centrale, Km 14 Route de Nouaceur, Casablanca',
      taxId: 'ICE 000123456000099 / RC 12093 Casa',
      incoterms: 'Port Payé National',
      certifications: JSON.stringify(['Agrément Postal & Transport Marchandises', 'Assurance Ad Valorem Flacons Fragiles']),
      currency: 'MAD',
      minOrderValueMAD: 1000,
      paymentTerms: '30_JOURS',
      bankName: 'Al Barid Bank',
      bankRib: '350 780 0001234567890123 45',
      leadTimeDays: 1,
      rating: 4.7,
      qualityScore: 96.5,
      onTimeDeliveryRate: 94.0,
      status: 'ACTIVE',
      notes: 'Partenaire transport pour la collecte des colis en douane et l’acheminement inter-villes des approvisionnements de matières premières.',
      pricingList: JSON.stringify([
        { sku: 'FRET-PALETTE-CASA', name: 'Transport Palette Sécurisée Grand Casa', unitCostMAD: 350, minQty: 1, leadTimeDays: 1 },
        { sku: 'FRET-TANGER-CASA', name: 'Fret Express Tanger Med -> Casa Hub', unitCostMAD: 850, minQty: 1, leadTimeDays: 1 }
      ])
    }
  ];

  const createdSuppliers = [];
  for (const s of suppliersData) {
    const sup = await prisma.supplier.create({
      data: s
    });
    createdSuppliers.push(sup);
  }

  console.log(`Created ${createdSuppliers.length} suppliers.`);

  // Create Purchase Orders with full details
  const grasse = createdSuppliers.find(s => s.code === 'FRN-GRS-01')!;
  const dubai = createdSuppliers.find(s => s.code === 'FRN-DXB-02')!;
  const casa = createdSuppliers.find(s => s.code === 'FRN-CAS-03')!;
  const packaging = createdSuppliers.find(s => s.code === 'FRN-PKG-05')!;
  const verrerie = createdSuppliers.find(s => s.code === 'FRN-TNG-04')!;

  const purchaseOrdersData = [
    {
      orderNumber: 'BC-2026-001',
      supplierId: casa.id,
      items: JSON.stringify([
        { sku: 'TEST-SAUV-ELIX', name: 'Dior Sauvage Elixir 60ml Testeur Agréé', quantity: 15, unitCost: 580, totalCost: 8700 },
        { sku: 'TEST-BDC-EDP', name: 'Bleu de Chanel Eau de Parfum 100ml Testeur', quantity: 20, unitCost: 620, totalCost: 12400 },
        { sku: 'TEST-TOM-TF-OW', name: 'Tom Ford Oud Wood 100ml Master Testeur', quantity: 10, unitCost: 690, totalCost: 6900 }
      ]),
      subtotalAmountMAD: 28000,
      shippingCostMAD: 0,
      taxAmountMAD: 0,
      totalAmount: 28000,
      currency: 'MAD',
      status: 'RECEIVED',
      paymentStatus: 'PAID',
      paidAmount: 28000,
      carrierName: 'Propre Flotte Livraison Directe',
      trackingNumber: 'LIV-CASA-20260901',
      invoiceNumber: 'FAC-LPM-88912',
      qualityInspectionStatus: 'PASSED',
      qualityInspectionNotes: 'Inspection réussie à 100% : Lots certifiés d’origine, numéros de batch gravés vérifiés, atomiseurs testés sans fuite.',
      deliveryExpectedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      receivedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
      notes: 'Livraison express effectuée à la boutique Aïn Sebaâ avec bordereau d’émargement signé.'
    },
    {
      orderNumber: 'BC-2026-002',
      supplierId: dubai.id,
      items: JSON.stringify([
        { sku: 'TEST-LAT-ASAD', name: 'Lattafa Asad 100ml Testeur Batch VIP', quantity: 50, unitCost: 195, totalCost: 9750 },
        { sku: 'TEST-AFN-9PM', name: 'Afnan 9 PM Testeur Original 100ml', quantity: 40, unitCost: 220, totalCost: 8800 },
        { sku: 'TEST-KHAM-LAT', name: 'Khamrah Qahwa Lattafa 100ml', quantity: 30, unitCost: 240, totalCost: 7200 }
      ]),
      subtotalAmountMAD: 25750,
      shippingCostMAD: 1200,
      taxAmountMAD: 0,
      totalAmount: 26950,
      currency: 'MAD',
      status: 'IN_TRANSIT',
      paymentStatus: 'PARTIAL',
      paidAmount: 13475,
      carrierName: 'Emirates SkyCargo / Amana Dédouanement',
      trackingNumber: 'EK-948201-MA',
      invoiceNumber: 'DXB-PO-44109',
      qualityInspectionStatus: 'PENDING',
      qualityInspectionNotes: 'En cours de dédouanement à l’Aéroport Mohammed V de Casablanca.',
      deliveryExpectedAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      notes: 'Acompte 50% versé le 28/09. Solde à la libération sous douane.'
    },
    {
      orderNumber: 'BC-2026-003',
      supplierId: grasse.id,
      items: JSON.stringify([
        { sku: 'CONC-OUD-ROYAL', name: 'Concentré Huile Oud Royal (5kg)', quantity: 2, unitCost: 4800, totalCost: 9600 },
        { sku: 'CONC-VAN-SMK', name: 'Absolue Vanille Fumée & Fève Tonka (5kg)', quantity: 3, unitCost: 3600, totalCost: 10800 }
      ]),
      subtotalAmountMAD: 20400,
      shippingCostMAD: 1500,
      taxAmountMAD: 0,
      totalAmount: 21900,
      currency: 'MAD',
      status: 'CONFIRMED',
      paymentStatus: 'UNPAID',
      paidAmount: 0,
      carrierName: 'DHL Global Forwarding France-Maroc',
      trackingNumber: 'DHL-FR-8829011',
      invoiceNumber: 'GRS-2026-903',
      qualityInspectionStatus: 'PENDING',
      deliveryExpectedAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      notes: 'Certificats IFRA & fiches de sécurité (FDS) jointes au colis.'
    },
    {
      orderNumber: 'BC-2026-004',
      supplierId: packaging.id,
      items: JSON.stringify([
        { sku: 'BOX-COFF-MAGNET', name: 'Coffret Rigide Aimanté Noir & Or NAY (x100)', quantity: 5, unitCost: 1800, totalCost: 9000 },
        { sku: 'SAC-KRAFT-LUX', name: 'Sac Boutique Kraft Épais Ruban Satin (x250)', quantity: 4, unitCost: 750, totalCost: 3000 }
      ]),
      subtotalAmountMAD: 12000,
      shippingCostMAD: 0,
      taxAmountMAD: 0,
      totalAmount: 12000,
      currency: 'MAD',
      status: 'RECEIVED',
      paymentStatus: 'PAID',
      paidAmount: 12000,
      carrierName: 'Camionnette PackLuxe Express',
      trackingNumber: 'PL-LIV-0922',
      invoiceNumber: 'FC-PACK-7712',
      qualityInspectionStatus: 'PASSED',
      qualityInspectionNotes: 'Excellente dorure or à chaud sans bavure. Aimants parfaitement alignés.',
      deliveryExpectedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      receivedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      notes: 'Réception conforme à l’entrepôt central.'
    },
    {
      orderNumber: 'BC-2026-005',
      supplierId: verrerie.id,
      items: JSON.stringify([
        { sku: 'FLAC-100-HEAVY', name: 'Flacon Verre Lourd 100ml Finition Luxe (x100)', quantity: 10, unitCost: 1200, totalCost: 12000 },
        { sku: 'POMP-GOLD-FEA15', name: 'Pompe Spray Micro-Diffusion Dorée 24k (x200)', quantity: 5, unitCost: 600, totalCost: 3000 }
      ]),
      subtotalAmountMAD: 15000,
      shippingCostMAD: 500,
      taxAmountMAD: 0,
      totalAmount: 15500,
      currency: 'MAD',
      status: 'PENDING',
      paymentStatus: 'UNPAID',
      paidAmount: 0,
      carrierName: 'CTM Messagerie Tanger -> Casa',
      trackingNumber: 'CTM-TG-99482',
      invoiceNumber: 'PROFORMA-VT-2026-11',
      qualityInspectionStatus: 'PENDING',
      deliveryExpectedAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      notes: 'Commande en cours de préparation en usine à Tanger.'
    }
  ];

  for (const po of purchaseOrdersData) {
    await prisma.supplierPurchaseOrder.create({ data: po });
  }

  // Update supplier aggregates
  for (const s of createdSuppliers) {
    const orders = await prisma.supplierPurchaseOrder.findMany({ where: { supplierId: s.id } });
    const count = orders.length;
    const totalSpend = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const lastOrder = orders[0]?.createdAt || null;

    await prisma.supplier.update({
      where: { id: s.id },
      data: {
        totalOrdersCount: count,
        totalSpendMAD: totalSpend,
        lastOrderDate: lastOrder
      }
    });
  }

  console.log('--- SEEDING COMPLETED SUCCESSFULLY ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
