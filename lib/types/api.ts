/** Request and response shapes for NoQ API routes. */

import type {
  MenuItem,
  Order,
  OrderStatus,
  SlotAvailability,
  WalletTransaction,
} from "@/lib/types/database";

/** GET /api/menu */
export type GetMenuResponse = { items: MenuItem[] };

/** POST /api/orders */
export type CreateOrderLine = { menu_item_id: string; quantity: number };
export type CreateOrderRequest = {
  items: CreateOrderLine[];
  notes?: string;
  scheduled_for?: string;
};
export type CreateOrderResponse = {
  order_id: string;
  token_number: number | null;
  token_label: string | null;
  scheduled_for: string | null;
  status: string;
};

/** GET /api/orders/active */
export type GetActiveOrdersResponse = { orders: Order[] };

/** GET /api/orders/history */
export type GetOrderHistoryResponse = {
  orders: Order[];
  next_cursor: string | null;
};

/** GET /api/wallet/balance */
export type GetWalletBalanceResponse = { balance: number };

/** POST /api/wallet/initiate-topup */
export type InitiateTopupRequest = { amount_paise: number };
export type InitiateTopupResponse = {
  razorpay_order_id: string;
  amount_paise: number;
  currency: string;
};

/** POST /api/wallet/verify-payment */
export type VerifyPaymentRequest = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};
export type VerifyPaymentResponse = { balance_after: number };

/** GET /api/wallet/transactions */
export type GetWalletTransactionsResponse = {
  transactions: WalletTransaction[];
};

/** GET /api/admin/orders */
export type ListAdminOrdersQuery = {
  status?: OrderStatus;
  limit?: number;
  offset?: number;
};
export type ListAdminOrdersResponse = { orders: Order[] };

/** PATCH /api/admin/orders/[id]/status */
export type UpdateOrderStatusRequest = { status: OrderStatus };
export type UpdateOrderStatusResponse = { order: Order };

/** GET /api/admin/menu */
export type ListAdminMenuResponse = { items: MenuItem[] };

/** POST /api/admin/menu */
export type CreateAdminMenuItemRequest = {
  name: string;
  description: string;
  price: number;
  category_id: string;
  image_url?: string | null;
  is_available?: boolean;
};
export type CreateAdminMenuItemResponse = { item: MenuItem };

/** PATCH/DELETE /api/admin/menu/[id] — PATCH body */
export type UpdateAdminMenuItemRequest = Partial<CreateAdminMenuItemRequest>;
export type UpdateAdminMenuItemResponse = { item: MenuItem };
export type DeleteAdminMenuItemResponse = { deleted: true };

/** POST /api/admin/menu/upload */
export type UploadMenuImageRequest = { filename: string; content_type: string };
export type UploadMenuImageResponse = { upload_url: string; public_url: string };

/** GET /api/slots?date=YYYY-MM-DD */
export type GetSlotsResponse = { slots: SlotAvailability[] };

/** POST /api/admin/slots/activate */
export type ActivateSlotRequest = { slot_datetime: string };
export type ActivateSlotResponse = { activated: number };

/** GET /auth/callback — OAuth / PKCE exchange (see `app/auth/callback/route.ts`). */
export type AuthCallbackSearchParams = {
  code?: string;
  next?: string;
};
