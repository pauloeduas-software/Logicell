// /home/penta/Logicell/frontend/src/components/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { TrendingUp, Package, Users, Calendar } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(setStats)
      .catch(err => console.error("Erro ao carregar mini dashboard", err));
  }, []);

  if (!stats || !stats.totais) return null;

  const totalFaturado = stats.totais._sum?.vl_total || 0;
  const totalPeso = stats.totais._sum?.vl_peso || 0;
  const totalOperacoes = stats.totais._count?.id || 0;
  const ultimaImport = (stats.ultimasImportacoes && stats.ultimasImportacoes.length > 0) 
    ? stats.ultimasImportacoes[0].nomeArquivo 
    : 'Nenhuma';

  const cards = [
    { label: 'Total Faturado', value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalFaturado), icon: TrendingUp, color: 'text-emerald-500' },
    { label: 'Volume Total', value: new Intl.NumberFormat('pt-BR').format(totalPeso) + ' kg', icon: Package, color: 'text-indigo-500' },
    { label: 'Operações', value: totalOperacoes, icon: Users, color: 'text-blue-500' },
    { label: 'Última Importação', value: ultimaImport, icon: Calendar, color: 'text-amber-500' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
      {cards.map((card, i) => (
        <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
          <div className={`p-3 rounded-xl bg-slate-50 dark:bg-slate-800 ${card.color}`}>
            <card.icon size={20} />
          </div>
          <div className="overflow-hidden">
            <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider truncate">{card.label}</p>
            <p className="text-base font-bold text-slate-700 dark:text-slate-200 truncate">{card.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
