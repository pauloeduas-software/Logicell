// /home/penta/Logicell/frontend/src/components/LogisticsTable.tsx
import React, { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Search, Download, Edit3, Landmark, Truck, Package, PlusSquare, MinusSquare, FolderPlus, FolderMinus, ChevronDown, CheckCircle2, Table as TableIcon, Trash2, UploadCloud, Loader2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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

const formatarMoeda = (val: any) => val ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val)) : '-';
const formatarData = (val: any) => val ? new Date(val).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-';

interface Props {
  pastaId?: number;
  nomePasta?: string;
}

export const LogisticsTable: React.FC<Props> = ({ pastaId, nomePasta }) => {
  const [dados, setDados] = useState<any[]>([]);
  const [agencias, setAgencias] = useState<string[]>([]);
  const [pastas, setPastas] = useState<any[]>([]);
  const [filtros, setFilters] = useState({
    search: '', agency: '', product: '', plate: '', payer: '', sender: '', recipient: '',
    minPeso: '', maxPeso: '', minTotal: '', maxTotal: ''
  });
  const [paginacao, setPagination] = useState({ pagina: 1, limite: 100, total: 0, totalPaginas: 0 });
  const [editando, setEditing] = useState<{ id: number; campo: string; valorTemp: string } | null>(null);
  const [carregando, setLoading] = useState(false);
  const [subindo, setUploading] = useState(false);
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set());
  const [showPastaMenu, setShowPastaMenu] = useState(false);

  const carregarPastasDropdown = () => {
    fetch('/api/pastas').then(r => r.json()).then(setPastas);
  };

  const lidarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      if (res.ok) {
        alert(`Sucesso! ${data.adicionados} novos itens adicionados. (${data.ignorados} duplicatas ignoradas)`);
        buscarDados();
        window.dispatchEvent(new CustomEvent('folderUpdate'));
      } else {
        alert(`Erro: ${data.error}`);
      }
    } catch (err) {
      alert('Erro ao enviar arquivo.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const carregarAgencias = () => {
    fetch('/api/agencies').then(r => r.json()).then(setAgencias);
  };

  useEffect(() => { 
    carregarAgencias();
    carregarPastasDropdown();
    window.addEventListener('folderUpdate', carregarPastasDropdown);
    return () => window.removeEventListener('folderUpdate', carregarPastasDropdown);
  }, []);

  const buscarDados = useCallback(async () => {
    setLoading(true);
    carregarAgencias();
    const params = new URLSearchParams({
      search: filtros.search,
      nm_agencia: filtros.agency,
      nm_produto: filtros.product,
      ds_placa: filtros.plate,
      nm_pessoa_pagador: filtros.payer,
      nm_pessoa_remetente: filtros.sender,
      nm_pessoa_destinatario: filtros.recipient,
      min_peso: filtros.minPeso,
      max_peso: filtros.maxPeso,
      min_total: filtros.minTotal,
      max_total: filtros.maxTotal,
      page: String(paginacao.pagina),
      limit: String(paginacao.limite)
    });

    if (pastaId) params.append('pastaId', String(pastaId));

    try {
      const res = await fetch(`/api/operacoes?${params}`);
      const json = await res.json();
      if (res.ok && json.data) {
        setDados(json.data);
        setPagination(prev => ({ ...prev, total: json.meta?.total || 0, totalPaginas: json.meta?.totalPages || 0 }));
      } else {
        setDados([]);
      }
    } catch (err) {
      setDados([]);
    } finally { setLoading(false); }
  }, [filtros, paginacao.pagina, paginacao.limite, pastaId]);

  useEffect(() => {
    const timer = setTimeout(buscarDados, 300);
    window.addEventListener('folderUpdate', buscarDados);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('folderUpdate', buscarDados);
    };
  }, [buscarDados]);

  useEffect(() => { 
    setPagination(p => ({ ...p, pagina: 1 }));
    setSelecionados(new Set());
  }, [filtros, pastaId]);

  const toggleSelecao = (id: number) => {
    const novos = new Set(selecionados);
    if (novos.has(id)) novos.delete(id);
    else novos.add(id);
    setSelecionados(novos);
  };

  const selecionarTudoNaPagina = () => {
    if (selecionados.size === dados.length) setSelecionados(new Set());
    else setSelecionados(new Set(dados.map(d => d.id)));
  };

  const adicionarAPasta = async (idPastaDestino: number | null) => {
    setLoading(true);
    let ids: number[] = [];

    if (selecionados.size > 0) {
      ids = Array.from(selecionados);
    } else {
      const params = new URLSearchParams({
        search: filtros.search, nm_agencia: filtros.agency, nm_produto: filtros.product,
        ds_placa: filtros.plate, nm_pessoa_pagador: filtros.payer,
        min_peso: filtros.minPeso, max_peso: filtros.maxPeso, min_total: filtros.minTotal, max_total: filtros.maxTotal
      });
      if (pastaId) params.append('pastaId', String(pastaId));

      const response = await fetch(`/api/export?${params}`);
      const items = await response.json();
      ids = items.map((i: any) => i.id);
    }

    if (ids.length > 0) {
      const res = await fetch('/api/pastas/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, pastaId: idPastaDestino, action: idPastaDestino === null ? 'remove' : 'add' })
      });
      if (res.ok) {
        window.dispatchEvent(new CustomEvent('folderUpdate'));
      }
    }
    
    setSelecionados(new Set());
    setShowPastaMenu(false);
    setLoading(false);
  };

  const excluirItens = async () => {
    let ids: number[] = [];

    if (selecionados.size > 0) {
      ids = Array.from(selecionados);
    } else {
      const params = new URLSearchParams({
        search: filtros.search, nm_agencia: filtros.agency, nm_produto: filtros.product,
        ds_placa: filtros.plate, nm_pessoa_pagador: filtros.payer,
        min_peso: filtros.minPeso, max_peso: filtros.maxPeso, min_total: filtros.minTotal, max_total: filtros.maxTotal
      });
      if (pastaId) params.append('pastaId', String(pastaId));

      const response = await fetch(`/api/export?${params}`);
      const items = await response.json();
      ids = items.map((i: any) => i.id);
    }

    if (ids.length === 0) return;

    if (!confirm(`TEM CERTEZA? Você está prestes a excluir PERMANENTEMENTE ${ids.length} itens do banco de dados. Esta ação não pode ser desfeita.`)) {
      return;
    }

    setLoading(true);
    const res = await fetch('/api/operacoes/bulk', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids })
    });

    if (res.ok) {
      setSelecionados(new Set());
      buscarDados();
      window.dispatchEvent(new CustomEvent('folderUpdate'));
      alert(`${ids.length} itens excluídos com sucesso.`);
    }
    setLoading(false);
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
      ds_placa: filtros.plate, nm_pessoa_pagador: filtros.payer,
      min_peso: filtros.minPeso, max_peso: filtros.maxPeso, min_total: filtros.minTotal, max_total: filtros.maxTotal
    });
    if (pastaId) params.append('pastaId', String(pastaId));

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
    XLSX.writeFile(wb, `Logicell_${nomePasta || 'Geral'}.xlsx`);
    setLoading(false);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-4 animate-in fade-in duration-500">
      
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-[2rem] shadow-sm flex flex-col xl:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4 flex-1 w-full">
          {pastaId && (
            <div className="flex items-center gap-3 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-2xl shrink-0">
              <Truck className="text-indigo-500" size={18} />
              <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{nomePasta}</span>
            </div>
          )}
          
          <label className="flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm group shrink-0">
            {subindo ? (
              <Loader2 size={20} className="animate-spin text-indigo-500" />
            ) : (
              <UploadCloud size={20} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
            )}
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Importar</span>
            <input type="file" className="hidden" accept=".xls,.xlsx" onChange={lidarUpload} disabled={subindo} />
          </label>

          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              placeholder="Pesquisar nestes dados..." 
              value={filtros.search}
              onChange={(e) => setFilters(p => ({ ...p, search: e.target.value.trim() }))}
              className="w-full bg-slate-100/50 dark:bg-slate-800/50 border-0 rounded-2xl pl-12 pr-4 py-3.5 outline-none focus:ring-2 focus:ring-indigo-500/50 text-base font-medium"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 w-full xl:w-auto relative">
          <div className="relative flex-1 xl:flex-none">
            <button 
              onClick={() => setShowPastaMenu(!showPastaMenu)} 
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold text-xs transition-all shadow-lg shadow-indigo-500/20"
            >
              <FolderPlus size={18} />
              {selecionados.size > 0 ? `Mover Selecionados (${selecionados.size})` : 'Mover Filtrados'}
              <ChevronDown size={14} className={cn("transition-transform", showPastaMenu && "rotate-180")} />
            </button>

            {showPastaMenu && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mover para</p>
                </div>
                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                  <button onClick={() => adicionarAPasta(null)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-bold text-indigo-600 dark:text-indigo-400 transition-colors border-b border-slate-100 dark:border-slate-800">
                    <TableIcon size={16} />
                    <span>Caixa de Entrada</span>
                  </button>

                  {pastas.map(p => (
                    <button key={p.id} onClick={() => adicionarAPasta(p.id)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-bold text-slate-600 dark:text-slate-300 transition-colors border-b border-slate-50 dark:border-slate-800/50 last:border-0">
                      <CheckCircle2 size={16} className="text-indigo-500" />
                      <span className="truncate">{p.nome}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <button onClick={excluirItens} className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-rose-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-rose-500/20 hover:bg-rose-700 transition-colors">
            <Trash2 size={18} />
          </button>
          
          <button onClick={exportarExcel} className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-500/20">
            <Download size={18} /> Exportar
          </button>
        </div>
      </div>

      <div className="bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-4 flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <select value={filtros.agency} onChange={(e) => setFilters(p => ({ ...p, agency: e.target.value }))} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl pl-9 pr-2 py-2 outline-none text-xs font-bold appearance-none">
              <option value="">Todas Agências</option>
              {agencias.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <input placeholder="Cliente" value={filtros.payer} onChange={e => setFilters(p => ({...p, payer: e.target.value.trim()}))} className="flex-1 min-w-[140px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl px-4 py-2 outline-none text-xs font-bold" />
          <input placeholder="Remetente" value={filtros.sender} onChange={e => setFilters(p => ({...p, sender: e.target.value.trim()}))} className="flex-1 min-w-[140px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl px-4 py-2 outline-none text-xs font-bold" />
          <input placeholder="Destinatário" value={filtros.recipient} onChange={e => setFilters(p => ({...p, recipient: e.target.value.trim()}))} className="flex-1 min-w-[140px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl px-4 py-2 outline-none text-xs font-bold" />
          <input placeholder="Produto" value={filtros.product} onChange={e => setFilters(p => ({...p, product: e.target.value.trim()}))} className="flex-1 min-w-[140px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl px-4 py-2 outline-none text-xs font-bold" />
          <input placeholder="Placa" value={filtros.plate} onChange={e => setFilters(p => ({...p, plate: e.target.value.trim()}))} className="flex-1 min-w-[140px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl px-4 py-2 outline-none text-xs font-bold" />
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
          <button onClick={() => setFilters({ search: '', agency: '', product: '', plate: '', payer: '', sender: '', recipient: '', minPeso: '', maxPeso: '', minTotal: '', maxTotal: '' })} className="ml-auto text-[10px] font-black text-rose-500 uppercase">Limpar Filtros</button>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col shadow-sm">
        {carregando && <div className="h-1 w-full bg-indigo-500 animate-pulse" />}
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-max">
            <thead className="sticky top-0 z-20 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="w-14 px-4 py-4 text-[10px] font-black text-slate-400 text-center uppercase">Nº</th>
                <th className="w-12 px-2 py-4 text-center">
                  <input type="checkbox" checked={selecionados.size === dados.length && dados.length > 0} onChange={selecionarTudoNaPagina} className="w-4 h-4 rounded border-slate-300 text-indigo-600 cursor-pointer" />
                </th>
                {COLUNAS.map(col => (
                  <th key={col.key} style={{ width: col.width, minWidth: col.width }} className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100/50 dark:border-slate-800/50 last:border-0">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {dados.map((row, index) => (
                <tr key={row.id} className={cn("hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors", selecionados.has(row.id) && "bg-indigo-50/50 dark:bg-indigo-900/20")}>
                  <td className="px-4 py-3 text-[10px] text-slate-400 font-mono text-center border-r border-slate-100 dark:border-slate-800/50">{(paginacao.pagina - 1) * paginacao.limite + index + 1}</td>
                  <td className="px-2 py-3 border-r border-slate-100 dark:border-slate-800/50 text-center">
                    <input type="checkbox" checked={selecionados.has(row.id)} onChange={() => toggleSelecao(row.id)} className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 cursor-pointer" />
                  </td>
                  {COLUNAS.map(col => (
                    <td key={col.key} onDoubleClick={() => setEditing({ id: row.id, campo: col.key, valorTemp: row[col.key] || '' })} className={cn("px-4 py-3.5 text-xs font-semibold text-slate-600 dark:text-slate-300 relative border-r border-slate-50 dark:border-slate-800/50 last:border-0", (col.isNumeric || col.isCurrency) && "text-right tabular-nums")}>
                      {editando?.id === row.id && editando?.campo === col.key ? (
                        col.key === 'status' ? (
                          <select 
                            autoFocus 
                            value={editando.valorTemp} 
                            onChange={e => setEditing({...editando, valorTemp: e.target.value})} 
                            onBlur={() => salvarEdicao(row.id, col.key, editando.valorTemp)}
                            className="absolute inset-0 w-full h-full bg-white dark:bg-slate-800 border-2 border-indigo-500 px-2 outline-none z-30 font-bold"
                          >
                            <option value="">Selecione...</option>
                            {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        ) : (
                          <input autoFocus value={editando.valorTemp} onChange={e => setEditing({...editando, valorTemp: e.target.value})} onBlur={() => salvarEdicao(row.id, col.key, editando.valorTemp)} onKeyDown={e => e.key === 'Enter' && salvarEdicao(row.id, col.key, editando.valorTemp)} className="absolute inset-0 w-full h-full bg-white dark:bg-slate-800 border-2 border-indigo-500 px-4 outline-none z-30 font-bold" />
                        )
                      ) : (
                        <span className={cn("truncate block", col.key === 'status' && "px-2 py-1 rounded-lg text-[10px] font-black inline-block bg-slate-100 dark:bg-slate-800")} title={String(row[col.key] || '')}>
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

        <div className="px-8 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
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
