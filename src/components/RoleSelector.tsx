import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, User, Users, ShieldCheck } from 'lucide-react';

export const RoleSelector = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-6 overflow-hidden relative">

      {/* Decoración de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-sm flex flex-col items-center"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="mb-2 w-20 h-20 bg-white/10 rounded-[28px] flex items-center justify-center shadow-2xl border border-white/20 backdrop-blur-sm"
        >
          <Heart className="text-red-400 fill-red-400" size={40} />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-4xl font-black text-white tracking-tighter uppercase mb-1"
        >
          ByUrSide
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-slate-400 text-sm font-bold uppercase tracking-[0.2em] mb-12"
        >
          Cuidado inteligente · Siempre contigo
        </motion.p>

        {/* Pregunta */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-slate-300 font-semibold text-lg text-center mb-8"
        >
          ¿Cómo ingresa hoy?
        </motion.p>

        {/* Botón Paciente */}
        <motion.button
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7, type: 'spring', stiffness: 150 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/paciente')}
          className="w-full mb-4 bg-white text-slate-900 rounded-[28px] p-6 flex items-center gap-5 shadow-2xl shadow-black/30 hover:bg-blue-50 transition-colors group"
          aria-label="Entrar como paciente"
        >
          <div className="w-14 h-14 bg-blue-100 group-hover:bg-blue-200 rounded-2xl flex items-center justify-center shrink-0 transition-colors">
            <User className="text-blue-600" size={28} />
          </div>
          <div className="text-left">
            <p className="font-black text-xl text-slate-900 tracking-tight">Soy el Paciente</p>
            <p className="text-slate-500 text-sm font-medium mt-0.5">
              Hablar con Danay · Recordatorios · Emergencias
            </p>
          </div>
        </motion.button>

        {/* Botón Cuidador */}
        <motion.button
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8, type: 'spring', stiffness: 150 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/familiar')}
          className="w-full bg-slate-700 text-white rounded-[28px] p-6 flex items-center gap-5 shadow-2xl shadow-black/30 hover:bg-slate-600 transition-colors border border-slate-600 group"
          aria-label="Entrar como cuidador"
        >
          <div className="w-14 h-14 bg-white/10 group-hover:bg-white/20 rounded-2xl flex items-center justify-center shrink-0 transition-colors">
            <Users className="text-purple-300" size={28} />
          </div>
          <div className="text-left">
            <p className="font-black text-xl text-white tracking-tight">Soy Cuidador</p>
            <p className="text-slate-400 text-sm font-medium mt-0.5">
              Panel de control · Alertas · Medicamentos
            </p>
          </div>
        </motion.button>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
          className="mt-10 flex items-center gap-2 text-slate-500"
        >
          <ShieldCheck size={14} />
          <p className="text-xs font-bold uppercase tracking-widest">
            Datos protegidos · Modo offline disponible
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};
