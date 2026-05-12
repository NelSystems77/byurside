import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { Activity, TrendingUp, AlertTriangle, CheckCircle2, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

export const CaregiverStats = () => {
  const [stats, setStats] = useState({
    cumplimientoMeds: 0,
    animoPromedio: 'Estable',
    alertasSemana: 0,
    actividadGps: 0
  });

  useEffect(() => {
    // Simulación de carga de datos agregados (En producción se usarían Cloud Functions)
    const cargarStats = async () => {
      // Aquí consultaríamos las colecciones de historial
      setStats({
        cumplimientoMeds: 94,
        animoPromedio: 'Positivo',
        alertasSemana: 2,
        actividadGps: 85
      });
    };
    cargarStats();
  }, []);

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6 pb-40">
      <header>
        <h2 className="text-2xl font-black text-slate-800">Reporte Semanal</h2>
        <p className="text-slate-500 text-sm font-medium">Análisis de bienestar de Don Carlos.</p>
      </header>

      {/* --- CUMPLIMIENTO DE MEDICAMENTOS --- */}
      <section className="bg-white p-6 rounded-[35px] shadow-sm border border-slate-100">
        <div className="flex justify-between items-end mb-4">
          <div>
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <CheckCircle2 size={18} />
              <h3 className="font-black uppercase text-[10px] tracking-widest">Medicamentos</h3>
            </div>
            <p className="text-3xl font-black text-slate-800">{stats.cumplimientoMeds}%</p>
          </div>
          <p className="text-[10px] font-bold text-green-500 bg-green-50 px-2 py-1 rounded-lg">↑ 4% vs ayer</p>
        </div>
        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${stats.cumplimientoMeds}%` }}
            className="h-full bg-blue-500 rounded-full"
          />
        </div>
      </section>

      {/* --- GRID DE MÉTRICAS RÁPIDAS --- */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-[30px] border border-slate-100 shadow-sm">
          <div className="text-purple-600 mb-3"><Heart size={24} /></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Ánimo Predominante</p>
          <p className="text-xl font-black text-slate-800">{stats.animoPromedio}</p>
        </div>

        <div className="bg-white p-5 rounded-[30px] border border-slate-100 shadow-sm">
          <div className="text-red-500 mb-3"><AlertTriangle size={24} /></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Alertas de Perímetro</p>
          <p className="text-xl font-black text-slate-800">{stats.alertasSemana} incidentes</p>
        </div>
      </div>

      {/* --- TENDENCIA DE BIENESTAR --- */}
      <section className="bg-slate-900 p-6 rounded-[35px] text-white shadow-xl shadow-slate-200">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp size={20} className="text-emerald-400" />
          <h3 className="font-black uppercase text-[10px] tracking-widest text-slate-400">Resumen de Actividad</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm">
            <span className="font-bold opacity-60">Interacción con Danay</span>
            <span className="font-black">Alta</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="font-bold opacity-60">Horas de sueño estimadas</span>
            <span className="font-black">7.5h</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="font-bold opacity-60">Peticiones de Biblia</span>
            <span className="font-black">5 este mes</span>
          </div>
        </div>

        <button className="w-full mt-6 bg-white/10 hover:bg-white/20 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-colors">
          Exportar Reporte Médico
        </button>
      </section>
    </div>
  );
};