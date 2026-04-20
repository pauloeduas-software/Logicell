import { useState, useCallback, useEffect, Suspense } from "react";
import { useLoaderData, useFetcher, useSearchParams, useNavigate, useLocation, Await, useRouteLoaderData, useNavigation, data, isRouteErrorResponse, useRouteError } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs, ShouldRevalidateFunction } from "react-router";
import * as XLSX from "xlsx";
import { 
  Search, Download, Landmark, Truck, FolderPlus, 
  ChevronDown, CheckCircle2, Table as TableIcon, 
  Trash2, UploadCloud, Loader2, Folder, AlertTriangle
} from "lucide-react";
import { OperacaoService } from "~/services/operacao.server";
import { PastaService } from "~/services/pasta.server";
import { requireUser } from "~/services/auth.server";
import { useUI } from "~/root";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

const COLUNAS = [
  { key: 'nm_agencia', label: 'Agência', width: '180px' },
  { key: 'dt_emissao_', label: 'Emissão', width: '120px' },
  { key: 'cd_pessoa_pagador', label: 'Código', width: '120px' },
  { key: 'nm_pessoa_pagador', label: 'Cliente', width: '250px' },
  { key: 'nr_cpf_cnpj_raiz', label: 'CNPJ Raiz', width: '140px' },
  { key: 'nr_cpf_cnpj_pagador', label: 'CNPJ Pagador', width: '180px' },
  { key: 'nr_ctrc', label: 'CTe', width: '120px' },
  { key: 'status', label: 'ANEXADO ATUA TICKET/NF', width: '220px' },
  { key: 'comentarios', label: 'OBSERVAÇÃO', width: '300px' },
  { key: 'id_tipo_documento', label: 'Tipo Doc', width: '100px' },
  { key: 'nm_pessoa_remetente', label: 'Remetente', width: '250px' },
  { key: 'nm_cidade_origem', label: 'Cidade Origem', width: '180px' },
  { key: 'ds_sigla_origem', label: 'UF Origem', width: '80px' },
  { key: 'nm_pessoa_destinatario', label: 'Destinatário', width: '250px' },
  { key: 'nm_cidade_destino', label: 'Cidade Destino', width: '180px' },
  { key: 'ds_sigla_destino', label: 'UF Destino', width: '80px' },
  { key: 'nm_produto', label: 'Produto', width: '150px' },
  { key: 'vl_peso', label: 'Peso (kg)', width: '120px', isNumeric: true },
  { key: 'vl_tarifa', label: 'Tarifa (R$)', width: '120px', isCurrency: true },
  { key: 'vl_total', label: 'Total (R$)', width: '140px', isCurrency: true },
  { key: 'nr_nf', label: 'NF', width: '120px' },
  { key: 'ds_placa', label: 'Placa', width: '120px' },
  { key: 'nm_pessoa_matriz', label: 'Matriz', width: '200px' },
  { key: 'nr_contrato', label: 'Contrato', width: '120px' },
  { key: 'nr_chave_acesso', label: 'Chave Acesso', width: '380px' },
  { key: 'nm_pessoa_usuario_lancamento', label: 'Usuário', width: '180px' },
  { key: 'id_tipo_ctrc', label: 'Tipo CTe', width: '120px' },
  { key: 'nm_proprietario_posse_cavalo', label: 'Proprietário', width: '200px' },
  { key: 'nm_motorista', label: 'Motorista', width: '250px' },
];

const STATUS_OPTIONS = [
  "PENDENTE", "ANEXADO", "DIVERGENTE", "ILEGIVEL", "POSTO", 
  "MDF EM ABERTO", "COMPLEMENTAR", "1° PERNA", "SINISTRO", 
  "DESACORDO", "CARGA RECUSADA"
];

const formatarMoeda = (val: any) => {
  if (val === null || val === undefined) return "-";
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val));
};

const formatarData = (val: any) => {
  if (!val) return "-";
  return new Date(val).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

const formatarNumero = (val: any) => {
  if (val === null || val === undefined) return "-";
  return new Intl.NumberFormat('pt-BR').format(Number(val));
};

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { user, response } = await requireUser(request);
  const pastaId = Number(params.id);
  const url = new URL(request.url);
  const searchParams = Object.fromEntries(url.searchParams);
  
  const resultadoPromise = OperacaoService.listarOperacoes({ ...searchParams, pastaId });
  const agenciasPromise = OperacaoService.buscarAgencias();
  const pastaPromise = PastaService.buscarPorId(pastaId);

  return data({ 
    dadosPromise: resultadoPromise, 
    agenciasPromise, 
    pastaPromise,
    pastaId 
  }, { headers: response.headers });
}

export function ErrorBoundary() {
  const error = useRouteError();
  
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6 animate-in fade-in zoom-in duration-500">
      <div className="p-6 bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-[2rem] shadow-xl shadow-rose-500/10">
        <AlertTriangle size={64} strokeWidth={2.5} />
      </div>
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-800 dark:text-white">Ops! Erro na Pasta</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium max-w-md mx-auto">
          {isRouteErrorResponse(error) 
            ? `${error.status} ${error.statusText}` 
            : error instanceof Error 
              ? error.message 
              : "Não conseguimos carregar os dados desta pasta agora."}
        </p>
      </div>
      <div className="flex gap-4">
        <button onClick={() => window.location.reload()} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all">
          Tentar Novamente
        </button>
        <a href="/" className="px-8 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all">
          Ir para o Painel
        </a>
      </div>
    </div>
  );
}

// shouldRevalidate removido para garantir que a troca de pastas funcione corretamente

export { action } from "./inbox";

export default function FolderView() {
  const { dadosPromise, agenciasPromise, pastaId } = useLoaderData<typeof loader>();
  const rootData = useRouteLoaderData("root") as any;
  const pastas = rootData?.pastas || [];
  
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fetcher = useFetcher();
  const { showToast, confirm } = useUI();

  const [filtros, setFilters] = useState({
    search: searchParams.get("search") || "",
    agency: searchParams.get("nm_agencia") || "",
    product: searchParams.get("nm_produto") || "",
    plate: searchParams.get("ds_placa") || "",
    payer: searchParams.get("nm_pessoa_pagador") || "",
    sender: searchParams.get("nm_pessoa_remetente") || "",
    recipient: searchParams.get("nm_pessoa_destinatario") || "",
    status: searchParams.get("status") || "",
    minPeso: searchParams.get("min_peso") || "",
    maxPeso: searchParams.get("max_peso") || "",
    minTotal: searchParams.get("min_total") || "",
    maxTotal: searchParams.get("max_total") || ""
  });

  const [editando, setEditing] = useState<{ id: number; campo: string; valorTemp: string } | null>(null);
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set());
  const [showPastaMenu, setShowPastaMenu] = useState(false);

  useEffect(() => {
    setFilters({
      search: searchParams.get("search") || "",
      agency: searchParams.get("nm_agencia") || "",
      product: searchParams.get("nm_produto") || "",
      plate: searchParams.get("ds_placa") || "",
      payer: searchParams.get("nm_pessoa_pagador") || "",
      sender: searchParams.get("nm_pessoa_remetente") || "",
      recipient: searchParams.get("nm_pessoa_destinatario") || "",
      status: searchParams.get("status") || "",
      minPeso: searchParams.get("min_peso") || "",
      maxPeso: searchParams.get("max_peso") || "",
      minTotal: searchParams.get("min_total") || "",
      maxTotal: searchParams.get("max_total") || ""
    });
    setSelecionados(new Set());
  }, [pastaId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const p = new URLSearchParams(searchParams);
      const queryNormalizada = filtros.search.trim();
      
      // Limpamos parâmetros antigos antes de setar novos
      const currentKeys = Array.from(p.keys());
      currentKeys.forEach(k => {
        if (k !== 'page' && k !== 'limit') p.delete(k);
      });

      if (queryNormalizada) p.set("search", queryNormalizada);
      if (filtros.agency) p.set("nm_agencia", filtros.agency);
      if (filtros.product) p.set("nm_produto", filtros.product);
      if (filtros.plate) p.set("ds_placa", filtros.plate);
      if (filtros.payer) p.set("nm_pessoa_pagador", filtros.payer);
      if (filtros.sender) p.set("nm_pessoa_remetente", filtros.sender);
      if (filtros.recipient) p.set("nm_pessoa_destinatario", filtros.recipient);
      if (filtros.status) p.set("status", filtros.status);
      if (filtros.minPeso) p.set("min_peso", filtros.minPeso);
      if (filtros.maxPeso) p.set("max_peso", filtros.maxPeso);
      if (filtros.minTotal) p.set("min_total", filtros.minTotal);
      if (filtros.maxTotal) p.set("max_total", filtros.maxTotal);
      
      p.set("page", "1");
      p.set("limit", searchParams.get("limit") || "100");
      
      const newSearch = p.toString();
      const currentSearch = searchParams.toString();
      
      if (newSearch !== currentSearch) {
        navigate(`${location.pathname}?${newSearch}`, { replace: true });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [filtros]);

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data && (fetcher.data as any).success) {
      const res = fetcher.data as any;
      if (res.intent === "bulkMove") showToast("Itens movidos com sucesso", "success");
      if (res.intent === "bulkDelete") showToast("Itens excluídos com sucesso", "error");
    }
  }, [fetcher.state, fetcher.data]);

  const toggleSelecao = (id: number) => {
    const novos = new Set(selecionados);
    if (novos.has(id)) novos.delete(id); else novos.add(id);
    setSelecionados(novos);
  };

  const salvarEdicao = (id: number, campo: string, valor: string) => {
    const formData = new FormData();
    formData.append("intent", "update");
    formData.append("id", String(id));
    formData.append("campo", campo);
    formData.append("valor", valor);
    fetcher.submit(formData, { method: "post" });
    setEditing(null);
  };

  const moverParaPasta = (pId: number | null, pNome: string, totalFiltro: number) => {
    const idsCount = selecionados.size > 0 ? selecionados.size : totalFiltro;
    confirm({
      title: "Mover Itens?",
      message: `Deseja mover ${idsCount} itens para "${pNome}"?`,
      onConfirm: () => {
        const formData = new FormData();
        formData.append("intent", "bulkMove");
        formData.append("ids", JSON.stringify(Array.from(selecionados)));
        formData.append("filters", JSON.stringify({ ...Object.fromEntries(searchParams), pastaId }));
        if (pId !== null) formData.append("pastaId", String(pId));
        fetcher.submit(formData, { method: "post" });
        setSelecionados(new Set());
        setShowPastaMenu(false);
      }
    });
  };

  const excluirSelecionados = (totalFiltro: number) => {
    const idsCount = selecionados.size > 0 ? selecionados.size : totalFiltro;
    if (idsCount === 0) return;
    confirm({
      title: "Excluir permanentemente?",
      message: `Você está prestes a excluir ${idsCount} itens. Esta ação não pode ser desfeita.`,
      variant: 'danger',
      onConfirm: () => {
        const formData = new FormData();
        formData.append("intent", "bulkDelete");
        formData.append("ids", JSON.stringify(Array.from(selecionados)));
        formData.append("filters", JSON.stringify({ ...Object.fromEntries(searchParams), pastaId }));
        fetcher.submit(formData, { method: "post" });
        setSelecionados(new Set());
      }
    });
  };

  const exportarExcel = (dados: any[], nomePasta: string) => {
    try {
      showToast("Gerando arquivo Excel...", "info");
      const exportData = dados.map(row => {
        const obj: any = {};
        COLUNAS.forEach(col => {
          let val = row[col.key];
          if (col.key === "dt_emissao_" && val) val = new Date(val).toLocaleDateString("pt-BR");
          obj[col.label] = val;
        });
        return obj;
      });
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Export");
      XLSX.writeFile(wb, `Logicell_${nomePasta}.xlsx`);
      showToast("Download iniciado!", "success");
    } catch (e) {
      showToast("Erro na exportação.", "error");
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-4 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-sm flex flex-col xl:flex-row gap-3 items-center justify-between shrink-0">
        <div className="flex items-center gap-3 flex-1 w-full">
            <div className="flex items-center gap-3 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl shrink-0">
              <Truck className="text-indigo-500" size={16} />
              <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                {pastas.find((p: any) => p.id === pastaId)?.nome || "Pasta"}
              </span>
            </div>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input placeholder="Busca Geral" value={filtros.search} onChange={(e) => setFilters(p => ({ ...p, search: e.target.value }))} className="w-full bg-slate-100/50 dark:bg-slate-800/50 border-0 rounded-xl pl-10 pr-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm font-medium" />
          </div>
        </div>

        <div className="flex items-center gap-2 w-full xl:w-auto relative">
          <Suspense fallback={<div className="h-10 w-32 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl" />}>
            <Await resolve={dadosPromise}>
              {(resultado: any) => (
                <button onClick={() => setShowPastaMenu(!showPastaMenu)} className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-[11px] transition-all shadow-lg shadow-indigo-500/20 uppercase tracking-widest">
                  <FolderPlus size={16} /> {selecionados.size > 0 ? `Mover (${selecionados.size})` : "Mover Filtrados"} <ChevronDown size={12} className={cn("transition-transform", showPastaMenu && "rotate-180")} />
                </button>
              )}
            </Await>
          </Suspense>

          {showPastaMenu && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-2 border-b border-slate-100 dark:border-slate-800"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mover para</p></div>
              <div className="max-h-60 overflow-y-auto custom-scrollbar">
                <Suspense fallback={<div className="p-4 text-center"><Loader2 className="animate-spin mx-auto text-indigo-500" /></div>}>
                  <Await resolve={dadosPromise}>
                    {(resultado: any) => (
                      <>
                        <button onClick={() => moverParaPasta(null, "Caixa de Entrada", resultado.meta.total)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-bold text-indigo-600 border-b border-slate-100 dark:border-slate-800">
                          <TableIcon size={16} /><span>Caixa de Entrada</span>
                        </button>
                        {pastas.map((p: any) => (
                          <button key={p.id} onClick={() => moverParaPasta(p.id, p.nome, resultado.meta.total)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-bold text-slate-600 border-b border-slate-50 dark:border-slate-800/50 last:border-0">
                            <CheckCircle2 size={16} className="text-indigo-500" />
                            <span>{p.nome}</span>
                          </button>
                        ))}
                      </>
                    )}
                  </Await>
                </Suspense>
              </div>
            </div>
          )}
          <Suspense fallback={<div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl" />}>
            <Await resolve={dadosPromise}>
              {(resultado: any) => (
                <>
                  <button onClick={() => excluirSelecionados(resultado.meta.total)} className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-rose-500/20 hover:bg-rose-700 transition-colors"><Trash2 size={16} /></button>
                  <button onClick={() => {
                    const pNome = pastas.find((p: any) => p.id === pastaId)?.nome || "Pasta";
                    exportarExcel(resultado.data, pNome);
                  }} className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all"><Download size={16} /> Exportar</button>
                </>
              )}
            </Await>
          </Suspense>
        </div>
      </div>

      <div className="bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex flex-col gap-3 shrink-0">
        <Suspense fallback={<div className="grid grid-cols-6 gap-4 animate-pulse"><div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl" /></div>}>
          <Await resolve={agenciasPromise}>
            {(agencias: string[]) => (
              <div className="flex flex-wrap gap-2">
                <div className="relative flex-1 min-w-[180px]">
                  <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <select value={filtros.agency} onChange={(e) => setFilters(p => ({ ...p, agency: e.target.value }))} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl pl-9 pr-2 py-2 outline-none text-xs font-bold appearance-none">
                    <option value="">Todas Agências</option>
                    {(agencias || []).map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <input placeholder="Cliente" value={filtros.payer} onChange={e => setFilters(p => ({...p, payer: e.target.value}))} className="flex-1 min-w-[140px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl px-4 py-2 outline-none text-xs font-bold" />
                <input placeholder="Remetente" value={filtros.sender} onChange={e => setFilters(p => ({...p, sender: e.target.value}))} className="flex-1 min-w-[140px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl px-4 py-2 outline-none text-xs font-bold" />
                <input placeholder="Destinatário" value={filtros.recipient} onChange={e => setFilters(p => ({...p, recipient: e.target.value}))} className="flex-1 min-w-[140px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl px-4 py-2 outline-none text-xs font-bold" />
                <input placeholder="Produto" value={filtros.product} onChange={e => setFilters(p => ({...p, product: e.target.value}))} className="flex-1 min-w-[140px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl px-4 py-2 outline-none text-xs font-bold" />
                <input placeholder="Placa" value={filtros.plate} onChange={e => setFilters(p => ({...p, plate: e.target.value}))} className="flex-1 min-w-[140px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl px-4 py-2 outline-none text-xs font-bold" />
              </div>
            )}
          </Await>
        </Suspense>
        
        <div className="flex flex-wrap gap-4 items-center border-t border-slate-100 dark:border-slate-800 pt-2.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status:</span>
            <select value={filtros.status} onChange={e => setFilters(p => ({...p, status: e.target.value}))} className="w-36 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-[10px] font-black outline-none">
              <option value="">Todos</option>
              {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Peso:</span>
            <input placeholder="Mín" type="number" value={filtros.minPeso} onChange={e => setFilters(p => ({...p, minPeso: e.target.value}))} className="w-16 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-[10px] font-black" />
            <input placeholder="Máx" type="number" value={filtros.maxPeso} onChange={e => setFilters(p => ({...p, maxPeso: e.target.value}))} className="w-16 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-[10px] font-black" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total R$:</span>
            <input placeholder="Mín" type="number" value={filtros.minTotal} onChange={e => setFilters(p => ({...p, minTotal: e.target.value}))} className="w-20 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-[10px] font-black" />
            <input placeholder="Máx" type="number" value={filtros.maxTotal} onChange={e => setFilters(p => ({...p, maxTotal: e.target.value}))} className="w-20 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-[10px] font-black" />
          </div>
          <button onClick={() => setFilters({ search: '', agency: '', product: '', plate: '', payer: '', sender: '', recipient: '', status: '', minPeso: '', maxPeso: '', minTotal: '', maxTotal: '' })} className="ml-auto text-[10px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-600 transition-colors">Limpar filtros</button>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col shadow-sm relative">
        <Suspense fallback={
          <div className="flex-1 flex flex-col items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-40">
            <Loader2 size={40} className="animate-spin text-indigo-500 mb-4" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Carregando Operações...</p>
          </div>
        }>
          <Await resolve={dadosPromise}>
            {(resultado: any) => {
              const { data: initialDados, meta } = resultado;
              // Sincronização local para evitar 'flicker' durante revalidação
              const [dados, setDados] = useState(initialDados);
              useEffect(() => setDados(initialDados), [initialDados]);

              const handleLocalUpdate = (id: number, campo: string, valor: string) => {
                setDados((prev: any[]) => prev.map(d => d.id === id ? { ...d, [campo]: valor } : d));
                salvarEdicao(id, campo, valor);
              };

              return (
                <>
                  <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-max">
                      <thead className="sticky top-0 z-20 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="w-14 px-4 py-2.5 text-[10px] font-black text-slate-400 text-center uppercase">Nº</th>
                          <th className="w-12 px-2 py-2.5 text-center">
                            <input type="checkbox" checked={selecionados.size === dados.length && dados.length > 0} onChange={() => {
                              if (selecionados.size === dados.length) setSelecionados(new Set());
                              else setSelecionados(new Set(dados.map((d:any) => d.id)));
                            }} className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 cursor-pointer" />
                          </th>
                          {COLUNAS.map(col => <th key={col.key} style={{ width: col.width, minWidth: col.width }} className="px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100/50 dark:border-slate-800/50 last:border-0">{col.label}</th>)}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {dados.map((row: any, idx: number) => (
                          <tr key={row.id} className={cn("hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors", selecionados.has(row.id) && "bg-indigo-50/50 dark:bg-indigo-900/20")}>
                            <td className="px-4 py-1.5 text-[10px] text-slate-400 font-mono text-center border-r border-slate-100 dark:border-slate-800/50">{(meta.page - 1) * meta.limit + idx + 1}</td>
                            <td className="px-2 py-1.5 border-r border-slate-100 dark:border-slate-800/50 text-center"><input type="checkbox" checked={selecionados.has(row.id)} onChange={() => toggleSelecao(row.id)} className="w-4 h-4 rounded border-slate-300 text-indigo-600 cursor-pointer" /></td>
                            {COLUNAS.map(col => {
                              const estaSalvando = fetcher.state !== "idle" && fetcher.formData?.get("intent") === "update" && fetcher.formData?.get("id") === String(row.id) && fetcher.formData?.get("campo") === col.key;
                              const displayValue = row[col.key];

                              return (
                                <td key={col.key} onDoubleClick={() => setEditing({ id: row.id, campo: col.key, valorTemp: row[col.key] || "" })} className={cn("px-4 py-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 relative border-r border-slate-50 dark:border-slate-800/50 last:border-0", (col.isNumeric || col.isCurrency) && "text-right tabular-nums")}>
                                  {editando?.id === row.id && editando?.campo === col.key ? (
                                    col.key === "status" ? (
                                      <select autoFocus value={editando.valorTemp} onChange={e => setEditing({...editando, valorTemp: e.target.value})} onBlur={() => handleLocalUpdate(row.id, col.key, editando.valorTemp)} className="absolute inset-0 w-full h-full bg-white dark:bg-slate-800 border-[1.5px] border-indigo-500 px-2 outline-none z-30 font-bold text-slate-900 dark:text-white text-[11px]"><option value="">Selecione...</option>{STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select>
                                    ) : (
                                      <input autoFocus value={editando.valorTemp} onChange={e => setEditing({...editando, valorTemp: e.target.value})} onBlur={() => handleLocalUpdate(row.id, col.key, editando.valorTemp)} onKeyDown={e => e.key === "Enter" && handleLocalUpdate(row.id, col.key, editando.valorTemp)} className="absolute inset-0 w-full h-full bg-white dark:bg-slate-800 border-[1.5px] border-indigo-500 px-4 outline-none z-30 font-bold text-slate-900 dark:text-white text-[11px]" />
                                    )
                                  ) : (
                                    <span className={cn("truncate block", col.key === "status" && "px-1.5 py-0.5 rounded-lg text-[9px] font-black inline-block bg-slate-100 dark:bg-slate-800", estaSalvando && "opacity-50")} title={String(displayValue || "")}>
                                      {col.key === "dt_emissao_" ? formatarData(displayValue) : (col.isCurrency ? formatarMoeda(displayValue) : (col.isNumeric ? formatarNumero(displayValue) : displayValue || "-"))}
                                    </span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="px-8 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total: {meta.total} registros</div>
                      <select 
                        value={searchParams.get("limit") || "100"} 
                        onChange={(e) => {
                          const p = new URLSearchParams(searchParams);
                          p.set("limit", e.target.value);
                          p.set("page", "1");
                          setSearchParams(p);
                        }}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1 text-[10px] font-black outline-none text-slate-500"
                      >
                        {[100, 200, 500, 1000].map(v => <option key={v} value={v}>{v} por página</option>)}
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <button onClick={() => { const p = new URLSearchParams(searchParams); p.set("page", String(Math.max(1, meta.page - 1))); setSearchParams(p); }} disabled={meta.page === 1} className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold disabled:opacity-30 transition-all hover:bg-slate-50 shadow-sm">Anterior</button>
                      <div className="px-4 py-2 bg-indigo-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-indigo-500/20">{meta.page} / {meta.totalPages}</div>
                      <button onClick={() => { const p = new URLSearchParams(searchParams); p.set("page", String(Math.min(meta.totalPages, meta.page + 1))); setSearchParams(p); }} disabled={meta.page >= meta.totalPages} className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold disabled:opacity-30 transition-all hover:bg-slate-50 shadow-sm">Próxima</button>
                    </div>
                  </div>
                </>
              );
            }}
          </Await>
        </Suspense>
      </div>
    </div>
  );
}