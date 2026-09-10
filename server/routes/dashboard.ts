import { Router } from "express";
import { DashboardService } from "../services/dashboard.server";

export const dashboardRouter = Router();

//Visão geral + lista de pastas (valor, quantidade, atrasos, faturista...).
dashboardRouter.get("/", async (_req, res, next) => {
  try {
    const resumo = await DashboardService.resumo();
    res.json(resumo);
  } catch (err) {
    next(err);
  }
});

//Detalhamento de uma pasta ("inbox" = Caixa de Entrada).
dashboardRouter.get("/pastas/:pastaId", async (req, res, next) => {
  try {
    const raw = req.params.pastaId;
    let pastaId: number | null;
    if (raw === "inbox") {
      pastaId = null;
    } else {
      const parsed = Number(raw);
      if (!Number.isFinite(parsed)) {
        res.status(400).json({ error: "ID de pasta inválido." });
        return;
      }
      pastaId = parsed;
    }
    const detalhe = await DashboardService.pastaDetalhe(pastaId);
    res.json(detalhe);
  } catch (err) {
    next(err);
  }
});
