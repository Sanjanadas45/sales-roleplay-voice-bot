const express = require('express');
const router = express.Router();
const { analyzeTranscript } = require('../services/scoring');

router.post('/vapi-webhook', async (req, res) => {
  const { message } = req.body;

  // Listen for call completion from Vapi/Retell
  if (message && message.type === 'end-of-call-report') {
    const transcript = message.transcript;
    console.log("Analyzing completed call transcript...");
    
    const feedback = await analyzeTranscript(transcript);
    console.log("\n--- AI Performance Report ---");
    console.log(feedback);
  }

  res.status(200).send("Webhook received");
});

module.exports = router;