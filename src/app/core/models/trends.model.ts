// Estadísticas de ventas agregadas replicadas desde GET /api/v1/trends.
export interface TrendTotals {
  revenueCents: number;
  paidOrders: number;
  unitsSold: number;
  averageOrderCents: number;
}

// Un día de la serie de ventas de los últimos 30 días (UTC, yyyy-mm-dd).
export interface TrendPoint {
  date: string;
  revenueCents: number;
  units: number;
}

// Producto más vendido, ordenado por unidades vendidas.
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