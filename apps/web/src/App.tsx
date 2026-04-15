// /home/penta/Logicell/frontend/src/App.tsx
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LogisticsTable } from './components/LogisticsTable';
import { DashboardView } from './pages/DashboardView';
import { Moon, Sun, Truck, LayoutDashboard, Table as TableIcon, ListChecks, ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

function NavLink({ to, icon: Icon, children, isCollapsed }: { to: string, icon: any, children: React.ReactNode, isCollapsed: boolean }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link to={to} className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 mb-1",
      isActive 
        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30" 
        : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
    )}>
      <Icon size={22} className="shrink-0" />
      {!isCollapsed && <span className="truncate">{children}</span>}
    </Link>
  );
}

function AppContent() {
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) { root.classList.add('dark'); localStorage.setItem('theme', 'dark'); }
    else { root.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
  }, [isDark]);

  return (
    <div className="h-screen flex font-sans transition-colors duration-500 overflow-hidden bg-slate-50 dark:bg-slate-950">
      
      {/* Barra Lateral (Sidebar) */}
      <aside className={cn(
        "flex-none bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 flex flex-col relative group",
        isCollapsed ? "w-[80px]" : "w-[260px]"
      )}>
        {/* Cabeçalho da Sidebar */}
        <div className="h-[72px] flex items-center px-5 mb-4 border-b border-slate-100 dark:border-slate-800/50">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl text-white shadow-lg shadow-indigo-500/20 shrink-0">
              <Truck size={22} strokeWidth={2.5} />
            </div>
            {!isCollapsed && (
              <div className="animate-in fade-in slide-in-from-left-2">
                <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 leading-none tracking-tighter">Logicell</h1>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-[0.2em] mt-1">Logística</p>
              </div>
            )}
          </div>
        </div>

        {/* Links de Navegação */}
        <nav className="flex-1 px-3">
          <NavLink to="/" icon={LayoutDashboard} isCollapsed={isCollapsed}>Painel Geral</NavLink>
          <NavLink to="/tabela" icon={TableIcon} isCollapsed={isCollapsed}>Operações</NavLink>
          <NavLink to="/lista" icon={ListChecks} isCollapsed={isCollapsed}>Minha Lista</NavLink>
        </nav>

        {/* Rodapé da Sidebar (Tema e Colapso) */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/50 space-y-2">
          <button 
            onClick={() => setIsDark(!isDark)} 
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            {isDark ? <Sun size={22} className="text-amber-400 shrink-0" /> : <Moon size={22} className="text-indigo-600 shrink-0" />}
            {!isCollapsed && <span>Modo {isDark ? 'Claro' : 'Escuro'}</span>}
          </button>

          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-slate-400 hover:text-indigo-500 transition-all"
          >
            {isCollapsed ? <ChevronRight size={22} className="shrink-0" /> : <ChevronLeft size={22} className="shrink-0" />}
            {!isCollapsed && <span>Recolher Menu</span>}
          </button>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 overflow-hidden p-6 flex flex-col relative">
        <Routes>
          <Route path="/" element={<DashboardView />} />
          <Route path="/tabela" element={<LogisticsTable />} />
          <Route path="/lista" element={<LogisticsTable onlyWorkListMode={true} />} />
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
