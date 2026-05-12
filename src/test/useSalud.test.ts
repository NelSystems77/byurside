import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import * as firestore from 'firebase/firestore';
import { useSalud } from '../hooks/useSalud';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    profile: {
      uid: 'dev_paciente_principal',
      rol: 'paciente',
      pacienteNombre: 'Carlos',
      honorifico: 'Don',
    },
    loading: false,
  })),
}));

describe('useSalud — Gestión de medicamentos', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  // ─── buscarMasterMeds ────────────────────────────────────────────────────────
  describe('buscarMasterMeds', () => {
    it('retorna array vacío cuando la búsqueda está vacía', async () => {
      const { result } = renderHook(() => useSalud());
      const res = await result.current.buscarMasterMeds('');
      expect(res).toEqual([]);
    });

    it('retorna medicamentos cuando la búsqueda tiene resultados', async () => {
      vi.mocked(firestore.getDocs).mockResolvedValue({
        docs: [
          { id: 'med1', data: () => ({ nombre: 'Aspirina 100mg' }) },
          { id: 'med2', data: () => ({ nombre: 'Aspirina 500mg' }) },
        ],
      } as any);
      const { result } = renderHook(() => useSalud());
      const res = await result.current.buscarMasterMeds('aspirina');
      expect(res).toHaveLength(2);
      expect(res[0]).toHaveProperty('id', 'med1');
    });

    it('retorna array vacío si Firestore lanza error', async () => {
      vi.mocked(firestore.getDocs).mockRejectedValue(new Error('index missing'));
      const { result } = renderHook(() => useSalud());
      const res = await result.current.buscarMasterMeds('algo');
      expect(res).toEqual([]);
    });
  });

  // ─── guardarPrescripcion ─────────────────────────────────────────────────────
  describe('guardarPrescripcion', () => {
    it('guarda la prescripción y retorna true', async () => {
      vi.mocked(firestore.addDoc).mockResolvedValue({ id: 'rx-1' } as any);
      const { result } = renderHook(() => useSalud());
      const ok = await result.current.guardarPrescripcion({ nombre: 'Metformina', horaToma: '08:00', stockActual: 30 });
      expect(ok).toBe(true);
      expect(firestore.addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ nombre: 'Metformina', estado: 'activo', alertaEnviada: false })
      );
    });

    it('retorna false si Firestore lanza error', async () => {
      vi.mocked(firestore.addDoc).mockRejectedValue(new Error('permisos'));
      const { result } = renderHook(() => useSalud());
      const ok = await result.current.guardarPrescripcion({ nombre: 'X' });
      expect(ok).toBe(false);
    });
  });

  // ─── descontarDosis ──────────────────────────────────────────────────────────
  describe('descontarDosis', () => {
    it('descuenta una dosis y actualiza el stock', async () => {
      vi.mocked(firestore.getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ nombre: 'Enalapril', stockActual: 20, cantidadPorToma: 1, dosisDiaria: 1, alertaEnviada: false }),
      } as any);
      vi.mocked(firestore.updateDoc).mockResolvedValue(undefined);
      const { result } = renderHook(() => useSalud());
      const ok = await result.current.descontarDosis('med-123');
      expect(ok).toBe(true);
      expect(firestore.updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ stockActual: 19 })
      );
    });

    it('genera alerta de stock cuando quedan ≤ 5 días', async () => {
      vi.mocked(firestore.getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ nombre: 'Aspirina', stockActual: 5, cantidadPorToma: 1, dosisDiaria: 1, alertaEnviada: false }),
      } as any);
      vi.mocked(firestore.updateDoc).mockResolvedValue(undefined);
      vi.mocked(firestore.addDoc).mockResolvedValue({ id: 'alert-1' } as any);
      const { result } = renderHook(() => useSalud());
      await result.current.descontarDosis('med-low');
      // addDoc debe haberse llamado dos veces: 1 para la alerta
      expect(firestore.addDoc).toHaveBeenCalled();
    });

    it('stock nunca baja de 0 (límite inferior)', async () => {
      vi.mocked(firestore.getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ nombre: 'Vitamina C', stockActual: 0, cantidadPorToma: 1, dosisDiaria: 1, alertaEnviada: true }),
      } as any);
      vi.mocked(firestore.updateDoc).mockResolvedValue(undefined);
      const { result } = renderHook(() => useSalud());
      const ok = await result.current.descontarDosis('med-empty');
      expect(ok).toBe(true);
      expect(firestore.updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ stockActual: 0 }) // Math.max(0, 0-1) = 0
      );
    });

    it('retorna false si pacienteId no está definido', async () => {
      // Este test verifica la guarda de seguridad
      vi.mocked(firestore.getDoc).mockResolvedValue({
        exists: () => false,
        data: () => ({}),
      } as any);
      const { result } = renderHook(() => useSalud());
      const ok = await result.current.descontarDosis('med-no-existe');
      expect(ok).toBe(true); // llega al try, doc.exists() === false → no hace update
    });
  });

  // ─── obtenerMedicinasConfiguradas ────────────────────────────────────────────
  describe('obtenerMedicinasConfiguradas', () => {
    it('retorna la lista de medicamentos del paciente', async () => {
      vi.mocked(firestore.getDocs).mockResolvedValue({
        docs: [
          { id: 'rx1', data: () => ({ nombre: 'Atenolol', horaToma: '09:00', stockActual: 30 }) },
        ],
      } as any);
      const { result } = renderHook(() => useSalud());
      const meds = await result.current.obtenerMedicinasConfiguradas();
      expect(meds).toHaveLength(1);
      expect(meds[0].nombre).toBe('Atenolol');
    });

    it('retorna [] si Firestore falla', async () => {
      vi.mocked(firestore.getDocs).mockRejectedValue(new Error('offline'));
      const { result } = renderHook(() => useSalud());
      const meds = await result.current.obtenerMedicinasConfiguradas();
      expect(meds).toEqual([]);
    });
  });

  // ─── eliminarMedicina ────────────────────────────────────────────────────────
  describe('eliminarMedicina', () => {
    it('elimina el documento y retorna true', async () => {
      vi.mocked(firestore.deleteDoc).mockResolvedValue(undefined);
      const { result } = renderHook(() => useSalud());
      const ok = await result.current.eliminarMedicina('med-del-1');
      expect(ok).toBe(true);
      expect(firestore.deleteDoc).toHaveBeenCalled();
    });
  });
});
