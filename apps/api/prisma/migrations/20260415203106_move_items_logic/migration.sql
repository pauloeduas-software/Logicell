/*
  Warnings:

  - You are about to drop the `ItemPasta` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ItemPasta" DROP CONSTRAINT "ItemPasta_operacaoId_fkey";

-- DropForeignKey
ALTER TABLE "ItemPasta" DROP CONSTRAINT "ItemPasta_pastaId_fkey";

-- AlterTable
ALTER TABLE "Operacao" ADD COLUMN     "pastaId" INTEGER;

-- DropTable
DROP TABLE "ItemPasta";

-- AddForeignKey
ALTER TABLE "Operacao" ADD CONSTRAINT "Operacao_pastaId_fkey" FOREIGN KEY ("pastaId") REFERENCES "Pasta"("id") ON DELETE SET NULL ON UPDATE CASCADE;
