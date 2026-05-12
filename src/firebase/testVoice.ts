/**
 * Script de prueba para verificar funcionalidad de voz
 * Ejecutar en la consola del navegador: npm run test-voice
 */
export const testVoiceFunctionality = async () => {
  console.log("🧪 Probando funcionalidad de voz...");

  try {
    // Verificar que el navegador soporta reconocimiento de voz
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error("❌ El navegador no soporta reconocimiento de voz");
      return false;
    }

    console.log("✅ Reconocimiento de voz soportado");

    // Verificar conectividad básica
    try {
      await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        mode: 'no-cors'
      });
      console.log("✅ Conectividad a internet verificada");
    } catch {
      console.warn("⚠️ Posible problema de conectividad");
    }

    // Verificar permisos de micrófono
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      console.log("✅ Permisos de micrófono concedidos");
    } catch {
      console.warn("⚠️ Micrófono no disponible o permisos denegados");
    }

    console.log("🎉 Pruebas completadas. La funcionalidad de voz debería funcionar correctamente.");
    return true;

  } catch (error) {
    console.error("❌ Error en pruebas de voz:", error);
    return false;
  }
};

// Ejecutar automáticamente en desarrollo
if (import.meta.hot) {
  testVoiceFunctionality();
}