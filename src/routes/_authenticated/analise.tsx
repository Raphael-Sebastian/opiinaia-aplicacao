import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { nlpAnalyze } from "@/lib/nlp.functions";
import { saveAnalysis } from "@/lib/analyses";
import type { AnalyzeResult } from "@/lib/nlp-types";
import { ErrorNote, NlpStatus, PageHeader, Panel } from "@/components/opina/ui-bits";
import { AnalysisResultView } from "@/components/opina/AnalysisResultView";

export const Route = createFileRoute("/_authenticated/analise")({
  head: () => ({ meta: [{ title: "Análise individual — OpinaIA" }, { name: "description", content: "Analise o sentimento de um comentário." }] }),
  component: SingleAnalysis,
});

const EXAMPLE = "O atendimento foi excelente, mas o produto demorou muito para chegar. Fiquei decepcionado com a entrega.";

function SingleAnalysis() {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const analyze = useServerFn(nlpAnalyze);
  const qc = useQueryClient();

  async function run() {
    const t = text.trim();
    if (!t) return void toast.error("Digite um comentário para analisar.");
    setBusy(true); setError(null); setResult(null);
    try {
      const r = await analyze({ data: { text: t } });
      if (!r.ok) { setError(r.message); return; }
      setResult(r.data);
      await saveAnalysis(t, r.data, "individual");
      qc.invalidateQueries({ queryKey: ["analyses"] });
      toast.success("Análise concluída e salva no histórico.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Análise individual" description="Envie um comentário para o motor de NLP." />
      <NlpStatus />
      <div className="grid gap-5 lg:grid-cols-5">
        <Panel title="Comentário" className="lg:col-span-2">
          <Textarea rows={8} value={text} maxLength={5000} onChange={(e) => setText(e.target.value)} placeholder="Digite ou cole aqui o comentário do cliente..." />
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <button className="text-brand-violet" onClick={() => setText(EXAMPLE)}>Usar exemplo</button>
            <span>{text.length}/5000</span>
          </div>
          <Button className="mt-4 w-full" onClick={run} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <Sparkles />} {busy ? "Processando..." : "Analisar comentário"}
          </Button>
        </Panel>
        <Panel title="Resultado" className="lg:col-span-3">
          {error && <ErrorNote title="A análise não pôde ser concluída" message={error} />}
          {busy && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> O modelo está processando o texto...</p>}
          {result && <AnalysisResultView r={result} />}
          {!busy && !result && !error && <p className="text-sm text-muted-foreground">O resultado aparecerá aqui.</p>}
        </Panel>
      </div>
    </>
  );
}
