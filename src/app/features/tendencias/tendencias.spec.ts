import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { provideRouter } from '@angular/router';

import { TrendsService } from '../../core/services/trends.service';
import type { TrendReport } from '../../core/models/trends.model';
import { TendenciasComponent } from './tendencias';

interface TrendsSurface {
  load(): void;
}

function series(overrides: Partial<TrendReport['sales'][number]> = {}): TrendReport['sales'] {
  return Array.from({ length: 30 }, (_, i) => ({
    date: `2026-09-${String(i + 1).padStart(2, '0')}`,
    revenueCents: 0,
    units: 0,
    ...overrides,
  }));
}

const populatedReport: TrendReport = {
  totals: { revenueCents: 44980, paidOrders: 12, unitsSold: 31, averageOrderCents: 3748 },
  sales: series({ revenueCents: 44980, units: 31 }),
  bestSellers: [{ slug: 'neo-tokyo-racer', title: 'Neo Tokyo Racer', unitsSold: 8, revenueCents: 31992 }],
};

const emptyReport: TrendReport = {
  totals: { revenueCents: 0, paidOrders: 0, unitsSold: 0, averageOrderCents: 0 },
  sales: series(),
  bestSellers: [],
};

describe('TendenciasComponent', () => {
  let fixture: ComponentFixture<TendenciasComponent>;
  let view: TrendsSurface;
  let getTrends: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    getTrends = vi.fn().mockReturnValue(of(populatedReport));
    await TestBed.configureTestingModule({
      imports: [TendenciasComponent],
      providers: [provideRouter([]), { provide: TrendsService, useValue: { getTrends } }],
    }).compileComponents();
  });

  it('renders the summary stat cards from the report', () => {
    fixture = TestBed.createComponent(TendenciasComponent);
    view = fixture.componentInstance as unknown as TrendsSurface;
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Pedidos pagados');
    expect(el.textContent).toContain('Unidades vendidas');
    expect(el.textContent).toContain('Ticket medio');
  });

  it('renders the 30-day chart and the best-sellers list', () => {
    fixture = TestBed.createComponent(TendenciasComponent);
    view = fixture.componentInstance as unknown as TrendsSurface;
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Ventas · últimos 30 días');
    expect(el.textContent).toContain('Los más vendidos');
    expect(el.textContent).toContain('Neo Tokyo Racer');
    expect(el.textContent).toContain('8 uds');
  });

  it('shows the insufficient-data state when there are no paid orders', () => {
    getTrends.mockReturnValue(of(emptyReport));
    fixture = TestBed.createComponent(TendenciasComponent);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Todavía no hay suficientes datos',
    );
  });

  it('shows an error state when the request fails', () => {
    getTrends.mockReturnValue(throwError(() => new Error('boom')));
    fixture = TestBed.createComponent(TendenciasComponent);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'No pudimos cargar las tendencias',
    );
  });

  it('recovers via the retry action after an error', () => {
    getTrends.mockReturnValue(throwError(() => new Error('boom')));
    fixture = TestBed.createComponent(TendenciasComponent);
    view = fixture.componentInstance as unknown as TrendsSurface;
    fixture.detectChanges();

    getTrends.mockReturnValue(of(populatedReport));
    view.load();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Los más vendidos');
  });
});