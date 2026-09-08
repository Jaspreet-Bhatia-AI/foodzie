const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'bhatiajaspreet161@gmail.com' } });
  console.log(user ? 'USER_EXISTS: ' + user.role : 'NO_USER');
}
main().finally(() => prisma.$disconnect());
