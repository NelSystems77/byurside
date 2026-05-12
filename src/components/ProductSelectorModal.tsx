import React, { useState, useEffect } from 'react';
import { Search, X, Plus, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (producto: any) => void;
  masterList: any[];
}

export const ProductSelectorModal = ({ isOpen, onClose, onSelect, masterList }: ModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState<any[]>([]);

  useEffect(() => {
    const results = masterList.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredItems(results);
  }, [searchTerm, masterList]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Fondo oscuro */}
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div 
          initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative bg-white w-full max-w-lg h-[80vh] sm:h-auto sm:max-h-[70vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header del Modal */}
          <div className="p-5 border-b flex items-center justify-between bg-white sticky top-0">
            <h3 className="text-xl font-bold text-slate-800">Agregar Producto</h3>
            <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-500">
              <X size={20} />
            </button>
          </div>

          {/* Buscador */}
          <div className="p-4 bg-slate-50 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                autoFocus
                type="text"
                placeholder="Buscar arroz, frijoles, lizano..."
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Lista de Resultados */}
          <div className="flex-1 overflow-y-auto p-2">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelect(item);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-4 hover:bg-orange-50 rounded-2xl transition-colors group"
                >
                  <div className="text-left">
                    <p className="font-bold text-slate-800 group-hover:text-orange-700">{item.name}</p>
                    <p className="text-sm text-slate-500">{item.qty} {item.unit}</p>
                  </div>
                  <Plus size={20} className="text-slate-300 group-hover:text-orange-500" />
                </button>
              ))
            ) : (
              <div className="py-10 text-center text-slate-400">
                <p>No encontramos "{searchTerm}"</p>
                <p className="text-xs mt-1">Intenta con otro nombre.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};