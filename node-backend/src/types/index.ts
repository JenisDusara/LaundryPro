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
  billing_type: "per_order" | "monthly";
  created_at: string;
}

export interface Service {
  id: string;
  name: string;
  parent_id: string | null;
  price: number | null;
  category?: string | null;
  is_active: boolean;
  children: Service[];
}

export interface EntryItem {
  id: string;
  service_name: string;
  price_per_unit: number;
  quantity: number;
  delivered_qty?: number; // how many of `quantity` handed over (partial delivery)
  subtotal: number;
  item_status: string;
}

export interface LaundryEntry {
  id: string;
  customer_id: string;
  entry_date: string;
  delivery_date: string | null;
  total_amount: number;       // grand total the customer owes = items − discount + extra_charge
  invoice_no?: number | null; // per-shop running bill number (starts at 1)
  discount?: number;
  extra_charge?: number;
  amount_paid?: number;       // collected at billing
  payment_method?: string;    // cash | upi | online | later | ""
  delivery_status: string;
  tag_status?: "collected" | "in_process" | "ready" | "delivered" | "issue" | string;
  notes: string;
  items: EntryItem[];
  customer: Customer | null;
  created_at: string;
}

export type PaymentMethod = "cash" | "upi" | "card" | "other";

export interface Payment {
  id: string;
  customer_id: string;
  customer_name: string;
  amount: number;
  method: PaymentMethod;
  date: string;
  note: string;
  created_at: string;
}

// Per-customer running balance. outstanding > 0 = customer owes (udhaar);
// outstanding < 0 = customer has an advance/credit that auto-adjusts against future bills.
export interface CustomerBalance {
  customer_id: string;
  billed: number;
  paid: number;
  outstanding: number;
}
