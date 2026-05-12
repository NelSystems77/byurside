import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from './components/Dashboard';
import { CaregiverDashboard } from './components/CaregiverDashboard';
import { ProactiveHeart } from './components/ProactiveHeart';
import { RoleSelector } from './components/RoleSelector';
import { AuthProvider, useAuth } from './context/AuthContext';

function AppContent() {
  const { loading } = useAuth();
  const [esperandoConfirmacion, setEsperandoConfirmacion] = useState<{ tipo: string; id: string; nombre: string } | null>(null);

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium animate-pulse">Preparando ByUrSide...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <Routes>
        {/* PANTALLA DE SELECCIÓN DE ROL */}
        <Route path="/" element={<RoleSelector />} />

        {/* VISTA DEL PACIENTE */}
        <Route
          path="/paciente"
          element={
            <>
              <ProactiveHeart setEsperandoConfirmacion={setEsperandoConfirmacion} />
              <Dashboard
                esperandoConfirmacion={esperandoConfirmacion}
                setEsperandoConfirmacion={setEsperandoConfirmacion}
              />
            </>
          }
        />

        {/* VISTA DEL FAMILIAR / CUIDADOR */}
        <Route path="/familiar" element={<CaregiverDashboard />} />

        {/* Compatibilidad con rutas antiguas */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
