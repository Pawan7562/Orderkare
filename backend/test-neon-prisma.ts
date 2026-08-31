import { prisma } from './src/lib/prisma';

async function test() {
  try {
    console.log("🔍 Fetching users from Neon PostgreSQL...");
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true }
    });
    console.log("✅ Users fetched successfully:", users);

    console.log("🔍 Fetching categories from Neon PostgreSQL...");
    const categories = await prisma.category.findMany();
    console.log("✅ Categories count:", categories.length);

    console.log("🔍 Fetching food items from Neon PostgreSQL...");
    const foods = await prisma.foodItem.findMany();
    console.log("✅ Food items count:", foods.length);
  } catch (err) {
    console.error("❌ Prisma Neon Error:", err);
  }
}

test();
