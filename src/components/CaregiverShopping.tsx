import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { 
  collection, onSnapshot, query, orderBy, 
  doc, deleteDoc, addDoc, serverTimestamp, updateDoc 
} from 'firebase/firestore';
import { 
  ShoppingCart, FileText, Check, Plus, 
  Trash2, ShoppingBasket, MessageCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompras } from '../hooks/useCompras';
import { useAuth } from '../context/AuthContext'; 
import { ProductSelectorModal } from './ProductSelectorModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// 👈 Recibimos pacienteId como Prop para asegurar sincronización total
export const CaregiverShopping = ({ pacienteId }: { pacienteId: string }) => {
  const { profile } = useAuth(); 
  const [items, setItems] = useState<any[]>([]);
  const [nuevoItem, setNuevoItem] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [masterList, setMasterList] = useState<any[]>([]);

  const { obtenerMasterList } = useCompras();

  // 1. ESCUCHA DINÁMICA BASADA EN LA PROP
  useEffect(() => {
    if (!pacienteId) {
      console.log("⚠️ CaregiverShopping: No se recibió pacienteId");
      return;
    }

    console.log("🔍 Ana sincronizando con el ID:", pacienteId);

    // Ajustamos la ruta a plural y el orden a 'createdAt' según Firebase
    const q = query(
      collection(db, "usuarios", pacienteId, "shopping_lists"),
      orderBy("createdAt", "desc") 
    );

    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log("🛒 Items cargados para el paciente:", docs);
      setItems(docs);
    });

    obtenerMasterList().then(setMasterList);
    return () => unsub();
  }, [pacienteId]); // 👈 Reacciona si la llave cambia

  // 2. AGREGAR ITEM MANUAL
  const agregarItemManual = async (e?: React.FormEvent, productoData?: any) => {
    if (e) e.preventDefault();
    if (!pacienteId) return;

    const nombre = productoData?.name || nuevoItem;
    if (!nombre.trim()) return;

    await addDoc(collection(db, "usuarios", pacienteId, "shopping_lists"), {
      name: nombre,
      qty: productoData?.qty || 1,
      unit: productoData?.unit || 'Unid.',
      addedBy: profile?.usuarioNombre || "Ana",
      bought: false,
      createdAt: serverTimestamp() 
    });
    setNuevoItem("");
    setIsModalOpen(false);
  };

  const handleMarkBought = async (id: string, estadoActual: boolean) => {
    if (!pacienteId) return;
    const docRef = doc(db, "usuarios", pacienteId, "shopping_lists", id);
    await updateDoc(docRef, { bought: !estadoActual });
  };

  const handleGeneratePDF = () => {
    const doc = new jsPDF();
    doc.text(`Lista de Compras - ${profile?.pacienteNombre || 'Paciente'}`, 14, 20);
    autoTable(doc, {
      startY: 30,
      head: [['Producto', 'Cant.', 'Origen']],
      body: items.map(i => [i.name, `${i.qty} ${i.unit}`, i.addedBy]),
      headStyles: { fillColor: [249, 115, 22] }
    });
    doc.save(`Super_ByUrSide.pdf`);
  };

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6 pb-32">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">Despensa</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Sincronizado con {profile?.pacienteNombre || 'el paciente'}
          </p>
        </div>
        <button 
          onClick={handleGeneratePDF}
          className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm"
        >
          <FileText size={20} />
        </button>
      </div>

      <form onSubmit={agregarItemManual} className="flex gap-2">
        <input 
          type="text" 
          value={nuevoItem}
          onChange={(e) => setNuevoItem(e.target.value)}
          placeholder="¿Qué falta en la casa?"
          className="flex-1 bg-white p-4 rounded-2xl shadow-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-orange-500"
        />
        <button type="submit" className="bg-orange-500 text-white p-4 rounded-2xl shadow-lg active:scale-95 transition-transform">
          <Plus size={24} />
        </button>
      </form>

      <div className="space-y-3">
        <AnimatePresence>
          {items.map((item) => (
            <motion.div 
              key={item.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-[24px] bg-white shadow-sm border-l-8 flex items-center justify-between ${
                item.bought ? 'border-slate-200 grayscale opacity-40' : 'border-orange-500'
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className={`font-black text-lg ${item.bought ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                    {item.name}
                  </h4>
                  {item.addedBy?.includes('Danay') && (
                    <span className="bg-blue-100 text-blue-600 p-1 rounded-full animate-pulse">
                      <MessageCircle size={12} strokeWidth={3} />
                    </span>
                  )}
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {item.qty} {item.unit} • Por: {item.addedBy}
                </p>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => handleMarkBought(item.id, item.bought)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    item.bought ? 'bg-green-500 text-white shadow-lg' : 'bg-slate-50 text-slate-300'
                  }`}
                >
                  <Check size={18} strokeWidth={4} />
                </button>
                <button 
                  onClick={() => deleteDoc(doc(db, "usuarios", pacienteId, "shopping_lists", item.id))}
                  className="w-10 h-10 rounded-xl bg-slate-50 text-slate-300 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-28 right-6 w-14 h-14 bg-slate-900 text-white rounded-2xl shadow-2xl flex items-center justify-center z-40 active:scale-90 transition-transform"
      >
        <ShoppingBasket size={24} />
      </button>

      <ProductSelectorModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        masterList={masterList}
        onSelect={(prod) => agregarItemManual(undefined, prod)}
      />
    </div>
  );
};