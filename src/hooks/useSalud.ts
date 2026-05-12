import { 
  collection, getDocs, addDoc, deleteDoc, doc, 
  query, orderBy, startAt, endAt, limit, 
  updateDoc, getDoc, serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext'; // 👈 1. Importamos el contexto

export const useSalud = () => {
  const { profile } = useAuth(); // 👈 2. Extraemos el perfil dinámico

  // Determinamos quién es el paciente dueño de los datos
  const pacienteId = profile?.rol === 'paciente' ? profile.uid : profile?.pacienteId;

  // 3. Referencias Dinámicas (Cambiamos "users" por "usuarios")
  const MASTER_MEDS_REF = collection(db, "master_medications");
  
  // Estas referencias solo se activan si hay un pacienteId válido
  const getPacienteRef = (subCol: string) => 
    pacienteId ? collection(db, "usuarios", pacienteId, subCol) : null;

  // --- 1. BUSCAR MEDICAMENTOS (Catálogo Maestro) ---
  const buscarMasterMeds = async (busqueda: string) => {
    if (!busqueda) return [];
    const texto = busqueda.charAt(0).toUpperCase() + busqueda.slice(1).toLowerCase();
    
    try {
      const q = query(
        MASTER_MEDS_REF,
        orderBy("nombre"),
        startAt(texto),
        endAt(texto + '\uf8ff'),
        limit(10)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
      console.error("Error buscando en Master:", error);
      return [];
    }
  };

  // --- 2. GUARDAR PRESCRIPCIÓN ---
  const guardarPrescripcion = async (medData: any) => {
    const ref = getPacienteRef("medications");
    if (!ref) return false;

    try {
      await addDoc(ref, {
        ...medData,
        creadoEn: serverTimestamp(),
        estado: 'activo',
        alertaEnviada: false 
      });
      return true;
    } catch (error) {
      return false;
    }
  };

  // --- 3. DESCONTAR DOSIS (Lógica Proactiva) ---
  const descontarDosis = async (medId: string) => {
    if (!pacienteId) return false;
    try {
      const medRef = doc(db, "usuarios", pacienteId, "medications", medId);
      const docSnap = await getDoc(medRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const nuevoStock = Math.max(0, data.stockActual - data.cantidadPorToma);
        const diasRestantes = nuevoStock / (data.dosisDiaria || 1);

        await updateDoc(medRef, { stockActual: nuevoStock });

        // Si queda poco stock, avisamos a Ana automáticamente
        if (diasRestantes <= 5 && !data.alertaEnviada) {
          await generarAlertaStock(data.nombre, Math.floor(diasRestantes));
          await updateDoc(medRef, { alertaEnviada: true });
        }
      }
      return true;
    } catch (error) {
      return false;
    }
  };

  // --- 4. GENERAR ALERTA DE STOCK ---
  const generarAlertaStock = async (nombreMed: string, dias: number) => {
    const ref = getPacienteRef("alerts");
    if (!ref) return;
    try {
      await addDoc(ref, {
        tipo: 'inventario',
        mensaje: `⚠️ Quedan solo ${dias} días de ${nombreMed}.`,
        fecha: serverTimestamp(),
        resuelta: false,
        nivel: 'critico'
      });
    } catch (e) { console.error("Error enviando alerta:", e); }
  };

  // --- 5. REGISTRAR BIENESTAR EMOCIONAL ---
  const registrarSentimiento = async (sentimiento: string) => {
    const refBienestar = getPacienteRef("bienestar");
    const refAlerts = getPacienteRef("alerts");
    if (!refBienestar || !refAlerts) return false;

    try {
      await addDoc(refBienestar, {
        detalle: sentimiento,
        fecha: serverTimestamp(),
        visto: false 
      });
      
      await addDoc(refAlerts, {
        tipo: 'bienestar',
        mensaje: `Bienestar: Don Carlos reportó sentirse "${sentimiento}"`,
        fecha: serverTimestamp(),
        resuelta: false,
        nivel: 'informativo'
      });
      return true;
    } catch (e) { return false; }
  };

  // --- 6. OBTENER LISTA ---
  const obtenerMedicinasConfiguradas = async () => {
    const ref = getPacienteRef("medications");
    if (!ref) return [];
    try {
      const q = query(ref, orderBy("creadoEn", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) { return []; }
  };

  // --- 7. ELIMINAR ---
  const eliminarMedicina = async (id: string) => {
    if (!pacienteId) return false;
    try {
      await deleteDoc(doc(db, "usuarios", pacienteId, "medications", id));
      return true;
    } catch (error) { return false; }
  };

  return { 
    buscarMasterMeds, 
    guardarPrescripcion, 
    obtenerMedicinasConfiguradas, 
    eliminarMedicina,
    descontarDosis,
    registrarSentimiento 
  };
};