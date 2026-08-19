import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Factory, Lock, BadgeCheck, UserPlus, LogIn, Eye, EyeOff, ChevronRight, ShieldCheck } from "lucide-react";
import { fazerLogin, cadastrarUsuario, recuperarSenha, type Cargo } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VW Gestao Operacional - Acesso" },
      { name: "description", content: "Plataforma de Controle de Presenca Operacional VW." },
    ],
  }),
  component: HomePage,
});

type Aba = "login" | "cadastro" | "recuperar";
const CARGOS: Cargo[] = ["Líder", "Monitor", "Operador"];

function HomePage() {
  const navigate = useNavigate();
  const [aba, setAba] = useState<Aba>("login");
  const [loginReg, setLoginReg] = useState("");
  const [loginSenha, setLoginSenha] = useState("");
  const [loginErro, setLoginErro] = useState("");
  const [showLoginPwd, setShowLoginPwd] = useState(false);
  const [cadNome, setCadNome] = useState("");
  const [cadReg, setCadReg] = useState("");
  const [cadEmail, setCadEmail] = useState("");
  const [cadCargo, setCadCargo] = useState<Cargo>("Operador");
  const [cadSenha, setCadSenha] = useState("");
  const [cadConfirm, setCadConfirm] = useState("");
  const [cadErro, setCadErro] = useState("");
  const [cadSucesso, setCadSucesso] = useState("");
  const [showCadPwd, setShowCadPwd] = useState(false);

  const [recEmail, setRecEmail] = useState("");
  const [recMsg, setRecMsg] = useState("");
  const [recErro, setRecErro] = useState("");

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
    const resultado = cadastrarUsuario(cadNome.trim(), cadReg.trim(), cadEmail.trim(), cadCargo, cadSenha);
    if (!resultado.ok) { setCadErro(resultado.erro ?? "Erro ao cadastrar."); return; }
    setCadSucesso("Cadastro realizado! Faca login para continuar.");
    setCadNome(""); setCadReg(""); setCadEmail(""); setCadSenha(""); setCadConfirm("");
    setTimeout(() => setAba("login"), 1800);
  }

  function handleRecuperar(e: React.FormEvent) {
    e.preventDefault();
    setRecErro(""); setRecMsg("");
    const result = recuperarSenha(recEmail.trim());
    if (!result.ok) setRecErro(result.mensagem);
    else setRecMsg(result.mensagem);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 font-sans bg-white">
      <div className="mb-8 flex flex-col items-center gap-4">
        <div className="flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-2xl overflow-hidden shadow-lg bg-white/5 border border-slate-200/50 transition-all duration-300">
          <img src="/logo.png" alt="Logo VW" className="w-full h-full object-contain" />
        </div>
        <div className="text-center">
          <h1 className="font-display text-4xl font-bold uppercase tracking-widest" style={{ color: "#001E50" }}>VW <span style={{ color: "#3b82f6" }}>Smart</span>Flow</h1>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 mt-1">Gestao Operacional</p>
        </div>
      </div>

      <div className="w-full max-w-md rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#0F172A]/95 backdrop-blur-md">
        <div className="grid grid-cols-2 border-b border-white/10">
          {(["login", "cadastro"] as Aba[]).map((t) => (
            <button key={t} onClick={() => { setAba(t); setLoginErro(""); setCadErro(""); setCadSucesso(""); setRecErro(""); setRecMsg(""); }}
              className={"flex items-center justify-center gap-2 py-4 text-sm font-bold uppercase tracking-widest transition-all " + (aba === t || (aba === "recuperar" && t === "login") ? "text-white border-b-2 border-blue-500 bg-white/5" : "text-slate-400 hover:text-white hover:bg-white/5")}>
              {t === "login" ? <LogIn className="size-4" /> : <UserPlus className="size-4" />}
              {t === "login" ? "Entrar" : "Cadastrar"}
            </button>
          ))}
        </div>

        <div className="p-6 sm:p-8">
          {aba === "login" && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">N de Registro ou E-mail</label>
                <div className="relative">
                  <BadgeCheck className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-500" />
                  <input id="login-registro" type="text" required value={loginReg} onChange={(e) => setLoginReg(e.target.value)} placeholder="Ex: 0263552 ou email@vw.com" autoComplete="off" className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all" />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Senha</label>
                  <button type="button" onClick={() => setAba("recuperar")} className="text-[10px] font-bold uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors">Esqueci a senha</button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-500" />
                  <input id="login-senha" type={showLoginPwd ? "text" : "password"} required value={loginSenha} onChange={(e) => setLoginSenha(e.target.value)} placeholder="..." className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-11 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all" />
                  <button type="button" onClick={() => setShowLoginPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">{showLoginPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
                </div>
              </div>
              {loginErro && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{loginErro}</div>}
              <button id="btn-entrar" type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl py-4 text-sm font-black uppercase tracking-widest text-white transition-all hover:-translate-y-0.5" style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)" }}>
                Entrar no Painel <ChevronRight className="size-5" />
              </button>
            </form>
          )}

          {aba === "cadastro" && (
            <form onSubmit={handleCadastro} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Nome Completo</label>
                  <input id="cad-nome" type="text" required value={cadNome} onChange={(e) => setCadNome(e.target.value)} placeholder="Ex: Marcelo Silva" className="w-full rounded-xl border border-white/10 bg-white/5 py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">E-mail</label>
                  <input id="cad-email" type="email" required value={cadEmail} onChange={(e) => setCadEmail(e.target.value)} placeholder="email@vw.com" className="w-full rounded-xl border border-white/10 bg-white/5 py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">N de Registro</label>
                  <input id="cad-registro" type="text" required value={cadReg} onChange={(e) => setCadReg(e.target.value)} placeholder="Ex: 0263552" autoComplete="off" className="w-full rounded-xl border border-white/10 bg-white/5 py-3 px-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Cargo</label>
                  <select id="cad-cargo" value={cadCargo} onChange={(e) => setCadCargo(e.target.value as Cargo)} className="w-full rounded-xl border border-white/10 bg-slate-800 py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all">
                    {CARGOS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Senha</label>
                  <div className="relative">
                    <input id="cad-senha" type={showCadPwd ? "text" : "password"} required value={cadSenha} onChange={(e) => setCadSenha(e.target.value)} placeholder="..." className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-4 pr-10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all" />
                    <button type="button" onClick={() => setShowCadPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">{showCadPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Confirmar Senha</label>
                  <input id="cad-confirma" type="password" required value={cadConfirm} onChange={(e) => setCadConfirm(e.target.value)} placeholder="..." className="w-full rounded-xl border border-white/10 bg-white/5 py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all" />
                </div>
              </div>
              {cadErro && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{cadErro}</div>}
              {cadSucesso && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-400 flex items-center gap-2"><ShieldCheck className="size-4 shrink-0" /> {cadSucesso}</div>}
              <button id="btn-cadastrar" type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl py-4 text-sm font-black uppercase tracking-widest text-white transition-all hover:-translate-y-0.5" style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)" }}>
                <ShieldCheck className="size-5" /> Criar Cadastro
              </button>
            </form>
          )}

          {aba === "recuperar" && (
            <form onSubmit={handleRecuperar} className="space-y-5">
              <div className="text-center mb-4">
                <h2 className="text-lg font-bold text-white mb-1">Recuperar Senha</h2>
                <p className="text-xs text-slate-400">Digite seu e-mail cadastrado para receber as instruções de recuperação.</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">E-mail</label>
                <input id="rec-email" type="email" required value={recEmail} onChange={(e) => setRecEmail(e.target.value)} placeholder="Ex: email@vw.com" className="w-full rounded-xl border border-white/10 bg-white/5 py-3 px-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all" />
              </div>
              {recErro && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{recErro}</div>}
              {recMsg && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-400 flex items-center gap-2"><ShieldCheck className="size-4 shrink-0" /> {recMsg}</div>}
              <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl py-4 text-sm font-black uppercase tracking-widest text-white transition-all hover:-translate-y-0.5" style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)" }}>
                Enviar Instruções
              </button>
              <button type="button" onClick={() => setAba("login")} className="w-full text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors">
                Voltar para o Login
              </button>
            </form>
          )}
        </div>
      </div>
      <p className="mt-6 text-[0.6rem] uppercase tracking-[0.2em] text-slate-600">Plataforma de Gestao Industrial VW Group 2026</p>
    </div>
  );
}