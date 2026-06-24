export interface Customer {
  id: string;
  name: string;
  phone: string;
  flat_number?: string;
  society_name?: string;
  address?: string;
  email?: string;
  shop_id: string;
  created_at: string;
}

export interface Service {
  id: string;
  name: string;
  parent_id?: string;
  price?: number;
  is_active: boolean;
  shop_id: string;
  children?: Service[];
}

export interface EntryItem {
  id?: string;
  service_id: string;
  service_name: string;
  price_per_unit: number;
  quantity: number;
  subtotal: number;
  item_status?: string;
}

export interface LaundryEntry {
  id: string;
  customer_id: string;
  customer?: Customer;
  entry_date: string;
  total_amount: number;
  delivery_status: string;
  notes?: string;
  delivery_date?: string;
  shop_id: string;
  created_at: string;
  items?: EntryItem[];
}

export interface Labour {
  id: string;
  name: string;
  is_active: boolean;
  shop_id: string;
  created_at: string;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  description?: string;
  amount: number;
  shop_id: string;
  created_at: string;
}
