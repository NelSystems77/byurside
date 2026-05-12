import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import * as firestore from 'firebase/firestore';
import { useAgua } from '../hooks/useAgua';

// Mock AuthContext so hook gets a valid pacienteId
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    profile: {
      uid: 'dev_paciente_principal',
      rol: 'paciente',
      pacienteNombre: 'Carlos',
      honorifico: 'Don',
      asistenteNombre: 'Danay',
    },
    loading: false,
  })),
}));

describe('useAgua — Registro de hidratación', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Simular que no hay registros previos (consumo 0)
    vi.mocked(firestore.getDocs).mockResolvedValue({
      docs: [],
      empty: true,
    } as any);
  });

  it('consumoHoy inicia en 0', () => {
    const { result } = renderHook(() => useAgua());
    expect(result.current.consumoHoy).toBe(0);
  });

  it('META_DIARIA_ML es 2000', () => {
    const { result } = renderHook(() => useAgua());
    expect(result.current.META_DIARIA_ML).toBe(2000);
  });

  it('porcentajeMeta es 0 cuando consumoHoy es 0', () => {
    const { result } = renderHook(() => useAgua());
    expect(result.current.porcentajeMeta).toBe(0);
  });

  it('registrarAgua llama a addDoc con los campos correctos', async () => {
    vi.mocked(firestore.addDoc).mockResolvedValue({ id: 'water-log-1' } as any);
    const { result } = renderHook(() => useAgua());

    let ok: boolean;
    await act(async () => { ok = await result.current.registrarAgua(250); });

    expect(ok!).toBe(true);
    expect(firestore.addDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ ml: 250, registradoPor: 'Paciente' })
    );
  });

  it('registrarAgua acepta registradoPor personalizado', async () => {
    vi.mocked(firestore.addDoc).mockResolvedValue({ id: 'water-log-2' } as any);
    const { result } = renderHook(() => useAgua());

    await act(async () => { await result.current.registrarAgua(500, 'Danay (Voz)'); });

    expect(firestore.addDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ ml: 500, registradoPor: 'Danay (Voz)' })
    );
  });

  it('registrarAgua retorna false si addDoc falla', async () => {
    vi.mocked(firestore.addDoc).mockRejectedValue(new Error('Firestore error'));
    const { result } = renderHook(() => useAgua());

    let ok: boolean;
    await act(async () => { ok = await result.current.registrarAgua(250); });
    expect(ok!).toBe(false);
  });

  it('porcentajeMeta no supera 100 aunque el consumo supere la meta', async () => {
    // Simular consumo de 2500ml (por encima de la meta)
    vi.mocked(firestore.getDocs).mockResolvedValue({
      docs: [
        { data: () => ({ ml: 1000 }) },
        { data: () => ({ ml: 1000 }) },
        { data: () => ({ ml: 500 }) },
      ],
      empty: false,
    } as any);
    vi.mocked(firestore.addDoc).mockResolvedValue({ id: 'w3' } as any);
    const { result } = renderHook(() => useAgua());

    await act(async () => { await result.current.calcularConsumoHoy(); });
    expect(result.current.porcentajeMeta).toBeLessThanOrEqual(100);
  });

  it('calcularConsumoHoy suma correctamente los ml del día', async () => {
    vi.mocked(firestore.getDocs).mockResolvedValue({
      docs: [
        { data: () => ({ ml: 250 }) },
        { data: () => ({ ml: 500 }) },
        { data: () => ({ ml: 250 }) },
      ],
      empty: false,
    } as any);
    const { result } = renderHook(() => useAgua());
    let total: number;
    await act(async () => { total = await result.current.calcularConsumoHoy(); });
    expect(total!).toBe(1000);
    expect(result.current.consumoHoy).toBe(1000);
  });
});
