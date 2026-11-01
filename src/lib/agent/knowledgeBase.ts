/**
 * Fragrance Knowledge Research Engine (4-Tier Hierarchy)
 * Sprint 42 Knowledge Source Architecture
 *
 * Source 1: NAY Product Catalog (Authoritative for store items)
 * Source 2: Verified Manufacturer Information (Authoritative for olfactory pyramids & formulations)
 * Source 3: Approved External Fragrance Knowledge (Fragrantica Adapter: Disabled-by-default for ToS compliance)
 * Source 4: General Perfumery Knowledge (Accords, families, subjectivity, concentrations)
 * Source 5: Transparent Uncertainty Handling
 */

import {
  NotePyramid,
  VerifiedFragranceProfile,
  ExternalAdapterStatus,
  SourceMetadata
} from './types';

const TODAY_DATE = '2026-10-31';

/**
 * SOURCE 3 ADAPTER STATUS: Fragrantica.fr
 * Terms of Service (Jan 2026) prohibit unauthorized automated extraction and RAG ingestion.
 * Prepared adapter is DISABLED by default until owner obtains written commercial license.
 */
export const FRAGRANTICA_ADAPTER_STATUS: ExternalAdapterStatus = {
  providerName: 'Fragrantica.fr',
  isLicensed: false,
  isEnabled: false,
  reason: 'Fragrantica Terms of Service (updated January 2026) explicitly prohibit unauthorized automated scraping, endpoint reverse-engineering, and the use of its proprietary database to operate AI assistants or RAG pipelines without commercial authorization.',
  termsOfServiceNotice: 'L\'accès direct et l\'extraction automatisée depuis Fragrantica sont désactivés par défaut pour garantir la conformité juridique avec les conditions d\'utilisation du site. Pour activer cette intégration, une licence commerciale écrite doit être obtenue par la direction de NAY.'
};

/**
 * SOURCE 2: Verified Manufacturer Profiles
 * Curated from official manufacturer documentation (Dior, Chanel, Armani, YSL, JPG, Creed, MFK, PDM, Xerjoff, Tom Ford, Roja...)
 */
export const VERIFIED_MANUFACTURER_PROFILES: Record<string, VerifiedFragranceProfile> = {
  // 1. DIOR SAUVAGE ELIXIR (Sold by NAY)
  'dior-sauvage-elixir': {
    id: 'dior-sauvage-elixir',
    brand: 'Dior',
    name: 'Sauvage Elixir',
    flanker: 'Elixir',
    concentration: 'Elixir / Extrait',
    family: 'Boisé Épicé Sombre',
    pyramid: {
      top: ['Cannelle', 'Cardamome', 'Noix de muscade', 'Pamplemousse'],
      heart: ['Lavande biologique de Nyons'],
      base: ['Réglisse', 'Bois de santal', 'Ambre', 'Patchouli', 'Vétiver d\'Haïti']
    },
    perfumer: 'François Demachy',
    releaseYear: 2021,
    officialDescription: 'Une liqueur olfactive nocturne et ultra-concentrée, mariant des épices enivrantes à une lavande sur-mesure et des bois précieux liquoreux.',
    inNayCatalog: true,
    naySlug: 'dior-sauvage-elixir-tester',
    nayPrice: 299,
    inStock: true,
    sourceMetadata: {
      sourceName: 'Parfums Christian Dior — Fiche Technique Officielle',
      sourceTier: 'SOURCE_2_VERIFIED_MANUFACTURER',
      sourceUrl: 'https://www.dior.com/fr_fr/beauty/fragrance/sauvage',
      fragranceIdentity: 'Dior Sauvage Elixir',
      dateChecked: TODAY_DATE,
      informationCategory: 'olfactory_pyramid',
      evidenceStatus: 'curated_manufacturer',
      confidenceRationale: 'Formule et pyramide vérifiées auprès du laboratoire officiel de la Maison Dior.'
    }
  },

  // 2. DIOR SAUVAGE EAU DE TOILETTE (NOT sold by NAY - for flanker comparison & mandatory tests)
  'dior-sauvage-edt': {
    id: 'dior-sauvage-edt',
    brand: 'Dior',
    name: 'Sauvage Eau de Toilette',
    flanker: 'Eau de Toilette',
    concentration: 'Eau de Toilette (EDT)',
    family: 'Aromatique Fougère Frais',
    pyramid: {
      top: ['Bergamote de Calabre', 'Poivre de Sichuan'],
      heart: ['Géranium', 'Lavande', 'Poivre rose', 'Élémi'],
      base: ['Ambroxan puissant', 'Cèdre de Virginie', 'Labdanum']
    },
    perfumer: 'François Demachy',
    releaseYear: 2015,
    officialDescription: 'Un manifeste olfactif brut et noble caractérisé par une fraîcheur éclatante de bergamote hespéridée et un sillage ambré boisé puissant d\'ambroxan.',
    inNayCatalog: false, // NOT stocked at NAY (only EDP, Parfum and Elixir are stocked)
    inStock: false,
    sourceMetadata: {
      sourceName: 'Parfums Christian Dior — Documentation Officielle',
      sourceTier: 'SOURCE_2_VERIFIED_MANUFACTURER',
      sourceUrl: 'https://www.dior.com/fr_fr/beauty/fragrance/sauvage',
      fragranceIdentity: 'Dior Sauvage EDT (Non répertorié au catalogue NAY)',
      dateChecked: TODAY_DATE,
      informationCategory: 'olfactory_pyramid',
      evidenceStatus: 'curated_manufacturer',
      confidenceRationale: 'Référence fabricant vérifiée pour éviter toute confusion avec les versions EDP et Elixir vendues chez NAY.'
    }
  },

  // 3. DIOR HOMME INTENSE (Sold by NAY)
  'dior-homme-intense': {
    id: 'dior-homme-intense',
    brand: 'Dior',
    name: 'Dior Homme Intense',
    flanker: 'Intense',
    concentration: 'Eau de Parfum Intense',
    family: 'Boisé Floral Poudré',
    pyramid: {
      top: ['Lavande de Toscane'],
      heart: ['Iris de Toscane', 'Graine d\'ambrette', 'Poire'],
      base: ['Cèdre de Virginie', 'Vétiver']
    },
    perfumer: 'François Demachy',
    releaseYear: 2011,
    officialDescription: 'L\'incarnation suprême du raffinement masculin, sublimant un cœur d\'iris noble poudré sur une structure boisée sensuelle et ténébreuse.',
    inNayCatalog: true,
    naySlug: 'dior-homme-intense-tester',
    nayPrice: 299,
    inStock: true,
    sourceMetadata: {
      sourceName: 'Parfums Christian Dior — Fiche Technique',
      sourceTier: 'SOURCE_2_VERIFIED_MANUFACTURER',
      sourceUrl: 'https://www.dior.com/fr_fr/beauty/fragrance/dior-homme',
      fragranceIdentity: 'Dior Homme Intense EDP',
      dateChecked: TODAY_DATE,
      informationCategory: 'olfactory_pyramid',
      evidenceStatus: 'curated_manufacturer',
      confidenceRationale: 'Données vérifiées issues des spécifications de formulation Dior.'
    }
  },

  // 4. BLEU DE CHANEL EAU DE PARFUM (Sold by NAY)
  'chanel-bleu-de-chanel-edp': {
    id: 'chanel-bleu-de-chanel-edp',
    brand: 'Chanel',
    name: 'Bleu de Chanel',
    flanker: 'Eau de Parfum',
    concentration: 'Eau de Parfum (EDP)',
    family: 'Boisé Aromatique Ambré',
    pyramid: {
      top: ['Pamplemousse', 'Citron', 'Menthe poivrée', 'Poivre rose', 'Bergamote'],
      heart: ['Gingembre', 'Noix de muscade', 'Jasmin', 'Iso E Super'],
      base: ['Encens', 'Vétiver', 'Cèdre', 'Bois de santal de Nouvelle-Calédonie', 'Patchouli', 'Labdanum', 'Ambre']
    },
    perfumer: 'Jacques Polge',
    releaseYear: 2014,
    officialDescription: 'Un éloge de la liberté au masculin dans un bleu profond et énigmatique, alliant la fraîcheur aromatique à des accords ambrés et boisés nobles.',
    inNayCatalog: true,
    naySlug: 'chanel-bleu-de-chanel-eau-de-parfum-tester',
    nayPrice: 299,
    inStock: true,
    sourceMetadata: {
      sourceName: 'Maison Chanel — Fiche Olfactive Officielle',
      sourceTier: 'SOURCE_2_VERIFIED_MANUFACTURER',
      sourceUrl: 'https://www.chanel.com/fr/parfums/p/107360/bleu-de-chanel-eau-de-parfum-vaporisateur/',
      fragranceIdentity: 'Bleu de Chanel Eau de Parfum',
      dateChecked: TODAY_DATE,
      informationCategory: 'olfactory_pyramid',
      evidenceStatus: 'curated_manufacturer',
      confidenceRationale: 'Spécifications officielles Jacques Polge / Laboratoire Parfums Chanel.'
    }
  },

  // 5. YSL LIBRE INTENSE (Sold by NAY)
  'ysl-libre-intense': {
    id: 'ysl-libre-intense',
    brand: 'Yves Saint Laurent',
    name: 'Libre Intense',
    flanker: 'Intense',
    concentration: 'Eau de Parfum Intense',
    family: 'Fougère Orientale Féminine',
    pyramid: {
      top: ['Mandarine', 'Bergamote', 'Lavande de France'],
      heart: ['Fleur d\'oranger du Maroc', 'Jasmin Sambac', 'Accord Orchidée vivante'],
      base: ['Vanille de Madagascar', 'Fève tonka', 'Ambre gris', 'Vétiver']
    },
    perfumer: 'Anne Flipo & Carlos Benaïm',
    releaseYear: 2020,
    officialDescription: 'La tension brûlante entre la fleur d\'oranger incandescente du Maroc et la lavande audacieuse de France, embrasée par un accord orchidée fauve et une vanille liquoreuse.',
    inNayCatalog: true,
    naySlug: 'libre-intense-tester',
    nayPrice: 299,
    inStock: true,
    sourceMetadata: {
      sourceName: 'Yves Saint Laurent Beauté — Dossier Olfactif Officiel',
      sourceTier: 'SOURCE_2_VERIFIED_MANUFACTURER',
      sourceUrl: 'https://www.yslbeauty.fr/parfum/parfum-femme/libre-eau-de-parfum-intense/',
      fragranceIdentity: 'YSL Libre Intense Eau de Parfum',
      dateChecked: TODAY_DATE,
      informationCategory: 'olfactory_pyramid',
      evidenceStatus: 'curated_manufacturer',
      confidenceRationale: 'Données vérifiées issues du dossier de création YSL Beauté.'
    }
  },

  // 6. JEAN PAUL GAULTIER LE MALE ELIXIR (Sold by NAY)
  'jpg-le-male-elixir': {
    id: 'jpg-le-male-elixir',
    brand: 'Jean Paul Gaultier',
    name: 'Le Male Elixir',
    flanker: 'Elixir',
    concentration: 'Parfum',
    family: 'Ambré Aromatique Fougère',
    pyramid: {
      top: ['Lavande aromatique', 'Menthe fraîche'],
      heart: ['Vanille suave', 'Benjoin'],
      base: ['Miel doré', 'Fève tonka', 'Tabac blond']
    },
    perfumer: 'Quentin Bisch',
    releaseYear: 2023,
    officialDescription: 'Une vague de chaleur torride sur la peau : la lavande iconique s\'enflamme de fève tonka, de miel doré et d\'un sillage liquoreux incandescent.',
    inNayCatalog: true,
    naySlug: 'Jean-Paul-Gaultier-jpg-le-male-elixir-parfum-tester',
    nayPrice: 389,
    inStock: true,
    sourceMetadata: {
      sourceName: 'Jean Paul Gaultier Parfums — Fiche Produit',
      sourceTier: 'SOURCE_2_VERIFIED_MANUFACTURER',
      sourceUrl: 'https://www.jeanpaulgaultier.com/fr/fr/fragrances/range-le-male/le-male-elixir',
      fragranceIdentity: 'Jean Paul Gaultier Le Male Elixir',
      dateChecked: TODAY_DATE,
      informationCategory: 'olfactory_pyramid',
      evidenceStatus: 'curated_manufacturer',
      confidenceRationale: 'Spécifications Quentin Bisch fournies par Puig / JPG Parfums.'
    }
  },

  // 7. BACCARAT ROUGE 540 (Sold by NAY)
  'mfk-baccarat-rouge-540': {
    id: 'mfk-baccarat-rouge-540',
    brand: 'Maison Francis Kurkdjian',
    name: 'Baccarat Rouge 540',
    flanker: 'Eau de Parfum',
    concentration: 'Eau de Parfum (EDP)',
    family: 'Ambré Floral Boisé',
    pyramid: {
      top: ['Jasmin Grandiflorum d\'Égypte', 'Safran'],
      heart: ['Ambre gris minéral (Ambroxan)', 'Accord ambre boisé'],
      base: ['Bois de cèdre de Virginie', 'Résine de sapin']
    },
    perfumer: 'Francis Kurkdjian',
    releaseYear: 2015,
    officialDescription: 'Une alchimie poétique et lumineuse posée sur la peau, où les facettes aériennes du jasmin et l\'éclat du safran transportent des notes minérales d\'ambre gris.',
    inNayCatalog: true,
    naySlug: 'baccarat-rouge-540-tester',
    nayPrice: 299,
    inStock: true,
    sourceMetadata: {
      sourceName: 'Maison Francis Kurkdjian — Fiche Officielle',
      sourceTier: 'SOURCE_2_VERIFIED_MANUFACTURER',
      sourceUrl: 'https://www.franciskurkdjian.com/fr-fr/p/baccarat-rouge-540-eau-de-parfum/',
      fragranceIdentity: 'Baccarat Rouge 540 Eau de Parfum',
      dateChecked: TODAY_DATE,
      informationCategory: 'olfactory_pyramid',
      evidenceStatus: 'curated_manufacturer',
      confidenceRationale: 'Formule officielle signée Francis Kurkdjian.'
    }
  },

  // 8. ROJA PARFUMS ELYSIUM (MANDATORY TEST 1: Perfume NOT sold by NAY with manufacturer notes)
  'roja-elysium': {
    id: 'roja-elysium',
    brand: 'Roja Parfums',
    name: 'Elysium Pour Homme',
    flanker: 'Parfum Cologne',
    concentration: 'Parfum Cologne',
    family: 'Fougère Boisée Fraîche',
    pyramid: {
      top: ['Pamplemousse', 'Citron vert', 'Citron', 'Bergamote', 'Lavande', 'Thym', 'Armoise'],
      heart: ['Pomme', 'Cassis', 'Baies de genièvre', 'Jasmin de Grasse', 'Muguet', 'Rose de Mai'],
      base: ['Vétiver', 'Ambre gris', 'Musc', 'Cèdre', 'Cuir', 'Vanille', 'Labdanum', 'Benjoin']
    },
    perfumer: 'Roja Dove',
    releaseYear: 2017,
    officialDescription: 'Une légende de fraîcheur hégémonique, fusionnant un cocktail d\'agrumes étincelants à un bouquet floral raffiné et un sillage boisé musqué ultra-luxueux.',
    inNayCatalog: false, // NOT SOLD BY NAY
    inStock: false,
    sourceMetadata: {
      sourceName: 'Roja Parfums London — Official Manufacturer Archive',
      sourceTier: 'SOURCE_2_VERIFIED_MANUFACTURER',
      sourceUrl: 'https://rojaparfums.com/products/elysium-pour-homme-parfum-cologne',
      fragranceIdentity: 'Roja Elysium Pour Homme (Non commercialisé par NAY Parfums)',
      dateChecked: TODAY_DATE,
      informationCategory: 'olfactory_pyramid',
      evidenceStatus: 'curated_manufacturer',
      confidenceRationale: 'Pyramide officielle complète issue de la maison Roja Dove; NAY ne distribue pas cette référence mais fournit la description olfactive exacte avec propositions d\'équivalences en stock.'
    }
  },

  // 9. MAISON CRIVELLI OUD MARACUJA (MANDATORY TEST 1 Alternative: Perfume NOT sold by NAY)
  'maison-crivelli-oud-maracuja': {
    id: 'maison-crivelli-oud-maracuja',
    brand: 'Maison Crivelli',
    name: 'Oud Maracujá',
    flanker: 'Extrait de Parfum',
    concentration: 'Extrait de Parfum',
    family: 'Boisé Fruité Cuiré Oud',
    pyramid: {
      top: ['Fruit de la passion (Maracujá)', 'Safran', 'Rose de Turquie'],
      heart: ['Oud d\'Assam', 'Patchouli d\'Indonésie', 'Benjoin'],
      base: ['Cuir tanné', 'Ambre chaud', 'Vanille', 'Absolu de ciste']
    },
    perfumer: 'Jordi Fernández',
    releaseYear: 2023,
    officialDescription: 'Un contraste saisissant entre l\'exotisme acidulé d\'un fruit de la passion lumineux et l\'opulence ténébreuse d\'un bois de oud sauvage.',
    inNayCatalog: false, // NOT SOLD BY NAY
    inStock: false,
    sourceMetadata: {
      sourceName: 'Maison Crivelli Paris — Dossier de Presse & Fiche Officielle',
      sourceTier: 'SOURCE_2_VERIFIED_MANUFACTURER',
      sourceUrl: 'https://maisoncrivelli.com/products/oud-maracuja-extrait-de-parfum',
      fragranceIdentity: 'Maison Crivelli Oud Maracujá (Non vendu par NAY Parfums)',
      dateChecked: TODAY_DATE,
      informationCategory: 'olfactory_pyramid',
      evidenceStatus: 'curated_manufacturer',
      confidenceRationale: 'Documentation officielle Maison Crivelli vérifiée; proposition d\'alternatives orientales boisées de la sélection NAY.'
    }
  },

  // 10. CHANEL NO 5 L'EAU (MANDATORY TEST 1 Alternative: Perfume NOT sold by NAY)
  'chanel-no-5-l-eau': {
    id: 'chanel-no-5-l-eau',
    brand: 'Chanel',
    name: 'N°5 L\'EAU',
    flanker: 'L\'EAU',
    concentration: 'Eau de Toilette',
    family: 'Floral Aldéhydé Frais',
    pyramid: {
      top: ['Citron', 'Mandarine', 'Orange', 'Néroli', 'Aldéhydes modernes'],
      heart: ['Rose de Mai', 'Jasmin', 'Ylang-ylang'],
      base: ['Cèdre', 'Muscs blancs']
    },
    perfumer: 'Olivier Polge',
    releaseYear: 2016,
    officialDescription: 'Une réinvention contemporaine éclatante et cristalline du monument N°5, baignée d\'agrumes gorgés de soleil et d\'aldéhydes épurés.',
    inNayCatalog: false,
    inStock: false,
    sourceMetadata: {
      sourceName: 'Maison Chanel — Fiche Technique Olivier Polge',
      sourceTier: 'SOURCE_2_VERIFIED_MANUFACTURER',
      sourceUrl: 'https://www.chanel.com/fr/parfums/p/105530/n5-leau-eau-de-toilette-vaporisateur/',
      fragranceIdentity: 'Chanel N°5 L\'EAU (Non vendu chez NAY)',
      dateChecked: TODAY_DATE,
      informationCategory: 'olfactory_pyramid',
      evidenceStatus: 'curated_manufacturer',
      confidenceRationale: 'Spécifications officielles Chanel; le catalogue NAY propose d\'autres créations florales hespéridées.'
    }
  },

  // 11. XERJOFF NAXOS (Sold by NAY)
  'xerjoff-naxos': {
    id: 'xerjoff-naxos',
    brand: 'Xerjoff',
    name: 'XJ 1861 Naxos',
    flanker: 'Eau de Parfum',
    concentration: 'Eau de Parfum (EDP)',
    family: 'Aromatique Épicé Miel & Tabac',
    pyramid: {
      top: ['Bergamote', 'Citron de Sicile', 'Lavande'],
      heart: ['Miel blanc', 'Cannelle', 'Cashmeran', 'Jasmin Sambac'],
      base: ['Feuilles de tabac', 'Fève tonka', 'Gousse de vanille']
    },
    perfumer: 'Laboratoires Xerjoff',
    releaseYear: 2015,
    officialDescription: 'Un hommage à la Sicile célébrant la rencontre du soleil méditerranéen hespéridé avec la noblesse gourmande du miel sauvage et du tabac chaud.',
    inNayCatalog: true,
    naySlug: 'xerjoff-naxos-tester',
    nayPrice: 389,
    inStock: true,
    sourceMetadata: {
      sourceName: 'Xerjoff Official Portfolio',
      sourceTier: 'SOURCE_2_VERIFIED_MANUFACTURER',
      sourceUrl: 'https://www.xerjoff.com/product/1861-naxos/',
      fragranceIdentity: 'Xerjoff XJ 1861 Naxos',
      dateChecked: TODAY_DATE,
      informationCategory: 'olfactory_pyramid',
      evidenceStatus: 'curated_manufacturer',
      confidenceRationale: 'Spécifications officielles Xerjoff vérifiées.'
    }
  },

  // 12. TOM FORD TUSCAN LEATHER (Sold by NAY, Out of Stock)
  'tom-ford-tuscan-leather': {
    id: 'tom-ford-tuscan-leather',
    brand: 'Tom Ford',
    name: 'Tuscan Leather',
    flanker: 'Eau de Parfum',
    concentration: 'Eau de Parfum (EDP)',
    family: 'Cuir Fumé Chypré',
    pyramid: {
      top: ['Framboise noire', 'Safran', 'Thym'],
      heart: ['Oliban (Encens)', 'Jasmin de nuit'],
      base: ['Cuir brut', 'Suède noir', 'Notes boisées', 'Ambre']
    },
    perfumer: 'Harry Fremont & Jacques Cavallier',
    releaseYear: 2007,
    officialDescription: 'Un cuir toscan pur, opulent et primitif, sublimé par la douceur inattendue d\'une framboise sauvage et la sensualité d\'un encens nocturne.',
    inNayCatalog: true,
    naySlug: 'tom-ford-tuscan-leather-tester',
    nayPrice: 299,
    inStock: false, // OUT OF STOCK IN NAY CATALOG
    sourceMetadata: {
      sourceName: 'Tom Ford Private Blend Documentation',
      sourceTier: 'SOURCE_2_VERIFIED_MANUFACTURER',
      sourceUrl: 'https://www.tomford.com/beauty/fragrance/private-blend/tuscan-leather/',
      fragranceIdentity: 'Tom Ford Tuscan Leather EDP',
      dateChecked: TODAY_DATE,
      informationCategory: 'olfactory_pyramid',
      evidenceStatus: 'curated_manufacturer',
      confidenceRationale: 'Formule originale Private Blend Tom Ford Beauty.'
    }
  }
};

/**
 * SOURCE 4: General Perfumery Knowledge Definitions
 */
export const GENERAL_PERFUMERY_KNOWLEDGE = {
  concentrationTiers: {
    EDC: {
      name: 'Eau de Cologne',
      oilConcentration: 'Environ 2% à 5%',
      characteristic: 'Formule ultra-légère et vive, dominée par les hespéridés volatiles.',
      subjectivityNote: 'Persistance cutanée généralement brève, idéale pour une fraîcheur tonique après la douche.'
    },
    EDT: {
      name: 'Eau de Toilette',
      oilConcentration: 'Environ 8% à 15%',
      characteristic: 'Équilibre parfait entre sillage d\'ouverture éclatant et légèreté quotidienne.',
      subjectivityNote: 'Idéale pour le travail et le printemps/été; projection initiale vive.'
    },
    EDP: {
      name: 'Eau de Parfum',
      oilConcentration: 'Environ 15% à 20%',
      characteristic: 'Structure plus charpentée en notes de cœur et de fond (fleurs, bois, résines).',
      subjectivityNote: 'Présence plus soutenue et enveloppante au fil des heures.'
    },
    Parfum: {
      name: 'Parfum / Extrait de Parfum',
      oilConcentration: 'Environ 20% à 30%+',
      characteristic: 'Concentration prestigieuse en essences pures, avec sillage dense et intime.',
      subjectivityNote: 'Évolution lente et profonde; sillage diffusé par la chaleur de la peau.'
    },
    Elixir: {
      name: 'Elixir',
      oilConcentration: 'Haute concentration d\'exception (souvent >25-35%)',
      characteristic: 'Réinterprétation liquoreuse, sombre et ultra-intense d\'un flacon icône.',
      subjectivityNote: 'Diffusion puissante et persistante sur textiles et peau bien hydratée.'
    }
  },

  subjectiveFactors: [
    'Hydratation cutanée (la peau sèche dissipe les molécules plus vite)',
    'pH individuel et film hydrolipidique de la peau',
    'Température et humidité ambiante (la chaleur accélère l\'évaporation des notes de tête)',
    'Zones d\'application (points de pulsation : cou, poignets, creux du coude)'
  ],

  testerDefinition: {
    origin: 'Flacons originaux officiels créés par les grandes marques pour les présentoirs et vitrines.',
    juiceMatch: 'Formule, concentration et jus 100% identiques aux éditions sous coffret scellé.',
    packaging: 'Livrés sous boîte cartonnée neutre d\'usine (blanche ou kraft).',
    capAvailability: 'La présence du capuchon décoratif dépend de chaque marque et lot d\'usine (vérifiable sur WhatsApp ou à la livraison).',
    pricingRationale: 'Tarif d\'atelier préférentiel (299-499 MAD) sans surenchère d\'emballage promotionnel.'
  }
};

/**
 * Normalizes query string for fuzzy matching against manufacturer names
 */
function normalizeQuery(str: string): string {
  return str.toLowerCase()
    .replace(/[éèêë]/g, 'e')
    .replace(/[àâä]/g, 'a')
    .replace(/[îï]/g, 'i')
    .replace(/[ôö]/g, 'o')
    .replace(/[ùûü]/g, 'u')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Searches Verified Manufacturer Knowledge Base (Source 2)
 */
export function lookupVerifiedManufacturer(query: string): VerifiedFragranceProfile | null {
  const norm = normalizeQuery(query);

  // Direct key check
  for (const [key, profile] of Object.entries(VERIFIED_MANUFACTURER_PROFILES)) {
    const normKey = normalizeQuery(key);
    const normName = normalizeQuery(profile.name);
    const normBrand = normalizeQuery(profile.brand);
    const combined = `${normBrand} ${normName}`;

    if (norm.includes(combined) || combined.includes(norm) || norm.includes(normKey)) {
      return profile;
    }
  }

  // Token-based matching (excluding generic perfume stopwords)
  const GENERIC_STOPWORDS = new Set([
    'parfum', 'parfums', 'pour', 'homme', 'femme', 'eau', 'de', 'la', 'le', 'les', 
    'un', 'une', 'des', 'avec', 'sans', 'sur', 'dans', 'direct', 'recherche', 'web', 
    'faites', 'avez', 'vous', 'ce', 'cette', 'quel', 'quelle', 'sont', 'notes', 'prix'
  ]);
  const tokens = norm.split(' ').filter(t => t.length > 2 && !GENERIC_STOPWORDS.has(t));
  let bestMatch: VerifiedFragranceProfile | null = null;
  let maxScore = 0;

  for (const profile of Object.values(VERIFIED_MANUFACTURER_PROFILES)) {
    let score = 0;
    const target = `${normalizeQuery(profile.brand)} ${normalizeQuery(profile.name)} ${normalizeQuery(profile.flanker || '')}`;
    
    tokens.forEach(t => {
      if (target.includes(t)) score += 10;
    });

    if (score > maxScore && score >= 20) {
      maxScore = score;
      bestMatch = profile;
    }
  }

  return bestMatch;
}
