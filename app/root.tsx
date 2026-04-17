import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useFetcher,
  NavLink,
} from "react-router";
import type { LinksFunction } from "react-router";
import { useState, useEffect, createContext, useContext } from "react";
import { 
  Truck, Inbox, Plus, Edit2, Trash2, ChevronLeft, ChevronRight, LayoutDashboard, Folder, X, Sun, Moon, CheckCircle2, AlertCircle, Info, AlertTriangle
} from "lucide-react";
import "./tailwind.css";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" },
];

const UIContext = createContext<{
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  confirm: (opts: { title: string, message: string, onConfirm: () => void, variant?: 'danger' | 'primary' }) => void;
  alert: (opts: { title: string, message: string, variant?: 'success' | 'info' | 'error' }) => void;
} | null>(null);

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) throw new Error("useUI must be used within UIProvider");
  return context;
};

export async function loader() {
  const { PastaService } = await import("./services/pasta.server");
  const { OperacaoService } = await import("./services/operacao.server");
  try {
    const [pastas, totalInbox] = await Promise.all([
      PastaService.listar().catch(() => []),
      OperacaoService.contarInbox().catch(() => 0)
    ]);
    return { pastas, totalInbox };
  } catch (e) {
    return { pastas: [], totalInbox: 0 };
  }
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased overflow-hidden h-screen w-screen font-sans">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const data = useLoaderData<typeof loader>();
  const pastas = data?.pastas || [];
  const totalInbox = data?.totalInbox || 0;
  const fetcher = useFetcher();
  
  const [isDark, setIsDark] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [isAddingFolder, setIsAddingFolder] = useState(false);

  const [toasts, setToasts] = useState<{id: number, msg: string, type: string}[]>([]);
  const [modal, setModal] = useState<{isOpen: boolean, title: string, message: string, onConfirm?: () => void, variant: string, isAlert?: boolean} | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  const confirmAction = ({ title, message, onConfirm, variant = 'primary' }: any) => {
    setModal({ isOpen: true, title, message, onConfirm, variant, isAlert: false });
  };

  const showAlert = ({ title, message, variant = 'success' }: any) => {
    setModal({ isOpen: true, title, message, variant, isAlert: true });
  };

  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDark]);

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    fetcher.submit({ intent: "createFolder", nome: newFolderName }, { method: "post", action: "/api/pastas" });
    setNewFolderName("");
    setIsAddingFolder(false);
    showToast("Pasta criada!");
  };

  const submitRename = (id: number) => {
    if (!editingValue.trim()) return;
    fetcher.submit({ intent: "renameFolder", id: String(id), nome: editingValue }, { method: "post", action: "/api/pastas" });
    setEditingFolderId(null);
    showToast("Pasta renomeada!");
  };

  return (
    <UIContext.Provider value={{ showToast, confirm: confirmAction, alert: showAlert }}>
      <div className="flex h-screen w-screen overflow-hidden transition-colors duration-500">
        
        <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
          {toasts.map(t => (
            <div key={t.id} className="pointer-events-auto animate-in slide-in-from-right-full fade-in duration-300">
              <div className={`flex items-center gap-3 px-6 py-4 rounded-3xl shadow-2xl border ${
                t.type === 'success' ? 'bg-emerald-600 border-emerald-500 text-white' : 
                t.type === 'error' ? 'bg-rose-600 border-rose-500 text-white' : 
                'bg-blue-600 border-blue-500 text-white'
              }`}>
                {t.type === 'success' ? <CheckCircle2 size={20} /> : t.type === 'error' ? <AlertCircle size={20} /> : <Info size={20} />}
                <p className="text-sm font-bold tracking-tight">{t.msg}</p>
                <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} className="ml-2 hover:opacity-70"><X size={16} strokeWidth={3} /></button>
              </div>
            </div>
          ))}
        </div>

        {modal?.isOpen && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300">
              <div className={`w-16 h-16 rounded-3xl mb-6 flex items-center justify-center ${
                modal.variant === 'danger' || modal.variant === 'error' ? 'bg-rose-100 text-rose-600' : 
                modal.variant === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
              }`}>
                {modal.variant === 'danger' || modal.variant === 'error' ? <AlertTriangle size={32} /> : 
                 modal.variant === 'success' ? <CheckCircle2 size={32} /> : <Info size={32} />}
              </div>
              <h2 className="text-xl font-black mb-2 text-slate-800 dark:text-white uppercase tracking-tight">{modal.title}</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed mb-8 whitespace-pre-line">{modal.message}</p>
              <div className="flex gap-3">
                {!modal.isAlert && (
                  <button onClick={() => setModal(null)} className="flex-1 py-4 px-6 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold text-sm transition-all hover:bg-slate-200 dark:hover:bg-slate-700">Cancelar</button>
                )}
                <button 
                  onClick={() => { if(modal.onConfirm) modal.onConfirm(); setModal(null); }} 
                  className={`flex-1 py-4 px-6 rounded-2xl font-bold text-sm text-white shadow-lg transition-all ${
                    modal.variant === 'danger' || modal.variant === 'error' ? 'bg-rose-600 hover:bg-rose-700' : 
                    modal.variant === 'success' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {modal.isAlert ? "Entendido" : "Confirmar"}
                </button>
              </div>
            </div>
          </div>
        )}

        <aside className={`${isCollapsed ? 'w-[80px]' : 'w-[280px]'} bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 flex flex-col relative`}>
          <div className="h-[72px] flex items-center px-5 mb-4 border-b border-slate-100 dark:border-slate-800/50 shrink-0">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="p-2 bg-blue-600 rounded-xl text-white shrink-0 shadow-lg shadow-blue-500/20">
                <Truck size={22} strokeWidth={2.5} />
              </div>
              {!isCollapsed && <h1 className="text-xl font-black uppercase tracking-tighter">Logicell</h1>}
            </div>
          </div>

          <nav className="flex-1 px-3 overflow-y-auto custom-scrollbar space-y-6">
            <div>
              <p className={`${isCollapsed ? 'text-center' : 'px-4'} text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4`}>Principal</p>
              <div className="space-y-1">
                <NavLink to="/" end className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                  <LayoutDashboard size={20} className="shrink-0" />
                  {!isCollapsed && <span>Painel Geral</span>}
                </NavLink>

                <NavLink to="/caixa-de-entrada" className={({ isActive }) => `flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                  {({ isActive: linkActive }) => (
                    <>
                      <div className="flex items-center gap-3">
                        <Inbox size={20} className="shrink-0" />
                        {!isCollapsed && <span>Caixa de Entrada</span>}
                      </div>
                      {!isCollapsed && totalInbox > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-lg bg-blue-100 text-blue-600`}>{totalInbox}</span>
                      )}
                    </>
                  )}
                </NavLink>
              </div>
            </div>

            <div>
              <div className={`${isCollapsed ? 'justify-center' : 'px-4 justify-between'} flex items-center mb-4`}>
                {!isCollapsed && <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pastas</p>}
                {!isCollapsed && <button onClick={() => setIsAddingFolder(true)} className="text-blue-500"><Plus size={16} strokeWidth={3} /></button>}
              </div>

              <div className="space-y-1">
                {isAddingFolder && !isCollapsed && (
                  <form onSubmit={handleCreateFolder} className="px-3 mb-2">
                    <input autoFocus value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="Nome..." className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2 text-xs font-bold outline-none border-2 border-blue-500" />
                  </form>
                )}

                {pastas.map((p: any) => (
                  <div key={p.id} className="relative group/item">
                    {editingFolderId === p.id ? (
                      <div className="px-3 py-1">
                        <input autoFocus value={editingValue} onChange={e => setEditingValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitRename(p.id)} onBlur={() => setEditingFolderId(null)} className="w-full bg-white dark:bg-slate-800 border-2 border-indigo-500 rounded-xl px-3 py-1.5 text-xs font-bold outline-none" />
                      </div>
                    ) : (
                      <NavLink to={`/pastas/${p.id}`} className={({ isActive }) => `flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                        {({ isActive: linkActive }) => (
                          <>
                            <div className="flex items-center gap-3 overflow-hidden">
                              <Folder size={20} className="shrink-0" />
                              {!isCollapsed && <span className="truncate">{p.nome}</span>}
                            </div>
                            {!isCollapsed && (
                              <div className="flex items-center gap-2">
                                {p._count?.operacoes > 0 && <span className={`text-[10px] px-1.5 py-0.5 rounded-lg ${linkActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-50'}`}>{p._count.operacoes}</span>}
                                <div className="hidden group-hover/item:flex items-center gap-1">
                                  <button onClick={(e) => { e.preventDefault(); setEditingFolderId(p.id); setEditingValue(p.nome); }} className="p-1 hover:text-white"><Edit2 size={12} /></button>
                                  <button onClick={(e) => { 
                                    e.preventDefault(); 
                                    confirmAction({
                                      title: "Excluir Pasta?",
                                      message: `Tem certeza que deseja excluir "${p.nome}"?`,
                                      variant: 'danger',
                                      onConfirm: () => {
                                        fetcher.submit({ intent: "deleteFolder", id: String(p.id) }, { method: "post", action: "/api/pastas" });
                                        showToast("Pasta excluída.", "info");
                                      }
                                    });
                                  }} className="p-1 hover:text-rose-400"><Trash2 size={12} /></button>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </NavLink>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </nav>

          <div className="p-3 border-t border-slate-100 dark:border-slate-800/50 space-y-2 shrink-0">
            <button onClick={() => setIsDark(!isDark)} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
              {isDark ? <Sun size={20} className="text-amber-400 shrink-0" /> : <Moon size={20} className="text-blue-600 shrink-0" />}
              {!isCollapsed && <span>Modo {isDark ? 'Claro' : 'Escuro'}</span>}
            </button>
            <button onClick={() => setIsCollapsed(!isCollapsed)} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-slate-400 hover:text-blue-500 transition-all">
              {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
              {!isCollapsed && <span>Recolher</span>}
            </button>
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-950 p-6 overflow-hidden h-full">
          <Outlet />
        </main>
      </div>
    </UIContext.Provider>
  );
}
