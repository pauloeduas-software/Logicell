import { prisma } from "./db.server";

export class DashboardService {
  /**
   * Agrega todos os dados necessários para o render principal do Dashboard
   * Focado inteiramente em Analytics, livre das regras de negócio de CRUD.
   */
  static async getDashboardMetrics() {
    const [totais, porAgencia, porProduto, ultimasImportacoes, statusSummary, topOrigens, topDestinos] = await Promise.all([
      prisma.operacao.aggregate({ _sum: { vl_total: true, vl_peso: true }, _count: { id: true } }),
      prisma.operacao.groupBy({ by: ["nm_agencia"], _sum: { vl_total: true }, orderBy: { _sum: { vl_total: "desc" } }, take: 15 }),
      prisma.operacao.groupBy({ by: ["nm_produto"], _count: { id: true }, orderBy: { _count: { id: "desc" } }, take: 15 }),
      prisma.importacao.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
      // Todos os status presentes no banco
      prisma.operacao.groupBy({ by: ["status"], _count: { id: true } }),
      // Top Rotas
      prisma.operacao.groupBy({ by: ["nm_cidade_origem"], _count: { id: true }, orderBy: { _count: { id: "desc" } }, take: 10 }),
      prisma.operacao.groupBy({ by: ["nm_cidade_destino"], _count: { id: true }, orderBy: { _count: { id: "desc" } }, take: 10 })
    ]);

    // OTIMIZAÇÃO: Busca TODAS as contagens de status e pastas em uma ÚNICA query de agregação
    const allCounts = await prisma.operacao.groupBy({
      by: ['status', 'pastaId'],
      _count: { id: true },
      where: { NOT: { status: null } }
    });

    const todasPastas = await prisma.pasta.findMany({ select: { id: true, nome: true } });
    const detailedBreakdowns: Record<string, { id: number | null, label: string, count: number }[]> = {};

    allCounts.forEach(item => {
      const status = item.status!;
      if (!detailedBreakdowns[status]) detailedBreakdowns[status] = [];
      
      if (item.pastaId === null) {
        detailedBreakdowns[status].push({ id: null, label: "Caixa de Entrada", count: item._count.id });
      } else {
        const pasta = todasPastas.find(p => p.id === item.pastaId);
        if (pasta) {
          detailedBreakdowns[status].push({ id: pasta.id, label: pasta.nome, count: item._count.id });
        }
      }
    });

    return { 
      totais: {
        _sum: {
          vl_total: Number(totais._sum.vl_total || 0),
          vl_peso: Number(totais._sum.vl_peso || 0)
        },
        _count: { id: totais._count.id },
        statusMap: statusSummary.reduce((acc: any, curr) => {
          if (curr.status) acc[curr.status] = curr._count.id;
          return acc;
        }, {})
      },
      detailedBreakdowns,
      porAgencia: porAgencia.map(a => ({
        nm_agencia: a.nm_agencia,
        _sum: { vl_total: Number(a._sum.vl_total || 0) }
      })),
      porProduto,
      topOrigens,
      topDestinos,
      ultimasImportacoes 
    };
  }
}
