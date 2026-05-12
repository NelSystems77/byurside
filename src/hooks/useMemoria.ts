// src/hooks/useMemoria.ts
export const useMemoria = () => {
  
  const guardarUbicacion = (objeto: string, lugar: string) => {
    const memoriaActual = JSON.parse(localStorage.getItem('memoria_objetos') || '{}');
    memoriaActual[objeto.toLowerCase()] = lugar;
    localStorage.setItem('memoria_objetos', JSON.stringify(memoriaActual));
    return `Entendido, Don Carlos. Ya recordaré que su ${objeto} está en ${lugar}.`;
  };

  const buscarObjeto = (objeto: string) => {
    const memoriaActual = JSON.parse(localStorage.getItem('memoria_objetos') || '{}');
    const lugar = memoriaActual[objeto.toLowerCase()];
    
    if (lugar) {
      return `Claro, Don Carlos. Usted me pidió que le recordara que su ${objeto} está en ${lugar}.`;
    }
    return `Vaya, no tengo anotado dónde está el ${objeto}. ¿Gusta que lo anotemos ahora?`;
  };

  return { guardarUbicacion, buscarObjeto };
};