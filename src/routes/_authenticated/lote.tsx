import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import Papa from "papaparse";
import { toast } from "sonner";
import { Download, Loader2, Play, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { nlpAnalyzeBatch } from "@/lib/nlp.functions";
import { saveAnalysis } from "@/lib/analyses";
import type { AnalyzeResult } from "@/lib/nlp-types";
import { sentimentCounts } from "@/lib/stats";
import { downloadCsv, formatPct } from "@/lib/export";
import { ErrorNote, NlpStatus, PageHeader, Panel, SentimentBadge, StatCard } from "@/components/opina/ui-bits";
import { SentimentPie } from "@/components/opina/Charts";

export const Route = createFileRoute("/_authenticated/lote")({
  head: () => ({ meta: [{ title: "Análise em lote — OpinaIA" }, { name: "description", content: "Importe um CSV e analise vários comentários." }] }),
  component: Batch,
});

const CHUNK = 25; // comentários por requisição à API
const MAX_ROWS = 1000;

interface Row { text: string; result?: AnalyzeResult; error?: string }

function Batch() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [records, setRecords] = useState<Record<string, string>[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [column, setColumn] = useState<string>("");
  const [rows, setRows] = useState<Row[]>([]);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [fatal, setFatal] = useState<string | null>(null);
  const batch = useServerFn(nlpAnalyzeBatch);
  const qc = useQueryClient();

  function onFile(f: File | undefined) {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".csv")) return toast.error("Selecione um arquivo .csv");
    if (f.size > 5 * 1024 * 1024) return toast.error("Arquivo muito grande (máx. 5 MB).");
    Papa.parse<Record<string, string>>(f, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const cols = res.meta.fields ?? [];
        if (!cols.length || !res.data.length) return toast.error("O arquivo está vazio ou sem cabeçalho.");
        if (res.data.length > MAX_ROWS) toast.warning(`Apenas as primeiras ${MAX_ROWS} linhas serão processadas.`);
        setFileName(f.name);
        setRecords(res.data.slice(0, MAX_ROWS));
        setColumns(cols);
        const guess = cols.find((c) => /coment|texto|review|avalia|opini|text|comment/i.test(c)) ?? cols[0];
        setColumn(guess);
        setRows([]); setFatal(null); setProgress(0);
      },
      error: (err) => toast.error("Erro ao ler o CSV: " + err.message),
    });
  }

  const texts = useMemo(() => records.map((r) => (r[column] ?? "").trim()), [records, column]);
  const emptyCount = texts.filter((t) => !t).length;

  async function process() {
    setBusy(true); setFatal(null); setProgress(0);
    const out: Row[] = texts.map((t) => ({ text: t, error: t ? undefined : "Texto vazio" }));
    setRows([...out]);
    const idx = texts.map((t, i) => (t ? i : -1)).filter((i) => i >= 0);
    try {
      for (let c = 0; c < idx.length; c += CHUNK) {
        const part = idx.slice(c, c + CHUNK);
        const r = await batch({ data: { texts: part.map((i) => texts[i]) } });
        if (!r.ok) { setFatal(r.message); break; }
        for (const item of r.data.results) {
          const i = part[item.index];
          if (item.ok && item.result) {
            out[i] = { text: texts[i], result: item.result };
            try { await saveAnalysis(texts[i], item.result, "lote"); }
            catch { out[i].error = "Analisado, mas não foi salvo no banco"; }
          } else out[i] = { text: texts[i], error: item.error ?? "Erro no processamento" };
        }
        setRows([...out]);
        setProgress(Math.round(((c + part.length) / idx.length) * 100));
      }
      qc.invalidateQueries({ queryKey: ["analyses"] });
      const fails = out.filter((r) => r.error).length;
      if (fails) toast.warning(`${fails} registro(s) com erro.`); else toast.success("Lote processado com sucesso.");
    } catch (e) {
      setFatal(e instanceof Error ? e.message : "Erro inesperado.");
    } finally {
      setBusy(false);
    }
  }

  const done = rows.filter((r) => r.result);
  const stats = sentimentCounts(done.map((r) => ({ sentiment: r.result!.sentiment, created_at: "" })));

  return (
    <>
      <PageHeader title="Análise em lote" description="Importe um arquivo CSV com vários comentários." />
      <NlpStatus />
      <div className="space-y-5">
        <Panel title="1. Arquivo">
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors hover:bg-muted">
            <Upload className="h-6 w-6 text-brand-violet" />
            <span className="text-sm font-medium">{fileName ?? "Clique para escolher um arquivo .csv"}</span>
            <span className="text-xs text-muted-foreground">Primeira linha deve conter os nomes das colunas · até {MAX_ROWS} linhas</span>
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
        </Panel>

        {records.length > 0 && (
          <Panel title="2. Coluna e prévia">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="text-sm">Coluna com os comentários:</span>
              <Select value={column} onValueChange={setColumn}>
                <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                <SelectContent>{columns.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">{records.length} registros · {emptyCount} vazios</span>
              <Button className="ml-auto" onClick={process} disabled={busy || records.length === emptyCount}>
                {busy ? <Loader2 className="animate-spin" /> : <Play />} Processar comentários
              </Button>
            </div>
            <div className="max-h-64 overflow-auto rounded-lg border">
              <Table>
                <TableHeader><TableRow><TableHead className="w-12">#</TableHead><TableHead>{column}</TableHead></TableRow></TableHeader>
                <TableBody>
                  {texts.slice(0, 8).map((t, i) => (
                    <TableRow key={i}><TableCell>{i + 1}</TableCell><TableCell className="max-w-xl truncate">{t || <em className="text-muted-foreground">vazio</em>}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Panel>
        )}

        {(busy || rows.length > 0) && (
          <Panel
            title="3. Resultados"
            action={done.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => downloadCsv("opinaia-lote.csv", rows.map((r, i) => ({
                linha: i + 1, comentario: r.text, sentimento: r.result?.sentiment ?? "", confianca: r.result ? r.result.confidence.toFixed(4) : "",
                palavras_relevantes: r.result?.keywords.map((k) => k.term).join("; ") ?? "", resumo: r.result?.summary.text ?? "", erro: r.error ?? "",
              })))}>
                <Download /> Exportar CSV
              </Button>
            )}
          >
            {busy && <div className="mb-4"><p className="mb-1 text-sm text-muted-foreground">Processando... {progress}%</p><Progress value={progress} /></div>}
            {fatal && <div className="mb-4"><ErrorNote title="O processamento foi interrompido" message={fatal} /></div>}
            {done.length > 0 && (
              <div className="mb-5 grid gap-4 lg:grid-cols-3">
                <div className="grid grid-cols-2 gap-3 lg:col-span-2">
                  <StatCard label="Analisados" value={done.length} />
                  <StatCard label="Com erro" value={rows.filter((r) => r.error).length} />
                  <StatCard label="Positivos" value={`${stats.percent.positivo}%`} tone="positivo" />
                  <StatCard label="Negativos" value={`${stats.percent.negativo}%`} tone="negativo" />
                </div>
                <SentimentPie counts={stats.counts} />
              </div>
            )}
            <div className="max-h-[480px] overflow-auto rounded-lg border">
              <Table>
                <TableHeader><TableRow><TableHead className="w-12">#</TableHead><TableHead>Comentário</TableHead><TableHead>Sentimento</TableHead><TableHead>Confiança</TableHead></TableRow></TableHeader>
                <TableBody>
                  {rows.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell className="max-w-md truncate">{r.text || "—"}</TableCell>
                      <TableCell>{r.result ? <SentimentBadge s={r.result.sentiment} /> : r.error ? <span className="text-xs text-destructive">{r.error}</span> : <Loader2 className="h-3 w-3 animate-spin" />}</TableCell>
                      <TableCell>{r.result ? formatPct(r.result.confidence) : ""}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Panel>
        )}
      </div>
    </>
  );
}
