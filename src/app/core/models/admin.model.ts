import type { ProductPlatform, ProductType, PublicProductDetail } from './catalog.model';
import type { UserRole } from './auth.model';

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

// Payload de POST /admin/users para crear cuentas de staff.
export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
  role: UserRole;
}

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  CUSTOMER: 'Cliente',
  WORKER: 'Trabajador',
  ADMIN: 'Administrador',
};
