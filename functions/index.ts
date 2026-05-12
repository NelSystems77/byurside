const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyDTaFr-Xm7OwUUciW7lf8XleYy6RlsEdnI");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

exports.resumirConversacionDiaria = functions.pubsub
  .schedule('59 23 * * *') // Todos los días a las 11:59 PM
  .timeZone('America/Costa_Rica')
  .onRun(async (context) => {
    const db = admin.firestore();
    const usersSnapshot = await db.collection('users').get();

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const historyRef = db.collection('users').id(userId).collection('chat_history');
      
      // 1. Obtener mensajes del día
      const snapshot = await historyRef.orderBy('timestamp', 'asc').get();
      if (snapshot.empty) continue;

      const conversacionTexto = snapshot.docs
        .map(d => `${d.data().role}: ${d.data().text}`)
        .join("\n");

      // 2. Pedir a Gemini un resumen con tono humano
      const prompt = `
        Resume la siguiente conversación de un adulto mayor con su asistente Danay. 
        Extrae temas importantes (familia, salud, fe, pasatiempos). 
        Escríbelo como si fueras Danay recordando: "Ayer hablamos de...", "Usted mencionó que...".
        Conversación:
        ${conversacionTexto}
      `;

      const result = await model.generateContent(prompt);
      const resumen = result.response.text();

      // 3. Guardar en Memoria Semántica
      await db.collection('users').doc(userId).collection('semantic_memory').add({
        resumen: resumen,
        fecha: admin.firestore.FieldValue.serverTimestamp()
      });

      // 4. Limpiar el historial detallado (Borrado por lotes)
      const batch = db.batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }
    
    return console.log("Resumen diario completado y limpieza realizada.");
  });