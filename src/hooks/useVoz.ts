import { useCallback, useState, useEffect, useRef } from 'react';

export const useVoz = () => {
  const [estaHablando, setEstaHablando] = useState(false);
  const [voces, setVoces] = useState<SpeechSynthesisVoice[]>([]);
  const [vocesListas, setVocesListas] = useState(false);
  // iOS Safari blocks speechSynthesis.speak() unless the audio context was first
  // "unlocked" by a synchronous call inside a user-gesture handler.
  const audioUnlockedRef = useRef(false);

  useEffect(() => {
    const cargarVoces = () => {
      const vocesDisponibles = window.speechSynthesis.getVoices();
      if (vocesDisponibles.length > 0) {
        setVoces(vocesDisponibles);
        setVocesListas(true);
      }
    };

    cargarVoces();
    // Chrome/Edge load voices asynchronously; iOS may never fire this event.
    window.speechSynthesis.onvoiceschanged = cargarVoces;

    // iOS fallback: onvoiceschanged may never fire — mark ready after a short wait
    // so the greeting and responses are not permanently blocked.
    const fallback = setTimeout(() => setVocesListas(true), 1500);
    return () => clearTimeout(fallback);
  }, []);

  // Call this inside a user-gesture handler (e.g. onTouchStart) to unlock
  // the iOS audio context. Without this, all speak() calls from async contexts
  // are silently dropped on iOS Safari.
  const unlock = useCallback(() => {
    if (audioUnlockedRef.current || !window.speechSynthesis) return;
    const silent = new SpeechSynthesisUtterance(' ');
    silent.volume = 0;
    silent.rate = 10;
    window.speechSynthesis.speak(silent);
    audioUnlockedRef.current = true;
  }, []);

  const hablar = useCallback((texto: string) => {
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(texto);

    const vozElegida =
      voces.find(v => v.name.includes('Dalia')) ||   // Windows/Azure premium
      voces.find(v => v.name.includes('Sabina')) ||   // iOS premium
      voces.find(v => v.lang.startsWith('es') && !v.name.includes('Raul') && !v.name.includes('Google español'));

    if (vozElegida) utterance.voice = vozElegida;

    utterance.lang = 'es-MX';
    utterance.pitch = 1.1;
    utterance.rate = 0.85;

    utterance.onstart = () => setEstaHablando(true);
    utterance.onend = () => setEstaHablando(false);
    utterance.onerror = (e) => {
      console.error('Error en síntesis de voz:', e);
      setEstaHablando(false);
    };

    // iOS needs a small gap after cancel() before speak() — otherwise the utterance
    // is silently dropped. A minimal timeout avoids this race condition.
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      setTimeout(() => window.speechSynthesis.speak(utterance), 50);
    } else {
      window.speechSynthesis.speak(utterance);
    }
  }, [voces]);

  return { hablar, unlock, estaHablando, vocesListas };
};