// /home/penta/Logicell/apps/api/src/controllers/PastaController.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const PastaController = {
  async listar(req: Request, res: Response) {
    try {
      const pastas = await prisma.pasta.findMany({
        orderBy: { nome: 'asc' },
        include: {
          _count: {
            select: { operacoes: true }
          }
        }
      });
      return res.json(pastas);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },

  async criar(req: Request, res: Response) {
    const { nome } = req.body;
    try {
      const pasta = await prisma.pasta.create({
        data: { nome }
      });
      return res.status(201).json(pasta);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  },

  async atualizar(req: Request, res: Response) {
    const { id } = req.params;
    const { nome } = req.body;
    try {
      const pasta = await prisma.pasta.update({
        where: { id: Number(id) },
        data: { nome }
      });
      return res.json(pasta);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  },

  async excluir(req: Request, res: Response) {
    const { id } = req.params;
    try {
      await prisma.pasta.delete({
        where: { id: Number(id) }
      });
      return res.json({ success: true });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
};
