import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VisualBridgeProps {
  mensaje: string;
  quienHabla: string;
  tipo: 'asistente' | 'usuario';
  fontSize?: 'normal' | 'grande' | 'extra';
}

export const VisualBridge = ({ mensaje, quienHabla, tipo, fontSize = 'grande' }: VisualBridgeProps) => {

  // Tamaños responsive para accesibilidad visual
  const sizes = {
    normal: 'text-base sm:text-xl',
    grande: 'text-lg sm:text-2xl lg:text-3xl',
    extra: 'text-2xl sm:text-4xl lg:text-5xl'
  };

  if (!mensaje) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`w-full max-w-2xl mx-auto p-4 sm:p-6 lg:p-8 rounded-3xl sm:rounded-[40px] shadow-2xl border-4 focus:outline-none focus:ring-4 focus:ring-blue-300 ${
          tipo === 'asistente'
            ? 'bg-white border-blue-500 text-slate-800'
            : 'bg-blue-600 border-blue-400 text-white'
        }`}
        role="region"
        aria-live="polite"
        aria-label={`Mensaje de ${quienHabla}: ${mensaje}`}
      >
        <p className="uppercase font-black tracking-widest mb-2 sm:mb-3 opacity-60 text-xs">
          {quienHabla} {tipo === 'asistente' ? 'DICE' : 'ESCRIBIÓ'}:
        </p>
        {/* Área scrollable para respuestas largas */}
        <div className="max-h-[32vh] sm:max-h-[38vh] overflow-y-auto overscroll-contain pr-1">
          <p className={`${sizes[fontSize]} font-bold leading-snug`}>
            "{mensaje}"
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};