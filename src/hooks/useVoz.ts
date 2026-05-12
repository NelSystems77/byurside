import { useCallback, useState, useEffect } from 'react';

export const useVoz = () => {
  const [estaHablando, setEstaHablando] = useState(false);
  const [voces, setVoces] = useState<SpeechSynthesisVoice[]>([]);
  const [vocesListas, setVocesListas] = useState(false);

  useEffect(() => {
    const cargarVoces = () => {
      const vocesDisponibles = window.speechSynthesis.getVoices();
      if (vocesDisponibles.length > 0) {
        setVoces(vocesDisponibles);
        setVocesListas(true);
      }
    };

    cargarVoces();
    // Clave para Chrome y Edge que cargan las voces asincrónicamente
    window.speechSynthesis.onvoiceschanged = cargarVoces;
  }, []);

  const hablar = useCallback((texto: string) => {
    // Si no hay voces o el navegador no soporta audio, salimos
    if (!window.speechSynthesis) return;

    // 1. Limpieza total: detiene cualquier audio que se haya quedado pegado
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(texto);

    // 2. Personalidad de Danay: buscamos voces femeninas y dulces
    const vozElegida = 
      voces.find(v => v.name.includes('Dalia')) || // Voz premium en Windows/Azure
      voces.find(v => v.name.includes('Sabina')) || // Voz premium en iOS
      voces.find(v => v.lang.startsWith('es') && !v.name.includes('Raul') && !v.name.includes('Google español'));

    if (vozElegida) {
      utterance.voice = vozElegida;
    }

    // 3. Configuración para Don Carlos
    utterance.lang = 'es-MX';
    utterance.pitch = 1.1; // Tono más alto para que sea más dulce y amigable
    utterance.rate = 0.85; // Un pelito más lento para asegurar comprensión

    // 4. Control de estados
    utterance.onstart = () => setEstaHablando(true);
    utterance.onend = () => setEstaHablando(false);
    utterance.onerror = (e) => {
      console.error("Error en síntesis de voz:", e);
      setEstaHablando(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [voces, vocesListas]);

  return { hablar, estaHablando, vocesListas };
};