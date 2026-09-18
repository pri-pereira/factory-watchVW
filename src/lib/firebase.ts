// ─────────────────────────────────────────────────────────
// firebase.ts — Configuração compartilhada do Firebase
// Mesma instância usada pelo smartflow.html
// ─────────────────────────────────────────────────────────
import { initializeApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBYcb-JdZ-KX_eakIXKAUSE-oKj1woE0Hk",
  authDomain: "vw-smartflow.firebaseapp.com",
  databaseURL: "https://vw-smartflow-default-rtdb.firebaseio.com",
  projectId: "vw-smartflow",
  storageBucket: "vw-smartflow.firebasestorage.app",
  messagingSenderId: "266553699370",
  appId: "1:266553699370:web:562d10e9d22329c02ee753",
};

// Evita inicializar múltiplas instâncias no hot reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getDatabase(app);
export const auth = getAuth(app);

// Autentica anonimamente para ter acesso ao Realtime Database
// (as regras do Firebase exigem auth, o smartflow.html usa o SDK compat
// que faz isso implicitamente; aqui fazemos explicitamente).
let _authReady = false;
export const authReady: Promise<void> = new Promise((resolve) => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      _authReady = true;
      resolve();
    } else if (!_authReady) {
      signInAnonymously(auth).catch((err) => {
        console.warn("[firebase] signInAnonymously falhou:", err.code);
        resolve(); // resolve mesmo assim para não bloquear indefinidamente
      });
    }
  });
});

// Chave que será usada tanto no Painel quanto no SmartFlow
// Prefixo "vw_" garante que o interceptor do smartflow.html propague
// automaticamente para outros clientes via Firebase.
export const OPERADORES_FB_KEY = "vw_sf_operadores_estado";

