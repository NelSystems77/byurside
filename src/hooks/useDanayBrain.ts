import { useState } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useSalud } from './useSalud';
import { useBiblia } from './useBiblia';
import { useCompras } from './useCompras';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

export const useIA = (perfil: any) => {
  const { obtenerMedicinasConfiguradas } = useSalud();
  const { obtenerLecturaHoy } = useBiblia();
  const { agregarItemPorVoz } = useCompras();

  // --- ESTADO DE MEMORIA DE SESIÓN ---
  const [historial, setHistorial] = useState<any[]>([]);

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: `
      Eres ${perfil.asistenteNombre}, asistente de ${perfil.usuarioTratamiento} ${perfil.usuarioNombre} en Costa Rica. 
      Tu tono es dulce, respetuoso y usas lenguaje tico (pura vida, viera que, con mucho gusto).
      
      CONTEXTO ACTUAL DEL PACIENTE:
      - Nombre: ${perfil.usuarioNombre}
      - Tratamiento: ${perfil.usuarioTratamiento}
      - Tu nombre: ${perfil.asistenteNombre}

      REGLAS DE MEMORIA:
      1. Si te preguntan "¿Y a qué hora?" o "¿Cómo era?", revisa el historial para saber si hablaban de medicina o la biblia.
      2. Si Don Carlos quiere anotar algo, dile que ya lo pusiste en la lista de Ana.
    `
  });

  const procesarComando = async (mensaje: string): Promise<string> => {
    try {
      // 1. OBTENER CONTEXTO DE DATOS REALES (Meds, Biblia)
      // Esto es para que la IA siempre tenga la información fresca de Firebase
      const meds = await obtenerMedicinasConfiguradas();
      const biblia = await obtenerLecturaHoy();
      
      const contextoExtra = `
        INFO EN TIEMPO REAL:
        - Medicinas de hoy: ${meds.map(m => `${m.nombre} a las ${m.horaToma}`).join(", ")}
        - Versículo de hoy: ${biblia?.referencia}: "${biblia?.contenido}"
      `;

      // 2. INICIAR CHAT CON MEMORIA
      const chat = model.startChat({
        history: historial,
      });

      // Enviamos el mensaje mezclado con el contexto de la base de datos
      const promptFinal = `Contexto del sistema: ${contextoExtra}. Usuario dice: ${mensaje}`;
      const result = await chat.sendMessage(promptFinal);
      const respuestaIA = result.response.text();

      // 3. ACTUALIZAR HISTORIAL (Guardamos la pregunta y la respuesta)
      setHistorial([
        ...historial,
        { role: "user", parts: [{ text: mensaje }] },
        { role: "model", parts: [{ text: respuestaIA }] },
      ]);

      return respuestaIA;

    } catch (error) {
      console.error("Error en el cerebro de Danay:", error);
      return `Viera que me dio un poquito de hipo tecnológico, ${perfil.usuarioTratamiento}. ¿Me lo repite?`;
    }
  };

  return { procesarComando };
};