import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import type { Sentiment } from "@/lib/nlp-types";
import { SENTIMENT_LABEL } from "@/lib/stats";

const COLOR: Record<Sentiment, string> = { positivo: "var(--positive)", negativo: "var(--negative)", neutro: "var(--neutral)" };
const tooltipStyle = { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--popover-foreground)" };

export function SentimentPie({ counts }: { counts: Record<Sentiment, number> }) {
  const data = (Object.keys(counts) as Sentiment[]).map((k) => ({ name: SENTIMENT_LABEL[k], value: counts[k], key: k }));
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3} stroke="none">
          {data.map((d) => <Cell key={d.key} fill={COLOR[d.key]} />)}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function TimelineChart({ data }: { data: { date: string; positivo: number; negativo: number; neutro: number }[] }) {
  const fmt = data.map((d) => ({ ...d, label: d.date.split("-").reverse().slice(0, 2).join("/") }));
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={fmt}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={12} />
        <YAxis allowDecimals={false} stroke="var(--muted-foreground)" fontSize={12} />
        <Tooltip contentStyle={tooltipStyle} />
        {(["positivo", "neutro", "negativo"] as Sentiment[]).map((s) => (
          <Area key={s} type="monotone" dataKey={s} name={SENTIMENT_LABEL[s]} stackId="1" stroke={COLOR[s]} fill={COLOR[s]} fillOpacity={0.35} />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function TermBars({ data, dataKey = "count" }: { data: { term: string; [k: string]: number | string }[]; dataKey?: string }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 26)}>
      <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="term" width={110} stroke="var(--muted-foreground)" fontSize={12} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
        <Bar dataKey={dataKey} fill="var(--brand-violet)" radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
