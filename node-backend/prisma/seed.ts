import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.admin.findUnique({ where: { username: "admin" } });
  if (!existing) {
    const hash = await bcrypt.hash("admin123", 12);
    await prisma.admin.create({ data: { username: "admin", password_hash: hash, name: "Admin" } });
    console.log("✅ Admin created: admin / admin123");
  } else {
    console.log("ℹ️  Admin already exists");
  }

  const serviceCount = await prisma.service.count();
  if (serviceCount === 0) {
    const washing = await prisma.service.create({ data: { name: "Washing", price: null } });
    await prisma.service.createMany({ data: [
      { name: "Shirt", parent_id: washing.id, price: 20 },
      { name: "Pant", parent_id: washing.id, price: 25 },
      { name: "Saree", parent_id: washing.id, price: 40 },
    ]});
    const iron = await prisma.service.create({ data: { name: "Iron", price: null } });
    await prisma.service.createMany({ data: [
      { name: "Shirt Iron", parent_id: iron.id, price: 10 },
      { name: "Pant Iron", parent_id: iron.id, price: 12 },
    ]});
    await prisma.service.create({ data: { name: "Dry Clean", price: 150 } });
    console.log("✅ Sample services created");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
