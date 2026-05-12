import { useState, useEffect, useCallback } from 'react';
import { collection, addDoc, getDocs, query, orderBy, where, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

export const useAgua = () => {
  const { profile } = useAuth();
  const pacienteId = profile?.rol === 'paciente' ? profile.uid : profile?.pacienteId;
  const [consumoHoy, setConsumoHoy] = useState(0);
  const META_DIARIA_ML = 2000;

  const refColeccion = useCallback(() => {
    if (!pacienteId) return null;
    return collection(db, "usuarios", pacienteId, "water_intake");
  }, [pacienteId]);

  const calcularConsumoHoy = useCallback(async () => {
    const ref = refColeccion();
    if (!ref) return 0;
    try {
      const inicioDelDia = new Date();
      inicioDelDia.setHours(0, 0, 0, 0);
      const q = query(
        ref,
        where("createdAt", ">=", Timestamp.fromDate(inicioDelDia)),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      const total = snap.docs.reduce((acc, doc) => acc + (doc.data().ml || 0), 0);
      setConsumoHoy(total);
      return total;
    } catch {
      return 0;
    }
  }, [refColeccion]);

  useEffect(() => {
    calcularConsumoHoy();
  }, [calcularConsumoHoy]);

  const registrarAgua = async (ml: number, registradoPor = 'Paciente'): Promise<boolean> => {
    const ref = refColeccion();
    if (!ref) return false;
    try {
      await addDoc(ref, {
        ml,
        registradoPor,
        createdAt: serverTimestamp()
      });
      await calcularConsumoHoy();
      return true;
    } catch (e) {
      console.error("Error registrando agua:", e);
      return false;
    }
  };

  const porcentajeMeta = Math.min(100, Math.round((consumoHoy / META_DIARIA_ML) * 100));

  return { registrarAgua, consumoHoy, porcentajeMeta, META_DIARIA_ML, calcularConsumoHoy };
};
