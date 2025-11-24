const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const scanReceiptWithGemini = async (base64Image) => {
  try {
    const cleanBase64 = base64Image.split(',')[1];
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "Extrae: amount (número), description (string), date (YYYY-MM-DD). JSON only." },
            { inlineData: { mimeType: "image/jpeg", data: cleanBase64 } }
          ]
        }]
      })
    });
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonString);
  } catch (error) {
    throw error;
  }
};

export const getFinancialAdvice = async (financialData) => {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ 
            text: `Actúa como CFO de Agencia Creativa. Analiza: ${JSON.stringify(financialData)}. Dame un resumen ejecutivo y 3 consejos estratégicos para mejorar rentabilidad. Usa emojis. Español.` 
          }]
        }]
      })
    });
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Error en la transmisión estelar.";
  } catch (error) {
    return "Error contactando a la IA.";
  }
};