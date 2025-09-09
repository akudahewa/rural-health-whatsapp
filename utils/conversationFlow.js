const axios = require('axios');
const { sendMsg } = require('../services/whatsappService');
const { createBooking } = require('../services/bookingService');

// 🔗 API URLs
const TIMESLOTS_API = 'https://myclinic-server.onrender.com/api/timeslots/next-available';
const BOOKING_API_URL = process.env.BOOKING_API_URL;

// 💬 Sinhala Messages
const sinhala = {
  welcome: "🏥 ආයුබෝවන්! 'වෛද්‍ය ගුරු' යනු ටයිප් කරන්න",
  select_doctor: "👨‍⚕️ වෛද්‍යවරයා තෝරන්න:",
  select_clinic: "🏥 සෞඛ්‍ය මධ්‍යස්ථානය තෝරන්න:",
  select_time: "🕒 ලබා ගත හැකි දින තෝරන්න:",
  enter_name: "ඔබගේ සම්පූර්ණ නම ඇතුළත් කරන්න:",
  enter_mobile: "ඔබගේ දුරකථන අංකය ඇතුළත් කරන්න (උදා: 0762199100):",
  confirm_booking: "📄 ඔබගේ ගැළවීම සාරාංශය:",
  confirm_prompt: "\n1. තහවුරු කරන්න\n2. අවලංගු කරන්න",
  booking_confirmed: "✅ ගැළවීම සාර්ථකයි!",
  booking_cancelled: "❌ ගැළවීම අවලංගු කර ඇත.",
  error: "❌ දෝෂයක් ඇති විය. නැවත උත්සාහ කරන්න.",
  invalid: "❌ වලංගු නොවන තේරීම",
  no_slots: "❌ දැනටමත් ලබා ගත හැකි වේලාවන් නොමැත"
};

// In-memory user state
let userState = {};

exports.handleUserMessage = async (from, text) => {
  const state = userState[from] || { step: 'start' };

  try {
    // 🌿 AI Symptom Checker
    if (text.includes('symptoms') || text.includes('රෝග අවස්ථාව')) {
      await sendMsg(from, "ඔබට කුමන රෝග ලක්ෂණ දක්නට ලැබේද? (උදා: උණ, කැස්ස, වමනය)");
      userState[from] = { step: 'awaiting_symptoms' };
      return;
    }

    if (state.step === 'awaiting_symptoms') {
      let reply = "ඔබට ";
      if (text.includes('උණ') && text.includes('කැස්ස')) {
        reply += "ඩෙන්ගු හෝ ඉන්ෆිලුඑන්සා විය හැකිය. වෛද්‍ය ගුරු කරන්න.";
      } else if (text.includes('වමනය')) {
        reply += "ජල දැල්වීම වළක්වා ගැනීමට ද්‍රව බොන්න. වෛද්‍ය ගුරු කරන්න.";
      } else {
        reply += "සාමාන්‍ය රෝගයක් ඇති විය හැක. වෛද්‍ය ගුරු කරන්න.";
      }
      await sendMsg(from, reply);
      userState[from] = { step: 'start' };
      return;
    }

    // ✅ Step 1: Book doctor → Show doctor list
    if (text.includes('book doctor') && state.step === 'start') {
      try {
        const res = await axios.get('https://myclinic-server.onrender.com/api/doctors');
        const doctors = res.data;

        if (!doctors || doctors.length === 0) {
          await sendMsg(from, sinhala.no_doctors);
          return;
        }

        let msg = sinhala.select_doctor + "\n";
        doctors.forEach((doc, i) => {
          msg += `${i+1}. ${doc.name} (${doc.specialization})\n`;
        });

        await sendMsg(from, msg);
        state.step = 'choose_doctor';
        state.doctors = doctors;
        userState[from] = state;

      } catch (err) {
        console.error('Failed to fetch doctors:', err.message);
        await sendMsg(from, sinhala.error);
      }
      return;
    }

    // ✅ Step 2: Choose doctor → Fetch dispensaries
    if (state.step === 'choose_doctor') {
      const idx = parseInt(text) - 1;
      if (idx >= 0 && idx < state.doctors.length) {
        const doc = state.doctors[idx];
        state.doctorId = doc._id;
        state.doctorName = doc.name;
        state.step = 'fetch_clinics';

        try {
          const res = await axios.get(`https://myclinic-server.onrender.com/api/dispensaries/doctor/${doc._id}`);
          const clinics = res.data;

          if (!clinics || clinics.length === 0) {
            await sendMsg(from, "❌ ලබා ගත හැකි සෞඛ්‍ය මධ්‍යස්ථාන නොමැත");
            delete userState[from];
            return;
          }

          let msg = sinhala.select_clinic + "\n";
          clinics.forEach((c, i) => {
            msg += `${i+1}. ${c.name}, ${c.address}\n`;
          });

          await sendMsg(from, msg);
          state.step = 'choose_clinic';
          state.clinics = clinics;
          userState[from] = state;

        } catch (err) {
          console.error('Failed to fetch clinics:', err.message);
          await sendMsg(from, sinhala.error);
        }
      } else {
        await sendMsg(from, sinhala.invalid);
      }
      return;
    }

    // ✅ Step 3: Choose clinic → Fetch time slots
    if (state.step === 'choose_clinic') {
      const idx = parseInt(text) - 1;
      if (idx >= 0 && idx < state.clinics.length) {
        const clinic = state.clinics[idx];
        state.clinicId = clinic._id;
        state.clinicName = clinic.name;
        state.step = 'fetch_timeslots';

        try {
          const res = await axios.get(`${TIMESLOTS_API}/${state.doctorId}/${state.clinicId}`);
          const data = res.data;

          if (!data.available || !data.availableDays || data.availableDays.length === 0) {
            await sendMsg(from, sinhala.no_slots);
            delete userState[from];
            return;
          }

          // Take only next 3 days
          const slots = data.availableDays.slice(0, 3);
          state.slots = slots;
          state.step = 'choose_slot';

          let msg = sinhala.select_time + "\n";
          slots.forEach((slot, i) => {
            msg += `${i+1}. ${slot.dayName} ${slot.date} | ආරම්භය: ${slot.startTime} | ඊළඟ: #${slot.nextAppointmentNumber}\n`;
          });

          await sendMsg(from, msg);
          userState[from] = state;

        } catch (err) {
          console.error('Failed to fetch timeslots:', err.message);
          await sendMsg(from, sinhala.error);
        }
      } else {
        await sendMsg(from, sinhala.invalid);
      }
      return;
    }

    // ✅ Step 4: Choose time slot
    if (state.step === 'choose_slot') {
      const idx = parseInt(text) - 1;
      if (idx >= 0 && idx < state.slots.length) {
        state.selectedSlot = state.slots[idx];
        state.step = 'enter_name';
        await sendMsg(from, sinhala.enter_name);
        userState[from] = state;
      } else {
        await sendMsg(from, sinhala.invalid);
      }
      return;
    }

    // ✅ Step 5: Enter patient name
    if (state.step === 'enter_name') {
      if (text.trim().length < 2) {
        await sendMsg(from, "කරුණාකර වලංගු නමක් ඇතුළත් කරන්න.");
        return;
      }
      state.patientName = text.trim();
      state.step = 'enter_mobile';
      await sendMsg(from, sinhala.enter_mobile);
      return;
    }

    // ✅ Step 6: Enter mobile number
    if (state.step === 'enter_mobile') {
      const mobile = text.trim();
      if (!/^(07|7)\d{8}$/.test(mobile)) {
        await sendMsg(from, "කරුණාකර වලංගු දුරකථන අංකයක් ඇතුළත් කරන්න (උදා: 0762199100)");
        return;
      }
      state.patientPhone = mobile;
      state.step = 'confirm_booking';

      // Simulate fee structure (in real app, fetch from API)
      const fees = {
        doctorFee: 500,
        dispensaryFee: 300,
        bookingCommission: 50,
        totalFee: 850
      };

      const slot = state.selectedSlot;
      const summary = `${sinhala.confirm_booking}\n` +
        `වෛද්‍යවරයා: ${state.doctorName}\n` +
        `ස්ථානය: ${state.clinicName}\n` +
        `දිනය: ${slot.date} (${slot.dayName})\n` +
        `වේලාව: ${slot.startTime}\n` +
        `රෝගියා: ${state.patientName}\n` +
        `දුරකථනය: ${state.patientPhone}\n` +
        `වෛද්‍ය ගාස්තු: Rs ${fees.doctorFee}\n` +
        `සෞඛ්‍ය මධ්‍යස්ථාන ගාස්තු: Rs ${fees.dispensaryFee}\n` +
        `ගැළවීමේ කොමිස් ගාස්තු: Rs ${fees.bookingCommission}\n` +
        `මුළු: Rs ${fees.totalFee}\n` +
        sinhala.confirm_prompt;

      await sendMsg(from, summary);
      state.fees = fees;
      userState[from] = state;
      return;
    }

    // ✅ Step 7: Confirm or Cancel
    if (state.step === 'confirm_booking') {
      if (text === '1') {
        const bookingData = {
          patientName: state.patientName,
          patientPhone: state.patientPhone,
          doctorId: state.doctorId,
          dispensaryId: state.clinicId,
          bookingDate: state.selectedSlot.date,
          fees: {
            doctorId: state.doctorId,
            doctorName: state.doctorName,
            dispensaryId: state.clinicId,
            dispensaryName: state.clinicName,
            doctorFee: state.fees.doctorFee,
            dispensaryFee: state.fees.dispensaryFee,
            bookingCommission: state.fees.bookingCommission,
            totalFee: state.fees.totalFee
          },
          bookedUser: "online",
          bookedBy: "ONLINE"
        };

        try {
          await createBooking(bookingData);

          await sendMsg(from, `${sinhala.booking_confirmed}\n` +
            `${state.doctorName}\n` +
            `${state.clinicName}\n` +
            `${state.selectedSlot.date} ${state.selectedSlot.startTime}\n` +
            `මෙම පණිවිඩය ප්‍රතිශෝධනයේදී පෙන්වන්න.`);

          delete userState[from];

        } catch (err) {
          await sendMsg(from, "❌ ගැළවීම අසාර්ථක විය. කරුණාකර නැවත උත්සාහ කරන්න.");
          console.error('Booking failed:', err);
        }

      } else if (text === '2') {
        await sendMsg(from, sinhala.booking_cancelled);
        delete userState[from];

      } else {
        await sendMsg(from, sinhala.invalid);
      }

      return;
    }

    // Default fallback
    await sendMsg(from, sinhala.welcome);

  } catch (err) {
    await sendMsg(from, sinhala.error);
    console.error('Bot error:', err);
  }
};