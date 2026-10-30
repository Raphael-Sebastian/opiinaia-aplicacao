import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/opina/Logo";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Redefinir senha — OpinaIA" },
      { name: "description", content: "Defina uma nova senha para sua conta OpinaIA." },
      { property: "og:title", content: "Redefinir senha — OpinaIA" },
      { property: "og:description", content: "Defina uma nova senha para sua conta OpinaIA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (pw.length < 6) return toast.error("A senha deve ter pelo menos 6 caracteres.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Senha atualizada!");
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4">
        <Logo />
        <h1 className="text-2xl font-semibold">Nova senha</h1>
        <div className="space-y-1.5"><Label htmlFor="pw">Nova senha</Label><Input id="pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
        <Button className="w-full" disabled={busy}>Salvar nova senha</Button>
      </form>
    </div>
  );
}
