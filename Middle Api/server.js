// Middleware api
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Make sure directory exists
const dataDir = path.join(__dirname, 'submissions');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

dotenv.config();
const app = express();
app.use(express.json());

const FRONTEND_ORIGIN = '';
app.use(cors({ origin: FRONTEND_ORIGIN }));

app.post('/api/feedback', async (req, res) => {
  const { studentId, studentCode, feedbackVariant } = req.body;

  const response = await fetch('', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', "X-Internal-Auth": process.env.INTERNAL_AUTH_TOKEN },
    body: JSON.stringify({ studentId, studentCode, feedbackVariant })
  }).catch((error) => console.error(error));;

  const data = await response.json()
  res.json(data)
});

const API_TOKEN = process.env.EXTERNAL_API_TOKEN;
const TARGET_URL = '';

app.post('/api/submit-survey', async (req, res) => {
  const data = req.body;
  const studentId = data.studentId || 'unknown_resource';

  saveToFoundry(studentId, data, res);
  saveToFile(studentId, data);
});

async function saveToFoundry(studentId, data, res) {
  try {
    const response = await fetch(TARGET_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_token': API_TOKEN,
        'resource_id': studentId,
        'token': 'token_for_identifier'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      console.error("External API error:", await response.text());
      return res.status(response.status).send("Failed to submit to external API");
    }

    const result = await response.json();
    res.json(result);
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).send("Internal server error");
  }
}

function saveToFile(studentId, data) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${studentId}_${timestamp}.json`;
  const filepath = path.join(dataDir, filename);

  try {
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    console.log(`Saved submission to ${filename}`);
  } catch (err) {
    console.error("Failed to save submission:", err);
  }
}

app.get('/api/ping', (req, res) => res.json({ ok: true, body: req.body }));

app.listen(3002, () => {
  console.log('Feedback API listening on http://127.0.0.1:3002');
});
