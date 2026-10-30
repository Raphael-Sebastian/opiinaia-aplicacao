// Componentes reutilizáveis de apresentação.
import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, CheckCircle2, Inbox, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SENTIMENT_LABEL } from "@/lib/stats";
import type { Sentiment } from "@/lib/nlp-types";
import { nlpHealth } from "@/lib/nlp.functions";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, children, className, action }: { title?: string; children: ReactNode; className?: string; action?: ReactNode }) {
  return (
    <section className={cn("animate-fade-up rounded-2xl border bg-card p-5 shadow-soft", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-2">
          {title && <h2 className="text-base font-semibold text-card-foreground">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatCard({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: string; tone?: Sentiment | "brand" }) {
  const bar = { positivo: "bg-positive", negativo: "bg-negative", neutro: "bg-neutral", brand: "bg-brand-gradient" }[tone ?? "brand"];
  return (
    <div className="animate-fade-up relative overflow-hidden rounded-2xl border bg-card p-5 shadow-soft">
      <span className={cn("absolute inset-x-0 top-0 h-1", bar)} />
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold text-card-foreground">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function SentimentBadge({ s }: { s: Sentiment }) {
  const cls = {
    positivo: "bg-positive/15 text-positive",
    negativo: "bg-negative/15 text-negative",
    neutro: "bg-neutral/20 text-neutral",
  }[s];
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", cls)}>{SENTIMENT_LABEL[s]}</span>;
}

export function EmptyState({ title, text, cta }: { title: string; text: string; cta?: { to: string; label: string } }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed bg-card/50 px-6 py-14 text-center">
      <div className="mb-4 rounded-full bg-accent p-3 text-accent-foreground">
        <Inbox className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{text}</p>
      {cta && (
        <Button asChild className="mt-5">
          <Link to={cta.to}>{cta.label}</Link>
        </Button>
      )}
    </div>
  );
}

export function Loading({ text = "Carregando..." }: { text?: string }) {
  return (
    <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" /> {text}
    </div>
  );
}

export function ErrorNote({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
      <div>
        <p className="font-semibold text-destructive">{title}</p>
        <p className="mt-0.5 text-foreground/80">{message}</p>
      </div>
    </div>
  );
}

/** Mostra se a API Python de NLP está conectada e com modelos carregados. */
export function NlpStatus() {
  const health = useServerFn(nlpHealth);
  const q = useQuery({ queryKey: ["nlp-health"], queryFn: () => health(), staleTime: 60_000, retry: false });
  if (q.isLoading) return null;
  const r = q.data;
  if (r?.ok) {
    return (
      <div className="mb-5 flex items-center gap-2 rounded-xl border border-positive/30 bg-positive/10 px-4 py-2 text-sm">
        <CheckCircle2 className="h-4 w-4 text-positive" /> Motor de NLP conectado
        <span className="text-muted-foreground">
          · modelos: {Object.entries(r.data.models).map(([k, v]) => `${k} ${v ? "✓" : "✗"}`).join(", ")}
        </span>
      </div>
    );
  }
  const notConfigured = r && !r.ok && r.reason === "not_configured";
  return (
    <div className="mb-5 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
      <p className="flex items-center gap-2 font-semibold text-destructive">
        <AlertTriangle className="h-4 w-4" /> {notConfigured ? "Serviço de NLP não conectado" : "Serviço de NLP indisponível"}
      </p>
      <p className="mt-1 text-foreground/80">
        {notConfigured
          ? "Hospede a API Python (pasta nlp-api do projeto) e configure a URL dela no segredo NLP_API_URL. Até lá, nenhuma análise será feita — os resultados nunca são simulados."
          : (r && !r.ok ? r.message : "Erro ao verificar o serviço.") + " Verifique se a API está online."}
      </p>
    </div>
  );
}
