// Contoh konfigurasi Firebase dummy. Gantilah dengan konfigurasi Anda sendiri.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project-id.firebaseapp.com",
  databaseURL: "https://your-project-id-default-rtdb.firebaseio.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-msg-sender-id",
  appId: "your-app-id"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Show notification function
function showNotification(message) {
  const notif = document.getElementById('notification');
  if (!notif) return;
  notif.textContent = message;
  notif.style.display = 'block';
  notif.style.animation = 'notificationAppear 0.6s ease-out forwards';
  clearTimeout(notif.hideTimeout);
  notif.hideTimeout = setTimeout(() => {
    notif.style.animation = 'notificationClose 0.6s ease-in forwards';
    notif.addEventListener('animationend', () => {
      notif.style.display = 'none';
    }, { once: true });
  }, 6000);
}

// Toggle relay state in Firebase Realtime Database
function toggleRelay(id) {
  const ref = db.ref('relayStatus/relay' + id);
  ref.transaction(currentState => {
    if (currentState === "ON") return "OFF";
    return "ON";
  }, (error, committed, snapshot) => {
    if (error) {
      console.error("Failed to toggle relay:", error);
      showNotification("Gagal mengganti status relay");
    } else if (!committed) {
      showNotification("Toggle tidak berhasil");
    } else {
      const state = snapshot.val();
      const e = document.getElementById('relay' + id);
      if(e) e.classList.toggle('on', state === "ON");
      showNotification(`${e ? e.dataset.name : 'Relay'} ${state === "ON" ? "Menyala" : "Mati"}`);
    }
  });
}

// Update relay status realtime listener
function updateRelayStatus() {
  const relayStatusRef = db.ref('relayStatus');
  relayStatusRef.on('value', snapshot => {
    const data = snapshot.val() || {};
    for (let i = 0; i < 5; i++) {
      const e = document.getElementById('relay' + i);
      const status = data[`relay${i}`];
      if(e) e.classList.toggle('on', status === "ON");
    }
  });
}

// Update time display with realtime Firebase data
function updateTime() {
  const timeRef = db.ref('time');
  timeRef.on('value', snapshot => {
    const d = snapshot.val();
    if (!d) return;
    const formattedTime = `${String(d.hour).padStart(2, '0')}:${String(d.minute).padStart(2, '0')}:${String(d.second).padStart(2, '0')}`;
    const timeElem = document.getElementById('time');
    if(timeElem) timeElem.innerText = formattedTime;
    updateDayDisplay(d.day);
  });
}

// Update day display style
function updateDayDisplay(day) {
  const e = document.getElementById('day-display');
  if(!e) return;
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jum'at", "Sabtu"];
  e.innerText = days[day] || '--';
  e.className = 'day-display';
  if(day === 0) e.classList.add('sunday');
  else if(day === 5) e.classList.add('friday');
  else e.classList.add('other');
}

// WiFi settings submit to Firebase
function submitWiFiForm(event) {
  if(event) event.preventDefault();
  let ssidInput = document.getElementById('wifi-ssid');
  let passwordInput = document.getElementById('wifi-password');
  if(!ssidInput || !passwordInput) return;

  let ssid = ssidInput.value.trim();
  let password = passwordInput.value;

  if(!ssid) {
    showNotification("SSID tidak boleh kosong");
    return;
  }

  const wifiRef = db.ref('wifiSettings');
  wifiRef.set({ ssid, password })
    .then(() => {
      showNotification("Pengaturan WiFi berhasil disimpan");
      if (ssidInput) ssidInput.value = "";
      if (passwordInput) passwordInput.value = "";
    })
    .catch(e => {
      console.error('Gagal menyimpan WiFi:', e);
      showNotification("Gagal menyimpan WiFi");
    });
}

// Optional: Function to update schedules from Firebase
function updateSchedules() {
  const schedulesRef = db.ref('schedules');
  schedulesRef.on('value', snapshot => {
    const data = snapshot.val() || { schedules: [] };
    let listHTML = '';
    if(Array.isArray(data.schedules)){
      data.schedules.forEach(item => {
        listHTML += `<div class="schedule-item">${item}</div>`;
      });
    }
    const listElem = document.getElementById('schedule-list');
    if(listElem) listElem.innerHTML = listHTML;
  });
}

// Toggle forms - keep your existing implementation or adapt if needed
function toggleForm(formType, action = 'toggle') {
  const formIds = {
    wifi: 'wifi-setting',
    time: 'time-settings',
    schedule: 'schedule-setting'
  };

  const form = document.getElementById(formIds[formType]);
  if (!form) return;

  if (formType === 'schedule' && action === 'open') {
    updateSchedules();
  }

  if (action === 'close' || !form.classList.contains('hidden')) {
    form.style.animation = 'formClose 0.6s cubic-bezier(0.65, 0, 0.35, 1) forwards';
    form.addEventListener('animationend', () => {
      form.classList.add('hidden');
    }, { once: true });
  } else {
    form.classList.remove('hidden');
    form.style.animation = 'formAppear 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards';
  }
}

function closeScheduleList() {
  toggleForm('schedule', 'close');
}

// Initialization - adding event listeners and starting realtime listeners
function init() {
  for(let i=0; i<5; i++){
    const relayElem = document.getElementById('relay' + i);
    if(relayElem) relayElem.addEventListener('click', () => toggleRelay(i));
  }

  const wifiForm = document.getElementById('wifi-setting');
  if(wifiForm) wifiForm.addEventListener('submit', submitWiFiForm);

  updateRelayStatus();
  updateTime();
  updateSchedules();
}

// Wait DOM ready to start init
document.addEventListener('DOMContentLoaded', init);
