-- AlterTable
ALTER TABLE "Operacao" ADD COLUMN     "importacaoId" INTEGER;

-- CreateTable
CREATE TABLE "Importacao" (
    "id" SERIAL NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "usuario" TEXT NOT NULL,
    "qtdRegistros" INTEGER NOT NULL,
    "hashArquivo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Importacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Auditoria" (
    "id" SERIAL NOT NULL,
    "operacaoId" INTEGER NOT NULL,
    "campo" TEXT NOT NULL,
    "valorAntigo" TEXT,
    "valorNovo" TEXT,
    "usuario" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemListaTrabalho" (
    "id" SERIAL NOT NULL,
    "operacaoId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ItemListaTrabalho_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Importacao_hashArquivo_key" ON "Importacao"("hashArquivo");

-- CreateIndex
CREATE UNIQUE INDEX "ItemListaTrabalho_operacaoId_key" ON "ItemListaTrabalho"("operacaoId");

-- AddForeignKey
ALTER TABLE "Operacao" ADD CONSTRAINT "Operacao_importacaoId_fkey" FOREIGN KEY ("importacaoId") REFERENCES "Importacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auditoria" ADD CONSTRAINT "Auditoria_operacaoId_fkey" FOREIGN KEY ("operacaoId") REFERENCES "Operacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemListaTrabalho" ADD CONSTRAINT "ItemListaTrabalho_operacaoId_fkey" FOREIGN KEY ("operacaoId") REFERENCES "Operacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
