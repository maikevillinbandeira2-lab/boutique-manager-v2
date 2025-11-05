// Importa as funções do Firebase
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuração do seu projeto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAhsYyRH2MJZ9XYdMvIQ2GB6wgwQ0C8J1Q ",
  authDomain: "boutique-manager-login.firebaseapp.com",
  projectId: "boutique-manager-login",
  storageBucket: "boutique-manager-login.firebasestorage.app",
  messagingSenderId: "257759444589",
  appId: "1:257759444589:web:c071249a47dba3dd1b4964"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta os serviços usados no app
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
