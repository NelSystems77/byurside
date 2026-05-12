import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useGPS } from '../hooks/useGPS';
import { useAuth } from '../context/AuthContext'; // 👈 Usamos el cimiento de identidad
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ShieldCheck, AlertTriangle, RefreshCw } from 'lucide-react';
import L from 'leaflet';

// --- CONFIGURACIÓN DE ICONOS (Solución para rutas rotas en Build) ---
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- COMPONENTE: RE-CENTRADOR E INVALIDADOR DE TAMAÑO (Fix iOS) ---
const MapController = ({ coords }: { coords: { lat: number, lng: number } }) => {
  const map = useMap();
  
  useEffect(() => {
    // 👈 ESTA ES LA SOLUCIÓN PARA iOS:
    // Forzamos a Leaflet a recalcular el tamaño del contenedor tras el render
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 400);

    map.setView([coords.lat, coords.lng], map.getZoom());
    return () => clearTimeout(timer);
  }, [coords, map]);

  return null;
};

// --- CÁLCULO DE DISTANCIA (Fórmula Haversine) ---
const obtenerDistanciaMts = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3;
  const p1 = lat1 * Math.PI / 180;
  const p2 = lat2 * Math.PI / 180;
  const deltaP = (lat2 - lat1) * Math.PI / 180;
  const deltaL = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(deltaP / 2) * Math.sin(deltaP / 2) +
            Math.cos(p1) * Math.cos(p2) *
            Math.sin(deltaL / 2) * Math.sin(deltaL / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
};

export const CaregiverMap = () => {
  const { profile } = useAuth();
  const { ubicacion, escucharPosicion } = useGPS(); // Ya no pasamos ID manual
  const alertaEnviadaRef = useRef(false);

  const pacienteId = profile?.rol === 'paciente' ? profile.uid : profile?.pacienteId;

  // Coordenadas de la casa y radio de seguridad
  const casaCoords: [number, number] = [9.9333, -84.0833];
  const radioSeguro = 150; 

  useEffect(() => {
    if (!pacienteId) return;
    const unsub = escucharPosicion();
    return () => unsub();
  }, [pacienteId]);

  const distanciaActual = obtenerDistanciaMts(
    ubicacion.lat, 
    ubicacion.lng, 
    casaCoords[0], 
    casaCoords[1]
  );

  const estaFuera = distanciaActual > radioSeguro;

  // --- LÓGICA DE ALERTA DE SEGURIDAD ---
  useEffect(() => {
    const dispararAlertaGPS = async () => {
      if (estaFuera && !alertaEnviadaRef.current && pacienteId) {
        alertaEnviadaRef.current = true;
        
        await addDoc(collection(db, "usuarios", pacienteId, "alerts"), {
          tipo: 'emergencia',
          subtipo: 'geofencing',
          nivel: 'critico',
          mensaje: `🚨 GPS: ${profile?.honorifico} ${profile?.pacienteNombre} ha salido del radio seguro.`,
          fecha: serverTimestamp(),
          resuelta: false,
          coords: { lat: ubicacion.lat, lng: ubicacion.lng }
        });
      } else if (!estaFuera) {
        alertaEnviadaRef.current = false;
      }
    };
    dispararAlertaGPS();
  }, [estaFuera, ubicacion, profile, pacienteId]);

  return (
    <div className="h-full w-full flex flex-col relative bg-slate-100 overflow-hidden">
      
      {/* HEADER DE ESTADO */}
      <div className="absolute top-4 left-4 right-4 z-[1000] bg-white/95 backdrop-blur-md p-4 rounded-3xl shadow-xl border border-white flex items-center justify-between">
        <div>
          <h3 className="font-black text-slate-800 uppercase text-[10px] tracking-widest">Localización Activa</h3>
          <p className={`text-[12px] font-bold flex items-center gap-1.5 ${estaFuera ? 'text-red-600' : 'text-emerald-600'}`}>
            <span className={`w-2 h-2 rounded-full animate-pulse ${estaFuera ? 'bg-red-500' : 'bg-emerald-500'}`}></span> 
            {estaFuera ? 'FUERA DE RANGO' : `CUIDANDO A ${profile?.pacienteNombre?.toUpperCase()}`}
          </p>
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-slate-100 p-2.5 rounded-2xl text-slate-400 active:rotate-180 transition-transform duration-500"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* CONTENEDOR DEL MAPA */}
      <div className="flex-1 z-0 relative">
        <MapContainer 
          center={[ubicacion.lat, ubicacion.lng]} 
          zoom={17} 
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          whenReady={() => setMapReady(true)}
        >
          <TileLayer 
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap'
          />
          
          <Marker position={[ubicacion.lat, ubicacion.lng]} />
          
          <Circle 
            center={casaCoords}
            radius={radioSeguro}
            pathOptions={{ 
              color: estaFuera ? '#EF4444' : '#10B981', 
              fillColor: estaFuera ? '#EF4444' : '#10B981', 
              fillOpacity: 0.15,
              weight: 2
            }}
          />

          <MapController coords={ubicacion} />
        </MapContainer>
      </div>

      {/* CARD DE SEGURIDAD DINÁMICA */}
      <div className="absolute bottom-10 left-4 right-4 z-[1000]">
        <div className={`p-5 rounded-[32px] shadow-2xl flex items-center gap-4 border transition-all duration-500 ${
          estaFuera ? 'bg-red-600 text-white border-red-400' : 'bg-white text-slate-800 border-white'
        }`}>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
            estaFuera ? 'bg-white text-red-600' : 'bg-emerald-100 text-emerald-600'
          }`}>
            {estaFuera ? <AlertTriangle size={28} /> : <ShieldCheck size={28} />}
          </div>
          <div className="flex-1">
            <p className={`text-[10px] font-black uppercase tracking-tight ${estaFuera ? 'text-red-100' : 'text-slate-400'}`}>
              Estatus: {distanciaActual.toFixed(0)}m de casa
            </p>
            <p className="text-[11px] font-bold leading-tight">
              {estaFuera 
                ? `🚨 ¡ATENCIÓN! El paciente ha salido del límite.` 
                : `${profile?.pacienteNombre} está en su zona segura.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};