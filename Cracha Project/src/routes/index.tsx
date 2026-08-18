import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Factory, Lock, BadgeCheck, UserPlus, LogIn, Eye, EyeOff, ChevronRight, ShieldCheck } from "lucide-react";
import { fazerLogin, cadastrarUsuario, type Cargo } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SmartAndon - Acesso" },
      { name: "description", content: "Acesso a Plataforma SmartAndon." },
    ],
  }),
  component: HomePage,
});

type Aba = "login" | "cadastro";
const CARGOS: Cargo[] = ["Líder", "Monitor", "Operador"];

function HomePage() {
  const navigate = useNavigate();
  const [aba, setAba] = useState<Aba>("login");
  
  // Login
  const [loginReg, setLoginReg] = useState("");
  const [loginSenha, setLoginSenha] = useState("");
  const [loginErro, setLoginErro] = useState("");
  const [showLoginPwd, setShowLoginPwd] = useState(false);
  
  // Cadastro
  const [cadNome, setCadNome] = useState("");
  const [cadReg, setCadReg] = useState("");
  const [cadCargo, setCadCargo] = useState<Cargo>("Operador");
  const [cadSenha, setCadSenha] = useState("");
  const [cadConfirm, setCadConfirm] = useState("");
  const [cadErro, setCadErro] = useState("");
  const [cadSucesso, setCadSucesso] = useState("");
  const [showCadPwd, setShowCadPwd] = useState(false);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginErro("");
    const user = fazerLogin(loginReg.trim(), loginSenha);
    if (!user) { setLoginErro("Registro ou senha invalidos. Verifique e tente novamente."); return; }
    navigate({ to: "/painel" });
  }

  function handleCadastro(e: React.FormEvent) {
    e.preventDefault();
    setCadErro(""); setCadSucesso("");
    if (cadSenha !== cadConfirm) { setCadErro("As senhas nao coincidem."); return; }
    if (cadSenha.length < 4) { setCadErro("A senha deve ter pelo menos 4 caracteres."); return; }
    const resultado = cadastrarUsuario(cadNome.trim(), cadReg.trim(), cadCargo, cadSenha);
    if (!resultado.ok) { setCadErro(resultado.erro ?? "Erro ao cadastrar."); return; }
    setCadSucesso("Cadastro realizado! Faca login para continuar.");
    setCadNome(""); setCadReg(""); setCadSenha(""); setCadConfirm("");
    setTimeout(() => setAba("login"), 1800);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
          <Factory className="size-8" strokeWidth={1.75} />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">SmartAndon</h1>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mt-1">Gestao Operacional</p>
        </div>
      </div>

      <div className="w-full max-w-md rounded-2xl overflow-hidden border border-border bg-card shadow-lg">
        <div className="grid grid-cols-2 border-b border-border">
          {(["login", "cadastro"] as Aba[]).map((t) => (
            <button key={t} onClick={() => { setAba(t); setLoginErro(""); setCadErro(""); setCadSucesso(""); }}
              className={`flex items-center justify-center gap-2 py-4 text-sm font-semibold uppercase tracking-wider transition-colors ${
                aba === t ? "text-primary border-b-2 border-primary bg-primary/5" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}>
              {t === "login" ? <LogIn className="size-4" /> : <UserPlus className="size-4" />}
              {t === "login" ? "Entrar" : "Cadastrar"}
            </button>
          ))}
        </div>

        <div className="p-6 sm:p-8">
          {aba === "login" && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">N de Registro</label>
                <div className="relative">
                  <BadgeCheck className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                  <input id="login-registro" type="text" required value={loginReg} onChange={(e) => setLoginReg(e.target.value)} placeholder="Ex: 12345" 
                    className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                  <input id="login-senha" type={showLoginPwd ? "text" : "password"} required value={loginSenha} onChange={(e) => setLoginSenha(e.target.value)} placeholder="..." 
                    className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-10 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all" />
                  <button type="button" onClick={() => setShowLoginPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showLoginPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
              {loginErro && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive font-medium">
                  {loginErro}
                </div>
              )}
              <button id="btn-entrar" type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98]">
                Entrar no Painel <ChevronRight className="size-5" />
              </button>
            </form>
          )}

          {aba === "cadastro" && (
            <form onSubmit={handleCadastro} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Nome Completo</label>
                <input id="cad-nome" type="text" required value={cadNome} onChange={(e) => setCadNome(e.target.value)} placeholder="Ex: Marcelo Silva" 
                  className="w-full rounded-xl border border-input bg-background py-2.5 px-3.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">N de Registro</label>
                  <input id="cad-registro" type="text" required value={cadReg} onChange={(e) => setCadReg(e.target.value)} placeholder="Ex: 12345" 
                    className="w-full rounded-xl border border-input bg-background py-2.5 px-3.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Cargo</label>
                  <select id="cad-cargo" value={cadCargo} onChange={(e) => setCadCargo(e.target.value as Cargo)} 
                    className="w-full rounded-xl border border-input bg-background py-2.5 px-3.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all cursor-pointer">
                    {CARGOS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Senha</label>
                  <div className="relative">
                    <input id="cad-senha" type={showCadPwd ? "text" : "password"} required value={cadSenha} onChange={(e) => setCadSenha(e.target.value)} placeholder="..." 
                      className="w-full rounded-xl border border-input bg-background py-2.5 px-3.5 pr-10 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all" />
                    <button type="button" onClick={() => setShowCadPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showCadPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Confirmar Senha</label>
                  <input id="cad-confirma" type="password" required value={cadConfirm} onChange={(e) => setCadConfirm(e.target.value)} placeholder="..." 
                    className="w-full rounded-xl border border-input bg-background py-2.5 px-3.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all" />
                </div>
              </div>
              {cadErro && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive font-medium">
                  {cadErro}
                </div>
              )}
              {cadSucesso && (
                <div className="rounded-lg border border-success/20 bg-success/10 px-4 py-3 text-sm text-success font-medium flex items-center gap-2">
                  <ShieldCheck className="size-4 shrink-0" /> {cadSucesso}
                </div>
              )}
              <button id="btn-cadastrar" type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98]">
                <ShieldCheck className="size-5" /> Criar Cadastro
              </button>
            </form>
          )}
        </div>
      </div>
      <p className="mt-8 text-xs text-muted-foreground">Plataforma SmartAndon &copy; {new Date().getFullYear()}</p>
    </div>
  );
}