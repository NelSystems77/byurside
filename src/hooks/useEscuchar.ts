import { useState, useCallback, useRef, useEffect } from 'react';

const Recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

// es-CR only works reliably on Chrome desktop.
// iOS (Apple ASR), Android (Google ASR), Edge (Microsoft ASR) and Safari all reject it.
const getSpeechLang = (): string => {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return 'es-ES';
  if (/Android/.test(ua)) return 'es-ES';
  if (ua.includes('Edg/')) return 'es-ES';
  if (/^((?!chrome|android).)*safari/i.test(ua)) return 'es-ES';
  return 'es-CR';
};

const MAX_RETRIES = 2;

export const useEscuchar = () => {
  const [escuchando, setEscuchando] = useState(false);
  const [transcripcion, setTranscripcion] = useState('');
  const [transcripcionInterim, setTranscripcionInterim] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [modoOffline, setModoOffline] = useState(false);
  const [autoRetry, setAutoRetry] = useState(0);
  const recognitionRef = useRef<any>(null);
  const retryCountRef = useRef(0);

  useEffect(() => {
    const handleStatus = () => setModoOffline(!navigator.onLine);
    window.addEventListener('offline', handleStatus);
    window.addEventListener('online', handleStatus);
    return () => {
      window.removeEventListener('offline', handleStatus);
      window.removeEventListener('online', handleStatus);
    };
  }, []);

  const limpiarTranscripcion = useCallback(() => {
    setTranscripcion('');
    setTranscripcionInterim('');
    setError(null);
  }, []);

  // No dependency on `escuchando` state — uses only refs and stable state setters.
  // This avoids the stale-closure race where the user releases the button before
  // onstart fires (escuchando is still false) and stop() never gets called.
  const detenerEscucha = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch {
      try { recognitionRef.current?.abort?.(); } catch {}
    }
    recognitionRef.current = null;
    setEscuchando(false);
    setTranscripcionInterim('');
  }, []);

  const crearInstancia = useCallback(() => {
    const rec = new Recognition();
    rec.lang = getSpeechLang();
    rec.continuous = false;
    rec.interimResults = true;

    rec.onstart = () => {
      setEscuchando(true);
      setTranscripcion('');
      setTranscripcionInterim('');
      setError(null);
      retryCountRef.current = 0;
    };

    rec.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      if (interim) setTranscripcionInterim(interim);
      if (final) {
        setTranscripcion(final);
        setTranscripcionInterim('');
      }
    };

    rec.onerror = (event: any) => {
      recognitionRef.current = null;
      setEscuchando(false);
      setTranscripcionInterim('');

      if (event.error === 'network' && retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current++;
        console.info(`ℹ️ Voz: error de red, reintentando (${retryCountRef.current}/${MAX_RETRIES})…`);
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
    };

    rec.onend = () => {
      setEscuchando(false);
      setTranscripcionInterim('');
    };

    return rec;
  }, []);

  // IMPORTANT: Must stay synchronous (no await before .start()).
  // iOS Safari requires speech recognition to be started synchronously within
  // the same user-gesture call stack. Any await breaks that context and the
  // microphone permission/activation silently fails.
  const iniciarEscucha = useCallback(() => {
    if (!Recognition) {
      setError('Este navegador no admite reconocimiento de voz. Use el campo de texto.');
      return;
    }

    if (escuchando) return;

    const enLinea = navigator.onLine;
    setModoOffline(!enLinea);
    if (!enLinea && !import.meta.env.DEV) {
      setError('Modo offline — Use el campo de texto para escribir su mensaje.');
      return;
    }

    // Always create a fresh instance — reusing a stale one after errors causes silent failures
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
    }
    recognitionRef.current = crearInstancia();

    try {
      recognitionRef.current.start();
    } catch {
      recognitionRef.current = null;
      console.debug('Reiniciando canal de voz...');
    }
  }, [escuchando, crearInstancia]);

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
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }
    setTimeout(iniciarEscucha, 500);
  }, [iniciarEscucha]);

  return {
    escuchando,
    transcripcion,
    transcripcionInterim,
    error,
    modoOffline,
    iniciarEscucha,
    detenerEscucha,
    reintentarEscucha,
    simularVoz,
    limpiarTranscripcion
  };
};
