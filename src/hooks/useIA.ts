import { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from 'openai';
import { db } from "../firebase/config";
import { 
  collection, addDoc, query, orderBy, 
  limit, onSnapshot, serverTimestamp, getDocs 
} from "firebase/firestore";

// Hooks de apoyo
import { useAuth } from '../context/AuthContext';
import { useSalud } from './useSalud';
import { useBiblia } from './useBiblia';
import { useMemoria } from './useMemoria';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY; 
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY, dangerouslyAllowBrowser: true }) : null;
const groq = GROQ_API_KEY ? new OpenAI({ apiKey: GROQ_API_KEY, baseURL: "https://api.groq.com/openai/v1", dangerouslyAllowBrowser: true }) : null;
const openRouterEnabled = Boolean(OPENROUTER_API_KEY);

const OPENROUTER_URL = "https://openrouter.ai/v1/chat/completions";
const OPENROUTER_MODEL = "gpt-4o-mini";
const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
];

// 1. CATEGORÍAS ENRIQUECIDAS (RECUPERADAS AL 100%)
const CATEGORIAS = {
  SALUD: ['pastilla', 'remedio', 'medicamento', 'dosis', 'medicina', 'tratamiento', 'presión', 'azúcar', 'pastillas', 'doctor'],
  BIBLIA: ['biblia', 'dios', 'fe', 'jesús', 'versículo', 'palabra', 'rezar', 'salmo', 'lectura', 'evangelio', 'oración'],
  COMPRAS: [
    'anote', 'falta', 'necesito', 'comprar', 'súper', 'lista', 'ponga', 'apunte',
    'aceite', 'pan', 'leche', 'huevos', 'traiga', 'ocupo', 'ocupaba', 'necesitamos',
    'comprame', 'quiero', 'traes', 'atun', 'galletas', 'chocolate', 'mandado', 'antojo',
    'comprarme', 'traeme', 'póngame', 'un', 'una', 'litro', 'kilo'
  ],
  EMERGENCIA: ['ayuda', 'socorro', 'emergencia', 'me caí', 'me siento mal', 'sos', 'auxilio', 'dolor'],
  AGUA: ['agua', 'vaso', 'hidraté', 'tomé agua', 'bebí', 'bebi', 'tomé un vaso', 'me tomé', 'toma de agua']
};

export const useIA = () => {
  const { profile } = useAuth();
  const pacienteId = profile?.rol === 'paciente' ? profile.uid : profile?.pacienteId;
  const { obtenerMedicinasConfiguradas } = useSalud();
  const { obtenerLecturaHoy } = useBiblia();
  const { guardarUbicacion, buscarObjeto } = useMemoria();
  
  const [historial, setHistorial] = useState<any[]>([]);
  const [memoriaSemantica, setMemoriaSemantica] = useState("");

  const generarRespuestaDeDesarrollo = async (mensaje: string): Promise<string> => {
    const texto = mensaje.toLowerCase();
    const [meds, biblia] = await Promise.all([obtenerMedicinasConfiguradas(), obtenerLecturaHoy()]);
    const resumenMeds = meds.length ? `Hoy tiene: ${meds.map((m: any) => m.nombre).join(", ")}.` : "No hay medicinas registradas.";
    const resumenBiblia = biblia?.referencia ? `El versículo de hoy es ${biblia.referencia}.` : "No hay lectura bíblica disponible.";

    if (CATEGORIAS.EMERGENCIA.some(s => texto.includes(s))) {
      return `En modo desarrollo, no puedo enviar ayuda real, pero detecté una emergencia. Por favor revise la interfaz de la app o contacte a su familia.`;
    }
    if (CATEGORIAS.COMPRAS.some(s => texto.includes(s))) {
      return `Estoy en modo desarrollo. Ya anoté su pedido en la lista de compras. ${resumenMeds}`;
    }
    if (CATEGORIAS.SALUD.some(s => texto.includes(s))) {
      return `Estoy en modo desarrollo. ${resumenMeds}`;
    }
    if (CATEGORIAS.BIBLIA.some(s => texto.includes(s))) {
      return `Estoy en modo desarrollo. ${resumenBiblia}`;
    }

    return `Estoy en modo desarrollo y no tengo IA conectada. Pruebe algo como "¿Qué medicina tomo hoy?" o "Añade pan a mi lista de compras".`;
  };

  // Función auxiliar para llamar a IA con fallback
  const llamarIA = async (prompt: string, historial: any[]): Promise<string> => {
    const [systemPart, userPart] = prompt.split('\n\nUsuario dice:');
    const baseMessages = [
      { role: 'system', content: (systemPart || '').trim() },
      ...historial.map(h => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.parts?.[0]?.text || h.text })),
      { role: 'user', content: (userPart || prompt).trim() }
    ] as any;

    // 1) Gemini
    for (const geminiModel of GEMINI_MODELS) {
      try {
        const model = genAI.getGenerativeModel({ model: geminiModel });
        const chat = model.startChat({ history: historial });
        const result = await chat.sendMessage(prompt);
        return result.response.text();
      } catch (modelError: any) {
        const msg = modelError?.message || '';
        if (msg.includes('not found') || msg.includes('not found for API version')) {
          continue; // try next Gemini model
        }
        // 429 = cuota de cuenta agotada → no tiene sentido probar otros modelos del mismo proyecto
        console.warn(`Gemini ${geminiModel} no disponible (${modelError?.status || 'error'}), saltando a Groq.`);
        break;
      }
    }

    // 2) Groq (cuota gratuita generosa)
    if (groq) {
      const groqModels = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
      for (const groqModel of groqModels) {
        try {
          const completion = await groq.chat.completions.create({
            model: groqModel,
            messages: baseMessages as any,
            max_tokens: 300
          });
          return completion.choices?.[0]?.message?.content?.trim() || 'Lo siento, no pude procesar tu mensaje.';
        } catch (groqError: any) {
          console.warn(`Groq ${groqModel} falló:`, groqError?.message || groqError);
        }
      }
    }

    // 3) OpenAI — un solo intento (429 de cuota agotada no mejora con retries)
    if (openai) {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: baseMessages as any,
          max_tokens: 300
        });
        return completion.choices?.[0]?.message?.content?.trim() || 'Lo siento, no pude procesar tu mensaje.';
      } catch (openaiError: any) {
        console.warn("OpenAI falló:", openaiError?.message || openaiError);
      }
    }

    // 4) Fallback a reglas locales (dev y producción)
    const message = userPart?.trim() || prompt;
    return await generarRespuestaDeDesarrollo(message);
  };

  // --- A. FUNCIÓN DE VOZ (TEXT-TO-SPEECH) ---
  const hablar = (texto: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = 'es-MX';
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    window.speechSynthesis.speak(utterance);
  };

  // --- B. SINCRONIZACIÓN DE CONTEXTO ---
  useEffect(() => {
    if (!pacienteId) return;
    const q = query(collection(db, "usuarios", pacienteId, "chat_history"), orderBy("timestamp", "asc"), limit(12));
    return onSnapshot(q, (snap) => {
      setHistorial(snap.docs.map(doc => ({ role: doc.data().role, parts: [{ text: doc.data().text }] })));
    });
  }, [pacienteId]);

  useEffect(() => {
    const fetchMemoria = async () => {
      if (!pacienteId) return;
      const q = query(collection(db, "usuarios", pacienteId, "semantic_memory"), orderBy("fecha", "desc"), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) setMemoriaSemantica(snap.docs[0].data().resumen);
    };
    fetchMemoria();
  }, [pacienteId]);

  // --- C. CEREBRO LOCAL (RECUPERADO Y AMPLIADO) ---
  const procesarLocalmente = async (mensaje: string): Promise<string | null> => {
    const m = mensaje.toLowerCase();

    // 1. Emergencias (Prioridad 1)
    if (CATEGORIAS.EMERGENCIA.some(s => m.includes(s))) {
      await addDoc(collection(db, "usuarios", pacienteId, "alerts"), {
        mensaje: `${profile?.pacienteNombre} dice: "${mensaje}"`,
        nivel: 'critico', resuelta: false, createdAt: serverTimestamp()
      });
      return `¡${profile?.honorifico} ${profile?.pacienteNombre}! Tranquilo, ya le mandé un aviso urgente a su familia. Mantenga la calma, por favor.`;
    }

    // 2. Identidad Offline
    if (!navigator.onLine) {
      if (m.includes("quién") && m.includes("eres")) return `Soy ${profile?.asistenteNombre}, su asistente. Ahorita no tengo internet, pero aquí sigo cuidándolo.`;
      return "Viera que me quedé sin internet ahorita.";
    }

    // 3. Memoria de Objetos (Guardar) 👈 INTEGRACIÓN NUEVA
    if (m.includes("guardé") || m.includes("puse") || (m.includes("recuerde que") && m.includes("está"))) {
      if (m.includes("en el") || m.includes("en la")) {
        const partes = m.split(/ en el | en la /);
        const objeto = partes[0].replace(/guardé |puse |recuerde que /gi, "").trim();
        const lugar = partes[1].trim();
        return guardarUbicacion(objeto, lugar);
      }
    }

    // 4. Memoria de Objetos (Buscar) 👈 INTEGRACIÓN NUEVA
    if (m.includes("donde") && (m.includes("está") || m.includes("dejé"))) {
      const objetoABuscar = m.split("está ")[1] || m.split("dejé ")[1];
      if (objetoABuscar) {
        const respuesta = buscarObjeto(objetoABuscar.replace("?", "").trim());
        if (!respuesta.includes("no tengo anotado")) return respuesta;
      }
    }

    // 5. Toma de agua
    const verbosAgua = ['tomé', 'tome', 'bebí', 'bebi', 'me tomé', 'me tome', 'hidraté', 'hidrate'];
    if (CATEGORIAS.AGUA.some(s => m.includes(s)) && verbosAgua.some(v => m.includes(v))) {
      await addDoc(collection(db, "usuarios", pacienteId!, "water_intake"), {
        ml: 250,
        registradoPor: 'Danay (Voz)',
        createdAt: serverTimestamp()
      });
      return `¡Muy bien ${profile?.honorifico} ${profile?.pacienteNombre}! Ya anoté que tomó su agüita. Mantenerse hidratado es muy importante para la salud.`;
    }

    return null;
  };

  // --- D. PROCESAMIENTO PRINCIPAL (Mantiene Limpieza de Ruido original) ---
  const procesarComando = async (mensaje: string, contexto?: string): Promise<string> => {
    if (!pacienteId || !profile) return "Viera que me perdí un momentico...";
    
    const respuestaLocal = await procesarLocalmente(mensaje);
    if (respuestaLocal) return respuestaLocal;

    const comando = mensaje.toLowerCase();
    let reporteAccion = "";

    try {
      // 1. LÓGICA DE COMPRAS (Mantiene Regex y Ruido Original)
      if (CATEGORIAS.COMPRAS.some(s => comando.includes(s))) {
        const ruido = [
          profile.asistenteNombre.toLowerCase(), 'ana', 'viera que', 'ocupaba', 'ocupo', 
          'necesito', 'un', 'una', 'unos', 'unas', 'anote', 'ponga', 'apunte', 
          'en la lista', 'quiero', 'traeme', 'comprame', 'comprar', 'falta', 'comprarme', 'traes'
        ];
        
        let productoFinal = comando;
        ruido.forEach(word => {
          productoFinal = productoFinal.replace(new RegExp(`\\b${word}\\b`, 'gi'), "");
        });

        const nombreLimpio = productoFinal
          .replace(/ah no te lo por favor|mira que me dieron ganas de|anótelo por favor/gi, "")
          .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
          .trim();

        if (nombreLimpio.length > 1) {
          await addDoc(collection(db, "usuarios", pacienteId, "shopping_lists"), {
            name: nombreLimpio, qty: 1, unit: 'Unid.', addedBy: 'Danay (Voz)', bought: false, createdAt: serverTimestamp() 
          });
          reporteAccion = `[CONFIRMACIÓN: El producto "${nombreLimpio}" fue anotado]`;
        }
      }

      // 2. LÓGICA DE BIENESTAR (Mantiene Categorización original)
      if (contexto === 'sentimiento' || comando.includes('me siento')) {
        let sentimientoDetectado = 'neutral';
        if (comando.includes('contento') || comando.includes('feliz') || comando.includes('bien')) sentimientoDetectado = 'contento';
        if (comando.includes('triste') || comando.includes('solo') || comando.includes('mal')) sentimientoDetectado = 'triste';

        await addDoc(collection(db, "usuarios", pacienteId, "wellbeing"), {
          registrarSentimiento: sentimientoDetectado, nota: mensaje, createdAt: serverTimestamp() 
        });
        reporteAccion = `[CONFIRMACIÓN: Se registró sentimiento ${sentimientoDetectado}]`;
      }

      // 3. PERSISTENCIA Y GEMINI
      await addDoc(collection(db, "usuarios", pacienteId, "chat_history"), {
        role: "user", text: mensaje, timestamp: serverTimestamp()
      });

      const [meds, biblia] = await Promise.all([obtenerMedicinasConfiguradas(), obtenerLecturaHoy()]);
      const memoriaObjetos = localStorage.getItem('memoria_objetos') || '{}';

      const promptFluidez = `
        Identidad: Eres ${profile.asistenteNombre}, la asistente de confianza de ${profile.honorifico} ${profile.pacienteNombre}.
        Tono: Dulce, maternal, costarricense.
        Contexto Extra: 
        - Medicinas: ${meds.map((m: any) => m.nombre).join(", ")}
        - Biblia: ${biblia?.referencia}
        - Memoria Semántica: ${memoriaSemantica}
        - Memoria de Objetos: ${memoriaObjetos}
        Acción sistema: ${reporteAccion}.
        REGLA: Solo confirma una acción si "Acción sistema" tiene datos.
      `;

      const respuestaIA = await llamarIA(`${promptFluidez}\n\nUsuario dice: ${mensaje}`, historial);

      await addDoc(collection(db, "usuarios", pacienteId, "chat_history"), {
        role: "model", text: respuestaIA, timestamp: serverTimestamp()
      });

      return respuestaIA;

    } catch (error) {
      console.error("Error en useIA:", error);
      return `Viera que me dio un hipo tecnológico, ${profile.honorifico}.`;
    }
  };

  return { hablar, procesarComando };
};