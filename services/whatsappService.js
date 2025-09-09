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
      'Authorization': `Bearer EAALP8uZCb17ABPZAVyLeaNldgoZBRiBAheH6UBhkDLzgzlus1ZBjFqOFELzmFkwblMSosAvC9kB3ZCXuouWVoIMpZAZBUrwGv08L4XQy9mQFtmC4nJd25y4AykZCaM7dQGh4vyrEizk4mqsA3Rm5GOOz2UjswwZALb9mwk4a8Oi4WOHa50DNvsKrV044QxvIzz5I2XeEMCq4ZB0hJOrunnzOLt1gs3CIB89RFfVZCWrCVLbBeMO`,
      'Content-Type': 'application/json'
    };

    await axios.post(url, data, { headers });
    console.log(`✅ WhatsApp message sent to ${recipient}`);
  } catch (err) {
    console.error('❌ WhatsApp API Error:', err.response?.data || err.message);
  }
};