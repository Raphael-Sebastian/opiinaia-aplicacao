// Camada de serviço: funções de servidor que encaminham as requisições para a
// API Python de NLP. A URL fica na variável de ambiente NLP_API_URL (servidor),
// nunca no navegador. Nenhum resultado é simulado: se a API falhar, o erro é
// devolvido para a interface.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type {
  AnalyzeResult,
  BatchItem,
  HealthResult,
  NlpResponse,
  PreprocessResult,
} from "./nlp-types";

async function callNlp<T>(path: string, init?: RequestInit, timeoutMs = 120_000): Promise<NlpResponse<T>> {
  const base = process.env["NLP_API_URL"];
  if (!base) {
    return {
      ok: false,
      reason: "not_configured",
      message: "O serviço de NLP ainda não foi conectado (variável NLP_API_URL ausente).",
    };
  }
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const key = process.env["NLP_API_KEY"];
  if (key) headers["X-API-Key"] = key;
  try {
    const res = await fetch(base.replace(/\/+$/, "") + path, {
      ...init,
      headers,
      signal: AbortSignal.timeout(timeoutMs),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      const detail = body && typeof body === "object" && "detail" in body ? String((body as { detail: unknown }).detail) : `HTTP ${res.status}`;
      return { ok: false, reason: res.status === 422 || res.status === 400 ? "invalid" : "unavailable", message: detail };
    }
    return { ok: true, data: body as T };
  } catch (e) {
    return {
      ok: false,
      reason: "unavailable",
      message: "Não foi possível contatar a API de NLP. A análise não pôde ser concluída. " + (e instanceof Error ? e.message : ""),
    };
  }
}

export const nlpHealth = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => callNlp<HealthResult>("/health", { method: "GET" }, 10_000));

export const nlpAnalyze = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { text: string }) => {
    const text = String(input?.text ?? "").trim();
    if (!text) throw new Error("O texto não pode estar vazio.");
    if (text.length > 5000) throw new Error("O texto deve ter no máximo 5000 caracteres.");
    return { text };
  })
  .handler(async ({ data }) =>
    callNlp<AnalyzeResult>("/analyze", { method: "POST", body: JSON.stringify({ text: data.text }) }),
  );

export const nlpAnalyzeBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { texts: string[] }) => {
    const texts = Array.isArray(input?.texts) ? input.texts.map((t) => String(t ?? "")) : [];
    if (texts.length === 0) throw new Error("Nenhum comentário enviado.");
    if (texts.length > 50) throw new Error("Envie no máximo 50 comentários por requisição.");
    return { texts };
  })
  .handler(async ({ data }) =>
    callNlp<{ results: BatchItem[] }>("/analyze/batch", { method: "POST", body: JSON.stringify({ texts: data.texts }) }),
  );

export const nlpPreprocess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { text?: string; texts?: string[] }) => {
    const text = String(input?.text ?? "").trim();
    const texts = Array.isArray(input?.texts) ? input.texts.map(String).slice(0, 2000) : undefined;
    if (!text && !texts?.length) throw new Error("O texto não pode estar vazio.");
    return { text, texts };
  })
  .handler(async ({ data }) =>
    callNlp<PreprocessResult>("/preprocess", { method: "POST", body: JSON.stringify(data) }),
  );
