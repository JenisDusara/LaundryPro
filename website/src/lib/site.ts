// Central config + content for the LaundryMax marketing site.
// Change contact details / demo link here in one place.

export const WHATSAPP_NUMBER = "919824436736"; // +91 98244 36736
export const WHATSAPP_DISPLAY = "+91 98244 36736";
export const EMAIL = "info@laundrymax.in";
export const DEMO_URL = "/dashboard";

export const waLink = (
  message = "Hi, I'm interested in LaundryMax for my laundry shop."
) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

export const nav = [
  { label: "About", href: "/#about" },
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Reviews", href: "/#reviews" },
  { label: "FAQ", href: "/#faq" },
];

export const stats = [
  { value: 500, suffix: "+", label: "Shops running LaundryMax" },
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

// Sample garment rates — shown as chips in the hero so the site instantly
// reads as *laundry*. Shops set their own rates; these are realistic defaults.
export const garmentRates = [
  { name: "Shirt", rate: 30 },
  { name: "Trouser", rate: 40 },
  { name: "Saree", rate: 80 },
  { name: "Suit", rate: 150 },
  { name: "Bedsheet", rate: 60 },
  { name: "Blanket", rate: 150 },
];

// Laundry service types — the actual work a shop does, iconography included.
export const serviceTypes = [
  { icon: "wash", title: "Wash & Fold", body: "Sorted, washed, dried and folded." },
  { icon: "dryclean", title: "Dry Cleaning", body: "Suits, sarees & delicates, cared for." },
  { icon: "iron", title: "Steam Iron", body: "Crease-free press, counted per piece." },
  { icon: "premium", title: "Express & Delivery", body: "Same-day service, doorstep drop." },
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

// About section — who it's for + why it works.
export const about = {
  eyebrow: "About LaundryMax",
  heading: "Built for Indian laundry & dry-cleaning shops",
  body:
    "LaundryMax helps you manage your laundry or dry-cleaning business effortlessly — from order booking to billing, reports and customer rewards — all in one laundry business management system. Built for single or multi-branch businesses, it gives you real-time control, smart analytics and a faster way to handle day-to-day operations.",
  points: [
    "Multi-store management",
    "Expense tracking",
    "Smart reports & analytics",
    "Customer loyalty and rewards",
    "Order management",
    "Cloud access from anywhere",
  ],
  // distinct trust points shown inside the stats card (not the feature list)
  cardPoints: [
    "Set up the same day",
    "Free demo & full onboarding",
    "Cloud backup — nothing ever lost",
  ],
  highlights: [
    { value: 500, suffix: "+", label: "Shops running LaundryMax" },
    { value: 4.9, suffix: "/5", label: "Average owner rating" },
    { value: 20, suffix: "+", label: "Cities across India" },
  ],
};

// Pricing plans — simple monthly tiers.
export const pricing = [
  {
    name: "Starter",
    price: "₹499",
    period: "/month",
    tagline: "For a single shop getting started.",
    features: [
      "1 store, unlimited customers",
      "Billing & order management",
      "WhatsApp bills",
      "Daily revenue reports",
    ],
    cta: "Start free demo",
    featured: false,
  },
  {
    name: "Growth",
    price: "₹999",
    period: "/month",
    tagline: "For a busy shop that wants it all.",
    features: [
      "Everything in Starter",
      "Delivery management",
      "Labour & wage tracking",
      "Expense & accounting",
      "Monthly analytics",
    ],
    cta: "Start free demo",
    featured: true,
  },
  {
    name: "Multi-store",
    price: "₹1,999",
    period: "/month",
    tagline: "For chains running many outlets.",
    features: [
      "Everything in Growth",
      "Unlimited stores, one login",
      "Store-wise reports",
      "Priority support",
    ],
    cta: "Talk to us",
    featured: false,
  },
];

// Frequently asked questions.
export const faqs = [
  {
    q: "Do I need any technical skill to use LaundryMax?",
    a: "Not at all. If you can use WhatsApp, you can use LaundryMax. Most owners are billing customers within their first hour, and our team sets everything up for you.",
  },
  {
    q: "Can I manage more than one shop?",
    a: "Yes. The Multi-store plan lets you run any number of outlets from a single login, with separate reports for each store and a combined view for the owner.",
  },
  {
    q: "Will it work on my phone?",
    a: "LaundryMax runs in any browser — phone, tablet or computer. There is nothing to install and your data stays in sync across every device.",
  },
  {
    q: "How does the WhatsApp billing work?",
    a: "The moment you create a bill, you can share a clean, professional invoice to the customer's WhatsApp in one tap. You can also send a reminder when their order is ready for delivery.",
  },
  {
    q: "Is my data safe?",
    a: "Every entry is stored securely in the cloud and backed up automatically. Nothing gets lost — unlike a paper register — and only you can see your shop's data.",
  },
  {
    q: "How do I get started?",
    a: "Book a free demo and our team will walk you through everything and set up your shop. Most shops are fully live within a day.",
  },
];

// Demo / contact section.
export const demo = {
  eyebrow: "Get a free demo",
  heading: "See LaundryMax running your shop",
  body:
    "Book a free, no-obligation demo. We'll set up your shop with sample data and show you billing, deliveries and reports live — takes 15 minutes.",
  points: [
    "Personal walkthrough on WhatsApp or call",
    "We set up your services and rates for you",
    "Live the same day — no card, no commitment",
  ],
};

// ── myuniclean-style full-page sections ───────────────────────────────

export const heroCopy = {
  brand: "LAUNDRYMAX",
  lines: ["Manage.", "Automate."],
  accent: "Grow your shop.",
  body:
    "The complete laundry management software — billing, orders, deliveries, customers, labour and accounts, all in one clean cloud dashboard.",
  cta: "Book a free demo!",
};

// "Complete Laundry Management Made Easy" — 8 feature cards.
export const managementIntro = {
  heading: "Complete laundry management made easy",
  body:
    "From easy order booking to pickup–delivery management and payment status updates, our laundry POS billing software handles it all.",
};
export const managementCards = [
  { icon: "dashboard", title: "Manage laundry operations", body: "Run all your laundry operations from one dashboard — from placing orders to tracking deliveries." },
  { icon: "store", title: "Multi-store management", body: "Handle multiple stores under one brand. Add, edit or remove stores; manage users, taxes and charges." },
  { icon: "shield", title: "Admin control dashboard", body: "A powerful admin panel with dynamic charts, order reviews, collection tracking and detailed insights." },
  { icon: "chart", title: "Smart reports & insights", body: "Detailed reports for invoices, payments, customers, discounts and growth. Visualize data to decide faster." },
  { icon: "users", title: "Customer management", body: "Manage customers with profiles showing total revenue, order history, visits and loyalty." },
  { icon: "wallet", title: "Expense & discount tracking", body: "Track every expense and discount. Monitor daily spending and analyze cost patterns." },
  { icon: "trending", title: "Growth & revenue analytics", body: "Compare sales, revenue and performance over time to make data-driven decisions." },
  { icon: "boxes", title: "Inventory & service management", body: "Manage garments, categories, services and pricing. Assign charges and taxes per store." },
];

// "Why Choose LaundryMax?" — 6 points.
export const whyChoose = [
  { title: "All-in-one laundry software", body: "Manage multiple stores, customers, orders and services effortlessly — everything in one smart platform." },
  { title: "Data-driven insights", body: "Detailed reports on revenue, customers, discounts and expenses to make informed business decisions." },
  { title: "Automated laundry POS", body: "From order booking to invoice generation and WhatsApp notifications — automate your entire workflow." },
  { title: "Customer engagement made easy", body: "Track loyal and new customers, monitor visits, and reward them with discounts and loyalty points." },
  { title: "Smart billing & monthly bills", body: "Apply taxes and discounts in one click, generate customer monthly bills, and track every expense and profit instantly." },
  { title: "User-friendly dashboard", body: "An intuitive interface for admins and store teams — simple, fast and efficient for daily use." },
];

// How It Works — 3 steps.
export const workSteps = [
  { title: "Register your store", body: "Get started in minutes. Register your laundry or dry-cleaning store and configure services, taxes and charges." },
  { title: "Manage orders & customers", body: "Handle garments, track visits, generate invoices with QR codes, and reward customers with loyalty points." },
  { title: "Track growth & insights", body: "Monitor expenses, collections and customer reports — all in real time with visual charts and downloads." },
];

// Key Features · For Stores (Web App).
export const storeWeb = [
  { title: "Smart dashboard", body: "Instantly view today's bookings, deliveries and completed orders." },
  { title: "Customer & order management", body: "Add customers, create orders and manage them by date, status or customer." },
  { title: "Reports & analytics", body: "Monitor invoices, revenue, growth and daily store expenses." },
  { title: "Flexible billing & checkout", body: "Apply discounts, taxes and add payment information." },
  { title: "Invoices & QR codes", body: "Generate full or mini-invoices with printable, scannable QR codes." },
  { title: "Custom charts & insights", body: "Visualize performance, trends and customer activity your way." },
  { title: "Expense tracking", body: "Record and control store-level spending efficiently." },
  { title: "Invoice sharing", body: "Send invoices instantly via WhatsApp from the order summary." },
  { title: "Monthly bills", body: "Generate a customer's full monthly bill and share it on WhatsApp in one tap." },
];

// Store Mobile App — 9 points.
export const mobileFeatures = [
  { title: "Smart dashboard", body: "View today's bookings, deliveries and pending orders instantly." },
  { title: "Store orders", body: "Filter and manage all orders by date, customer or status." },
  { title: "Customer management", body: "Add new customers or open detailed profiles with history and balances." },
  { title: "Order booking & checkout", body: "Book orders, apply discounts and taxes, or collect payment later." },
  { title: "Invoices & QR codes", body: "Generate, print or share invoices easily." },
  { title: "Expense tracking", body: "Record daily store expenses directly from the app." },
  { title: "Security & access", body: "Reset passwords anytime, secure login." },
  { title: "Company registration", body: "Register a new company or store right from your phone." },
  { title: "Reports", body: "Access invoice, customer and collection reports from your mobile dashboard." },
  { title: "Monthly billing", body: "Send a customer's monthly bill on WhatsApp right from their profile." },
];

// Detailed /features page — one block per real feature (myuniclean-style).
export const featureBlocks = [
  {
    icon: "receipt",
    name: "Billing & POS",
    heading: "Create a bill in 10 seconds",
    body: "A fast counter screen built for busy shops — find the customer, add services and take payment without slowing the queue.",
    points: [
      "Search a customer by name, phone, flat or society",
      "Add services & garments — rates fill in automatically",
      "Apply discount or extra charge instantly",
      "Take payment as Cash, UPI, Online — or mark 'Later'",
      "Set expected delivery date and order notes",
    ],
  },
  {
    icon: "users",
    name: "Customer Management",
    heading: "Every customer, perfectly organized",
    body: "Keep every customer, their history and their balance in one place — no more guessing who owes what.",
    points: [
      "Add or find customers by name, phone or flat",
      "See full history — orders, invoices, dues & advances",
      "Track balance due and advance for each customer",
      "One-tap call or WhatsApp reminder",
    ],
  },
  {
    icon: "truck",
    name: "Orders & Delivery",
    heading: "Track every order to delivery",
    body: "See exactly what's pending and what's delivered, month by month — nothing slips through.",
    points: [
      "All orders month-wise with clear status",
      "Pending and delivered clearly marked",
      "Mark an order delivered in one tap",
      "Filter by date, customer or status",
    ],
  },
  {
    icon: "tags",
    name: "Services & Pricing",
    heading: "Your services, your rates",
    body: "Set up exactly the services your shop offers, with your own prices — and change them anytime.",
    points: [
      "Create services with sub-items (Shirt, Pant, Saree…)",
      "Flat-rate or per-item pricing",
      "Set and edit prices whenever you want",
      "Add or remove services as your shop grows",
    ],
  },
  {
    icon: "message",
    name: "WhatsApp & Monthly Bills",
    heading: "Professional bills on WhatsApp",
    body: "Share clean invoices and full monthly bills straight to the customer's WhatsApp — a professional touch with zero effort.",
    points: [
      "Share an invoice on WhatsApp in one tap",
      "Generate a customer's full monthly bill",
      "Automatic delivery-ready reminders",
      "'Send bills' to all pending customers at once",
    ],
  },
  {
    icon: "wallet",
    name: "Payments & Collections",
    heading: "Get paid faster",
    body: "Collect full or partial payments, track balances and keep a clean record of every rupee collected.",
    points: [
      "Collect full or partial payments",
      "Track balance due and advances",
      "Record collections against invoices",
      "Clear payment history per customer",
    ],
  },
  {
    icon: "book",
    name: "Accounting",
    heading: "Income, expenses & profit — sorted",
    body: "Your whole shop's books in one place, month by month, always balanced.",
    points: [
      "Total income, expense and net profit at a glance",
      "Record daily store expenses by category",
      "Collections and day-wise report",
      "Month-wise books you can trust",
    ],
  },
  {
    icon: "chart",
    name: "Reports & Analytics",
    heading: "Grow with real numbers",
    body: "Finally know exactly what you earn, where it comes from, and how you're growing.",
    points: [
      "Revenue, entries, average per entry and customers",
      "Daily earnings chart and trends",
      "Filter by orders, collection, balance, services or society",
      "Export everything to Excel in one click",
    ],
  },
  {
    icon: "labour",
    name: "Labour & Staff",
    heading: "Manage your team & wages",
    body: "Track press work, calculate wages automatically and keep every worker's record clean.",
    points: [
      "Track each worker's press count",
      "Auto-calculate wages and record advances",
      "Manage staff members and salaries",
      "Clear, dispute-free records for everyone",
    ],
  },
];

// Key Features · For Admin — 7 points.
export const adminFeatures = [
  { title: "Multi-store dashboard", body: "Filter and manage data across all company stores from one view." },
  { title: "Smart reports & analytics", body: "Track invoices, collections, customer growth and business trends." },
  { title: "Order & payment insights", body: "Review orders, monitor collections and compare performance by date or store." },
  { title: "Customer & revenue reports", body: "Analyze repeat customers, revenue contribution and visit frequency." },
  { title: "User & role management", body: "Add admins, assign roles and control permissions easily." },
  { title: "Custom taxes & discounts", body: "Set unique taxes, discounts and charges per store or company-wide." },
  { title: "Expense & growth tracking", body: "Keep a close eye on expenses and overall business growth." },
];
