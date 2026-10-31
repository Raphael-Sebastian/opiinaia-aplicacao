"""Etapa 5 — Resumo EXTRATIVO: seleciona as frases com maior soma de TF-IDF.
Não é um modelo generativo: as frases vêm do próprio texto."""
from .keywords import tfidf_terms
from .preprocessing import split_sentences, normalize, tokenize


def extractive_summary(text: str, max_sentences: int = 2) -> dict:
    sents = split_sentences(text)
    if len(sents) <= max_sentences:
        return {"text": " ".join(sents) or text, "method": "extrativo"}
    weights = {k["term"]: k["score"] for k in tfidf_terms(sents, top_k=100)}
    scored = [(i, sum(weights.get(t, 0) for t in tokenize(normalize(s)))) for i, s in enumerate(sents)]
    top = sorted(sorted(scored, key=lambda x: -x[1])[:max_sentences])
    return {"text": " ".join(sents[i] for i, _ in top), "method": "extrativo"}
