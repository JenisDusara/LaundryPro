// ─── Shared demo data used across all dashboard pages ───────────────────────

export const DEMO_CUSTOMERS = [
  { id: "c01", name: "Rajesh Sharma",  phone: "9876543210", flat_number: "402",  society_name: "Green Park Society",   address: "Sector 12, Ahmedabad", email: "" },
  { id: "c02", name: "Priya Patel",    phone: "9765432109", flat_number: "B-12", society_name: "Sunrise Apartments",   address: "Vastrapur, Ahmedabad", email: "" },
  { id: "c03", name: "Sunita Verma",   phone: "9988776655", flat_number: "304",  society_name: "Lotus Heights",        address: "Navrangpura, Ahmedabad", email: "" },
  { id: "c04", name: "Amit Joshi",     phone: "9654321098", flat_number: "A-5",  society_name: "Galaxy Society",       address: "Satellite, Ahmedabad", email: "" },
  { id: "c05", name: "Meena Gupta",    phone: "9543210987", flat_number: "101",  society_name: "Shanti Niwas",         address: "Bopal, Ahmedabad", email: "" },
  { id: "c06", name: "Vikram Singh",   phone: "9432109876", flat_number: "C-8",  society_name: "Royal Enclave",        address: "Thaltej, Ahmedabad", email: "" },
  { id: "c07", name: "Kavita Reddy",   phone: "9321098765", flat_number: "205",  society_name: "Sai Baba Colony",      address: "Gota, Ahmedabad", email: "" },
  { id: "c08", name: "Suresh Nair",    phone: "9210987654", flat_number: "508",  society_name: "Emerald Park",         address: "South Bopal, Ahmedabad", email: "" },
  { id: "c09", name: "Anjali Shah",    phone: "9109876543", flat_number: "12",   society_name: "Green Avenue",         address: "Prahlad Nagar, Ahmedabad", email: "" },
  { id: "c10", name: "Deepak Kumar",   phone: "9098765432", flat_number: "B-401",society_name: "Sunrise Tower",        address: "SG Highway, Ahmedabad", email: "" },
  { id: "c11", name: "Rekha Mishra",   phone: "9987654321", flat_number: "303",  society_name: "Vrindavan Society",    address: "Chandkheda, Ahmedabad", email: "" },
  { id: "c12", name: "Mohit Agarwal",  phone: "9876501234", flat_number: "A-201",society_name: "Silver Heights",       address: "Memnagar, Ahmedabad", email: "" },
];

export const DEMO_SERVICES = [
  {
    id: "s01", name: "Washing", parent_id: null, price: null,
    children: [
      { id: "s02", name: "Shirt",          parent_id: "s01", price: "30.00", children: [] },
      { id: "s03", name: "Trouser / Pant", parent_id: "s01", price: "35.00", children: [] },
      { id: "s04", name: "T-Shirt",        parent_id: "s01", price: "25.00", children: [] },
      { id: "s05", name: "Jeans",          parent_id: "s01", price: "40.00", children: [] },
      { id: "s06", name: "Saree",          parent_id: "s01", price: "60.00", children: [] },
      { id: "s07", name: "Salwar Kameez",  parent_id: "s01", price: "50.00", children: [] },
      { id: "s08", name: "Bedsheet",       parent_id: "s01", price: "80.00", children: [] },
    ],
  },
  {
    id: "s10", name: "Dry Cleaning", parent_id: null, price: null,
    children: [
      { id: "s11", name: "Suit (2 Piece)", parent_id: "s10", price: "300.00", children: [] },
      { id: "s12", name: "Blazer",         parent_id: "s10", price: "200.00", children: [] },
      { id: "s13", name: "Coat / Jacket",  parent_id: "s10", price: "180.00", children: [] },
      { id: "s14", name: "Saree",          parent_id: "s10", price: "150.00", children: [] },
      { id: "s15", name: "Sherwani",       parent_id: "s10", price: "350.00", children: [] },
    ],
  },
  {
    id: "s20", name: "Ironing / Press", parent_id: null, price: null,
    children: [
      { id: "s21", name: "Shirt",     parent_id: "s20", price: "15.00", children: [] },
      { id: "s22", name: "Trouser",   parent_id: "s20", price: "15.00", children: [] },
      { id: "s23", name: "Saree",     parent_id: "s20", price: "25.00", children: [] },
      { id: "s24", name: "Kurta",     parent_id: "s20", price: "20.00", children: [] },
      { id: "s25", name: "Bedsheet",  parent_id: "s20", price: "30.00", children: [] },
    ],
  },
];

// Flat list for forms / dropdowns
export const DEMO_SERVICES_FLAT = DEMO_SERVICES.flatMap(p => [p, ...(p.children || [])]);

export const DEMO_ENTRIES = [
  { id: "e01", entry_date: "2026-06-01", total_amount: "450",  delivery_status: "delivered", customer: { name: "Rajesh Sharma",  phone: "9876543210" } },
  { id: "e02", entry_date: "2026-06-02", total_amount: "280",  delivery_status: "delivered", customer: { name: "Priya Patel",    phone: "9765432109" } },
  { id: "e03", entry_date: "2026-06-03", total_amount: "900",  delivery_status: "delivered", customer: { name: "Sunita Verma",   phone: "9988776655" } },
  { id: "e04", entry_date: "2026-06-04", total_amount: "150",  delivery_status: "delivered", customer: { name: "Amit Joshi",     phone: "9654321098" } },
  { id: "e05", entry_date: "2026-06-05", total_amount: "620",  delivery_status: "delivered", customer: { name: "Meena Gupta",    phone: "9543210987" } },
  { id: "e06", entry_date: "2026-06-06", total_amount: "2100", delivery_status: "delivered", customer: { name: "Vikram Singh",   phone: "9432109876" } },
  { id: "e07", entry_date: "2026-06-07", total_amount: "340",  delivery_status: "delivered", customer: { name: "Kavita Reddy",   phone: "9321098765" } },
  { id: "e08", entry_date: "2026-06-08", total_amount: "480",  delivery_status: "delivered", customer: { name: "Suresh Nair",    phone: "9210987654" } },
  { id: "e09", entry_date: "2026-06-09", total_amount: "175",  delivery_status: "delivered", customer: { name: "Anjali Shah",    phone: "9109876543" } },
  { id: "e10", entry_date: "2026-06-10", total_amount: "560",  delivery_status: "delivered", customer: { name: "Deepak Kumar",   phone: "9098765432" } },
  { id: "e11", entry_date: "2026-06-11", total_amount: "280",  delivery_status: "delivered", customer: { name: "Rekha Mishra",   phone: "9987654321" } },
  { id: "e12", entry_date: "2026-06-12", total_amount: "420",  delivery_status: "delivered", customer: { name: "Mohit Agarwal",  phone: "9876501234" } },
  { id: "e13", entry_date: "2026-06-13", total_amount: "380",  delivery_status: "delivered", customer: { name: "Rajesh Sharma",  phone: "9876543210" } },
  { id: "e14", entry_date: "2026-06-14", total_amount: "540",  delivery_status: "delivered", customer: { name: "Priya Patel",    phone: "9765432109" } },
  { id: "e15", entry_date: "2026-06-15", total_amount: "750",  delivery_status: "delivered", customer: { name: "Sunita Verma",   phone: "9988776655" } },
  { id: "e16", entry_date: "2026-06-16", total_amount: "310",  delivery_status: "delivered", customer: { name: "Amit Joshi",     phone: "9654321098" } },
  { id: "e17", entry_date: "2026-06-17", total_amount: "490",  delivery_status: "delivered", customer: { name: "Meena Gupta",    phone: "9543210987" } },
  { id: "e18", entry_date: "2026-06-18", total_amount: "1800", delivery_status: "ready",     customer: { name: "Vikram Singh",   phone: "9432109876" } },
  { id: "e19", entry_date: "2026-06-19", total_amount: "260",  delivery_status: "ready",     customer: { name: "Kavita Reddy",   phone: "9321098765" } },
  { id: "e20", entry_date: "2026-06-20", total_amount: "380",  delivery_status: "pending",   customer: { name: "Suresh Nair",    phone: "9210987654" } },
  { id: "e21", entry_date: "2026-06-21", total_amount: "450",  delivery_status: "pending",   customer: { name: "Anjali Shah",    phone: "9109876543" } },
  { id: "e22", entry_date: "2026-06-22", total_amount: "620",  delivery_status: "pending",   customer: { name: "Deepak Kumar",   phone: "9098765432" } },
];

export const DEMO_EXPENSES = [
  { id: "ex01", date: "2026-06-01", category: "Rent",         description: "Monthly shop rent",            amount: "15000" },
  { id: "ex02", date: "2026-06-01", category: "Salaries",     description: "Worker salaries — June",       amount: "18000" },
  { id: "ex03", date: "2026-06-05", category: "Electricity",  description: "DGVCL bill — May cycle",       amount: "4200"  },
  { id: "ex04", date: "2026-06-08", category: "Raw Material", description: "Detergent, softener, covers",  amount: "3500"  },
  { id: "ex05", date: "2026-06-14", category: "Maintenance",  description: "Washing machine servicing",    amount: "1200"  },
  { id: "ex06", date: "2026-06-18", category: "Transport",    description: "Delivery bike fuel + misc",    amount: "2800"  },
  { id: "ex07", date: "2026-06-21", category: "Raw Material", description: "Extra detergent stock",        amount: "2100"  },
];

export const DEMO_LABOUR = [
  { id: "l01", name: "Raju Prasad",  created_at: "2024-01-15T00:00:00Z" },
  { id: "l02", name: "Mohan Lal",    created_at: "2024-03-01T00:00:00Z" },
  { id: "l03", name: "Sanjay Yadav", created_at: "2025-06-01T00:00:00Z" },
  { id: "l04", name: "Meera Bai",    created_at: "2025-09-15T00:00:00Z" },
];

export const DEMO_PROFILE = {
  name: "Ramesh Bhai",
  shop_name: "Ramesh Laundry & Dry Clean",
};
