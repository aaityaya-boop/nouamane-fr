/**
 * NAY SCENT MATCH — TypeScript Definitions
 */

export type GenderFilter = 'all' | 'men' | 'women' | 'unisex';

export type FragranceFamily =
  | 'all'
  | 'woody'
  | 'oriental'
  | 'floral'
  | 'fresh'
  | 'sweet'
  | 'spicy'
  | 'leather';

export type SeasonFilter = 'all' | 'Printemps' | 'Été' | 'Automne' | 'Hiver';

export type OccasionFilter = 'all' | 'daily' | 'evening' | 'work' | 'special';

export type PersonalityFilter = 'all' | 'fresh' | 'mysterious' | 'elegant' | 'gourmand' | 'bold';

export interface ScentMatchFilters {
  gender: GenderFilter;
  minPrice: number;
  maxPrice: number;
  family: FragranceFamily;
  season: SeasonFilter;
  occasion: OccasionFilter;
  personality: PersonalityFilter;
}

export interface QueueProduct {
  id: number;
  slug: string;
  name: string;
  brandLabel: string;
  brandId?: string;
  price: number;
  originalPrice?: number | null;
  images: string[];
  notes: {
    top: string[];
    heart: string[];
    base: string[];
  };
  subcategoryLabel: string;
  perfectSeason: string;
  inStock: boolean;
  gender: string;
  tagline?: string;
  description?: string;
  score?: number;
}

export type SwipeAction = 'LIKE' | 'PASS' | 'SAVE' | 'UNDO';

export interface ScentDNAScores {
  woody: number;      // 0 - 100
  oriental: number;   // 0 - 100
  floral: number;     // 0 - 100
  fresh: number;      // 0 - 100
  spicy: number;      // 0 - 100
  sweet: number;      // 0 - 100
}

export interface PersonalityArchetype {
  key: string;
  titleFr: string;
  titleAr: string;
  taglineFr: string;
  taglineAr: string;
  descriptionFr: string;
  descriptionAr: string;
  signatureNotes: string[];
  idealSeasons: string[];
  dominantDimension: keyof ScentDNAScores;
}

export interface MatchedPerfume {
  product: QueueProduct;
  matchScore: number; // 0 - 100 %
  commonNotes: string[];
  dominantFamily: string;
  explanationFr: string;
  explanationAr: string;
}

export interface ScentDNAAnalysisResult {
  sessionId: string;
  shareToken: string;
  personality: PersonalityArchetype;
  dnaScores: ScentDNAScores;
  favoriteNotes: string[];
  topMatches: MatchedPerfume[];
  totalLikes: number;
  totalPasses: number;
  totalSaves: number;
  completedAt: string;
}

export interface FriendSessionData {
  inviteCode: string;
  hostName: string;
  friendName?: string | null;
  status: 'WAITING_FRIEND' | 'BOTH_COMPLETED' | 'EXPIRED';
  compatibilityScore?: number | null;
  mutualLikedProducts: QueueProduct[];
  matchArchetype?: string | null;
  hostSessionId: string;
  friendSessionId?: string | null;
}
