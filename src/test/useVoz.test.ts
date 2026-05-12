import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVoz } from '../hooks/useVoz';

describe('useVoz — Text-to-Speech', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hablar llama a speechSynthesis.cancel() antes de hablar (evita solapamiento)', () => {
    const { result } = renderHook(() => useVoz());
    act(() => { result.current.hablar('Hola Don Carlos'); });
    expect(window.speechSynthesis.cancel).toHaveBeenCalled();
    expect(window.speechSynthesis.speak).toHaveBeenCalled();
  });

  it('hablar configura lang es-MX en el utterance', () => {
    const { result } = renderHook(() => useVoz());
    act(() => { result.current.hablar('Buenos días'); });
    const utterance = (window.speechSynthesis.speak as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(utterance.lang).toBe('es-MX');
  });

  it('hablar configura pitch 1.1 y rate 0.85', () => {
    const { result } = renderHook(() => useVoz());
    act(() => { result.current.hablar('Prueba de voz'); });
    const utterance = (window.speechSynthesis.speak as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(utterance.pitch).toBe(1.1);
    expect(utterance.rate).toBe(0.85);
  });

  it('vocesListas es true cuando hay voces disponibles', () => {
    // Las voces están disponibles en el mock del setup
    const { result } = renderHook(() => useVoz());
    // Disparar onvoiceschanged para simular carga async de voces en Chrome
    act(() => {
      if (window.speechSynthesis.onvoiceschanged) {
        (window.speechSynthesis as any).onvoiceschanged();
      }
    });
    expect(result.current.vocesListas).toBe(true);
  });

  it('estaHablando es false al inicio', () => {
    const { result } = renderHook(() => useVoz());
    expect(result.current.estaHablando).toBe(false);
  });

  it('hablar selecciona la voz Dalia si está disponible', () => {
    const { result } = renderHook(() => useVoz());
    act(() => {
      if (window.speechSynthesis.onvoiceschanged) {
        (window.speechSynthesis as any).onvoiceschanged();
      }
    });
    act(() => { result.current.hablar('Prueba Dalia'); });
    const utterance = (window.speechSynthesis.speak as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(utterance.voice?.name).toBe('Dalia');
  });
});
