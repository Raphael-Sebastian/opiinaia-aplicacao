"""Etapa 3 — Reconhecimento de entidades nomeadas com spaCy (pt_core_news_sm)."""
from functools import lru_cache

import spacy

LABELS = {"PER": "PESSOA", "ORG": "ORGANIZACAO", "LOC": "LOCAL", "MISC": "OUTRO"}


@lru_cache(maxsize=1)
def get_nlp():
    return spacy.load("pt_core_news_sm")


def extract_entities(text: str) -> list[dict]:
    doc = get_nlp()(text)
    seen, out = set(), []
    for ent in doc.ents:
        label = LABELS.get(ent.label_, "OUTRO")
        if label == "OUTRO":
            continue  # o projeto foca em pessoas, organizações e locais
        key = (ent.text.lower(), label)
        if key not in seen:
            seen.add(key)
            out.append({"text": ent.text, "label": label})
    return out
