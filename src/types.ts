export type StageId = "harvest" | "dry" | "store" | "sell";

export type RiskLevel = "low" | "medium" | "high" | "ready";

export type FarmProfile = {
  id: string;
  farmName: string;
  onboardingCompleted: boolean;
  farmerName: string;
  region: string;
  district: string;
  farmAddress: string;
  farmLatitude: number | null;
  farmLongitude: number | null;
  farmLocationSource: "current" | "manual" | "map" | "unset";
  variety: string;
  plantingDate: string;
  farmSizeAcres: string;
  expectedBags: string;
  currentStage: StageId;
  storageMethod: string;
  preferredMarket: string;
};

export type StageCheck = {
  farmId: string;
  stage: StageId;
  answers: Record<string, boolean | string>;
  savedAt: string;
};

export type Recommendation = {
  level: RiskLevel;
  title: string;
  summary: string;
  reason: string;
  actions: string[];
  score: number;
  maxScore: number;
  positiveFactors: string[];
  riskFactors: string[];
  evidenceNote: string;
};

export type RecommendationRecord = Recommendation & {
  id: string;
  farmId: string;
  stage: StageId;
  answers: Record<string, boolean | string>;
  savedAt: string;
  completedActions: boolean[];
};

export type ActionReminder = {
  id: string;
  farmId: string;
  recordId: string;
  actionIndex: number;
  action: string;
  stage: StageId;
  scheduledFor: string;
  notificationId: string;
  createdAt: string;
};

export type MarketPrice = {
  id: string;
  marketId?: string;
  market: string;
  region: string;
  district?: string;
  latitude?: number | null;
  longitude?: number | null;
  pricePerBag: number;
  trend: "rising" | "stable" | "falling";
  distanceHint: string;
  lastUpdated: string;
  source?: string;
  history?: Array<{
    id: string;
    price: number;
    observedAt: string;
    source: string;
  }>;
};

export type MarketSyncStatus = "idle" | "syncing" | "success" | "error";

export type ProduceListing = {
  id: string;
  farmId: string;
  quantityBags: string;
  location: string;
  quality: string;
  expectedPrice: string;
  phone: string;
  createdAt: string;
  status: "draft" | "active" | "sold";
};

export type MarketDecision = {
  level: RiskLevel;
  title: string;
  summary: string;
  reason: string;
  bestMarket: MarketPrice;
  netPricePerBag: number;
  projectedHoldPrice: number;
  expectedGainPerBag: number;
  actions: string[];
};
