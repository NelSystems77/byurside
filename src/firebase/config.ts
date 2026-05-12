import { initializeApp } from "firebase/app";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore"; // 👈 Cambiamos getFirestore por initializeFirestore
import { getAuth } from "firebase/auth";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBELkZg65Fhxn16EC-HXduhcqaKiNuvcjg",
  authDomain: "byurside-f671b.firebaseapp.com",
  projectId: "byurside-f671b",
  storageBucket: "byurside-f671b.firebasestorage.app",
  messagingSenderId: "357066030641",
  appId: "1:357066030641:web:9110b0dae3d80baec0df10"
};

// 1. Inicializamos la App de Firebase
const app = initializeApp(firebaseConfig);

// 2. Inicializamos Firestore con el Blindaje Offline (Nivel 2)
// Esto permite que la app funcione 100% sin internet para datos ya cargados
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ 
    tabManager: persistentMultipleTabManager() 
  })
});

// 3. Otros servicios (se mantienen igual)
export const auth = getAuth(app);
export const messaging = getMessaging(app);