import { db } from "./config";
import { collection, doc, setDoc, addDoc } from "firebase/firestore";

/**
 * Script de desarrollo para poblar datos de prueba
 * Ejecutar con: npm run seed-dev
 */
export const seedDevData = async () => {
  try {
    console.log("🌱 Poblando datos de desarrollo...");

    const pacienteId = "dev_paciente_principal";

    // 1. Perfil del paciente
    await setDoc(doc(db, "usuarios", pacienteId), {
      uid: pacienteId,
      rol: 'paciente',
      usuarioNombre: "Ana",
      pacienteNombre: "Carlos",
      pacienteId: pacienteId,
      familiarNombre: "Ana",
      asistenteNombre: "Danay",
      honorifico: "Don",
      createdAt: new Date()
    });

    // 2. Medicamentos de ejemplo
    const medsRef = collection(db, "usuarios", pacienteId, "medications");
    const medicamentosEjemplo = [
      {
        nombre: "Aspirina 100mg",
        horaToma: "09:00",
        stockActual: 28,
        cantidadPorToma: 1,
        dosisDiaria: 1,
        estado: "activo",
        alertaEnviada: false,
        createdAt: new Date()
      },
      {
        nombre: "Losartán 50mg",
        horaToma: "08:00",
        stockActual: 15,
        cantidadPorToma: 1,
        dosisDiaria: 1,
        estado: "activo",
        alertaEnviada: false,
        createdAt: new Date()
      },
      {
        nombre: "Metformina 500mg",
        horaToma: "15:00",
        stockActual: 5, // Bajo stock para probar alertas
        cantidadPorToma: 1,
        dosisDiaria: 2,
        estado: "activo",
        alertaEnviada: false,
        createdAt: new Date()
      }
    ];

    for (const med of medicamentosEjemplo) {
      await addDoc(medsRef, med);
    }

    // 3. Lista de compras de ejemplo
    const shoppingRef = collection(db, "usuarios", pacienteId, "shopping_lists");
    const comprasEjemplo = [
      {
        name: "Leche",
        qty: "1",
        unit: "Litro",
        bought: false,
        price: 1500,
        createdAt: new Date(),
        addedBy: "Danay (Voz)"
      },
      {
        name: "Pan",
        qty: "2",
        unit: "Unidades",
        bought: false,
        price: 800,
        createdAt: new Date(),
        addedBy: "Ana"
      },
      {
        name: "Manzanas",
        qty: "6",
        unit: "Unidades",
        bought: true,
        price: 1200,
        createdAt: new Date(),
        addedBy: "Danay (Voz)"
      }
    ];

    for (const item of comprasEjemplo) {
      await addDoc(shoppingRef, item);
    }

    // 4. Lista maestra de compras
    const masterRef = collection(db, "usuarios", pacienteId, "master_list");
    const masterEjemplo = [
      { name: "Leche", qty: "1", unit: "Litro" },
      { name: "Pan", qty: "2", unit: "Unidades" },
      { name: "Huevos", qty: "12", unit: "Unidades" },
      { name: "Arroz", qty: "1", unit: "Kilo" },
      { name: "Aceite", qty: "1", unit: "Litro" }
    ];

    for (const item of masterEjemplo) {
      await addDoc(masterRef, item);
    }

    // 5. Ubicación de ejemplo
    await setDoc(doc(db, "usuarios", pacienteId), {
      lastLocation: {
        latitude: 9.9333,
        longitude: -84.0833,
        accuracy: 10,
        timestamp: new Date()
      }
    }, { merge: true });

    console.log("✅ Datos de desarrollo poblados exitosamente!");
    console.log("📱 Ahora puedes probar:");
    console.log("   - Dashboard del paciente con medicamentos");
    console.log("   - Lista de compras con items de ejemplo");
    console.log("   - Alertas de stock bajo");
    console.log("   - Mapa con ubicación de ejemplo");

  } catch (error) {
    console.error("❌ Error poblando datos de desarrollo:", error);
  }
};

// Ejecutar si se llama directamente
if (import.meta.hot || typeof window !== 'undefined') {
  // En desarrollo, ejecutar automáticamente
  seedDevData();
}