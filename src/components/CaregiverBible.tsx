import React, { useState, useEffect } from 'react';
import { BookOpen, Calendar, Sparkles, CheckCircle2, Search, Book, BookmarkCheck } from 'lucide-react';
import { db } from '../firebase/config';
import { collection, addDoc } from 'firebase/firestore';
import { MOCK_BIBLE } from '../data/mockBible'; // Importamos el Mock con los textos reales

export const CaregiverBible = () => {
  const [isAutoPlan, setIsAutoPlan] = useState(false);
  const [selectedBook, setSelectedBook] = useState('19'); // Por defecto Salmos
  const [selectedCap, setSelectedCap] = useState('23');
  const [previewText, setPreviewText] = useState('');
  const [loading, setLoading] = useState(false);

  // Cada vez que Ana cambie libro o capítulo, buscamos el texto automáticamente
  useEffect(() => {
    const key = `${selectedBook}_${selectedCap}`;
    if (MOCK_BIBLE[key]) {
      const contenido = MOCK_BIBLE[key].versiculos.map((v: any) => v.texto).join(' ');
      setPreviewText(contenido);
    } else {
      setPreviewText("Pasaje no disponible en el modo de prueba local.");
    }
  }, [selectedBook, selectedCap]);

  const guardarPlanManual = async () => {
    if (!previewText || previewText.includes("no disponible")) return alert("Seleccione un pasaje válido");
    
    setLoading(true);
    try {
      const hoy = new Date().toISOString().split('T')[0];
      const bookName = MOCK_BIBLE[`${selectedBook}_${selectedCap}`]?.libro || "Libro";
      
      await addDoc(collection(db, "users", "don-carlos-001", "bible_plan"), {
        fecha: hoy,
        referencia: `${bookName} ${selectedCap}`,
        contenido: previewText,
        tipo: 'manual',
        creado: new Date()
      });
      alert("✅ Lectura programada para hoy.");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto pb-32 space-y-6">
      {/* --- ENCABEZADO --- */}
      <div className="bg-emerald-600 text-white p-8 rounded-[40px] shadow-xl shadow-emerald-100 relative overflow-hidden">
        <div className="relative z-10 text-center">
          <BookOpen size={40} className="mx-auto mb-3 opacity-90" />
          <h2 className="text-2xl font-black tracking-tight">Plan Espiritual</h2>
          <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest mt-1">Don Carlos • San José</p>
        </div>
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
      </div>

      {/* --- OPCIÓN 1: PLAN AUTOMÁTICO (BIBLIA EN UN AÑO) --- */}
      <section className={`p-6 rounded-[35px] border-2 transition-all duration-500 ${isAutoPlan ? 'bg-emerald-50 border-emerald-300 shadow-inner' : 'bg-white border-slate-100 shadow-sm'}`}>
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-2xl ${isAutoPlan ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
            <Sparkles size={24} />
          </div>
          <div className="flex flex-col items-end">
            <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${isAutoPlan ? 'bg-emerald-200 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
              {isAutoPlan ? 'Activado' : 'Inactivo'}
            </span>
          </div>
        </div>

        <h3 className="text-lg font-black text-slate-800">Biblia en un Año</h3>
        <p className="text-slate-500 text-xs font-medium leading-relaxed mt-1 mb-6">
          Si activa esta opción, Danay seleccionará automáticamente las lecturas diarias de la Reina-Valera 1909. Usted no tendrá que configurar nada más.
        </p>

        <button 
          onClick={() => setIsAutoPlan(!isAutoPlan)}
          className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
            isAutoPlan ? 'bg-white text-emerald-600 border-2 border-emerald-100 shadow-sm' : 'bg-slate-900 text-white shadow-xl hover:bg-slate-800'
          }`}
        >
          {isAutoPlan ? <CheckCircle2 size={18} /> : <Calendar size={18} />}
          {isAutoPlan ? 'DETENER PLAN AUTOMÁTICO' : 'ACTIVAR PLAN DE 365 DÍAS'}
        </button>
      </section>

      {/* --- OPCIÓN 2: SELECTOR MANUAL (CON BÚSQUEDA) --- */}
      {!isAutoPlan && (
        <section className="bg-white p-6 rounded-[35px] shadow-sm border border-slate-100 space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <Search size={18} className="text-blue-500" />
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Selección Manual</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 ml-2 uppercase">Libro</label>
              <select 
                value={selectedBook}
                onChange={(e) => setSelectedBook(e.target.value)}
                className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1">Génesis</option>
                <option value="19">Salmos</option>
                <option value="43">Juan</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 ml-2 uppercase">Capítulo</label>
              <input 
                type="number" 
                value={selectedCap}
                onChange={(e) => setSelectedCap(e.target.value)}
                className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* VISTA PREVIA DEL TEXTO (Lo que Danay leerá) */}
          <div className="p-5 bg-blue-50 rounded-[25px] border border-blue-100 relative">
            <Book size={16} className="absolute top-4 right-4 text-blue-300" />
            <p className="text-[11px] font-bold text-blue-400 uppercase tracking-tighter mb-2">Vista previa de lectura:</p>
            <p className="text-slate-600 text-sm leading-relaxed italic font-medium">
              "{previewText}"
            </p>
          </div>

          <button 
            onClick={guardarPlanManual}
            disabled={loading}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-100 flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
          >
            <BookmarkCheck size={20} />
            {loading ? 'GUARDANDO...' : 'PROGRAMAR PARA HOY'}
          </button>
        </section>
      )}
    </div>
  );
};