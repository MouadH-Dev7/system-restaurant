const { PrismaClient, UserRole } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();
const PASSWORD_SALT_ROUNDS = 12;

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value.trim();
}

async function ensureRestaurant({
  restaurantName,
  restaurantAddress,
  contactPhone,
  language,
  direction,
  locale,
  dateFormat,
  currency,
}) {
  const existingRestaurant = await prisma.restaurant.findFirst({
    orderBy: {
      createdAt: 'asc',
    },
  });

  if (existingRestaurant) {
    await prisma.restaurant.update({
      where: { id: existingRestaurant.id },
      data: {
        name: restaurantName,
        address: restaurantAddress,
      },
    });

    await prisma.restaurantSettings.upsert({
      where: { restaurantId: existingRestaurant.id },
      update: {
        restaurantName,
        businessAddress: restaurantAddress,
        contactPhone,
        currency,
        salesTax: 0,
        language,
        direction,
        locale,
        dateFormat,
        acceptsCash: true,
        acceptsCard: true,
        acceptsQrOrdering: true,
        stripeEnabled: false,
        whatsappEnabled: false,
        smtpEnabled: false,
        openingHours: '09:00',
        closingHours: '23:00',
      },
      create: {
        restaurantId: existingRestaurant.id,
        restaurantName,
        businessAddress: restaurantAddress,
        contactPhone,
        currency,
        salesTax: 0,
        language,
        direction,
        locale,
        dateFormat,
        acceptsCash: true,
        acceptsCard: true,
        acceptsQrOrdering: true,
        stripeEnabled: false,
        whatsappEnabled: false,
        smtpEnabled: false,
        openingHours: '09:00',
        closingHours: '23:00',
      },
    });

    return existingRestaurant;
  }

  const restaurant = await prisma.restaurant.create({
    data: {
      name: restaurantName,
      address: restaurantAddress,
    },
  });

  await prisma.restaurantSettings.create({
    data: {
      restaurantId: restaurant.id,
      restaurantName,
      businessAddress: restaurantAddress,
      contactPhone,
      currency,
      salesTax: 0,
      language,
      direction,
      locale,
      dateFormat,
      acceptsCash: true,
      acceptsCard: true,
      acceptsQrOrdering: true,
      stripeEnabled: false,
      whatsappEnabled: false,
      smtpEnabled: false,
      openingHours: '09:00',
      closingHours: '23:00',
    },
  });

  return restaurant;
}

async function ensureAdminUser(restaurantId, { name, email, staffCode, password }) {
  const hashedPassword = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);

  const existingAdmin = await prisma.user.findFirst({
    where: {
      restaurantId,
      staffCode,
    },
  });

  if (existingAdmin) {
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: {
        name,
        email,
        password: hashedPassword,
        role: UserRole.ADMIN,
        isActive: true,
      },
    });

    return existingAdmin;
  }

  return prisma.user.create({
    data: {
      restaurantId,
      name,
      email,
      staffCode,
      password: hashedPassword,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });
}

async function main() {
  const restaurantName = getRequiredEnv('RESTAURANT_NAME');
  const restaurantAddress = getRequiredEnv('RESTAURANT_ADDRESS');
  const contactPhone = process.env.RESTAURANT_CONTACT_PHONE?.trim() || '+0000000000';
  const adminName = getRequiredEnv('INITIAL_ADMIN_NAME');
  const adminEmail = getRequiredEnv('INITIAL_ADMIN_EMAIL');
  const adminStaffCode = getRequiredEnv('INITIAL_ADMIN_STAFF_CODE').toUpperCase();
  const adminPassword = getRequiredEnv('INITIAL_ADMIN_PASSWORD');
  const language = process.env.RESTAURANT_LANGUAGE?.trim() || 'ar';
  const direction = process.env.RESTAURANT_DIRECTION?.trim() || 'rtl';
  const locale = process.env.RESTAURANT_LOCALE?.trim() || 'ar-DZ';
  const dateFormat = process.env.RESTAURANT_DATE_FORMAT?.trim() || 'dd/MM/yyyy';
  const currency = process.env.RESTAURANT_CURRENCY?.trim() || 'DZD';

  const restaurant = await ensureRestaurant({
    restaurantName,
    restaurantAddress,
    contactPhone,
    language,
    direction,
    locale,
    dateFormat,
    currency,
  });

  const admin = await ensureAdminUser(restaurant.id, {
    name: adminName,
    email: adminEmail,
    staffCode: adminStaffCode,
    password: adminPassword,
  });

  console.log('Production initialization completed successfully.');
  console.log(`restaurantId: ${restaurant.id}`);
  console.log(`adminUserId: ${admin.id}`);
  console.log(`adminStaffCode: ${adminStaffCode}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
