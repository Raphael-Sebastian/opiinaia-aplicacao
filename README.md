# OpinaIA

**Transformando opiniões em informações inteligentes.** Plataforma acadêmica de análise de opiniões com Processamento de Linguagem Natural.

## Tecnologias
- **Frontend:** React 19, TypeScript, TanStack Start, Tailwind CSS v4, Recharts, PapaParse, jsPDF.
- **Dados:** Lovable Cloud (PostgreSQL, autenticação e Row Level Security).
- **Motor de NLP:** Python, FastAPI, Hugging Face Transformers, spaCy, NLTK, scikit-learn (pasta `nlp-api/`).

## Estrutura
```
src/routes/            páginas (index, auth, reset-password, _authenticated/*)
src/components/opina/  componentes reutilizáveis (layout, gráficos, resultados)
src/lib/nlp.functions.ts  camada de serviço → API Python (funções de servidor)
src/lib/analyses.ts    leitura/gravação no banco
src/lib/stats.ts       estatísticas do dashboard e relatórios
nlp-api/               API FastAPI (pré-processamento, sentimento, NER, TF-IDF, resumo, aspectos)
```

## Banco de dados
Tabelas `profiles`, `analyses`, `analysis_entities`, `analysis_keywords`, com chaves estrangeiras em cascata e RLS: cada usuário só vê e altera as próprias análises.

## Como conectar a API Python
1. Hospede `nlp-api/` (veja `nlp-api/README.md`).
2. Configure o segredo **NLP_API_URL** com a URL pública (ex.: `https://minha-api.onrender.com`).
3. Opcional: **NLP_API_KEY** igual à configurada na API.

Sem a URL, o app exibe "Serviço de NLP não conectado" e não realiza análises — nenhum resultado é simulado.

## Fluxo do NLP
1. Pré-processamento (normalização, tokenização, stopwords) — o texto original é preservado para a classificação.
2. Sentimento com Transformer multilíngue (positivo/negativo/neutro + confiança).
3. Entidades com spaCy `pt_core_news_sm`.
4. Termos relevantes por TF-IDF.
5. Resumo extrativo (frases do próprio texto).
6. Aspectos por dicionário + sentimento da frase (análise complementar).
