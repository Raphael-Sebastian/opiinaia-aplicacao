import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { analysesQuery, deleteAnalysis, type AnalysisRow } from "@/lib/analyses";
import { filterByPeriod } from "@/lib/stats";
import { downloadCsv, formatDate, formatPct } from "@/lib/export";
import { EmptyState, PageHeader, Panel, SentimentBadge } from "@/components/opina/ui-bits";

export const Route = createFileRoute("/_authenticated/historico")({
  head: () => ({ meta: [{ title: "Histórico — OpinaIA" }, { name: "description", content: "Todas as suas análises." }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(analysesQuery),
  component: HistoryPage,
});

const PAGE = 15;

function HistoryPage() {
  const { data } = useSuspenseQuery(analysesQuery);
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [sent, setSent] = useState("todos");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(0);
  const [view, setView] = useState<AnalysisRow | null>(null);
  const [del, setDel] = useState<AnalysisRow | null>(null);

  const filtered = useMemo(() => {
    const term = q.toLowerCase();
    return filterByPeriod(data, from || undefined, to || undefined).filter(
      (a) => (sent === "todos" || a.sentiment === sent) && (!term || a.original_text.toLowerCase().includes(term)),
    );
  }, [data, q, sent, from, to]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const current = filtered.slice(page * PAGE, page * PAGE + PAGE);

  async function confirmDelete() {
    if (!del) return;
    try {
      await deleteAnalysis(del.id);
      toast.success("Análise excluída.");
      qc.invalidateQueries({ queryKey: ["analyses"] });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro ao excluir."); }
    setDel(null);
  }

  function exportCsv() {
    downloadCsv("opinaia-historico.csv", filtered.map((a) => ({
      data: formatDate(a.created_at), comentario: a.original_text, sentimento: a.sentiment, confianca: a.confidence.toFixed(4),
      tipo: a.analysis_type, resumo: a.summary ?? "", palavras: a.analysis_keywords.map((k) => k.keyword).join("; "),
    })));
  }

  if (!data.length) return (<><PageHeader title="Histórico" /><EmptyState title="Histórico vazio" text="As análises que você fizer aparecerão aqui." cta={{ to: "/analise", label: "Fazer uma análise" }} /></>);

  return (
    <>
      <PageHeader title="Histórico" description={`${filtered.length} de ${data.length} análises`} actions={<Button variant="outline" onClick={exportCsv}><Download /> Exportar CSV</Button>} />
      <Panel>
        <div className="mb-4 grid gap-3 sm:grid-cols-4">
          <Input placeholder="Pesquisar comentários..." value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} />
          <Select value={sent} onValueChange={(v) => { setSent(v); setPage(0); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os sentimentos</SelectItem>
              <SelectItem value="positivo">Positivo</SelectItem>
              <SelectItem value="negativo">Negativo</SelectItem>
              <SelectItem value="neutro">Neutro</SelectItem>
            </SelectContent>
          </Select>
          <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(0); }} aria-label="De" />
          <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(0); }} aria-label="Até" />
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Comentário</TableHead><TableHead>Sentimento</TableHead><TableHead>Confiança</TableHead><TableHead>Tipo</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
            <TableBody>
              {current.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="whitespace-nowrap text-xs">{formatDate(a.created_at)}</TableCell>
                  <TableCell className="max-w-xs truncate">{a.original_text}</TableCell>
                  <TableCell><SentimentBadge s={a.sentiment} /></TableCell>
                  <TableCell>{formatPct(a.confidence)}</TableCell>
                  <TableCell className="capitalize">{a.analysis_type}</TableCell>
                  <TableCell className="whitespace-nowrap text-right">
                    <Button variant="ghost" size="icon" onClick={() => setView(a)} aria-label="Detalhes"><Eye /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setDel(a)} aria-label="Excluir"><Trash2 className="text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {!current.length && <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Nenhum resultado para os filtros.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Página {page + 1} de {pages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Anterior</Button>
            <Button variant="outline" size="sm" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>Próxima</Button>
          </div>
        </div>
      </Panel>

      <Dialog open={!!view} onOpenChange={(o) => !o && setView(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Detalhes da análise</DialogTitle></DialogHeader>
          {view && (
            <div className="space-y-3 text-sm">
              <p className="rounded-lg bg-muted p-3">{view.original_text}</p>
              <p><SentimentBadge s={view.sentiment} /> <span className="ml-2 text-muted-foreground">confiança {formatPct(view.confidence)} · {formatDate(view.created_at)}</span></p>
              <div><b>Resumo:</b> {view.summary ?? "—"}</div>
              <div><b>Palavras relevantes:</b> {view.analysis_keywords.map((k) => k.keyword).join(", ") || "—"}</div>
              <div><b>Entidades:</b> {view.analysis_entities.map((e) => `${e.entity_text} (${e.entity_type})`).join(", ") || "—"}</div>
              {Array.isArray(view.aspects) && view.aspects.length > 0 && (
                <div><b>Aspectos:</b> {(view.aspects as { aspect: string; sentiment: string | null }[]).map((a) => `${a.aspect}${a.sentiment ? ` (${a.sentiment})` : ""}`).join(", ")}</div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir esta análise?</AlertDialogTitle>
            <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
