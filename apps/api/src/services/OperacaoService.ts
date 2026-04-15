import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

export class OperacaoService {
  static async processarPlanilha(buffer: Buffer, originalName: string) {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData: any[] = XLSX.utils.sheet_to_json(sheet, { range: 1 });

    if (rawData.length === 0) throw new Error('Planilha vazia');

    const importacao = await prisma.importacao.create({
      data: { nomeArquivo: originalName, usuario: 'Sistema', qtdRegistros: rawData.length }
    });

    const operacoes = rawData.map((row) => ({
      importacaoId: importacao.id,
      nm_agencia: String(row['nm_agencia'] || ''),
      dt_emissao_: row['dt_emissao_'] ? new Date(row['dt_emissao_']) : null,
      cd_pessoa_pagador: String(row['cd_pessoa_pagador'] || ''),
      nm_pessoa_pagador: String(row['nm_pessoa_pagador'] || ''),
      nr_ctrc: String(row['nr_ctrc'] || ''),
      nm_produto: String(row['nm_produto'] || ''),
      vl_peso: Number(row['vl_peso'] || 0),
      vl_total: Number(row['vl_total'] || 0),
      nm_motorista: String(row['nm_motorista'] || ''),
      // ... demais campos
    }));

    await prisma.operacao.createMany({ data: operacoes });
    return { count: rawData.length, importId: importacao.id };
  }

  static async listarOperacoes(filtros: any) {
    const { page = 1, limit = 100, search, onlyWorkList, ...rest } = filtros;
    const p = Number(page);
    const l = Number(limit);
    
    const where: any = { AND: [] };
    
    if (search) {
      where.AND.push({
        OR: [
          { nr_ctrc: { contains: String(search), mode: 'insensitive' } },
          { nm_motorista: { contains: String(search), mode: 'insensitive' } },
          { nm_pessoa_pagador: { contains: String(search), mode: 'insensitive' } },
        ]
      });
    }

    // Filtros dinâmicos (Agência, Produto, etc)
    if (rest.nm_agencia) where.AND.push({ nm_agencia: String(rest.nm_agencia) });
    if (rest.nm_produto) where.AND.push({ nm_produto: { contains: String(rest.nm_produto), mode: 'insensitive' } });
    
    if (onlyWorkList === 'true') {
      where.AND.push({ naListaTrabalho: { isNot: null } });
    }

    const [data, total] = await Promise.all([
      prisma.operacao.findMany({ 
        where, skip: (p - 1) * l, take: l, orderBy: { id: 'desc' },
        include: { naListaTrabalho: true }
      }),
      prisma.operacao.count({ where })
    ]);

    return { data, meta: { total, page: p, totalPages: Math.ceil(total / l) } };
  }
}
