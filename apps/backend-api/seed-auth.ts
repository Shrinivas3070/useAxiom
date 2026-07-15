import 'dotenv/config';
import { PrismaClient, Role } from '@useaxiom/database';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'mockmanager@useaxiom.com' },
    update: {
      passwordHash,
      role: 'MANAGER',
    },
    create: {
      email: 'mockmanager@useaxiom.com',
      passwordHash,
      name: 'Test Manager',
      phoneNumber: '+19998887777',
      role: 'MANAGER',
    },
  });

  console.log('Seeded test manager:', user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
