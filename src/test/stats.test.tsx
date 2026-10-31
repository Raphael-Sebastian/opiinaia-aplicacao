import { describe, expect, it } from "vitest";
import { filterByPeriod, sentimentCounts } from "@/lib/stats";

const rows = [
  { sentiment: "positivo" as const, created_at: "2026-10-01T10:00:00Z" },
  { sentiment: "negativo" as const, created_at: "2026-10-05T10:00:00Z" },
  { sentiment: "negativo" as const, created_at: "2026-10-10T10:00:00Z" },
  { sentiment: "neutro" as const, created_at: "2026-10-20T10:00:00Z" },
];

describe("estatísticas", () => {
  it("conta e calcula percentuais reais de cada sentimento", () => {
    const s = sentimentCounts(rows);
    expect(s.total).toBe(4);
    expect(s.counts.negativo).toBe(2);
    expect(s.percent.negativo).toBe(50);
  });
  it("sem dados, percentuais são zero", () => {
    expect(sentimentCounts([]).percent.positivo).toBe(0);
  });
  it("filtra por período inclusivo", () => {
    expect(filterByPeriod(rows, "2026-10-05", "2026-10-10")).toHaveLength(2);
  });
});
