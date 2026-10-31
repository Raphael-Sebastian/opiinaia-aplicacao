"""Modelos de entrada/saída (validação com Pydantic)."""
from typing import Literal, Optional
from pydantic import BaseModel, Field, field_validator

Sentiment = Literal["positivo", "negativo", "neutro"]


class TextIn(BaseModel):
    text: str = Field(..., max_length=5000)

    @field_validator("text")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("O texto não pode estar vazio.")
        return v


class BatchIn(BaseModel):
    texts: list[str] = Field(..., min_length=1, max_length=50)


class PreprocessIn(BaseModel):
    text: Optional[str] = ""
    texts: Optional[list[str]] = None


class Keyword(BaseModel):
    term: str
    score: float


class Entity(BaseModel):
    text: str
    label: str


class Aspect(BaseModel):
    aspect: str
    mentions: list[str]
    sentiment: Optional[Sentiment]


class Summary(BaseModel):
    text: str
    method: str


class AnalyzeOut(BaseModel):
    sentiment: Sentiment
    confidence: float
    scores: dict[str, float]
    keywords: list[Keyword]
    entities: list[Entity]
    summary: Summary
    aspects: list[Aspect]
    model: str
