/**
 * Agentic AI Types & Interfaces for NAY Fragrance Concierge
 * Sprint 42 Architecture
 */

export type CustomerIntentType =
  | 'A_IDENTIFICATION'
  | 'B_EXPERTISE_RESEARCH'
  | 'C_RECOMMENDATIONS'
  | 'D_AVAILABILITY_PRICING'
  | 'E_SUPPORT_POLICIES'
  | 'F_ORDER_TRACKING'
  | 'G_PURCHASE_GUIDANCE'
  | 'H_HUMAN_ESCALATION'
  | 'I_GENERAL_CONVERSATION';

export type KnowledgeSourceTier =
  | 'SOURCE_1_NAY_CATALOG'
  | 'SOURCE_2_VERIFIED_MANUFACTURER'
  | 'SOURCE_3_APPROVED_EXTERNAL'
  | 'SOURCE_4_GENERAL_PERFUMERY'
  | 'SOURCE_5_UNCERTAIN_OR_MISSING';

export interface SourceMetadata {
  sourceName: string;
  sourceTier: KnowledgeSourceTier;
  sourceUrl?: string;
  fragranceIdentity: string;
  dateChecked: string;
  informationCategory: 'olfactory_pyramid' | 'commercial_specs' | 'formulation' | 'historical' | 'policy';
  evidenceStatus: 'verified_authoritative' | 'curated_manufacturer' | 'adapter_disabled' | 'general_domain' | 'uncertain';
  confidenceRationale: string;
}

export interface NotePyramid {
  top: string[];
  heart: string[];
  base: string[];
}

export interface VerifiedFragranceProfile {
  id: string;
  brand: string;
  name: string;
  flanker?: string;
  concentration: string; // EDT, EDP, Parfum, Extrait, Elixir
  family: string;
  pyramid: NotePyramid;
  perfumer?: string;
  releaseYear?: number;
  officialDescription: string;
  inNayCatalog: boolean;
  naySlug?: string;
  nayPrice?: number;
  inStock?: boolean;
  sourceMetadata: SourceMetadata;
}

export interface ExternalAdapterStatus {
  providerName: string;
  isLicensed: boolean;
  isEnabled: boolean;
  reason: string;
  termsOfServiceNotice: string;
}

export interface AgentToolCall {
  toolName: string;
  args: Record<string, any>;
}

export interface AgentToolResult<T = any> {
  toolName: string;
  success: boolean;
  data?: T;
  error?: string;
  sourceMetadata?: SourceMetadata;
  executionTimeMs: number;
}

export interface PrivacyCheckResult {
  isSafe: boolean;
  violationType?: 'PII_LEAK' | 'ORDER_UNVERIFIED' | 'REFUND_REQUEST' | 'PRICE_MODIFICATION';
  safeMessage?: string;
  escalationRequired?: boolean;
  escalationLink?: string;
}
