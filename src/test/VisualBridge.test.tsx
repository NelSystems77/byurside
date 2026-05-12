import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VisualBridge } from '../components/VisualBridge';

describe('VisualBridge — Componente de accesibilidad', () => {
  it('renderiza el mensaje del asistente', () => {
    render(<VisualBridge mensaje="Buenos días Don Carlos" quienHabla="Danay" tipo="asistente" />);
    // El componente envuelve el mensaje en comillas: "mensaje"
    expect(screen.getByText(/Buenos días Don Carlos/)).toBeInTheDocument();
  });

  it('muestra el nombre del emisor', () => {
    render(<VisualBridge mensaje="¿Cómo está?" quienHabla="Danay" tipo="asistente" />);
    expect(screen.getByText(/Danay/i)).toBeInTheDocument();
  });

  it('no muestra nada cuando el mensaje está vacío', () => {
    const { container } = render(<VisualBridge mensaje="" quienHabla="Danay" tipo="asistente" />);
    // Retorna null cuando mensaje está vacío — el contenedor queda vacío
    expect(container.firstChild).toBeNull();
  });

  it('renderiza tipo "usuario" sin errores', () => {
    render(<VisualBridge mensaje="Hola" quienHabla="Don Carlos" tipo="usuario" />);
    expect(screen.getByText(/Hola/)).toBeInTheDocument();
  });

  it('aplica fontSize "grande" sin errores', () => {
    render(<VisualBridge mensaje="Texto grande" quienHabla="Danay" tipo="asistente" fontSize="grande" />);
    expect(screen.getByText(/Texto grande/)).toBeInTheDocument();
  });

  it('aplica fontSize "extra" sin errores', () => {
    render(<VisualBridge mensaje="Texto extra" quienHabla="Danay" tipo="asistente" fontSize="extra" />);
    // fontSize "extra" aplica text-5xl
    const region = screen.getByRole('region');
    expect(region.querySelector('.text-5xl')).toBeInTheDocument();
  });
});
