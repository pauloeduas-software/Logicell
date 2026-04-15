import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import crypto from 'crypto';

const prisma = new PrismaClient();
export class OperacaoService {
  private static padronizarAgencia(nome: string): string {
    if (!nome) return '';
    return nome.toUpperCase().replace(/\s+/g, ' ').replace(/\s*-\s*/g, ' - ').trim();
  }

  static async processarPlanilha(buffer: Buffer, originalName: string) {
    // Gera Hash do arquivo apenas para registro
    const hash = crypto.createHash('md5').update(buffer).digest('hex');

    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData: any[] = XLSX.utils.sheet_to_json(sheet, { range: 1 });

    if (rawData.length === 0) throw new Error('Planilha vazia');

    const importacao = await prisma.importacao.create({
      data: { 
        nomeArquivo: originalName, 
        usuario: 'Sistema', 
        qtdRegistros: rawData.length,
        hashArquivo: hash
      }
    });

    const operacoes = rawData.map((row) => ({
      importacaoId: importacao.id,
      nm_agencia: this.padronizarAgencia(String(row['nm_agencia'] || '')),
      dt_emissao_: row['dt_emissao_'] ? new Date(row['dt_emissao_']) : null,
      cd_pessoa_pagador: String(row['cd_pessoa_pagador'] || ''),
      nm_pessoa_pagador: String(row['nm_pessoa_pagador'] || ''),
      nr_cpf_cnpj_raiz: String(row['nr_cpf_cnpj_raiz'] || ''),
      nr_cpf_cnpj_pagador: String(row['nr_cpf_cnpj_pagador'] || ''),
      nr_ctrc: String(row['nr_ctrc'] || ''),
      id_tipo_documento: String(row['id_tipo_documento'] || ''),
      nm_pessoa_remetente: String(row['nm_pessoa_remetente'] || ''),
      nm_cidade_origem: String(row['nm_cidade_origem'] || ''),
      ds_sigla_origem: String(row['ds_sigla_origem'] || ''),
      nm_pessoa_destinatario: String(row['nm_pessoa_destinatario'] || ''),
      nm_cidade_destino: String(row['nm_cidade_destino'] || ''),
      ds_sigla_destino: String(row['ds_sigla_destino'] || ''),
      nm_produto: String(row['nm_produto'] || ''),
      vl_peso: Number(row['vl_peso'] || 0),
      vl_tarifa: Number(row['vl_tarifa'] || 0),
      vl_total: Number(row['vl_total'] || 0),
      nr_nf: String(row['nr_nf'] || ''),
      ds_placa: String(row['ds_placa'] || ''),
      nm_pessoa_matriz: String(row['nm_pessoa_matriz'] || ''),
      nr_contrato: String(row['nr_contrato'] || ''),
      nr_chave_acesso: String(row['nr_chave_acesso'] || ''),
      nm_pessoa_usuario_lancamento: String(row['nm_pessoa_usuario_lancamento'] || ''),
      id_tipo_ctrc: String(row['id_tipo_ctrc'] || ''),
      nm_proprietario_posse_cavalo: String(row['nm_proprietario_posse_cavalo'] || ''),
      nm_motorista: String(row['nm_motorista'] || ''),
    }));

    // Usa skipDuplicates para ignorar registros que já possuem o mesmo nr_ctrc
    const resultado = await prisma.operacao.createMany({ 
      data: operacoes,
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
    const { page = 1, limit = 100, search, pastaId, ...rest } = filtros;
    const p = Number(page);
    const l = Number(limit);
    const offset = (p - 1) * l;
    
    const whereAnd: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      const searchStr = `%${search}%`;
      whereAnd.push(`(
        nm_agencia ILIKE $${paramIndex} OR
        cd_pessoa_pagador ILIKE $${paramIndex} OR
        nm_pessoa_pagador ILIKE $${paramIndex} OR
        nr_cpf_cnpj_raiz ILIKE $${paramIndex} OR
        nr_cpf_cnpj_pagador ILIKE $${paramIndex} OR
        nr_ctrc ILIKE $${paramIndex} OR
        id_tipo_documento ILIKE $${paramIndex} OR
        nm_pessoa_remetente ILIKE $${paramIndex} OR
        nm_cidade_origem ILIKE $${paramIndex} OR
        ds_sigla_origem ILIKE $${paramIndex} OR
        nm_pessoa_destinatario ILIKE $${paramIndex} OR
        nm_cidade_destino ILIKE $${paramIndex} OR
        ds_sigla_destino ILIKE $${paramIndex} OR
        nm_produto ILIKE $${paramIndex} OR
        nr_nf ILIKE $${paramIndex} OR
        ds_placa ILIKE $${paramIndex} OR
        nm_pessoa_matriz ILIKE $${paramIndex} OR
        nr_contrato ILIKE $${paramIndex} OR
        nr_chave_acesso ILIKE $${paramIndex} OR
        nm_pessoa_usuario_lancamento ILIKE $${paramIndex} OR
        id_tipo_ctrc ILIKE $${paramIndex} OR
        nm_proprietario_posse_cavalo ILIKE $${paramIndex} OR
        nm_motorista ILIKE $${paramIndex} OR
        TO_CHAR(dt_emissao_, 'DD/MM/YYYY') ILIKE $${paramIndex} OR
        CAST(vl_total AS TEXT) ILIKE $${paramIndex} OR
        CAST(vl_peso AS TEXT) ILIKE $${paramIndex} OR
        CAST(vl_tarifa AS TEXT) ILIKE $${paramIndex}
      )`);
      params.push(searchStr);
      paramIndex++;
    }

    if (rest.nm_agencia) {
      whereAnd.push(`nm_agencia = $${paramIndex}`);
      params.push(rest.nm_agencia);
      paramIndex++;
    }

    if (filtros.nm_pessoa_pagador) {
      whereAnd.push(`nm_pessoa_pagador ILIKE $${paramIndex}`);
      params.push(`%${filtros.nm_pessoa_pagador}%`);
      paramIndex++;
    }

    if (filtros.nm_pessoa_remetente) {
      whereAnd.push(`nm_pessoa_remetente ILIKE $${paramIndex}`);
      params.push(`%${filtros.nm_pessoa_remetente}%`);
      paramIndex++;
    }

    if (filtros.nm_pessoa_destinatario) {
      whereAnd.push(`nm_pessoa_destinatario ILIKE $${paramIndex}`);
      params.push(`%${filtros.nm_pessoa_destinatario}%`);
      paramIndex++;
    }

    if (filtros.nm_produto) {
      whereAnd.push(`nm_produto ILIKE $${paramIndex}`);
      params.push(`%${filtros.nm_produto}%`);
      paramIndex++;
    }

    if (filtros.ds_placa) {
      whereAnd.push(`ds_placa ILIKE $${paramIndex}`);
      params.push(`%${filtros.ds_placa}%`);
      paramIndex++;
    }

    if (filtros.min_peso) {
      whereAnd.push(`vl_peso >= $${paramIndex}`);
      params.push(Number(filtros.min_peso));
      paramIndex++;
    }
    if (filtros.max_peso) {
      whereAnd.push(`vl_peso <= $${paramIndex}`);
      params.push(Number(filtros.max_peso));
      paramIndex++;
    }
    if (filtros.min_total) {
      whereAnd.push(`vl_total >= $${paramIndex}`);
      params.push(Number(filtros.min_total));
      paramIndex++;
    }
    if (filtros.max_total) {
      whereAnd.push(`vl_total <= $${paramIndex}`);
      params.push(Number(filtros.max_total));
      paramIndex++;
    }

    if (pastaId) {
      whereAnd.push(`"pastaId" = $${paramIndex}`);
      params.push(Number(pastaId));
      paramIndex++;
    } else {
      whereAnd.push(`"pastaId" IS NULL`);
    }

    const whereClause = whereAnd.length > 0 ? `WHERE ${whereAnd.join(' AND ')}` : '';
    
    const data: any[] = await prisma.$queryRawUnsafe(`
      SELECT o.* FROM "Operacao" o
      ${whereClause}
      ORDER BY o.id DESC
      LIMIT ${l} OFFSET ${offset}
    `, ...params);

    const totalRes: any = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as count FROM "Operacao" o ${whereClause}
    `, ...params);
    
    const total = Number(totalRes[0].count);

    return { data, meta: { total, page: p, totalPages: Math.ceil(total / l) } };
  }
}
