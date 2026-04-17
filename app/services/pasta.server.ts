import { prisma } from "./db.server";

export class PastaService {
  static async listar() {
    return prisma.pasta.findMany({
      orderBy: { nome: "asc" },
      include: {
        _count: {
          select: { operacoes: true }
        }
      }
    });
  }

  static async criar(nome: string) {
    return prisma.pasta.create({
      data: { nome }
    });
  }

  static async atualizar(id: number, nome: string) {
    return prisma.pasta.update({
      where: { id },
      data: { nome }
    });
  }

  static async excluir(id: number) {
    return prisma.pasta.delete({
      where: { id }
    });
  }
}
