import React, { useState, useEffect } from 'react';
import { 
  Pill, Plus, Trash2, Clock, Syringe, 
  AlertCircle, ClipboardList, ShieldCheck, 
  Database, BellRing 
} from 'lucide-react';
import { useSalud } from '../hooks/useSalud';
import { MedicationForm } from './MedicationForm';
import { motion, AnimatePresence } from 'framer-motion';

export const CaregiverMeds = () => {
  const [misMeds, setMisMeds] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { obtenerMedicinasConfiguradas, eliminarMedicina } = useSalud();

  const cargarMeds = async () => {
    const data = await obtenerMedicinasConfiguradas();
    setMisMeds(data);
  };

  useEffect(() => {
    cargarMeds();
  }, []);

  const handleDelete = async (id: string, nombre: string) => {
    if (window.confirm(`¿Está segura de que desea eliminar ${nombre} del plan?`)) {
      const exito = await eliminarMedicina(id);
      if (exito) cargarMeds();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* --- HEADER --- */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-slate-200 p-5 shadow-sm shrink-0">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <ShieldCheck className="text-blue-600" size={20} /> CONTROL DE SALUD
            </h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Inventario en Tiempo Real</p>
          </div>
          <button 
            onClick={() => setIsFormOpen(true)}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus size={18} strokeWidth={3} />
            <span className="font-bold text-sm uppercase">Nuevo</span>
          </button>
        </div>
      </header>

      {/* --- LISTADO --- */}
      <main className="p-4 max-w-2xl mx-auto w-full pb-32 flex-1">
        {misMeds.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-slate-200 shadow-inner">
            <ClipboardList className="text-slate-200 mx-auto mb-4" size={60} />
            <p className="text-slate-500 font-bold">Sin tratamientos activos</p>
            <p className="text-slate-400 text-xs mt-2 px-10">Use el botón "Nuevo" para configurar la medicina.</p>
          </motion.div>
        ) : (
          <div className="grid gap-6">
            <AnimatePresence mode="popLayout">
              {misMeds.map((med) => {
                
                // --- INTEGRACIÓN DE MEJORAS (PASO 1) ---
                // 1. Convertimos a número y usamos 0 si el valor es nulo o indefinido
                const stock = Number(med.stockActual) || 0;
                
                // 2. Aseguramos que la dosis diaria sea al menos 1 para evitar división por cero
                const dosisDiaria = Number(med.dosisDiaria) || 1;
                
                // 3. Calculamos días con Math.floor para evitar decimales extraños
                const diasRestantes = Math.floor(stock / dosisDiaria);
                
                const esCritico = diasRestantes <= 5;
                const esInyectable = med.via?.includes('Subcutánea') || med.via?.includes('Inyectable');
                const unidadesLabel = esInyectable ? 'unidades' : 'tabletas';

                return (
                  <motion.div 
                    key={med.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`bg-white p-6 rounded-[35px] shadow-sm border-2 transition-all duration-500 ${esCritico ? 'border-red-100 bg-red-50/10' : 'border-white'}`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-3 rounded-2xl ${esInyectable ? 'bg-purple-100 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                        {esInyectable ? <Syringe size={24} /> : <Pill size={24} />}
                      </div>
                      <div className="flex gap-2">
                        {esCritico && (
                          <span className="bg-red-500 text-white text-[9px] font-black px-3 py-1.5 rounded-full flex items-center gap-1 animate-pulse">
                            <BellRing size={12} /> TRAMITAR RECETA
                          </span>
                        )}
                        <button onClick={() => handleDelete(med.id, med.nombre)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h3 className="font-black text-slate-800 text-xl tracking-tight leading-none">{med.nombre}</h3>
                        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2">
                          {med.dosis} • {med.via} • {med.frecuencia} tomas al día
                        </p>
                      </div>

                      {/* PANEL DE STOCK NORMALIZADO */}
                      <div className={`p-4 rounded-2xl border ${esCritico ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                        <div className="flex justify-between items-end mb-2">
                          <div className={`flex items-center gap-1.5 ${esCritico ? 'text-red-600' : 'text-slate-500'}`}>
                            <Database size={14} />
                            <span className="text-[10px] font-black uppercase">Stock Disponible</span>
                          </div>
                          <span className={`text-sm font-black ${esCritico ? 'text-red-600' : 'text-slate-700'}`}>
                            {stock} <span className="text-[9px] opacity-60 uppercase">{unidadesLabel}</span>
                          </span>
                        </div>
                        
                        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            // Visualizamos el progreso basado en una reserva ideal de 30 días
                            animate={{ width: `${Math.min((stock / (dosisDiaria * 30)) * 100, 100)}%` }}
                            className={`h-full rounded-full transition-colors duration-500 ${esCritico ? 'bg-red-500' : 'bg-emerald-500'}`}
                          />
                        </div>
                        
                        <div className="flex justify-between mt-2">
                          <p className={`text-[10px] font-bold flex items-center gap-1 ${esCritico ? 'text-red-500' : 'text-slate-400'}`}>
                            {esCritico ? <AlertCircle size={10} /> : <Clock size={10} />}
                            Reserva para {diasRestantes} días
                          </p>
                        </div>
                      </div>

                      {med.notes || med.notas ? (
                        <div className="bg-blue-50/40 p-3 rounded-2xl border border-blue-100/30">
                          <p className="text-[11px] text-blue-800 font-medium italic leading-relaxed">
                            "{med.notes || med.notas}"
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>

      <MedicationForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSave={cargarMeds} />
    </div>
  );
};