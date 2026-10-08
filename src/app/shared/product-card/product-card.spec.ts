import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import type { PublicProduct } from '../../core/models/catalog.model';
import { ProductCardComponent } from './product-card';

const product: PublicProduct = {
  id: 'p-1',
  slug: 'neo-tokyo-racer',
  title: 'Neo Tokyo Racer',
  summary: 'Cyberpunk street racing.',
  type: 'GAME',
  platform: 'CROSS',
  categoryId: 'c-1',
  priceCents: 3999,
  coverImageUrl: null,
  createdAt: '2026-10-06T00:00:00.000Z',
  updatedAt: '2026-10-06T00:00:00.000Z',
};

describe('ProductCardComponent', () => {
  let fixture: ComponentFixture<ProductCardComponent>;
  let component: ProductCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductCardComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('product', product);
    fixture.detectChanges();
  });

  it('renders the title, summary and formatted price', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Neo Tokyo Racer');
    expect(el.textContent).toContain('Cyberpunk street racing.');
    expect(el.textContent).toContain('$39.99');
  });

  it('emits the product through the @Output when Añadir is clicked', () => {
    let emitted: PublicProduct | undefined;
    component.addToCart.subscribe((value) => (emitted = value));

    const button = (fixture.nativeElement as HTMLElement).querySelector('button');
    expect(button?.textContent?.trim()).toBe('Añadir');
    button?.dispatchEvent(new Event('click'));

    expect(emitted).toBe(product);
  });

  it('links to the product detail route', () => {
    const link = (fixture.nativeElement as HTMLElement).querySelector('a');
    expect(link?.getAttribute('href')).toBe('/catalog/neo-tokyo-racer');
  });
});
