import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import type { PublicProduct } from '../../core/models/catalog.model';
import type { CategoriaVentaNova } from '../../core/models/producto.model';
import { HomeComponent } from './home';

interface HomeSurface {
  intereses(): CategoriaVentaNova[];
  recomendaciones(): PublicProduct[];
  nivelExploracion(): number;
  toggleInteres(categoria: CategoriaVentaNova): void;
  limpiarIntereses(): void;
}

describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;
  let view: HomeSurface;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    view = fixture.componentInstance as unknown as HomeSurface;
    fixture.detectChanges();
  });

  it('starts with no interests and recommends the featured products', () => {
    expect(view.intereses()).toEqual([]);
    expect(view.nivelExploracion()).toBe(0);
    expect(view.recomendaciones().length).toBeGreaterThan(0);
    expect(view.recomendaciones().some((p) => p.title === 'Neo Tokyo Racer')).toBe(true);
  });

  it('derives recommendations and exploration level when interests change', () => {
    view.toggleInteres('Software');

    expect(view.intereses()).toEqual(['Software']);
    expect(view.nivelExploracion()).toBe(25);
    const titles = view.recomendaciones().map((p) => p.title);
    expect(titles).toContain('Harbur Desktop');
    expect(titles).not.toContain('Neo Tokyo Racer');
  });

  it('resets the recommendations when interests are cleared', () => {
    view.toggleInteres('Software');
    view.limpiarIntereses();

    expect(view.intereses()).toEqual([]);
    expect(view.recomendaciones().some((p) => p.title === 'Neo Tokyo Racer')).toBe(true);
  });
});
