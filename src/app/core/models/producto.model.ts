import type { ProductPlatform, ProductType, PublicProduct } from './catalog.model';

/**
 * Categorías comerciales de VentaNova. Se mantienen en español porque son
 * texto visible para el cliente (la API usa slugs en inglés).
 */
export type CategoriaVentaNova =
  | 'Videojuegos'
  | 'Software'
  | 'DLC y expansiones'
  | 'Recursos digitales';

export const CATEGORIAS_VENTANOVA: readonly CategoriaVentaNova[] = [
  'Videojuegos',
  'Software',
  'DLC y expansiones',
  'Recursos digitales',
];

/**
 * Recurso comercial del catálogo semilla local. Es el modelo principal del
 * negocio usado por la portada y por el servicio de datos.
 */
export interface Producto {
  id: string;
  slug: string;
  nombre: string;
  categoria: CategoriaVentaNova;
  descripcion: string;
  /** Precio de referencia en centavos (invariante del backend). */
  precioCents: number;
  tipo: ProductType;
  plataforma: ProductPlatform;
  imagenUrl: string | null;
  destacado: boolean;
  /** Popularidad relativa 0–100 usada por los indicadores de la portada. */
  tendencia: number;
}

/** Adapta un recurso local a la forma que consume `app-product-card`. */
export function toPublicProduct(producto: Producto): PublicProduct {
  return {
    id: producto.id,
    slug: producto.slug,
    title: producto.nombre,
    summary: producto.descripcion,
    type: producto.tipo,
    platform: producto.plataforma,
    categoryId: '',
    priceCents: producto.precioCents,
    coverImageUrl: producto.imagenUrl,
    createdAt: '',
    updatedAt: '',
  };
}
