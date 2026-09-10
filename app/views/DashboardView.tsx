import {
  AlertTriangle,
  Building2,
  ChevronDown,
  ExternalLink,
  FileStack,
  FileText,
  FolderOpen,
  Search,
  Tag,
  Users,
  Wallet,
} from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  useDashboard,
  useDashboardPasta,
  type DashboardGeral,
  type DashboardGrupo,
  type DashboardPastaResumo,
} from "~/lib/query";
import { formatarData, formatarMoeda } from "~/utils/formatters";

type ItemBarra = { label: string; valor: number; quantidade: number; cor?: string | null };

// ---------------------------------------------------------------------------
// Blocos reutilizáveis
// ---------------------------------------------------------------------------

function BarList({
  items,
  total,
  vazio,
}: {
  items: ItemBarra[];
  total: number;
  vazio: string;
}) {
  const max = Math.max(...items.map((i) => i.valor), 1);

  if (items.length === 0) {
    return <p className="text-xs font-medium text-text-muted py-6 text-center">{vazio}</p>;
  }

  return (
    <div className="flex flex-col gap-3.5 max-h-[320px] overflow-y-auto pr-1">
      {items.map((item, idx) => {
        const pct = total > 0 ? (item.valor / total) * 100 : 0;
        return (
          <div key={`${item.label}-${idx}`} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-xs font-bold text-text truncate" title={item.label}>
                {item.label}
              </span>
              <span className="text-xs font-mono font-bold text-text shrink-0">
                {formatarMoeda(item.valor)}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-surface overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.max((item.valor / max) * 100, item.valor > 0 ? 2 : 0)}%`,
                  backgroundColor: item.cor || "var(--primary)",
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-bold text-text-dim uppercase tracking-widest">
              <span>
                {item.quantidade.toLocaleString("pt-BR")}{" "}
                {item.quantidade === 1 ? "documento" : "documentos"}
              </span>
              <span>{pct.toFixed(1)}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  valor,
  sub,
  destaque,
  alerta,
}: {
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  label: string;
  valor: string;
  sub?: string;
  destaque?: boolean;
  alerta?: boolean;
}) {
  return (
    <div className="bg-card-bg border border-glass-border rounded-2xl p-5 shadow-card flex items-center gap-4">
      <div
        className={`p-2.5 rounded-xl shrink-0 ${
          destaque
            ? "bg-primary text-white shadow-primary-glow"
            : alerta
              ? "bg-badge-warning-bg text-badge-warning-text border border-glass-border"
              : "bg-surface text-text-muted border border-glass-border"
        }`}
      >
        <Icon size={18} strokeWidth={2.5} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">{label}</p>
        <p className="text-lg font-mono font-bold text-text truncate">{valor}</p>
        {sub && <p className="text-[10px] font-bold text-text-dim mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  );
}

function MiniStat({ label, valor, sub }: { label: string; valor: string; sub?: string }) {
  return (
    <div className="bg-card-bg border border-glass-border rounded-xl px-4 py-3">
      <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted">{label}</p>
      <p className="text-sm font-mono font-bold text-text mt-1 truncate">{valor}</p>
      {sub && <p className="text-[10px] font-bold text-text-dim mt-0.5 truncate">{sub}</p>}
    </div>
  );
}

function grupoParaItens(grupos: DashboardGrupo[], fallback: string): ItemBarra[] {
  return grupos.map((g) => ({
    label: String(g.chave ?? "").trim() || fallback,
    valor: g.valor,
    quantidade: g.quantidade,
    cor: null,
  }));
}

function DistribuicaoCard({
  titulo,
  grupos,
  fallback,
  total,
}: {
  titulo: string;
  grupos: DashboardGrupo[];
  fallback: string;
  total: number;
}) {
  return (
    <div className="bg-card-bg border border-glass-border rounded-xl p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-4">{titulo}</p>
      <BarList items={grupoParaItens(grupos, fallback)} total={total} vazio="Sem dados." />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detalhe de uma pasta (carregado ao expandir)
// ---------------------------------------------------------------------------

function PastaDetalheLinha({ pastaId }: { pastaId: number | "inbox" }) {
  const { data, isLoading, isError } = useDashboardPasta(pastaId, true);

  if (isLoading) {
    return (
      <div className="px-5 py-8 text-center">
        <p className="text-xs font-bold text-text-muted uppercase tracking-widest animate-pulse">
          Carregando detalhes...
        </p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="px-5 py-8 text-center">
        <p className="text-xs font-bold text-badge-error-text">Não foi possível carregar os detalhes.</p>
      </div>
    );
  }

  const { pasta } = data;
  const linkPasta = pasta.pastaId === null ? "/caixa-de-entrada" : `/pastas/${encodeURIComponent(pasta.nome)}`;

  return (
    <div className="px-5 py-5 bg-surface/40">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-xs font-bold text-text">
            Faturista: <span className="text-text-muted">{pasta.faturistaNome || "—"}</span>
          </p>
          <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest mt-1">
            Período: {formatarData(pasta.primeiraEmissao)} → {formatarData(pasta.ultimaEmissao)}
          </p>
        </div>
        <Link
          to={linkPasta}
          className="flex items-center gap-2 h-9 px-3 rounded-lg bg-surface border border-glass-border text-[11px] font-bold text-text-muted hover:text-primary hover:border-primary/40 transition-all"
        >
          Abrir pasta
          <ExternalLink size={13} />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <MiniStat label="Valor total" valor={formatarMoeda(pasta.valor)} />
        <MiniStat label="Documentos" valor={pasta.quantidade.toLocaleString("pt-BR")} />
        <MiniStat
          label="Emissões antigas"
          valor={pasta.emissaoAntigas.toLocaleString("pt-BR")}
        />
        <MiniStat
          label="Status vazio"
          valor={String(data.porStatus.find((s) => !String(s.chave ?? "").trim())?.quantidade ?? 0)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <DistribuicaoCard titulo="Status" grupos={data.porStatus} fallback="Sem status" total={pasta.valor} />
        <DistribuicaoCard
          titulo="Tipo de documento"
          grupos={data.porTipoDocumento}
          fallback="Não informado"
          total={pasta.valor}
        />
        <DistribuicaoCard titulo="Agência" grupos={data.porAgencia} fallback="Sem agência" total={pasta.valor} />
        <DistribuicaoCard titulo="Tipo de CTe" grupos={data.porTipoCte} fallback="Não informado" total={pasta.valor} />
        <DistribuicaoCard
          titulo="Top clientes (pagador)"
          grupos={data.topPagadores}
          fallback="Não informado"
          total={pasta.valor}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lista de pastas com busca, ordenação e drill-down
// ---------------------------------------------------------------------------

type CampoOrdenacao = "nome" | "valor" | "quantidade" | "emissaoAntigas";

const COLUNAS: { campo: CampoOrdenacao | null; label: string; alinhamento?: "right" }[] = [
  { campo: "nome", label: "Pasta" },
  { campo: null, label: "Faturista" },
  { campo: "quantidade", label: "Documentos", alinhamento: "right" },
  { campo: "valor", label: "Valor", alinhamento: "right" },
  { campo: "emissaoAntigas", label: "Antigas", alinhamento: "right" },
  { campo: null, label: "" },
];

function PastasLista({ pastas }: { pastas: DashboardPastaResumo[] }) {
  const [busca, setBusca] = useState("");
  const [mostrarVazias, setMostrarVazias] = useState(true);
  const [ordem, setOrdem] = useState<{ campo: CampoOrdenacao; dir: "asc" | "desc" }>({
    campo: "valor",
    dir: "desc",
  });
  const [expandida, setExpandida] = useState<string | null>(null);

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    let lista = pastas.filter((p) => mostrarVazias || p.quantidade > 0);
    if (q) {
      lista = lista.filter(
        (p) =>
          p.nome.toLowerCase().includes(q) || (p.faturistaNome || "").toLowerCase().includes(q)
      );
    }
    const dir = ordem.dir === "asc" ? 1 : -1;
    return [...lista].sort((a, b) => {
      if (ordem.campo === "nome") return a.nome.localeCompare(b.nome, "pt-BR") * dir;
      return ((a[ordem.campo] as number) - (b[ordem.campo] as number)) * dir;
    });
  }, [pastas, busca, mostrarVazias, ordem]);

  const alternarOrdem = (campo: CampoOrdenacao) => {
    setOrdem((o) =>
      o.campo === campo ? { campo, dir: o.dir === "asc" ? "desc" : "asc" } : { campo, dir: "desc" }
    );
  };

  const totalValor = filtradas.reduce((s, p) => s + p.valor, 0);

  return (
    <div className="bg-card-bg border border-glass-border rounded-2xl shadow-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 p-5 border-b border-glass-border">
        <div className="flex items-center gap-2.5">
          <FolderOpen size={16} className="text-primary" strokeWidth={2.5} />
          <h2 className="text-sm font-bold text-text">Pastas</h2>
          <span className="text-[10px] font-bold text-text-dim uppercase tracking-widest">
            {filtradas.length} de {pastas.length}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-text-muted cursor-pointer select-none">
            <input
              type="checkbox"
              checked={mostrarVazias}
              onChange={(e) => setMostrarVazias(e.target.checked)}
              className="accent-primary"
            />
            Mostrar sem documentos
          </label>

          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar pasta ou faturista..."
              className="w-64 h-9 bg-surface border border-glass-border rounded-lg pl-8 pr-3 text-xs font-bold text-text outline-none focus:border-primary placeholder:text-text-dim transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse">
          <thead>
            <tr className="bg-surface">
              {COLUNAS.map((col, idx) => (
                <th
                  key={idx}
                  className={`px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-text-muted ${
                    col.alinhamento === "right" ? "text-right" : "text-left"
                  }`}
                >
                  {col.campo ? (
                    <button
                      onClick={() => alternarOrdem(col.campo as CampoOrdenacao)}
                      className={`inline-flex items-center gap-1 hover:text-text transition-colors ${
                        ordem.campo === col.campo ? "text-primary" : ""
                      }`}
                    >
                      {col.label}
                      {ordem.campo === col.campo && <span>{ordem.dir === "asc" ? "↑" : "↓"}</span>}
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtradas.map((p) => {
              const chave = p.pastaId === null ? "inbox" : String(p.pastaId);
              const aberta = expandida === chave;
              return (
                <Fragment key={chave}>
                  <tr
                    onClick={() => setExpandida(aberta ? null : chave)}
                    className={`border-t border-glass-border cursor-pointer transition-colors ${
                      aberta ? "bg-surface-light" : "hover:bg-surface"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: p.cor || "var(--text-dim)" }}
                        />
                        <span className="text-xs font-bold text-text truncate max-w-[260px]" title={p.nome}>
                          {p.nome}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-text-muted truncate max-w-[180px]">
                      {p.faturistaNome || "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-mono font-bold text-text">
                      {p.quantidade.toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-mono font-bold text-text">
                      {formatarMoeda(p.valor)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {p.emissaoAntigas > 0 ? (
                        <div className="flex flex-col items-end">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-badge-warning-text">
                            <AlertTriangle size={12} />
                            {p.emissaoAntigas.toLocaleString("pt-BR")}
                          </span>
                          <span className="text-[10px] font-bold text-text-dim">
                            {formatarMoeda(p.emissaoAntigasValor)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-text-dim">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <ChevronDown
                        size={16}
                        className={`text-text-muted transition-transform ${aberta ? "rotate-180" : ""}`}
                      />
                    </td>
                  </tr>
                  {aberta && (
                    <tr className="border-t border-glass-border">
                      <td colSpan={COLUNAS.length} className="p-0">
                        <PastaDetalheLinha pastaId={p.pastaId === null ? "inbox" : p.pastaId} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}

            {filtradas.length === 0 && (
              <tr>
                <td colSpan={COLUNAS.length} className="px-4 py-10 text-center">
                  <p className="text-xs font-bold text-text-muted">Nenhuma pasta encontrada.</p>
                </td>
              </tr>
            )}
          </tbody>
          {filtradas.length > 0 && (
            <tfoot>
              <tr className="border-t border-glass-border bg-surface">
                <td className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-text-muted" colSpan={3}>
                  Total ({filtradas.length} pastas)
                </td>
                <td className="px-4 py-3 text-right text-xs font-mono font-bold text-text">
                  {formatarMoeda(totalValor)}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Aba Geral — visões globais (mesmas dimensões do detalhe de pasta)
// ---------------------------------------------------------------------------

const PALETA = ["#0066ff", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4", "#f97316", "#84cc16", "#e03048", "#64748b"];

function GeralConteudo({ geral, pastasComDocs }: { geral: DashboardGeral; pastasComDocs: number }) {
  const faturistaItens: ItemBarra[] = geral.porFaturista.map((g, idx) => ({
    label: String(g.chave ?? "").trim() || "Sem faturista",
    valor: g.valor,
    quantidade: g.quantidade,
    cor: PALETA[idx % PALETA.length],
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={Wallet} label="Valor total" valor={formatarMoeda(geral.valorTotal)} destaque />
        <Kpi icon={FileText} label="Documentos" valor={geral.quantidade.toLocaleString("pt-BR")} />
        <Kpi
          icon={FolderOpen}
          label="Pastas"
          valor={geral.totalPastas.toLocaleString("pt-BR")}
          sub={`${pastasComDocs} com documentos`}
        />
        <Kpi
          icon={AlertTriangle}
          label="Emissões antigas"
          valor={geral.emissaoAntigas.toLocaleString("pt-BR")}
          alerta
        />
      </div>

      <div className="bg-card-bg border border-glass-border rounded-2xl p-6 shadow-card">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2.5 min-w-0">
            <Users size={16} className="text-primary shrink-0" strokeWidth={2.5} />
            <h2 className="text-sm font-bold text-text truncate">Valor por faturista</h2>
          </div>
          <span className="text-[10px] font-bold text-text-dim uppercase tracking-widest shrink-0">
            {geral.porFaturista.length} {geral.porFaturista.length === 1 ? "item" : "itens"}
          </span>
        </div>
        <BarList items={faturistaItens} total={geral.valorTotal} vazio="Nenhum faturista com documentos." />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <DistribuicaoCard titulo="Status" grupos={geral.porStatus} fallback="Sem status" total={geral.valorTotal} />
        <DistribuicaoCard
          titulo="Tipo de documento"
          grupos={geral.porTipoDocumento}
          fallback="Não informado"
          total={geral.valorTotal}
        />
        <DistribuicaoCard titulo="Agência" grupos={geral.porAgencia} fallback="Sem agência" total={geral.valorTotal} />
        <DistribuicaoCard titulo="Tipo de CTe" grupos={geral.porTipoCte} fallback="Não informado" total={geral.valorTotal} />
        <DistribuicaoCard
          titulo="Top clientes (pagador)"
          grupos={geral.topPagadores}
          fallback="Não informado"
          total={geral.valorTotal}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------

export function DashboardView() {
  const { data, isLoading, isError } = useDashboard();
  const [aba, setAba] = useState<"geral" | "pastas">("geral");

  const geral = data?.geral;
  const pastas = data?.pastas ?? [];

  return (
    <div className="flex-1 flex flex-col h-full bg-bg text-text overflow-y-auto custom-scrollbar p-6 md:p-8">
      <div className="max-w-[1400px] mx-auto w-full flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-text tracking-tight">Dashboard</h1>
            <p className="text-xs font-medium text-text-muted mt-1">
              Visão geral das pastas e documentos
            </p>
          </div>

          <div className="flex bg-surface p-1 rounded-xl border border-glass-border h-11 items-center gap-1 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setAba("geral")}
              className={`px-4 h-full flex items-center justify-center text-xs font-bold rounded-lg transition-all ${
                aba === "geral"
                  ? "bg-card-bg text-text shadow-sm border border-glass-border"
                  : "text-text-muted hover:text-text border border-transparent"
              }`}
            >
              <Wallet size={14} className="mr-1.5" />
              Geral
            </button>
            <button
              type="button"
              onClick={() => setAba("pastas")}
              className={`px-4 h-full flex items-center justify-center text-xs font-bold rounded-lg transition-all ${
                aba === "pastas"
                  ? "bg-card-bg text-text shadow-sm border border-glass-border"
                  : "text-text-muted hover:text-text border border-transparent"
              }`}
            >
              <FolderOpen size={14} className="mr-1.5" />
              Pastas
            </button>
          </div>
        </div>

        {isError ? (
          <div className="bg-card-bg border border-glass-border rounded-2xl p-6 shadow-card">
            <p className="text-sm font-medium text-badge-error-text text-center py-8">
              Não foi possível carregar a dashboard.
            </p>
          </div>
        ) : isLoading || !geral ? (
          <div className="bg-card-bg border border-glass-border rounded-2xl p-6 shadow-card">
            <p className="text-xs font-bold text-text-muted uppercase tracking-widest text-center py-10 animate-pulse">
              Carregando...
            </p>
          </div>
        ) : aba === "geral" ? (
          <GeralConteudo
            geral={geral}
            pastasComDocs={pastas.filter((p) => p.quantidade > 0).length}
          />
        ) : (
          <PastasLista pastas={pastas} />
        )}
      </div>
    </div>
  );
}
