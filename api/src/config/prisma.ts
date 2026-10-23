import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

// omit global: nenhuma consulta devolve o hash da senha, a não ser que peça explicitamente
export const prisma = new PrismaClient({
  adapter,
  omit: { secretario: { senha: true } },
});
