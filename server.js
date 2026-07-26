import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

/**
 * Resilient API Call Helper
 * - Retries on 429 Rate Limits
 * - Retries on Network/Fetch Timeouts
 */
async function generateContentWithRetry(modelName, prompt, retries = 2, delayMs = 1500) {
  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
      }, { signal: controller.signal });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      const isRateLimit = error.status === 429;
      const isTimeout = error.name === 'AbortError' || error.code === 'UND_ERR_CONNECT_TIMEOUT' || error.message?.includes('fetch failed');

      if ((isRateLimit || isTimeout) && i < retries) {
        console.warn(`[Attempt ${i + 1}] Retrying due to ${isRateLimit ? 'Rate Limit (429)' : 'Network Timeout'} in ${delayMs / 1000}s...`);
        await new Promise((res) => setTimeout(res, delayMs));
        delayMs *= 2;
      } else {
        throw error;
      }
    }
  }
}

// Endpoint 1: Handle Live Chat Responses
app.post('/api/chat', async (req, res) => {
  try {
    const { config, persona, message, history } = req.body;

    const industry = config?.industry || 'B2B Tech / SaaS';
    const temperament = config?.temperament || 'Skeptical & Analytical';
    const difficulty = config?.difficulty || 'Medium';
    const objectionType = config?.objection || config?.objectionType || 'Pricing & Budget constraints';

    const personaDescription = persona
      ? `Persona: ${persona}`
      : `Configuration:
- Industry Context: ${industry}
- Temperament/Behavior: ${temperament}
- Difficulty Level: ${difficulty}
- Primary Concern/Objection Style: Focus heavily on ${objectionType}`;

    const systemPrompt = `You are playing the role of a prospective buyer in a live sales roleplay call. 

${personaDescription}

Strict Behavioral Rules:
1. Stay deeply in character as the customer. Never drop character or mention you are an AI.
2. Keep responses brief, natural, and conversational for a voice call (1–3 sentences max).
3. Raise realistic objections and push back dynamically according to your assigned temperament and difficulty level.
4. Do NOT sound like an assistant. Act like a real person receiving a cold or warm sales call.`;

    const formattedHistory = history && history.length > 0
      ? history.map((item) => {
          const text = item.parts?.[0]?.text || item.text || '';
          return `${item.role === 'user' ? 'Sales Rep' : 'Buyer'}: ${text}`;
        }).join('\n')
      : 'No previous messages.';

    const latestMessage = message || (history && history.length > 0 ? (history[history.length - 1]?.parts?.[0]?.text || history[history.length - 1]?.text) : 'Hello!');
    const prompt = `${systemPrompt}\n\nCall Transcript History:\n${formattedHistory}\n\nSales Rep: ${latestMessage}\nBuyer:`;

    // Strictly using gemini-1.5-flash-latest
    const response = await generateContentWithRetry('gemini-flash-latest', prompt);

    res.json({ reply: response.text });
  } catch (error) {
    console.error('Gemini Chat Error:', error.message || error);
    
    if (error.status === 429) {
      return res.status(429).json({ error: 'Rate limit reached. Please wait a few seconds before speaking again.' });
    }
    
    res.status(500).json({ error: 'Connection error with AI provider. Please try sending your message again.' });
  }
});

// Endpoint 2: Evaluate & Score Call Transcript
app.post('/api/evaluate', async (req, res) => {
  try {
    const { history, config } = req.body;

    const formattedTranscript = history && history.length > 0
      ? history.map((item) => {
          const text = item.parts?.[0]?.text || item.text || '';
          return `${item.role === 'user' ? 'Sales Rep' : 'Buyer'}: ${text}`;
        }).join('\n')
      : 'No conversation recorded.';

    const contextInfo = config 
      ? `Scenario Context: Industry - ${config.industry || 'General'}, Difficulty - ${config.difficulty || 'Medium'}, Focus Objection - ${config.objection || config.objectionType || 'General'}\n\n`
      : '';

    const evaluationPrompt = `You are an expert Sales Coach evaluating a sales roleplay call transcript.

${contextInfo}Transcript:
${formattedTranscript}

Please analyze the sales rep's performance and provide a structured review:
1. Overall Performance Score (Out of 100)
2. Key Strengths (Bullet points)
3. Key Areas for Improvement (Bullet points)
4. Objections Handled Well vs. Missed Opportunities
5. Tactical Advice for Next Call`;

    // Strictly using gemini-3.5-flash
    const response = await generateContentWithRetry('gemini-flash-latest', evaluationPrompt);

    res.json({ evaluation: response.text });
  } catch (error) {
    console.error('Gemini Evaluation Error:', error.message || error);
    res.status(500).json({ error: 'Failed to evaluate call.' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});