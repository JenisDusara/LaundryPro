// Central config + content for the LaundryPro marketing site.
// Change contact details / demo link here in one place.

export const WHATSAPP_NUMBER = "919824436736"; // +91 98244 36736
export const WHATSAPP_DISPLAY = "+91 98244 36736";
export const EMAIL = "jenishdusara78@gmail.com";
export const DEMO_URL = "/dashboard";

export const waLink = (
  message = "Hi, I'm interested in LaundryPro for my laundry shop."
) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

export const nav = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "Reviews", href: "#reviews" },
];

export const stats = [
  { value: 500, suffix: "+", label: "Shops running LaundryPro" },
  { value: 4.9, suffix: "/5", label: "Average owner rating" },
  { value: 1, suffix: " day", label: "Typical setup time" },
];

export const cities = [
  "Ahmedabad",
  "Mumbai",
  "Delhi",
  "Surat",
  "Jaipur",
  "Pune",
  "Vadodara",
  "Rajkot",
  "Bangalore",
  "Hyderabad",
  "Kolkata",
  "Chennai",
  "Lucknow",
  "Indore",
  "Nagpur",
  "Bhopal",
  "Nashik",
  "Chandigarh",
  "Coimbatore",
  "Patna",
];

// Dashboard mockup shown in the hero.
export const mockup = {
  date: "TUESDAY, 30 JUNE",
  greeting: "Good evening, Rajesh",
  today: { revenue: "₹640", note: "4 pickups today" },
  month: { revenue: "₹18,400", note: "142 entries" },
  entries: [
    { name: "Ankitbhai", detail: "Iron × 4 · Dry clean", status: "Pending", amount: "₹80" },
    { name: "Bhaveshbhai", detail: "Steam iron × 4", status: "Done", amount: "₹40" },
    { name: "Kiran Shah", detail: "Bedsheet × 1", status: "Pending", amount: "₹60" },
  ],
};

export const problems = [
  {
    title: "Orders get lost",
    body: "Entries scribbled in a register go missing. Customers argue, garments get misplaced.",
  },
  {
    title: "No idea of revenue",
    body: "You worked hard all month — but how much did you actually earn? Nobody knows.",
  },
  {
    title: "Labour is a headache",
    body: "Counting press work and calculating wages by hand takes hours and causes disputes.",
  },
];

export const steps = [
  {
    title: "Search customer",
    body: "Find by name, phone or flat — or add a new one in seconds.",
  },
  {
    title: "Add garments",
    body: "Tap a service, set quantity. Rates fill in automatically.",
  },
  {
    title: "Bill generates",
    body: "Total adds up instantly. Share the invoice on WhatsApp.",
  },
  {
    title: "Mark delivery",
    body: "One tap when the order goes out. Nothing slips through.",
  },
];

export const features = [
  {
    icon: "users",
    title: "Customer management",
    body: "Name, phone, address and instant search. Every customer and their history in one place.",
    accent: "navy",
  },
  {
    icon: "receipt",
    title: "Billing & orders",
    body: "A bill in 10 seconds — auto totals, itemised services, one-tap WhatsApp share.",
    accent: "amber",
  },
  {
    icon: "truck",
    title: "Delivery management",
    body: "Every pending delivery on one screen. Mark delivered in a single click.",
    accent: "navy",
  },
  {
    icon: "chart",
    title: "Reports & analytics",
    body: "Daily and monthly revenue reports. Finally know exactly what you earn.",
    accent: "amber",
  },
  {
    icon: "labour",
    title: "Labour management",
    body: "Track each worker's press count, auto-calculate wages, record advances.",
    accent: "navy",
  },
  {
    icon: "wallet",
    title: "Expense & accounting",
    body: "Rent, salary, electricity, supplies — track every cost, category-wise.",
    accent: "amber",
  },
  {
    icon: "tags",
    title: "Service & pricing",
    body: "Set your own rates — shirt ₹30, suit ₹120 — and change them anytime.",
    accent: "navy",
  },
];

export const whatsappPoints = [
  "Message on bill creation",
  "Reminder when delivery is ready",
  "A professional touch, zero effort",
];

export const whatsappChat = [
  {
    text: "Hi Harsh, your order of 6 items is confirmed. Total ₹280. — Shree Chamunda Laundry",
    time: "10:24 AM",
  },
  {
    text: "Your laundry is ready for delivery. See you soon.",
    time: "4:10 PM",
  },
];

export const testimonials = [
  {
    quote:
      "No more writing in the register. Now the whole account is on my phone — what I earned, what's pending, all crystal clear.",
    name: "Rajesh Sharma",
    city: "Ahmedabad",
  },
  {
    quote:
      "Billing is so fast now that customers barely wait. The moment they get the WhatsApp bill, they're impressed.",
    name: "Priya Patel",
    city: "Surat",
  },
  {
    quote:
      "Calculating labour wages used to take a whole day. Now it's a single click. Best decision for my shop.",
    name: "Mohammed Raza",
    city: "Mumbai",
  },
];
