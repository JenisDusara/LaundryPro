import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const SHOP = "shop1";

async function main() {
  console.log("Seeding demo data...");

  // Clear existing demo data
  await prisma.review.deleteMany({ where: { shop_id: SHOP } });
  await prisma.labourAdvance.deleteMany({});
  await prisma.labourWork.deleteMany({});
  await prisma.labour.deleteMany({ where: { shop_id: SHOP } });
  await prisma.expense.deleteMany({ where: { shop_id: SHOP } });
  await prisma.entryItem.deleteMany({});
  await prisma.laundryEntry.deleteMany({ where: { shop_id: SHOP } });
  await prisma.service.deleteMany({ where: { shop_id: SHOP } });
  await prisma.customer.deleteMany({ where: { shop_id: SHOP } });

  // Services (parent categories)
  const dryClean = await prisma.service.create({ data: { name: "Dry Clean",   price: null, shop_id: SHOP, is_active: true } });
  const washIron = await prisma.service.create({ data: { name: "Wash & Iron", price: null, shop_id: SHOP, is_active: true } });
  const ironOnly = await prisma.service.create({ data: { name: "Iron Only",   price: null, shop_id: SHOP, is_active: true } });

  // Sub-services
  const dcChildren = await Promise.all([
    prisma.service.create({ data: { name: "Shirt",        price: 80,  parent_id: dryClean.id, shop_id: SHOP, is_active: true } }),
    prisma.service.create({ data: { name: "Pant",         price: 90,  parent_id: dryClean.id, shop_id: SHOP, is_active: true } }),
    prisma.service.create({ data: { name: "Suit (2 pc)",  price: 200, parent_id: dryClean.id, shop_id: SHOP, is_active: true } }),
    prisma.service.create({ data: { name: "Saree",        price: 120, parent_id: dryClean.id, shop_id: SHOP, is_active: true } }),
    prisma.service.create({ data: { name: "Kurta",        price: 70,  parent_id: dryClean.id, shop_id: SHOP, is_active: true } }),
    prisma.service.create({ data: { name: "Jacket",       price: 150, parent_id: dryClean.id, shop_id: SHOP, is_active: true } }),
    prisma.service.create({ data: { name: "Blanket",      price: 200, parent_id: dryClean.id, shop_id: SHOP, is_active: true } }),
    prisma.service.create({ data: { name: "Curtain (pc)", price: 80,  parent_id: dryClean.id, shop_id: SHOP, is_active: true } }),
  ]);

  const wiChildren = await Promise.all([
    prisma.service.create({ data: { name: "Shirt",   price: 25, parent_id: washIron.id, shop_id: SHOP, is_active: true } }),
    prisma.service.create({ data: { name: "Pant",    price: 30, parent_id: washIron.id, shop_id: SHOP, is_active: true } }),
    prisma.service.create({ data: { name: "T-Shirt", price: 20, parent_id: washIron.id, shop_id: SHOP, is_active: true } }),
    prisma.service.create({ data: { name: "Saree",   price: 50, parent_id: washIron.id, shop_id: SHOP, is_active: true } }),
    prisma.service.create({ data: { name: "Jeans",   price: 35, parent_id: washIron.id, shop_id: SHOP, is_active: true } }),
    prisma.service.create({ data: { name: "Blanket", price: 80, parent_id: washIron.id, shop_id: SHOP, is_active: true } }),
  ]);

  const ioChildren = await Promise.all([
    prisma.service.create({ data: { name: "Shirt",  price: 12, parent_id: ironOnly.id, shop_id: SHOP, is_active: true } }),
    prisma.service.create({ data: { name: "Pant",   price: 15, parent_id: ironOnly.id, shop_id: SHOP, is_active: true } }),
    prisma.service.create({ data: { name: "Saree",  price: 20, parent_id: ironOnly.id, shop_id: SHOP, is_active: true } }),
    prisma.service.create({ data: { name: "Kurta",  price: 12, parent_id: ironOnly.id, shop_id: SHOP, is_active: true } }),
    prisma.service.create({ data: { name: "Jeans",  price: 15, parent_id: ironOnly.id, shop_id: SHOP, is_active: true } }),
  ]);

  // Quick lookup helpers
  const dc = (name: string) => dcChildren.find(s => s.name === name)!;
  const wi = (name: string) => wiChildren.find(s => s.name === name)!;
  const io = (name: string) => ioChildren.find(s => s.name === name)!;
  console.log("Services done");

  // Customers
  const custs = await Promise.all([
    prisma.customer.create({ data: { name: "Ramesh Patel",    phone: "9876543210", flat_number: "B-204", society_name: "Shanti Nagar",    address: "Opp. City Mall, Ahmedabad",       shop_id: SHOP } }),
    prisma.customer.create({ data: { name: "Priya Shah",      phone: "9823456789", flat_number: "A-101", society_name: "Green Valley",     address: "Near Railway Station, Surat",     shop_id: SHOP } }),
    prisma.customer.create({ data: { name: "Mohammed Shaikh", phone: "9712345678", flat_number: "C-305", society_name: "Al-Noor Society",  address: "Dariyapur, Ahmedabad",            shop_id: SHOP } }),
    prisma.customer.create({ data: { name: "Sunita Verma",    phone: "9988776655", flat_number: "D-12",  society_name: "Laxmi Residency",  address: "Satellite Road, Ahmedabad",       shop_id: SHOP } }),
    prisma.customer.create({ data: { name: "Deepak Nair",     phone: "9765432109", flat_number: "E-201", society_name: "Sunrise Apts",     address: "Thaltej, Ahmedabad",              shop_id: SHOP } }),
    prisma.customer.create({ data: { name: "Anita Gupta",     phone: "9654321098", flat_number: "F-402", society_name: "Royal Heights",    address: "Vastrapur, Ahmedabad",            shop_id: SHOP } }),
    prisma.customer.create({ data: { name: "Suresh Kumar",    phone: "9543210987", flat_number: "G-103", society_name: "Patel Colony",     address: "Naranpura, Ahmedabad",            shop_id: SHOP } }),
    prisma.customer.create({ data: { name: "Kavya Reddy",     phone: "9432109876", flat_number: "H-301", society_name: "Garden View",      address: "Chandkheda, Ahmedabad",           shop_id: SHOP } }),
    prisma.customer.create({ data: { name: "Vikram Singh",    phone: "9321098765", flat_number: "I-202", society_name: "Shivalik Flats",   address: "Bopal, Ahmedabad",                shop_id: SHOP } }),
    prisma.customer.create({ data: { name: "Meena Joshi",     phone: "9210987654", flat_number: "J-105", society_name: "Om Shanti Apts",   address: "Gota, Ahmedabad",                 shop_id: SHOP } }),
    prisma.customer.create({ data: { name: "Rajesh Sharma",   phone: "9109876543", flat_number: "K-404", society_name: "Krishna Park",     address: "Maninagar, Ahmedabad",            shop_id: SHOP } }),
    prisma.customer.create({ data: { name: "Fatima Khan",     phone: "9876501234", flat_number: "L-203", society_name: "Raza Colony",      address: "Juhapura, Ahmedabad",             shop_id: SHOP } }),
  ]);
  console.log("Customers done");

  const d = (daysAgo: number) => {
    const dt = new Date();
    dt.setDate(dt.getDate() - daysAgo);
    return dt.toISOString().slice(0, 10);
  };

  // Entries
  type Item = { svc: { id: string; name: string }; qty: number; price: number };
  const makeEntry = async (custIdx: number, daysAgo: number, status: "pending"|"ready"|"delivered", items: Item[], notes = "") => {
    const total = items.reduce((s, it) => s + it.qty * it.price, 0);
    const entry = await prisma.laundryEntry.create({
      data: {
        customer_id:     custs[custIdx].id,
        entry_date:      d(daysAgo),
        total_amount:    total,
        delivery_status: status,
        delivery_date:   status === "delivered" ? d(Math.max(0, daysAgo - 2)) : null,
        notes,
        shop_id: SHOP,
      },
    });
    await Promise.all(items.map(it =>
      prisma.entryItem.create({
        data: {
          entry_id: entry.id, service_id: it.svc.id, service_name: it.svc.name,
          price_per_unit: it.price, quantity: it.qty, subtotal: it.qty * it.price,
        },
      })
    ));
    return entry;
  };

  const entries = await Promise.all([
    makeEntry(0, 0,  "pending",   [{ svc: dc("Shirt"), qty: 3, price: 80 }, { svc: dc("Pant"), qty: 2, price: 90 }, { svc: dc("Blanket"), qty: 1, price: 200 }], "Handle with care — silk fabric"),
    makeEntry(1, 0,  "pending",   [{ svc: wi("Shirt"), qty: 5, price: 25 }, { svc: wi("Jeans"), qty: 2, price: 35 }]),
    makeEntry(2, 1,  "ready",     [{ svc: dc("Suit (2 pc)"), qty: 2, price: 200 }, { svc: dc("Shirt"), qty: 4, price: 80 }]),
    makeEntry(3, 1,  "pending",   [{ svc: io("Saree"), qty: 3, price: 20 }, { svc: io("Kurta"), qty: 5, price: 12 }]),
    makeEntry(4, 2,  "ready",     [{ svc: wi("Shirt"), qty: 8, price: 25 }, { svc: wi("Pant"), qty: 4, price: 30 }, { svc: wi("T-Shirt"), qty: 3, price: 20 }]),
    makeEntry(5, 2,  "delivered", [{ svc: dc("Saree"), qty: 2, price: 120 }, { svc: dc("Blanket"), qty: 2, price: 200 }]),
    makeEntry(6, 3,  "pending",   [{ svc: io("Shirt"), qty: 10, price: 12 }, { svc: io("Pant"), qty: 5, price: 15 }], "Urgent — needed by tomorrow"),
    makeEntry(7, 3,  "delivered", [{ svc: dc("Jacket"), qty: 1, price: 150 }, { svc: dc("Curtain (pc)"), qty: 4, price: 80 }]),
    makeEntry(8, 5,  "delivered", [{ svc: wi("Blanket"), qty: 3, price: 80 }, { svc: wi("Saree"), qty: 1, price: 50 }]),
    makeEntry(9, 6,  "delivered", [{ svc: dc("Suit (2 pc)"), qty: 1, price: 200 }, { svc: dc("Shirt"), qty: 2, price: 80 }]),
    makeEntry(10, 7, "delivered", [{ svc: io("Shirt"), qty: 6, price: 12 }, { svc: io("Pant"), qty: 4, price: 15 }, { svc: io("Jeans"), qty: 2, price: 15 }]),
    makeEntry(11, 8, "delivered", [{ svc: dc("Saree"), qty: 3, price: 120 }, { svc: dc("Kurta"), qty: 2, price: 70 }]),
    makeEntry(0, 10, "delivered", [{ svc: wi("Shirt"), qty: 4, price: 25 }, { svc: wi("Pant"), qty: 2, price: 30 }]),
    makeEntry(2, 12, "delivered", [{ svc: io("Shirt"), qty: 8, price: 12 }, { svc: io("Kurta"), qty: 4, price: 12 }]),
    makeEntry(4, 14, "delivered", [{ svc: dc("Blanket"), qty: 2, price: 200 }, { svc: dc("Jacket"), qty: 1, price: 150 }]),
    makeEntry(1, 16, "delivered", [{ svc: dc("Shirt"), qty: 5, price: 80 }, { svc: dc("Saree"), qty: 1, price: 120 }]),
    makeEntry(3, 18, "delivered", [{ svc: wi("Jeans"), qty: 3, price: 35 }, { svc: wi("T-Shirt"), qty: 6, price: 20 }]),
    makeEntry(5, 20, "delivered", [{ svc: io("Pant"), qty: 8, price: 15 }, { svc: io("Saree"), qty: 2, price: 20 }]),
  ]);
  console.log("Entries done");

  // Labour
  const labours = await Promise.all([
    prisma.labour.create({ data: { name: "Raju Prasad",   shop_id: SHOP, is_active: true } }),
    prisma.labour.create({ data: { name: "Mohan Das",     shop_id: SHOP, is_active: true } }),
    prisma.labour.create({ data: { name: "Santosh Kumar", shop_id: SHOP, is_active: true } }),
  ]);

  const pressCounts = [95, 88, 102, 78, 110, 92, 85];
  for (const labour of labours) {
    for (let day = 6; day >= 0; day--) {
      await prisma.labourWork.create({
        data: { labour_id: labour.id, work_date: d(day), press_count: pressCounts[day] + Math.floor(Math.random() * 20) - 10, rate_per_piece: 2 },
      });
    }
    await prisma.labourAdvance.create({
      data: { labour_id: labour.id, advance_date: d(12), amount: 500, description: "Personal advance" },
    });
  }
  console.log("Labour done");

  // Expenses
  await Promise.all([
    prisma.expense.create({ data: { date: d(2),  category: "Electricity",  description: "Monthly electricity bill",   amount: 3200, shop_id: SHOP } }),
    prisma.expense.create({ data: { date: d(5),  category: "Raw Material", description: "Detergent & chemicals",      amount: 1800, shop_id: SHOP } }),
    prisma.expense.create({ data: { date: d(8),  category: "Rent",         description: "Shop rent June 2026",        amount: 8000, shop_id: SHOP } }),
    prisma.expense.create({ data: { date: d(10), category: "Maintenance",  description: "Machine servicing",          amount: 1200, shop_id: SHOP } }),
    prisma.expense.create({ data: { date: d(12), category: "Transport",    description: "Pickup & delivery charges",  amount: 600,  shop_id: SHOP } }),
    prisma.expense.create({ data: { date: d(15), category: "Raw Material", description: "Hangers & packaging",        amount: 450,  shop_id: SHOP } }),
    prisma.expense.create({ data: { date: d(18), category: "Salaries",     description: "Staff salary advance",       amount: 5000, shop_id: SHOP } }),
    prisma.expense.create({ data: { date: d(20), category: "Other",        description: "Miscellaneous expenses",     amount: 300,  shop_id: SHOP } }),
    prisma.expense.create({ data: { date: d(22), category: "Raw Material", description: "Washing powder bulk order",  amount: 2200, shop_id: SHOP } }),
    prisma.expense.create({ data: { date: d(25), category: "Electricity",  description: "Previous month dues",        amount: 800,  shop_id: SHOP } }),
  ]);
  console.log("Expenses done");

  // Reviews (from delivered entries)
  await Promise.all([
    prisma.review.create({ data: { customer_id: custs[5].id,  entry_id: entries[5].id,  rating: 5, comment: "Excellent service! Clothes come back perfectly clean and pressed.", shop_id: SHOP } }),
    prisma.review.create({ data: { customer_id: custs[7].id,  entry_id: entries[7].id,  rating: 5, comment: "WhatsApp notification is very helpful. Always know when clothes are ready.", shop_id: SHOP } }),
    prisma.review.create({ data: { customer_id: custs[8].id,  entry_id: entries[8].id,  rating: 4, comment: "Good service, delivered on time. Quality is worth it.", shop_id: SHOP } }),
    prisma.review.create({ data: { customer_id: custs[9].id,  entry_id: entries[9].id,  rating: 5, comment: "Best laundry in the area. My sarees are handled very carefully!", shop_id: SHOP } }),
    prisma.review.create({ data: { customer_id: custs[10].id, entry_id: entries[10].id, rating: 4, comment: "Quick turnaround. My office shirts are always perfectly ironed.", shop_id: SHOP } }),
    prisma.review.create({ data: { customer_id: custs[11].id, entry_id: entries[11].id, rating: 5, comment: "Very professional. Itemized receipt for every order — very transparent.", shop_id: SHOP } }),
  ]);
  console.log("Reviews done");

  console.log("\nDemo data seeded successfully!");
  console.log("  Customers : 12");
  console.log("  Entries   : 18");
  console.log("  Labour    : 3");
  console.log("  Expenses  : 10");
  console.log("  Reviews   : 6");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
