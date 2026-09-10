import { AlertCircle, ArrowRight, Loader2, Lock, Mail, Truck } from "lucide-react";
import { useState } from "react";

export function LoginView({
  onSubmit,
  isSubmitting,
  error,
}: {
  onSubmit: (email: string, password: string) => void;
  isSubmitting: boolean;
  error?: string;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(email, password);
  };

  return (
    <div className="h-screen w-full overflow-y-auto bg-bg font-sans antialiased selection:bg-[rgba(0,102,255,0.3)]">
      <div className="relative min-h-full w-full flex items-center justify-center p-6 overflow-hidden">

        {/* Background elements minimalistas para profundidade sem transparência */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[rgba(0,102,255,0.05)] blur-[120px] rounded-full pointer-events-none" />

        <div className="w-full max-w-[440px] relative z-10">
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-primary rounded-[22px] flex items-center justify-center shadow-[0_0_40px_rgba(0,102,255,0.3)] mb-6 ring-4 ring-[rgba(0,102,255,0.1)]">
              <Truck size={32} className="text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-4xl font-bold tracking-tighter text-text uppercase mb-2">Logicell</h1>
            <p className="text-text-muted font-medium text-center">Acesse a plataforma corporativa</p>
          </div>

          <div className="bg-card-bg border border-glass-border p-10 rounded-[40px] shadow-card-elevated backdrop-blur-md">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-dim ml-4">E-mail Corporativo</label>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-primary transition-colors">
                    <Mail size={18} strokeWidth={2.5} />
                  </div>
                  <input
                    required
                    type="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full h-16 pl-14 pr-6 bg-surface border border-glass-border rounded-3xl text-text font-inter outline-none focus:border-primary focus:bg-surface-light focus:shadow-[0_0_0_3px_rgba(0,102,255,0.08)] transition-all placeholder:text-text-dim"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-dim ml-4">Senha de Acesso</label>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-primary transition-colors">
                    <Lock size={18} strokeWidth={2.5} />
                  </div>
                  <input
                    required
                    type="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-16 pl-14 pr-6 bg-surface border border-glass-border rounded-3xl text-text font-inter outline-none focus:border-primary focus:bg-surface-light focus:shadow-[0_0_0_3px_rgba(0,102,255,0.08)] transition-all placeholder:text-text-dim"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-3 p-4 bg-badge-error-bg border border-badge-error-bg rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                  <AlertCircle className="text-badge-error-text shrink-0" size={18} />
                  <p className="text-xs font-bold text-badge-error-text leading-tight">{error}</p>
                </div>
              )}

              <button
                disabled={isSubmitting}
                className="w-full h-16 bg-primary hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-3xl font-bold text-sm uppercase tracking-widest transition-all shadow-[0_0_16px_rgba(0,102,255,0.12)] active:scale-[0.98] flex items-center justify-center gap-3 group overflow-hidden relative border-none"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={20} strokeWidth={3} />
                ) : (
                  <>
                    <span>Entrar no Sistema</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" strokeWidth={3} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-10 pt-8 border-t border-glass-border">
              <p className="text-[10px] text-center font-bold text-text-dim uppercase tracking-[0.1em] leading-relaxed">
                Sistema de Uso Restrito <br />
                Logicell Logística Integrada
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
