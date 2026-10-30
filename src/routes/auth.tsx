import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/opina/Logo";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — OpinaIA" },
      { name: "description", content: "Acesse ou crie sua conta na OpinaIA." },
      { property: "og:title", content: "Entrar — OpinaIA" },
      { property: "og:description", content: "Acesse ou crie sua conta na OpinaIA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

type Mode = "login" | "signup" | "forgot";

function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { if (data.user) navigate({ to: "/dashboard" }); });
    const { data } = supabase.auth.onAuthStateChange((e, s) => { if (e === "SIGNED_IN" && s) navigate({ to: "/dashboard" }); });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return toast.error("Informe um e-mail válido.");
    if (mode !== "forgot" && password.length < 6) return toast.error("A senha deve ter pelo menos 6 caracteres.");
    if (mode === "signup" && !nome.trim()) return toast.error("Informe seu nome.");
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password, options: { emailRedirectTo: window.location.origin + "/dashboard", data: { nome } },
        });
        if (error) throw error;
        setNotice("Conta criada! Enviamos um link de confirmação para o seu e-mail.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/reset-password" });
        if (error) throw error;
        setNotice("Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(msg === "Invalid login credentials" ? "E-mail ou senha incorretos." : msg);
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) toast.error("Não foi possível entrar com o Google.");
  }

  const titles = { login: "Entrar na sua conta", signup: "Criar conta", forgot: "Recuperar senha" };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-brand-gradient p-12 text-primary-foreground lg:flex">
        <Logo inverted />
        <div>
          <h2 className="text-4xl font-semibold leading-tight">Transformando opiniões em informações inteligentes.</h2>
          <p className="mt-4 max-w-md opacity-80">Sentimentos, entidades, TF-IDF e aspectos — processados por um motor real de NLP.</p>
        </div>
        <p className="text-sm opacity-60">Projeto acadêmico de Inteligência Artificial</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden"><Logo /></div>
          <h1 className="text-2xl font-semibold">{titles[mode]}</h1>
          {notice ? (
            <div className="mt-6 rounded-xl border bg-accent p-4 text-sm text-accent-foreground">{notice}</div>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              {mode === "signup" && (
                <div className="space-y-1.5"><Label htmlFor="nome">Nome</Label><Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} /></div>
              )}
              <div className="space-y-1.5"><Label htmlFor="email">E-mail</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              {mode !== "forgot" && (
                <div className="space-y-1.5"><Label htmlFor="password">Senha</Label><Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
              )}
              <Button type="submit" className="w-full" disabled={busy}>
                {busy && <Loader2 className="animate-spin" />}
                {mode === "login" ? "Entrar" : mode === "signup" ? "Criar conta" : "Enviar link"}
              </Button>
              {mode !== "forgot" && (
                <Button type="button" variant="outline" className="w-full" onClick={google}>Continuar com Google</Button>
              )}
            </form>
          )}
          <div className="mt-6 space-y-2 text-center text-sm text-muted-foreground">
            {mode === "login" && (
              <>
                <button className="hover:text-foreground" onClick={() => setMode("forgot")}>Esqueci minha senha</button>
                <p>Não tem conta? <button className="font-semibold text-brand-violet" onClick={() => setMode("signup")}>Cadastre-se</button></p>
              </>
            )}
            {mode !== "login" && (
              <button className="font-semibold text-brand-violet" onClick={() => { setMode("login"); setNotice(null); }}>Voltar para o login</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
