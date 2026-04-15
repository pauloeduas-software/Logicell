import React, { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Search, UploadCloud, Download, Loader2, Edit3, Map, Landmark, PackageSearch, Truck, Package, CheckSquare, XSquare, PlusSquare, MinusSquare } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Dashboard } from './Dashboard';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

const COLUNAS = [
  { key: 'nm_agencia', label: 'Agência', width: '180px' },
  { key: 'dt_emissao_', label: 'Emissão', width: '120px' },
  { key: 'nm_pessoa_pagador', label: 'Pagador', width: '250px' },
  { key: 'nr_ctrc', label: 'CTRC', width: '120px' },
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
  { key: 'id_tipo_ctrc', label: 'Tipo CTRC', width: '120px' },
  { key: 'nm_proprietario_posse_cavalo', label: 'Proprietário', width: '200px' },
  { key: 'nm_motorista', label: 'Motorista', width: '250px' },
];

const formatarMoeda = (val: any) => val ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val)) : '-';
const formatarData = (val: any) => val ? new Date(val).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-';

export const LogisticsTable: React.FC<{ onlyWorkListMode?: boolean }> = ({ onlyWorkListMode = false }) => {
  const [dados, setDados] = useState<any[]>([]);
  const [agencias, setAgencias] = useState<string[]>([]);
  const [filtros, setFilters] = useState({ 
    search: '', agency: '', product: '', driver: '', plate: '', payer: '',
    minPeso: '', maxPeso: '', minTotal: '', maxTotal: ''
  });
  const [paginacao, setPagination] = useState({ pagina: 1, limite: 100, total: 0, totalPaginas: 0 });
  const [editando, setEditing] = useState<{ id: number; campo: string; valorTemp: string } | null>(null);
  const [carregando, setLoading] = useState(false);
  const [subindo, setUploading] = useState(false);
  
  // Estado para controlar se o botão de lote está no modo "Remover"
  const [loteMarcado, setLoteMarcado] = useState(false);

  useEffect(() => { fetch('/api/agencies').then(r => r.json()).then(setAgencias); }, []);

  const buscarDados = useCallback(async () => {
    setLoading(true);
    // MAPEAMENTO CORRETO DAS CHAVES PARA O BACKEND
    const params = new URLSearchParams({
      search: filtros.search,
      nm_agencia: filtros.agency,
      nm_produto: filtros.product,
      nm_motorista: filtros.driver,
      ds_placa: filtros.plate,
      nm_pessoa_pagador: filtros.payer,
      min_peso: filtros.minPeso,
      max_peso: filtros.maxPeso,
      min_total: filtros.minTotal,
      max_total: filtros.maxTotal,
      onlyWorkList: String(onlyWorkListMode),
      page: String(paginacao.pagina),
      limit: String(paginacao.limite)
    });
    try {
      const res = await fetch(`/api/operacoes?${params}`);
      const json = await res.json();
      setDados(json.data);
      setPagination(prev => ({ ...prev, total: json.meta.total, totalPaginas: json.meta.totalPages }));
    } finally { setLoading(false); }
  }, [filtros, paginacao.pagina, paginacao.limite, onlyWorkListMode]);

  useEffect(() => {
    const timer = setTimeout(buscarDados, 300);
    return () => clearTimeout(timer);
  }, [buscarDados]);

  useEffect(() => { 
    setPagination(p => ({ ...p, pagina: 1 }));
    setLoteMarcado(false); // Reseta o toggle de lote ao mudar filtros
  }, [filtros, onlyWorkListMode]);

  const toggleBulk = async () => {
    setLoading(true);
    const acao = onlyWorkListMode ? 'remove' : (loteMarcado ? 'remove' : 'add');
    
    // Busca todos os IDs filtrados
    const params = new URLSearchParams({
      search: filtros.search,
      nm_agencia: filtros.agency,
      nm_produto: filtros.product,
      nm_motorista: filtros.driver,
      ds_placa: filtros.plate,
      nm_pessoa_pagador: filtros.payer,
      min_peso: filtros.minPeso,
      max_peso: filtros.maxPeso,
      min_total: filtros.minTotal,
      max_total: filtros.maxTotal,
      onlyWorkList: String(onlyWorkListMode)
    });
    
    const response = await fetch(`/api/export?${params}`);
    const items = await response.json();
    const ids = items.map((i: any) => i.id);

    if (ids.length > 0) {
      await fetch('/api/worklist/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action: acao })
      });
    }
    
    if (!onlyWorkListMode) setLoteMarcado(!loteMarcado);
    buscarDados();
  };

  const salvarEdicao = async (id: number, campo: string, valor: string) => {
    await fetch(`/api/operacoes/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [campo]: valor }) });
    setDados(prev => prev.map(row => row.id === id ? { ...row, [campo]: valor } : row));
    setEditing(null);
  };

  const exportarExcel = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      search: filtros.search, nm_agencia: filtros.agency, nm_produto: filtros.product,
      nm_motorista: filtros.driver, ds_placa: filtros.plate, nm_pessoa_pagador: filtros.payer,
      min_peso: filtros.minPeso, max_peso: filtros.maxPeso, min_total: filtros.minTotal, max_total: filtros.maxTotal,
      onlyWorkList: String(onlyWorkListMode)
    });
    const response = await fetch(`/api/export?${params}`);
    const allData = await response.json();

    const exportData = allData.map((row: any) => {
      const obj: any = {};
      COLUNAS.forEach(col => obj[col.label] = col.key === 'dt_emissao_' ? formatarData(row[col.key]) : row[col.key]);
      return obj;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Export");
    XLSX.writeFile(wb, `Logicell_Export_${onlyWorkListMode ? 'Lista' : 'Filtros'}.xlsx`);
    setLoading(false);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-4 animate-in fade-in duration-500">
      
      {/* HEADER / BUSCA / LOTE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-[2rem] shadow-sm flex flex-col xl:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            placeholder="Pesquisar em tudo..." 
            value={filtros.search}
            onChange={(e) => setFilters(p => ({ ...p, search: e.target.value }))}
            className="w-full bg-slate-100/50 dark:bg-slate-800/50 border-0 rounded-2xl pl-12 pr-4 py-3.5 outline-none focus:ring-2 focus:ring-indigo-500/50 text-base font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full xl:w-auto">
          {/* BOTÃO TOGGLE INTELIGENTE */}
          <button 
            onClick={toggleBulk} 
            className={cn(
              "flex-1 xl:flex-none flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-xs transition-all shadow-md",
              onlyWorkListMode || loteMarcado 
                ? "bg-rose-600 text-white shadow-rose-500/20" 
                : "bg-indigo-600 text-white shadow-indigo-500/20"
            )}
          >
            {onlyWorkListMode || loteMarcado ? <MinusSquare size={18} /> : <PlusSquare size={18} />}
            {onlyWorkListMode ? 'Remover Filtrados' : (loteMarcado ? 'Desmarcar Filtrados' : 'Selecionar Filtrados')}
          </button>
          
          <button onClick={exportarExcel} className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-500/20">
            <Download size={18} /> Exportar {onlyWorkListMode ? 'Lista' : 'Filtros'}
          </button>
        </div>
      </div>

      {/* PAINEL DE FILTROS (CHAVES CORRIGIDAS) */}
      <div className="bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-4 flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <select value={filtros.agency} onChange={(e) => setFilters(p => ({ ...p, agency: e.target.value }))} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl pl-9 pr-2 py-2 outline-none text-xs font-bold appearance-none">
              <option value="">Todas Agências</option>
              {agencias.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <input placeholder="Pagador" value={filtros.payer} onChange={e => setFilters(p => ({...p, payer: e.target.value}))} className="flex-1 min-w-[140px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl px-4 py-2 outline-none text-xs font-bold" />
          <input placeholder="Produto" value={filtros.product} onChange={e => setFilters(p => ({...p, product: e.target.value}))} className="flex-1 min-w-[140px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl px-4 py-2 outline-none text-xs font-bold" />
          <input placeholder="Motorista" value={filtros.driver} onChange={e => setFilters(p => ({...p, driver: e.target.value}))} className="flex-1 min-w-[140px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl px-4 py-2 outline-none text-xs font-bold" />
          <input placeholder="Placa" value={filtros.plate} onChange={e => setFilters(p => ({...p, plate: e.target.value}))} className="flex-1 min-w-[140px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl px-4 py-2 outline-none text-xs font-bold" />
        </div>
        
        <div className="flex flex-wrap gap-6 items-center border-t border-slate-100 dark:border-slate-800 pt-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase">Peso:</span>
            <input placeholder="Mín" type="number" value={filtros.minPeso} onChange={e => setFilters(p => ({...p, minPeso: e.target.value}))} className="w-20 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs" />
            <input placeholder="Máx" type="number" value={filtros.maxPeso} onChange={e => setFilters(p => ({...p, maxPeso: e.target.value}))} className="w-20 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase">Total R$:</span>
            <input placeholder="Mín" type="number" value={filtros.minTotal} onChange={e => setFilters(p => ({...p, minTotal: e.target.value}))} className="w-24 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs" />
            <input placeholder="Máx" type="number" value={filtros.maxTotal} onChange={e => setFilters(p => ({...p, maxTotal: e.target.value}))} className="w-24 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs" />
          </div>
          <button onClick={() => setFilters({ search: '', agency: '', product: '', driver: '', plate: '', payer: '', minPeso: '', maxPeso: '', minTotal: '', maxTotal: '' })} className="ml-auto text-[10px] font-black text-rose-500 uppercase">Limpar Filtros</button>
        </div>
      </div>

      {/* TABELA */}
      <div className="flex-1 min-h-0 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col shadow-sm">
        {carregando && <div className="h-1 w-full bg-indigo-500 animate-pulse" />}
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-max">
            <thead className="sticky top-0 z-20 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="w-14 px-4 py-4 text-[10px] font-black text-slate-400 text-center uppercase">Nº</th>
                <th className="w-12 px-2 py-4 text-center"><Package size={16} className="mx-auto text-slate-400" /></th>
                {COLUNAS.map(col => (
                  <th key={col.key} style={{ width: col.width, minWidth: col.width }} className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100/50 dark:border-slate-800/50 last:border-0">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {dados.map((row, index) => (
                <tr key={row.id} className={cn("hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors", row.naListaTrabalho && "bg-indigo-50/50 dark:bg-indigo-900/20")}>
                  <td className="px-4 py-3 text-[10px] text-slate-400 font-mono text-center border-r border-slate-100 dark:border-slate-800/50">{(paginacao.pagina - 1) * paginacao.limite + index + 1}</td>
                  <td className="px-2 py-3 border-r border-slate-100 dark:border-slate-800/50 text-center">
                    <input type="checkbox" checked={!!row.naListaTrabalho} onChange={() => {
                      fetch('/api/worklist/toggle', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ operacaoId: row.id }) });
                      setDados(prev => prev.map(r => r.id === row.id ? { ...r, naListaTrabalho: r.naListaTrabalho ? null : { id: 0 } } : r));
                    }} className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 cursor-pointer" />
                  </td>
                  {COLUNAS.map(col => (
                    <td key={col.key} onDoubleClick={() => setEditing({ id: row.id, campo: col.key, valorTemp: row[col.key] || '' })} className={cn("px-4 py-3.5 text-xs font-semibold text-slate-600 dark:text-slate-300 relative border-r border-slate-50 dark:border-slate-800/50 last:border-0", (col.isNumeric || col.isCurrency) && "text-right tabular-nums")}>
                      {editando?.id === row.id && editando?.campo === col.key ? (
                        <input autoFocus value={editando.valorTemp} onChange={e => setEditing({...editando, valorTemp: e.target.value})} onBlur={() => salvarEdicao(row.id, col.key, editando.valorTemp)} onKeyDown={e => e.key === 'Enter' && salvarEdicao(row.id, col.key, editando.valorTemp)} className="absolute inset-0 w-full h-full bg-white dark:bg-slate-800 border-2 border-indigo-500 px-4 outline-none z-30 font-bold" />
                      ) : (
                        <span className="truncate block" title={String(row[col.key] || '')}>
                          {col.key === 'dt_emissao_' ? formatarData(row[col.key]) : (col.isCurrency ? formatarMoeda(row[col.key]) : row[col.key] || '-')}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-8 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center transition-colors">
          <div className="flex items-center gap-4">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total: {paginacao.total} registros</div>
            <select 
              value={paginacao.limite} 
              onChange={(e) => setPagination(p => ({ ...p, limite: Number(e.target.value), pagina: 1 }))}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1 text-[10px] font-black outline-none text-slate-500"
            >
              {[100, 200, 500, 1000].map(v => <option key={v} value={v}>{v} por página</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setPagination(p => ({ ...p, pagina: Math.max(1, p.pagina - 1) }))} disabled={paginacao.pagina === 1} className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold disabled:opacity-30 transition-all hover:bg-slate-50 shadow-sm">Anterior</button>
            <div className="px-4 py-2 bg-indigo-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-indigo-500/20">{paginacao.pagina} / {paginacao.totalPaginas}</div>
            <button onClick={() => setPagination(p => ({ ...p, pagina: Math.min(paginacao.totalPaginas, p.pagina + 1) }))} disabled={paginacao.pagina >= paginacao.totalPaginas} className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold disabled:opacity-30 transition-all hover:bg-slate-50 shadow-sm">Próxima</button>
          </div>
        </div>
      </div>
    </div>
  );
};
