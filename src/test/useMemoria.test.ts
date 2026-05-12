import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMemoria } from '../hooks/useMemoria';

describe('useMemoria — Memoria de objetos (localStorage)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('guardarUbicacion guarda el objeto en localStorage y retorna confirmación', () => {
    const { result } = renderHook(() => useMemoria());
    let respuesta: string;
    act(() => {
      respuesta = result.current.guardarUbicacion('llaves', 'mesa de entrada');
    });
    expect(respuesta!).toContain('llaves');
    expect(respuesta!).toContain('mesa de entrada');
    const mem = JSON.parse(window.localStorage.getItem('memoria_objetos') || '{}');
    expect(mem['llaves']).toBe('mesa de entrada');
  });

  it('buscarObjeto retorna la ubicación cuando el objeto existe', () => {
    const { result } = renderHook(() => useMemoria());
    act(() => { result.current.guardarUbicacion('anteojos', 'cuarto de baño'); });
    let respuesta: string;
    act(() => { respuesta = result.current.buscarObjeto('anteojos'); });
    expect(respuesta!).toContain('cuarto de baño');
  });

  it('buscarObjeto informa cuando el objeto no está guardado', () => {
    const { result } = renderHook(() => useMemoria());
    let respuesta: string;
    act(() => { respuesta = result.current.buscarObjeto('dinero'); });
    expect(respuesta!).toContain('no tengo anotado');
  });

  it('guardarUbicacion sobreescribe una entrada existente', () => {
    const { result } = renderHook(() => useMemoria());
    act(() => {
      result.current.guardarUbicacion('pasaporte', 'gaveta');
      result.current.guardarUbicacion('pasaporte', 'caja fuerte');
    });
    const mem = JSON.parse(window.localStorage.getItem('memoria_objetos') || '{}');
    expect(mem['pasaporte']).toBe('caja fuerte');
  });
});
