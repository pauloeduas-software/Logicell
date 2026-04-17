/*
  Warnings:

  - You are about to drop the column `dt_emissao` on the `Operacao` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Operacao" DROP COLUMN "dt_emissao",
ADD COLUMN     "dt_emissao_" TIMESTAMP(3);
