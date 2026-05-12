import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VisualBridgeProps {
  mensaje: string;
  quienHabla: string;
  tipo: 'asistente' | 'usuario';
  fontSize?: 'normal' | 'grande' | 'extra';
}

export const VisualBridge = ({ mensaje, quienHabla, tipo, fontSize = 'grande' }: VisualBridgeProps) => {
  
  // Mapeo de tamaños para accesibilidad visual
  const sizes = {
    normal: 'text-xl',
    grande: 'text-3xl',
    extra: 'text-5xl'
  };

  if (!mensaje) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`w-full max-w-2xl mx-auto p-8 rounded-[40px] shadow-2xl border-4 focus:outline-none focus:ring-4 focus:ring-blue-300 ${
          tipo === 'asistente' 
            ? 'bg-white border-blue-500 text-slate-800' 
            : 'bg-blue-600 border-blue-400 text-white'
        }`}
        role="region"
        aria-live="polite"
        aria-label={`Mensaje de ${quienHabla}: ${mensaje}`}
      >
        <p className={`uppercase font-black tracking-widest mb-4 opacity-60 text-xs`}>
          {quienHabla} {tipo === 'asistente' ? 'DICE' : 'ESCRIBIÓ'}:
        </p>
        <p className={`${sizes[fontSize]} font-bold leading-tight`}>
          "{mensaje}"
        </p>
      </motion.div>
    </AnimatePresence>
  );
};