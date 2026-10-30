import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Download, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { analysesQuery } from "@/lib/analyses";
import { filterByPeriod, sentimentCounts, timeline, topAspects, topKeywords } from "@/lib/stats";
import { buildExecutiveSummary } from "@/lib/report";
import { downloadCsv, formatDate, formatPct } from "@/lib/export";
import { EmptyState, PageHeader, Panel, SentimentBadge, StatCard } from "@/components/opina/ui-bits";
import { SentimentPie, TermBars, TimelineChart } from "@/components/opina/Charts";

export const Route = createFileRoute("/_authenticated/relatorios")({
  head: () => ({ meta: [{ title: "Relatórios — OpinaIA" }, { name: "description", content: "Relatórios de opiniões por período." }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(analysesQuery),
  component: Reports,
});

function Reports() {
  const { data } = useSuspenseQuery(analysesQuery);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const rows = useMemo(() => filterByPeriod(data, from || undefined, to || undefined), [data, from, to]);
  const s = sentimentCounts(rows);
  const kws = topKeywords(rows, 10);
  const aspects = topAspects(rows);
  const pos = rows.filter((r) => r.sentiment === "positivo").sort((a, b) => b.confidence - a.confidence).slice(0, 3);
  const neg = rows.filter((r) => r.sentiment === "negativo").sort((a, b) => b.confidence - a.confidence).slice(0, 3);
  const period = from || to ? `${from || "início"} a ${to || "hoje"}` : "Todo o período";
  const summary = buildExecutiveSummary({ total: s.total, percent: s.percent, keywords: kws.map((k) => k.term), aspects: aspects.map((a) => a.aspect) });

  async function exportPdf() {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text("OpinaIA — Relatório de opiniões", 14, 18);
    doc.setFontSize(10); doc.text(`Período: ${period}  ·  Gerado em ${new Date().toLocaleString("pt-BR")}`, 14, 26);
    doc.setFontSize(11); doc.text(doc.splitTextToSize(summary, 180), 14, 36);
    autoTable(doc, { startY: 60, head: [["Sentimento", "Quantidade", "%"]], body: [
      ["Positivo", s.counts.positivo, `${s.percent.positivo}%`], ["Negativo", s.counts.negativo, `${s.percent.negativo}%`], ["Neutro", s.counts.neutro, `${s.percent.neutro}%`], ["Total", s.total, "100%"],
    ] });
    autoTable(doc, { head: [["Palavra", "Ocorrências"]], body: kws.map((k) => [k.term, k.count]) });
    autoTable(doc, { head: [["Assunto", "Menções"]], body: aspects.map((a) => [a.aspect, a.count]) });
    autoTable(doc, { head: [["Comentários positivos", "Confiança"]], body: pos.map((r) => [r.original_text, formatPct(r.confidence)]) });
    autoTable(doc, { head: [["Comentários negativos", "Confiança"]], body: neg.map((r) => [r.original_text, formatPct(r.confidence)]) });
    doc.save("opinaia-relatorio.pdf");
  }

  function exportCsv() {
    downloadCsv("opinaia-relatorio.csv", rows.map((a) => ({ data: formatDate(a.created_at), comentario: a.original_text, sentimento: a.sentiment, confianca: a.confidence.toFixed(4), tipo: a.analysis_type })));
  }

  return (
    <>
      <PageHeader
        title="Relatórios"
        description={period}
        actions={<>
          <Input type="date" className="w-40" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="De" />
          <Input type="date" className="w-40" value={to} onChange={(e) => setTo(e.target.value)} aria-label="Até" />
          <Button variant="outline" onClick={exportCsv} disabled={!rows.length}><Download /> CSV</Button>
          <Button onClick={exportPdf} disabled={!rows.length}><FileDown /> PDF</Button>
        </>}
      />
      {!rows.length ? (
        <EmptyState title="Sem dados no período" text="Realize análises ou ajuste o período para gerar um relatório." cta={{ to: "/analise", label: "Fazer uma análise" }} />
      ) : (
        <div className="space-y-5">
          <Panel title="Resumo executivo"><p className="text-sm leading-relaxed">{summary}</p></Panel>
          <div className="grid gap-4 sm:grid-cols-4">
            <StatCard label="Total" value={s.total} />
            <StatCard label="Positivos" value={`${s.percent.positivo}%`} tone="positivo" />
            <StatCard label="Negativos" value={`${s.percent.negativo}%`} tone="negativo" />
            <StatCard label="Neutros" value={`${s.percent.neutro}%`} tone="neutro" />
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <Panel title="Distribuição"><SentimentPie counts={s.counts} /></Panel>
            <Panel title="Evolução"><TimelineChart data={timeline(rows)} /></Panel>
            <Panel title="Palavras mais frequentes"><TermBars data={kws} /></Panel>
            <Panel title="Principais assuntos (aspectos)">
              {aspects.length ? <TermBars data={aspects.map((a) => ({ term: a.aspect, count: a.count }))} /> : <p className="text-sm text-muted-foreground">Nenhum assunto identificado.</p>}
            </Panel>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            {[{ t: "Comentários positivos", list: pos }, { t: "Comentários negativos", list: neg }].map(({ t, list }) => (
              <Panel key={t} title={t}>
                {list.length ? <ul className="space-y-3">{list.map((r) => (
                  <li key={r.id} className="rounded-xl border p-3 text-sm"><p>{r.original_text}</p><p className="mt-1 text-xs text-muted-foreground"><SentimentBadge s={r.sentiment} /> {formatPct(r.confidence)}</p></li>
                ))}</ul> : <p className="text-sm text-muted-foreground">Nenhum.</p>}
              </Panel>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
