const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const image = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=85`;
const hero = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1800&q=90`;

const menuImages = {
  'Algerian Menu': {
    image: image('photo-1547592180-85f173990554'),
    heroImage: hero('photo-1547592166-23ac45744acd'),
  },
  'European Menu': {
    image: image('photo-1473093295043-cdd812d0e601'),
    heroImage: hero('photo-1498579150354-977475b7ea0b'),
  },
  'American Menu': {
    image: image('photo-1550547660-d9450f859349'),
    heroImage: hero('photo-1551782450-a2132b4ba21d'),
  },
  'Drinks Menu': {
    image: image('photo-1513558161293-cdaf765ed2fd'),
    heroImage: hero('photo-1544145945-f90425340c7e'),
  },
};

const itemImages = {
  'Classic Burger': image('photo-1568901346375-23c9450c58cd'),
  'Margherita Pizza': image('photo-1604382355076-af4b0eb60143'),
  'Mint Tea': image('photo-1564890369478-c89ca6d9cde9'),
  'Couscous with Lamb': image('photo-1541518763669-27fef04b14ea'),
  'Pasta Carbonara': image('photo-1612874742237-6526221588e3'),
  'Fried Chicken': image('photo-1626645738196-c2a7c87a8f58'),
  Chakhchoukha: image('photo-1547592180-85f173990554'),
  Espresso: image('photo-1510707577719-ae7c14805e3a'),
  'BBQ Wings': image('photo-1527477396000-e27163b481c2'),
  'Rechta with Chicken': image('photo-1569718212165-3a8278d5f624'),
  'Steak Frites': image('photo-1558030006-450675393462'),
  Cappuccino: image('photo-1572442388796-11668a67e53d'),
  'Caesar Salad': image('photo-1546793665-c74683f339c1'),
  'Chorba Frik': image('photo-1547592166-23ac45744acd'),
  'Orange Juice': image('photo-1600271886742-f049cd451bba'),
  'Hot Dog': image('photo-1619740455993-9e612b1af08a'),
  'Meat Bourek': image('photo-1601050690597-df0568f70950'),
  'Mint Lemonade': image('photo-1556679343-c7306c1976bc'),
  Lasagna: image('photo-1574894709920-11b28e7367e3'),
  'Mac and Cheese': image('photo-1543339494-b4cd4f7ba686'),
  Pancakes: image('photo-1528207776546-365bb710ee93'),
  'Grilled Salmon': image('photo-1467003909585-2f8a72700288'),
  'Spicy Mhadjeb': image('photo-1565299507177-b0ac66763828'),
  'Virgin Mojito': image('photo-1551538827-9c037cb4f32a'),
  'Mineral Water': image('photo-1523362628745-0c100150b504'),
  'Soft Drink': image('photo-1622483767028-3f66f32aef97'),
};

function itemKey(item) {
  return item.nameEn?.trim() || item.name?.trim();
}

function menuKey(menu) {
  return menu.nameEn?.trim() || menu.name?.trim();
}

async function main() {
  const menus = await prisma.menu.findMany({
    select: { id: true, name: true, nameEn: true },
  });
  const menuUpdates = menus
    .map((menu) => ({ menu, images: menuImages[menuKey(menu)] }))
    .filter((entry) => entry.images);

  const items = await prisma.menuItem.findMany({
    select: { id: true, name: true, nameEn: true },
  });
  const itemUpdates = items
    .map((item) => ({ item, image: itemImages[itemKey(item)] }))
    .filter((entry) => entry.image);

  await prisma.$transaction([
    ...menuUpdates.map(({ menu, images }) =>
      prisma.menu.update({
        where: { id: menu.id },
        data: images,
      }),
    ),
    ...itemUpdates.map(({ item, image: nextImage }) =>
      prisma.menuItem.update({
        where: { id: item.id },
        data: { image: nextImage },
      }),
    ),
  ]);

  console.log(`Updated ${menuUpdates.length} menus and ${itemUpdates.length} menu items.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
