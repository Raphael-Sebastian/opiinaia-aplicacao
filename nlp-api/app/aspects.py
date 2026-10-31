"""Etapa 6 — Análise por aspectos (complementar).
Detecta aspectos por dicionário de termos e classifica o sentimento da frase em que aparecem."""
from .preprocessing import split_sentences, normalize, strip_accents
from .sentiment import classify

ASPECTS = {
    "atendimento": ["atendimento", "atendente", "atender", "atendeu", "vendedor", "educado", "grosso"],
    "entrega": ["entrega", "entregue", "chegar", "chegou", "frete", "prazo", "atraso", "atrasou", "correio", "demorou"],
    "preço": ["preco", "caro", "barato", "valor", "custo", "desconto", "promocao"],
    "qualidade": ["qualidade", "material", "acabamento", "resistente", "durabilidade", "frageis", "fragil"],
    "produto": ["produto", "item", "mercadoria", "modelo", "tamanho", "cor"],
    "suporte": ["suporte", "sac", "assistencia", "garantia", "troca", "devolucao", "reembolso"],
}


def detect_aspects(text: str) -> list[dict]:
    result = []
    sents = split_sentences(text) or [text]
    for aspect, terms in ASPECTS.items():
        hits = [s for s in sents if any(t in strip_accents(normalize(s)).split() for t in terms)]
        if not hits:
            continue
        sentiment = classify(" ".join(hits))["sentiment"]
        result.append({"aspect": aspect, "mentions": hits, "sentiment": sentiment})
    return result
