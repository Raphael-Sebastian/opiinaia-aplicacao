// Funções puras de estatística sobre as análises salvas (usadas no dashboard,
// relatórios e testes).
import type { Sentiment } from "./nlp-types";

export const SENTIMENT_LABEL: Record<Sentiment, string> = {
  positivo: "Positivo",
  negativo: "Negativo",
  neutro: "Neutro",
};

interface MinimalAnalysis {
  sentiment: Sentiment;
  created_at: string;
  analysis_keywords?: { keyword: string; relevance_score: number }[];
  aspects?: unknown;
}

export function sentimentCounts(rows: MinimalAnalysis[]) {
  const c = { positivo: 0, negativo: 0, neutro: 0 } as Record<Sentiment, number>;
  for (const r of rows) c[r.sentiment] = (c[r.sentiment] ?? 0) + 1;
  const total = rows.length;
  const pct = (n: number) => (total ? Math.round((n / total) * 1000) / 10 : 0);
  return { total, counts: c, percent: { positivo: pct(c.positivo), negativo: pct(c.negativo), neutro: pct(c.neutro) } };
}

/** Palavras mais frequentes entre os termos relevantes de todas as análises. */
export function topKeywords(rows: MinimalAnalysis[], limit = 20) {
  const m = new Map<string, number>();
  for (const r of rows) for (const k of r.analysis_keywords ?? []) m.set(k.keyword, (m.get(k.keyword) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([term, count]) => ({ term, count }));
}

/** Contagem de análises por dia e por sentimento (data local AAAA-MM-DD). */
export function timeline(rows: MinimalAnalysis[]) {
  const m = new Map<string, Record<Sentiment, number>>();
  for (const r of rows) {
    const d = new Date(r.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const e = m.get(key) ?? { positivo: 0, negativo: 0, neutro: 0 };
    e[r.sentiment]++;
    m.set(key, e);
  }
  return [...m.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, v]) => ({ date, ...v }));
}

/** Aspectos (assuntos) mais citados. */
export function topAspects(rows: MinimalAnalysis[]) {
  const m = new Map<string, number>();
  for (const r of rows) {
    if (!Array.isArray(r.aspects)) continue;
    for (const a of r.aspects as { aspect?: string }[]) if (a?.aspect) m.set(a.aspect, (m.get(a.aspect) ?? 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([aspect, count]) => ({ aspect, count }));
}

export function filterByPeriod<T extends { created_at: string }>(rows: T[], from?: string, to?: string) {
  return rows.filter((r) => {
    const d = r.created_at.slice(0, 10);
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  });
}
