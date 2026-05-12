import { useEffect, useRef } from 'react';
import { useVoz } from '../hooks/useVoz';
import { useSalud } from '../hooks/useSalud';
import { useAuth } from '../context/AuthContext'; // 👈 Identidad dinámica
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';

interface Medicina {
  id: string;
  nombre: string;
  horaToma: string;
}

interface ProactiveHeartProps {
  setEsperandoConfirmacion: (val: any) => void;
}

export const ProactiveHeart = ({ setEsperandoConfirmacion }: ProactiveHeartProps) => {
  const { profile, loading } = useAuth();
  const { hablar, estaHablando } = useVoz();
  const { obtenerMedicinasConfiguradas } = useSalud();
  const ultimoMinutoProcesado = useRef<string>("");

  const pacienteId = profile?.rol === 'paciente' ? profile.uid : profile?.pacienteId;

  useEffect(() => {
    if (loading || !profile || !pacienteId) return;

    const cronometro = setInterval(async () => {
      const ahora = new Date();
      const horaFull = `${ahora.getHours()}:${ahora.getMinutes().toString().padStart(2, '0')}`;

      if (ultimoMinutoProcesado.current === horaFull) return;
      ultimoMinutoProcesado.current = horaFull;

      const { honorifico, pacienteNombre, asistenteNombre, familiarNombre } = profile;

      // --- A. CHEQUEO EMOCIONAL (Dinamizado) ---
      const horariosChequeo = ["09:00", "15:00", "20:00"];
      if (horariosChequeo.includes(horaFull) && !estaHablando) {
        hablar(`${honorifico} ${pacienteNombre}, perdone que lo interrumpa. Soy ${asistenteNombre}. Me gustaría saber, ¿cómo se siente usted en este momento?`);
        setEsperandoConfirmacion({ tipo: 'sentimiento', id: 'emocion' });
      }

      // --- B. RECORDATORIO DE MEDICAMENTOS ---
      const meds = await obtenerMedicinasConfiguradas() as Medicina[];
      
      for (const med of meds) {
        if (med.horaToma === horaFull && !estaHablando) {
          hablar(`${honorifico} ${pacienteNombre}, viera que ya es hora de su ${med.nombre}. ¿Ya se la tomó?`);
          setEsperandoConfirmacion({ tipo: 'pastilla', id: med.id, nombre: med.nombre });
          iniciarProtocoloEmergencia(med, profile);
        }
      }

      // --- C. SALUDO ESPIRITUAL ---
      if (horaFull === "08:00" && !estaHablando) {
        hablar(`Buenos días, ${honorifico} ${pacienteNombre}. Espero que haya amanecido muy bien. ¿Le gustaría que empecemos el día con la palabra del Señor?`);
      }

    }, 30000); // Revisa cada 30 segundos para no perder el minuto exacto

    return () => clearInterval(cronometro);
  }, [estaHablando, hablar, obtenerMedicinasConfiguradas, setEsperandoConfirmacion, profile, loading, pacienteId]);

  // --- PROTOCOLO DE SEGURIDAD (Escalada a la familia) ---
  const iniciarProtocoloEmergencia = (med: Medicina, perfil: any) => {
    // Esperamos 5 minutos (300,000 ms) antes de dar la alarma
    setTimeout(async () => {
      if (!pacienteId) return;

      const confirmaRef = collection(db, "usuarios", pacienteId, "confirmaciones");
      // Buscamos si hubo una confirmación en los últimos 10 minutos
      const q = query(
        confirmaRef, 
        where("medId", "==", med.id),
        where("fecha", ">", new Date(Date.now() - 10 * 60000))
      );
      
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        // 🚨 DISPARO DE ALERTA REAL EN FIRESTORE
        await addDoc(collection(db, "usuarios", pacienteId, "alerts"), {
          tipo: 'emergencia',
          nivel: 'critico',
          mensaje: `🚨 ATENCIÓN: ${perfil.pacienteNombre} no respondió al recordatorio de ${med.nombre}.`,
          fecha: serverTimestamp(),
          resuelta: false
        });

        hablar(`${perfil.honorifico}, como no me respondió, le envié un aviso a ${perfil.familiarNombre || 'su familia'} por pura seguridad.`);
      }
    }, 300000); 
  };

  return null;
};