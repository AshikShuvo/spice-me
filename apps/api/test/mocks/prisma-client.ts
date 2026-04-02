/**
 * Stub for e2e/unit Jest (CJS): generated Prisma client uses `import.meta`, which Jest does not load by default.
 */
export class PrismaClient {
  user = {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_options?: unknown) {}

  async $connect(): Promise<void> {
    return Promise.resolve();
  }

  async $disconnect(): Promise<void> {
    return Promise.resolve();
  }
}

export const Prisma = {};
