// /home/penta/Logicell/apps/api/src/controllers/OperacaoController.ts
import { Request, Response } from 'express';
import { OperacaoService } from '../services/OperacaoService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const OperacaoController = {
  async upload(req: Request, res: Response) {
    try {
      if (!req.file) return res.status(400).json({ error: 'Arquivo não enviado' });
      const resultado = await OperacaoService.processarPlanilha(req.file.buffer, req.file.originalname);
      return res.status(201).json(resultado);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },

  async list(req: Request, res: Response) {
    try {
      const resultado = await OperacaoService.listarOperacoes(req.query);
      return res.json(resultado);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },

  async export(req: Request, res: Response) {
    const { search, nm_agencia, nm_produto, ds_placa, nm_pessoa_pagador, pastaId, min_peso, max_peso, min_total, max_total } = req.query;
    const where: any = { AND: [] };
    
    if (search) where.AND.push({ OR: [{ nr_ctrc: { contains: String(search), mode: 'insensitive' } }, { nm_motorista: { contains: String(search), mode: 'insensitive' } }, { nm_pessoa_pagador: { contains: String(search), mode: 'insensitive' } }, { nm_agencia: { contains: String(search), mode: 'insensitive' } }] });
    if (nm_agencia) where.AND.push({ nm_agencia: String(nm_agencia) });
    if (nm_produto) where.AND.push({ nm_produto: { contains: String(nm_produto), mode: 'insensitive' } });
    if (ds_placa) where.AND.push({ ds_placa: { contains: String(ds_placa), mode: 'insensitive' } });
    if (nm_pessoa_pagador) where.AND.push({ nm_pessoa_pagador: { contains: String(nm_pessoa_pagador), mode: 'insensitive' } });
    if (min_peso || max_peso) where.AND.push({ vl_peso: { ...(min_peso && { gte: Number(min_peso) }), ...(max_peso && { lte: Number(max_peso) }) } });
    if (min_total || max_total) where.AND.push({ vl_total: { ...(min_total && { gte: Number(min_total) }), ...(max_total && { lte: Number(max_total) }) } });
    
    if (pastaId) {
      where.AND.push({ pastaId: Number(pastaId) });
    } else {
      where.AND.push({ pastaId: null });
    }

    try {
      const data = await prisma.operacao.findMany({ where, orderBy: { id: 'desc' } });
      return res.json(data);
    } catch (error) { return res.status(500).json({ error: 'Erro export' }); }
  },

  async getDashboard(req: Request, res: Response) {
    try {
      const [totais, porAgencia, porProduto, ultimasImportacoes] = await Promise.all([
        prisma.operacao.aggregate({ _sum: { vl_total: true, vl_peso: true }, _count: { id: true } }),
        prisma.operacao.groupBy({ by: ['nm_agencia'], _sum: { vl_total: true }, orderBy: { _sum: { vl_total: 'desc' } }, take: 8 }),
        prisma.operacao.groupBy({ by: ['nm_produto'], _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 8 }),
        prisma.importacao.findMany({ orderBy: { createdAt: 'desc' }, take: 5 })
      ]);
      return res.json({ totais, porAgencia, porProduto, ultimasImportacoes });
    } catch (error) { return res.status(500).json({ error: 'Erro dashboard' }); }
  },

  async getAgencies(req: Request, res: Response) {
    try {
      const agencies = await prisma.operacao.groupBy({ 
        by: ['nm_agencia'],
        where: { nm_agencia: { not: null, not: '' } },
        orderBy: { nm_agencia: 'asc' }
      });
      return res.json(agencies.map(a => a.nm_agencia));
    } catch (error) { return res.status(500).json({ error: 'Erro ao buscar agências' }); }
  },

  async addToPasta(req: Request, res: Response) {
    const { operacaoId, pastaId } = req.body;
    try {
      await prisma.operacao.update({
        where: { id: Number(operacaoId) },
        data: { pastaId: Number(pastaId) }
      });
      return res.json({ success: true });
    } catch (e) { return res.status(400).json({ error: 'Erro ao mover para a pasta' }); }
  },

  async removeFromPasta(req: Request, res: Response) {
    const { operacaoId } = req.body;
    try {
      await prisma.operacao.update({
        where: { id: Number(operacaoId) },
        data: { pastaId: null }
      });
      return res.json({ success: true });
    } catch (e) { return res.status(400).json({ error: 'Erro ao remover da pasta' }); }
  },

  async bulkActionPasta(req: Request, res: Response) {
    const { ids, pastaId, action } = req.body;
    try {
      await prisma.operacao.updateMany({
        where: { id: { in: ids.map(Number) } },
        data: { pastaId: action === 'add' ? Number(pastaId) : null }
      });
      return res.json({ success: true });
    } catch (e) { return res.status(400).json({ error: 'Erro na ação em massa' }); }
  },

  async bulkDelete(req: Request, res: Response) {
    const { ids } = req.body;
    try {
      await prisma.operacao.deleteMany({
        where: { id: { in: ids.map(Number) } }
      });
      return res.json({ success: true });
    } catch (e) { return res.status(400).json({ error: 'Erro ao excluir itens' }); }
  },

  async update(req: Request, res: Response) {
    const { id } = req.params;
    const data = { ...req.body };
    if (data.nm_agencia) {
      data.nm_agencia = data.nm_agencia.toUpperCase().replace(/\s+/g, ' ').replace(/\s*-\s*/g, ' - ').trim();
    }
    try {
      const updated = await prisma.operacao.update({ where: { id: Number(id) }, data });
      return res.json(updated);
    } catch (error) { return res.status(400).json({ error: 'Erro ao atualizar operação' }); }
  }
};
