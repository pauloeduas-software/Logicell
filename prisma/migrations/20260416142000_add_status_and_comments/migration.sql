-- AlterTable
ALTER TABLE "Operacao" ADD COLUMN     "comentarios" TEXT,
ADD COLUMN     "status" TEXT DEFAULT 'PENDENTE';
