import { useState, useCallback, useRef, useEffect } from 'react';

const Recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

// Edge usa ASR de Microsoft que no soporta es-CR → cae en error network.
// Safari tampoco lo soporta. Para ambos usamos es-ES como fallback estable.
const getSpeechLang = (): string => {
  const ua = navigator.userAgent;
  if (ua.includes('Edg/')) return 'es-ES';
  if (/^((?!chrome|android).)*safari/i.test(ua)) return 'es-ES';
  return 'es-CR';
};

const MAX_RETRIES = 2;

export const useEscuchar = () => {
  const [escuchando, setEscuchando] = useState(false);
  const [transcripcion, setTranscripcion] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [modoOffline, setModoOffline] = useState(false);
  const [autoRetry, setAutoRetry] = useState(0);
  const recognitionRef = useRef<any>(null);
  const retryCountRef = useRef(0);

  const limpiarTranscripcion = useCallback(() => {
    setTranscripcion('');
    setError(null);
  }, []);

  const verificarConexion = useCallback(async (): Promise<boolean> => {
    if (navigator.onLine) {
      setModoOffline(false);
      return true;
    }
    if (import.meta.env.DEV) {
      console.info('ℹ️ Desarrollo: modo sin conexión habilitado para testing');
      setModoOffline(true);
      return true;
    }
    setModoOffline(false);
    return false;
  }, []);

  const detenerEscucha = useCallback(() => {
    if (recognitionRef.current && escuchando) {
      try {
        recognitionRef.current.stop();
      } catch {
        recognitionRef.current?.abort?.();
      }
      setEscuchando(false);
    }
  }, [escuchando]);

  // Crea siempre una instancia limpia. Resetear recognitionRef a null antes de llamar.
  const crearInstancia = useCallback(() => {
    const rec = new Recognition();
    rec.lang = getSpeechLang();
    rec.continuous = false;
    rec.interimResults = false;

    rec.onstart = () => {
      setEscuchando(true);
      setTranscripcion('');
      setError(null);
      retryCountRef.current = 0;
    };

    rec.onresult = (event: any) => {
      setTranscripcion(event.results[0][0].transcript);
    };

    rec.onerror = (event: any) => {
      recognitionRef.current = null; // Siempre descartar instancia rota

      // network en Edge es transitorio: reintentar automáticamente
      if (event.error === 'network' && retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current++;
        console.info(`ℹ️ Voz: error de red, reintentando (${retryCountRef.current}/${MAX_RETRIES})…`);
        setEscuchando(false);
        setAutoRetry(n => n + 1);
        return;
      }

      retryCountRef.current = 0;

      const mensajes: Record<string, string> = {
        network: 'No se pudo conectar al servicio de voz. Use el campo de texto.',
        'audio-capture': 'No se puede acceder al micrófono. Verifique los permisos.',
        'not-allowed': 'Permiso de micrófono denegado. Habilítelo en la configuración del navegador.',
        'no-speech': 'No se detectó voz. Hable más cerca del micrófono.',
      };

      const msg = mensajes[event.error];
      if (msg) setError(msg);
      setEscuchando(false);
    };

    rec.onend = () => setEscuchando(false);

    return rec;
  }, []);

  const iniciarEscucha = useCallback(async () => {
    if (!Recognition) {
      setError('Este navegador no admite reconocimiento de voz. Use el campo de texto.');
      return;
    }

    if (escuchando) return;

    const conectado = await verificarConexion();
    if (!conectado) {
      setError('Modo offline — Use el campo de texto para escribir su mensaje.');
      return;
    }

    if (!recognitionRef.current) {
      recognitionRef.current = crearInstancia();
    }

    try {
      recognitionRef.current.start();
    } catch {
      recognitionRef.current = null;
      console.debug('Reiniciando canal de voz...');
    }
  }, [escuchando, verificarConexion, crearInstancia]);

  // Dispara reintentos automáticos tras error de red (autoRetry se incrementa en onerror)
  useEffect(() => {
    if (autoRetry === 0) return;
    const t = setTimeout(iniciarEscucha, 700);
    return () => clearTimeout(t);
  }, [autoRetry, iniciarEscucha]);

  const simularVoz = useCallback((textoSimulado: string) => {
    if (modoOffline && import.meta.env.DEV) {
      setTranscripcion(textoSimulado);
      setError(null);
      console.info(`🎭 Voz simulada: "${textoSimulado}"`);
    }
  }, [modoOffline]);

  const reintentarEscucha = useCallback(() => {
    setError(null);
    retryCountRef.current = 0;
    recognitionRef.current = null;
    setTimeout(iniciarEscucha, 500);
  }, [iniciarEscucha]);

  return {
    escuchando,
    transcripcion,
    error,
    modoOffline,
    iniciarEscucha,
    detenerEscucha,
    reintentarEscucha,
    simularVoz,
    limpiarTranscripcion
  };
};
