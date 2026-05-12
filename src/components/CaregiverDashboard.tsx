import React, { useState, useEffect } from 'react';
import { 
  Pill, ShoppingCart, BookOpen, MapPin, Heart, 
  AlertTriangle, Smile, Settings, Users, Activity 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase/config';
import { 
  collection, onSnapshot, query, where, orderBy, 
  doc, updateDoc // 👈 Importamos herramientas de actualización
} from 'firebase/firestore';

// 1. CONTEXTO DE IDENTIDAD
import { useAuth } from '../context/AuthContext';

// Componentes del Ecosistema
import { CaregiverShopping } from './CaregiverShopping'; 
import { CaregiverMeds } from './CaregiverMeds';
import { CaregiverBible } from './CaregiverBible';
import { CaregiverMap } from './CaregiverMap'; 
import { CaregiverWellness } from './CaregiverWellness';
import { CaregiverSettings } from './CaregiverSettings';
import { CaregiverFamily } from './CaregiverFamily';
import { CaregiverStats } from './CaregiverStats';

export const CaregiverDashboard = () => {
  const { profile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('meds');
  const [alertas, setAlertas] = useState<any[]>([]);

  const pacienteId = profile?.rol === 'paciente' ? profile.uid : profile?.pacienteId;

  // 2. MONITOREO DE ALERTAS EN TIEMPO REAL
  useEffect(() => {
    if (!pacienteId) return;

    // Sincronizado con 'createdAt' que es lo que Danay emite ahora 🚨
    const q = query(
      collection(db, "usuarios", pacienteId, "alerts"),
      where("resuelta", "==", false),
      orderBy("createdAt", "desc")
    );
    
    const unsub = onSnapshot(q, (snapshot) => {
      setAlertas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    
    return () => unsub();
  }, [pacienteId]);

  // 3. FUNCIÓN PARA GESTIONAR LA ALERTA (ACCIÓN DEL BOTÓN) 👈
  const resolverAlerta = async (alertaId: string) => {
    try {
      const alertaRef = doc(db, "usuarios", pacienteId, "alerts", alertaId);
      await updateDoc(alertaRef, {
        resuelta: true,
        atendidaEn: new Date(),
        atendidaPor: profile?.usuarioNombre || "Ana"
      });
      console.log("✅ Alerta marcada como resuelta");
    } catch (error) {
      console.error("Error al atender alerta:", error);
    }
  };

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-50 font-black text-slate-400 uppercase tracking-widest text-[10px]">
      Sincronizando Panel de Control...
    </div>
  );

  return (
    <div className="h-screen w-full bg-slate-50 flex flex-col overflow-hidden font-sans">
      
      {/* --- HEADER SUPERIOR --- */}
      <header className="bg-white border-b p-4 z-50 shadow-sm shrink-0">
        <div className="flex items-center justify-between max-w-4xl mx-auto w-full">
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2 tracking-tighter uppercase">
              ByUrSide <Heart className="text-red-500 fill-red-500" size={18} />
            </h1>
            <p className="text-slate-400 text-xs font-black uppercase tracking-[0.15em]">
              {profile?.usuarioNombre || 'Cuidador'} • <span className="text-emerald-500 font-black">Conectado</span>
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button onClick={() => setActiveTab('stats')} className={`p-2.5 rounded-2xl transition-all focus:outline-none focus:ring-2 focus:ring-emerald-300 ${activeTab === 'stats' ? 'bg-emerald-50 text-emerald-600 shadow-inner' : 'text-slate-300 hover:bg-slate-50'}`} aria-label="Ver estadísticas y reportes">
              <Activity size={20} />
            </button>
            <button onClick={() => setActiveTab('familia')} className={`p-2.5 rounded-2xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-300 ${activeTab === 'familia' ? 'bg-blue-50 text-blue-600 shadow-inner' : 'text-slate-300 hover:bg-slate-50'}`} aria-label="Gestionar miembros de la familia">
              <Users size={20} />
            </button>
            <button onClick={() => setActiveTab('config')} className={`p-2.5 rounded-2xl transition-all focus:outline-none focus:ring-2 focus:ring-slate-300 ${activeTab === 'config' ? 'bg-slate-50 text-slate-600 shadow-inner' : 'text-slate-300 hover:bg-slate-50'}`} aria-label="Configuraciones del sistema">
              <Settings size={20} />
            </button>
            
            <div className="relative ml-2">
               <div className="w-10 h-10 bg-slate-900 rounded-[18px] flex items-center justify-center text-white font-black text-sm border-4 border-white shadow-sm">
                 {profile?.usuarioNombre?.charAt(0) || 'A'}
               </div>
               {alertas.length > 0 && (
                 <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full animate-bounce shadow-md" aria-label={`${alertas.length} alertas pendientes`}></span>
               )}
            </div>
          </div>
        </div>
      </header>

      {/* --- BANNER DE ALERTAS DINÁMICO --- */}
      <AnimatePresence>
        {alertas.length > 0 && (
          <motion.div 
            initial={{ y: -20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: -20, opacity: 0 }} 
            className="shrink-0"
          >
            {alertas.slice(0, 1).map((alerta) => (
              <div key={alerta.id} className={`px-5 py-3 flex items-center gap-4 border-b ${alerta.nivel === 'critico' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white shadow-lg'}`}>
                <AlertTriangle size={20} className="shrink-0 animate-pulse" />
                <div className="flex-1">
                  <p className="text-xs font-black uppercase tracking-widest opacity-80">Aviso de Seguridad</p>
                  <p className="text-sm font-bold leading-tight">{alerta.mensaje}</p>
                </div>
                {/* BOTÓN CON FUNCIÓN ASIGNADA 👈 */}
                <button 
                  onClick={() => resolverAlerta(alerta.id)}
                  className="text-sm font-black bg-white/20 px-4 py-2 rounded-xl uppercase hover:bg-white/30 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                  aria-label={`Marcar alerta como atendida: ${alerta.mensaje}`}
                >
                  Atender
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- AREA DE TRABAJO --- */}
      <main className="flex-1 relative bg-slate-50 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div 
            key={activeTab} 
            initial={{ opacity: 0, scale: 0.98 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.98 }} 
            transition={{ duration: 0.2 }} 
            className="h-full w-full"
          >
            <div className="h-full overflow-y-auto pb-32 pt-2">
              {activeTab === 'meds' && <CaregiverMeds pacienteId={pacienteId} />}
              {activeTab === 'compras' && <CaregiverShopping pacienteId={pacienteId} />}
              {activeTab === 'bienestar' && <CaregiverWellness pacienteId={pacienteId} />}
              {activeTab === 'biblia' && <CaregiverBible pacienteId={pacienteId} />}
              {activeTab === 'gps' && <div className="h-full w-full p-4"><CaregiverMap pacienteId={pacienteId} /></div>}
              {activeTab === 'stats' && <CaregiverStats pacienteId={pacienteId} />}
              {activeTab === 'familia' && <CaregiverFamily pacienteId={pacienteId} />}
              {activeTab === 'config' && <CaregiverSettings />}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* --- NAVEGACIÓN --- */}
      <nav className="bg-white border-t flex justify-around p-3 pb-10 z-50 shadow-md shrink-0">
        <NavButton active={activeTab === 'meds'} onClick={() => setActiveTab('meds')} icon={<Pill size={22} />} label="Salud" color="text-blue-600" />
        <NavButton active={activeTab === 'compras'} onClick={() => setActiveTab('compras')} icon={<ShoppingCart size={22} />} label="Súper" color="text-orange-500" />
        <NavButton active={activeTab === 'bienestar'} onClick={() => setActiveTab('bienestar')} icon={<Smile size={22} />} label="Ánimo" color="text-purple-500" />
        <NavButton active={activeTab === 'biblia'} onClick={() => setActiveTab('biblia')} icon={<BookOpen size={22} />} label="Lectura" color="text-emerald-600" />
        <NavButton active={activeTab === 'gps'} onClick={() => setActiveTab('gps')} icon={<MapPin size={22} />} label="Mapa" color="text-red-500" />
      </nav>
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label, color }: any) => (
  <button 
    onClick={onClick} 
    className={`flex flex-col items-center flex-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-300 ${active ? `${color} scale-110` : 'text-slate-300'}`}
    aria-label={`Ir a sección ${label}`}
    aria-pressed={active}
  >
    <div className={`p-2 rounded-2xl transition-colors ${active ? 'bg-white shadow-sm' : ''}`}>
      {icon}
    </div>
    <span className={`text-[11px] mt-1 font-black uppercase tracking-wide ${active ? 'opacity-100' : 'opacity-50'}`}>
      {label}
    </span>
  </button>
);