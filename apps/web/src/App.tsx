// /home/penta/Logicell/frontend/src/App.tsx
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { LogisticsTable } from './components/LogisticsTable';
import { DashboardView } from './pages/DashboardView';
import { Moon, Sun, Truck, LayoutDashboard, Table as TableIcon, Folder, Plus, Trash2, Edit2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

interface Pasta {
  id: number;
  nome: string;
  _count?: { itens: number };
}

function NavLink({ to, icon: Icon, children, isCollapsed, badge }: { to: string, icon: any, children: React.ReactNode, isCollapsed: boolean, badge?: number }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link to={to} className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 mb-1 group",
      isActive 
        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30" 
        : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
    )}>
      <Icon size={20} className="shrink-0" />
      {!isCollapsed && (
        <div className="flex-1 flex items-center justify-between min-w-0">
          <span className="truncate">{children}</span>
          {badge !== undefined && (
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-lg",
              isActive ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
            )}>{badge}</span>
          )}
        </div>
      )}
    </Link>
  );
}

function PastaWrapper() {
  const { id } = useParams();
  const [nomePasta, setNomePasta] = useState('');

  useEffect(() => {
    fetch('/api/pastas').then(r => r.json()).then((pastas: Pasta[]) => {
      const p = pastas.find(x => x.id === Number(id));
      if (p) setNomePasta(p.nome);
    });
  }, [id]);

  return <LogisticsTable pastaId={Number(id)} nomePasta={nomePasta} />;
}

function AppContent() {
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pastas, setPastas] = useState<Pasta[]>([]);
  const [showNewPasta, setShowNewPasta] = useState(false);
  const [newPastaName, setNewPastaName] = useState('');
  const [editingPasta, setEditingPasta] = useState<{ id: number, nome: string } | null>(null);
  const navigate = useNavigate();

  const carregarPastas = () => {
    fetch('/api/pastas').then(r => r.json()).then(setPastas);
  };

  useEffect(() => {
    carregarPastas();
    window.addEventListener('folderUpdate', carregarPastas);
    const root = window.document.documentElement;
    if (isDark) { root.classList.add('dark'); localStorage.setItem('theme', 'dark'); }
    else { root.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
    return () => window.removeEventListener('folderUpdate', carregarPastas);
  }, [isDark]);

  const criarPasta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPastaName.trim()) return;
    const res = await fetch('/api/pastas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: newPastaName })
    });
    if (res.ok) {
      setNewPastaName('');
      setShowNewPasta(false);
      window.dispatchEvent(new CustomEvent('folderUpdate'));
    }
  };

  const renomearPasta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPasta || !editingPasta.nome.trim()) return;
    const res = await fetch(`/api/pastas/${editingPasta.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: editingPasta.nome })
    });
    if (res.ok) {
      setEditingPasta(null);
      window.dispatchEvent(new CustomEvent('folderUpdate'));
    }
  };

  const excluirPasta = async (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Deseja excluir esta pasta? As operações não serão excluídas.')) return;
    await fetch(`/api/pastas/${id}`, { method: 'DELETE' });
    window.dispatchEvent(new CustomEvent('folderUpdate'));
    navigate('/tabela');
  };

  return (
    <div className="h-screen flex font-sans transition-colors duration-500 overflow-hidden bg-slate-50 dark:bg-slate-950">
      
      <aside className={cn(
        "flex-none bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 flex flex-col relative",
        isCollapsed ? "w-[80px]" : "w-[280px]"
      )}>
        <div className="h-[72px] flex items-center px-5 mb-4 border-b border-slate-100 dark:border-slate-800/50 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl text-white shadow-lg shadow-indigo-500/20 shrink-0">
              <Truck size={22} strokeWidth={2.5} />
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 leading-none tracking-tighter">Logicell</h1>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-[0.2em] mt-1">Logística</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 px-3 overflow-y-auto custom-scrollbar space-y-6">
          <div>
            <p className={cn("text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-4", isCollapsed && "text-center px-0")}>Principal</p>
            <NavLink to="/" icon={LayoutDashboard} isCollapsed={isCollapsed}>Painel Geral</NavLink>
            <NavLink to="/tabela" icon={TableIcon} isCollapsed={isCollapsed}>Caixa de Entrada</NavLink>
          </div>

          <div>
            <div className={cn("flex items-center justify-between mb-4 px-4", isCollapsed && "justify-center px-0")}>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Minhas Pastas</p>
              {!isCollapsed && (
                <button onClick={() => setShowNewPasta(true)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-indigo-500 transition-colors">
                  <Plus size={16} strokeWidth={3} />
                </button>
              )}
            </div>

            {showNewPasta && !isCollapsed && (
              <form onSubmit={criarPasta} className="px-3 mb-4 animate-in fade-in slide-in-from-top-2">
                <div className="relative">
                  <input 
                    autoFocus
                    placeholder="Nome da pasta..."
                    value={newPastaName}
                    onChange={e => setNewPastaName(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800 border-0 rounded-xl px-4 py-2.5 text-xs font-bold outline-none ring-2 ring-transparent focus:ring-indigo-500/50"
                  />
                  <button type="button" onClick={() => setShowNewPasta(false)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500"><X size={14} /></button>
                </div>
              </form>
            )}

            <div className="space-y-1">
              {pastas.map(pasta => (
                <div key={pasta.id} className="relative group/item">
                  {editingPasta?.id === pasta.id ? (
                    <form onSubmit={renomearPasta} className="px-3 py-1">
                      <input 
                        autoFocus
                        value={editingPasta.nome}
                        onChange={e => setEditingPasta({ ...editingPasta, nome: e.target.value })}
                        onBlur={renomearPasta}
                        className="w-full bg-slate-100 dark:bg-slate-800 border-2 border-indigo-500 rounded-xl px-3 py-1.5 text-xs font-bold outline-none"
                      />
                    </form>
                  ) : (
                    <>
                      <NavLink to={`/pasta/${pasta.id}`} icon={Folder} isCollapsed={isCollapsed} badge={pasta._count?.itens}>
                        {pasta.nome}
                      </NavLink>
                      {!isCollapsed && (
                        <div className="absolute right-12 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-all">
                          <button 
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingPasta({ id: pasta.id, nome: pasta.nome }); }}
                            className="p-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-indigo-500 rounded-lg transition-all"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            onClick={(e) => excluirPasta(pasta.id, e)}
                            className="p-1.5 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-500 rounded-lg transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
              {pastas.length === 0 && !isCollapsed && !showNewPasta && (
                <div className="px-4 py-8 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Nenhuma pasta</p>
                </div>
              )}
            </div>
          </div>
        </nav>

        <div className="p-3 border-t border-slate-100 dark:border-slate-800/50 space-y-2 shrink-0">
          <button onClick={() => setIsDark(!isDark)} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
            {isDark ? <Sun size={20} className="text-amber-400 shrink-0" /> : <Moon size={20} className="text-indigo-600 shrink-0" />}
            {!isCollapsed && <span>Modo {isDark ? 'Claro' : 'Escuro'}</span>}
          </button>
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-slate-400 hover:text-indigo-500 transition-all">
            {isCollapsed ? <ChevronRight size={20} className="shrink-0" /> : <ChevronLeft size={20} className="shrink-0" />}
            {!isCollapsed && <span>Recolher Menu</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden p-6 flex flex-col relative">
        <Routes>
          <Route path="/" element={<DashboardView />} />
          <Route path="/tabela" element={<LogisticsTable />} />
          <Route path="/pasta/:id" element={<PastaWrapper />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
