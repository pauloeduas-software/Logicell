/*
  Warnings:

  - You are about to drop the `ItemListaTrabalho` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ItemListaTrabalho" DROP CONSTRAINT "ItemListaTrabalho_operacaoId_fkey";

-- DropTable
DROP TABLE "ItemListaTrabalho";

-- CreateTable
CREATE TABLE "Pasta" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pasta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemPasta" (
    "id" SERIAL NOT NULL,
    "pastaId" INTEGER NOT NULL,
    "operacaoId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ItemPasta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ItemPasta_pastaId_operacaoId_key" ON "ItemPasta"("pastaId", "operacaoId");

-- AddForeignKey
ALTER TABLE "ItemPasta" ADD CONSTRAINT "ItemPasta_pastaId_fkey" FOREIGN KEY ("pastaId") REFERENCES "Pasta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemPasta" ADD CONSTRAINT "ItemPasta_operacaoId_fkey" FOREIGN KEY ("operacaoId") REFERENCES "Operacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
