import prisma from "../lib/prisma.server";
import { PastaService } from "./pasta.server";
import { OperacaoService } from "./operacao.server";
import { SupabaseAdminService } from "./supabase-admin.server";

// Agrupamento genérico por uma dimensão (status, agência, tipo de documento...).
export interface DashboardGrupo {
  chave: string | null;
  valor: number;
  quantidade: number;
}

export interface DashboardGeral {
  valorTotal: number;
  quantidade: number;
  totalPastas: number;
  totalFaturistas: number;
  emissaoAntigas: number;
  emissaoAntigasValor: number;
  porFaturista: DashboardGrupo[];
  porStatus: DashboardGrupo[];
  porTipoDocumento: DashboardGrupo[];
  porAgencia: DashboardGrupo[];
  porTipoCte: DashboardGrupo[];
  topPagadores: DashboardGrupo[];
}

export interface DashboardPastaResumo {
  pastaId: number | null;
  nome: string;
  cor: string | null;
  faturistaId: string | null;
  faturistaNome: string | null;
  valor: number;
  quantidade: number;
  emissaoAntigas: number;
  emissaoAntigasValor: number;
  primeiraEmissao: string | null;
  ultimaEmissao: string | null;
}

export interface DashboardPastaDetalhe {
  pasta: DashboardPastaResumo;
  porStatus: DashboardGrupo[];
  porTipoDocumento: DashboardGrupo[];
  porAgencia: DashboardGrupo[];
  porTipoCte: DashboardGrupo[];
  topPagadores: DashboardGrupo[];
}

export interface DashboardResumo {
  geral: DashboardGeral;
  pastas: DashboardPastaResumo[];
}

interface GrupoPasta {
  valor: number;
  quantidade: number;
  primeira: Date | null;
  ultima: Date | null;
}

type AntigasMap = Record<string, { quantidade: number; valor: number }>;

// Todas as dimensões em UMA ida ao banco (GROUPING SETS) em vez de 6 groupBy.
// O custo dominante aqui é a latência de rede (VPS → banco), não a query em si.
const SQL_DIMENSOES_GLOBAIS = `
  SELECT
    "status" AS d_status,
    "id_tipo_documento" AS d_tipo,
    "nm_agencia" AS d_agencia,
    "id_tipo_ctrc" AS d_cte,
    "nm_pessoa_pagador" AS d_pagador,
    COALESCE(SUM("vl_total"), 0) AS valor,
    COUNT(*)::int AS quantidade,
    GROUPING("status") AS g_status,
    GROUPING("id_tipo_documento") AS g_tipo,
    GROUPING("nm_agencia") AS g_agencia,
    GROUPING("id_tipo_ctrc") AS g_cte,
    GROUPING("nm_pessoa_pagador") AS g_pagador
  FROM "Operacao"
  GROUP BY GROUPING SETS (("status"), ("id_tipo_documento"), ("nm_agencia"), ("id_tipo_ctrc"), ("nm_pessoa_pagador"))
`;

// Mesma coisa, mas filtrada por pasta + linha de total com MIN/MAX de emissão.
const SQL_DIMENSOES_PASTA = `
  SELECT
    "status" AS d_status,
    "id_tipo_documento" AS d_tipo,
    "nm_agencia" AS d_agencia,
    "id_tipo_ctrc" AS d_cte,
    "nm_pessoa_pagador" AS d_pagador,
    COALESCE(SUM("vl_total"), 0) AS valor,
    COUNT(*)::int AS quantidade,
    MIN("dt_emissao_") AS primeira,
    MAX("dt_emissao_") AS ultima,
    GROUPING("status") AS g_status,
    GROUPING("id_tipo_documento") AS g_tipo,
    GROUPING("nm_agencia") AS g_agencia,
    GROUPING("id_tipo_ctrc") AS g_cte,
    GROUPING("nm_pessoa_pagador") AS g_pagador
  FROM "Operacao"
  WHERE "pastaId" IS NOT DISTINCT FROM $1
  GROUP BY GROUPING SETS (("status"), ("id_tipo_documento"), ("nm_agencia"), ("id_tipo_ctrc"), ("nm_pessoa_pagador"), ())
`;

interface ParsedDimensoes {
  porStatus: DashboardGrupo[];
  porTipoDocumento: DashboardGrupo[];
  porAgencia: DashboardGrupo[];
  porTipoCte: DashboardGrupo[];
  porPagador: DashboardGrupo[];
  agregado?: { valor: number; quantidade: number; primeira: Date | null; ultima: Date | null };
}

function parsearGroupingSets(rows: any[]): ParsedDimensoes {
  const porStatus: DashboardGrupo[] = [];
  const porTipoDocumento: DashboardGrupo[] = [];
  const porAgencia: DashboardGrupo[] = [];
  const porTipoCte: DashboardGrupo[] = [];
  const porPagador: DashboardGrupo[] = [];
  let agregado: ParsedDimensoes["agregado"];

  for (const r of rows) {
    const valor = Number(r.valor) || 0;
    const quantidade = Number(r.quantidade) || 0;
    if (r.g_status === 0) porStatus.push({ chave: r.d_status ?? null, valor, quantidade });
    else if (r.g_tipo === 0) porTipoDocumento.push({ chave: r.d_tipo ?? null, valor, quantidade });
    else if (r.g_agencia === 0) porAgencia.push({ chave: r.d_agencia ?? null, valor, quantidade });
    else if (r.g_cte === 0) porTipoCte.push({ chave: r.d_cte ?? null, valor, quantidade });
    else if (r.g_pagador === 0) porPagador.push({ chave: r.d_pagador ?? null, valor, quantidade });
    else agregado = { valor, quantidade, primeira: r.primeira ?? null, ultima: r.ultima ?? null };
  }

  const sortDesc = (arr: DashboardGrupo[]) => arr.sort((a, b) => b.valor - a.valor);
  return {
    porStatus: sortDesc(porStatus),
    porTipoDocumento: sortDesc(porTipoDocumento),
    porAgencia: sortDesc(porAgencia),
    porTipoCte: sortDesc(porTipoCte),
    porPagador: sortDesc(porPagador),
    agregado,
  };
}

//DashboardService
//Responsabilidade: visão geral, lista de pastas e detalhamento por pasta.
//Otimizado para a latência do banco: poucas idas ao banco + cache em memória.
export class DashboardService {
  // Nomes dos faturistas vêm do Supabase (rede) — cache longo.
  private static nomesCache: Map<string, string> | null = null;
  private static nomesCacheTime = 0;
  private static readonly NOMES_TTL = 1000 * 60 * 10; // 10 minutos

  // O resumo inteiro é cacheado no servidor: o client já faz polling de 30s,
  // então o custo alto (rede + Supabase) acontece no máximo 1x por 30s.
  private static resumoCache: DashboardResumo | null = null;
  private static resumoCacheTime = 0;
  private static readonly RESUMO_TTL = 1000 * 30;

  private static async nomesFaturista(): Promise<Map<string, string>> {
    if (this.nomesCache && Date.now() - this.nomesCacheTime < this.NOMES_TTL) {
      return this.nomesCache;
    }
    const nomes = new Map<string, string>();
    try {
      const { usuarios } = await SupabaseAdminService.listarUsuarios(1, 1000);
      for (const u of usuarios) nomes.set(u.id, u.nome || u.email);
    } catch {
      // mantém fallback (id) se o Supabase falhar
    }
    this.nomesCache = nomes;
    this.nomesCacheTime = Date.now();
    return nomes;
  }

  private static montarResumoPasta(
    info: { id: number | null; nome: string; cor: string | null; faturistaId: string | null },
    grupo: GrupoPasta | null,
    antigas: { quantidade: number; valor: number } | null,
    nomes: Map<string, string>
  ): DashboardPastaResumo {
    const valor = grupo?.valor ?? 0;
    const quantidade = grupo?.quantidade ?? 0;
    return {
      pastaId: info.id,
      nome: info.nome,
      cor: info.cor,
      faturistaId: info.faturistaId,
      faturistaNome: info.faturistaId ? nomes.get(info.faturistaId) || "Faturista" : null,
      valor,
      quantidade,
      emissaoAntigas: antigas?.quantidade ?? 0,
      emissaoAntigasValor: antigas?.valor ?? 0,
      primeiraEmissao: grupo?.primeira ? grupo.primeira.toISOString() : null,
      ultimaEmissao: grupo?.ultima ? grupo.ultima.toISOString() : null,
    };
  }

  static async resumo(): Promise<DashboardResumo> {
    if (this.resumoCache && Date.now() - this.resumoCacheTime < this.RESUMO_TTL) {
      return this.resumoCache;
    }

    const [gruposPasta, pastas, antigas, nomes, rowsDimensoes] = await Promise.all([
      prisma.operacao.groupBy({
        by: ["pastaId"],
        _sum: { vl_total: true },
        _count: { _all: true },
        _min: { dt_emissao_: true },
        _max: { dt_emissao_: true },
      }),
      PastaService.listar().catch(() => []),
      OperacaoService.emissoesAntigasPorPasta().catch((): AntigasMap => ({})),
      this.nomesFaturista(),
      prisma.$queryRawUnsafe<any[]>(SQL_DIMENSOES_GLOBAIS),
    ]);

    const { porStatus, porTipoDocumento, porAgencia, porTipoCte, porPagador } =
      parsearGroupingSets(rowsDimensoes);

    const grupoPorPasta = new Map<number | null, GrupoPasta>();
    for (const g of gruposPasta) {
      grupoPorPasta.set(g.pastaId, {
        valor: Number(g._sum.vl_total ?? 0),
        quantidade: g._count._all,
        primeira: g._min.dt_emissao_,
        ultima: g._max.dt_emissao_,
      });
    }

    const pastasResumo: DashboardPastaResumo[] = pastas.map((p) =>
      this.montarResumoPasta(
        { id: p.id, nome: p.nome, cor: p.cor, faturistaId: p.faturistaId },
        grupoPorPasta.get(p.id) ?? null,
        antigas[String(p.id)] ?? null,
        nomes
      )
    );

    // Caixa de Entrada (pastaId null) entra na lista apenas se tiver documentos.
    const grupoInbox = grupoPorPasta.get(null);
    if (grupoInbox) {
      pastasResumo.push(
        this.montarResumoPasta(
          { id: null, nome: "Caixa de Entrada", cor: null, faturistaId: null },
          grupoInbox,
          antigas["inbox"] ?? null,
          nomes
        )
      );
    }

    pastasResumo.sort((a, b) => b.valor - a.valor);

    const valorTotal = gruposPasta.reduce((s, g) => s + Number(g._sum.vl_total ?? 0), 0);
    const quantidade = gruposPasta.reduce((s, g) => s + g._count._all, 0);
    const emissaoAntigas = Object.values(antigas).reduce((s, a) => s + a.quantidade, 0);
    const emissaoAntigasValor = Object.values(antigas).reduce((s, a) => s + a.valor, 0);
    const faturistas = new Set(pastas.map((p) => p.faturistaId).filter(Boolean));

    // Soma do valor total dos documentos por faturista responsável pela pasta.
    const acumuladoFaturista = new Map<string, DashboardGrupo>();
    for (const p of pastasResumo) {
      const chave = p.faturistaNome ?? "Sem faturista";
      const item = acumuladoFaturista.get(chave) ?? { chave, valor: 0, quantidade: 0 };
      item.valor += p.valor;
      item.quantidade += p.quantidade;
      acumuladoFaturista.set(chave, item);
    }
    const porFaturista = [...acumuladoFaturista.values()]
      .filter((g) => g.quantidade > 0)
      .sort((a, b) => b.valor - a.valor);

    const resumo: DashboardResumo = {
      geral: {
        valorTotal,
        quantidade,
        totalPastas: pastas.length,
        totalFaturistas: faturistas.size,
        emissaoAntigas,
        emissaoAntigasValor,
        porFaturista,
        porStatus,
        porTipoDocumento,
        porAgencia,
        porTipoCte,
        topPagadores: porPagador.slice(0, 10),
      },
      pastas: pastasResumo,
    };

    this.resumoCache = resumo;
    this.resumoCacheTime = Date.now();
    return resumo;
  }

  static async pastaDetalhe(pastaId: number | null): Promise<DashboardPastaDetalhe> {
    const [rows, nomes] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(SQL_DIMENSOES_PASTA, pastaId),
      this.nomesFaturista(),
    ]);

    const { porStatus, porTipoDocumento, porAgencia, porTipoCte, porPagador, agregado } =
      parsearGroupingSets(rows);

    let info: { id: number | null; nome: string; cor: string | null; faturistaId: string | null };
    let antigas: { quantidade: number; valor: number } | null = null;

    if (pastaId === null) {
      info = { id: null, nome: "Caixa de Entrada", cor: null, faturistaId: null };
      antigas = (await OperacaoService.emissoesAntigasPorPasta().catch((): AntigasMap => ({})))["inbox"] ?? null;
    } else {
      const pasta = await PastaService.buscarPorId(pastaId);
      if (!pasta) {
        const err: any = new Error("Pasta não encontrada.");
        err.status = 404;
        throw err;
      }
      info = { id: pasta.id, nome: pasta.nome, cor: pasta.cor, faturistaId: pasta.faturistaId };
      antigas = (await OperacaoService.emissoesAntigasPorPasta().catch((): AntigasMap => ({})))[String(pastaId)] ?? null;
    }

    const grupo: GrupoPasta = {
      valor: agregado?.valor ?? 0,
      quantidade: agregado?.quantidade ?? 0,
      primeira: agregado?.primeira ?? null,
      ultima: agregado?.ultima ?? null,
    };

    return {
      pasta: this.montarResumoPasta(info, grupo, antigas, nomes),
      porStatus,
      porTipoDocumento,
      porAgencia,
      porTipoCte,
      topPagadores: porPagador.slice(0, 10),
    };
  }
}