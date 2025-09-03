// services/whatsappService.js
const axios = require('axios');

exports.sendMsg = async (to, body) => {
  try {
    // Remove '+' and leading '0' if needed
    const recipient = to.replace('+', '').replace(/^0+/, '');

    const url = `${process.env.WHATSAPP_API_URL}/${process.env.PHONE_NUMBER_ID}/messages`;
    console.log("url ......... "+url);
    const data = {
      messaging_product: "whatsapp",
      to: recipient,
      type: "text",
      text: { body }
    };

    const headers = {
      'Authorization': `Bearer EAALP8uZCb17ABPUolZCl7u2VU5WISfz4yE0BZAqY7IoaynBLFsZCLeAmmBXFZCjwCnsFBexN7y3QF0v7qFTSAFfWAcGb8xCgN4q8Ej8XelWbVs50sQPAuSJQpYbNZCEWP7wch0t2hfHzAiJ9yRFj7KmQWw05bvxmBTwXOmPv83QWoos9ZCSQsjSRHdkI4pPkAqmaQZDZD`,
      'Content-Type': 'application/json'
    };

    await axios.post(url, data, { headers });
    console.log(`✅ WhatsApp message sent to ${recipient}`);
  } catch (err) {
    console.error('❌ WhatsApp API Error:', err.response?.data || err.message);
  }
};