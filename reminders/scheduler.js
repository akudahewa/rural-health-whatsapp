const axios = require('axios');
const { sendMsg } = require('../services/whatsappService');

// Run this every day at 8 AM via cron
setInterval(async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    // Call your API to get tomorrow's bookings
    const res = await axios.get('https://your-booking-system.com/api/bookings?date=' + tomorrow, {
      headers: { Authorization: `Bearer ${process.env.BOOKING_API_KEY}` }
    });

    res.data.forEach(async (booking) => {
      const msg = `🔔 අවවාදය: ඔබගේ ගැළවීම හෙට ${booking.time} වේ. වෛද්‍ය ${booking.doctor_name} සමග. අමතර වෙනස්කම් සඳහා අප අමතන්න.`;
      await sendMsg(booking.patient_phone, msg);
    });
  } catch (err) {
    console.error('Reminder failed:', err);
  }
}, 86400000); // 24 hours