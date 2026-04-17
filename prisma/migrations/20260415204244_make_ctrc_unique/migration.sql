/*
  Warnings:

  - A unique constraint covering the columns `[nr_ctrc]` on the table `Operacao` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Operacao_nr_ctrc_key" ON "Operacao"("nr_ctrc");
