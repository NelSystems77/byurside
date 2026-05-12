import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RoleSelector } from '../components/RoleSelector';

// Capturamos las navegaciones
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const renderSelector = () =>
  render(
    <MemoryRouter>
      <RoleSelector />
    </MemoryRouter>
  );

describe('RoleSelector — Pantalla de selección de rol', () => {
  it('muestra el título ByUrSide', () => {
    renderSelector();
    expect(screen.getByText('ByUrSide')).toBeInTheDocument();
  });

  it('muestra la pregunta de ingreso', () => {
    renderSelector();
    expect(screen.getByText('¿Cómo ingresa hoy?')).toBeInTheDocument();
  });

  it('muestra el botón "Soy el Paciente"', () => {
    renderSelector();
    expect(screen.getByText('Soy el Paciente')).toBeInTheDocument();
  });

  it('muestra el botón "Soy Cuidador"', () => {
    renderSelector();
    expect(screen.getByText('Soy Cuidador')).toBeInTheDocument();
  });

  it('navega a /paciente al hacer clic en "Soy el Paciente"', () => {
    renderSelector();
    fireEvent.click(screen.getByLabelText('Entrar como paciente'));
    expect(mockNavigate).toHaveBeenCalledWith('/paciente');
  });

  it('navega a /familiar al hacer clic en "Soy Cuidador"', () => {
    renderSelector();
    fireEvent.click(screen.getByLabelText('Entrar como cuidador'));
    expect(mockNavigate).toHaveBeenCalledWith('/familiar');
  });

  it('muestra el subtítulo "Cuidado inteligente · Siempre contigo"', () => {
    renderSelector();
    expect(screen.getByText(/Cuidado inteligente/i)).toBeInTheDocument();
  });

  it('muestra el mensaje de datos protegidos', () => {
    renderSelector();
    expect(screen.getByText(/Datos protegidos/i)).toBeInTheDocument();
  });

  it('el botón paciente tiene los aria-label de accesibilidad', () => {
    renderSelector();
    expect(screen.getByLabelText('Entrar como paciente')).toBeInTheDocument();
    expect(screen.getByLabelText('Entrar como cuidador')).toBeInTheDocument();
  });
});
