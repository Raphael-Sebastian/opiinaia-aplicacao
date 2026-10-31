"""Etapa 2 — Classificação de sentimentos com Transformers (modelo multilíngue pré-treinado)."""
import os
from functools import lru_cache

from transformers import pipeline

MODEL_NAME = os.getenv("SENTIMENT_MODEL", "lxyuan/distilbert-base-multilingual-cased-sentiments-student")
LABEL_MAP = {"positive": "positivo", "negative": "negativo", "neutral": "neutro",
             "pos": "positivo", "neg": "negativo", "neu": "neutro"}


@lru_cache(maxsize=1)
def get_classifier():
    return pipeline("text-classification", model=MODEL_NAME, top_k=None, truncation=True)


def classify(text: str) -> dict:
    """Retorna a classe prevista e os scores fornecidos pelo modelo (sem simulação)."""
    out = get_classifier()(text)
    scores_list = out[0] if isinstance(out[0], list) else out
    scores = {LABEL_MAP.get(s["label"].lower(), s["label"].lower()): float(s["score"]) for s in scores_list}
    best = max(scores, key=scores.get)
    return {"sentiment": best, "confidence": round(scores[best], 4), "scores": {k: round(v, 4) for k, v in scores.items()}}
