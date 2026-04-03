import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ log: ["error"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;

// Retry wrapper for Neon cold-start errors
export async function withRetry<T>(fn: () => Promise<T>, retries = 5, delayMs = 2000): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      const code = err?.code ?? "";
      const msg = err?.message ?? "";
      const isConnectionError =
        code === "P1001" || code === "P1008" || code === "P2024" ||
        msg.includes("ConnectionReset") || msg.includes("Closed") ||
        msg.includes("timed out") || msg.includes("ECONNRESET") ||
        msg.includes("Can't reach database");
      if (isConnectionError && i < retries - 1) {
        await new Promise(r => setTimeout(r, delayMs * (i + 1)));
        try { await prisma.$disconnect(); } catch {}
        try { await prisma.$connect(); } catch {}
        continue;
      }
      throw err;
    }
  }
  throw new Error("Max retries reached");
}
