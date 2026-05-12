import { db } from "./config";
import { collection, doc, writeBatch } from "firebase/firestore";
import bibleData from "../data/rv_1909_strongs.json";

export const seedBible = async () => {
  const versiculos = (bibleData as any).verses;
  const BATCH_SIZE = 400; 
  let currentBatch = writeBatch(db);
  let count = 0;

  // 1. Agrupamos los versículos por capítulos en memoria
  const capitulosMap: any = {};

  versiculos.forEach((item: any) => {
    const key = `${item.book}_${item.chapter}`; // Ejemplo: "43_3" (Juan 3)
    if (!capitulosMap[key]) {
      capitulosMap[key] = {
        libro: item.book_name,
        libroNum: item.book,
        cap: item.chapter,
        versiculos: []
      };
    }
    const textoLimpio = item.text.replace(/\{[GH]\d+\}/g, "").trim();
    capitulosMap[key].versiculos.push({ ver: item.verse, texto: textoLimpio });
  });

  console.log("⏳ Subiendo capítulos optimizados a Firebase...");

  // 2. Subimos los capítulos (solo 1,189 documentos)
  const keys = Object.keys(capitulosMap);
  for (const key of keys) {
    const docRef = doc(collection(db, "bible_chapters"), key);
    currentBatch.set(docRef, capitulosMap[key]);

    count++;
    if (count % BATCH_SIZE === 0) {
      await currentBatch.commit();
      currentBatch = writeBatch(db);
      console.log(`✅ ${count} capítulos cargados...`);
    }
  }

  await currentBatch.commit();
  console.log("✨ ¡Biblia optimizada cargada con éxito!");
};