
const firebaseConfig = {
  apiKey: "AIzaSyB9-JkNWyY2tWDFH3O25I1iK7ANoL6zg-0",
  authDomain: "ihsan-cloud-f3a02.firebaseapp.com",
  databaseURL: "https://ihsan-cloud-f3a02-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ihsan-cloud-f3a02",
  storageBucket: "ihsan-cloud-f3a02.firebasestorage.app",
  messagingSenderId: "442997712719",
  appId: "1:442997712719:web:de3ef3dc4cbb5b5925873a"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Fungsi Notifikasi
function showNotification(message) {
  const notif = document.getElementById('notification');
  if (!notif) return;

  notif.textContent = message;
  notif.style.display = 'block';
  notif.style.animation = 'notificationAppear 0.6s ease-out forwards';

  setTimeout(() => {
    notif.style.animation = 'notificationClose 0.6s ease-in forwards';
    notif.addEventListener('animationend', () => {
      notif.style.display = 'none';
    }, { once: true });
  }, 5000);
}

// Fungsi Toggle Relay
function toggleRelay(id) {
  const relayRef = database.ref(`relays/relay${id}`);
  
  relayRef.transaction(currentState => {
    return currentState === "ON" ? "OFF" : "ON";
  }).then(() => {
    relayRef.once('value').then(snapshot => {
      const state = snapshot.val();
      let e = document.getElementById(`relay${id}`);
      if (e) {
        e.classList.toggle('on', state === "ON");
        showNotification(`${e.dataset.name} ${state === "ON" ? "Menyala" : "Mati"}`);
      }
    });
  }).catch(e => {
    console.error("Error:", e);
    showNotification("Gagal mengontrol relay");
  });
}

// Fungsi Update Waktu
function updateTime() {
  const timeRef = database.ref('time');
  
  timeRef.on('value', (snapshot) => {
    const d = snapshot.val();
    if (d) {
      document.getElementById('time').innerText = `${d.hour}:${d.minute}:${d.second}`;
      updateDayDisplay(d.day);
    }
  });
}

// Fungsi Tampilan Hari
function updateDayDisplay(day) {
  let e = document.getElementById('day-display');
  if (!e) return;
  
  let n = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jum'at", "Sabtu"];
  e.innerText = n[day];
  e.className = "day-display";
  
  if(day === 0) e.classList.add('sunday');
  else if(day === 5) e.classList.add('friday');
  else e.classList.add('other');
}

// Fungsi Submit WiFi Form
function submitWiFiForm() {
  let ssid = document.getElementById('wifi-ssid').value;
  let password = document.getElementById('wifi-password').value;
  
  if (!ssid || !password) {
    showNotification('SSID dan Password tidak boleh kosong');
    return;
  }
  
  database.ref('wifi').set({
    ssid: ssid,
    password: password
  }).then(() => {
    toggleWiFiForm();
    showNotification('Pengaturan WiFi berhasil disimpan');
  }).catch(e => {
    console.error(e);
    showNotification('Gagal menyimpan pengaturan WiFi');
  });
}

// Fungsi Hide Warning Message
function hideWarningMessage() {
  let e = document.getElementById('warning-message');
  if(e) e.remove();
}

// Fungsi Update Relay Status
function updateRelayStatus() {
  const relaysRef = database.ref('relays');
  
  relaysRef.on('value', (snapshot) => {
    const d = snapshot.val();
    if (d) {
      for(let i = 0; i < 5; i++) {
        let e = document.getElementById(`relay${i}`);
        if (e) {
          let s = d[`relay${i}`];
          e.classList.toggle('on', s === "ON");
        }
      }
    }
  });
}

// Fungsi Set WiFi (Alternatif)
function setWiFi() {
  let ssid = document.getElementById('ssid').value;
  let pass = document.getElementById('password').value;

  if (!ssid || !pass) {
    showNotification('SSID dan Password tidak boleh kosong');
    return;
  }
  
  database.ref('wifi').set({
    ssid: ssid,
    password: pass
  }).then(() => {
    const form = document.getElementById('wifi-setting');
    if (form) {
      form.style.animation = 'formClose 0.6s forwards';
      form.addEventListener('animationend', () => {
        form.classList.add('hidden');
        showNotification("WiFi berhasil disimpan!");
      }, { once: true });
    }
  }).catch(e => {
    console.error("Gagal menyimpan WiFi:", e);
    showNotification("Gagal menyimpan WiFi");
  });
}

// Fungsi Update Schedules
function updateSchedules() {
  const schedulesRef = database.ref('schedules');
  
  schedulesRef.on('value', (snapshot) => {
    const d = snapshot.val();
    if (d && d.schedules) {
      let s = '';
      d.schedules.forEach(i => {
        s += `<div class="schedule-item">${i}</div>`;
      });
      const scheduleList = document.getElementById('schedule-list');
      if (scheduleList) {
        scheduleList.innerHTML = s;
      }
    }
  });
}

// Fungsi Toggle Form
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

// Fungsi Close Schedule List
function closeScheduleList() {
  toggleForm('schedule', 'close');
}

// Fungsi Toggle WiFi Form
function toggleWiFiForm() {
  const form = document.getElementById('wifi-setting');
  if (!form) return;

  if (form.classList.contains('hidden')) {
    form.classList.remove('hidden');
    form.style.animation = 'formAppear 0.6s forwards';
  } else {
    form.style.animation = 'formClose 0.6s forwards';
    form.addEventListener('animationend', () => {
      form.classList.add('hidden');
    }, { once: true });
  }
}

// Inisialisasi saat DOM siap
document.addEventListener('DOMContentLoaded', function() {
  // Setup Firebase listeners
  updateTime();
  updateRelayStatus();
  updateSchedules();
  
  // Setup interval untuk backup (jika diperlukan)
  setInterval(() => {
    const timeEl = document.getElementById('time');
    if (timeEl && !timeEl.textContent) {
      updateTime();
    }
  }, 1000);
  
  setInterval(() => {
    const scheduleList = document.getElementById('schedule-list');
    if (scheduleList && !scheduleList.innerHTML) {
      updateSchedules();
    }
  }, 900000);
  
  // Hide warning message setelah 5 detik
  setTimeout(hideWarningMessage, 5000);
});
