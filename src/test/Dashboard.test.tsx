import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Dashboard } from '../components/Dashboard';

// ─── Mocks de dependencias ───────────────────────────────────────────────────
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    profile: {
      uid: 'dev_paciente_principal',
      rol: 'paciente',
      pacienteNombre: 'Carlos',
      honorifico: 'Don',
      asistenteNombre: 'Danay',
      familiarId: '506-8888-9999',
    },
    loading: false,
  })),
}));

vi.mock('../hooks/useVoz', () => ({
  useVoz: vi.fn(() => ({
    hablar: vi.fn(),
    estaHablando: false,
    vocesListas: true,
  })),
}));

vi.mock('../hooks/useEscuchar', () => ({
  useEscuchar: vi.fn(() => ({
    escuchando: false,
    transcripcion: '',
    error: null,
    modoOffline: false,
    iniciarEscucha: vi.fn(),
    detenerEscucha: vi.fn(),
    reintentarEscucha: vi.fn(),
    simularVoz: vi.fn(),
    limpiarTranscripcion: vi.fn(),
  })),
}));

vi.mock('../hooks/useIA', () => ({
  useIA: vi.fn(() => ({
    hablar: vi.fn(),
    procesarComando: vi.fn(() => Promise.resolve('Respuesta de prueba de Danay')),
  })),
}));

vi.mock('../hooks/useSalud', () => ({
  useSalud: vi.fn(() => ({
    descontarDosis: vi.fn(() => Promise.resolve(true)),
  })),
}));

vi.mock('../hooks/useAgua', () => ({
  useAgua: vi.fn(() => ({
    registrarAgua: vi.fn(() => Promise.resolve(true)),
    consumoHoy: 500,
    porcentajeMeta: 25,
    META_DIARIA_ML: 2000,
    calcularConsumoHoy: vi.fn(() => Promise.resolve(500)),
  })),
}));

const defaultProps = {
  esperandoConfirmacion: null,
  setEsperandoConfirmacion: vi.fn(),
};

const renderDashboard = (props = {}) =>
  render(
    <MemoryRouter>
      <Dashboard {...defaultProps} {...props} />
    </MemoryRouter>
  );

describe('Dashboard — Vista principal del paciente', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  // ─── Renderizado básico ──────────────────────────────────────────────────
  describe('Renderizado', () => {
    it('muestra el título ByUrSide', () => {
      renderDashboard();
      expect(screen.getByText('ByUrSide')).toBeInTheDocument();
    });

    it('muestra el nombre del paciente y el asistente en el header', () => {
      renderDashboard();
      expect(screen.getByText(/Danay cuidando a Don Carlos/i)).toBeInTheDocument();
    });

    it('muestra el botón SOS (HeartPulse)', () => {
      renderDashboard();
      expect(screen.getByLabelText('Abrir ficha de emergencia SOS')).toBeInTheDocument();
    });

    it('muestra el botón de micrófono', () => {
      renderDashboard();
      expect(screen.getByLabelText(/Presione para hablar/i)).toBeInTheDocument();
    });

    it('muestra el campo de texto para escribir', () => {
      renderDashboard();
      expect(screen.getByLabelText(/Mensaje de texto para Danay/i)).toBeInTheDocument();
    });

    it('muestra el consumo de agua en el header (0.5L)', () => {
      renderDashboard();
      expect(screen.getByText('0.5L')).toBeInTheDocument();
    });

    it('muestra el indicador de conectividad Online', () => {
      renderDashboard();
      expect(screen.getByText('Online')).toBeInTheDocument();
    });
  });

  // ─── Panel de agua ───────────────────────────────────────────────────────
  describe('Panel de hidratación', () => {
    it('abre el panel de agua al hacer clic en el botón de agua', async () => {
      renderDashboard();
      fireEvent.click(screen.getByLabelText('Ver consumo de agua'));
      await waitFor(() => {
        expect(screen.getByText('Hidratación de hoy')).toBeInTheDocument();
      });
    });

    it('muestra los botones 1 Vaso, ½ Litro, 1 Litro en el panel', async () => {
      renderDashboard();
      fireEvent.click(screen.getByLabelText('Ver consumo de agua'));
      await waitFor(() => {
        expect(screen.getByText('1 Vaso')).toBeInTheDocument();
        expect(screen.getByText('½ Litro')).toBeInTheDocument();
        expect(screen.getByText('1 Litro')).toBeInTheDocument();
      });
    });

    it('muestra el consumo actual vs meta (500ml / 2000ml)', async () => {
      renderDashboard();
      fireEvent.click(screen.getByLabelText('Ver consumo de agua'));
      await waitFor(() => {
        expect(screen.getByText('500ml / 2000ml')).toBeInTheDocument();
      });
    });

    it('clic en "1 Vaso" llama a registrarAgua con 250ml', async () => {
      const { useAgua } = await import('../hooks/useAgua');
      const mockRegistrar = vi.fn(() => Promise.resolve(true));
      vi.mocked(useAgua).mockReturnValue({
        registrarAgua: mockRegistrar,
        consumoHoy: 500,
        porcentajeMeta: 25,
        META_DIARIA_ML: 2000,
        calcularConsumoHoy: vi.fn(),
      });

      renderDashboard();
      fireEvent.click(screen.getByLabelText('Ver consumo de agua'));
      await waitFor(() => screen.getByLabelText('Registrar 1 Vaso de agua'));
      fireEvent.click(screen.getByLabelText('Registrar 1 Vaso de agua'));

      await waitFor(() => { expect(mockRegistrar).toHaveBeenCalledWith(250); });
    });
  });

  // ─── Modal SOS ───────────────────────────────────────────────────────────
  describe('Ficha SOS', () => {
    it('abre el modal SOS al hacer clic en el botón de emergencia', async () => {
      renderDashboard();
      fireEvent.click(screen.getByLabelText('Abrir ficha de emergencia SOS'));
      await waitFor(() => {
        expect(screen.getByText('Ficha SOS')).toBeInTheDocument();
      });
    });

    it('muestra el nombre del paciente en la ficha SOS', async () => {
      renderDashboard();
      fireEvent.click(screen.getByLabelText('Abrir ficha de emergencia SOS'));
      await waitFor(() => {
        expect(screen.getByText('Don Carlos')).toBeInTheDocument();
      });
    });

    it('cierra el modal SOS al hacer clic en X', async () => {
      renderDashboard();
      fireEvent.click(screen.getByLabelText('Abrir ficha de emergencia SOS'));
      await waitFor(() => screen.getByText('Ficha SOS'));
      fireEvent.click(screen.getByRole('button', { name: '' })); // botón X
      await waitFor(() => {
        expect(screen.queryByText('Ficha SOS')).toBeNull();
      });
    });

    it('el botón de llamada tiene href tel:', async () => {
      renderDashboard();
      fireEvent.click(screen.getByLabelText('Abrir ficha de emergencia SOS'));
      await waitFor(() => {
        const link = screen.getByText(/Llamar a Emergencia/i).closest('a');
        expect(link).toHaveAttribute('href', 'tel:506-8888-9999');
      });
    });
  });

  // ─── Input de texto ──────────────────────────────────────────────────────
  describe('Entrada de texto', () => {
    it('placeholder usa el nombre del asistente', () => {
      renderDashboard();
      const input = screen.getByLabelText(/Mensaje de texto para Danay/i);
      expect(input).toHaveAttribute('placeholder', 'Escríbale algo a Danay...');
    });

    it('Enter con texto llama a procesarComando', async () => {
      const { useIA } = await import('../hooks/useIA');
      const mockProcesar = vi.fn(() => Promise.resolve('Hola Don Carlos'));
      vi.mocked(useIA).mockReturnValue({ procesarComando: mockProcesar, hablar: vi.fn() });

      renderDashboard();
      const input = screen.getByLabelText(/Mensaje de texto para Danay/i);
      fireEvent.change(input, { target: { value: 'Hola Danay' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      await waitFor(() => { expect(mockProcesar).toHaveBeenCalledWith('Hola Danay'); });
    });
  });

  // ─── Estado esperandoConfirmacion ─────────────────────────────────────────
  describe('Estado esperandoConfirmacion (recordatorio de pastilla)', () => {
    it('cambia el fondo a rojo cuando hay confirmación pendiente', () => {
      const { container } = renderDashboard({
        esperandoConfirmacion: { tipo: 'pastilla', id: 'med-1', nombre: 'Aspirina' },
      });
      // El contenedor principal debe tener bg-red-50
      expect(container.querySelector('.bg-red-50')).toBeInTheDocument();
    });
  });
});
