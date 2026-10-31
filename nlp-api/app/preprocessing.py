"""Etapa 1 — Pré-processamento: normalização, tokenização e stopwords (NLTK)."""
import re
import unicodedata
from collections import Counter

import nltk
from nltk.corpus import stopwords

try:
    STOPWORDS = set(stopwords.words("portuguese"))
except LookupError:
    nltk.download("stopwords", quiet=True)
    STOPWORDS = set(stopwords.words("portuguese"))
STOPWORDS |= {"pra", "pro", "tá", "ta", "vc", "q", "ser", "ter", "estar", "ja", "nao"} - {"nao"}


def strip_accents(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def normalize(text: str) -> str:
    """Minúsculas, remove URLs, números e pontuação. Mantém acentos para leitura."""
    t = text.lower()
    t = re.sub(r"https?://\S+", " ", t)
    t = re.sub(r"[^\w\s]|\d|_", " ", t)
    return re.sub(r"\s+", " ", t).strip()


def split_sentences(text: str) -> list[str]:
    try:
        return [s.strip() for s in nltk.sent_tokenize(text, language="portuguese") if s.strip()]
    except LookupError:
        return [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]


def tokenize(normalized: str) -> list[str]:
    return [t for t in normalized.split(" ") if t]


def is_stopword(tok: str) -> bool:
    return tok in STOPWORDS or strip_accents(tok) in STOPWORDS or len(tok) < 2


def preprocess(text: str) -> dict:
    norm = normalize(text)
    tokens = tokenize(norm)
    kept = [t for t in tokens if not is_stopword(t)]
    removed = sorted({t for t in tokens if is_stopword(t)})
    freq = Counter(kept).most_common(50)
    sentences = split_sentences(text)
    return {
        "original": text,
        "normalized": norm,
        "sentences": sentences,
        "tokens": tokens,
        "tokens_without_stopwords": kept,
        "stopwords_removed": removed,
        "word_count": len(tokens),
        "sentence_count": len(sentences),
        "frequencies": [{"term": t, "count": c} for t, c in freq],
    }
