"""API FastAPI do motor de NLP da OpinaIA. Documentação automática em /docs."""
import os

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from . import sentiment as sent_mod
from .aspects import detect_aspects
from .entities import extract_entities, get_nlp
from .keywords import keywords_for_text, tfidf_terms
from .preprocessing import preprocess
from .schemas import AnalyzeOut, BatchIn, PreprocessIn, TextIn
from .summary import extractive_summary

app = FastAPI(title="OpinaIA NLP API", version="1.0.0",
              description="Pré-processamento, sentimentos, entidades, TF-IDF, resumo extrativo e aspectos.")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

API_KEY = os.getenv("NLP_API_KEY")


def check_key(x_api_key: str | None = Header(default=None)):
    """Se NLP_API_KEY estiver definida, exige o cabeçalho X-API-Key."""
    if API_KEY and x_api_key != API_KEY:
        raise HTTPException(401, "Chave de API inválida.")


@app.on_event("startup")
def load_models():
    sent_mod.get_classifier()
    get_nlp()


def analyze_text(text: str) -> dict:
    s = sent_mod.classify(text)  # texto original preservado para a classificação
    return {
        **s,
        "keywords": keywords_for_text(text),
        "entities": extract_entities(text),
        "summary": extractive_summary(text),
        "aspects": detect_aspects(text),
        "model": sent_mod.MODEL_NAME,
    }


@app.get("/health")
def health():
    models = {}
    for name, fn in (("sentimento", sent_mod.get_classifier), ("spacy", get_nlp)):
        try:
            fn(); models[name] = True
        except Exception:
            models[name] = False
    return {"status": "ok" if all(models.values()) else "degradado", "models": models}


@app.post("/analyze", response_model=AnalyzeOut, dependencies=[Depends(check_key)])
def analyze(body: TextIn):
    try:
        return analyze_text(body.text.strip())
    except Exception as e:
        raise HTTPException(500, f"Falha no processamento: {e}")


@app.post("/analyze/batch", dependencies=[Depends(check_key)])
def analyze_batch(body: BatchIn):
    results = []
    for i, t in enumerate(body.texts):
        if not t or not t.strip():
            results.append({"index": i, "ok": False, "error": "Texto vazio"}); continue
        try:
            results.append({"index": i, "ok": True, "result": analyze_text(t.strip()[:5000])})
        except Exception as e:
            results.append({"index": i, "ok": False, "error": str(e)})
    return {"results": results}


@app.post("/preprocess", dependencies=[Depends(check_key)])
def preprocess_endpoint(body: PreprocessIn):
    docs = [t for t in (body.texts or []) if t and t.strip()]
    text = body.text.strip() if body.text else ""
    if not text and not docs:
        raise HTTPException(422, "O texto não pode estar vazio.")
    full = text or "\n".join(docs)
    out = preprocess(full)
    out["tfidf"] = tfidf_terms(docs, 20) if docs else keywords_for_text(full, 20)
    return out
