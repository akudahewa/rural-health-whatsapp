

// utils/conversationFlow.js
const axios = require("axios");
const { sendMsg } = require("../services/whatsappService");
const { createBooking } = require("../services/bookingService");

// Store per-user conversation state
let userState = {};

// Language menus
const languages = {
  1: { code: "si", label: "සිංහල" },
  2: { code: "en", label: "English" },
  3: { code: "ta", label: "தமிழ்" }
};

// Translations (system prompts)
const prompts = {
  en: {
    chooseLang: "🌐 Please select your preferred language:\n1. Sinhala\n2. English\n3. Tamil",
    chooseDoctor: "👨‍⚕️ Please choose a doctor:",
    chooseDisp: "🏥 Please choose a dispensary:",
    confirm: "✅ Confirm your booking?",
    error: "❌ Invalid choice. Please try again."
  },
  si: {
    chooseLang: "🌐 කරුණාකර ඔබේ භාෂාව තෝරන්න:\n1. සිංහල\n2. English\n3. தமிழ்",
    chooseDoctor: "👨‍⚕️ වෛද්‍යවරයා තෝරන්න:",
    chooseDisp: "🏥 රෝහල තෝරන්න:",
    confirm: "✅ ඔබගේ වෙන්කිරීම තහවුරු කරන්න?",
    error: "❌ වැරදි තේරීමකි. නැවත උත්සාහ කරන්න."
  },
  ta: {
    chooseLang: "🌐 உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்:\n1. සිංහල\n2. English\n3. தமிழ்",
    chooseDoctor: "👨‍⚕️ மருத்துவரைத் தேர்ந்தெடுக்கவும்:",
    chooseDisp: "🏥 மருந்தகத்தைத் தேர்ந்தெடுக்கவும்:",
    confirm: "✅ உங்கள் முன்பதிவை உறுதிப்படுத்தவா?",
    error: "❌ தவறான தேர்வு. மீண்டும் முயற்சிக்கவும்."
  }
};

exports.handleUserMessage = async (from, text) => {
  let state = userState[from] || { step: "start" };
  const lang = state.lang || "en"; // default English

  try {
    // Step 1: Start booking
    if (text.toLowerCase() === "book doctor") {
      state.step = "chooseLang";
      userState[from] = state;
      return await sendMsg(from, prompts.en.chooseLang); // show in English always
    }

    // Step 2: Choose language
    if (state.step === "chooseLang") {
      if (languages[text]) {
        state.lang = languages[text].code;
        state.step = "chooseDoctor";

        // Fetch doctors from API
        const res = await axios.get(`${process.env.API_URL}/doctors`);
        state.availableDocs = res.data;

        let msg = prompts[state.lang].chooseDoctor + "\n";
        state.availableDocs.forEach((d, i) => {
          msg += `${i + 1}. ${d.name}\n`;
        });

        userState[from] = state;
        return await sendMsg(from, msg);
      } else {
        return await sendMsg(from, prompts[lang].error);
      }
    }

    // Step 3: Choose doctor
    if (state.step === "chooseDoctor") {
      const idx = parseInt(text) - 1;
      if (state.availableDocs && idx >= 0 && idx < state.availableDocs.length) {
        const doctor = state.availableDocs[idx];
        state.doctorId = doctor._id;
        state.step = "chooseDisp";

        // Fetch dispensaries for this doctor
        const res = await axios.get(
          `${process.env.API_URL}/dispensaries/doctor/${doctor._id}`
        );
        state.availableDisps = res.data;

        let msg = prompts[state.lang].chooseDisp + "\n";
        state.availableDisps.forEach((d, i) => {
          msg += `${i + 1}. ${d.name}\n`;
        });

        userState[from] = state;
        return await sendMsg(from, msg);
      } else {
        return await sendMsg(from, prompts[lang].error);
      }
    }

    // Step 4: Choose dispensary
    if (state.step === "chooseDisp") {
      const idx = parseInt(text) - 1;
      if (state.availableDisps && idx >= 0 && idx < state.availableDisps.length) {
        const disp = state.availableDisps[idx];
        state.dispId = disp._id;
        state.step = "confirm";

        const doctor = state.availableDocs.find(d => d._id === state.doctorId);

        const msg = `${prompts[state.lang].confirm}\n\nDoctor: ${doctor.name}\nDispensary: ${disp.name}\n\nReply YES to confirm.`;
        userState[from] = state;
        return await sendMsg(from, msg);
      } else {
        return await sendMsg(from, prompts[lang].error);
      }
    }

    // Step 5: Confirm booking
    if (state.step === "confirm" && text.toLowerCase() === "yes") {
      const bookingData = {
        patient_phone: from,
        doctor_id: state.doctorId,
        clinic_id: state.dispId,
        source: "whatsapp"
      };

      await createBooking(bookingData);

      await sendMsg(from, "🎉 Booking confirmed! Thank you.");
      delete userState[from];
      return;
    }

    // Default: reset
    return await sendMsg(from, prompts[lang].error);

  } catch (err) {
    console.error("❌ Conversation flow error:", err);
    await sendMsg(from, prompts[lang].error);
  }
};
