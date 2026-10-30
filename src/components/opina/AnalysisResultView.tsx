import type { AnalyzeResult } from "@/lib/nlp-types";
import { formatPct } from "@/lib/export";
import { SentimentBadge } from "./ui-bits";

const ENTITY_LABEL: Record<string, string> = { PESSOA: "Pessoa", ORGANIZACAO: "Organização", LOCAL: "Localização", OUTRO: "Outro" };

/** Exibe o resultado completo devolvido pela API de NLP. */
export function AnalysisResultView({ r }: { r: AnalyzeResult }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Sentimento geral</p>
          <div className="mt-1 scale-125 origin-left"><SentimentBadge s={r.sentiment} /></div>
        </div>
        <div className="flex-1 min-w-48">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Confiança do modelo</p>
          <div className="mt-2 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-brand-gradient" style={{ width: `${r.confidence * 100}%` }} />
            </div>
            <span className="font-display font-semibold">{formatPct(r.confidence)}</span>
          </div>
        </div>
      </div>
      <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
        A classificação representa a interpretação geral do texto feita pelo modelo <b>{r.model}</b>. Textos com opiniões mistas recebem apenas o sentimento predominante — veja a análise por aspectos abaixo.
      </p>

      {Object.keys(r.scores ?? {}).length > 0 && (
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          {Object.entries(r.scores).map(([k, v]) => (
            <div key={k} className="rounded-lg border p-2">
              <p className="capitalize text-muted-foreground">{k}</p>
              <p className="font-display text-base font-semibold">{formatPct(v)}</p>
            </div>
          ))}
        </div>
      )}

      <div>
        <h3 className="mb-2 text-sm font-semibold">Resumo</h3>
        <p className="text-sm">{r.summary?.text || "—"}</p>
        <p className="mt-1 text-xs text-muted-foreground">Método: {r.summary?.method} (frases relevantes extraídas do próprio texto, não gerado por IA generativa).</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-semibold">Palavras relevantes (TF-IDF)</h3>
          <div className="flex flex-wrap gap-1.5">
            {r.keywords.length ? r.keywords.map((k) => (
              <span key={k.term} className="rounded-full bg-accent px-2.5 py-1 text-xs text-accent-foreground">
                {k.term} <span className="opacity-60">{k.score.toFixed(2)}</span>
              </span>
            )) : <span className="text-sm text-muted-foreground">Nenhuma.</span>}
          </div>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold">Entidades (spaCy)</h3>
          {r.entities.length ? (
            <ul className="space-y-1 text-sm">
              {r.entities.map((e, i) => (
                <li key={i} className="flex justify-between rounded-lg border px-3 py-1.5">
                  <span>{e.text}</span><span className="text-xs text-muted-foreground">{ENTITY_LABEL[e.label] ?? e.label}</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted-foreground">Nenhuma entidade identificada.</p>}
        </div>
      </div>

      <div>
        <h3 className="mb-1 text-sm font-semibold">Análise por aspectos <span className="font-normal text-muted-foreground">(complementar)</span></h3>
        <p className="mb-2 text-xs text-muted-foreground">Identifica assuntos citados e o sentimento do trecho em que aparecem. Não substitui a classificação geral.</p>
        {r.aspects.length ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {r.aspects.map((a) => (
              <div key={a.aspect} className="rounded-xl border p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium capitalize">{a.aspect}</span>
                  {a.sentiment && <SentimentBadge s={a.sentiment} />}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{a.mentions.join(" · ")}</p>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-muted-foreground">Nenhum aspecto identificado.</p>}
      </div>
    </div>
  );
}
