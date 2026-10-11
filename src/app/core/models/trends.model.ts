/** Aggregated sales statistics mirrored from GET /api/v1/trends. */
export interface TrendTotals {
  revenueCents: number;
  paidOrders: number;
  unitsSold: number;
  averageOrderCents: number;
}

/** One day of the last-30-days sales series (UTC, yyyy-mm-dd). */
export interface TrendPoint {
  date: string;
  revenueCents: number;
  units: number;
}

/** A best-selling product, ranked by units sold. */
export interface BestSeller {
  slug: string;
  title: string;
  unitsSold: number;
  revenueCents: number;
}

export interface TrendReport {
  totals: TrendTotals;
  sales: TrendPoint[];
  bestSellers: BestSeller[];
}