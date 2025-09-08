const axios = require('axios');
const { sendMsg } = require('../services/whatsappService');
const { createBooking } = require('../services/bookingService');

// 🔗 API URLs
const DOCTORS_API = 'https://myclinic-server.onrender.com/api/doctors';
const DISPENSARIES_API = 'https://myclinic-server.onrender.com/api/dispensaries/doctor';

// 🌍 Language Messages
const messages = {
  en: {
    lang: "👋 Choose your language:",
    select_doctor: "👨‍⚕️ Select doctor:",
    select_clinic: "🏥 Select clinic:",
    select_time: "🕒 Select time:",
    confirm: "📄 Confirm booking:",
    confirmed: "✅ Booking confirmed!",
    no_doctors: "❌ No doctors available",
    error: "❌ Error. Try again."
  },
  si: {
    lang: "👋 ඔබගේ භාෂාව තෝරන්න:",
    select_doctor: "👨‍⚕️ වෛද්‍යවරයා තෝරන්න:",
    select_clinic: "🏥 සෞඛ්‍ය මධ්‍යස්ථානය තෝරන්න:",
    select_time: "🕒 වේලාව තෝරන්න:",
    confirm: "📄 ඔබගේ ගැළවීම තහවුරු කරන්න:",
    confirmed: "✅ ගැළවීම සාර්ථකයි!",
    no_doctors: "❌ වෛද්‍යවරුන් නොමැත",
    error: "❌ දෝෂයක් ඇති විය. නැවත උත්සාහ කරන්න."
  },
  ta: {
    lang: "👋 உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்:",
    select_doctor: "👨‍⚕️ மருத்துவரைத் தேர்வு செய்க:",
    select_clinic: "🏥 மருத்துவமனையைத் தேர்வு செய்க:",
    select_time: "🕒 நேரத்தைத் தேர்வு செய்க:",
    confirm: "📄 உங்கள் பதிவு உறுதி செய்யப்பட்டதா?",
    confirmed: "✅ பதிவு செய்யப்பட்டது!",
    no_doctors: "❌ மருத்துவர்கள் இல்லை",
    error: "❌ பிழை. மீண்டும் முயற்சிக்கவும்."
  }
};

let userState = {};

exports.handleUserMessage = async (from, text) => {
  const state = userState[from] || { step: 'start' };
  const lang = state.lang || 'en'; // default
  const t = messages[lang];

  try {
    // Step 0: Book doctor → Language
    if (text.includes('book doctor') && state.step === 'start') {
      state.step = 'choose_lang';
      await sendMsg(from, t.lang + "\n1. English\n2. සිංහල\n3. தமிழ்");
      userState[from] = state;
      return;
    }

    // Choose language
    if (state.step === 'choose_lang') {
      if (text === '1') state.lang = 'en';
      else if (text === '2') state.lang = 'si';
      else if (text === '3') state.lang = 'ta';
      else {
        await sendMsg(from, t.error);
        return;
      }
      state.step = 'fetch_doctors';
      userState[from] = state;

      await sendMsg(from, t.select_doctor);

      try {
        const res = await axios.get(DOCTORS_API);
        const doctors = res.data;
        if (!doctors.length) {
          await sendMsg(from, t.no_doctors);
          return;
        }

        let msg = t.select_doctor + "\n";
        doctors.forEach((d, i) => {
          msg += `${i+1}. ${d.name} (${d.specialization})\n`;
        });
        await sendMsg(from, msg);
        state.step = 'choose_doctor';
        state.doctors = doctors;
        userState[from] = state;

      } catch (err) {
        await sendMsg(from, t.error);
      }
      return;
    }

    // Choose doctor → Fetch dispensaries
    if (state.step === 'choose_doctor') {
      const idx = parseInt(text) - 1;
      if (idx >= 0 && idx < state.doctors.length) {
        const doc = state.doctors[idx];
        state.doctorId = doc._id;
        state.doctorName = doc.name;
        state.step = 'fetch_clinics';

        try {
          const res = await axios.get(`${DISPENSARIES_API}/${doc._id}`);
          const clinics = res.data;
          if (!clinics.length) {
            await sendMsg(from, "❌ No clinics available");
            return;
          }

          let msg = t.select_clinic + "\n";
          clinics.forEach((c, i) => {
            msg += `${i+1}. ${c.name}, ${c.address}\n`;
          });
          await sendMsg(from, msg);
          state.step = 'choose_clinic';
          state.clinics = clinics;
          userState[from] = state;

        } catch (err) {
          await sendMsg(from, t.error);
        }
      } else {
        await sendMsg(from, "❌ Invalid choice");
      }
      return;
    }

    // Choose clinic → Time
    if (state.step === 'choose_clinic') {
      const idx = parseInt(text) - 1;
      if (idx >= 0 && idx < state.clinics.length) {
        const clinic = state.clinics[idx];
        state.clinicId = clinic._id;
        state.clinicName = clinic.name;
        state.step = 'choose_time';

        const slots = ['10:00', '11:00', '14:00'];
        let msg = t.select_time + "\n";
        slots.forEach((s, i) => msg += `${i+1}. ${s}\n`);

        await sendMsg(from, msg);
        state.step = 'confirm';
        state.slots = slots;
        userState[from] = state;
      } else {
        await sendMsg(from, "❌ Invalid choice");
      }
      return;
    }

    // Choose time → Confirm
    if (state.step === 'choose_time') {
      const idx = parseInt(text) - 1;
      if (idx >= 0 && idx < state.slots.length) {
        state.time = state.slots[idx];
        state.date = new Date().toISOString().split('T')[0];
        state.step = 'confirm';

        const msg = `${t.confirm}\nවෛද්‍යවරයා: ${state.doctorName}\nස්ථානය: ${state.clinicName}\nදිනය: ${state.date}\nවේලාව: ${state.time}\n\nYES යනු ටයිප් කරන්න.`;
        await sendMsg(from, msg);
        userState[from] = state;
      } else {
        await sendMsg(from, "❌ Invalid choice");
      }
      return;
    }

    // Confirm booking
    if (state.step === 'confirm' && text.toLowerCase() === 'yes') {
      const bookingData = {
        patient_phone: from,
        doctor_id: state.doctorId,
        clinic_id: state.clinicId,
        date: state.date,
        time: state.time
      };

      await createBooking(bookingData);

      await sendMsg(from, `${t.confirmed}\n${state.doctorName}\n${state.clinicName}\n${state.date} ${state.time}\nමෙම පණිවිඩය ප්‍රතිශෝධනයේදී පෙන්වන්න.`);

      delete userState[from];
    }

  } catch (err) {
    await sendMsg(from, t.error);
    console.error(err);
  }
};