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
      'Authorization': `Bearer EAALP8uZCb17ABPZAyu2JFP71pGFIWSdUSuY3tZA44LZCXIZCWOuI5SJrckZCkyPYobjhk5L8PyFrU5rA7YQuZCtaufo4cH6e4qhP1itAJBKXMvkzzRVGyZCSi2N7ZBHTQ1np6gQWlFFNC8t1nDBE4UiX4NiauX43TsDLFTFH6dS3UyBHRvXPU6MYIzsbFdR91d3XT1H429zp0PN9JmbmYj6Eq5ZBK4aFgajBd5neTCy2snDDMZD`,
      'Content-Type': 'application/json'
    };

    await axios.post(url, data, { headers });
    console.log(`✅ WhatsApp message sent to ${recipient}`);
  } catch (err) {
    console.error('❌ WhatsApp API Error:', err.response?.data || err.message);
  }
};