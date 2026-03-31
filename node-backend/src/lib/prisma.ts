import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ log: ["error"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;

// Retry wrapper for Neon cold-start (P1001 / connection reset errors)
export async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 1000): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      const isConnectionError = err?.code === "P1001" || err?.message?.includes("ConnectionReset") || err?.message?.includes("Closed");
      if (isConnectionError && i < retries - 1) {
        await new Promise(r => setTimeout(r, delayMs));
        try { await prisma.$connect(); } catch {}
        continue;
      }
      throw err;
    }
  }
  throw new Error("Max retries reached");
}
