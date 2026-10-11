import { Injectable, signal } from '@angular/core';

import { PRODUCTOS } from '../data/productos.data';
import {
  CATEGORIAS_VENTANOVA,
  type CategoriaVentaNova,
  type Producto,
} from '../models/producto.model';

/**
 * Fuente de datos del catálogo semilla local. Los componentes obtienen los
 * recursos comerciales a través de este servicio y nunca importan el archivo
 * de datos directamente.
 */
@Injectable({ providedIn: 'root' })
export class ProductosService {
  private readonly productosSignal = signal<readonly Producto[]>(PRODUCTOS);

  /** Recursos comerciales en orden de catálogo. */
  readonly productos = this.productosSignal.asReadonly();

  getTodos(): readonly Producto[] {
    return this.productos();
  }

  getDestacados(): readonly Producto[] {
    return this.productos().filter((producto) => producto.destacado);
  }

  getCategorias(): readonly CategoriaVentaNova[] {
    return CATEGORIAS_VENTANOVA;
  }

  getPorCategoria(categoria: CategoriaVentaNova): readonly Producto[] {
    return this.productos().filter((producto) => producto.categoria === categoria);
  }
}
