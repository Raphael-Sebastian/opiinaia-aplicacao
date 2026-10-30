/** Resumo executivo montado a partir das estatísticas reais (texto baseado em regras, não em IA generativa). */
export function buildExecutiveSummary(i: {
  total: number;
  percent: { positivo: number; negativo: number; neutro: number };
  keywords: string[];
  aspects: string[];
}) {
  if (!i.total) return "Não há comentários analisados no período selecionado.";
  const entries = Object.entries(i.percent) as [string, number][];
  const [dom, domPct] = entries.sort((a, b) => b[1] - a[1])[0];
  const parts = [
    `Foram analisados ${i.total} comentário(s) no período.`,
    `O sentimento predominante foi ${dom} (${domPct}%), com ${i.percent.positivo}% positivos, ${i.percent.negativo}% negativos e ${i.percent.neutro}% neutros.`,
  ];
  if (i.aspects.length) parts.push(`Os assuntos mais citados foram: ${i.aspects.slice(0, 3).join(", ")}.`);
  if (i.keywords.length) parts.push(`Termos mais recorrentes: ${i.keywords.slice(0, 5).join(", ")}.`);
  return parts.join(" ");
}
