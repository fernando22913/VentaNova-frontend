// Tipos de dominio del catálogo compartidos, copiados a mano de los DTO de la API.

export type ProductType = 'GAME' | 'SOFTWARE' | 'DLC' | 'ASSET';
export type ProductPlatform = 'WINDOWS' | 'MAC' | 'LINUX' | 'WEB' | 'CROSS';
export type ProductSort = 'newest' | 'price_asc' | 'price_desc' | 'title';
export type ProductStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  DRAFT: 'Borrador',
  PUBLISHED: 'Publicado',
  ARCHIVED: 'Archivado',
};

export function productStatusClass(status: ProductStatus): string {
  switch (status) {
    case 'PUBLISHED':
      return 'border-emerald-700/60 bg-emerald-950/50 text-emerald-300';
    case 'ARCHIVED':
      return 'border-ink-700 bg-ink-800 text-mist';
    default:
      return 'border-amber-800/60 bg-amber-950/50 text-amber-300';
  }
}

export const PRODUCT_PLATFORMS: readonly ProductPlatform[] = [
  'WINDOWS',
  'MAC',
  'LINUX',
  'WEB',
  'CROSS',
];
export const PRODUCT_TYPES: readonly ProductType[] = ['GAME', 'SOFTWARE', 'DLC', 'ASSET'];
export const PRODUCT_SORTS: readonly ProductSort[] = ['newest', 'price_asc', 'price_desc', 'title'];

export const PRODUCT_PLATFORM_LABELS: Record<ProductPlatform, string> = {
  WINDOWS: 'Windows',
  MAC: 'macOS',
  LINUX: 'Linux',
  WEB: 'Web',
  CROSS: 'Multiplataforma',
};

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  GAME: 'Videojuego',
  SOFTWARE: 'Software',
  DLC: 'DLC',
  ASSET: 'Activo digital',
};

export interface Category {
  id: string;
  slug: string;
  name: string;
}

// Forma del producto público (lista del catálogo, sin description/assetUrl).
export interface PublicProduct {
  id: string;
  slug: string;
  title: string;
  summary: string;
  type: ProductType;
  platform: ProductPlatform;
  categoryId: string;
  priceCents: number;
  coverImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

// El detalle amplía la forma de la lista con la descripción completa y la URL de descarga.
export interface PublicProductDetail extends PublicProduct {
  description: string;
  assetUrl: string;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

// Criterios de búsqueda del catálogo para `GET /products`; los precios son dólares enviados en céntimos.
export interface ProductQuery {
  search?: string;
  category?: string;
  platform?: ProductPlatform;
  minPrice?: string;
  maxPrice?: string;
  sort: ProductSort;
  page: number;
  pageSize: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: { path: string; message: string }[];
}
