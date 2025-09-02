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
      'Authorization': `Bearer EAALP8uZCb17ABPf2WPGKrar40H1yJ59CObJc0eIpvuNZCW43Kcu5wlDuGx1aHOo51xt6htSWjxvx9SOM9a18Ox2bcPBImSZBEXlCNHWcv8PETh58NwgOPfonEYmkGS7EGibue8WcdboG02VzeOMVGxWNYieFpZAdRFxoJW0s5YFG62bX1kw1dpJP4MvKAGYZBxQZDZD`,
      'Content-Type': 'application/json'
    };

    await axios.post(url, data, { headers });
    console.log(`✅ WhatsApp message sent to ${recipient}`);
  } catch (err) {
    console.error('❌ WhatsApp API Error:', err.response?.data || err.message);
  }
};