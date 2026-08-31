import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clean existing data
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.foodItem.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.restaurant.deleteMany({});

  console.log('🧹 Cleaned existing database records.');

  // Hash password
  const hashedPassword = await bcrypt.hash('password123', 10);

  // 2. Create Super Admin
  const superAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@orderkare.com',
      password: hashedPassword,
      name: 'OrderKare Super Admin',
      role: Role.SUPER_ADMIN,
    },
  });
  console.log('👤 Created Super Admin: superadmin@orderkare.com (Password: password123)');

  // 3. Create Restaurant Admin & Restaurant (Royal Palace)
  const restaurant = await prisma.restaurant.create({
    data: {
      name: 'Royal Palace',
      slug: 'royal-palace',
      address: 'Tech Hub Complex, Sector 62, Noida, India',
      phone: '+91 120 4567 890',
      isActive: true,
      subscription: {
        create: {
          status: 'ACTIVE',
          planName: 'Professional',
          validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year validity
        },
      },
    },
  });

  const restaurantAdmin = await prisma.user.create({
    data: {
      email: 'demo@restaurant.com',
      password: hashedPassword,
      name: 'Rajesh Kumar (Manager)',
      role: Role.RESTAURANT_ADMIN,
      restaurantId: restaurant.id,
    },
  });
  console.log('🏨 Created Restaurant: Royal Palace (/menu/royal-palace)');
  console.log('👤 Created Restaurant Admin: demo@restaurant.com (Password: password123)');

  // 4. Create Menu Categories
  const starters = await prisma.category.create({
    data: { name: 'Starters', orderIndex: 0, restaurantId: restaurant.id },
  });
  const mainCourse = await prisma.category.create({
    data: { name: 'Main Course', orderIndex: 1, restaurantId: restaurant.id },
  });
  const desserts = await prisma.category.create({
    data: { name: 'Desserts', orderIndex: 2, restaurantId: restaurant.id },
  });
  console.log('🗂️ Created Categories: Starters, Main Course, Desserts');

  // 5. Create Food Items
  await prisma.foodItem.createMany({
    data: [
      {
        name: 'Paneer Tikka',
        description: 'Classic roasted cottage cheese cubes marinated in yogurt and spices.',
        price: 220,
        isVeg: true,
        isAvailable: true,
        categoryId: starters.id,
        restaurantId: restaurant.id,
      },
      {
        name: 'Crispy Spring Rolls',
        description: 'Golden fried rolls filled with fresh julienned vegetables.',
        price: 180,
        isVeg: true,
        isAvailable: true,
        categoryId: starters.id,
        restaurantId: restaurant.id,
      },
      {
        name: 'Butter Chicken',
        description: 'Tender chicken pieces cooked in a rich, creamy tomato and butter gravy.',
        price: 340,
        isVeg: false,
        isAvailable: true,
        categoryId: mainCourse.id,
        restaurantId: restaurant.id,
      },
      {
        name: 'Dal Makhani',
        description: 'Slow-cooked black lentils simmered with cream and butter overnight.',
        price: 260,
        isVeg: true,
        isAvailable: true,
        categoryId: mainCourse.id,
        restaurantId: restaurant.id,
      },
      {
        name: 'Chocolate Brownie',
        description: 'Warm fudge chocolate brownie served with a scoop of vanilla ice cream.',
        price: 190,
        isVeg: true,
        isAvailable: true,
        categoryId: desserts.id,
        restaurantId: restaurant.id,
      },
    ],
  });
  console.log('🍲 Seeded default menu food items.');
  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
