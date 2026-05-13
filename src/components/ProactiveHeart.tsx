import { useEffect, useRef } from 'react';
import { useVoz } from '../hooks/useVoz';
import { useSalud } from '../hooks/useSalud';
import { useAuth } from '../context/AuthContext';
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
  // Meds cacheados en ref — evita query Firestore en cada tick de 30s
  const medsCache = useRef<Medicina[]>([]);
  // IDs de setTimeout activos para limpiarlos al desmontar
  const activeTimeouts = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  const pacienteId = profile?.rol === 'paciente' ? profile.uid : profile?.pacienteId;

  // Carga meds una vez al montar (cuando pacienteId esté disponible)
  useEffect(() => {
    if (!pacienteId) return;
    let cancelled = false;
    obtenerMedicinasConfiguradas().then(meds => {
      if (!cancelled) medsCache.current = meds as Medicina[];
    });
    return () => { cancelled = true; };
  // obtenerMedicinasConfiguradas no es estable (se recrea cada render)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pacienteId]);

  // Cleanup de todos los timeouts de protocolo de emergencia al desmontar
  useEffect(() => {
    return () => {
      activeTimeouts.current.forEach(id => clearTimeout(id));
    };
  }, []);

  useEffect(() => {
    if (loading || !profile || !pacienteId) return;

    const cronometro = setInterval(() => {
      const ahora = new Date();
      const horaFull = `${ahora.getHours()}:${ahora.getMinutes().toString().padStart(2, '0')}`;

      if (ultimoMinutoProcesado.current === horaFull) return;
      ultimoMinutoProcesado.current = horaFull;

      const { honorifico, pacienteNombre, asistenteNombre } = profile;

      // --- A. CHEQUEO EMOCIONAL ---
      const horariosChequeo = ["09:00", "15:00", "20:00"];
      if (horariosChequeo.includes(horaFull) && !estaHablando) {
        hablar(`${honorifico} ${pacienteNombre}, perdone que lo interrumpa. Soy ${asistenteNombre}. Me gustaría saber, ¿cómo se siente usted en este momento?`);
        setEsperandoConfirmacion({ tipo: 'sentimiento', id: 'emocion', nombre: 'emocion' });
        return; // No procesar meds en el mismo tick que el chequeo emocional
      }

      // --- B. RECORDATORIO DE MEDICAMENTOS (usa caché, sin query Firestore) ---
      for (const med of medsCache.current) {
        if (med.horaToma === horaFull && !estaHablando) {
          hablar(`${honorifico} ${pacienteNombre}, viera que ya es hora de su ${med.nombre}. ¿Ya se la tomó?`);
          setEsperandoConfirmacion({ tipo: 'pastilla', id: med.id, nombre: med.nombre });
          iniciarProtocoloEmergencia(med, profile);
          // Solo un med a la vez — si hay varios a la misma hora el próximo tick
          // (30s) no disparará de nuevo gracias a ultimoMinutoProcesado
          break;
        }
      }

      // --- C. SALUDO ESPIRITUAL ---
      if (horaFull === "08:00" && !estaHablando) {
        hablar(`Buenos días, ${honorifico} ${pacienteNombre}. Espero que haya amanecido muy bien. ¿Le gustaría que empecemos el día con la palabra del Señor?`);
      }

    }, 30000);

    return () => clearInterval(cronometro);
  }, [estaHablando, hablar, setEsperandoConfirmacion, profile, loading, pacienteId]);

  // --- PROTOCOLO DE SEGURIDAD (Escalada a la familia) ---
  const iniciarProtocoloEmergencia = (med: Medicina, perfil: any) => {
    const tid = setTimeout(async () => {
      activeTimeouts.current.delete(tid);
      if (!pacienteId) return;

      const confirmaRef = collection(db, "usuarios", pacienteId, "confirmaciones");
      const q = query(
        confirmaRef,
        where("medId", "==", med.id),
        where("fecha", ">", new Date(Date.now() - 10 * 60000))
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        await addDoc(collection(db, "usuarios", pacienteId, "alerts"), {
          tipo: 'emergencia',
          nivel: 'critico',
          mensaje: `🚨 ATENCIÓN: ${perfil.pacienteNombre} no respondió al recordatorio de ${med.nombre}.`,
          createdAt: serverTimestamp(), // ← corregido: era 'fecha', rompía orderBy en CaregiverDashboard
          resuelta: false
        });

        hablar(`${perfil.honorifico}, como no me respondió, le envié un aviso a ${perfil.familiarNombre || 'su familia'} por pura seguridad.`);
      }
    }, 300000);

    activeTimeouts.current.add(tid);
  };

  return null;
};
