// ─────────────────────────────────────────────────────────
// firebase.ts — Configuração compartilhada do Firebase
// Mesma instância usada pelo smartflow.html
// ─────────────────────────────────────────────────────────
import { initializeApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAJCgFSVEPTyydDAMc5QbBPnSBq2cWohHc",
  authDomain: "fahrwerk-smartflow.firebaseapp.com",
  databaseURL: "https://fahrwerk-smartflow-default-rtdb.firebaseio.com",
  projectId: "fahrwerk-smartflow",
  storageBucket: "fahrwerk-smartflow.firebasestorage.app",
  messagingSenderId: "1084077814941",
  appId: "1:1084077814941:web:65242c953608de5ddad074",
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

