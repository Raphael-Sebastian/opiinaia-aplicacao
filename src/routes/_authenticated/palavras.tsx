import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, ScanText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { nlpPreprocess } from "@/lib/nlp.functions";
import { analysesQuery } from "@/lib/analyses";
import type { PreprocessResult } from "@/lib/nlp-types";
import { ErrorNote, NlpStatus, PageHeader, Panel, StatCard } from "@/components/opina/ui-bits";
import { TermBars } from "@/components/opina/Charts";
import { WordCloud } from "@/components/opina/WordCloud";

export const Route = createFileRoute("/_authenticated/palavras")({
  head: () => ({ meta: [{ title: "Análise de palavras — OpinaIA" }, { name: "description", content: "Tokenização, stopwords e TF-IDF." }] }),
  component: Words,
});

function Words() {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<PreprocessResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pre = useServerFn(nlpPreprocess);
  const history = useQuery(analysesQuery);

  async function run(useHistory: boolean) {
    setError(null); setRes(null);
    const payload = useHistory ? { texts: (history.data ?? []).map((a) => a.original_text) } : { text: text.trim() };
    if (useHistory && !payload.texts?.length) return toast.error("Você ainda não tem comentários no histórico.");
    if (!useHistory && !payload.text) return toast.error("Digite um texto.");
    setBusy(true);
    try {
      const r = await pre({ data: payload });
      if (!r.ok) setError(r.message); else setRes(r.data);
    } catch (e) { setError(e instanceof Error ? e.message : "Erro inesperado."); }
    finally { setBusy(false); }
  }

  return (
    <>
      <PageHeader title="Análise de palavras" description="Veja cada etapa do pré-processamento textual." />
      <NlpStatus />
      <Panel title="Texto de entrada" className="mb-5">
        <Textarea rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder="Digite um ou mais comentários..." />
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={() => run(false)} disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <ScanText />} Processar texto</Button>
          <Button variant="outline" onClick={() => run(true)} disabled={busy}>Processar todo o histórico ({history.data?.length ?? 0})</Button>
        </div>
      </Panel>
      {error && <ErrorNote title="O processamento não pôde ser concluído" message={error} />}
      {res && (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-4">
            <StatCard label="Palavras" value={res.word_count} />
            <StatCard label="Frases" value={res.sentence_count} />
            <StatCard label="Tokens" value={res.tokens.length} />
            <StatCard label="Stopwords removidas" value={res.stopwords_removed.length} />
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <Panel title="Texto original"><p className="max-h-60 overflow-auto whitespace-pre-wrap text-sm">{res.original}</p></Panel>
            <Panel title="Após pré-processamento">
              <p className="max-h-60 overflow-auto text-sm">{res.tokens_without_stopwords.join(" ")}</p>
              <p className="mt-2 text-xs text-muted-foreground">Minúsculas, sem acentos/pontuação e sem stopwords. O texto original é preservado para a classificação de sentimentos.</p>
            </Panel>
          </div>
          <Panel title="Tokenização">
            <div className="flex max-h-48 flex-wrap gap-1 overflow-auto">
              {res.tokens.slice(0, 400).map((t, i) => {
                const stop = res.stopwords_removed.includes(t);
                return <span key={i} className={stop ? "rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground line-through" : "rounded bg-accent px-1.5 py-0.5 text-xs text-accent-foreground"}>{t}</span>;
              })}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Riscados: stopwords removidas na análise estatística.</p>
          </Panel>
          <div className="grid gap-5 lg:grid-cols-2">
            <Panel title="Palavras mais frequentes"><TermBars data={res.frequencies.slice(0, 12)} /></Panel>
            <Panel title="Termos mais relevantes (TF-IDF)"><TermBars data={res.tfidf.slice(0, 12).map((k) => ({ term: k.term, score: Number(k.score.toFixed(3)) }))} dataKey="score" /></Panel>
          </div>
          <Panel title="Nuvem de palavras"><WordCloud words={res.frequencies.slice(0, 40)} /></Panel>
        </div>
      )}
    </>
  );
}
