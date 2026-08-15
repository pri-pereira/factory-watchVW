import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Factory, Mail, Lock, ArrowRight, UserPlus } from "lucide-react";

export const Route = createFileRoute("/auth/login")({
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, we would authenticate here
    console.log("Login with:", email, password);
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 font-sans">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-grid size-16 place-items-center rounded-2xl bg-primary text-primary-foreground mb-4 shadow-lg shadow-primary/20">
            <Factory className="size-8" strokeWidth={1.75} />
          </div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-foreground">
            Acesso ao Sistema
          </h1>
          <p className="text-muted-foreground mt-2">
            Controle de Presença Operacional
          </p>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-xl overflow-hidden">
          <div className="p-6 sm:p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1"
                >
                  E-mail do Líder/Monitor
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground/50" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="exemplo@empresa.com"
                    className="w-full bg-muted/50 border border-border rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label
                    htmlFor="password"
                    className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
                  >
                    Senha
                  </label>
                  <a
                    href="#"
                    className="text-xs font-bold text-primary hover:underline uppercase tracking-widest"
                  >
                    Esqueceu?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground/50" />
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-muted/50 border border-border rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground font-bold uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 group"
              >
                Entrar no Painel
                <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          </div>

          <div className="bg-muted/30 border-t border-border p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Ainda não tem acesso?{" "}
              <Link
                to="/auth/register"
                className="font-bold text-primary hover:underline uppercase tracking-tight flex inline-flex items-center gap-1"
              >
                <UserPlus className="size-4" /> Soliticar Cadastro
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
