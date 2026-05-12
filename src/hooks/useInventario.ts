// src/hooks/useInventario.ts
import { db } from '../firebase/config';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

export const useInventario = () => {
  const verificarStock = async (medicinaId: string) => {
    const medRef = doc(db, "users", "don-carlos-001", "meds", medicinaId);
    const snap = await getDoc(medRef);

    if (snap.exists()) {
      const { stock, dosisDiaria, nombre } = snap.data();
      const diasRestantes = stock / dosisDiaria;

      // Alerta 5 días antes
      if (diasRestantes <= 5) {
        await notificarAAna(`Quedan pocas pastillas de ${nombre}. Favor tramitar receta.`);
      }
      return stock;
    }
  };

  const descontarDosis = async (medicinaId: string) => {
    const medRef = doc(db, "users", "don-carlos-001", "meds", medicinaId);
    const snap = await getDoc(medRef);
    if (snap.exists()) {
      const nuevoStock = snap.data().stock - 1;
      await updateDoc(medRef, { stock: nuevoStock });
      await verificarStock(medicinaId);
    }
  };

  const notificarAAna = async (mensaje: string) => {
    // Aquí se integra con la colección de alertas que Ana ve en NY
    console.log("Notificación para Ana:", mensaje);
  };

  return { descontarDosis };
};