import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Factory, Lock, BadgeCheck, UserPlus, LogIn, Eye, EyeOff, ChevronRight, ShieldCheck, Loader2, KeyRound } from "lucide-react";
import { fazerLogin, cadastrarUsuario, redefinirSenhaDireta, type Cargo } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VW Gestao Operacional - Acesso" },
      { name: "description", content: "Plataforma de Controle de Presenca Operacional VW." },
    ],
  }),
  component: HomePage,
});

function VwLogoSvg({ size = 42, color = "#FFFFFF" }: { size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="47" stroke={color} strokeWidth="4" />
      <circle cx="50" cy="50" r="41.5" stroke={color} strokeWidth="2" opacity="0.6" />
      {/* V superior */}
      <path d="M34 28 L45.5 54 L50 43 L54.5 54 L66 28" stroke={color} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* W inferior */}
      <path d="M26 44 L41.5 80 L50 61 L58.5 80 L74 44" stroke={color} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type Aba = "login" | "cadastro" | "recuperar";

const CARGOS: Cargo[] = ["Líder", "Monitor", "Operador"];

function HomePage() {
  const navigate = useNavigate();
  const [aba, setAba] = useState<Aba>("login");

  // Login
  const [loginReg, setLoginReg] = useState("");
  const [loginSenha, setLoginSenha] = useState("");
  const [loginErro, setLoginErro] = useState("");
  const [showLoginPwd, setShowLoginPwd] = useState(false);
  const [isLoadingLogin, setIsLoadingLogin] = useState(false);

  // Cadastro
  const [cadNome, setCadNome] = useState("");
  const [cadReg, setCadReg] = useState("");
  const [cadCargo, setCadCargo] = useState<Cargo>("Operador");
  const [cadSenha, setCadSenha] = useState("");
  const [cadConfirm, setCadConfirm] = useState("");
  const [cadErro, setCadErro] = useState("");
  const [cadSucesso, setCadSucesso] = useState("");
  const [showCadPwd, setShowCadPwd] = useState(false);
  const [isLoadingCad, setIsLoadingCad] = useState(false);

  // Redefinição de Senha
  const [recReg, setRecReg] = useState("");
  const [recNovaSenha, setRecNovaSenha] = useState("");
  const [recConfirmNovaSenha, setRecConfirmNovaSenha] = useState("");
  const [recMsg, setRecMsg] = useState("");
  const [recErro, setRecErro] = useState("");
  const [isLoadingRec, setIsLoadingRec] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginErro("");

    const regLimpo = loginReg.trim();
    if (!/^\d{7}$/.test(regLimpo)) {
      setLoginErro("O número de registro (matrícula) deve conter exatamente 7 dígitos numéricos (ex: 0263552).");
      return;
    }

    setIsLoadingLogin(true);
    try {
      const user = await fazerLogin(regLimpo, loginSenha);
      if (!user) {
        setLoginErro("Registro ou senha inválidos. Verifique suas credenciais e tente novamente.");
        return;
      }
      navigate({ to: "/painel" });
    } catch {
      setLoginErro("Erro inesperado ao realizar login. Tente novamente.");
    } finally {
      setIsLoadingLogin(false);
    }
  }

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault();
    setCadErro("");
    setCadSucesso("");

    const regLimpo = cadReg.trim();
    if (!/^\d{7}$/.test(regLimpo)) {
      setCadErro("O número de registro (matrícula) deve conter exatamente 7 dígitos numéricos (ex: 0263552).");
      return;
    }

    if (cadSenha !== cadConfirm) {
      setCadErro("As senhas não coincidem.");
      return;
    }
    if (cadSenha.length < 4) {
      setCadErro("A senha deve ter pelo menos 4 caracteres.");
      return;
    }

    setIsLoadingCad(true);
    try {
      const resultado = await cadastrarUsuario(cadNome.trim(), regLimpo, cadCargo, cadSenha);
      if (!resultado.ok) {
        setCadErro(resultado.erro ?? "Erro ao cadastrar.");
        return;
      }
      setCadSucesso("Cadastro realizado com sucesso! Redirecionando para o login...");
      setLoginReg(regLimpo);
      setCadNome("");
      setCadReg("");
      setCadSenha("");
      setCadConfirm("");
      setTimeout(() => setAba("login"), 1400);
    } catch {
      setCadErro("Erro ao cadastrar no sistema. Tente novamente.");
    } finally {
      setIsLoadingCad(false);
    }
  }

  async function handleRecuperar(e: React.FormEvent) {
    e.preventDefault();
    setRecErro("");
    setRecMsg("");

    const regLimpo = recReg.trim();
    if (!/^\d{7}$/.test(regLimpo)) {
      setRecErro("Informe um número de registro (matrícula) válido com 7 dígitos numéricos.");
      return;
    }

    if (recNovaSenha !== recConfirmNovaSenha) {
      setRecErro("A confirmação da nova senha não coincide.");
      return;
    }

    if (recNovaSenha.length < 4) {
      setRecErro("A nova senha deve ter pelo menos 4 caracteres.");
      return;
    }

    setIsLoadingRec(true);
    try {
      const result = await redefinirSenhaDireta(regLimpo, recNovaSenha);
      if (!result.ok) {
        setRecErro(result.mensagem);
      } else {
        setRecMsg(result.mensagem);
        setLoginReg(regLimpo);
        setRecReg("");
        setRecNovaSenha("");
        setRecConfirmNovaSenha("");
        setTimeout(() => setAba("login"), 1600);
      }
    } catch {
      setRecErro("Erro inesperado ao redefinir a senha. Tente novamente.");
    } finally {
      setIsLoadingRec(false);
    }
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
            width: "80px",
            height: "80px",
            background: "radial-gradient(circle at 35% 35%, #1E3A8A 0%, #0F172A 70%, #020617 100%)",
            border: "1.5px solid rgba(59, 130, 246, 0.45)",
            boxShadow: "0 0 28px rgba(37, 99, 235, 0.35), inset 0 1px 2px rgba(255,255,255,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <VwLogoSvg size={54} color="#FFFFFF" />
        </div>
        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              color: "#FFFFFF",
              margin: 0,
            }}
          >
            VW SmartFlow
          </h1>
          <p
            style={{
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              color: "#60A5FA",
              margin: "4px 0 0",
            }}
          >
            Fahrwerk — Gestão Operacional
          </p>
        </div>
      </div>

      {/* Card Principal */}
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          borderRadius: "20px",
          border: "1px solid rgba(255,255,255,0.1)",
          backgroundColor: "#0D1829",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.7)",
          overflow: "hidden",
        }}
      >
        {/* Abas */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            backgroundColor: "rgba(0,0,0,0.2)",
          }}
        >
          {(["login", "cadastro"] as Aba[]).map((t) => {
            const isAtivo = aba === t || (aba === "recuperar" && t === "login");
            return (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setAba(t);
                  setLoginErro("");
                  setCadErro("");
                  setCadSucesso("");
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
          {/* Aba Login */}
          {aba === "login" && (
            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94A3B8" }}>
                  Nº de Registro (7 dígitos)
                </label>
                <div style={{ position: "relative", width: "100%" }}>
                  <BadgeCheck style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", width: "18px", height: "18px", color: "#64748B" }} />
                  <input
                    id="login-registro"
                    type="text"
                    inputMode="numeric"
                    maxLength={7}
                    required
                    value={loginReg}
                    onChange={(e) => setLoginReg(e.target.value.replace(/\D/g, "").slice(0, 7))}
                    placeholder="Ex: 0263552"
                    autoComplete="username"
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
                    onClick={() => {
                      setAba("recuperar");
                      setRecReg(loginReg);
                    }}
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
                disabled={isLoadingLogin}
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
                  cursor: isLoadingLogin ? "not-allowed" : "pointer",
                  opacity: isLoadingLogin ? 0.75 : 1,
                  background: "linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)",
                  boxShadow: "0 10px 20px -3px rgba(37,99,235,0.4)",
                  transition: "all 0.2s ease",
                }}
              >
                {isLoadingLogin ? (
                  <>
                    <Loader2 style={{ width: "18px", height: "18px", animation: "spin 1s linear infinite" }} /> Autenticando...
                  </>
                ) : (
                  <>
                    Entrar no Painel <ChevronRight style={{ width: "18px", height: "18px" }} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Aba Cadastro */}
          {aba === "cadastro" && (
            <form onSubmit={handleCadastro} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94A3B8" }}>Nome Completo</label>
                <input id="cad-nome" type="text" required value={cadNome} onChange={(e) => setCadNome(e.target.value)} placeholder="Ex: Marcelo Silva" style={{ width: "100%", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.04)", padding: "12px 14px", color: "#FFFFFF", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94A3B8" }}>
                    Nº Registro (7 dígitos)
                  </label>
                  <input
                    id="cad-registro"
                    type="text"
                    inputMode="numeric"
                    maxLength={7}
                    required
                    value={cadReg}
                    onChange={(e) => setCadReg(e.target.value.replace(/\D/g, "").slice(0, 7))}
                    placeholder="Ex: 0263552"
                    autoComplete="off"
                    style={{ width: "100%", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.04)", padding: "12px 14px", color: "#FFFFFF", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                  />
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

              <button
                id="btn-cadastrar"
                type="submit"
                disabled={isLoadingCad}
                style={{
                  display: "flex",
                  width: "100%",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  borderRadius: "12px",
                  padding: "14px",
                  fontSize: "13px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "#FFFFFF",
                  border: "none",
                  cursor: isLoadingCad ? "not-allowed" : "pointer",
                  opacity: isLoadingCad ? 0.75 : 1,
                  background: "linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)",
                  boxShadow: "0 10px 20px -3px rgba(37,99,235,0.4)",
                  transition: "all 0.2s ease",
                }}
              >
                {isLoadingCad ? (
                  <>
                    <Loader2 style={{ width: "18px", height: "18px", animation: "spin 1s linear infinite" }} /> Cadastrando...
                  </>
                ) : (
                  <>
                    <ShieldCheck style={{ width: "18px", height: "18px" }} /> Criar Cadastro
                  </>
                )}
              </button>
            </form>
          )}

          {/* Aba Redefinição de Senha */}
          {aba === "recuperar" && (
            <form onSubmit={handleRecuperar} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ textAlign: "center" }}>
                <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#FFFFFF", margin: 0 }}>Redefinir Senha</h2>
                <p style={{ fontSize: "12px", color: "#94A3B8", marginTop: "4px" }}>Informe sua matrícula e defina uma nova senha de acesso.</p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94A3B8" }}>Nº Registro (7 dígitos)</label>
                <input
                  id="rec-registro"
                  type="text"
                  inputMode="numeric"
                  maxLength={7}
                  required
                  value={recReg}
                  onChange={(e) => setRecReg(e.target.value.replace(/\D/g, "").slice(0, 7))}
                  placeholder="Ex: 0263552"
                  style={{ width: "100%", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.04)", padding: "12px 14px", color: "#FFFFFF", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94A3B8" }}>Nova Senha</label>
                  <input
                    id="rec-senha"
                    type="password"
                    required
                    value={recNovaSenha}
                    onChange={(e) => setRecNovaSenha(e.target.value)}
                    placeholder="••••••••"
                    style={{ width: "100%", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.04)", padding: "12px 14px", color: "#FFFFFF", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94A3B8" }}>Confirmar Senha</label>
                  <input
                    id="rec-confirma"
                    type="password"
                    required
                    value={recConfirmNovaSenha}
                    onChange={(e) => setRecConfirmNovaSenha(e.target.value)}
                    placeholder="••••••••"
                    style={{ width: "100%", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.04)", padding: "12px 14px", color: "#FFFFFF", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              {recErro && <div style={{ borderRadius: "12px", border: "1px solid rgba(239,68,68,0.3)", backgroundColor: "rgba(239,68,68,0.1)", padding: "10px 14px", fontSize: "12px", color: "#F87171" }}>{recErro}</div>}
              {recMsg && <div style={{ borderRadius: "12px", border: "1px solid rgba(34,197,94,0.3)", backgroundColor: "rgba(34,197,94,0.1)", padding: "10px 14px", fontSize: "12px", color: "#4ADE80", display: "flex", alignItems: "center", gap: "8px" }}><ShieldCheck style={{ width: "16px", height: "16px" }} /> {recMsg}</div>}

              <button
                type="submit"
                disabled={isLoadingRec}
                style={{
                  display: "flex",
                  width: "100%",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  borderRadius: "12px",
                  padding: "14px",
                  fontSize: "13px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "#FFFFFF",
                  border: "none",
                  cursor: isLoadingRec ? "not-allowed" : "pointer",
                  opacity: isLoadingRec ? 0.75 : 1,
                  background: "linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)",
                  boxShadow: "0 10px 20px -3px rgba(37,99,235,0.4)",
                  transition: "all 0.2s ease",
                }}
              >
                {isLoadingRec ? (
                  <>
                    <Loader2 style={{ width: "18px", height: "18px", animation: "spin 1s linear infinite" }} /> Atualizando...
                  </>
                ) : (
                  <>
                    <KeyRound style={{ width: "16px", height: "16px" }} /> Salvar Nova Senha
                  </>
                )}
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