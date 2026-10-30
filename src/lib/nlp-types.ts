// Tipos compartilhados entre o app e a API Python (FastAPI) de NLP.

export type Sentiment = "positivo" | "negativo" | "neutro";

export interface Keyword {
  term: string;
  score: number;
}

export interface Entity {
  text: string;
  label: string; // PESSOA | ORGANIZACAO | LOCAL | OUTRO
}

export interface Aspect {
  aspect: string;
  mentions: string[];
  sentiment: Sentiment | null;
}

export interface AnalyzeResult {
  sentiment: Sentiment;
  confidence: number;
  scores: Record<string, number>;
  keywords: Keyword[];
  entities: Entity[];
  summary: { text: string; method: string };
  aspects: Aspect[];
  model: string;
}

export interface BatchItem {
  index: number;
  ok: boolean;
  result?: AnalyzeResult;
  error?: string;
}

export interface PreprocessResult {
  original: string;
  normalized: string;
  sentences: string[];
  tokens: string[];
  tokens_without_stopwords: string[];
  stopwords_removed: string[];
  word_count: number;
  sentence_count: number;
  frequencies: { term: string; count: number }[];
  tfidf: Keyword[];
}

export interface HealthResult {
  status: string;
  models: Record<string, boolean>;
}

/** Resposta padronizada das funções de servidor que falam com a API NLP. */
export type NlpResponse<T> =
  | { ok: true; data: T }
  | { ok: false; reason: "not_configured" | "unavailable" | "invalid"; message: string };
