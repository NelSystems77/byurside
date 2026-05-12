import { 
  collection, addDoc, getDocs, updateDoc, deleteDoc, 
  doc, query, where, orderBy, serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext'; // 👈 Importamos el contexto

export const useCompras = () => {
  const { profile } = useAuth(); // 👈 Identidad dinámica

  // Determinamos el ID del paciente dueño de la lista
  const pacienteId = profile?.rol === 'paciente' ? profile.uid : profile?.pacienteId;

  // Función auxiliar para obtener referencias dinámicas
  const getPacienteRef = (subCol: string) => 
    pacienteId ? collection(db, "usuarios", pacienteId, subCol) : null;

  // --- 0. ACTUALIZAR CANTIDAD ---
  const actualizarCantidad = async (itemId: string, nuevaQty: string) => {
    if (!pacienteId) return false;
    try {
      const itemRef = doc(db, "usuarios", pacienteId, "shopping_lists", itemId);
      await updateDoc(itemRef, { qty: nuevaQty });
      return true;
    } catch (e) { return false; }
  };

  // --- 1. AGREGAR ITEM POR VOZ (Don Carlos) ---
  const agregarItemPorVoz = async (nombre: string) => {
    const ref = getPacienteRef("shopping_lists");
    if (!ref) return false;
    try {
      await addDoc(ref, {
        name: nombre,
        qty: "1",
        unit: "Unid.",
        bought: false,
        price: 0,
        createdAt: serverTimestamp(),
        addedBy: `${profile?.asistenteNombre || 'Danay'} (Voz)` // 👈 Nombre dinámico de la IA
      });
      return true;
    } catch (e) { return false; }
  };

  // --- 2. OBTENER LISTA MAESTRA (Frecuentes de la familia) ---
  const obtenerMasterList = async () => {
    const ref = getPacienteRef("master_list");
    if (!ref) return [];
    try {
      const q = query(ref, orderBy("name", "asc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) { return []; }
  };

  // --- 3. AGREGAR DESDE MASTER LIST ---
  const agregarAListaActiva = async (producto: any) => {
    const ref = getPacienteRef("shopping_lists");
    if (!ref) return false;
    try {
      await addDoc(ref, {
        name: producto.name,
        qty: producto.qty || "1",
        unit: producto.unit || "Unid.",
        bought: false,
        price: 0,
        createdAt: serverTimestamp(),
        addedBy: `${profile?.usuarioNombre || 'Ana'} (Manual)`
      });
      return true;
    } catch (e) { return false; }
  };

  // --- 4. OBTENER LISTA ACTIVA (Pendientes) ---
  const obtenerListaActiva = async () => {
    const ref = getPacienteRef("shopping_lists");
    if (!ref) return [];
    try {
      const q = query(
        ref, 
        where("bought", "==", false),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) { return []; }
  };

  // --- 5. MARCAR COMO COMPRADO ---
  const marcarComoComprado = async (itemId: string) => {
    if (!pacienteId) return false;
    try {
      const itemRef = doc(db, "usuarios", pacienteId, "shopping_lists", itemId);
      await updateDoc(itemRef, { bought: true });
      return true;
    } catch (e) { return false; }
  };

  // --- 6. ELIMINAR ITEM ---
  const eliminarItem = async (itemId: string) => {
    if (!pacienteId) return false;
    try {
      const itemRef = doc(db, "usuarios", pacienteId, "shopping_lists", itemId);
      await deleteDoc(itemRef);
      return true;
    } catch (e) { return false; }
  };

  return { 
    agregarItemPorVoz, 
    obtenerMasterList, 
    agregarAListaActiva, 
    obtenerListaActiva, 
    marcarComoComprado, 
    eliminarItem,
    actualizarCantidad 
  };
};