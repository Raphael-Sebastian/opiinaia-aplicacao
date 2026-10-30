// Acesso ao banco (analyses + tabelas relacionadas). A segurança é feita por RLS:
// cada usuário só lê e altera as próprias análises.
import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AnalyzeResult, Sentiment } from "./nlp-types";

export interface AnalysisRow {
  id: string;
  original_text: string;
  sentiment: Sentiment;
  confidence: number;
  summary: string | null;
  aspects: unknown;
  analysis_type: "individual" | "lote";
  created_at: string;
  analysis_keywords: { keyword: string; relevance_score: number }[];
  analysis_entities: { entity_text: string; entity_type: string }[];
}

/** Salva uma análise produzida pela API e seus termos/entidades. */
export async function saveAnalysis(text: string, r: AnalyzeResult, type: "individual" | "lote") {
  const { data, error } = await supabase
    .from("analyses")
    .insert({
      original_text: text,
      sentiment: r.sentiment,
      confidence: r.confidence,
      summary: r.summary?.text ?? null,
      aspects: JSON.parse(JSON.stringify(r.aspects ?? [])),
      analysis_type: type,
    })
    .select("id")
    .single();
  if (error) throw error;
  const id = data.id;
  if (r.keywords?.length) {
    const { error: e } = await supabase
      .from("analysis_keywords")
      .insert(r.keywords.slice(0, 15).map((k) => ({ analysis_id: id, keyword: k.term, relevance_score: k.score })));
    if (e) throw e;
  }
  if (r.entities?.length) {
    const { error: e } = await supabase
      .from("analysis_entities")
      .insert(r.entities.map((en) => ({ analysis_id: id, entity_text: en.text, entity_type: en.label })));
    if (e) throw e;
  }
  return id;
}

/** Busca todas as análises do usuário (paginando de 1000 em 1000). */
async function fetchAllAnalyses(): Promise<AnalysisRow[]> {
  const out: AnalysisRow[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("analyses")
      .select(
        "id, original_text, sentiment, confidence, summary, aspects, analysis_type, created_at, analysis_keywords(keyword, relevance_score), analysis_entities(entity_text, entity_type)",
      )
      .order("created_at", { ascending: false })
      .range(from, from + 999);
    if (error) throw error;
    out.push(...((data ?? []) as unknown as AnalysisRow[]));
    if (!data || data.length < 1000) break;
  }
  return out;
}

export const analysesQuery = queryOptions({
  queryKey: ["analyses"],
  queryFn: fetchAllAnalyses,
});

export async function deleteAnalysis(id: string) {
  const { error } = await supabase.from("analyses").delete().eq("id", id);
  if (error) throw error;
}
