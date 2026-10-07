export type PeriodType = 'today' | 'yesterday' | '7d' | '30d' | 'this_month' | '90d' | 'year' | 'all' | 'custom';
export type TabType =
  | 'visitors'
  | 'marketing_ai'
  | 'funnel'
  | 'sources'
  | 'geography'
  | 'perfumes'
  | 'devices'
  | 'pages'
  | 'livestream';

export interface TrafficSource {
  rawName: string;
  name: string;
  category: string;
  icon: string;
  views: number;
  visitors: number;
  share: number;
  orders: number;
  revenue: number;
  conversionRate: number;
  bounceRate: number;
}

export interface CityData {
  city: string;
  country: string;
  flag: string;
  visitors: number;
  share: number;
  orders: number;
  revenue: number;
}

export interface PageData {
  pathname: string;
  title: string;
  category: string;
  views: number;
  share: number;
}

export interface LiveEvent {
  id: number;
  createdAt: string;
  device: string;
  referrer: string;
  city: string;
  country: string;
  pathname: string;
  eventType: string;
  title: string;
  productName?: string;
}

export interface VisitorJourneyStep {
  step: number;
  pathname: string;
  title: string;
  category: string;
  createdAt: string;
  device: string;
  referrer: string;
}

export interface VisitorSession {
  id: string;
  ipHashShort: string;
  city: string;
  country: string;
  flag: string;
  device: string;
  referrer: string;
  rawReferrer: string;
  sourceCategory: string;
  landingPage: {
    pathname: string;
    title: string;
    category: string;
  };
  currentPage: {
    pathname: string;
    title: string;
    category: string;
  };
  firstSeen: string;
  lastSeen: string;
  isOnline: boolean;
  durationSeconds: number;
  durationFormatted: string;
  pageCount: number;
  journey: VisitorJourneyStep[];
  hasCart: boolean;
  hasCheckout: boolean;
  hasPurchased: boolean;
  cartValue: number;
  cartItemsCount: number;
  cartItems: any[];
  productsViewed: Array<{ name: string; slug: string; brand: string }>;
  customerName: string | null;
  customerPhone: string | null;
  status: 'ONLINE' | 'PURCHASED' | 'CHECKOUT' | 'CART' | 'BROWSING';
}

export interface ConversionFunnelStep {
  name: string;
  count: number;
  rate: number;
  dropOff: number;
  label: string;
  color: string;
}

export interface ConversionFunnelData {
  steps: ConversionFunnelStep[];
  cartAbandonmentRate: number;
  checkoutConversionRate: number;
}

export interface MarketingInsight {
  id: string;
  category: string;
  title: string;
  impact: 'HIGH' | 'MEDIUM' | 'GROWTH';
  description: string;
  recommendation: string;
  metric?: string;
  metricLabel?: string;
}

export interface OlfactoryData {
  name: string;
  revenue: number;
  units: number;
  share: number;
}

export interface GenderData {
  name: string;
  revenue: number;
  units: number;
  aov: number;
  orders: number;
}

export interface BottleSizeData {
  size: string;
  count: number;
}

export interface CrossSellingPair {
  pairName: string;
  itemA: string;
  itemB: string;
  count: number;
  revenue: number;
}

export interface PerfumeProductSale {
  slug: string;
  name: string;
  brandLabel: string;
  category: string;
  gender: string;
  image: string;
  unitsSold: number;
  revenue: number;
  orderCount: number;
  stock: number;
  inStock: boolean;
  price: number;
  viewsCount: number;
}

export interface PerfumeAnalytics {
  bestSellers: PerfumeProductSale[];
  olfactoryFamilies: OlfactoryData[];
  genderBreakdown: GenderData[];
  bottleSizes: BottleSizeData[];
  crossSellingPairs: CrossSellingPair[];
  lowStockAlerts: any[];
}

export interface AnalyticsData {
  period: {
    id: string;
    label: string;
    start: string;
    end: string;
  };
  kpi: {
    grossRevenue: number;
    deliveredRevenue: number;
    inTransitRevenue: number;
    lostRevenue: number;
    totalOrders: number;
    deliveredOrders: number;
    pendingOrders: number;
    refusedOrReturnedOrders: number;
    deliveryRate: number;
    aov: number;
    totalBottlesSold: number;
    uniqueCustomers: number;
    repeatCustomerRate: number;
    visitorsCount: number;
    pageViewsCount: number;
    activeVisitorsCount: number;
    conversionRate: number;
    pagesPerVisitor: number;
    avgDuration: string;
    bounceRate: number;
    deltas: {
      revenue: number;
      orders: number;
      aov: number;
      delivered: number;
      visitors: number;
    };
  };
  trafficAnalytics: {
    sources: TrafficSource[];
    cities: CityData[];
    topPages: PageData[];
    devices: Array<{ name: string; views: number; share: number }>;
    hourlyHeatmap: Array<{ hour: string; hourNum: number; orders: number; estViews: number }>;
    peakDays: Array<{ name: string; orders: number }>;
    liveStream: LiveEvent[];
    visitorSessions?: VisitorSession[];
  };
  funnel?: ConversionFunnelData;
  marketingInsights?: MarketingInsight[];
  perfumeAnalytics?: PerfumeAnalytics;
}
