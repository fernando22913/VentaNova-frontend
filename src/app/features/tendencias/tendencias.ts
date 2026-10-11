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
  caption: string;
  icon: 'revenue' | 'orders' | 'units' | 'ticket';
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

  // Interacción: ventana temporal del gráfico (7, 14 o 30 días).
  protected readonly rangeOptions = [7, 14, 30] as const;
  protected readonly rangeDays = signal(30);

  protected readonly hasData = computed(() => {
    const report = this.report();
    return report !== null && report.totals.paidOrders > 0;
  });

  protected readonly statCards = computed<StatCard[]>(() => {
    const report = this.report();
    if (!report) return [];
    const totals = report.totals;
    return [
      {
        label: 'Ingresos',
        value: formatMoney(totals.revenueCents),
        caption: 'Total histórico',
        icon: 'revenue',
      },
      {
        label: 'Pedidos pagados',
        value: String(totals.paidOrders),
        caption: 'Órdenes confirmadas',
        icon: 'orders',
      },
      {
        label: 'Unidades vendidas',
        value: String(totals.unitsSold),
        caption: 'Licencias entregadas',
        icon: 'units',
      },
      {
        label: 'Ticket medio',
        value: formatMoney(totals.averageOrderCents),
        caption: 'Valor por pedido',
        icon: 'ticket',
      },
    ];
  });

  // Serie recortada a la ventana seleccionada (computed).
  protected readonly visibleSales = computed<TrendPoint[]>(() => {
    const sales = this.report()?.sales ?? [];
    return sales.slice(Math.max(0, sales.length - this.rangeDays()));
  });

  private readonly maxDayRevenue = computed(() =>
    Math.max(1, ...this.visibleSales().map((point) => point.revenueCents)),
  );

  private readonly maxSellerUnits = computed(() =>
    Math.max(1, ...(this.report()?.bestSellers ?? []).map((seller) => seller.unitsSold)),
  );

  // Día de mayor ingreso dentro de la ventana.
  protected readonly bestDayLabel = computed(() => {
    const day = this.bestDay();
    return day && day.revenueCents > 0 ? this.dayLabel(day.date) : '—';
  });

  protected readonly bestDayRevenue = computed(() => this.bestDay()?.revenueCents ?? 0);

  protected readonly rangeRevenue = computed(() =>
    this.visibleSales().reduce((sum, point) => sum + point.revenueCents, 0),
  );

  protected readonly rangeUnits = computed(() =>
    this.visibleSales().reduce((sum, point) => sum + point.units, 0),
  );

  protected readonly rangeAverageRevenue = computed(() => {
    const days = this.visibleSales().length;
    return days === 0 ? 0 : Math.round(this.rangeRevenue() / days);
  });

  protected readonly topSellerShare = computed(() => {
    const report = this.report();
    const top = report?.bestSellers[0];
    if (!report || !top || report.totals.revenueCents === 0) return 0;
    return Math.round((top.revenueCents / report.totals.revenueCents) * 100);
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

  protected setRange(days: number): void {
    this.rangeDays.set(days);
  }

  protected goToCatalog(): void {
    void this.router.navigateByUrl('/catalog');
  }

  // Altura de una barra diaria en % del día más alto de la ventana.
  protected barHeight(cents: number): string {
    return `${Math.round((cents / this.maxDayRevenue()) * 100)}%`;
  }

  protected sellerWidth(units: number): string {
    return `${Math.round((units / this.maxSellerUnits()) * 100)}%`;
  }

  // Clases del medallón de ranking (top 3 destacados).
  protected rankClass(index: number): string {
    switch (index) {
      case 0:
        return 'border-acid-400/60 bg-acid-400/15 text-acid-300';
      case 1:
        return 'border-cream/25 bg-cream/10 text-cream';
      case 2:
        return 'border-coral-400/50 bg-coral-500/15 text-coral-400';
      default:
        return 'border-ink-700 bg-ink-850 text-ink-500';
    }
  }

  // Muestra ~6 marcas del eje para no saturar con 30 columnas.
  protected showTick(index: number, total: number): boolean {
    if (total <= 14) return true;
    return index % 5 === 0 || index === total - 1;
  }

  // Etiqueta corta localizada para una clave UTC yyyy-mm-dd, p. ej. "12 sep".
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

  private bestDay(): TrendPoint | null {
    let best: TrendPoint | null = null;
    for (const point of this.visibleSales()) {
      if (best === null || point.revenueCents > best.revenueCents) best = point;
    }
    return best;
  }
}

function formatMoney(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
