/*
  Warnings:

  - A unique constraint covering the columns `[nm_agencia,nr_ctrc,nr_nf,vl_total,dt_emissao_]` on the table `Operacao` will be added. If there are existing duplicate values, this will fail.
  - Made the column `nm_agencia` on table `Operacao` required. This step will fail if there are existing NULL values in that column.
  - Made the column `nr_ctrc` on table `Operacao` required. This step will fail if there are existing NULL values in that column.
  - Made the column `vl_total` on table `Operacao` required. This step will fail if there are existing NULL values in that column.
  - Made the column `nr_nf` on table `Operacao` required. This step will fail if there are existing NULL values in that column.
  - Made the column `dt_emissao_` on table `Operacao` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Operacao_nr_ctrc_key";

-- AlterTable
ALTER TABLE "Operacao" ALTER COLUMN "nm_agencia" SET NOT NULL,
ALTER COLUMN "nr_ctrc" SET NOT NULL,
ALTER COLUMN "vl_total" SET NOT NULL,
ALTER COLUMN "nr_nf" SET NOT NULL,
ALTER COLUMN "dt_emissao_" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Operacao_nm_agencia_nr_ctrc_nr_nf_vl_total_dt_emissao__key" ON "Operacao"("nm_agencia", "nr_ctrc", "nr_nf", "vl_total", "dt_emissao_");
