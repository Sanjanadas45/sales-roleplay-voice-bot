require('dotenv').config();
const express = require('express');
const cors = require('cors');
const personas = require('./config/personas');
const transcriptRoute = require('./routes/transcript');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

app.get('/api/personas', (req, res) => {
  res.json(personas);
});

app.use('/api', transcriptRoute);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});