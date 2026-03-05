export interface Admin {
  id: string;
  username: string;
  name: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  flat_number: string;
  society_name: string;
  address: string;
  email: string | null;
  created_at: string;
}

export interface Service {
  id: string;
  name: string;
  parent_id: string | null;
  price: number | null;
  is_active: boolean;
  children: Service[];
}

export interface EntryItem {
  id: string;
  service_name: string;
  price_per_unit: number;
  quantity: number;
  subtotal: number;
  item_status: string;
}

export interface LaundryEntry {
  id: string;
  customer_id: string;
  entry_date: string;
  total_amount: number;
  delivery_status: string;
  notes: string;
  items: EntryItem[];
  customer: Customer | null;
  created_at: string;
}