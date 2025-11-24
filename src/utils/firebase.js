import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// CONFIGURACIÓN DIRECTA (Sin archivo .env por ahora para probar)
const firebaseConfig = {
  apiKey: "AIzaSyAXuri6HlcH1Lp8VBhu_9VdsjBxWNbI9P4",
  authDomain: "app-finanzas-space.firebaseapp.com",
  projectId: "app-finanzas-space",
  storageBucket: "app-finanzas-space.firebasestorage.app",
  messagingSenderId: "695082717308",
  appId: "1:695082717308:web:c0245c9ff8970f98bb79f9"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar servicios
export const auth = getAuth(app);
export const db = getFirestore(app);
export const appId = 'space-finanzas-v10-alerts';