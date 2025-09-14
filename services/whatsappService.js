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
      'Authorization': `Bearer EAALP8uZCb17ABPYYX1dehzchULlOygQFm7pcEG4yawbqnw9I9kVelZAHH3Rlb0yzl8hnAJsILryYZCx5zZA2sxLcucsP3pBLLBA3ev2dfMipMmI3o4sRUO0gAtjOfNGSGpcW0nrIx1vwfBBF7VeASBBplTeMenf32QPuwZCwnjVaJk27XQU2Yle9RHHrsPhEFbsoOxujPGqq98MGXbUAEyWAvDZB2MYF02QQsu4jlIPMNj`,
      'Content-Type': 'application/json'
    };

    await axios.post(url, data, { headers });
    console.log(`✅ WhatsApp message sent to ${recipient}`);
  } catch (err) {
    console.error('❌ WhatsApp API Error:', err.response?.data || err.message);
  }
};