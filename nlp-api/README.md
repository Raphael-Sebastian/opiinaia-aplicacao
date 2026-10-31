# OpinaIA — Motor de NLP (FastAPI)

| Endpoint | Função |
|---|---|
| `GET /health` | Status e modelos carregados |
| `POST /analyze` | `{ "text": "..." }` → sentimento, confiança, palavras, entidades, resumo, aspectos |
| `POST /analyze/batch` | `{ "texts": [...] }` (máx. 50) → resultados individuais |
| `POST /preprocess` | `{ "text": "..." }` ou `{ "texts": [...] }` → tokens, stopwords, frequências, TF-IDF |

Documentação interativa: `/docs`.

## Rodar localmente
```bash
pip install -r requirements.txt
python -m spacy download pt_core_news_sm
python -c "import nltk; nltk.download('stopwords'); nltk.download('punkt'); nltk.download('punkt_tab')"
uvicorn app.main:app --reload
```

## Hospedar
Use o `Dockerfile` (Render, Railway, Fly.io ou Hugging Face Spaces com Docker). Requer ~2 GB de RAM.
Opcional: defina `NLP_API_KEY` para proteger a API (o app envia no cabeçalho `X-API-Key`).
