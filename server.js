require('dotenv').config();
const express = require('express');
const app = express();
app.use(express.json());

const { handleUserMessage } = require('./utils/conversationFlow');

// Webhook Verification (360dialog)
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});
app.get('/', (req, res) => {
  res.send('Hello World');
});

// Receive WhatsApp Messages
app.post('/webhook', async (req, res) => {
  const message = req.body.messages?.[0];
  if (!message) return res.sendStatus(200);

  const from = message.from;
  const text = message.text?.body?.toLowerCase();

  await handleUserMessage(from, text);
  res.sendStatus(200);
});

app.listen(process.env.PORT || 3001, () => {
  console.log(`🚀 WhatsApp bot running on port ${process.env.PORT || 3001}`);
});