# AI Sales Roleplay Voice Bot

An interactive, dynamic, zero-cost AI Sales Roleplay Voice Bot powered by the **Google Gemini API** (`gemini-2.5-flash`) and the browser-native **Web Speech API**. 

This application simulates real-world prospect interactions, pushing back on sales reps based on customizable industry, temperament, difficulty, and objection parameters. It automatically evaluates sales performance post-call with detailed coaching feedback.

---

## 🎯 Features

* **Real-time Spoken Conversation:** Seamless Speech-to-Text (`webkitSpeechRecognition`) and Text-to-Speech (`speechSynthesis`) using browser-native APIs.
* **Dynamic Scenario Configuration:** Configure customer traits on the fly:
  * **Industry:** B2B Tech / SaaS, Healthcare & MedTech, E-commerce & Retail, Financial Services.
  * **Temperament:** Skeptical & Analytical, Friendly & Easygoing, Impatient & Direct, Risk-Averse & Defensive.
  * **Difficulty Level:** Easy, Medium, Hard.
  * **Focus Objection:** Pricing & Budget, Competitor Loyalty, Time / Resources, Security & Compliance.
* **Strict Character Adherence:** Powered by Gemini 2.5 Flash using zero-shot system prompts to ensure the bot acts purely as a customer (raising realistic objections rather than acting like an assistant).
* **Automated Call Evaluation:** Generates a post-call score (1–100) along with detailed strengths, areas for improvement, and tactical advice based on the transcript history.
* **100% Free Architecture:** Built with zero paid third-party dependencies, eliminating per-minute telephony hosting fees.

---

## 🏗️ Architecture & Data Flow
[ Sales Rep Voice ]
│
▼ (Browser Web Speech API: STT)
[ Transcript Text ]
│
▼ (POST /api/chat - Express Backend)
[ Gemini 2.5 Flash ] ──(Generates Persona Response)──► [ Express Backend ]
│
▼ (POST Reply)
[ Browser Audio Output ] ◄── (SpeechSynthesis: TTS) ── [ Frontend UI ]

### Key Technical Tradeoffs & Decisions

| Component | Choice | Alternative (e.g., Vapi / Groq) | Reason for Decision |
| :--- | :--- | :--- | :--- |
| **Voice Layer** | **Browser Web Speech API** | Vapi SDK / WebRTC Telephony | **$0 Infrastructure Cost:** Eliminates $0.05+/min hosting fees and WebSocket server overhead while providing fast browser-native voice interaction. |
| **AI LLM Engine** | **Google Gemini API (`gemini-2.5-flash`)** | Groq / Anthropic | **Turnkey Ecosystem & High Adherence:** Generous free tier with strong instruction-following for dynamic roleplay and structured JSON/text call evaluations. |

---

## 🚀 Quick Start

### Prerequisites
* **Node.js** (v18+ recommended)
* **Google Gemini API Key** ([Get a key here](https://aistudio.google.com/))
* Google Chrome or Microsoft Edge (for Web Speech API support)

## 🌐 Live Demo & Deployment

* **Live App:** [https://your-app-name.vercel.app](https://your-app-name.vercel.app)
* **Hosted on:** Vercel (Serverless Node.js Functions + Static Frontend)

---

## 🚀 Local Installation & Setup

If you wish to clone and run this project locally, here are the steps:


1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd <your-repo-folder>

2. **Install dependencies:**
    ```bash
    npm install

3. **Configure Environment Variables:**
    Create a .env file in the root directory:
    GEMINI_API_KEY=your_gemini_api_key_here
    PORT=3000

4. **Run the Application:**
    ```bash
    # Development mode with hot-reloading
    npx nodemon server.js
    # Production mode
    node server.js

5. **Access the App:**
    Open Chrome or Edge and navigate to http://localhost:3000.