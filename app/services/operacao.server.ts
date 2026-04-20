import { prisma } from "./db.server";
import * as XLSX from "xlsx";
import crypto from "crypto";
import { z } from "zod";
import { PastaService } from "./pasta.server";

const OperacaoSchema = z.object({
  nm_agencia: z.string().min(1),
  dt_emissao_: z.date().nullable(),
  cd_pessoa_pagador: z.string().nullable().optional(),
  nm_pessoa_pagador: z.string().nullable().optional(),
  nr_cpf_cnpj_raiz: z.string().nullable().optional(),
  nr_cpf_cnpj_pagador: z.string().nullable().optional(),
  nr_ctrc: z.string().min(1),
  id_tipo_documento: z.string().nullable().optional(),
  nm_pessoa_remetente: z.string().nullable().optional(),
  nm_cidade_origem: z.string().nullable().optional(),
  ds_sigla_origem: z.string().nullable().optional(),
  nm_pessoa_destinatario: z.string().nullable().optional(),
  nm_cidade_destino: z.string().nullable().optional(),
  ds_sigla_destino: z.string().nullable().optional(),
  nm_produto: z.string().nullable().optional(),
  vl_peso: z.number().nullable().optional().default(0),
  vl_tarifa: z.number().nullable().optional().default(0),
  vl_total: z.number().nullable().optional().default(0),
  nr_nf: z.string().nullable().optional(),
  ds_placa: z.string().nullable().optional(),
  nm_pessoa_matriz: z.string().nullable().optional(),
  nr_contrato: z.string().nullable().optional(),
  nr_chave_acesso: z.string().nullable().optional(),
  nm_pessoa_usuario_lancamento: z.string().nullable().optional(),
  id_tipo_ctrc: z.string().nullable().optional(),
  nm_proprietario_posse_cavalo: z.string().nullable().optional(),
  nm_motorista: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  comentarios: z.string().nullable().optional(),
});

export class OperacaoService {
  private static agenciasCache: string[] | null = null;
  private static agenciasCacheTime = 0;
  private static inboxCountCache: number | null = null;
  private static inboxCountCacheTime = 0;
  private static readonly CACHE_TTL = 1000 * 60 * 5; // 5 minutos
  private static readonly SHORT_TTL = 1000 * 30;    // 30 segundos

  private static invalidarCache() {
    this.agenciasCache = null;
    this.agenciasCacheTime = 0;
    this.inboxCountCache = null;
    this.inboxCountCacheTime = 0;
    // Garante que o painel lateral atualize as contagens
    PastaService.invalidarCache();
  }

  private static padronizarAgencia(nome: string): string {
    if (!nome) return "";
    return nome.toUpperCase().replace(/\s+/g, " ").replace(/\s*-\s*/g, " - ").trim();
  }

  static async processarPlanilha(buffer: Buffer, originalName: string, usuario: string = "Sistema") {
    this.invalidarCache();
    const hash = crypto.createHash("md5").update(buffer).digest("hex");
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData: any[] = XLSX.utils.sheet_to_json(sheet, { range: 1 });

    if (rawData.length === 0) throw new Error("Planilha vazia");

    const importacao = await prisma.importacao.create({
      data: { nomeArquivo: originalName, usuario, qtdRegistros: rawData.length, hashArquivo: hash }
    });

    const operacoes = rawData.map((row) => {
      const get = (keys: string[]) => {
        for (const key of keys) {
          const val = row[key];
          if (val !== undefined && val !== null && String(val).trim() !== "") return val;
        }
        return null;
      };

      const op = {
        importacaoId: importacao.id,
        nm_agencia: this.padronizarAgencia(String(get(["nm_agencia", "AGÊNCIA", "AGENCIA"]) || "DESCONHECIDA")),
        dt_emissao_: get(["dt_emissao_", "DATA EMISSÃO", "EMISSÃO", "EMISSAO"]) ? new Date(get(["dt_emissao_", "DATA EMISSÃO", "EMISSÃO", "EMISSAO"]) as any) : null,
        cd_pessoa_pagador: String(get(["cd_pessoa_pagador", "CÓD. PAGADOR", "COD PAGADOR", "CÓDIGO"]) || ""),
        nm_pessoa_pagador: String(get(["nm_pessoa_pagador", "PAGADOR", "CLIENTE"]) || ""),
        nr_cpf_cnpj_raiz: String(get(["nr_cpf_cnpj_raiz", "CNPJ RAIZ", "RAIZ"]) || ""),
        nr_cpf_cnpj_pagador: String(get(["nr_cpf_cnpj_pagador", "CPF/CNPJ PAGADOR", "CNPJ"]) || ""),
        nr_ctrc: String(get(["nr_ctrc", "CTRC", "CTE", "CT-E"]) || "0").trim(),
        id_tipo_documento: String(get(["id_tipo_documento", "TIPO DOC", "TIPO"]) || ""),
        nm_pessoa_remetente: String(get(["nm_pessoa_remetente", "REMETENTE"]) || ""),
        nm_cidade_origem: String(get(["nm_cidade_origem", "CIDADE ORIGEM", "ORIGEM"]) || ""),
        ds_sigla_origem: String(get(["ds_sigla_origem", "UF ORIGEM", "UF_ORI"]) || ""),
        nm_pessoa_destinatario: String(get(["nm_pessoa_destinatario", "DESTINATÁRIO", "DESTINATARIO"]) || ""),
        nm_cidade_destino: String(get(["nm_cidade_destino", "CIDADE DESTINO", "DESTINO"]) || ""),
        ds_sigla_destino: String(get(["ds_sigla_destino", "UF DESTINO", "UF_DES"]) || ""),
        nm_produto: String(get(["nm_produto", "PRODUTO"]) || ""),
        vl_peso: Number(get(["vl_peso", "PESO", "PESO REAL"]) || 0),
        vl_tarifa: Number(get(["vl_tarifa", "TARIFA"]) || 0),
        vl_total: get(["vl_total", "VALOR TOTAL", "TOTAL", "VALOR"]) ? Number(get(["vl_total", "VALOR TOTAL", "TOTAL", "VALOR"])) : null,
        nr_nf: get(["nr_nf", "NF", "NOTA FISCAL"]) ? String(get(["nr_nf", "NF", "NOTA FISCAL"])).trim() : null,
        ds_placa: String(get(["ds_placa", "PLACA"]) || ""),
        nm_pessoa_matriz: String(get(["nm_pessoa_matriz", "MATRIZ"]) || ""),
        nr_contrato: String(get(["nr_contrato", "CONTRATO"]) || ""),
        nr_chave_acesso: String(get(["nr_chave_acesso", "CHAVE ACESSO", "CHAVE DE ACESSO"]) || ""),
        nm_pessoa_usuario_lancamento: String(get(["nm_pessoa_usuario_lancamento", "USUÁRIO", "USUARIO"]) || ""),
        id_tipo_ctrc: String(get(["id_tipo_ctrc", "TIPO CTE", "TIPO CTe"]) || ""),
        nm_proprietario_posse_cavalo: String(get(["nm_proprietario_posse_cavalo", "PROPRIETÁRIO", "PROPRIETARIO"]) || ""),
        nm_motorista: String(get(["nm_motorista", "MOTORISTA"]) || ""),
        status: get(["status", "ANEXADO ATUA TICKET/NF"]) ? String(get(["status", "ANEXADO ATUA TICKET/NF"])).trim().toUpperCase() : null,
        comentarios: get(["comentarios", "OBSERVAÇÃO", "OBSERVACAO"]) ? String(get(["comentarios", "OBSERVAÇÃO", "OBSERVACAO"])).trim() : null,
      };

      try {
        return OperacaoSchema.parse(op);
      } catch (e) {
        console.error("Erro ao validar linha da planilha:", e);
        return op; // Fallback se falhar, mas logamos o erro
      }
    });

    const resultado = await prisma.operacao.createMany({ 
      data: operacoes as any,
      skipDuplicates: true 
    });

    return { 
      totalLido: rawData.length, 
      adicionados: resultado.count, 
      ignorados: rawData.length - resultado.count,
      importId: importacao.id 
    };
  }

  static async listarOperacoes(filtros: any) {
    const { page = 1, limit = 100, search, pastaId } = filtros;
    const p = Math.max(1, Math.floor(Number(page) || 1));
    const l = Math.max(1, Math.floor(Number(limit) || 100));
    const offset = (p - 1) * l;
    
    const whereClause = this.construirWhere(search, pastaId, filtros);
    
    const data: any[] = await prisma.$queryRawUnsafe(`
      SELECT 
        o.id, o.nm_agencia, o.dt_emissao_, o.cd_pessoa_pagador, o.nm_pessoa_pagador,
        o.nr_cpf_cnpj_raiz, o.nr_cpf_cnpj_pagador, o.nr_ctrc, o.status, o.comentarios,
        o.id_tipo_documento, o.nm_pessoa_remetente, o.nm_cidade_origem, o.ds_sigla_origem,
        o.nm_pessoa_destinatario, o.nm_cidade_destino, o.ds_sigla_destino, o.nm_produto,
        o.vl_peso, o.vl_tarifa, o.vl_total, o.nr_nf, o.ds_placa, o.nm_pessoa_matriz,
        o.nr_contrato, o.nr_chave_acesso, o.nm_pessoa_usuario_lancamento, o.id_tipo_ctrc,
        o.nm_proprietario_posse_cavalo, o.nm_motorista
      FROM "Operacao" o
      ${whereClause.sql}
      ORDER BY o.id DESC
      LIMIT ${l} OFFSET ${offset}
    `, ...whereClause.params);

    const sanitizedData = data.map(item => ({
      ...item,
      vl_total: item.vl_total ? Number(item.vl_total) : null,
      vl_peso: item.vl_peso ? Number(item.vl_peso) : 0,
      vl_tarifa: item.vl_tarifa ? Number(item.vl_tarifa) : 0
    }));

    const totalRes: any = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as count FROM "Operacao" o ${whereClause.sql}
    `, ...whereClause.params);

    const total = Number(totalRes[0].count);
    
    // RETORNANDO O LIMIT PARA O CÁLCULO DO Nº NA TABELA
    return { 
      data: sanitizedData, 
      meta: { total, page: p, limit: l, totalPages: Math.ceil(total / l) } 
    };
  }

  static async listarIds(filtros: any) {
    const { search, pastaId } = filtros;
    const whereClause = this.construirWhere(search, pastaId, filtros);
    const ids: any[] = await prisma.$queryRawUnsafe(`SELECT id FROM "Operacao" o ${whereClause.sql}`, ...whereClause.params);
    return ids.map(i => i.id);
  }

  private static construirWhere(search: string, pastaId: any, filtros: any) {
    const whereAnd: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (search) {
      const s = `%${search}%`;
      whereAnd.push(`(
        nm_agencia ILIKE $${idx} OR
        cd_pessoa_pagador ILIKE $${idx} OR
        nm_pessoa_pagador ILIKE $${idx} OR
        nr_cpf_cnpj_raiz ILIKE $${idx} OR
        nr_cpf_cnpj_pagador ILIKE $${idx} OR
        nr_ctrc ILIKE $${idx} OR
        status ILIKE $${idx} OR
        comentarios ILIKE $${idx} OR
        id_tipo_documento ILIKE $${idx} OR
        nm_pessoa_remetente ILIKE $${idx} OR
        nm_cidade_origem ILIKE $${idx} OR
        ds_sigla_origem ILIKE $${idx} OR
        nm_pessoa_destinatario ILIKE $${idx} OR
        nm_cidade_destino ILIKE $${idx} OR
        ds_sigla_destino ILIKE $${idx} OR
        nm_produto ILIKE $${idx} OR
        nr_nf ILIKE $${idx} OR
        ds_placa ILIKE $${idx} OR
        nm_pessoa_matriz ILIKE $${idx} OR
        nr_contrato ILIKE $${idx} OR
        nr_chave_acesso ILIKE $${idx} OR
        nm_pessoa_usuario_lancamento ILIKE $${idx} OR
        id_tipo_ctrc ILIKE $${idx} OR
        nm_proprietario_posse_cavalo ILIKE $${idx} OR
        nm_motorista ILIKE $${idx} OR
        TO_CHAR(dt_emissao_, 'DD/MM/YYYY') ILIKE $${idx} OR
        vl_peso::TEXT ILIKE $${idx} OR
        vl_tarifa::TEXT ILIKE $${idx} OR
        vl_total::TEXT ILIKE $${idx}
      )`);
      params.push(s); idx++;
    }

    if (filtros.nm_agencia) { whereAnd.push(`nm_agencia = $${idx}`); params.push(filtros.nm_agencia); idx++; }
    if (filtros.nm_pessoa_pagador) { whereAnd.push(`nm_pessoa_pagador ILIKE $${idx}`); params.push(`%${filtros.nm_pessoa_pagador}%`); idx++; }
    if (filtros.nm_pessoa_remetente) { whereAnd.push(`nm_pessoa_remetente ILIKE $${idx}`); params.push(`%${filtros.nm_pessoa_remetente}%`); idx++; }
    if (filtros.nm_pessoa_destinatario) { whereAnd.push(`nm_pessoa_destinatario ILIKE $${idx}`); params.push(`%${filtros.nm_pessoa_destinatario}%`); idx++; }
    if (filtros.nm_produto) { whereAnd.push(`nm_produto ILIKE $${idx}`); params.push(`%${filtros.nm_produto}%`); idx++; }
    if (filtros.ds_placa) { whereAnd.push(`ds_placa ILIKE $${idx}`); params.push(`%${filtros.ds_placa}%`); idx++; }
    if (filtros.min_peso) { whereAnd.push(`vl_peso >= $${idx}`); params.push(Number(filtros.min_peso)); idx++; }
    if (filtros.max_peso) { whereAnd.push(`vl_peso <= $${idx}`); params.push(Number(filtros.max_peso)); idx++; }
    if (filtros.min_total) { whereAnd.push(`vl_total >= $${idx}`); params.push(Number(filtros.min_total)); idx++; }
    if (filtros.max_total) { whereAnd.push(`vl_total <= $${idx}`); params.push(Number(filtros.max_total)); idx++; }
    if (filtros.status) { whereAnd.push(`status = $${idx}`); params.push(filtros.status); idx++; }

    if (pastaId && pastaId !== "null") { whereAnd.push(`"pastaId" = $${idx}`); params.push(Number(pastaId)); idx++; }
    else { whereAnd.push(`"pastaId" IS NULL`); }

    return { sql: whereAnd.length > 0 ? `WHERE ${whereAnd.join(" AND ")}` : "", params };
  }

  static async getDashboard() {
    const [totais, porAgencia, porProduto, ultimasImportacoes, statusSummary, topOrigens, topDestinos] = await Promise.all([
      prisma.operacao.aggregate({ _sum: { vl_total: true, vl_peso: true }, _count: { id: true } }),
      prisma.operacao.groupBy({ by: ["nm_agencia"], _sum: { vl_total: true }, orderBy: { _sum: { vl_total: "desc" } }, take: 15 }),
      prisma.operacao.groupBy({ by: ["nm_produto"], _count: { id: true }, orderBy: { _count: { id: "desc" } }, take: 15 }),
      prisma.importacao.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
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


  static async contarInbox() { 
    if (this.inboxCountCache !== null && Date.now() - this.inboxCountCacheTime < this.SHORT_TTL) {
      return this.inboxCountCache;
    }
    const count = await prisma.operacao.count({ where: { pastaId: null } });
    this.inboxCountCache = count;
    this.inboxCountCacheTime = Date.now();
    return count;
  }

  static async buscarAgencias() {
    if (this.agenciasCache && Date.now() - this.agenciasCacheTime < this.CACHE_TTL) {
      return this.agenciasCache;
    }
    const ags = await prisma.operacao.groupBy({ by: ["nm_agencia"], where: { nm_agencia: { not: "" } }, orderBy: { nm_agencia: "asc" } });
    this.agenciasCache = ags.map(a => a.nm_agencia);
    this.agenciasCacheTime = Date.now();
    return this.agenciasCache;
  }

  static async bulkActionPasta(ids: number[], pastaId: number | null, filtros?: any) {
    const finalPastaId = (pastaId === null || isNaN(pastaId)) ? null : pastaId;

    if (ids.length > 0) {
      // Caso 1: IDs específicos selecionados
      await prisma.operacao.updateMany({
        where: { id: { in: ids } },
        data: { pastaId: finalPastaId }
      });
    } else if (filtros) {
      // Caso 2: Mover TUDO baseado no filtro (SQL Direto para Alta Performance)
      const whereClause = this.construirWhere(filtros.search, filtros.pastaId, filtros);
      const val = finalPastaId === null ? 'NULL' : finalPastaId;
      const sqlInput = `UPDATE "Operacao" SET "pastaId" = ${val} ${whereClause.sql}`;
      await prisma.$executeRawUnsafe(sqlInput, ...whereClause.params);
    }
    this.invalidarCache();
    await PastaService.invalidarCache();
    return { success: true };
  }

  static async bulkDelete(ids: number[], filters?: any) {
    if (ids.length > 0) {
      await prisma.operacao.deleteMany({ where: { id: { in: ids } } });
    } else if (filters) {
      const whereClause = this.construirWhere(filters.search, filters.pastaId, filters);
      const sql = `DELETE FROM "Operacao" ${whereClause.sql}`;
      await prisma.$executeRawUnsafe(sql, ...whereClause.params);
    }
    this.invalidarCache();
    await PastaService.invalidarCache();
    return { success: true };
  }

  static async update(id: number, data: any) {
    this.invalidarCache();
    return prisma.operacao.update({ where: { id }, data });
  }
}
