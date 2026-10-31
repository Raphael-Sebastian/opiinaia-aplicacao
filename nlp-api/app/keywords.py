"""Etapa 4 — Palavras relevantes com TF-IDF (scikit-learn)."""
from sklearn.feature_extraction.text import TfidfVectorizer

from .preprocessing import normalize, split_sentences, tokenize, is_stopword


def _analyzer(doc: str) -> list[str]:
    return [t for t in tokenize(normalize(doc)) if not is_stopword(t)]


def tfidf_terms(documents: list[str], top_k: int = 15) -> list[dict]:
    """Calcula TF-IDF sobre os documentos e soma o peso de cada termo."""
    docs = [d for d in documents if _analyzer(d)]
    if not docs:
        return []
    vec = TfidfVectorizer(analyzer=_analyzer)
    m = vec.fit_transform(docs)
    scores = m.sum(axis=0).A1 / len(docs)
    terms = vec.get_feature_names_out()
    ranked = sorted(zip(terms, scores), key=lambda x: -x[1])[:top_k]
    return [{"term": t, "score": round(float(s), 4)} for t, s in ranked]


def keywords_for_text(text: str, top_k: int = 10) -> list[dict]:
    """Para um único comentário, as frases funcionam como 'documentos' do TF-IDF."""
    sents = split_sentences(text) or [text]
    return tfidf_terms(sents if len(sents) > 1 else [text], top_k)
