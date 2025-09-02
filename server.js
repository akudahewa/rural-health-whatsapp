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
  console.log(mode, token, challenge);
  if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
    console.log('Webhook verified '+challenge);
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});
app.get('/', (req, res) => {
  res.send('Hello World');
});

// Receive WhatsApp Messages
// app.post('/webhook', async (req, res) => {
//   console.log('Received message .......');
//   console.log(req.body);
//   const message = req.body.entry[0].changes[0].value.messages[0];
//   console.log(message);
//   if (!message) return res.sendStatus(200);

//   const from = message.from;
//   const text = message.text?.body?.toLowerCase();

//   await handleUserMessage(from, text);
//   res.sendStatus(200);
// });

app.post('/webhook', async (req, res) => {
  console.log('📩 Received webhook:', JSON.stringify(req.body, null, 2));

  // Extract nested data safely
  const entry = req.body.entry?.[0];
  const change = entry?.changes?.[0];
  const value = change?.value;

  if (!value) {
    console.log('❌ No value in webhook');
    return res.sendStatus(200);
  }

  const message = value.messages?.[0];
  if (!message) {
    console.log('❌ No message found');
    return res.sendStatus(200);
  }

  if (message.type !== 'text') {
    console.log('❌ Not a text message');
    return res.sendStatus(200);
  }

  const from = message.from;
  const text = message.text?.body?.toLowerCase();

  if (!text) {
    console.log('❌ Message has no text');
    return res.sendStatus(200);
  }

  console.log(`💬 From ${from}: ${text}`);

  try {
    await handleUserMessage(from, text);
  } catch (err) {
    console.error('❌ Error handling message:', err);
  }

  res.sendStatus(200);
});

app.listen(process.env.PORT || 3001, () => {
  console.log(`🚀 WhatsApp bot running on port ${process.env.PORT || 3001}`);
});