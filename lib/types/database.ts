/** Supabase public schema row types for NoQ. */

export type UserRole = "student" | "admin";

export type OrderStatus =
  | "scheduled"
  | "placed"
  | "preparing"
  | "ready"
  | "collected"
  | "cancelled";

export type WalletTransactionType = "topup" | "deduction" | "refund";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  wallet_balance: number;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  sort_order: number;
}
export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category_id: string;
  image_url: string | null;
  is_available: boolean;
  created_at?: string;
}
export interface Order {
  id: string;
  student_id: string;
  token_number: number | null;
  token_label: string | null;
  status: OrderStatus;
  total_amount: number;
  notes: string | null;
  scheduled_for: string | null;
  created_at: string;
  updated_at: string;
}

export interface TimeSlot {
  id: string;
  slot_time: string;
  capacity: number;
  is_active: boolean;
}

export interface SlotAvailability {
  slot_time: string;
  capacity: number;
  booked: number;
  available: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  item_name: string;
  item_price: number;
  quantity: number;
}

export interface WalletTransaction {
  id: string;
  student_id: string;
  type: WalletTransactionType;
  amount: number;
  balance_after: number;
  reference_id: string | null;
  description: string | null;
  created_at: string;
}

export interface DailyTokenCounter {
  date: string;
  last_token: number;
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          full_name: string;
          email: string;
          role: UserRole;
          wallet_balance?: number;
          created_at?: string;
        };
        Update: {
          full_name?: string;
          email?: string;
          role?: UserRole;
          wallet_balance?: number;
        };
        Relationships: [];
      };
      categories: {
        Row: Category;
        Insert: {
          id?: string;
          name: string;
          sort_order: number;
        };
        Update: {
          name?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      menu_items: {
        Row: MenuItem;
        Insert: {
          id?: string;
          name: string;
          description: string;
          price: number;
          category_id: string;
          image_url?: string | null;
          is_available?: boolean;
          created_at?: string;
        };
        Update: {
          name?: string;
          description?: string;
          price?: number;
          category_id?: string;
          image_url?: string | null;
          is_available?: boolean;
        };
        Relationships: [];
      };
      orders: {
        Row: Order;
        Insert: {
          id?: string;
          student_id: string;
          token_number?: number | null;
          token_label?: string | null;
          status: OrderStatus;
          total_amount: number;
          notes?: string | null;
          scheduled_for?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          student_id?: string;
          token_number?: number | null;
          token_label?: string | null;
          status?: OrderStatus;
          total_amount?: number;
          notes?: string | null;
          scheduled_for?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      time_slots: {
        Row: TimeSlot;
        Insert: {
          id?: string;
          slot_time: string;
          capacity?: number;
          is_active?: boolean;
        };
        Update: {
          slot_time?: string;
          capacity?: number;
          is_active?: boolean;
        };
        Relationships: [];
      };
      order_items: {
        Row: OrderItem;
        Insert: {
          id?: string;
          order_id: string;
          menu_item_id: string;
          item_name: string;
          item_price: number;
          quantity: number;
        };
        Update: {
          order_id?: string;
          menu_item_id?: string;
          item_name?: string;
          item_price?: number;
          quantity?: number;
        };
        Relationships: [];
      };
      wallet_transactions: {
        Row: WalletTransaction;
        Insert: {
          id?: string;
          student_id: string;
          type: WalletTransactionType;
          amount: number;
          balance_after: number;
          reference_id?: string | null;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          reference_id?: string | null;
          description?: string | null;
        };
        Relationships: [];
      };
      daily_token_counters: {
        Row: DailyTokenCounter;
        Insert: {
          date: string;
          last_token: number;
        };
        Update: {
          last_token?: number;
        };
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
};

export type TableRow<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TableInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TableUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];