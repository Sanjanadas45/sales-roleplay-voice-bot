// Web Speech Recognition Initialization
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
  alert("Web Speech API is not supported in this browser. Please open in Google Chrome.");
}

const recognition = new SpeechRecognition();
recognition.continuous = false; // Set to false to cleanly manage turn-taking
recognition.interimResults = false;
recognition.lang = 'en-US';

let isListening = false;
let isBotSpeaking = false;
let conversationHistory = [];

const startBtn = document.getElementById('startBtn');
const endBtn = document.getElementById('endBtn');
const statusDiv = document.getElementById('status');
const transcriptBox = document.getElementById('transcriptBox');
const evaluationCard = document.getElementById('evaluationCard');
const evaluationContent = document.getElementById('evaluationContent');

// Handle Speech Input Result
recognition.onresult = (event) => {
  if (isBotSpeaking) return; // Prevent mic from capturing TTS audio

  const current = event.resultIndex;
  const userSpeech = event.results[current][0].transcript.trim();

  if (userSpeech.length > 0) {
    appendMessage("You", userSpeech);
    conversationHistory.push({ role: "user", parts: [{ text: userSpeech }] });
    
    // Send user message to Express server
    sendMessageToBackend(userSpeech);
  }
};

// Handle Recognition End
recognition.onend = () => {
  // Only restart mic if call is active and bot is NOT speaking
  if (isListening && !isBotSpeaking) {
    try {
      recognition.start();
    } catch (e) {
      // Handle edge-case restarts safely
    }
  }
};

// Handle Recognition Errors
recognition.onerror = (event) => {
  console.error("Speech Recognition Error:", event.error);
  if (event.error === 'not-allowed') {
    alert("Microphone access was denied. Please allow microphone permissions in your URL bar.");
  }
};

// Start Voice Call
startBtn.addEventListener('click', async () => {
  isListening = true;
  isBotSpeaking = false;
  conversationHistory = [];
  transcriptBox.innerHTML = '';
  evaluationCard.classList.add('hidden');
  
  updateStatus("Status: Connecting call...", "listening");

  // Fetch initial buyer greeting first
  await sendMessageToBackend("[System: Call connected. Introduce yourself and open the call.]", true);
});

// End Call and Fetch Score Evaluation
endBtn.addEventListener('click', async () => {
  isListening = false;
  isBotSpeaking = false;
  
  try { recognition.stop(); } catch(e) {}
  window.speechSynthesis.cancel();
  
  updateStatus("Status: Call Ended. Generating Evaluation...", "ended");

  try {
    const response = await fetch('/api/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        history: conversationHistory,
        config: getFormConfig()
      })
    });

    const data = await response.json();
    displayEvaluation(data.evaluation || "No evaluation feedback generated.");
  } catch (err) {
    console.error("Evaluation Error:", err);
    updateStatus("Status: Error fetching evaluation.", "error");
  }
});

// Helper to safely fetch form configuration
function getFormConfig() {
  return {
    industry: document.getElementById('industry')?.value || 'B2B Tech / SaaS',
    temperament: document.getElementById('temperament')?.value || 'Skeptical & Analytical',
    difficulty: document.getElementById('difficulty')?.value || 'Medium',
    objection: document.getElementById('objection')?.value || 'Pricing & Budget constraints'
  };
}

// Communication with Express API
async function sendMessageToBackend(userText = '', isInitial = false) {
  updateStatus(isInitial ? "Status: Buyer is speaking..." : "Status: Thinking...", "listening");

  const payload = {
    message: userText,
    history: conversationHistory,
    config: getFormConfig()
  };

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    if (data.reply) {
      appendMessage("Buyer", data.reply);
      conversationHistory.push({ role: "model", parts: [{ text: data.reply }] });
      speakBotResponse(data.reply);
    } else if (data.error) {
      updateStatus(`Error: ${data.error}`, "error");
    }
  } catch (err) {
    console.error("Backend Error:", err);
    updateStatus("Status: Backend connection failed.", "error");
  }
}

// Speak Bot Response with SpeechSynthesis
function speakBotResponse(text) {
  isBotSpeaking = true;
  
  // Explicitly stop mic while TTS is talking
  try { recognition.stop(); } catch (e) {}

  window.speechSynthesis.cancel(); // Stop any pending audio queue

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';

  utterance.onstart = () => {
    updateStatus("Status: Buyer speaking...", "listening");
  };

  utterance.onend = () => {
    isBotSpeaking = false;
    if (isListening) {
      updateStatus("Status: Listening... Speak now", "listening");
      try { recognition.start(); } catch (e) {}
    }
  };

  utterance.onerror = () => {
    isBotSpeaking = false;
    if (isListening) {
      try { recognition.start(); } catch (e) {}
    }
  };

  window.speechSynthesis.speak(utterance);
}

// UI Helpers
function appendMessage(sender, text) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${sender.toLowerCase()}`;
  msgDiv.innerHTML = `<strong>${sender}:</strong> ${text}`;
  transcriptBox.appendChild(msgDiv);
  transcriptBox.scrollTop = transcriptBox.scrollHeight;
}

function updateStatus(text, stateClass) {
  statusDiv.textContent = text;
  statusDiv.className = `status-badge ${stateClass}`;
}

function displayEvaluation(reportText) {
  evaluationContent.innerHTML = `<pre style="white-space: pre-wrap; font-family: inherit;">${reportText}</pre>`;
  evaluationCard.classList.remove('hidden');
  updateStatus("Status: Evaluation Completed", "ended");
}