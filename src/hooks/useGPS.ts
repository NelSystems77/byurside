import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { doc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext'; // 👈 Identidad dinámica

export const useGPS = () => {
  const { profile } = useAuth();
  // Coordenadas iniciales (San José, Costa Rica por defecto)
  const [ubicacion, setUbicacion] = useState({ lat: 9.9333, lng: -84.0833 });

  // Determinamos quién es el paciente dueño de la ubicación
  const pacienteId = profile?.rol === 'paciente' ? profile.uid : profile?.pacienteId;

  // --- 1. FUNCIÓN PARA EL PACIENTE: Actualizar su posición ---
  const actualizarMiPosicion = () => {
    if (!navigator.geolocation || !pacienteId || profile?.rol !== 'paciente') return;

    // watchPosition mantiene una conexión activa con el satélite
    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        
        // Solo actualizamos si la precisión es decente (menos de 100 metros)
        if (accuracy < 100) {
          const userRef = doc(db, "usuarios", pacienteId);
          try {
            await updateDoc(userRef, {
              lastLocation: { 
                lat: latitude, 
                lng: longitude, 
                accuracy: accuracy,
                timestamp: serverTimestamp() // 👈 Usamos tiempo del servidor
              }
            });
          } catch (e) {
            console.error("Error al subir ubicación:", e);
          }
        }
      },
      (err) => console.error("Error GPS:", err), 
      { 
        enableHighAccuracy: true, // 👈 Vital para que use el GPS real y no solo WiFi
        distanceFilter: 10,       // Solo avisa si se movió más de 10 metros
        timeout: 10000
      }
    );

    return watchId; // Devolvemos el ID para poder apagarlo si es necesario
  };

  // --- 2. FUNCIÓN PARA EL FAMILIAR: Escuchar en tiempo real ---
  const escucharPosicion = (callback?: (loc: any) => void) => {
    if (!pacienteId) return;

    const userRef = doc(db, "usuarios", pacienteId);
    
    // onSnapshot nos permite ver el movimiento en el mapa como un punto que se mueve
    return onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().lastLocation) {
        const loc = docSnap.data().lastLocation;
        setUbicacion(loc);
        if (callback) callback(loc); // Por si el mapa necesita reaccionar
      }
    });
  };

  return { ubicacion, actualizarMiPosicion, escucharPosicion };
};