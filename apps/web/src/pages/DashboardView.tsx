// /home/penta/Logicell/frontend/src/pages/DashboardView.tsx
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, Package, Users, Wallet, Calendar, FileSpreadsheet } from 'lucide-react';

const CORES = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const DashboardView: React.FC = () => {
  const [estatisticas, setStats] = useState<any>(null);
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(setStats);
    const observer = new MutationObserver(() => setIsDark(document.documentElement.classList.contains('dark')));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  if (!estatisticas || !estatisticas.porAgencia) return (
    <div className="flex-1 flex items-center justify-center"><div className="animate-pulse text-slate-400 font-bold text-xl tracking-widest">CARREGANDO...</div></div>
  );

  const cards = [
    { label: 'Total Faturado', value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estatisticas.totais._sum?.vl_total || 0), icon: Wallet, color: 'bg-emerald-500' },
    { label: 'Volume Total', value: new Intl.NumberFormat('pt-BR').format(estatisticas.totais._sum?.vl_peso || 0) + ' kg', icon: Package, color: 'bg-indigo-500' },
    { label: 'Operações', value: estatisticas.totais._count?.id || 0, icon: Users, color: 'bg-blue-500' },
    { label: 'Última Importação', value: estatisticas.ultimasImportacoes?.[0]?.nomeArquivo || 'Nenhuma', icon: FileSpreadsheet, color: 'bg-amber-500' },
  ];

  const dadosBarra = estatisticas.porAgencia.map((item: any) => ({
    name: (item.nm_agencia || '').split('-')[0].trim().substring(0, 12),
    total: Number(item._sum.vl_total || 0)
  }));

  const dadosPizza = estatisticas.porProduto.map((item: any) => ({
    name: item.nm_produto || 'Outros',
    value: item._count.id
  }));

  const textColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
            <div className={`w-12 h-12 rounded-2xl ${card.color} flex items-center justify-center text-white mb-4 shadow-lg opacity-90`}><card.icon size={24} /></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{card.label}</p>
            <p className="text-xl font-black text-slate-800 dark:text-white truncate">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
        {/* Gráfico de Barras */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10">Faturamento por Agência (R$)</h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosBarra} margin={{ bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#334155" : "#e2e8f0"} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 10, fontWeight: 700 }} dy={15} interval={0} angle={-25} textAnchor="end" />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 10, fontWeight: 600 }} tickFormatter={(v) => `R$ ${v / 1000}k`} />
                <Tooltip cursor={{ fill: isDark ? '#33415555' : '#6366f111' }} contentStyle={{ borderRadius: '20px', backgroundColor: isDark ? '#0f172a' : '#fff', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.3)' }} />
                <Bar dataKey="total" fill="#6366f1" radius={[10, 10, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Pizza */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Distribuição por Produto</h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={dadosPizza} innerRadius={90} outerRadius={130} paddingAngle={8} dataKey="value" stroke="none">
                  {dadosPizza.map((_:any, index:number) => <Cell key={`cell-${index}`} fill={CORES[index % CORES.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '20px', backgroundColor: isDark ? '#0f172a' : '#fff', border: 'none' }} />
                <Legend verticalAlign="bottom" layout="horizontal" wrapperStyle={{ paddingTop: '30px', fontSize: '10px', fontWeight: 700 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Histórico Recente */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Histórico Recente de Importações</h3>
        <div className="space-y-3">
          {estatisticas.ultimasImportacoes?.map((imp: any) => (
            <div key={imp.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 transition-hover hover:border-indigo-500/30">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-white dark:bg-slate-900 rounded-lg shadow-sm text-indigo-500"><FileSpreadsheet size={20} /></div>
                <div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{imp.nomeArquivo}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{new Date(imp.createdAt).toLocaleString('pt-BR')}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">{imp.qtdRegistros} linhas</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Processado com sucesso</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
