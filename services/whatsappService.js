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
      'Authorization': `Bearer EAALP8uZCb17ABPVNbPihUE5Pf1yHaRTQUOiXmi8q8nPgm5DfVZA4pbg07WL8ZBnQ8qkz3kiBpnZCbYp1zZBJmwofL5QRSOFSK5UBR3Vo9c4cIqFyDgnBjiZB3ZCwGPtZBi7NwnWzP9LTofTa7uE5hzTAnV47f8oZA27k4DVmVQSKd3iFlOI76E20oSkjNZA7yHWWbIAUMO6N3FR4btb27cImAnxRAprkCS7b0ZAfahRlInEfpUZD`,
      'Content-Type': 'application/json'
    };

    await axios.post(url, data, { headers });
    console.log(`✅ WhatsApp message sent to ${recipient}`);
  } catch (err) {
    console.error('❌ WhatsApp API Error:', err.response?.data || err.message);
  }
};