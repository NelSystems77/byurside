import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// --- REGISTRO DEL SERVICE WORKER (PWA & OFFLINE) ---
// Esto permite que la app sea instalable y funcione con notificaciones
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
      .then((registration) => {
        console.log('✅ ByUrSide PWA: Registrada con éxito en el alcance:', registration.scope);
      })
      .catch((error) => {
        console.log('❌ ByUrSide PWA: Error al registrar el Service Worker:', error);
      });
  });
}

// 1. Importamos la función que creamos para cargar los datos (opcional)
// import { seedBible } from './firebase/seedBible'

// 2. Ejecutamos la función de carga de datos (solo una vez)
// seedBible();

createRoot(document.getElementById('root')!).render(
  <App />
)