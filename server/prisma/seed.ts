import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: 'postgresql://danish:root@localhost:5432/neighbourly?schema=public',
  }),
});

const categoryData = [
  {
    name: 'Home Services',
    description: 'Professional home maintenance, cleaning, and repair services',
  },
  {
    name: 'Education & Tutoring',
    description: 'Local tutoring, skill sharing, and educational services',
  },
  {
    name: 'Equipment Rental',
    description: 'Rent tools, equipment, and machinery from neighbors',
  },
  {
    name: 'Personal Services',
    description: 'Personal care, wellness, and lifestyle services',
  },
  {
    name: 'Professional Services',
    description: 'Business and professional consulting services',
  },
  {
    name: 'Transportation',
    description: 'Local transportation and delivery services',
  },
  {
    name: 'Pet Care',
    description: 'Pet sitting, walking, grooming, and care services',
  },
  {
    name: 'Gardening & Landscaping',
    description: 'Garden maintenance, landscaping, and outdoor services',
  },
  {
    name: 'Repair & Maintenance',
    description: 'Equipment repair, maintenance, and technical services',
    children: [
      {
        name: 'Electronics Repair',
        description: 'Repair services for electronics and appliances',
      },
      {
        name: 'Vehicle Repair',
        description: 'Automotive and bicycle repair services',
      },
    ],
  },
  {
    name: 'Event Services',
    description: 'Event planning, catering, and party services',
  },
];

async function main() {
  console.log('🌱 Starting database seed...');

  console.log('🗑️  Resetting database...');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Booking" CASCADE');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Service" CASCADE');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "ServiceCategory" CASCADE');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "UserProfile" CASCADE');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "User" CASCADE');

  console.log('📁 Creating categories...');
  const categoryMap = new Map<string, string>();

  for (const category of categoryData) {
    const parentCategory = await prisma.serviceCategory.create({
      data: {
        name: category.name,
        description: category.description,
      },
    });
    categoryMap.set(category.name, parentCategory.id);

    // Create children if they exist
    if (category.children && category.children.length > 0) {
      for (const child of category.children) {
        const childCategory = await prisma.serviceCategory.create({
          data: {
            name: child.name,
            description: child.description,
            parentId: parentCategory.id,
          },
        });
        categoryMap.set(`${category.name}::${child.name}`, childCategory.id);
      }
    }
  }

  console.log(`✅ Created ${categoryMap.size} categories`);

  console.log('🎉 Database seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Categories: ${categoryMap.size}`);
  console.log(`   - Parent Categories: ${categoryData.length}`);
  const childCount = categoryData.reduce((sum, cat) => sum + (cat.children?.length || 0), 0);
  console.log(`   - Child Categories: ${childCount}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
