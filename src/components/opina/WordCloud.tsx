// Nuvem de palavras simples: o tamanho da fonte é proporcional à frequência.
const TONES = ["text-primary", "text-brand-violet", "text-brand-blue", "text-accent-foreground"];

export function WordCloud({ words }: { words: { term: string; count: number }[] }) {
  if (!words.length) return <p className="text-sm text-muted-foreground">Sem palavras para exibir.</p>;
  const max = Math.max(...words.map((w) => w.count));
  const min = Math.min(...words.map((w) => w.count));
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 py-4">
      {words.map((w, i) => {
        const t = max === min ? 0.5 : (w.count - min) / (max - min);
        return (
          <span
            key={w.term}
            title={`${w.count} ocorrência(s)`}
            className={`font-display font-semibold leading-none ${TONES[i % TONES.length]}`}
            style={{ fontSize: `${0.85 + t * 1.6}rem`, opacity: 0.55 + t * 0.45 }}
          >
            {w.term}
          </span>
        );
      })}
    </div>
  );
}
