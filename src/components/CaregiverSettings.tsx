import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { User, MessageSquare, Type, Keyboard, Save, CheckCircle } from 'lucide-react';

export const CaregiverSettings = () => {
  const [config, setConfig] = useState({
    asistenteNombre: 'Danay',
    usuarioNombre: 'Carlos',
    usuarioTratamiento: 'Don',
    preferenciaFuente: 'grande',
    entradaTexto: true
  });
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      const docRef = doc(db, "users", "don-carlos-001", "configuracion", "perfil");
      const snap = await getDoc(docRef);
      if (snap.exists()) setConfig(snap.data() as any);
    };
    fetchConfig();
  }, []);

  const handleSave = async () => {
    const docRef = doc(db, "users", "don-carlos-001", "configuracion", "perfil");
    await updateDoc(docRef, config);
    setGuardado(true);
    setTimeout(() => setGuardado(false), 3000);
  };

  return (
    <div className="p-6 max-w-xl mx-auto space-y-8 pb-40">
      <header className="mb-8">
        <h2 className="text-2xl font-black text-slate-800">Personalización</h2>
        <p className="text-slate-500 text-sm font-medium">Configure cómo interactúa el sistema con Don Carlos.</p>
      </header>

      {/* --- SECCIÓN IDENTIDAD --- */}
      <section className="bg-white p-6 rounded-[30px] shadow-sm border border-slate-100 space-y-4">
        <div className="flex items-center gap-3 text-blue-600 mb-4">
          <MessageSquare size={20} />
          <h3 className="font-black uppercase text-xs tracking-widest">Identidad del Asistente</h3>
        </div>
        
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Nombre del Asistente</label>
          <input 
            type="text" 
            value={config.asistenteNombre}
            onChange={(e) => setConfig({...config, asistenteNombre: e.target.value})}
            className="w-full mt-1 bg-slate-50 p-4 rounded-2xl border-none font-bold text-slate-700"
          />
        </div>
      </section>

      {/* --- SECCIÓN USUARIO --- */}
      <section className="bg-white p-6 rounded-[30px] shadow-sm border border-slate-100 space-y-4">
        <div className="flex items-center gap-3 text-emerald-600 mb-4">
          <User size={20} />
          <h3 className="font-black uppercase text-xs tracking-widest">Datos del Usuario</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Tratamiento</label>
            <input 
              type="text" 
              placeholder="Don / Doña"
              value={config.usuarioTratamiento}
              onChange={(e) => setConfig({...config, usuarioTratamiento: e.target.value})}
              className="w-full mt-1 bg-slate-50 p-4 rounded-2xl border-none font-bold text-slate-700"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Nombre</label>
            <input 
              type="text" 
              value={config.usuarioNombre}
              onChange={(e) => setConfig({...config, usuarioNombre: e.target.value})}
              className="w-full mt-1 bg-slate-50 p-4 rounded-2xl border-none font-bold text-slate-700"
            />
          </div>
        </div>
      </section>

      {/* --- SECCIÓN ACCESIBILIDAD --- */}
      <section className="bg-white p-6 rounded-[30px] shadow-sm border border-slate-100 space-y-6">
        <div className="flex items-center gap-3 text-purple-600 mb-2">
          <Type size={20} />
          <h3 className="font-black uppercase text-xs tracking-widest">Accesibilidad Visual</h3>
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Tamaño de letra en Tablet</label>
          <div className="flex bg-slate-50 p-1 rounded-2xl mt-2">
            {['normal', 'grande', 'extra'].map((size) => (
              <button
                key={size}
                onClick={() => setConfig({...config, preferenciaFuente: size})}
                className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${
                  config.preferenciaFuente === size ? 'bg-white shadow-sm text-purple-600' : 'text-slate-400'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <Keyboard size={18} className="text-slate-400" />
            <span className="text-sm font-bold text-slate-700">Teclado en pantalla</span>
          </div>
          <button 
            onClick={() => setConfig({...config, entradaTexto: !config.entradaTexto})}
            className={`w-12 h-6 rounded-full transition-colors relative ${config.entradaTexto ? 'bg-green-500' : 'bg-slate-300'}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${config.entradaTexto ? 'right-1' : 'left-1'}`} />
          </button>
        </div>
      </section>

      {/* BOTÓN DE GUARDAR FLOTANTE */}
      <div className="fixed bottom-28 left-0 w-full px-6 pointer-events-none">
        <button 
          onClick={handleSave}
          className="w-full max-w-xl mx-auto pointer-events-auto bg-slate-900 text-white p-5 rounded-[25px] font-black flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-transform"
        >
          {guardado ? <CheckCircle size={20} className="text-green-400" /> : <Save size={20} />}
          {guardado ? "CONFIGURACIÓN APLICADA" : "GUARDAR CAMBIOS"}
        </button>
      </div>
    </div>
  );
};