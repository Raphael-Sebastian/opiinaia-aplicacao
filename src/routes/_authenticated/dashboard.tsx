import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { analysesQuery } from "@/lib/analyses";
import { sentimentCounts, timeline, topKeywords } from "@/lib/stats";
import { formatDate, formatPct } from "@/lib/export";
import { EmptyState, NlpStatus, PageHeader, Panel, SentimentBadge, StatCard } from "@/components/opina/ui-bits";
import { SentimentPie, TermBars, TimelineChart } from "@/components/opina/Charts";
import { WordCloud } from "@/components/opina/WordCloud";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — OpinaIA" }, { name: "description", content: "Indicadores das suas análises de opiniões." }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(analysesQuery),
  component: Dashboard,
});

function Dashboard() {
  const { data } = useSuspenseQuery(analysesQuery);
  const s = sentimentCounts(data);
  const words = topKeywords(data, 30);

  return (
    <>
      <PageHeader title="Dashboard" description="Indicadores calculados a partir das análises salvas na sua conta." />
      <NlpStatus />
      {data.length === 0 ? (
        <EmptyState title="Nenhuma análise ainda" text="Faça sua primeira análise de comentário para ver os indicadores aqui." cta={{ to: "/analise", label: "Analisar um comentário" }} />
      ) : (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total analisado" value={s.total} />
            <StatCard label="Positivas" value={s.counts.positivo} hint={`${s.percent.positivo}%`} tone="positivo" />
            <StatCard label="Negativas" value={s.counts.negativo} hint={`${s.percent.negativo}%`} tone="negativo" />
            <StatCard label="Neutras" value={s.counts.neutro} hint={`${s.percent.neutro}%`} tone="neutro" />
          </div>
          <div className="grid gap-5 lg:grid-cols-5">
            <Panel title="Distribuição de sentimentos" className="lg:col-span-2"><SentimentPie counts={s.counts} /></Panel>
            <Panel title="Evolução das análises" className="lg:col-span-3"><TimelineChart data={timeline(data)} /></Panel>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <Panel title="Palavras mais frequentes"><TermBars data={words.slice(0, 10)} /></Panel>
            <Panel title="Nuvem de palavras"><WordCloud words={words} /></Panel>
          </div>
          <Panel title="Últimos comentários analisados" action={<Link to="/historico" className="text-sm text-brand-violet">Ver histórico</Link>}>
            <ul className="divide-y">
              {data.slice(0, 6).map((a) => (
                <li key={a.id} className="flex items-start justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm">{a.original_text}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(a.created_at)} · {a.analysis_type}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2"><SentimentBadge s={a.sentiment} /><span className="text-xs text-muted-foreground">{formatPct(a.confidence)}</span></div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      )}
    </>
  );
}
