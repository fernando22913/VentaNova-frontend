import type { ProductPlatform, ProductType, PublicProductDetail } from './catalog.model';

export type AdminProductStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface AdminProduct extends PublicProductDetail {
  status: AdminProductStatus;
}

export interface AdminProductInput {
  slug: string;
  title: string;
  summary: string;
  description: string;
  type: ProductType;
  platform: ProductPlatform;
  categoryId: string;
  priceCents: number;
  coverImageUrl: string | null;
  assetUrl: string;
  status: 'DRAFT' | 'PUBLISHED';
}

export type AdminProductUpdate = Partial<Omit<AdminProductInput, 'status'>>;

export interface AdminProductQuery {
  search?: string;
  status?: AdminProductStatus;
  platform?: ProductPlatform;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'title';
  page?: number;
  pageSize?: number;
}
