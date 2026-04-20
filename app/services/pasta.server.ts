import { prisma } from "./db.server";

export class PastaService {
  private static cache: any[] | null = null;
  private static cacheTime = 0;
  private static readonly TTL = 1000 * 60; // 1 minuto

  private static invalidarCache() {
    this.cache = null;
    this.cacheTime = 0;
  }

  static async listar() {
    if (this.cache && (Date.now() - this.cacheTime < this.TTL)) {
      return this.cache;
    }
    const data = await prisma.pasta.findMany({
      orderBy: { nome: "asc" },
      include: {
        _count: {
          select: { operacoes: true }
        }
      }
    });
    this.cache = data;
    this.cacheTime = Date.now();
    return data;
  }

  static async criar(nome: string) {
    this.invalidarCache();
    return prisma.pasta.create({
      data: { nome }
    });
  }

  static async atualizar(id: number, nome: string) {
    this.invalidarCache();
    return prisma.pasta.update({
      where: { id },
      data: { nome }
    });
  }

  static async excluir(id: number) {
    this.invalidarCache();
    return prisma.pasta.delete({
      where: { id }
    });
  }
}
