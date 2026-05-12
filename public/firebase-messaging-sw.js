// 1. Importar librerías en versión estable 10.7.1 (Compat)
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// 2. Inicializar con tus credenciales de ByUrSide
firebase.initializeApp({
  apiKey: "AIzaSyBELkZg65Fhxn16EC-HXduhcqaKiNuvcjg",
  authDomain: "byurside-f671b.firebaseapp.com",
  projectId: "byurside-f671b",
  storageBucket: "byurside-f671b.firebasestorage.app",
  messagingSenderId: "357066030641",
  appId: "1:357066030641:web:9110b0dae3d80baec0df10"
});

const messaging = firebase.messaging();

// 3. Manejo de notificaciones en segundo plano con lógica avanzada
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Alerta en segundo plano:', payload);

  const notificationTitle = payload.notification.title || "Alerta de ByUrSide";
  const notificationOptions = {
    body: payload.notification.body || "Hay una actualización importante.",
    icon: '/logo192.png',
    badge: '/favicon.ico', // Icono pequeño para la barra superior
    tag: 'alerta-emergencia', // Agrupa notificaciones para no saturar
    renotify: true, // Vibra incluso si ya hay una notificación activa
    
    // Patrón de vibración tipo SOS: Corto, Corto, Corto, Largo
    vibrate: [200, 100, 200, 100, 200, 100, 400], 
    
    data: {
      url: payload.data?.url || '/dashboard' // Redirección dinámica
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// 4. Lógica para abrir la app al tocar la notificación
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Recuperamos la URL enviada en los datos o usamos el dashboard por defecto
  const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((windowClients) => {
    // Si la app ya está abierta, enfocamos la pestaña
    for (let i = 0; i < windowClients.length; i++) {
      const client = windowClients[i];
      if (client.url === urlToOpen && 'focus' in client) {
        return client.focus();
      }
    }
    // Si no está abierta, abrimos una nueva pestaña
    if (clients.openWindow) {
      return clients.openWindow(urlToOpen);
    }
  });

  event.waitUntil(promiseChain);
});