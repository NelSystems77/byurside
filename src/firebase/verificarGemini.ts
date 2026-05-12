/**
 * Verificación de que la API de Gemini funciona correctamente
 * Ejecutar en consola del navegador para debugging
 */
export const verificarGeminiAPI = async () => {
  console.log("🔍 Verificando API de Gemini...");

  try {
    // Verificar que la API key esté configurada
    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    if (!API_KEY) {
      console.error("❌ VITE_GEMINI_API_KEY no está configurada");
      return false;
    }
    console.log("✅ API Key configurada");

    // Verificar que el modelo esté disponible
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(API_KEY);

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      console.log("✅ Modelo 'gemini-1.5-flash' disponible");

      // Probar una solicitud simple
      const result = await model.generateContent("Hola, solo una prueba");
      const response = await result.response;
      const text = response.text();

      if (text && text.length > 0) {
        console.log("✅ API de Gemini funcionando correctamente");
        console.log("📝 Respuesta de prueba:", text.substring(0, 50) + "...");
        return true;
      } else {
        console.warn("⚠️ API responde pero sin contenido");
        return false;
      }

    } catch (modelError) {
      console.error("❌ Error con el modelo 'gemini-1.5-flash':", modelError);
      return false;
    }

  } catch (error) {
    console.error("❌ Error general en verificación de Gemini:", error);
    return false;
  }
};

// Ejecutar automáticamente en desarrollo
if (import.meta.hot) {
  verificarGeminiAPI();
}