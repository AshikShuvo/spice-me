import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '../generated/prisma/client.js';
import { Role } from '../generated/prisma/enums.js';

const DEFAULT_ADMIN_EMAIL = 'admin@spiceme.com';

/** Plaintext password set on every seed run (override with DEFAULT_ADMIN_PASSWORD). */
function defaultAdminPassword(): string {
  return process.env.DEFAULT_ADMIN_PASSWORD ?? 'Admin@123';
}

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required for seed');
  }
  const adapter = new PrismaPg(connectionString);
  const prisma = new PrismaClient({ adapter });

  const email = DEFAULT_ADMIN_EMAIL;
  const password = defaultAdminPassword();
  const passwordHash = await bcrypt.hash(password, 10);

  const existed = await prisma.user.findUnique({ where: { email } });

  await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: 'Default Admin',
      password: passwordHash,
      role: Role.ADMIN,
    },
    update: {
      password: passwordHash,
      role: Role.ADMIN,
      isActive: true,
    },
  });

  console.log(
    existed
      ? `Reset default admin password: ${email} / ${password}`
      : `Seeded default admin: ${email} / ${password}`,
  );
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
