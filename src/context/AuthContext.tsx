import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { seedDevData } from '../firebase/seedDev';

// 1. DEFINICIÓN DEL PERFIL (El "Mapa" de identidad)
export interface UserProfile {
  uid: string;
  rol: 'paciente' | 'caregiver'; 
  usuarioNombre?: string;
  pacienteNombre?: string;
  pacienteId?: string;
  familiarNombre?: string;
  familiarId?: string;
  honorifico?: string;
  asistenteNombre?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  profile: null, 
  loading: true 
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const seedingDone = useRef(false);

  useEffect(() => {
    // 2. VIGILANTE DE SESIÓN (Firebase Auth)
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // --- CASO: USUARIO LOGUEADO ---
        const profileRef = doc(db, "usuarios", currentUser.uid);
        const unsubProfile = onSnapshot(profileRef, (docSnap) => {
          if (docSnap.exists()) {
            setProfile({ 
              ...docSnap.data(), 
              uid: currentUser.uid 
            } as UserProfile);
          }
          setLoading(false);
        });
        return () => unsubProfile();

      } else {
        // --- 3. MODO DESARROLLO / PRUEBAS MÓVILES (SIN LOGIN) 📱 ---
        console.warn("🔧 Modo desarrollo activado - usando perfil local de prueba");
        
        // Perfil de desarrollo hardcoded para testing sin Firebase
        const perfilDesarrollo: UserProfile = {
          uid: "dev_paciente_principal",
          rol: 'paciente', // Cambiar a 'paciente' para probar la vista del usuario
          usuarioNombre: "Ana",
          pacienteNombre: "Carlos",
          pacienteId: "dev_paciente_principal",
          familiarNombre: "Ana",
          asistenteNombre: "Danay",
          honorifico: "Don"
        };
        
        console.log("✅ Perfil de desarrollo cargado:", perfilDesarrollo);
        setProfile(perfilDesarrollo);
        
        // Ejecutar seeding automático en desarrollo (solo una vez)
        if (!seedingDone.current) {
          seedingDone.current = true;
          console.log("🌱 Ejecutando seeding automático de datos de desarrollo...");
          seedDevData().catch(error => {
            console.warn("⚠️ Error en seeding automático (no crítico):", error);
          });
        }
        
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);