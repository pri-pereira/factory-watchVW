// ─────────────────────────────────────────────────────────
// useOperadoresSync.ts — Hook de sincronização híbrida
// Estratégia:
//   1. Firebase Realtime DB (quando auth estiver habilitada)
//   2. BroadcastChannel + localStorage (mesma máquina, todas as abas)
//
// O BroadcastChannel garante sync INSTANTÂNEO entre Painel e SmartFlow
// na mesma máquina, sem depender de permissões do Firebase.
// ─────────────────────────────────────────────────────────
import { useEffect, useRef, useState, useCallback } from "react";
import { ref, onValue, set, off } from "firebase/database";
import { db, authReady, OPERADORES_FB_KEY } from "@/lib/firebase";
import { operators, type Operator, type OperatorStatus } from "@/data/operators";

export type OperadorComAuditoria = Operator & {
  alteradoPor?: string;
  alteradoAs?: string;
};

const LS_KEY = "sf_operadores_estado";
// Canal de broadcast para sync instantâneo entre abas (mesma máquina)
const BC_CHANNEL = "vw_smartflow_operadores";

/** Carrega estado inicial: prefere localStorage como cache rápido */
function carregarEstadoInicial(): OperadorComAuditoria[] {
  try {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) return JSON.parse(saved);
  } catch (_) {}
  return operators as OperadorComAuditoria[];
}

export function useOperadoresSync() {
  const [operadores, setOperadores] = useState<OperadorComAuditoria[]>(carregarEstadoInicial);
  const [isOnline, setIsOnline] = useState(false);
  // Ref para evitar eco: quando recebemos dado do Firebase, não re-enviamos
  const applyingRemote = useRef(false);

  // ── BroadcastChannel: sync instantâneo entre abas na mesma máquina ──
  useEffect(() => {
    if (!("BroadcastChannel" in window)) return;
    const bc = new BroadcastChannel(BC_CHANNEL);
    bc.onmessage = (event) => {
      if (event.data?.tipo === "operadores_atualizados") {
        try {
          const remoto: OperadorComAuditoria[] = event.data.payload;
          if (!Array.isArray(remoto) || remoto.length === 0) return;
          applyingRemote.current = true;
          setOperadores(remoto);
          localStorage.setItem(LS_KEY, JSON.stringify(remoto));
          applyingRemote.current = false;
        } catch (_) {}
      }
    };
    return () => bc.close();
  }, []);

  // ── Firebase: sync entre dispositivos diferentes (quando permitido) ──
  useEffect(() => {
    const fbRef = ref(db, `smartflow/dados/${OPERADORES_FB_KEY}`);
    let unsubscribeFn: ReturnType<typeof onValue> | null = null;

    authReady.then(() => {
      unsubscribeFn = onValue(
        fbRef,
        (snap) => {
          const valor = snap.val();
          if (!valor) return;
          try {
            const remoto: OperadorComAuditoria[] = JSON.parse(valor);
            if (!Array.isArray(remoto) || remoto.length === 0) return;
            applyingRemote.current = true;
            setOperadores(remoto);
            localStorage.setItem(LS_KEY, valor);
            applyingRemote.current = false;
          } catch (_) {}
        },
        (error) => {
          // Firebase pode não ter permissão (auth anônima desabilitada)
          // O BroadcastChannel já cobre o caso da mesma máquina
          console.warn("[useOperadoresSync] Firebase indisponível (usando BroadcastChannel):", error.message);
        }
      );
    });

    return () => {
      if (unsubscribeFn) off(fbRef, "value", unsubscribeFn);
    };
  }, []);

  // ── Monitora status de conexão com Firebase ───────────────────────────
  useEffect(() => {
    const connRef = ref(db, ".info/connected");
    let unsubConn: ReturnType<typeof onValue> | null = null;
    authReady.then(() => {
      unsubConn = onValue(connRef, (snap) => {
        setIsOnline(snap.val() === true);
      });
    });
    // Fallback: se Firebase não disponível, considera "online" pelo BroadcastChannel
    const timer = setTimeout(() => {
      setIsOnline(true); // Ao menos o BroadcastChannel está ativo
    }, 3000);
    return () => {
      if (unsubConn) off(connRef, "value", unsubConn);
      clearTimeout(timer);
    };
  }, []);

  // ── Publica mudanças locais (Firebase + BroadcastChannel) ────────────
  const publicarNoFirebase = useCallback((novosOperadores: OperadorComAuditoria[]) => {
    if (applyingRemote.current) return;
    const serializado = JSON.stringify(novosOperadores);
    localStorage.setItem(LS_KEY, serializado);

    // BroadcastChannel: instantâneo para todas as abas na mesma máquina
    if ("BroadcastChannel" in window) {
      try {
        const bc = new BroadcastChannel(BC_CHANNEL);
        bc.postMessage({ tipo: "operadores_atualizados", payload: novosOperadores });
        bc.close();
      } catch (_) {}
    }

    // Firebase: sync entre dispositivos (quando auth anônima estiver habilitada)
    authReady.then(() => {
      set(ref(db, `smartflow/dados/${OPERADORES_FB_KEY}`), serializado).catch(() => {
        // Silencioso — BroadcastChannel já fez o trabalho para esta máquina
      });
    });
  }, []);

  // ── Atualiza status de um operador ───────────────────────────────────
  const atualizarStatus = useCallback(
    (
      id: string,
      novoStatus: OperatorStatus,
      responsavel: string,
      timestamp: string,
      batida?: string
    ) => {
      setOperadores((prev) => {
        const novos = prev.map((op) => {
          if (op.id !== id) return op;
          return {
            ...op,
            status: novoStatus,
            batida: batida ?? op.batida,
            alteradoPor: responsavel,
            alteradoAs: timestamp,
          };
        });
        publicarNoFirebase(novos);
        return novos;
      });
    },
    [publicarNoFirebase]
  );

  // ── Substitui todos os operadores (ex: simularCrachas) ───────────────
  const substituirTodos = useCallback(
    (novos: OperadorComAuditoria[]) => {
      setOperadores(novos);
      publicarNoFirebase(novos);
    },
    [publicarNoFirebase]
  );

  return { operadores, isOnline, atualizarStatus, substituirTodos };
}
