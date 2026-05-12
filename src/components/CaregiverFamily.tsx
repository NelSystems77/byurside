import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { UserPlus, Bell, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePushNotifications } from '../hooks/usePushNotifications'; // 👈 Importar el nuevo hook

export const CaregiverFamily = () => {
  const [familia, setFamilia] = useState<any[]>([]);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [relacion, setRelacion] = useState('Hijo/a');
  
  // ID del familiar actual (En una app real, esto vendría del Auth)
  const miIdFamiliar = "ana-ny-001"; 
  const { activarNotificaciones, notificacionesActivas } = usePushNotifications("don-carlos-001", miIdFamiliar);

  useEffect(() => {
    const q = query(
      collection(db, "users", "don-carlos-001", "familia"),
      orderBy("creadoEn", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setFamilia(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const agregarFamiliar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre || !nuevoEmail) return;

    await addDoc(collection(db, "users", "don-carlos-001", "familia"), {
      nombre: nuevoNombre,
      email: nuevoEmail,
      relacion: relacion,
      recibeAlertas: true,
      rol: 'lector',
      creadoEn: serverTimestamp()
    });

    setNuevoNombre('');
    setNuevoEmail('');
  };

  return (
    <div className="p-6 max-w-xl mx-auto pb-40">
      <header className="mb-8">
        <h2 className="text-2xl font-black text-slate-800">Red de Apoyo</h2>
        <p className="text-slate-500 text-sm font-medium">Familiares que cuidan a Don Carlos.</p>
      </header>

      {/* --- 1. CONFIGURACIÓN DE NOTIFICACIONES PUSH --- */}
      <section className="mb-8">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2">Este Dispositivo</h3>
        <div className="bg-white p-5 rounded-[30px] border border-slate-100 shadow-sm flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${notificacionesActivas ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
              <Bell size={24} />
            </div>
            <div>
              <p className="font-bold text-slate-800 leading-tight">Alertas en este móvil</p>
              <p className="text-[10px] text-slate-400 uppercase font-black mt-1">
                Estado: <span className={notificacionesActivas ? 'text-green-500' : 'text-blue-500'}>
                  {notificacionesActivas ? 'Activado' : 'Desactivado'}
                </span>
              </p>
            </div>
          </div>
          
          <button 
            onClick={activarNotificaciones}
            className={`px-4 py-3 rounded-2xl font-black text-xs transition-all active:scale-95 ${
              notificacionesActivas 
                ? 'bg-slate-100 text-slate-400 cursor-default' 
                : 'bg-blue-600 text-white shadow-lg shadow-blue-200'
            }`}
          >
            {notificacionesActivas ? 'VINCULADO' : 'ACTIVAR'}
          </button>
        </div>
      </section>

      {/* --- 2. FORMULARIO DE INVITACIÓN --- */}
      <section className="bg-blue-600 p-6 rounded-[35px] shadow-xl shadow-blue-200 text-white mb-8">
        <div className="flex items-center gap-3 mb-4">
          <UserPlus size={20} />
          <h3 className="font-black uppercase text-xs tracking-widest">Invitar Familiar</h3>
        </div>
        <form onSubmit={agregarFamiliar} className="space-y-3">
          <input 
            type="text" placeholder="Nombre (ej: Pedro)" 
            value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)}
            className="w-full p-4 rounded-2xl bg-white/10 border border-white/20 placeholder:text-white/50 font-bold outline-none focus:bg-white/20 transition-all"
          />
          <input 
            type="email" placeholder="Correo electrónico" 
            value={nuevoEmail} onChange={(e) => setNuevoEmail(e.target.value)}
            className="w-full p-4 rounded-2xl bg-white/10 border border-white/20 placeholder:text-white/50 font-bold outline-none focus:bg-white/20 transition-all"
          />
          <select 
            value={relacion} onChange={(e) => setRelacion(e.target.value)}
            className="w-full p-4 rounded-2xl bg-white/10 border border-white/20 font-bold outline-none text-white appearance-none"
          >
            <option className="text-slate-800" value="Hijo/a">Hijo/a</option>
            <option className="text-slate-800" value="Nieto/a">Nieto/a</option>
            <option className="text-slate-800" value="Hermano/a">Hermano/a</option>
            <option className="text-slate-800" value="Cuidador Profesional">Cuidador Profesional</option>
          </select>
          <button type="submit" className="w-full bg-white text-blue-600 p-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg hover:bg-slate-50 transition-colors">
            Enviar Invitación
          </button>
        </form>
      </section>

      {/* --- 3. LISTA DE FAMILIARES --- */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Miembros de la Red</h3>
        <AnimatePresence>
          {familia.map((miembro) => (
            <motion.div 
              key={miembro.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-black relative">
                  {miembro.nombre.charAt(0)}
                  {miembro.notificacionesActivas && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></span>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">{miembro.nombre}</h4>
                  <p className="text-[10px] font-bold text-blue-500 uppercase">{miembro.relacion}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${miembro.notificacionesActivas ? 'bg-green-50 text-green-500' : 'bg-slate-50 text-slate-300'}`}>
                  <Bell size={16} />
                </div>
                <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                  <MoreVertical size={18} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};