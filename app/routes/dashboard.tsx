import { useLoaderData, data, useNavigate } from "react-router";
import { OperacaoService } from "~/services/operacao.server";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell
} from "recharts";
import { 
  Clock, AlertCircle, Layers, FileSpreadsheet, ChevronRight, X, 
  TrendingUp, Scale, MapPin, Activity, Star, Globe, CheckCircle2, ChevronDown
} from "lucide-react";
import { useState, useEffect } from "react";
import { requireUser } from "~/services/auth.server";
import type { LoaderFunctionArgs } from "react-router";

const CORES = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f43f5e'];

export async function loader({ request }: LoaderFunctionArgs) {
  const { response } = await requireUser(request);
  const stats = await OperacaoService.getDashboard();
  return data(stats, { headers: response.headers });
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function Dashboard() {
  const estatisticas = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [modalStatus, setModalStatus] = useState<string | null>(null);
  const [showAllRoutes, setShowAllRoutes] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setIsDark(document.documentElement.classList.contains('dark'));
    const observer = new MutationObserver(() => setIsDark(document.documentElement.classList.contains('dark')));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  if (!estatisticas || !estatisticas.porAgencia) return null;

  const statusMap = estatisticas.totais.statusMap || {};
  const statusPrioritarios = ['PENDENTE', 'DIVERGENTE'];
  const todosStatus = Object.keys(statusMap).sort((a, b) => {
    if (statusPrioritarios.includes(a) && !statusPrioritarios.includes(b)) return -1;
    if (!statusPrioritarios.includes(a) && statusPrioritarios.includes(b)) return 1;
    return statusMap[b] - statusMap[a];
  });

  const statusColors: Record<string, string> = {
    'PENDENTE': 'text-amber-600 border-amber-500/30 bg-amber-500/10',
    'DIVERGENTE': 'text-rose-600 border-rose-500/30 bg-rose-500/10',
    'ILEGIVEL': 'text-indigo-600 border-indigo-500/30 bg-indigo-500/10',
    'ANEXADO': 'text-emerald-600 border-emerald-500/30 bg-emerald-500/10',
    'POSTO': 'text-blue-600 border-blue-500/30 bg-blue-500/10',
    'LIBERADA': 'text-cyan-600 border-cyan-500/30 bg-cyan-500/10',
    'MDF EM ABERTO': 'text-orange-600 border-orange-500/30 bg-orange-500/10',
    'MDF CANCELADO': 'text-slate-500 border-slate-500/30 bg-slate-500/10',
    'FILTRADA': 'text-violet-600 border-violet-500/30 bg-violet-500/10',
  };

  const getStatusStyle = (status: string, index: number) => {
    const s = (status || "").trim().toUpperCase();
    if (statusColors[s]) return statusColors[s];
    
    // Fallback para garantir que TODOS tenham cor, mesmo status novos
    const fallbackColors = [
      'text-fuchsia-600 border-fuchsia-500/30 bg-fuchsia-500/10',
      'text-teal-600 border-teal-500/30 bg-teal-500/10',
      'text-lime-600 border-lime-500/30 bg-lime-500/10',
      'text-sky-600 border-sky-500/30 bg-sky-500/10',
      'text-pink-600 border-pink-500/30 bg-pink-500/10'
    ];
    return fallbackColors[index % fallbackColors.length];
  };

  const textColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* Modal Genérico de Diagnóstico */}
      {modalStatus && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black uppercase tracking-tight text-slate-800 dark:text-white">{modalStatus}</h2>
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-0.5">Localização nas Pastas</p>
              </div>
              <button onClick={() => setModalStatus(null)} className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-rose-500 transition-all">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 max-h-[50vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-2">
                {estatisticas.detailedBreakdowns[modalStatus]?.map((item: any, i: number) => (
                  <button 
                    key={i} 
                    onClick={() => {
                      setModalStatus(null);
                      const target = item.id === null ? '/caixa-de-entrada' : `/pastas/${item.id}`;
                      navigate(`${target}?status=${modalStatus}`);
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-transparent hover:border-blue-500/30 hover:bg-white dark:hover:bg-slate-800 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-md">
                        {item.count}
                      </div>
                      <span className="font-bold text-slate-700 dark:text-slate-100 text-sm">{item.label}</span>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BLOCO 1: HUB OPERACIONAL (STATUS NO TOPO) */}
      <section>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-5 bg-blue-600 rounded-full" />
            <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Fluxo Operacional</h2>
          </div>
          <p className="text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800/50 px-3 py-1 rounded-lg">Clique para diagnosticar</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {todosStatus.map((status, i) => {
            const count = statusMap[status];
            const style = getStatusStyle(status, i);
            
            return (
              <button 
                key={i} 
                onClick={() => setModalStatus(status)}
                className={cn(
                  "p-4 rounded-3xl border transition-all text-left flex flex-col justify-between group h-28 relative overflow-hidden",
                  style, // Aplica cores personalizadas (bg, border, text) para TODOS os cards
                  "hover:shadow-md hover:scale-[1.02] active:scale-95"
                )}
              >
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest mb-1 truncate opacity-80">{status}</p>
                  <p className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">{count}</p>
                </div>
                <div className="flex items-center justify-end">
                  <div className="p-1 px-2 bg-white/50 dark:bg-slate-800/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronDown size={12} className="text-inherit" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* BLOCO 2: RESUMO EXECUTIVO (FINANCEIRO PADRONIZADO) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-around relative group">
          <div className="flex flex-col items-center text-center">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-3 flex items-center gap-1.5">
              <TrendingUp size={12} className="text-emerald-500" /> Faturamento Total
            </span>
            <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter tabular-nums leading-none">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estatisticas.totais._sum.vl_total)}
            </p>
          </div>
          
          <div className="w-[1px] h-12 bg-slate-100 dark:bg-slate-800" />
          
          <div className="flex flex-col items-center text-center">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-3 flex items-center gap-1.5">
              <Scale size={12} className="text-blue-500" /> Volume Processado
            </span>
            <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter tabular-nums leading-none">
              {new Intl.NumberFormat('pt-BR').format(estatisticas.totais._sum.vl_peso)} <small className="text-sm font-bold opacity-30 uppercase">kg</small>
            </p>
          </div>
        </div>

        <button 
          onClick={() => navigate('/caixa-de-entrada')}
          className="bg-white dark:bg-slate-900 rounded-[2rem] p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between px-6 hover:border-blue-500 transition-all hover:bg-slate-50 dark:hover:bg-slate-800 group"
        >
           <div className="text-left">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Total Geral</p>
              <p className="text-2xl font-black text-slate-800 dark:text-white leading-none">{estatisticas.totais._count.id} <small className="text-xs font-bold opacity-40 uppercase">Itens</small></p>
           </div>
           <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
             <Layers size={20} />
           </div>
        </button>
      </section>

      {/* BLOCO 3: ANALYTICS (SIDE-BY-SIDE COMPACT) */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Performance por Agência</h3>
            <Activity size={16} className="text-blue-500 opacity-50" />
          </div>
          <div className="h-[250px] w-full">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={estatisticas.porAgencia.map((a: any) => ({ name: (a.nm_agencia || '').split('-')[0].trim(), total: a._sum.vl_total }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#334155" : "#e2e8f0"} opacity={0.5} />
                  <XAxis dataKey="name" hide={true} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 10, fontWeight: 800 }} tickFormatter={(v) => `R$ ${v/1000}k`} />
                  <Tooltip cursor={{ fill: isDark ? '#33415533' : '#6366f111' }} contentStyle={{ borderRadius: '16px', backgroundColor: isDark ? '#0f172a' : '#fff', border: 'none', padding: '10px' }} />
                  <Bar dataKey="total" fill="#6366f1" radius={[10, 10, 0, 0]} barSize={35} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Mix de Produtos</h3>
            <Globe size={16} className="text-emerald-500 opacity-50" />
          </div>
          <div className="flex-1 min-h-[250px]">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={estatisticas.porProduto.map((p: any) => ({ name: p.nm_produto || 'Outros', value: p._count.id }))} 
                    innerRadius={60} 
                    outerRadius={90} 
                    paddingAngle={5} 
                    dataKey="value" 
                    stroke="none"
                    cx="50%"
                    cy="50%"
                  >
                    {estatisticas.porProduto.map((_:any, index:number) => <Cell key={`cell-${index}`} fill={CORES[index % CORES.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '16px', backgroundColor: isDark ? '#0f172a' : '#fff', border: 'none', padding: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

      {/* BLOCO 4: LOGÍSTICA (ROTAS) */}
      <section className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-blue-500" />
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Geografia do Fluxo Logístico</h3>
          </div>
          <button 
            onClick={() => setShowAllRoutes(!showAllRoutes)}
            className="text-[9px] font-black uppercase tracking-widest px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
          >
            {showAllRoutes ? "Ver Menos (-5)" : "Ver Ranking Completo (+10)"}
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <div>
              <p className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" /> Cidades de Origem (Onde a Carga é Gerada)
              </p>
              <div className="space-y-4">
                {estatisticas.topOrigens.slice(0, showAllRoutes ? 10 : 5).map((o: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-slate-500/50 w-4">{i+1 < 10 ? `0${i+1}` : i+1}</span>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{o.nm_cidade_origem}</span>
                        <div className="text-right">
                          <span className="text-[10px] font-black text-blue-600 block leading-none">{o._count.id}</span>
                          <span className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter">Cargas Geradas</span>
                        </div>
                      </div>
                      <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${(o._count.id / estatisticas.topOrigens[0]._count.id) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Cidades de Destino (Onde a Carga é Entregue)
              </p>
              <div className="space-y-4">
                {estatisticas.topDestinos.slice(0, showAllRoutes ? 10 : 5).map((d: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-slate-500/50 w-4">{i+1 < 10 ? `0${i+1}` : i+1}</span>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{d.nm_cidade_destino}</span>
                        <div className="text-right">
                          <span className="text-[10px] font-black text-emerald-600 block leading-none">{d._count.id}</span>
                          <span className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter">Cargas Recebidas</span>
                        </div>
                      </div>
                      <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${(d._count.id / estatisticas.topDestinos[0]._count.id) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BLOCO 5: HISTÓRICO (TIMELINE FINAL) */}
      <section className="bg-slate-50/50 dark:bg-slate-900/30 p-6 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-6">Fila de Importação Recente</h3>
        <div className="relative space-y-3 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-200 dark:before:bg-slate-800">
          {estatisticas.ultimasImportacoes?.map((imp: any) => (
            <div key={imp.id} className="relative pl-10 group">
              <div className="absolute left-[15px] top-3 w-2.5 h-2.5 rounded-full bg-blue-600 z-10 shadow-lg" />
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group-hover:border-blue-500/30 transition-all">
                <div className="flex items-center gap-4">
                  <FileSpreadsheet size={18} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                  <div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-100 leading-none mb-1">{imp.nomeArquivo}</p>
                    <div className="flex items-center gap-2">
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{new Date(imp.createdAt).toLocaleString('pt-BR')}</p>
                       <span className="w-1 h-1 bg-slate-300 rounded-full" />
                       <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Por: {imp.usuario}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">{imp.qtdRegistros} Regs</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
