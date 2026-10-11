import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { TrendsService } from '../../core/services/trends.service';
import type { BestSeller, TrendPoint, TrendReport } from '../../core/models/trends.model';
import { MoneyPipe } from '../../shared/money.pipe';
import { StatePanelComponent } from '../../shared/state-panel/state-panel';

const MONTHS = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
] as const;

interface StatCard {
  label: string;
  value: string;
}

@Component({
  selector: 'app-tendencias',
  templateUrl: './tendencias.html',
  imports: [MoneyPipe, StatePanelComponent, RouterLink],
})
export class TendenciasComponent {
  private readonly trends = inject(TrendsService);
  private readonly router = inject(Router);

  protected readonly report = signal<TrendReport | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly hasData = computed(() => {
    const report = this.report();
    return report !== null && report.totals.paidOrders > 0;
  });

  protected readonly statCards = computed<StatCard[]>(() => {
    const report = this.report();
    if (!report) return [];
    const totals = report.totals;
    return [
      { label: 'Ingresos', value: formatMoney(totals.revenueCents) },
      { label: 'Pedidos pagados', value: String(totals.paidOrders) },
      { label: 'Unidades vendidas', value: String(totals.unitsSold) },
      { label: 'Ticket medio', value: formatMoney(totals.averageOrderCents) },
    ];
  });

  private readonly maxDayRevenue = computed(() => {
    const sales = this.report()?.sales ?? [];
    return Math.max(1, ...sales.map((point) => point.revenueCents));
  });

  private readonly maxSellerUnits = computed(() => {
    const sellers = this.report()?.bestSellers ?? [];
    return Math.max(1, ...sellers.map((seller) => seller.unitsSold));
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.trends.getTrends().subscribe({
      next: (report) => {
        this.report.set(report);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las tendencias. Inténtalo de nuevo.');
        this.loading.set(false);
      },
    });
  }

  protected goToCatalog(): void {
    void this.router.navigateByUrl('/catalog');
  }

  /** Height of a daily bar as a % of the tallest day. */
  protected barHeight(cents: number): string {
    return `${Math.round((cents / this.maxDayRevenue()) * 100)}%`;
  }

  protected sellerWidth(units: number): string {
    return `${Math.round((units / this.maxSellerUnits()) * 100)}%`;
  }

  /** Localized short label for a UTC `yyyy-mm-dd` key, e.g. "12 sep". */
  protected dayLabel(date: string): string {
    const [, month, day] = date.split('-');
    const monthIndex = Number(month) - 1;
    return `${Number(day)} ${MONTHS[monthIndex] ?? ''}`.trim();
  }

  protected dayNumber(date: string): string {
    return date.slice(8);
  }

  protected barTooltip(point: TrendPoint): string {
    return `${this.dayLabel(point.date)}: ${formatMoney(point.revenueCents)} · ${point.units} unidades`;
  }

  protected sellerLabel(seller: BestSeller): string {
    return `${seller.title} · ${seller.unitsSold} unidades · ${formatMoney(seller.revenueCents)}`;
  }
}

function formatMoney(cents: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}