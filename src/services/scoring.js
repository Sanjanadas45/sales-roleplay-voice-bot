const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GROQ_OR_GEMINI_API_KEY });

async function analyzeTranscript(transcriptText) {
  const prompt = `
  You are an expert Sales Coach evaluating a sales rep's pitch performance.
  Analyze this transcript:
  "${transcriptText}"

  Return a structured JSON with:
  1. Score (out of 100)
  2. Strengths (Array of strings)
  3. Objections Handled Well (Array)
  4. Areas for Improvement (Array)
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  return response.text;
}

module.exports = { analyzeTranscript };