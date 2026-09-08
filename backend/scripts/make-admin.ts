import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const email = 'bhatiajaspreet161@gmail.com';
  const user = await prisma.user.update({
    where: { email },
    data: { role: 'Admin' }
  });
  console.log(`Successfully elevated ${user.email} to Admin!`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
