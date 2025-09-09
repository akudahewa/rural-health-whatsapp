const axios = require('axios');

exports.createBooking = async (bookingData) => {
  const res = await axios.post('https://myclinic-server.onrender.com/api/bookings', bookingData, {
    headers: {
      'Authorization': `Bearer ${process.env.BOOKING_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  console.log("createBooking data ......... "+res.data);
  return res.data;
};