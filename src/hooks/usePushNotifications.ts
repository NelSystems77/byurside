import { getToken } from "firebase/messaging";
import { messaging, db } from "../firebase/config";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";

export const usePushNotifications = (userId: string, familiarId: string) => {
  
  const activarNotificaciones = async () => {
    try {
      const permiso = await Notification.requestPermission();
      
      if (permiso === 'granted') {
        const token = await getToken(messaging, { 
          vapidKey: 'BIJarwJVyUFRsyuao1TvYgnXOOHsrntqrZzkY34vedFiKAbhegRXAUmrwAoRQRwWXTNjtBFfjvVCn9Tdlof23go' 
        });

        if (token) {
          // Guardamos el token en el documento del familiar para que el sistema sepa a dónde enviar
          const familiarRef = doc(db, "usuarios", userId, "familia", familiarId);
          await updateDoc(familiarRef, {
            fcmTokens: arrayUnion(token),
            notificacionesActivas: true
          });
          return true;
        }
      }
    } catch (error) {
      console.error("Error activando notificaciones:", error);
    }
    return false;
  };

  return { activarNotificaciones };
};