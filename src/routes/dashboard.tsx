import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/Dashboard";
import { getUsuarioLogado } from "@/lib/auth";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard Operacional - VW SmartFlow" },
    ],
  }),
  beforeLoad: () => {
    // If you want to require auth, uncomment this:
    // const usuario = getUsuarioLogado();
    // if (!usuario) throw redirect({ to: "/" });
  },
  component: DashboardPage,
});

function DashboardPage() {
  return <Dashboard />;
}
