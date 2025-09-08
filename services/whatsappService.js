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
      'Authorization': `Bearer EAALP8uZCb17ABPWa173k2gIIgnZBIoTYa3lZCCc0VXiI6dovZCimR4Q5AQIsW77LX3vWWEwzzrxkkGHbqVO0qLiSZBYTkPoZANqN4fZB2uPAkyXEg7Yy8Frs40zeoNe9Q36FKvB7jM6wmNfHmqR5edxtzg8e32x74phEjY9mhqSAKSxtNZAxj7EdayhRmPl2SBGzoYSKA6dTKu1ZBlLeyx1K8AqJDgeTaCoUleM8j5gnx68wZD`,
      'Content-Type': 'application/json'
    };

    await axios.post(url, data, { headers });
    console.log(`✅ WhatsApp message sent to ${recipient}`);
  } catch (err) {
    console.error('❌ WhatsApp API Error:', err.response?.data || err.message);
  }
};