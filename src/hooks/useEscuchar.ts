import { useState, useCallback, useRef } from 'react';

// Detectamos el motor de voz del navegador (Chrome o Safari/iOS)
const Recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export const useEscuchar = () => {
  const [escuchando, setEscuchando] = useState(false);
  const [transcripcion, setTranscripcion] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [modoOffline, setModoOffline] = useState(false);
  const recognitionRef = useRef<any>(null);

  const limpiarTranscripcion = useCallback(() => {
    setTranscripcion('');
    setError(null);
  }, []);

  // --- 1.6. FUNCIÓN PARA VERIFICAR CONECTIVIDAD ---
  const verificarConexion = useCallback(async (): Promise<boolean> => {
    const tieneConexion = navigator.onLine;
    if (tieneConexion) {
      setModoOffline(false);
      return true;
    }

    if (import.meta.env.DEV) {
      console.info("ℹ️ Desarrollo: Funcionamiento sin conexión habilitado para testing");
      setModoOffline(true);
      return true;
    }

    setModoOffline(false);
    return false;
  }, []);

  // --- 1. FUNCIÓN PARA DETENER (La que faltaba) ---
  const detenerEscucha = useCallback(() => {
    if (recognitionRef.current && escuchando) {
      recognitionRef.current.stop(); // 👈 Corta la escucha al soltar el dedo
      setEscuchando(false);
    }
  }, [escuchando]);

  const iniciarEscucha = useCallback(async () => {
    if (!Recognition) {
      alert("Lo siento, este navegador no permite el reconocimiento de voz.");
      return;
    }

    if (escuchando) return;

    // Verificar conexión antes de iniciar
    const conectado = await verificarConexion();
    if (!conectado) {
      setError('Modo offline activado - Usa el campo de texto para escribir tus mensajes.');
      return;
    }

    if (!recognitionRef.current) {
      recognitionRef.current = new Recognition();
      recognitionRef.current.lang = 'es-CR'; // Acento costarricense
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onstart = () => {
        setEscuchando(true);
        setTranscripcion('');
        setError(null); // Limpiar errores anteriores
      };

      recognitionRef.current.onresult = (event: any) => {
        const texto = event.results[0][0].transcript;
        setTranscripcion(texto);
      };

      recognitionRef.current.onerror = (event: any) => {
        let mensajeError = '';

        switch (event.error) {
          case 'network':
            mensajeError = 'Error de conexión. Verifica tu conexión a internet.';
            console.info("ℹ️ Reconocimiento de voz: Error de conexión detectado (esperado en desarrollo)");
            break;
          case 'aborted':
            mensajeError = 'Escucha cancelada.';
            console.debug("🔇 Escucha cancelada por el usuario");
            break;
          case 'no-speech':
            mensajeError = 'No se detectó voz. Intenta hablar más cerca del micrófono.';
            console.debug("🔇 No se detectó voz en el período de escucha");
            break;
          case 'audio-capture':
            mensajeError = 'No se puede acceder al micrófono. Verifica los permisos.';
            console.warn("🎤 Problema de acceso al micrófono - verificar permisos");
            break;
          case 'not-allowed':
            mensajeError = 'Permiso de micrófono denegado. Habilítalo en la configuración del navegador.';
            console.warn("🚫 Permiso de micrófono denegado por el usuario");
            break;
          default:
            mensajeError = `Error de voz: ${event.error}`;
            console.warn("⚠️ Error desconocido en reconocimiento de voz:", event.error);
        }

        setError(mensajeError);
        setEscuchando(false);
      };

      recognitionRef.current.onend = () => {
        setEscuchando(false);
      };
    }

    try {
      recognitionRef.current.start();
    } catch (e) {
      // Si hay un error por estar ya iniciado, lo reiniciamos limpiamente
      recognitionRef.current.stop();
      console.log("Reiniciando canal de voz...");
    }
  }, [escuchando, verificarConexion]);

  // --- 1.7. FUNCIÓN PARA SIMULAR VOZ EN DESARROLLO ---
  const simularVoz = useCallback((textoSimulado: string) => {
    if (modoOffline && import.meta.env.DEV) {
      setTranscripcion(textoSimulado);
      setError(null);
      console.info(`🎭 Voz simulada: "${textoSimulado}"`);
    }
  }, [modoOffline]);

  // --- 1.5. FUNCIÓN PARA REINTENTAR CONEXIÓN ---
  const reintentarEscucha = useCallback(() => {
    setError(null);
    // Pequeño delay antes de reintentar
    setTimeout(() => {
      iniciarEscucha();
    }, 1000);
  }, [iniciarEscucha]);

  // --- 2. RETORNO CON LA FUNCIÓN INCLUIDA ---
  return {
    escuchando,
    transcripcion,
    error,
    modoOffline,
    iniciarEscucha,
    detenerEscucha, // 👈 Ahora Dashboard.tsx ya puede verla
    reintentarEscucha,
    simularVoz,
    limpiarTranscripcion
  };
};