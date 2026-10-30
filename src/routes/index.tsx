import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Brain, FileSpreadsheet, LineChart, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/opina/Logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OpinaIA — Transformando opiniões em informações inteligentes" },
      { name: "description", content: "Plataforma de NLP para analisar sentimentos, entidades e palavras-chave em comentários de clientes." },
      { property: "og:title", content: "OpinaIA — Transformando opiniões em informações inteligentes" },
      { property: "og:description", content: "Plataforma de NLP para analisar sentimentos, entidades e palavras-chave em comentários de clientes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const STEPS = [
  { icon: Type, t: "Pré-processamento", d: "Normalização, tokenização e remoção de stopwords com NLTK e spaCy." },
  { icon: Brain, t: "Sentimentos", d: "Modelo Transformer pré-treinado classifica positivo, negativo ou neutro." },
  { icon: FileSpreadsheet, t: "Lote via CSV", d: "Importe planilhas, escolha a coluna e exporte os resultados." },
  { icon: LineChart, t: "Dashboards", d: "Indicadores, evolução, TF-IDF e relatórios em PDF." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <Button asChild variant="ghost"><Link to="/auth">Entrar</Link></Button>
      </header>
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-10 sm:pt-20">
        <p className="mb-4 inline-block rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">Processamento de Linguagem Natural</p>
        <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-foreground sm:text-6xl">
          Transformando opiniões em <span className="text-brand-gradient">informações inteligentes</span>.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted-foreground">
          Analise comentários e avaliações de clientes: sentimento, entidades, termos relevantes e assuntos — tudo explicado etapa por etapa.
        </p>
        <div className="mt-8 flex gap-3">
          <Button asChild size="lg"><Link to="/auth">Começar agora <ArrowRight /></Link></Button>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-20 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map(({ icon: Icon, t, d }, i) => (
          <div key={t} className="rounded-2xl border bg-card p-5 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-xl bg-brand-gradient p-2.5 text-primary-foreground"><Icon className="h-5 w-5" /></div>
              <span className="font-display text-sm text-muted-foreground">0{i + 1}</span>
            </div>
            <h3 className="font-semibold">{t}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{d}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
