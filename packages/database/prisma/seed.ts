import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: "dev-tenant" },
    update: {},
    create: {
      name: "Development Tenant",
      slug: "dev-tenant",
      status: "active",
    },
  });
  console.log("Seeded tenant:", tenant.id, tenant.slug);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
