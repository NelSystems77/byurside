import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

export const usePerfil = () => {
  const [perfil, setPerfil] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const userId = "don-carlos-001"; // Esto será dinámico luego

  useEffect(() => {
    const docRef = doc(db, "users", userId, "configuracion", "perfil");
    
    // Usamos onSnapshot para que los cambios sean en tiempo real
    const unsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setPerfil(docSnap.data());
      } else {
        // Valores por defecto si no existe el documento
        setPerfil({
          asistenteNombre: "Danay",
          usuarioNombre: "Carlos",
          usuarioTratamiento: "Don"
        });
      }
      setCargando(false);
    });

    return () => unsub();
  }, []);

  return { perfil, cargando };
};