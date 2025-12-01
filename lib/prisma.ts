import { PrismaClient } from "@/app/generated/prisma/client";


declare global {
  var prisma: PrismaClient | undefined;
}

const url = process.env.PRISMA_DATA_PROXY_URL || "dummy"

export const prisma =
  global.prisma ??
  new PrismaClient({accelerateUrl: url});

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
