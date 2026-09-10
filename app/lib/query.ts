import { QueryClient, useQuery } from "@tanstack/react-query";
import { api } from "./api";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const queryKeys = {
  init: ["init"] as const,
  dashboard: ["dashboard"] as const,
  automacoes: ["automacoes"] as const,
  usuarios: (page: number) => ["usuarios", page] as const,
  perfil: ["perfil"] as const,
  faturistas: ["faturistas"] as const,
  prazos: ["prazos"] as const,
};

export interface InitData {
  user: any;
  pastas: any[];
  totalInbox: number;
  columnOrder: string[] | null;
  // Contagem de emissões antigas por pasta (chave "inbox" = Caixa de Entrada).
  emissaoAntigasPorPasta: Record<string, number>;
}

// Dados de boot (sidebar + ordem de colunas). Mantidos frescos com polling
// leve apenas com a aba em foco — é o que dá o "tempo real" dos contadores
// da sidebar sem custo quando o usuário não está olhando.
export function useInit() {
  return useQuery({
    queryKey: queryKeys.init,
    queryFn: () => api.get<InitData>("/init"),
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    refetchInterval: 120_000,
    refetchIntervalInBackground: false,
  });
}

export interface Faturista {
  id: string;
  nome: string;
  email: string;
}

// Lista de usuários ativos que podem ser atribuídos como faturista de uma pasta.
export function useFaturistas() {
  return useQuery({
    queryKey: queryKeys.faturistas,
    queryFn: () => api.get<{ faturistas: Faturista[] }>("/pastas/faturistas"),
    staleTime: 60_000,
  });
}

export interface PrazoClienteItem {
  id: number;
  cliente: string;
  prazoDias: number;
}

// Regras de "emissão antiga": prazo padrão global + exceções por cliente.
export function usePrazos() {
  return useQuery({
    queryKey: queryKeys.prazos,
    queryFn: () => api.get<{ padrao: number; clientes: PrazoClienteItem[] }>("/prazos"),
    staleTime: 60_000,
  });
}

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

//Visão geral + lista de pastas da tela inicial. Atualiza sozinha em segundo
//plano (intervalo + foco na aba) para manter os valores frescos sem botão.
export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: () => api.get<DashboardResumo>("/dashboard"),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
}

//Detalhamento de uma pasta sob demanda (ao expandir na lista).
export function useDashboardPasta(pastaId: number | "inbox" | null, enabled: boolean) {
  const chave = pastaId === null ? "inbox" : String(pastaId);
  return useQuery({
    queryKey: ["dashboard", "pasta", chave] as const,
    queryFn: () => api.get<DashboardPastaDetalhe>(`/dashboard/pastas/${chave}`),
    enabled,
    staleTime: 60_000,
  });
}