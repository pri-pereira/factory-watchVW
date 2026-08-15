import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Factory, Mail, Lock, User, ShieldCheck, ArrowRight, LogIn } from "lucide-react";

export const Route = createFileRoute("/auth/register")({
  component: RegisterPage,
});

function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "monitor",
    password: "",
  });
  const navigate = useNavigate();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Register with:", formData);
    navigate({ to: "/auth/login" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 font-sans">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-grid size-16 place-items-center rounded-2xl bg-primary text-primary-foreground mb-4 shadow-lg shadow-primary/20">
            <Factory className="size-8" strokeWidth={1.75} />
          </div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-foreground">
            Novo Cadastro
          </h1>
          <p className="text-muted-foreground mt-2">
            Solicite acesso à gestão de equipe
          </p>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-xl overflow-hidden">
          <div className="p-6 sm:p-8">
            <form onSubmit={handleRegister} className="space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1"
                >
                  Nome Completo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground/50" />
                  <input
                    id="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome do Líder ou Monitor"
                    className="w-full bg-muted/50 border border-border rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1"
                >
                  E-mail Corporativo
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground/50" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="exemplo@empresa.com"
                    className="w-full bg-muted/50 border border-border rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  Função Operacional
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: "monitor" })}
                    className={`py-3 px-4 rounded-xl border text-sm font-bold uppercase tracking-tight transition-all ${
                      formData.role === "monitor"
                        ? "bg-primary border-primary text-primary-foreground"
                        : "bg-muted/50 border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    Monitor
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: "lider" })}
                    className={`py-3 px-4 rounded-xl border text-sm font-bold uppercase tracking-tight transition-all ${
                      formData.role === "lider"
                        ? "bg-primary border-primary text-primary-foreground"
                        : "bg-muted/50 border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    Líder
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1"
                >
                  Senha de Acesso
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground/50" />
                  <input
                    id="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-muted/50 border border-border rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground font-bold uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 group mt-2"
              >
                Solicitar Cadastro
                <ShieldCheck className="size-5" />
              </button>
            </form>
          </div>

          <div className="bg-muted/30 border-t border-border p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Já possui uma conta?{" "}
              <Link
                to="/auth/login"
                className="font-bold text-primary hover:underline uppercase tracking-tight flex inline-flex items-center gap-1"
              >
                <LogIn className="size-4" /> Fazer Login
              </Link>
            </p>
          </div>
        </div>
        
        <p className="text-center text-[0.65rem] text-muted-foreground/50 mt-8 uppercase tracking-[0.2em]">
          Plataforma de Gestão Industrial &copy; 2026
        </p>
      </div>
    </div>
  );
}
