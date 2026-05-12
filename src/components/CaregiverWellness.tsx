import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Smile, Frown, Meh, Heart, 
  Calendar, MessageCircle, TrendingUp, ArrowRight 
} from 'lucide-react';

export const CaregiverWellness = () => {
  const { profile, loading } = useAuth();
  const [historial, setHistorial] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  // 1. LLAVE MAESTRA DINÁMICA
  const pacienteId = profile?.rol === 'paciente' ? profile.uid : profile?.pacienteId;

  useEffect(() => {
    if (!pacienteId) return;

    // Sincronización con la ruta real: usuarios > paciente_principal > wellbeing
    const q = query(
      collection(db, "usuarios", pacienteId, "wellbeing"),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistorial(docs);
      setCargando(false);
    });

    return () => unsub();
  }, [pacienteId]);

  // 2. MAPEO DE ICONOS SEGÚN SU FIREBASE (Campo: registrarSentimiento)
  const getMoodConfig = (textoSentimiento: string) => {
    const s = textoSentimiento?.toLowerCase() || '';
    if (s.includes('contento') || s.includes('feliz') || s.includes('bien') || s.includes('alegre')) 
      return { icon: <Smile className="text-emerald-500" />, bg: 'bg-emerald-50', label: 'Positivo', color: 'text-emerald-600' };
    if (s.includes('triste') || s.includes('solo') || s.includes('mal') || s.includes('bajo')) 
      return { icon: <Frown className="text-red-500" />, bg: 'bg-red-50', label: 'Bajo', color: 'text-red-600' };
    return { icon: <Meh className="text-amber-500" />, bg: 'bg-amber-50', label: 'Neutral', color: 'text-amber-600' };
  };

  const formatearFecha = (fecha: any) => {
    if (!fecha) return "";
    const d = fecha.toDate ? fecha.toDate() : new Date(fecha);
    return d.toLocaleDateString('es-CR', { 
      weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) return null;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 p-4 pb-32">
      {/* --- HEADER CON GRADIENTE Y RESUMEN --- */}
      <header className="mb-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-[35px] p-6 text-white shadow-xl shadow-purple-200 relative overflow-hidden"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-white/20 p-2 rounded-xl">
                <Heart className="fill-white" size={20} />
              </div>
              <h2 className="font-black text-lg tracking-tight uppercase">Monitor de Ánimo</h2>
            </div>
            
            {historial.length > 0 ? (
              <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
                <div className="text-3xl bg-white rounded-xl p-2 shadow-lg">
                  {getMoodConfig(historial[0].registrarSentimiento).icon}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-purple-200">Último reporte</p>
                  <p className="text-xl font-black capitalize">{historial[0].registrarSentimiento}</p>
                </div>
              </div>
            ) : (
              <p className="text-purple-100 text-sm font-medium">Esperando el primer reporte de Danay...</p>
            )}
          </div>
          {/* Decoración geométrica */}
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        </motion.div>
      </header>

      {/* --- LÍNEA DE TIEMPO EMOCIONAL --- */}
      <div className="space-y-6 max-w-2xl mx-auto w-full">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2 flex items-center gap-2">
          <TrendingUp size={14} /> Historial de Bienestar
        </h3>

        {cargando ? (
          <div className="text-center py-10 text-slate-400 font-bold animate-pulse">Sincronizando sentimientos...</div>
        ) : historial.length === 0 ? (
          <div className="bg-white rounded-[30px] p-10 text-center border-2 border-dashed border-slate-200">
            <Smile className="mx-auto text-slate-200 mb-4" size={48} />
            <p className="text-slate-400 font-bold">Aún no hay conversaciones grabadas.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {historial.map((reporte, index) => {
                const config = getMoodConfig(reporte.registrarSentimiento);
                return (
                  <motion.div
                    key={reporte.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative pl-8 border-l-2 border-slate-200 pb-6 last:pb-0"
                  >
                    {/* Punto indicador */}
                    <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-slate-50 shadow-sm ${config.bg.replace('bg-', 'bg-')}`} 
                         style={{ backgroundColor: config.icon.props.className.includes('emerald') ? '#10b981' : config.icon.props.className.includes('red') ? '#ef4444' : '#f59e0b' }} />
                    
                    <div className="bg-white p-5 rounded-[28px] shadow-sm border border-slate-100 hover:shadow-md transition-all">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Calendar size={12} />
                          <span className="text-[10px] font-black uppercase tracking-tighter">
                            {formatearFecha(reporte.createdAt || reporte.fecha)}
                          </span>
                        </div>
                        <span className={`${config.bg} ${config.color} text-[8px] font-black px-2 py-0.5 rounded-full uppercase`}>
                          {config.label}
                        </span>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className={`${config.bg} p-3 rounded-2xl shrink-0`}>
                          {React.cloneElement(config.icon, { size: 24 })}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-slate-900 font-black text-lg leading-tight mb-1 capitalize">
                            {reporte.registrarSentimiento}
                          </h4>
                          <p className="text-slate-500 text-xs italic leading-relaxed">
                            "{reporte.nota || 'Conversación rutinaria con su asistente Danay'}"
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* --- ACCIÓN RÁPIDA --- */}
      <footer className="mt-8">
        <button className="w-full bg-white border-2 border-slate-100 p-5 rounded-[28px] flex items-center justify-between group hover:border-purple-500 transition-all shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-purple-600 p-3 rounded-2xl text-white shadow-lg shadow-purple-100">
               <MessageCircle size={20} />
            </div>
            <div className="text-left">
              <p className="text-xs font-black text-slate-800 uppercase">¿Quiere hablar con él?</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Llamar a Don Carlos ahora</p>
            </div>
          </div>
          <ArrowRight className="text-slate-300 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" size={24} />
        </button>
      </footer>
    </div>
  );
};