import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useVoz } from '../hooks/useVoz';
import { useEscuchar } from '../hooks/useEscuchar';
import { useIA } from '../hooks/useIA';
import { useSalud } from '../hooks/useSalud';
import { useAgua } from '../hooks/useAgua';
import { VisualBridge } from './VisualBridge';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, Volume2, ShieldCheck, HeartPulse, X, Phone,
  Wifi, WifiOff, Send, AlertCircle, RotateCcw, Droplets
} from 'lucide-react';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface DashboardProps {
  esperandoConfirmacion: { tipo: string; id: string; nombre: string } | null;
  setEsperandoConfirmacion: (val: { tipo: string; id: string; nombre: string } | null) => void;
}

export const Dashboard = ({ esperandoConfirmacion, setEsperandoConfirmacion }: DashboardProps) => {
  const { profile, loading } = useAuth();
  const { hablar, unlock, estaHablando, vocesListas } = useVoz();
  const { escuchando, transcripcion, transcripcionInterim, error: errorVoz, modoOffline, iniciarEscucha, detenerEscucha, reintentarEscucha, simularVoz, limpiarTranscripcion } = useEscuchar();
  const { descontarDosis } = useSalud();
  const { procesarComando } = useIA();
  const { registrarAgua, consumoHoy, porcentajeMeta } = useAgua();

  const [online, setOnline] = useState(navigator.onLine);
  const [yaSaludado, setYaSaludado] = useState(false);
  const [mostrarFicha, setMostrarFicha] = useState(false);
  const [ultimoMensajeAsistente, setUltimoMensajeAsistente] = useState('');
  const [estaProcesando, setEstaProcesando] = useState(false);
  const [mostrarAgua, setMostrarAgua] = useState(false);
  const [modoSOS, setModoSOS] = useState(false);

  const procesandoRef = useRef(false);
  const modoSOSRef = useRef(false);

  const pacienteId = profile?.rol === 'paciente' ? profile.uid : profile?.pacienteId;

  const emitirRespuesta = (mensaje: string) => {
    setUltimoMensajeAsistente(mensaje);
    hablar(mensaje);
  };

  // --- RED ---
  useEffect(() => {
    const handleStatus = () => setOnline(navigator.onLine);
    window.addEventListener('offline', handleStatus);
    window.addEventListener('online', handleStatus);
    return () => {
      window.removeEventListener('offline', handleStatus);
      window.removeEventListener('online', handleStatus);
    };
  }, []);

  // --- SALUDO INICIAL ---
  useEffect(() => {
    if (vocesListas && !yaSaludado && !loading && profile) {
      const saludo = `Hola ${profile.honorifico} ${profile.pacienteNombre}, ya estoy aquí. Soy ${profile.asistenteNombre}. ¿En qué puedo ayudarle?`;
      emitirRespuesta(saludo);
      setYaSaludado(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vocesListas, yaSaludado, loading, profile]);

  // --- TEXTO ---
  const handleProcesarTexto = async (mensaje: string) => {
    if (!mensaje.trim() || estaHablando || procesandoRef.current) return;
    procesandoRef.current = true;
    setEstaProcesando(true);
    try {
      const respuesta = await procesarComando(mensaje);
      emitirRespuesta(respuesta);
    } catch {
      emitirRespuesta(`Viera que me dio un hipo tecnológico, ${profile?.honorifico || ''}.`);
    } finally {
      procesandoRef.current = false;
      setEstaProcesando(false);
    }
  };

  // --- AGUA ---
  const handleRegistrarAgua = async (ml: number) => {
    const ok = await registrarAgua(ml);
    if (ok) {
      const vasos = ml === 250 ? 'un vaso' : ml === 500 ? 'medio litro' : 'un litro';
      emitirRespuesta(`Muy bien ${profile?.honorifico} ${profile?.pacienteNombre}, ya anoté que tomó ${vasos} de agua. ¡Qué bueno mantenerse hidratado!`);
    }
  };

  // --- MICRÓFONO ---
  const alPresionarMicro = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (estaHablando || procesandoRef.current) return;
    unlock(); // Unlock iOS audio context on first user gesture so hablar() works async
    iniciarEscucha();
  };

  const alSoltarMicro = () => {
    detenerEscucha();
  };

  // --- SOS CON VOZ ---
  // Al presionar SOS: desbloquea audio iOS, abre el modal y arranca a escuchar
  // en "modo SOS" — la transcripción se envía como alerta a Firestore en lugar de
  // pasar por el asistente de IA.
  const alPresionarSOS = () => {
    unlock();
    setMostrarFicha(true);
    modoSOSRef.current = true;
    setModoSOS(true);
    iniciarEscucha();
  };

  const cerrarModalSOS = () => {
    setMostrarFicha(false);
    if (modoSOSRef.current) {
      modoSOSRef.current = false;
      setModoSOS(false);
      detenerEscucha();
    }
  };

  // Si el micrófono falla en medio de SOS (offline, permiso denegado, etc.), salimos del modo SOS
  // para no dejar el modal colgado en estado "Preparando micrófono..."
  useEffect(() => {
    if (modoSOS && errorVoz) {
      modoSOSRef.current = false;
      setModoSOS(false);
    }
  }, [errorVoz, modoSOS]);

  // --- PROCESAMIENTO DE VOZ ---
  useEffect(() => {
    const procesarEntradaVoz = async () => {
      if (!transcripcion || escuchando || procesandoRef.current) return;
      procesandoRef.current = true;
      setEstaProcesando(true);
      const textoAProcesar = transcripcion;
      limpiarTranscripcion();

      try {
        // SOS: enviar lo que dijo el paciente como alerta urgente al cuidador
        if (modoSOSRef.current && pacienteId) {
          modoSOSRef.current = false;
          setModoSOS(false);
          await addDoc(collection(db, 'usuarios', pacienteId, 'alerts'), {
            tipo: 'emergencia',
            nivel: 'critico',
            mensaje: `🆘 ${profile?.pacienteNombre} necesita ayuda: "${textoAProcesar}"`,
            createdAt: serverTimestamp(),
            resuelta: false,
          });
          emitirRespuesta(`Listo ${profile?.honorifico} ${profile?.pacienteNombre}. Ya le avisé a ${profile?.familiarNombre || 'su familia'} lo que me dijo.`);
          return;
        }

        if (esperandoConfirmacion?.tipo === 'pastilla') {
          const m = textoAProcesar.toLowerCase();
          if (m.includes('sí') || m.includes('si') || m.includes('ya') || m.includes('listo') || m.includes('claro')) {
            await descontarDosis(esperandoConfirmacion.id);
            emitirRespuesta(`Excelente. Ya anoté su ${esperandoConfirmacion.nombre}.`);
            setEsperandoConfirmacion(null);
            return;
          }
        }
        const respuesta = await procesarComando(textoAProcesar);
        emitirRespuesta(respuesta);
      } catch {
        emitirRespuesta(`Viera que me dio un hipo tecnológico, ${profile?.honorifico || ''}.`);
      } finally {
        procesandoRef.current = false;
        setEstaProcesando(false);
      }
    };
    procesarEntradaVoz();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcripcion, escuchando]);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50 font-black text-slate-400 uppercase tracking-widest text-xs">
      Sincronizando con {profile?.asistenteNombre || 'ByUrSide'}...
    </div>
  );

  const bgColor = !online
    ? 'bg-slate-100'
    : estaProcesando
    ? 'bg-blue-50'
    : esperandoConfirmacion
    ? 'bg-red-50'
    : 'bg-slate-50';

  return (
    <div className={`h-screen w-full flex flex-col transition-colors duration-1000 overflow-hidden ${bgColor}`}>

      {/* --- INDICADOR DE CONECTIVIDAD DE VOZ --- */}
      <div className="fixed top-4 right-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium shadow-lg cursor-help ${
            modoOffline
              ? 'bg-amber-100 text-amber-800 border border-amber-200'
              : 'bg-green-100 text-green-800 border border-green-200'
          }`}
          title={modoOffline ? 'Modo offline: usa el campo de texto.' : 'Conectado: voz disponible.'}
        >
          {modoOffline ? (
            <><WifiOff size={14} /><span>Offline</span></>
          ) : (
            <><Wifi size={14} /><span>Online</span></>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {!online && (
          <motion.div initial={{ y: -50 }} animate={{ y: 0 }} exit={{ y: -50 }}
            className="absolute top-0 w-full bg-amber-500 text-white p-2 flex items-center justify-center gap-2 z-[3000] shadow-lg">
            <ShieldCheck size={14} />
            <p className="text-[9px] font-black uppercase tracking-widest">Protección Local Activada</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- HEADER --- */}
      <header className="w-full flex items-center justify-between px-6 pt-10 pb-4 shrink-0">
        <button
          onClick={() => setMostrarAgua(v => !v)}
          className="w-12 h-12 bg-blue-50 hover:bg-blue-100 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-colors"
          aria-label="Ver consumo de agua"
          title="Registrar agua"
        >
          <Droplets size={20} className={porcentajeMeta >= 100 ? 'text-blue-600' : 'text-blue-400'} />
          <span className="text-[11px] font-black text-blue-500">{Math.round(consumoHoy / 1000 * 10) / 10}L</span>
        </button>

        <div className="text-center">
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">ByUrSide</h1>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">
            {profile?.asistenteNombre} cuidando a {profile?.honorifico} {profile?.pacienteNombre}
          </p>
        </div>

        <button
          onClick={alPresionarSOS}
          className="w-12 h-12 bg-red-600 hover:bg-red-700 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all focus:outline-none focus:ring-4 focus:ring-red-300"
          aria-label="Abrir ficha de emergencia SOS"
        >
          <HeartPulse size={24} />
        </button>
      </header>

      {/* --- ÁREA DE AGUA (DESPLEGABLE) --- */}
      <AnimatePresence>
        {mostrarAgua && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden shrink-0"
          >
            <div className="px-6 pb-4">
              <div className="bg-white rounded-[24px] p-4 shadow-sm border border-blue-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Droplets size={18} className="text-blue-500" />
                    <p className="font-black text-sm text-slate-800 uppercase tracking-tight">Hidratación de hoy</p>
                  </div>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    {consumoHoy}ml / 2000ml
                  </span>
                </div>

                {/* Barra de progreso */}
                <div className="w-full bg-slate-100 rounded-full h-2.5 mb-4 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${porcentajeMeta}%` }}
                    className={`h-2.5 rounded-full transition-all ${porcentajeMeta >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                  />
                </div>

                {/* Botones de registro */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { ml: 250, label: '1 Vaso', sub: '250ml' },
                    { ml: 500, label: '½ Litro', sub: '500ml' },
                    { ml: 1000, label: '1 Litro', sub: '1000ml' },
                  ].map(({ ml, label, sub }) => (
                    <button
                      key={ml}
                      onClick={() => { handleRegistrarAgua(ml); setMostrarAgua(false); }}
                      className="bg-blue-50 hover:bg-blue-100 active:scale-95 text-blue-700 rounded-2xl py-3 flex flex-col items-center gap-1 transition-all"
                      aria-label={`Registrar ${label} de agua`}
                    >
                      <span className="text-lg">💧</span>
                      <span className="font-black text-xs uppercase">{label}</span>
                      <span className="text-xs text-blue-400 font-bold">{sub}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- ÁREA PRINCIPAL --- */}
      <main className="flex-1 w-full flex flex-col items-center justify-center p-6 space-y-6 relative overflow-hidden">
        <VisualBridge
          mensaje={
            escuchando && transcripcionInterim
              ? transcripcionInterim
              : escuchando
              ? 'Escuchando...'
              : estaProcesando
              ? 'Pensando...'
              : ultimoMensajeAsistente
          }
          quienHabla={
            escuchando
              ? (profile?.pacienteNombre || 'Usted')
              : (profile?.asistenteNombre || 'Asistente')
          }
          tipo={escuchando ? 'usuario' : 'asistente'}
          fontSize="grande"
        />

        <div className="relative py-4 shrink-0">
          <AnimatePresence>
            {(escuchando || estaProcesando || esperandoConfirmacion) && (
              <motion.div
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 1.6, opacity: 0 }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className={`absolute inset-0 rounded-full ${
                  !online ? 'bg-amber-300' : estaProcesando ? 'bg-blue-300' : esperandoConfirmacion ? 'bg-red-400' : 'bg-blue-400'
                }`}
              />
            )}
          </AnimatePresence>

          {modoOffline && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow-lg"
            >
              Offline
            </motion.div>
          )}

          <motion.button
            onTouchStart={alPresionarMicro}
            onTouchEnd={alSoltarMicro}
            onTouchCancel={alSoltarMicro}
            onMouseDown={alPresionarMicro}
            onMouseUp={alSoltarMicro}
            onMouseLeave={alSoltarMicro}
            onContextMenu={(e) => e.preventDefault()}
            animate={{ scale: estaHablando || escuchando || estaProcesando ? 1.1 : 1 }}
            className={`relative w-40 h-40 rounded-full flex items-center justify-center shadow-2xl z-10 transition-all duration-500 bg-white border-8 focus:outline-none focus:ring-4 focus:ring-blue-300 ${
              !online
                ? 'border-amber-200'
                : estaProcesando
                ? 'border-blue-100'
                : esperandoConfirmacion
                ? 'border-red-200'
                : 'border-slate-100'
            }`}
            aria-label={estaHablando ? 'Hablando' : estaProcesando ? 'Procesando' : escuchando ? 'Escuchando, suelte para detener' : 'Presione para hablar'}
            disabled={estaHablando}
          >
            {estaHablando ? (
              <Volume2 size={50} className="text-emerald-500 animate-pulse" />
            ) : estaProcesando ? (
              <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-blue-600" />
            ) : (
              <Mic size={50} className={!online ? 'text-amber-500' : escuchando ? 'text-blue-600 animate-pulse' : 'text-slate-300'} />
            )}
          </motion.button>
        </div>

        {/* --- ERROR DE VOZ --- */}
        {errorVoz && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center max-w-sm mx-auto"
            role="alert"
            aria-live="polite"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <AlertCircle size={16} />
              <span className="font-medium">
                {modoOffline && errorVoz.includes('offline')
                  ? 'Modo offline — Usa el campo de texto.'
                  : errorVoz}
              </span>
            </div>
            {modoOffline && import.meta.env.DEV && (
              <div className="flex gap-2 justify-center">
                <button onClick={() => simularVoz('Hola Danay, ¿cómo estás?')}
                  className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-xs font-medium transition-colors">
                  🎭 Simular "Hola"
                </button>
                <button onClick={() => simularVoz('Tomé un vaso de agua')}
                  className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-xs font-medium transition-colors">
                  💧 Simular "Agua"
                </button>
              </div>
            )}
            {errorVoz.includes('conexión') && !modoOffline && (
              <button onClick={reintentarEscucha}
                className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-medium transition-colors">
                <RotateCcw size={12} />
                Reintentar
              </button>
            )}
          </motion.div>
        )}
      </main>

      {/* --- TECLADO --- */}
      <footer className="px-6 pb-12 w-full max-w-lg mx-auto shrink-0">
        <div className="relative group">
          <input
            type="text"
            placeholder={`Escríbale algo a ${profile?.asistenteNombre}...`}
            className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 pr-14 text-slate-700 font-medium shadow-sm focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all outline-none text-xl"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const input = e.target as HTMLInputElement;
                if (input.value.trim()) {
                  handleProcesarTexto(input.value);
                  input.value = '';
                }
              }
            }}
            disabled={estaProcesando || estaHablando}
            aria-label={`Mensaje de texto para ${profile?.asistenteNombre}`}
          />
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-blue-500 hover:text-blue-700 hover:scale-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={(e) => {
              const input = (e.currentTarget.previousSibling as HTMLInputElement);
              if (input.value.trim()) {
                handleProcesarTexto(input.value);
                input.value = '';
              }
            }}
            disabled={estaProcesando || estaHablando}
            aria-label="Enviar mensaje"
          >
            <Send size={20} />
          </button>
        </div>
        <p className="text-center mt-4 font-bold text-sm text-slate-400">
          {online ? 'Toque el micrófono o escriba su mensaje' : 'Modo fuera de línea'}
        </p>
      </footer>

      {/* --- FICHA SOS --- */}
      <AnimatePresence>
        {mostrarFicha && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[4000] bg-slate-900/90 backdrop-blur-md p-6 flex items-center justify-center">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white w-full max-w-lg rounded-[40px] p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-red-600 uppercase tracking-tighter">Ficha SOS</h2>
                <button onClick={cerrarModalSOS} className="p-2 bg-slate-100 rounded-full"><X /></button>
              </div>
              <div className="space-y-4">

                {/* Indicador de escucha activa en modo SOS */}
                {modoSOS && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
                    {escuchando ? (
                      <>
                        <Mic size={28} className="mx-auto text-red-500 animate-pulse mb-2" />
                        <p className="text-red-700 font-bold text-sm">Escuchando... diga lo que necesita</p>
                        {transcripcionInterim && (
                          <p className="text-xs text-red-400 mt-1 italic">"{transcripcionInterim}"</p>
                        )}
                      </>
                    ) : estaProcesando ? (
                      <>
                        <div className="animate-spin rounded-full h-7 w-7 border-b-4 border-red-600 mx-auto mb-2" />
                        <p className="text-red-700 font-bold text-sm">Enviando alerta a {profile?.familiarNombre || 'su familia'}...</p>
                      </>
                    ) : (
                      <p className="text-red-400 text-sm">Preparando micrófono...</p>
                    )}
                  </div>
                )}

                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-sm font-bold text-slate-400 uppercase">Paciente</p>
                  <p className="text-2xl font-bold">{profile?.honorifico} {profile?.pacienteNombre}</p>
                </div>
                <a
                  href={`tel:${profile?.familiarId}`}
                  className="w-full bg-emerald-500 text-white p-6 rounded-2xl flex items-center justify-center gap-4 shadow-xl active:scale-95 transition-transform"
                >
                  <Phone />
                  <span className="font-black uppercase tracking-widest">Llamar a Emergencia</span>
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
