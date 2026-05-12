import { MOCK_BIBLE } from '../data/mockBible';

export const useBiblia = () => {
  
  const obtenerLecturaHoy = async () => {
    try {
      // 1. Primero intentaríamos buscar en Firebase si Ana programó algo manual
      // (Por ahora simulamos que no hay nada para usar el Plan Automático)
      
      return obtenerLecturaPlanAnual();
    } catch (error) {
      console.error("Error al obtener la Biblia:", error);
      return null;
    }
  };

  // Lógica para el Plan de Lectura 2026 Autogestionado
  const obtenerLecturaPlanAnual = () => {
    const ahora = new Date();
    const inicio = new Date(ahora.getFullYear(), 0, 0);
    const dif = ahora.getTime() - inicio.getTime();
    const unDia = 1000 * 60 * 60 * 24;
    const diaDelAño = Math.floor(dif / unDia);

    // Mapeo simple para el Mock: 
    // Cada día del año nos da un capítulo diferente del Mock
    const claves = Object.keys(MOCK_BIBLE);
    const seleccion = claves[diaDelAño % claves.length];
    const capitulo = MOCK_BIBLE[seleccion];

    return {
      referencia: `${capitulo.libro} ${capitulo.cap}`,
      contenido: capitulo.versiculos.map((v: any) => v.texto).join(" "),
      esAutomatico: true
    };
  };

  return { obtenerLecturaHoy };
};