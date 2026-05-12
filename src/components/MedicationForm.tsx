import React, { useState, useEffect } from 'react';
import { X, Search, Pill, Clock, Syringe, MessageSquare, Database, Wind, Droplet, Activity, Eye, Layers } from 'lucide-react';
import { useSalud } from '../hooks/useSalud';

// Estructura Médica Completa (13 Categorías)
const ESTRUCTURA_MEDICA: any = {
  "1. VÍA ORAL": {
    "Sólidas": ["Tabletas simples", "Tabletas recubiertas", "Tabletas ranuradas", "Cápsulas duras", "Cápsulas blandas", "Tabletas de liberación prolongada", "Tabletas masticables", "Polvos orales", "Granulados"],
    "Líquidas": ["Jarabes", "Soluciones orales", "Suspensiones orales", "Emulsiones orales", "Gotas orales"]
  },
  "2. VÍA SUBLINGUAL / BUCAL": {
    "Bucal": ["Tabletas sublinguales", "Tabletas bucales", "Sprays sublinguales", "Películas orodispersables", "Pastillas para chupar"]
  },
  "3. VÍA PARENTERAL (Inyectable)": {
    "Intravenosa (IV)": ["Ampollas", "Viales", "Frascos ámpula"],
    "Intramuscular (IM)": ["Ampollas", "Viales"],
    "Subcutánea (SC)": ["Plumas de insulina", "Jeringas precargadas", "Viales"],
    "Intradérmica (ID)": ["Ampollas"]
  },
  "4. VÍA INHALATORIA": {
    "Respiratoria": ["Inhaladores presurizados (MDI)", "Inhaladores de polvo seco (DPI)", "Soluciones para nebulización", "Suspensiones para nebulizar"]
  },
  "5. VÍA TÓPICA / CUTÁNEA": {
    "Dermatológica": ["Cremas", "Ungüentos", "Pomadas", "Geles", "Lociones", "Espumas", "Aerosoles cutáneos", "Polvos dermatológicos", "Shampoos medicados"]
  },
  "6. VÍA TRANSDÉRMICA": {
    "Parches": ["Parches medicados (Dolor)", "Parches hormonales", "Parches de nicotina"]
  },
  "7. VÍA RECTAL": {
    "Rectal": ["Supositorios", "Enemas", "Microenemas", "Cremas rectales"]
  },
  "8. VÍA VAGINAL": {
    "Ginecológica": ["Óvulos vaginales", "Tabletas vaginales", "Cremas vaginales", "Geles vaginales", "Anillos vaginales"]
  },
  "9. VÍA NASAL": {
    "Nasal": ["Sprays nasales", "Gotas nasales", "Geles nasales"]
  },
  "10. VÍA OCULAR / ÓTICA": {
    "Ocular": ["Gotas oftálmicas", "Ungüentos oftálmicos", "Geles oftálmicos"],
    "Ótica": ["Gotas óticas", "Sprays óticos"]
  },
  "11. IMPLANTES / SISTEMAS": {
    "Especiales": ["Implantes subcutáneos", "Sistemas de liberación prolongada", "Bombas de infusión"]
  },
  "12. MEDS. ESPECIALES": {
    "Institucional": ["Vacunas", "Biológicos", "Inmunoterapias", "Antineoplásicos"]
  },
  "13. DISPOSITIVOS": {
    "Farmacéuticos": ["Plumas de insulina", "Autoinyectores", "Nebulizadores", "Cámaras espaciadoras"]
  }
};

export const MedicationForm = ({ isOpen, onClose, onSave }: any) => {
  const { buscarMasterMeds, guardarPrescripcion } = useSalud();
  
  const [busqueda, setBusqueda] = useState('');
  const [sugerencias, setSugerencias] = useState<any[]>([]);
  const [medSeleccionada, setMedSeleccionada] = useState<any>(null);
  
  // Cascada de selección
  const [viaPrincipal, setViaPrincipal] = useState("");
  const [subVia, setSubVia] = useState("");
  const [formaFarmaceutica, setFormaFarmaceutica] = useState("");

  const [config, setConfig] = useState({
    dosis: '', 
    frecuencia: '1',
    cantidadPorToma: '1',
    stock: '', 
    notas: '',
    horaToma: '08:00'
  });

  useEffect(() => {
    if (busqueda.length > 2) {
      buscarMasterMeds(busqueda).then(setSugerencias);
    } else { setSugerencias([]); }
  }, [busqueda]);

  // Lógica de Unidades de Medida Inteligentes
  const getUnidadMedida = () => {
    if (viaPrincipal.includes("ORAL") && subVia === "Sólidas") return "Tabletas";
    if (viaPrincipal.includes("ORAL") && subVia === "Líquidas") return "ml";
    if (viaPrincipal.includes("PARENTERAL")) return "Unid / ml";
    if (viaPrincipal.includes("INHALATORIA")) return "Puffs";
    if (viaPrincipal.includes("OCULAR") || viaPrincipal.includes("NASAL")) return "Gotas";
    return "Unidades";
  };

  const handleSave = async () => {
    if (!medSeleccionada || !viaPrincipal || !formaFarmaceutica) return alert("Complete los datos médicos.");
    
    const stockNum = Number(config.stock);
    const dosisD = Number(config.frecuencia) * Number(config.cantidadPorToma);

    const exito = await guardarPrescripcion({
      nombre: medSeleccionada.nombre,
      via: viaPrincipal,
      subVia,
      formaFarmaceutica,
      unidadMedida: getUnidadMedida(),
      ...config,
      stockActual: stockNum,
      dosisDiaria: dosisD,
    });

    if (exito) { onSave(); onClose(); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* HEADER TÉCNICO */}
        <div className="p-6 bg-blue-700 text-white flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-xl font-black flex items-center gap-2">
               <Activity size={20} /> CONFIGURACIÓN MÉDICA
            </h3>
            <p className="text-blue-100 text-[9px] font-bold uppercase tracking-widest mt-1">Control de Inventario ByUrSide</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full"><X size={24} /></button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* 1. BUSCADOR DE FÁRMACO */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">Medicamento Maesto</label>
            {!medSeleccionada ? (
              <div className="relative">
                <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input 
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-blue-500 transition-all font-bold"
                  placeholder="Escriba nombre..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
                {sugerencias.length > 0 && (
                  <div className="absolute w-full mt-2 bg-white border rounded-2xl shadow-2xl z-30 max-h-40 overflow-y-auto">
                    {sugerencias.map(s => (
                      <button key={s.id} onClick={() => { setMedSeleccionada(s); setSugerencias([]); }}
                        className="w-full text-left px-5 py-4 hover:bg-blue-50 border-b last:border-none text-sm font-bold text-slate-700 uppercase">
                        {s.nombre}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-blue-50 border-2 border-blue-100 rounded-2xl flex justify-between items-center animate-in zoom-in duration-200">
                <span className="font-black text-blue-700 uppercase">{medSeleccionada.nombre}</span>
                <button onClick={() => setMedSeleccionada(null)} className="text-[9px] font-black text-blue-500 underline">CAMBIAR</button>
              </div>
            )}
          </div>

          {/* 2. CASCADA DE CATEGORÍAS (CCSS STYLE) */}
          <div className="space-y-4 bg-slate-50 p-5 rounded-[32px] border border-slate-100">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Vía Principal</label>
              <select 
                className="w-full p-4 bg-white rounded-xl border-none font-bold text-slate-700 ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500"
                value={viaPrincipal}
                onChange={(e) => { setViaPrincipal(e.target.value); setSubVia(""); setFormaFarmaceutica(""); }}
              >
                <option value="">Seleccione Vía...</option>
                {Object.keys(ESTRUCTURA_MEDICA).map(via => <option key={via} value={via}>{via}</option>)}
              </select>
            </div>

            {viaPrincipal && (
              <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Sub-tipo</label>
                  <select 
                    className="w-full p-4 bg-white rounded-xl border-none font-bold text-slate-700 ring-1 ring-slate-200"
                    value={subVia}
                    onChange={(e) => { setSubVia(e.target.value); setFormaFarmaceutica(""); }}
                  >
                    <option value="">Elegir...</option>
                    {Object.keys(ESTRUCTURA_MEDICA[viaPrincipal]).map(sv => <option key={sv} value={sv}>{sv}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Forma</label>
                  <select 
                    className="w-full p-4 bg-white rounded-xl border-none font-bold text-slate-700 ring-1 ring-slate-200"
                    value={formaFarmaceutica}
                    onChange={(e) => setFormaFarmaceutica(e.target.value)}
                  >
                    <option value="">Elegir...</option>
                    {subVia && ESTRUCTURA_MEDICA[viaPrincipal][subVia].map((f: string) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* 3. INVENTARIO PROACTIVO */}
          <div className="bg-amber-50 p-5 rounded-[32px] border border-amber-100 space-y-4">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-2 text-amber-700">
                  <Database size={16} />
                  <h4 className="text-[10px] font-black uppercase tracking-widest">Inventario e Inicio</h4>
               </div>
               <span className="text-[9px] font-black text-amber-600 bg-amber-200/50 px-3 py-1 rounded-full uppercase">
                  Medida: {getUnidadMedida()}
               </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-amber-600 ml-1 uppercase">Stock Inicial</label>
                <input 
                  type="number" 
                  className="w-full p-4 bg-white rounded-xl border-none outline-none focus:ring-2 focus:ring-amber-500 font-black"
                  placeholder="Total"
                  value={config.stock}
                  onChange={(e) => setConfig({...config, stock: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-amber-600 ml-1 uppercase">Hora de Toma</label>
                <input 
                  type="time" 
                  className="w-full p-4 bg-white rounded-xl border-none focus:ring-2 focus:ring-amber-500 font-black"
                  value={config.horaToma}
                  onChange={(e) => setConfig({...config, horaToma: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* 4. DOSIFICACIÓN FINAL */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-5 rounded-[32px]">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1">
                <Clock size={12} /> Veces al día
              </label>
              <input type="number" className="w-full p-4 bg-white rounded-2xl border-none font-bold"
                value={config.frecuencia} onChange={(e) => setConfig({...config, frecuencia: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1">
                <Syringe size={12} /> Dosis x toma
              </label>
              <input type="number" className="w-full p-4 bg-white rounded-2xl border-none font-bold"
                value={config.cantidadPorToma} onChange={(e) => setConfig({...config, cantidadPorToma: e.target.value})} />
            </div>
          </div>

          {/* NOTAS */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1">
              <MessageSquare size={12} /> Instrucciones de Ana
            </label>
            <textarea 
              className="w-full p-4 bg-slate-50 rounded-2xl outline-none h-24 resize-none text-sm font-medium"
              placeholder="Ej: Con el estómago vacío..."
              onChange={(e) => setConfig({...config, notas: e.target.value})}
            />
          </div>

          <button 
            onClick={handleSave}
            className="w-full py-5 bg-blue-600 text-white rounded-[24px] font-black text-sm shadow-xl hover:bg-blue-700 transition-all uppercase tracking-widest"
          >
            Confirmar Plan Médico
          </button>
        </div>
      </div>
    </div>
  );
};