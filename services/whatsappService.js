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
      'Authorization': `Bearer EAALP8uZCb17ABPSCJAvO5AYldN8ywNESUVCDVEnTQsqLHxIaGVHBacNZCzSFSgLE5VgknIsNE4UzqXJ7IgGTDbsTnmVhb16ZAcHJ9RRZBqGgskK0mD9dTesY7hXJZBtPF0ZBvjaIWalZCnbPVpcXo3VdFaFmZBGpZBqP8RNtuZCAeZALe3sy0wCg8cLPaGj75EbMtzbwAZDZD`,
      'Content-Type': 'application/json'
    };

    await axios.post(url, data, { headers });
    console.log(`✅ WhatsApp message sent to ${recipient}`);
  } catch (err) {
    console.error('❌ WhatsApp API Error:', err.response?.data || err.message);
  }
};