import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ProductosService } from '../../core/services/productos.service';
import { ToastService } from '../../core/services/toast.service';
import { CartStore } from '../../core/stores/cart.store';
import {
  type CategoriaVentaNova,
  type Producto,
  toPublicProduct,
} from '../../core/models/producto.model';
import type { PublicProduct } from '../../core/models/catalog.model';
import { toCartItem } from '../../core/models/order.model';
import { ProductCardComponent } from '../../shared/product-card/product-card';

/**
 * Portada interactiva de VentaNova.
 *
 * Estado interactivo con `signal()`: las categorías que la persona marca como
 * de su interés. A partir de ellas, `computed()` deriva automáticamente las
 * recomendaciones y un indicador de exploración.
 */
@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  imports: [RouterLink, ProductCardComponent],
})
export class HomeComponent {
  private readonly productosService = inject(ProductosService);
  private readonly cart = inject(CartStore);
  private readonly toasts = inject(ToastService);

  protected readonly categorias = this.productosService.getCategorias();
  protected readonly destacados = this.productosService.getDestacados();

  /** Interacción 1 — signal(): categorías de interés marcadas por el visitante. */
  protected readonly intereses = signal<CategoriaVentaNova[]>([]);

  /** Interacción 2 — computed(): recomendaciones derivadas de los intereses. */
  protected readonly recomendaciones = computed<PublicProduct[]>(() => {
    const seleccion = this.intereses();
    const base: readonly Producto[] =
      seleccion.length > 0
        ? this.productosService
            .getTodos()
            .filter((producto) => seleccion.includes(producto.categoria))
        : this.productosService.getDestacados();
    return base.map(toPublicProduct);
  });

  protected readonly nivelExploracion = computed(() =>
    Math.round((this.intereses().length / this.categorias.length) * 100),
  );

  protected readonly esSeleccionada = (categoria: CategoriaVentaNova): boolean =>
    this.intereses().includes(categoria);

  protected toggleInteres(categoria: CategoriaVentaNova): void {
    this.intereses.update((actuales) =>
      actuales.includes(categoria)
        ? actuales.filter((item) => item !== categoria)
        : [...actuales, categoria],
    );
  }

  protected limpiarIntereses(): void {
    this.intereses.set([]);
  }

  protected onAddToCart(product: PublicProduct): void {
    this.cart.add(toCartItem(product));
    this.toasts.show(`"${product.title}" añadido al carrito`, 'success');
  }
}
