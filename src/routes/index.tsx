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
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 font-sans"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        backgroundColor: "#070E1E",
        color: "#F8FAFC",
        fontFamily: "'Barlow', system-ui, sans-serif",
      }}
    >
      {/* Header com Logo VW */}
      <div className="mb-8 flex flex-col items-center gap-3" style={{ marginBottom: "32px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
        <div
          className="flex items-center justify-center rounded-2xl overflow-hidden shadow-xl"
          style={{
            width: "64px",
            height: "64px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "16px",
            backgroundColor: "#001E50",
            border: "1px solid rgba(255,255,255,0.15)",
            boxShadow: "0 10px 25px -5px rgba(0,30,80,0.5)",
            padding: "8px",
          }}
        >
          <img
            src="/logo.png"
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.src.endsWith("vw-logo.jpg")) target.src = "/vw-logo.jpg";
            }}
            alt="Logo VW"
            width={48}
            height={48}
            style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
          />
        </div>
        <div className="text-center" style={{ textAlign: "center" }}>
          <h1
            className="font-display text-4xl font-bold uppercase tracking-widest"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "36px",
              fontWeight: 800,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              margin: 0,
              color: "#FFFFFF",
            }}
          >
            VW <span style={{ color: "#3B82F6" }}>Smart</span>Flow
          </h1>
          <p
            className="text-xs font-semibold uppercase tracking-[0.2em]"
            style={{
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#94A3B8",
              marginTop: "4px",
              margin: "4px 0 0 0",
            }}
          >
            Gestão Operacional
          </p>
        </div>
      </div>

      {/* Card de Login */}
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{
          width: "100%",
          maxWidth: "420px",
          borderRadius: "20px",
          overflow: "hidden",
          backgroundColor: "#0F172A",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6)",
        }}
      >
        {/* Abas */}
        <div
          className="grid grid-cols-2"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          {(["login", "cadastro"] as Aba[]).map((t) => {
            const isAtivo = aba === t || (aba === "recuperar" && t === "login");
            return (
              <button
                key={t}
                onClick={() => {
                  setAba(t);
                  setLoginErro("");
                  setCadErro("");
                  setCadSucesso("");
                  setRecErro("");
                  setRecMsg("");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "16px 0",
                  fontSize: "13px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  cursor: "pointer",
                  border: "none",
                  outline: "none",
                  transition: "all 0.2s ease",
                  backgroundColor: isAtivo ? "rgba(255,255,255,0.06)" : "transparent",
                  color: isAtivo ? "#FFFFFF" : "#64748B",
                  borderBottom: isAtivo ? "2px solid #3B82F6" : "2px solid transparent",
                }}
              >
                {t === "login" ? <LogIn style={{ width: "16px", height: "16px" }} /> : <UserPlus style={{ width: "16px", height: "16px" }} />}
                {t === "login" ? "Entrar" : "Cadastrar"}
              </button>
            );
          })}
        </div>

        <div style={{ padding: "28px" }}>
          {aba === "login" && (
            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94A3B8" }}>
                  Nº de Registro ou E-mail
                </label>
                <div style={{ position: "relative", width: "100%" }}>
                  <BadgeCheck style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", width: "18px", height: "18px", color: "#64748B" }} />
                  <input
                    id="login-registro"
                    type="text"
                    required
                    value={loginReg}
                    onChange={(e) => setLoginReg(e.target.value)}
                    placeholder="Ex: 0263552 ou email@vw.com"
                    autoComplete="off"
                    style={{
                      width: "100%",
                      borderRadius: "12px",
                      border: "1px solid rgba(255,255,255,0.12)",
                      backgroundColor: "rgba(255,255,255,0.04)",
                      padding: "13px 16px 13px 44px",
                      color: "#FFFFFF",
                      fontSize: "14px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94A3B8" }}>
                    Senha
                  </label>
                  <button
                    type="button"
                    onClick={() => setAba("recuperar")}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#60A5FA" }}
                  >
                    Esqueci a senha
                  </button>
                </div>
                <div style={{ position: "relative", width: "100%" }}>
                  <Lock style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", width: "18px", height: "18px", color: "#64748B" }} />
                  <input
                    id="login-senha"
                    type={showLoginPwd ? "text" : "password"}
                    required
                    value={loginSenha}
                    onChange={(e) => setLoginSenha(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      width: "100%",
                      borderRadius: "12px",
                      border: "1px solid rgba(255,255,255,0.12)",
                      backgroundColor: "rgba(255,255,255,0.04)",
                      padding: "13px 44px 13px 44px",
                      color: "#FFFFFF",
                      fontSize: "14px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPwd((v) => !v)}
                    style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#64748B", cursor: "pointer", display: "flex" }}
                  >
                    {showLoginPwd ? <EyeOff style={{ width: "18px", height: "18px" }} /> : <Eye style={{ width: "18px", height: "18px" }} />}
                  </button>
                </div>
              </div>

              {loginErro && (
                <div style={{ borderRadius: "12px", border: "1px solid rgba(239,68,68,0.3)", backgroundColor: "rgba(239,68,68,0.1)", padding: "12px 16px", fontSize: "13px", color: "#F87171" }}>
                  {loginErro}
                </div>
              )}

              <button
                id="btn-entrar"
                type="submit"
                style={{
                  display: "flex",
                  width: "100%",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  borderRadius: "12px",
                  padding: "15px",
                  fontSize: "13px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: "#FFFFFF",
                  border: "none",
                  cursor: "pointer",
                  background: "linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)",
                  boxShadow: "0 10px 20px -3px rgba(37,99,235,0.4)",
                  transition: "transform 0.15s ease",
                }}
              >
                Entrar no Painel <ChevronRight style={{ width: "18px", height: "18px" }} />
              </button>
            </form>
          )}

          {aba === "cadastro" && (
            <form onSubmit={handleCadastro} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94A3B8" }}>Nome Completo</label>
                  <input id="cad-nome" type="text" required value={cadNome} onChange={(e) => setCadNome(e.target.value)} placeholder="Ex: Marcelo Silva" style={{ width: "100%", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.04)", padding: "12px 14px", color: "#FFFFFF", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94A3B8" }}>E-mail</label>
                  <input id="cad-email" type="email" required value={cadEmail} onChange={(e) => setCadEmail(e.target.value)} placeholder="email@vw.com" style={{ width: "100%", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.04)", padding: "12px 14px", color: "#FFFFFF", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94A3B8" }}>Nº Registro</label>
                  <input id="cad-registro" type="text" required value={cadReg} onChange={(e) => setCadReg(e.target.value)} placeholder="Ex: 0263552" autoComplete="off" style={{ width: "100%", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.04)", padding: "12px 14px", color: "#FFFFFF", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94A3B8" }}>Cargo</label>
                  <select id="cad-cargo" value={cadCargo} onChange={(e) => setCadCargo(e.target.value as Cargo)} style={{ width: "100%", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.12)", backgroundColor: "#1E293B", padding: "12px 14px", color: "#FFFFFF", fontSize: "13px", outline: "none", boxSizing: "border-box", cursor: "pointer" }}>
                    {CARGOS.map((c) => <option key={c} value={c} style={{ backgroundColor: "#1E293B", color: "#FFFFFF" }}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94A3B8" }}>Senha</label>
                  <input id="cad-senha" type={showCadPwd ? "text" : "password"} required value={cadSenha} onChange={(e) => setCadSenha(e.target.value)} placeholder="••••••••" style={{ width: "100%", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.04)", padding: "12px 14px", color: "#FFFFFF", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94A3B8" }}>Confirmar Senha</label>
                  <input id="cad-confirma" type="password" required value={cadConfirm} onChange={(e) => setCadConfirm(e.target.value)} placeholder="••••••••" style={{ width: "100%", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.04)", padding: "12px 14px", color: "#FFFFFF", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
                </div>
              </div>

              {cadErro && <div style={{ borderRadius: "12px", border: "1px solid rgba(239,68,68,0.3)", backgroundColor: "rgba(239,68,68,0.1)", padding: "10px 14px", fontSize: "12px", color: "#F87171" }}>{cadErro}</div>}
              {cadSucesso && <div style={{ borderRadius: "12px", border: "1px solid rgba(34,197,94,0.3)", backgroundColor: "rgba(34,197,94,0.1)", padding: "10px 14px", fontSize: "12px", color: "#4ADE80", display: "flex", alignItems: "center", gap: "8px" }}><ShieldCheck style={{ width: "16px", height: "16px" }} /> {cadSucesso}</div>}

              <button id="btn-cadastrar" type="submit" style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "center", gap: "8px", borderRadius: "12px", padding: "14px", fontSize: "13px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#FFFFFF", border: "none", cursor: "pointer", background: "linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)", boxShadow: "0 10px 20px -3px rgba(37,99,235,0.4)" }}>
                <ShieldCheck style={{ width: "18px", height: "18px" }} /> Criar Cadastro
              </button>
            </form>
          )}

          {aba === "recuperar" && (
            <form onSubmit={handleRecuperar} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div style={{ textAlign: "center" }}>
                <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#FFFFFF", margin: 0 }}>Recuperar Senha</h2>
                <p style={{ fontSize: "12px", color: "#94A3B8", marginTop: "4px" }}>Digite seu e-mail cadastrado para receber as instruções.</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94A3B8" }}>E-mail</label>
                <input id="rec-email" type="email" required value={recEmail} onChange={(e) => setRecEmail(e.target.value)} placeholder="Ex: email@vw.com" style={{ width: "100%", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.04)", padding: "12px 14px", color: "#FFFFFF", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
              </div>
              {recErro && <div style={{ borderRadius: "12px", border: "1px solid rgba(239,68,68,0.3)", backgroundColor: "rgba(239,68,68,0.1)", padding: "10px 14px", fontSize: "12px", color: "#F87171" }}>{recErro}</div>}
              {recMsg && <div style={{ borderRadius: "12px", border: "1px solid rgba(34,197,94,0.3)", backgroundColor: "rgba(34,197,94,0.1)", padding: "10px 14px", fontSize: "12px", color: "#4ADE80", display: "flex", alignItems: "center", gap: "8px" }}><ShieldCheck style={{ width: "16px", height: "16px" }} /> {recMsg}</div>}
              <button type="submit" style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "center", gap: "8px", borderRadius: "12px", padding: "14px", fontSize: "13px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#FFFFFF", border: "none", cursor: "pointer", background: "linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)", boxShadow: "0 10px 20px -3px rgba(37,99,235,0.4)" }}>
                Enviar Instruções
              </button>
              <button type="button" onClick={() => setAba("login")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94A3B8" }}>
                Voltar para o Login
              </button>
            </form>
          )}
        </div>
      </div>

      <p style={{ marginTop: "24px", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.2em", color: "#64748B" }}>
        Plataforma de Gestão Industrial VW Group 2026
      </p>
    </div>
  );
}