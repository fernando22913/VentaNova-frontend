import type {
  ProductPlatform,
  ProductType,
  PublicProduct,
  PublicProductDetail,
} from './catalog.model';

export type OrderStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pendiente',
  PAID: 'Pagado',
  FAILED: 'Rechazado',
  CANCELLED: 'Cancelado',
};

export function orderStatusClass(status: OrderStatus): string {
  switch (status) {
    case 'PAID':
      return 'border-emerald-700/60 bg-emerald-950/50 text-emerald-300';
    case 'FAILED':
      return 'border-red-800/60 bg-red-950/50 text-red-300';
    case 'CANCELLED':
      return 'border-ink-700 bg-ink-800 text-mist';
    default:
      return 'border-amber-800/60 bg-amber-950/50 text-amber-300';
  }
}

export interface PublicOrderItem {
  productId: string;
  titleSnapshot: string;
  unitPriceCents: number;
  quantity: number;
}

export interface PublicOrder {
  id: string;
  status: OrderStatus;
  totalCents: number;
  createdAt: string;
  paidAt: string | null;
  items: PublicOrderItem[];
}

/** Admin order view — adds the owning user id. */
export interface AdminOrder extends PublicOrder {
  userId: string;
}

export interface GrantedEntitlement {
  id: string;
  licenseKey: string;
  productId: string;
  grantedAt: string;
}

export interface PayResult {
  order: PublicOrder;
  entitlements: GrantedEntitlement[];
}

export interface LibraryItem {
  entitlementId: string;
  licenseKey: string;
  grantedAt: string;
  product: PublicProductDetail;
}

export interface CardDetails {
  cardName: string;
  cardNumber: string;
  expiry: string;
  cvc: string;
}

/** A line in the client-side cart — a product snapshot + quantity. */
export interface CartItem {
  productId: string;
  slug: string;
  title: string;
  priceCents: number;
  coverImageUrl: string | null;
  platform: ProductPlatform;
  type: ProductType;
  quantity: number;
}

export function toCartItem(product: PublicProduct): Omit<CartItem, 'quantity'> {
  return {
    productId: product.id,
    slug: product.slug,
    title: product.title,
    priceCents: product.priceCents,
    coverImageUrl: product.coverImageUrl,
    platform: product.platform,
    type: product.type,
  };
}
