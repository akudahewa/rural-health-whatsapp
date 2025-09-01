const { sendMsg } = require('../services/whatsappService');
const { createBooking } = require('../services/bookingService');

// 👇 Replace with your real doctor/clinic data from DB or API
const clinics = [
  { id: 'c1', name: 'හම්බන්තොට ප්‍රාථමික සෞඛ්‍ය මධ්‍යස්ථානය', name_en: 'Hambantota PHC' },
  { id: 'c2', name: 'මොණරාගල ප්‍රා. සෞඛ්‍ය කේන්ද්‍රය', name_en: 'Monaragala MC' }
];

const doctors = [
  { id: 'd1', name: 'ඩො. පෙරේරා (සාමාන්‍ය)', clinicId: 'c1', name_en: 'Dr. Perera (GP)' },
  { id: 'd2', name: 'ඩො. සිල්වා (ළදරු)', clinicId: 'c1', name_en: 'Dr. Silva (Pediatric)' }
];

const slots = ['10:00', '11:00', '14:00'];

let userState = {};

// 💬 Sinhala Messages
const sinhala = {
  welcome: "🏥 ආයුබෝවන්! 'වෛද්‍ය ගුරු' යනු ටයිප් කරන්න",
  choose_clinic: "📍 සෞඛ්‍ය මධ්‍යස්ථානය තෝරන්න:",
  choose_doctor: "👨‍⚕️ වෛද්‍යවරයා තෝරන්න:",
  choose_slot: "🕒 වේලාව තෝරන්න:",
  confirm: "📄 ඔබගේ ගැළවීම තහවුරු කරන්න?",
  confirmed: "✅ ගැළවීම සාර්ථකයි!",
  error: "❌ දෝෂයක් ඇති විය. නැවත උත්සාහ කරන්න."
};

// 🌐 Tamil Messages
const tamil = {
  welcome: "🏥 வணக்கம்! 'டாக்டர் புக்' என டைப் செய்க",
  choose_clinic: "📍 மருத்துவமனையைத் தேர்வு செய்க:",
  choose_doctor: "👨‍⚕️ மருத்துவரைத் தேர்வு செய்க:",
  choose_slot: "🕒 நேரத்தைத் தேர்வு செய்க:",
  confirm: "📄 உங்கள் பதிவு உறுதி செய்யப்பட்டதா?",
  confirmed: "✅ பதிவு செய்யப்பட்டது!",
  error: "❌ பிழை. மீண்டும் முயற்சிக்கவும்."
};

if (text.includes('symptoms') || text.includes('රෝග ಅවස්ථාව')) {
    await sendMsg(from, "ඔබට කුමන රෝග ලක්ෂණ දක්නට ලැබේද? (උදා: උණ, කැස්ස, බර අඩුවීම)");
    userState[from] = { step: 'awaiting_symptoms' };
  }
  
  if (state.step === 'awaiting_symptoms') {
    // Simple rule-based AI (can upgrade to ML later)
    let reply = "ඔබට ";
    if (text.includes('උණ') && text.includes('කැස්ස')) reply += "ඩෙන්ගු හෝ ඉන්ෆිලුඑන්සා විය හැකිය. වෛද්‍ය ගුරු කරන්න.";
    else if (text.includes('වමනය')) reply += "ජල දැල්වීම වළක්වා ගැනීමට ද්‍රව බොන්න. වෛද්‍ය ගුරු කරන්න.";
    else reply += "සාමාන්‍ය රෝගයක් ඇති විය හැක. වෛද්‍ය ගුරු කරන්න.";
  
    await sendMsg(from, reply);
    userState[from] = { step: 'start' };
  }

exports.handleUserMessage = async (from, text) => {
  const state = userState[from] || { step: 'start' };

  try {
    if (text.includes('book doctor') || text.includes('වෛද්‍ය ගුරු') || text.includes('டாக்டர் புக்') || text === '1') {
      state.step = 'choose_clinic';
      let msg = sinhala.choose_clinic + "\n";
      clinics.forEach((c, i) => msg += `${i+1}. ${c.name}\n`);
      await sendMsg(from, msg);
      userState[from] = state;
      return;
    }

    if (state.step === 'choose_clinic') {
      const idx = parseInt(text) - 1;
      if (idx >= 0 && idx < clinics.length) {
        state.clinicId = clinics[idx].id;
        state.step = 'choose_doctor';
        const availableDocs = doctors.filter(d => d.clinicId === state.clinicId);
        let msg = sinhala.choose_doctor + "\n";
        availableDocs.forEach((d, i) => msg += `${i+1}. ${d.name}\n`);
        await sendMsg(from, msg);
        userState[from] = state;
      } else {
        await sendMsg(from, "❌ නොවැලැත්තා.");
      }
      return;
    }

    if (state.step === 'choose_doctor') {
      const idx = parseInt(text) - 1;
      const availableDocs = doctors.filter(d => d.clinicId === state.clinicId);
      if (idx >= 0 && idx < availableDocs.length) {
        state.doctorId = availableDocs[idx].id;
        state.step = 'choose_slot';
        let msg = sinhala.choose_slot + "\n";
        slots.forEach((s, i) => msg += `${i+1}. ${s}\n`);
        await sendMsg(from, msg);
        userState[from] = state;
      } else {
        await sendMsg(from, "❌ නොවැලැත්තා.");
      }
      return;
    }

    if (state.step === 'choose_slot') {
      const idx = parseInt(text) - 1;
      if (idx >= 0 && idx < slots.length) {
        state.time = slots[idx];
        state.date = new Date().toISOString().split('T')[0];
        state.step = 'confirm';
        const doctor = doctors.find(d => d.id === state.doctorId);
        const clinic = clinics.find(c => c.id === state.clinicId);
        const msg = `${sinhala.confirm}\nවෛද්‍යවරයා: ${doctor.name}\nස්ථානය: ${clinic.name}\nදිනය: ${state.date}\nවේලාව: ${state.time}\n\nYES යනු ටයිප් කර තහවුරු කරන්න.`;
        await sendMsg(from, msg);
        userState[from] = state;
      } else {
        await sendMsg(from, "❌ නොවැලැත්තා.");
      }
      return;
    }

    if (state.step === 'confirm' && text === 'yes') {
      const doctor = doctors.find(d => d.id === state.doctorId);
      const bookingData = {
        patient_phone: from,
        doctor_id: state.doctorId,
        clinic_id: state.clinicId,
        date: state.date,
        time: state.time,
        source: 'whatsapp'
      };

      await createBooking(bookingData);

      const clinic = clinics.find(c => c.id === state.clinicId);
      await sendMsg(from, `${sinhala.confirmed}\n${doctor.name}\n${clinic.name}\n${state.date} ${state.time}\nමෙම පණිවිඩය ප්‍රතිශෝධනයේදී පෙන්වන්න.`);

      delete userState[from];
    } else {
      await sendMsg(from, sinhala.welcome);
    }
  } catch (err) {
    await sendMsg(from, sinhala.error);
    console.error(err);
  }
};