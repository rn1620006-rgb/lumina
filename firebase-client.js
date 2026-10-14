/* LUMINA — configuração WEB pública fornecida pelo proprietário.
   Não colocar tokens administrativos, contas de serviço ou segredos neste ficheiro.
   SDK modular Firebase importado pelo CDN oficial para preservar o site estático. */
import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { getDatabase } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js';

export const firebaseConfig = Object.freeze({
  apiKey: "AIzaSyDmfjHQU-CQ18JZawYiiydYwQdLiTMTaSs",
  authDomain: "lumina-a0b15.firebaseapp.com",
  databaseURL: "https://lumina-a0b15-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "lumina-a0b15",
  storageBucket: "lumina-a0b15.firebasestorage.app",
  messagingSenderId: "169205555887",
  appId: "1:169205555887:web:0691ab54b5c16ce2346a5a",
  measurementId: "G-6HC3M36TKB"
});

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const database = getDatabase(firebaseApp);
export const LUMINA_PATH = 'lumina_v1';
// Analytics não é iniciado nesta fase: exige gestão de consentimento e privacidade.
