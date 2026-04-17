import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;

declare global {
  var __db__: PrismaClient;
}

// Isso é necessário porque em desenvolvimento o Vite recarrega o arquivo, 
// e não queremos criar novas conexões com o banco toda vez.
if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  if (!global.__db__) {
    global.__db__ = new PrismaClient();
  }
  prisma = global.__db__;
  prisma.$connect();
}

export { prisma };
