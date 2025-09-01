const axios = require('axios');

exports.sendMsg = async (to, body) => {
  try {
    await axios.post(`${process.env.WHATSAPP_API_URL}/messages`, {
      recipient_type: "individual",
      to,
      type: "text",
      text: { body }
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
  } catch (err) {
    console.error('Failed to send WhatsApp message:', err.response?.data);
  }
};