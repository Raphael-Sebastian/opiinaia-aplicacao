FROM python:3.11-slim
WORKDIR /srv
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
 && python -m spacy download pt_core_news_sm \
 && python -c "import nltk; nltk.download('stopwords'); nltk.download('punkt'); nltk.download('punkt_tab')"
COPY app ./app
ENV PORT=8000
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT}
