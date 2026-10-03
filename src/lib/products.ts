/**
 * NAY Parfums — Catalog Data
 * Authorized retailer of designer fragrances in Morocco.
 * Brands: Valentino · Yves Saint Laurent · Giorgio Armani
 * Prices in MAD (Moroccan Dirham).
 *
 * =============================================================
 * CATEGORY HIERARCHY (3 main × subcategories)
 * =============================================================
 * 1. WOMEN → Floral · Oriental · Fresh · Woody
 * 2. MEN   → Woody · Aromatic · Oriental · Fresh
 * 3. UNISEX & GIFT SETS → Discovery Sets · Gift Bundles · Limited Editions
 */

export type Gender = 'women' | 'men' | 'unisex';
export type Subcategory =
  | 'floral'
  | 'oriental'
  | 'fresh'
  | 'woody'
  | 'aromatic'
  | 'discovery-sets'
  | 'gift-bundles'
  | 'limited-editions'
  | 'coffrets'
  | 'arabic'
  | 'master-copier'
  | (string & {});

export type Brand = 'valentino' | 'yves-saint-laurent' | 'armani' | 'dolce-gabbana' | 'burberry' | 'prada';

export type Season = 'Printemps' | 'Été' | 'Automne' | 'Hiver' | 'Toutes Saisons';

export type Product = {
  id: number;
  slug: string;
  sku?: string | null;
  published?: boolean;
  name: string;
  brand: Brand;
  brandLabel: string;
  gender: Gender;
  subcategory: Subcategory;
  subcategoryLabel: string;
  tagline: string;
  price: number;
  originalPrice?: number;
  description: string;
  longDescription: string;
  images: string[];
  notes: { top: string[]; heart: string[]; base: string[] };
  ingredients: string;
  sizes: { label: string; ml: number; price: number }[];
  bottleColor: 'clear' | 'gold' | 'black' | 'pink' | 'red' | 'silver' | 'green' | 'amber';
  bottleColorLabel: string;
  bottleMaterial: 'glass' | 'crystal' | 'matte' | 'metallic';
  bottleMaterialLabel: string;
  rating: number;
  reviewCount: number;
  releaseDate: string;
  tags: Array<'bestseller' | 'new-arrival' | 'seasonal-fall' | 'seasonal-spring' | 'staff-pick' | 'limited'>;
  inStock: boolean;
  stock?: number;
  perfectSeason: Season;
  isTester?: boolean;
};

export function isProductInStock(product: { inStock?: boolean; stock?: number } | null | undefined): boolean {
  if (!product) return false;
  if (product.inStock === false) return false;
  if (typeof product.stock === 'number' && product.stock <= 0) return false;
  return true;
}

/* ============================================================
   PRODUCT CATALOG
   ============================================================ */

export const PRODUCTS: Product[] = [
  /* ---------- VALENTINO ---------- */
  {
    id: 101,
    slug: 'valentino-born-in-roma-donna',
    name: 'Born in Roma Donna',
    brand: 'valentino',
    brandLabel: 'Valentino',
    gender: 'women',
    subcategory: 'floral',
    subcategoryLabel: 'Floral',
    tagline: 'The couture floral for the modern Roman rebel',
    price: 1290,
    description:
      'Un floral moderne et rebelle : jasmin sambac contrasté par une vanille bourbon addictive et un accord musqué signature.',
    longDescription:
      'Born in Roma Donna incarne l\'esprit couture-street de la Maison Valentino. Une composition qui célèbre le contraste entre l\'élégance intemporelle et l\'audace contemporaine. Le flacon en verre à facettes cloutées reproduit l\'iconique motif Rockstud.',
    images: [
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
    ],
    notes: {
      top: ['Bergamot', 'Blackcurrant'],
      heart: ['Sambac Jasmine', 'Rose Absolute'],
      base: ['Bourbon Vanilla', 'Cashmeran', 'Musk'],
    },
    ingredients: 'Alcohol Denat., Parfum, Aqua, Limonene, Linalool, Coumarin, Citronellol, Benzyl Salicylate, Geraniol, Alpha-Isomethyl Ionone.',
    sizes: [
      { label: '30ml', ml: 30, price: 890 },
      { label: '50ml', ml: 50, price: 1290 },
      { label: '100ml', ml: 100, price: 1890 },
    ],
    bottleColor: 'pink',
    bottleColorLabel: 'Rose',
    bottleMaterial: 'glass',
    bottleMaterialLabel: 'Verre facetté',
    rating: 4.7,
    reviewCount: 342,
    releaseDate: '2024-11-15',
    tags: ['bestseller', 'staff-pick'],
    inStock: true,
    perfectSeason: 'Toutes Saisons',
  },
  {
    id: 102,
    slug: 'valentino-born-in-roma-uomo',
    name: 'Born in Roma Uomo',
    brand: 'valentino',
    brandLabel: 'Valentino',
    gender: 'men',
    subcategory: 'woody',
    subcategoryLabel: 'Woody',
    tagline: 'Ginger meets black iris — a bold Roman signature',
    price: 1350,
    description:
      'Un boisé aromatique moderne : gingembre acidulé, iris noir et cuir cachemire tissés dans un sillage magnétique.',
    longDescription:
      'Born in Roma Uomo capture l\'énergie créative de la jeunesse romaine. Un mélange audacieux d\'ingrédients contrastés qui reflète le style Valentino : couture et streetwear, tradition et rébellion.',
    images: [
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
    ],
    notes: {
      top: ['Ginger', 'Mineral Notes'],
      heart: ['Black Iris', 'Violet Leaf'],
      base: ['Cashmere Leather', 'Vetiver', 'Patchouli'],
    },
    ingredients: 'Alcohol Denat., Parfum, Aqua, Limonene, Linalool, Coumarin, Eugenol, Citral, Farnesol.',
    sizes: [
      { label: '50ml', ml: 50, price: 1350 },
      { label: '100ml', ml: 100, price: 1990 },
      { label: '150ml', ml: 150, price: 2490 },
    ],
    bottleColor: 'green',
    bottleColorLabel: 'Camouflage Vert',
    bottleMaterial: 'glass',
    bottleMaterialLabel: 'Verre facetté',
    rating: 4.8,
    reviewCount: 428,
    releaseDate: '2024-09-01',
    tags: ['bestseller', 'seasonal-fall'],
    inStock: true,
    perfectSeason: 'Automne',
  },
  {
    id: 103,
    slug: 'valentino-voce-viva',
    name: 'Voce Viva',
    brand: 'valentino',
    brandLabel: 'Valentino',
    gender: 'women',
    subcategory: 'floral',
    subcategoryLabel: 'Floral',
    tagline: 'Find your voice — a solar floral musk',
    price: 1190,
    description:
      'Un floral solaire lumineux : orange sanguine pétillante, iris crémeux et musc blanc dans un flacon signé Lady Gaga.',
    longDescription:
      'Créé en collaboration avec Lady Gaga, Voce Viva est une ode à l\'expression féminine. Un sillage frais, féminin et profondément moderne pour les femmes qui n\'ont pas peur de faire entendre leur voix.',
    images: [
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
    ],
    notes: {
      top: ['Bergamot', 'Blood Orange', 'Mandarin'],
      heart: ['Iris', 'Orange Blossom'],
      base: ['Erythrocentric Musk', 'Cedarwood'],
    },
    ingredients: 'Alcohol Denat., Parfum, Aqua, Limonene, Linalool, Citronellol, Geraniol.',
    sizes: [
      { label: '30ml', ml: 30, price: 790 },
      { label: '50ml', ml: 50, price: 1190 },
      { label: '100ml', ml: 100, price: 1790 },
    ],
    bottleColor: 'gold',
    bottleColorLabel: 'Or',
    bottleMaterial: 'metallic',
    bottleMaterialLabel: 'Métal doré',
    rating: 4.6,
    reviewCount: 267,
    releaseDate: '2025-03-10',
    tags: ['new-arrival', 'seasonal-spring'],
    inStock: true,
    perfectSeason: 'Toutes Saisons',
  },
  {
    id: 104,
    slug: 'valentino-uomo-intense',
    name: 'Uomo Intense',
    brand: 'valentino',
    brandLabel: 'Valentino',
    gender: 'men',
    subcategory: 'oriental',
    subcategoryLabel: 'Oriental',
    tagline: 'A sensual leather-and-iris oriental',
    price: 1450,
    description:
      'Un oriental cuiré profond : bergamote, iris pallida, gousse de vanille et cuir tanné, pour l\'homme d\'exception.',
    longDescription:
      'Uomo Intense pousse plus loin la sensualité masculine avec un cuir plus riche et un fond de vanille absolue. Un parfum de séducteur, pensé pour le soir.',
    images: [
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
    ],
    notes: {
      top: ['Bergamot', 'Myrtle'],
      heart: ['Iris Pallida', 'Gianduia Cream'],
      base: ['Leather', 'Vanilla Absolute', 'Cedar'],
    },
    ingredients: 'Alcohol Denat., Parfum, Aqua, Limonene, Coumarin, Linalool, Eugenol, Benzyl Benzoate.',
    sizes: [
      { label: '50ml', ml: 50, price: 1450 },
      { label: '100ml', ml: 100, price: 2190 },
    ],
    bottleColor: 'black',
    bottleColorLabel: 'Noir',
    bottleMaterial: 'glass',
    bottleMaterialLabel: 'Verre sablé',
    rating: 4.9,
    reviewCount: 189,
    releaseDate: '2023-10-05',
    tags: ['bestseller', 'seasonal-fall'],
    inStock: true,
    perfectSeason: 'Automne',
  },
  {
    id: 105,
    slug: 'valentino-donna-rosa-verde',
    name: 'Donna Rosa Verde',
    brand: 'valentino',
    brandLabel: 'Valentino',
    gender: 'women',
    subcategory: 'fresh',
    subcategoryLabel: 'Fresh',
    tagline: 'A radiant green rose for spring',
    price: 1090,
    description:
      'Rose verte pétillante, thé vert et musc blanc — la fraîcheur d\'un jardin romain au printemps.',
    longDescription:
      'Une interprétation moderne et lumineuse de la rose, sublimée par une touche verte inattendue. Idéal pour les journées ensoleillées.',
    images: [
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
    ],
    notes: {
      top: ['Green Tea', 'Bergamot'],
      heart: ['Rose', 'Peony'],
      base: ['White Musk', 'Cedar'],
    },
    ingredients: 'Alcohol Denat., Parfum, Aqua, Limonene, Linalool, Citronellol.',
    sizes: [
      { label: '50ml', ml: 50, price: 1090 },
      { label: '100ml', ml: 100, price: 1590 },
    ],
    bottleColor: 'green',
    bottleColorLabel: 'Vert',
    bottleMaterial: 'glass',
    bottleMaterialLabel: 'Verre translucide',
    rating: 4.5,
    reviewCount: 124,
    releaseDate: '2025-02-01',
    tags: ['new-arrival', 'seasonal-spring'],
    inStock: true,
    perfectSeason: 'Toutes Saisons',
  },
  {
    id: 106,
    slug: 'valentino-uomo-coral-fantasy',
    name: 'Uomo Coral Fantasy',
    brand: 'valentino',
    brandLabel: 'Valentino',
    gender: 'men',
    subcategory: 'fresh',
    subcategoryLabel: 'Fresh',
    tagline: 'Mediterranean citrus with a leather twist',
    price: 1250,
    description:
      'Pamplemousse, gingembre et cuir léger — l\'énergie solaire de la côte amalfitaine.',
    longDescription:
      'Une déclinaison plus fraîche et estivale de l\'Uomo original. Le parfait compagnon pour les journées ensoleillées et les soirées en bord de mer.',
    images: [
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
    ],
    notes: {
      top: ['Grapefruit', 'Bergamot', 'Ginger'],
      heart: ['Neroli', 'Cardamom'],
      base: ['Leather', 'White Musk', 'Ambroxan'],
    },
    ingredients: 'Alcohol Denat., Parfum, Aqua, Limonene, Linalool, Citral, Geraniol.',
    sizes: [
      { label: '50ml', ml: 50, price: 1250 },
      { label: '100ml', ml: 100, price: 1790 },
    ],
    bottleColor: 'red',
    bottleColorLabel: 'Corail',
    bottleMaterial: 'glass',
    bottleMaterialLabel: 'Verre teinté',
    rating: 4.6,
    reviewCount: 156,
    releaseDate: '2024-06-15',
    tags: ['seasonal-spring'],
    inStock: true,
    perfectSeason: 'Toutes Saisons',
  },

  /* ---------- YVES SAINT LAURENT ---------- */
  {
    id: 201,
    slug: 'ysl-libre-edp',
    name: 'Libre Eau de Parfum',
    brand: 'yves-saint-laurent',
    brandLabel: 'Yves Saint Laurent',
    gender: 'women',
    subcategory: 'floral',
    subcategoryLabel: 'Floral',
    tagline: 'The scent of freedom',
    price: 1490,
    description:
      'Fleur d\'oranger marocaine et lavande française enveloppées dans une vanille addictive. Le parfum d\'une femme libre.',
    longDescription:
      'Libre célèbre la fusion parfaite entre la fleur d\'oranger de Meknès et la lavande de Provence — un accord inédit qui incarne la liberté à la YSL. La signature de la femme moderne, forte et sensuelle.',
    images: [
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
    ],
    notes: {
      top: ['Mandarin', 'Blackcurrant', 'Lavandin'],
      heart: ['Moroccan Orange Blossom', 'Jasmine', 'French Lavender'],
      base: ['Madagascar Vanilla', 'Ambergris', 'Musk'],
    },
    ingredients: 'Alcohol Denat., Parfum, Aqua, Limonene, Linalool, Coumarin, Citronellol, Benzyl Benzoate, Geraniol.',
    sizes: [
      { label: '30ml', ml: 30, price: 990 },
      { label: '50ml', ml: 50, price: 1490 },
      { label: '90ml', ml: 90, price: 2190 },
    ],
    bottleColor: 'gold',
    bottleColorLabel: 'Or',
    bottleMaterial: 'metallic',
    bottleMaterialLabel: 'Verre doré',
    rating: 4.9,
    reviewCount: 612,
    releaseDate: '2024-08-20',
    tags: ['bestseller', 'staff-pick'],
    inStock: true,
    perfectSeason: 'Toutes Saisons',
  },
  {
    id: 202,
    slug: 'ysl-black-opium',
    name: 'Black Opium',
    brand: 'yves-saint-laurent',
    brandLabel: 'Yves Saint Laurent',
    gender: 'women',
    subcategory: 'oriental',
    subcategoryLabel: 'Oriental',
    tagline: 'The addictive rock-and-roll oriental',
    price: 1390,
    description:
      'Café noir, vanille sensuelle et fleur d\'oranger blanche — un floriental rock ultra-addictif.',
    longDescription:
      'L\'incontournable Black Opium associe le café à la vanille pour créer un sillage ultra-féminin et audacieux. Le parfum culte de toute une génération.',
    images: [
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
    ],
    notes: {
      top: ['Pear', 'Pink Pepper', 'Orange Blossom'],
      heart: ['Black Coffee', 'Jasmine Sambac'],
      base: ['Vanilla', 'Patchouli', 'Cedarwood'],
    },
    ingredients: 'Alcohol Denat., Parfum, Aqua, Limonene, Linalool, Coumarin, Benzyl Salicylate.',
    sizes: [
      { label: '30ml', ml: 30, price: 890 },
      { label: '50ml', ml: 50, price: 1390 },
      { label: '90ml', ml: 90, price: 1990 },
    ],
    bottleColor: 'black',
    bottleColorLabel: 'Noir Paillette',
    bottleMaterial: 'glass',
    bottleMaterialLabel: 'Verre pailleté',
    rating: 4.8,
    reviewCount: 894,
    releaseDate: '2023-01-15',
    tags: ['bestseller', 'seasonal-fall'],
    inStock: true,
    perfectSeason: 'Automne',
  },
  {
    id: 203,
    slug: 'ysl-mon-paris',
    name: 'Mon Paris',
    brand: 'yves-saint-laurent',
    brandLabel: 'Yves Saint Laurent',
    gender: 'women',
    subcategory: 'floral',
    subcategoryLabel: 'Floral',
    tagline: 'A love story in a bottle',
    price: 1250,
    description:
      'Framboise sucrée, pivoine et patchouli blanc — l\'histoire d\'amour parfumée à Paris.',
    longDescription:
      'Mon Paris raconte une histoire d\'amour audacieuse et impétueuse. Un floral fruité qui bouscule les codes, aussi passionné qu\'une déclaration d\'amour parisienne.',
    images: [
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
    ],
    notes: {
      top: ['Strawberry', 'Raspberry', 'Pear'],
      heart: ['Peony', 'Jasmine', 'Datura'],
      base: ['White Musk', 'White Patchouli', 'Cedar'],
    },
    ingredients: 'Alcohol Denat., Parfum, Aqua, Limonene, Linalool, Coumarin, Citronellol, Alpha-Isomethyl Ionone.',
    sizes: [
      { label: '30ml', ml: 30, price: 850 },
      { label: '50ml', ml: 50, price: 1250 },
      { label: '90ml', ml: 90, price: 1850 },
    ],
    bottleColor: 'pink',
    bottleColorLabel: 'Rose',
    bottleMaterial: 'glass',
    bottleMaterialLabel: 'Verre à ruban',
    rating: 4.7,
    reviewCount: 456,
    releaseDate: '2023-06-01',
    tags: ['seasonal-spring'],
    inStock: true,
    perfectSeason: 'Toutes Saisons',
  },
  {
    id: 204,
    slug: 'ysl-y-edp',
    name: 'Y Eau de Parfum',
    brand: 'yves-saint-laurent',
    brandLabel: 'Yves Saint Laurent',
    gender: 'men',
    subcategory: 'aromatic',
    subcategoryLabel: 'Aromatic',
    tagline: 'The scent of the modern man',
    price: 1350,
    description:
      'Sauge fraîche, gingembre et bois de cèdre. La signature masculine de la génération Y.',
    longDescription:
      'Un aromatique boisé moderne qui incarne la génération créative — celle qui dit "yes" à ses ambitions. Puissant, contemporain et rassurant.',
    images: [
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
    ],
    notes: {
      top: ['Bergamot', 'Ginger', 'Apple'],
      heart: ['Sage', 'Geranium', 'Juniper'],
      base: ['Cedar', 'Vetiver', 'Tonka Bean'],
    },
    ingredients: 'Alcohol Denat., Parfum, Aqua, Limonene, Linalool, Coumarin, Citronellol.',
    sizes: [
      { label: '60ml', ml: 60, price: 1350 },
      { label: '100ml', ml: 100, price: 1890 },
      { label: '200ml', ml: 200, price: 2790 },
    ],
    bottleColor: 'silver',
    bottleColorLabel: 'Argent',
    bottleMaterial: 'metallic',
    bottleMaterialLabel: 'Verre chromé',
    rating: 4.8,
    reviewCount: 523,
    releaseDate: '2024-04-10',
    tags: ['bestseller'],
    inStock: true,
    perfectSeason: 'Toutes Saisons',
  },
  {
    id: 205,
    slug: 'ysl-myslf',
    name: 'MYSLF',
    brand: 'yves-saint-laurent',
    brandLabel: 'Yves Saint Laurent',
    gender: 'men',
    subcategory: 'woody',
    subcategoryLabel: 'Woody',
    tagline: 'Be true to yourself',
    price: 1590,
    description:
      'Fleur d\'oranger, patchouli labdanum et musc ambré — la nouvelle masculinité assumée.',
    longDescription:
      'MYSLF redéfinit la masculinité contemporaine avec un accord floral-boisé inédit. Sensible, sensuel, sans compromis. Le nouveau parfum culte YSL Homme.',
    images: [
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
    ],
    notes: {
      top: ['Bergamot', 'Pear Nectar'],
      heart: ['Orange Blossom', 'Ambroxan'],
      base: ['Patchouli Labdanum', 'Amber Musk'],
    },
    ingredients: 'Alcohol Denat., Parfum, Aqua, Limonene, Linalool, Coumarin, Farnesol.',
    sizes: [
      { label: '40ml', ml: 40, price: 1090 },
      { label: '60ml', ml: 60, price: 1590 },
      { label: '100ml', ml: 100, price: 2290 },
    ],
    bottleColor: 'gold',
    bottleColorLabel: 'Or Miroir',
    bottleMaterial: 'metallic',
    bottleMaterialLabel: 'Miroir doré',
    rating: 4.9,
    reviewCount: 234,
    releaseDate: '2025-01-15',
    tags: ['new-arrival', 'staff-pick'],
    inStock: true,
    perfectSeason: 'Toutes Saisons',
  },
  {
    id: 206,
    slug: 'ysl-lhomme',
    name: 'L\'Homme',
    brand: 'yves-saint-laurent',
    brandLabel: 'Yves Saint Laurent',
    gender: 'men',
    subcategory: 'woody',
    subcategoryLabel: 'Woody',
    tagline: 'The elegant French gentleman',
    price: 1290,
    description:
      'Gingembre, basilic et bois de cèdre. L\'élégance masculine à la française, sans jamais forcer.',
    longDescription:
      'Le classique intemporel d\'YSL Homme. Un boisé aromatique équilibré et raffiné qui convient à toutes les occasions.',
    images: [
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
    ],
    notes: {
      top: ['Ginger', 'Bergamot', 'Lemon'],
      heart: ['Basil', 'Violet Leaf', 'White Pepper'],
      base: ['Cedar', 'Vetiver', 'Tonka'],
    },
    ingredients: 'Alcohol Denat., Parfum, Aqua, Limonene, Linalool, Coumarin, Citral, Geraniol.',
    sizes: [
      { label: '60ml', ml: 60, price: 1290 },
      { label: '100ml', ml: 100, price: 1790 },
      { label: '200ml', ml: 200, price: 2690 },
    ],
    bottleColor: 'clear',
    bottleColorLabel: 'Transparent',
    bottleMaterial: 'glass',
    bottleMaterialLabel: 'Verre pur',
    rating: 4.7,
    reviewCount: 389,
    releaseDate: '2023-03-20',
    tags: [],
    inStock: true,
    perfectSeason: 'Toutes Saisons',
  },

  /* ---------- ARMANI ---------- */
  {
    id: 301,
    slug: 'armani-stronger-with-you',
    name: 'Stronger With You',
    brand: 'armani',
    brandLabel: 'Emporio Armani',
    gender: 'men',
    subcategory: 'oriental',
    subcategoryLabel: 'Oriental',
    tagline: 'The most sensual eau de toilette',
    price: 1190,
    originalPrice: 1390,
    description:
      'Cardamome, sauge et vanille sucrée — le parfum culte pour l\'homme qui séduit sans effort.',
    longDescription:
      'Stronger With You a redéfini la parfumerie masculine avec son accord gourmand et sensuel. Cardamome pétillante, sauge boisée et un fond addictif de vanille et de châtaigne glacée.',
    images: [
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
    ],
    notes: {
      top: ['Cardamom', 'Pink Pepper', 'Violet Leaves'],
      heart: ['Sage', 'Neroli'],
      base: ['Vanilla', 'Chestnut Cream', 'Cedar'],
    },
    ingredients: 'Alcohol Denat., Parfum, Aqua, Limonene, Linalool, Coumarin, Citral, Alpha-Isomethyl Ionone.',
    sizes: [
      { label: '50ml', ml: 50, price: 1190 },
      { label: '100ml', ml: 100, price: 1690 },
      { label: '200ml', ml: 200, price: 2490 },
    ],
    bottleColor: 'clear',
    bottleColorLabel: 'Transparent',
    bottleMaterial: 'glass',
    bottleMaterialLabel: 'Verre pur',
    rating: 4.9,
    reviewCount: 1247,
    releaseDate: '2023-05-10',
    tags: ['bestseller', 'staff-pick'],
    inStock: true,
    perfectSeason: 'Toutes Saisons',
  },
  {
    id: 302,
    slug: 'armani-stronger-with-you-intensely',
    name: 'Stronger With You Intensely',
    brand: 'armani',
    brandLabel: 'Emporio Armani',
    gender: 'men',
    subcategory: 'oriental',
    subcategoryLabel: 'Oriental',
    tagline: 'A deeper, richer intensity',
    price: 1390,
    description:
      'Version plus intense : vanille pure, ambre chaud et jasmin sambac. Pour les soirées inoubliables.',
    longDescription:
      'La déclinaison Eau de Parfum de l\'iconique Stronger With You. Plus profond, plus enveloppant, plus sensuel — parfait pour les rendez-vous du soir.',
    images: [
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
    ],
    notes: {
      top: ['Cardamom', 'Toffee', 'Pink Pepper'],
      heart: ['Sambac Jasmine', 'Lavender'],
      base: ['Amber', 'Pure Vanilla', 'Tonka Bean'],
    },
    ingredients: 'Alcohol Denat., Parfum, Aqua, Limonene, Linalool, Coumarin, Farnesol, Benzyl Salicylate.',
    sizes: [
      { label: '50ml', ml: 50, price: 1390 },
      { label: '100ml', ml: 100, price: 1990 },
    ],
    bottleColor: 'amber',
    bottleColorLabel: 'Ambre',
    bottleMaterial: 'glass',
    bottleMaterialLabel: 'Verre ambré',
    rating: 4.9,
    reviewCount: 687,
    releaseDate: '2024-10-01',
    tags: ['bestseller', 'seasonal-fall'],
    inStock: true,
    perfectSeason: 'Automne',
  },
  {
    id: 303,
    slug: 'armani-si-edp',
    name: 'Sì Eau de Parfum',
    brand: 'armani',
    brandLabel: 'Giorgio Armani',
    gender: 'women',
    subcategory: 'oriental',
    subcategoryLabel: 'Oriental',
    tagline: 'Say yes to elegance',
    price: 1450,
    description:
      'Cassis noir, néroli et vanille — la féminité assumée, chic et intemporelle signée Armani.',
    longDescription:
      'Sì incarne l\'élégance italienne intemporelle. Un floriental chypré moderne avec un cœur de fruits noirs et une base ambrée profondément sensuelle.',
    images: [
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
    ],
    notes: {
      top: ['Blackcurrant', 'Mandarin', 'Freesia'],
      heart: ['Rose de Mai', 'Neroli', 'Osmanthus'],
      base: ['Vanilla', 'Ambroxan', 'Patchouli'],
    },
    ingredients: 'Alcohol Denat., Parfum, Aqua, Limonene, Linalool, Coumarin, Citronellol, Geraniol.',
    sizes: [
      { label: '30ml', ml: 30, price: 990 },
      { label: '50ml', ml: 50, price: 1450 },
      { label: '100ml', ml: 100, price: 2090 },
    ],
    bottleColor: 'black',
    bottleColorLabel: 'Noir Laqué',
    bottleMaterial: 'glass',
    bottleMaterialLabel: 'Verre laqué',
    rating: 4.8,
    reviewCount: 731,
    releaseDate: '2023-11-05',
    tags: ['bestseller'],
    inStock: true,
    perfectSeason: 'Toutes Saisons',
  },
  {
    id: 304,
    slug: 'armani-acqua-di-gio-profumo',
    name: 'Acqua di Giò Profumo',
    brand: 'armani',
    brandLabel: 'Giorgio Armani',
    gender: 'men',
    subcategory: 'fresh',
    subcategoryLabel: 'Fresh',
    tagline: 'The scent of the Mediterranean',
    price: 1590,
    description:
      'Bergamote de Calabre, encens et patchouli marin — la mer profonde en flacon.',
    longDescription:
      'La version Profumo d\'Acqua di Giò intensifie l\'ADN aquatique original avec des notes profondes d\'encens et un cœur boisé. L\'élégance méditerranéenne dans sa forme la plus noble.',
    images: [
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
    ],
    notes: {
      top: ['Sea Notes', 'Bergamot', 'Geranium'],
      heart: ['Incense', 'Rosemary', 'Sage'],
      base: ['Patchouli', 'Amber', 'Musk'],
    },
    ingredients: 'Alcohol Denat., Parfum, Aqua, Limonene, Linalool, Citral, Coumarin.',
    sizes: [
      { label: '40ml', ml: 40, price: 1090 },
      { label: '75ml', ml: 75, price: 1590 },
      { label: '125ml', ml: 125, price: 2290 },
    ],
    bottleColor: 'black',
    bottleColorLabel: 'Noir Mat',
    bottleMaterial: 'matte',
    bottleMaterialLabel: 'Verre mat',
    rating: 4.9,
    reviewCount: 892,
    releaseDate: '2024-03-15',
    tags: ['bestseller', 'seasonal-spring', 'staff-pick'],
    inStock: true,
    perfectSeason: 'Toutes Saisons',
  },
  {
    id: 305,
    slug: 'armani-code-homme',
    name: 'Armani Code Homme',
    brand: 'armani',
    brandLabel: 'Giorgio Armani',
    gender: 'men',
    subcategory: 'oriental',
    subcategoryLabel: 'Oriental',
    tagline: 'The code of the modern seducer',
    price: 1290,
    description:
      'Bergamote, fleur d\'olivier et tabac — le code élégant et mystérieux de l\'homme Armani.',
    longDescription:
      'Un oriental épicé aux facettes tabac et bois, iconique depuis 2004. La séduction en toute élégance.',
    images: [
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
    ],
    notes: {
      top: ['Bergamot', 'Lemon'],
      heart: ['Olive Blossom', 'Guaiac Wood'],
      base: ['Leather', 'Tobacco', 'Tonka'],
    },
    ingredients: 'Alcohol Denat., Parfum, Aqua, Limonene, Linalool, Coumarin, Eugenol.',
    sizes: [
      { label: '50ml', ml: 50, price: 1290 },
      { label: '75ml', ml: 75, price: 1690 },
      { label: '125ml', ml: 125, price: 2290 },
    ],
    bottleColor: 'black',
    bottleColorLabel: 'Noir',
    bottleMaterial: 'glass',
    bottleMaterialLabel: 'Verre noir',
    rating: 4.7,
    reviewCount: 512,
    releaseDate: '2023-07-01',
    tags: ['seasonal-fall'],
    inStock: true,
    perfectSeason: 'Automne',
  },
  {
    id: 306,
    slug: 'armani-my-way-edp',
    name: 'My Way Eau de Parfum',
    brand: 'armani',
    brandLabel: 'Giorgio Armani',
    gender: 'women',
    subcategory: 'floral',
    subcategoryLabel: 'Floral',
    tagline: 'Discover the world, discover myself',
    price: 1390,
    description:
      'Fleur d\'oranger d\'Egypte, tubéreuse indienne et vanille de Madagascar. Le voyage sensoriel d\'une femme moderne.',
    longDescription:
      'My Way célèbre les rencontres qui nous transforment. Un floral blanc lumineux qui allie les plus beaux ingrédients du monde entier.',
    images: [
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
    ],
    notes: {
      top: ['Bergamot', 'Orange Blossom'],
      heart: ['Indian Tuberose', 'Egyptian Jasmine'],
      base: ['Madagascan Vanilla', 'White Musk', 'Cedar'],
    },
    ingredients: 'Alcohol Denat., Parfum, Aqua, Limonene, Linalool, Coumarin, Citronellol.',
    sizes: [
      { label: '30ml', ml: 30, price: 890 },
      { label: '50ml', ml: 50, price: 1390 },
      { label: '90ml', ml: 90, price: 1990 },
    ],
    bottleColor: 'clear',
    bottleColorLabel: 'Transparent',
    bottleMaterial: 'crystal',
    bottleMaterialLabel: 'Cristal poli',
    rating: 4.8,
    reviewCount: 428,
    releaseDate: '2025-02-14',
    tags: ['new-arrival', 'staff-pick'],
    inStock: true,
    perfectSeason: 'Toutes Saisons',
  },
  {
    id: 401,
    slug: 'dolce-gabbana-limperatrice',
    name: "L'Impératrice",
    brand: 'dolce-gabbana',
    brandLabel: 'Dolce & Gabbana',
    gender: 'women',
    subcategory: 'fresh',
    subcategoryLabel: 'Fresh',
    tagline: 'Vibrant and magnetic',
    price: 1150,
    description: 'Une fragrance fruitée et florale captivante, combinant kiwi, rhubarbe et pastèque.',
    longDescription: "L'Impératrice de Dolce & Gabbana est un parfum joyeux, éclatant et délicieusement addictif. Une eau de toilette emblématique qui célèbre la vivacité et le charisme.",
    images: ['/images/dg_imperatrice.png'],
    notes: { top: ['Kiwi', 'Rhubarb', 'Pink Pepper'], heart: ['Watermelon', 'Cyclamen', 'Jasmine'], base: ['Lemon Tree', 'Sandalwood', 'Musk'] },
    ingredients: 'Alcohol, Parfum, Aqua...',
    sizes: [{ label: '100ml', ml: 100, price: 1150 }],
    bottleColor: 'clear',
    bottleColorLabel: 'Transparent',
    bottleMaterial: 'glass',
    bottleMaterialLabel: 'Verre pur',
    rating: 4.6,
    reviewCount: 312,
    releaseDate: '2020-01-01',
    tags: ['bestseller'],
    inStock: true,
    perfectSeason: 'Toutes Saisons',
  },
  {
    id: 402,
    slug: 'burberry-her-intense',
    name: 'Her Eau de Parfum Intense',
    brand: 'burberry',
    brandLabel: 'Burberry',
    gender: 'women',
    subcategory: 'floral',
    subcategoryLabel: 'Floral',
    tagline: 'Bold and London-spirited',
    price: 1650,
    description: "Une version intense aux notes de fruits rouges assombries par le jasmin et l'ambre chaud.",
    longDescription: "Burberry Her Intense capture l'énergie frénétique de Londres. Une explosion de fruits rouges sublimée par des notes florales intenses et un fond chaleureux d'ambre et de benjoin.",
    images: ['/images/burberry_her.png'],
    notes: { top: ['Blackberry', 'Red Fruits'], heart: ['Jasmine'], base: ['Benzoin', 'Amber', 'Cedar'] },
    ingredients: 'Alcohol, Parfum, Aqua...',
    sizes: [{ label: '100ml', ml: 100, price: 1650 }],
    bottleColor: 'pink',
    bottleColorLabel: 'Rose Poudré',
    bottleMaterial: 'glass',
    bottleMaterialLabel: 'Verre opaque',
    rating: 4.8,
    reviewCount: 410,
    releaseDate: '2021-01-01',
    tags: ['new-arrival'],
    inStock: true,
    perfectSeason: 'Toutes Saisons',
  },
  {
    id: 403,
    slug: 'prada-paradigme',
    name: 'Paradigme Milano',
    brand: 'prada',
    brandLabel: 'Prada',
    gender: 'unisex',
    subcategory: 'woody',
    subcategoryLabel: 'Woody',
    tagline: 'Avant-garde and timeless',
    price: 1800,
    description: 'Une expression boisée et aromatique avec une touche moderne signature de Prada Milano.',
    longDescription: "Un parfum d'avant-garde qui défie les conventions. Sa teinte verte émeraude cache un sillage boisé et riche, parfait pour ceux qui recherchent l'unicité.",
    images: ['/images/prada_green.png'],
    notes: { top: ['Bergamot', 'Green Notes'], heart: ['Iris', 'Cardamom'], base: ['Vetiver', 'Sandalwood', 'Musk'] },
    ingredients: 'Alcohol, Parfum, Aqua...',
    sizes: [{ label: '100ml', ml: 100, price: 1800 }],
    bottleColor: 'green',
    bottleColorLabel: 'Vert Émeraude',
    bottleMaterial: 'glass',
    bottleMaterialLabel: 'Verre teinté',
    rating: 4.7,
    reviewCount: 205,
    releaseDate: '2023-01-01',
    tags: ['staff-pick'],
    inStock: true,
    perfectSeason: 'Toutes Saisons',
  },
  {
    id: 404,
    slug: 'valentino-donna-intense',
    name: 'Donna Born in Roma Intense',
    brand: 'valentino',
    brandLabel: 'Valentino',
    gender: 'women',
    subcategory: 'oriental',
    subcategoryLabel: 'Oriental',
    tagline: "A tribute to Rome's vibrant energy",
    price: 1550,
    description: 'Une infusion de vanille bourbon et de jasmin pour une intensité florale couture.',
    longDescription: "Donna Born in Roma Intense amplifie l'addiction de la fragrance originale avec une double dose de vanille bourbon, poussant la sensualité florale à son apogée.",
    images: ['/images/valentino_donna_intense.png'],
    notes: { top: ['Vanilla Bourbon'], heart: ['Jasmine Grandiflorum'], base: ['Benzoin Resin'] },
    ingredients: 'Alcohol, Parfum, Aqua...',
    sizes: [{ label: '100ml', ml: 100, price: 1550 }],
    bottleColor: 'black',
    bottleColorLabel: 'Noir Clouté',
    bottleMaterial: 'glass',
    bottleMaterialLabel: 'Verre clouté',
    rating: 4.9,
    reviewCount: 520,
    releaseDate: '2026-07-01', // Make it show as new arrival
    tags: ['bestseller', 'new-arrival'],
    inStock: true,
    perfectSeason: 'Toutes Saisons',
  },
  {
    id: 405,
    slug: 'armani-my-way-floral',
    name: 'My Way Parfum',
    brand: 'armani',
    brandLabel: 'Giorgio Armani',
    gender: 'women',
    subcategory: 'floral',
    subcategoryLabel: 'Floral',
    tagline: 'An intense floral woody powder',
    price: 1350,
    description: "L'intensité de l'iris pallida et de la tubéreuse dans un sillage ambré boisé enchanteur.",
    longDescription: "My Way Parfum révèle une nouvelle facette plus poudrée et intense. L'iris bleu éclatant rencontre la tubéreuse crémeuse sur un fond chaleureux de vanille et bois de cèdre.",
    images: ['/images/armani_my_way.png'],
    notes: { top: ['Orange Blossom', 'Bitter Orange'], heart: ['Iris Pallida', 'Tuberose'], base: ['Cedarwood', 'Vanilla Bourbon', 'White Musk'] },
    ingredients: 'Alcohol, Parfum, Aqua...',
    sizes: [{ label: '90ml', ml: 90, price: 1350 }],
    bottleColor: 'pink',
    bottleColorLabel: 'Rose Poudré',
    bottleMaterial: 'glass',
    bottleMaterialLabel: 'Verre pur',
    rating: 4.8,
    reviewCount: 395,
    releaseDate: '2026-07-02', // Make it show as new arrival
    tags: ['new-arrival'],
    inStock: true,
    perfectSeason: 'Toutes Saisons',
  }
];

/* ============================================================
   CATEGORY DEFINITIONS
   ============================================================ */

export const MAIN_CATEGORIES = [
  {
    key: 'women',
    label: 'Parfums Femme',
    labelShort: 'Femme',
    slug: 'women',
    subcategories: [
      { key: 'floral', label: 'Floral', slug: 'floral' },
      { key: 'oriental', label: 'Oriental', slug: 'oriental' },
      { key: 'fresh', label: 'Fresh', slug: 'fresh' },
      { key: 'woody', label: 'Boisé', slug: 'woody' },
    ],
    description:
      'Notre sélection complète des parfums féminins iconiques signés Valentino, Yves Saint Laurent et Armani. Des florals lumineux comme YSL Libre aux orientaux addictifs comme Black Opium, trouvez le parfum qui définira votre signature. Chaque flacon est authentique, importé directement des maisons officielles, et livré offert partout au Maroc.',
    heroImage: 'https://images.pexels.com/photos/1961795/pexels-photo-1961795.jpeg?auto=compress&cs=tinysrgb&w=2000',
  },
  {
    key: 'men',
    label: 'Parfums Homme',
    labelShort: 'Homme',
    slug: 'men',
    subcategories: [
      { key: 'woody', label: 'Boisé', slug: 'woody' },
      { key: 'aromatic', label: 'Aromatique', slug: 'aromatic' },
      { key: 'oriental', label: 'Oriental', slug: 'oriental' },
      { key: 'fresh', label: 'Fresh', slug: 'fresh' },
    ],
    description:
      'La sélection définitive des parfums masculins de créateurs. De la sensualité gourmande d\'Armani Stronger With You à la fraîcheur méditerranéenne d\'Acqua di Giò Profumo, en passant par la nouvelle icône YSL MYSLF — ce sont les fragrances que portent les hommes de goût au Maroc. Authenticité garantie, produits authentiques.',
    heroImage: 'https://images.pexels.com/photos/18321516/pexels-photo-18321516/free-photo-of-perfume-bottle-and-pine-needles.jpeg?auto=compress&cs=tinysrgb&w=2000',
  },
  {
    key: 'unisex',
    label: 'Parfums Unisex',
    labelShort: 'Unisex',
    slug: 'unisex',
    subcategories: [
      { key: 'woody', label: 'Boisé', slug: 'woody' },
      { key: 'oriental', label: 'Oriental', slug: 'oriental' },
      { key: 'fresh', label: 'Frais', slug: 'fresh' },
      { key: 'floral', label: 'Floral', slug: 'floral' },
    ],
    description:
      'La parfumerie unisexe par excellence. L\'harmonie parfaite où les frontières s\'effacent. Découvrez des créations olfactives magistrales qui transcendent le genre et épousent chaque peau différemment.',
    heroImage: 'https://images.pexels.com/photos/965989/pexels-photo-965989.jpeg?auto=compress&cs=tinysrgb&w=2000',
  },
] as const;

export const BRANDS = [
  {
    key: 'valentino',
    label: 'Valentino',
    slug: 'valentino',
    tagline: 'L\'audace couture de la Maison romaine',
    description:
      'Depuis 1960, Valentino incarne l\'élégance couture et l\'esprit rebelle romain. Ses fragrances — Born in Roma, Voce Viva, Uomo — fusionnent tradition italienne et modernité provocante.',
    heroImage: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
    founded: 1960,
    origin: 'Rome, Italie',
  },
  {
    key: 'yves-saint-laurent',
    label: 'Yves Saint Laurent',
    slug: 'yves-saint-laurent',
    tagline: 'L\'esprit libre de la parfumerie parisienne',
    description:
      'Yves Saint Laurent révolutionne la mode et la beauté depuis 1961. Ses parfums — Libre, Black Opium, MYSLF — libèrent une audace, une sensualité et une modernité inégalées.',
    heroImage: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
    founded: 1961,
    origin: 'Paris, France',
  },
  {
    key: 'armani',
    label: 'Giorgio Armani',
    slug: 'armani',
    tagline: 'L\'élégance intemporelle à l\'italienne',
    description:
      'Giorgio Armani définit l\'élégance italienne moderne depuis 1975. Sì, Acqua di Giò, Stronger With You, Code — ses fragrances sont devenues des classiques mondiaux, portés par des générations.',
    heroImage: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
    founded: 1975,
    origin: 'Milan, Italie',
  },
  {
    key: 'dolce-gabbana',
    label: 'Dolce & Gabbana',
    slug: 'dolce-gabbana',
    tagline: "L'esprit flamboyant de la Sicile",
    description: 'Dolce & Gabbana célèbre le glamour italien. Leurs créations olfactives expriment une passion méditerranéenne inégalée.',
    heroImage: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
    founded: 1985,
    origin: 'Milan, Italie',
  },
  {
    key: 'burberry',
    label: 'Burberry',
    slug: 'burberry',
    tagline: "L'élégance britannique intemporelle",
    description: "Burberry capture l'esprit de Londres. Des fragrances sophistiquées qui mêlent l'audace contemporaine à l'héritage anglais.",
    heroImage: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
    founded: 1856,
    origin: 'Londres, Royaume-Uni',
  },
  {
    key: 'prada',
    label: 'Prada',
    slug: 'prada',
    tagline: "L'avant-garde intellectuelle",
    description: 'Prada réinvente la parfumerie avec une approche intellectuelle et avant-gardiste. Des compositions inattendues, minimalistes et luxueuses.',
    heroImage: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
    founded: 1913,
    origin: 'Milan, Italie',
  }
] as const;

/* ============================================================
   HELPERS
   ============================================================ */

export const MOROCCAN_CITIES = [
  'Agadir', 'Ahfir', 'Al Hoceïma', 'Asilah', 'Azemmour', 'Azrou', 'Béni Mellal', 'Ben Slimane',
  'Berkane', 'Berrechid', 'Boujdour', 'Bouskoura', 'Casablanca', 'Chefchaouen', 'Dakhla', 'Dar Bouazza',
  'El Hajeb', 'El Jadida', 'Errachidia', 'Essaouira', 'Fès', 'Fnideq', 'Fquih Ben Salah', 'Guelmim',
  'Guercif', 'Ifrane', 'Inezgane', 'Kénitra', 'Khemisset', 'Khenifra', 'Khouribga', 'Ksar El Kebir',
  'Laâyoune', 'Larache', 'Marrakech', 'Martil', 'Mdiq', 'Meknès', 'Midelt', 'Mohammedia',
  'Nador', 'Ouarzazate', 'Ouazzane', 'Oujda', 'Rabat', 'Safi', 'Salé', 'Sefrou', 'Settat',
  'Sidi Bennour', 'Sidi Kacem', 'Sidi Slimane', 'Skhirat', 'Smara', 'Tanger', 'Tan-Tan', 'Taounate',
  'Taourirt', 'Tarfaya', 'Taroudant', 'Taza', 'Témara', 'Tétouan', 'Tinghir', 'Tiznit', 'Youssoufia', 'Zagora'
].sort();

export const getProductBySlug = (slug: string) =>
  PRODUCTS.find((p) => p.slug === slug);

export const getBrandBySlug = (slug: string) =>
  BRANDS.find((b) => b.slug === slug);

export const getCategoryBySlug = (slug: string) =>
  MAIN_CATEGORIES.find((c) => c.slug === slug);

/**
 * FEATURED PRODUCTS LOGIC for homepage.
 * We showcase 3 pillars: bestsellers, new arrivals, seasonal.
 */
export const getBestsellers = () =>
  PRODUCTS.filter((p) => p.tags.includes('bestseller')).slice(0, 8);

export const getNewArrivals = () =>
  [...PRODUCTS]
    .filter((p) => p.tags.includes('new-arrival'))
    .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())
    .slice(0, 4);

export const getSeasonalTrends = () => {
  // Simple month-based season detection
  const month = new Date().getMonth(); // 0-11
  const isFallWinter = month >= 8 || month <= 1; // Sep-Feb
  const tag = isFallWinter ? 'seasonal-fall' : 'seasonal-spring';
  return PRODUCTS.filter((p) => p.tags.includes(tag)).slice(0, 4);
};

export const getProductsByBrand = (brand: Brand) =>
  PRODUCTS.filter((p) => p.brand === brand);

export const getProductsByGender = (gender: Gender) =>
  PRODUCTS.filter((p) => p.gender === gender);

export const getProductsBySubcategory = (gender: Gender, subcategory: Subcategory) =>
  PRODUCTS.filter((p) => p.gender === gender && p.subcategory === subcategory);

/**
 * Format price in MAD (Moroccan Dirham)
 */
export const formatMAD = (amount: number): string =>
  `${amount.toLocaleString('fr-MA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} MAD`;
