import { prisma } from "../src/lib/prisma";

async function main() {
  // Add seed data here as models are introduced.
  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
