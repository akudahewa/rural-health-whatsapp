const axios = require('axios');

exports.createBooking = async (bookingData) => {
  const res = await axios.post(process.env.BOOKING_API_URL, bookingData, {
    headers: {
      'Authorization': `Bearer ${process.env.BOOKING_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  return res.data;
};