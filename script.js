// Konfigurasi Firebase
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT.firebaseio.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Variabel status
let isOnline = false;
let relayStates = [false, false, false, false, false];

// Fungsi inisialisasi
function init() {
  checkConnection();
  initFirebaseListeners();
  updateTime();
  setInterval(updateTime, 1000);
  setInterval(checkConnection, 30000);
}

// Cek koneksi internet
async function checkConnection() {
  try {
    const response = await fetch('/checkInternet');
    if (!response.ok) throw new Error("Network response was not ok");
    
    const data = await response.json();
    isOnline = data.connected;
    updateConnectionUI(isOnline);
    
    if (isOnline) {
      showNotification("Terhubung dengan Cloud Firebase");
    } else {
      showNotification("Mode Offline - Menggunakan Koneksi Lokal");
    }
  } catch (error) {
    console.error("Error checking connection:", error);
    isOnline = false;
    updateConnectionUI(false);
  }
}

// Update tampilan status koneksi
function updateConnectionUI(connected) {
  const badge = document.getElementById('connection-badge');
  const text = document.getElementById('connection-text');
  
  badge.className = connected ? 'connection-status online-status' : 'connection-status offline-status';
  text.textContent = connected ? 'Cloud Connected' : 'Offline Mode';
}

// Kontrol relay
async function toggleRelay(relayId) {
  const relayElement = document.getElementById(`relay${relayId}`);
  const deviceName = relayElement.dataset.name;
  
  try {
    if (isOnline) {
      // Kontrol via Firebase
      const newState = !relayElement.classList.contains('on');
      await database.ref(`relays/control/relay${relayId}`).set(newState);
      showNotification(`${deviceName} ${newState ? "Menyala" : "Mati"} (Cloud)`);
    } else {
      // Kontrol via API lokal
      const response = await fetch(`/control?relay${relayId}=TOGGLE`);
      if (!response.ok) throw new Error("Gagal kontrol lokal");
      
      const status = await response.text();
      relayElement.classList.toggle('on', status === "ON");
      showNotification(`${deviceName} ${status === "ON" ? "Menyala" : "Mati"} (Lokal)`);
    }
  } catch (error) {
    console.error(`Error controlling relay ${relayId}:`, error);
    showNotification(`Gagal mengontrol ${deviceName}`);
  }
}

// Listener Firebase untuk update realtime
function initFirebaseListeners() {
  // Status relay
  database.ref('relays/status').on('value', (snapshot) => {
    const data = snapshot.val();
    if (!data) return;
    
    for (let i = 0; i < 5; i++) {
      const element = document.getElementById(`relay${i}`);
      if (element && data[`relay${i}`] !== undefined) {
        element.classList.toggle('on', data[`relay${i}`]);
        relayStates[i] = data[`relay${i}`];
      }
    }
  });

  // Data jadwal
  database.ref('schedules').on('value', (snapshot) => {
    if (isOnline) {
      updateSchedulesUI(snapshot.val());
    }
  });
}

// Update tampilan waktu
function updateTime() {
  fetch('/getTime')
    .then(response => {
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    })
    .then(data => {
      document.getElementById('time').textContent = 
        `${data.hour}:${data.minute < 10 ? '0' : ''}${data.minute}:${data.second < 10 ? '0' : ''}${data.second}`;
      updateDayDisplay(data.day);
    })
    .catch(error => {
      console.error("Error updating time:", error);
    });
}

// Update tampilan hari
function updateDayDisplay(day) {
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jum'at", "Sabtu"];
  const dayElement = document.getElementById('day-display');
  
  dayElement.textContent = days[day];
  dayElement.className = "day-display";
  
  if (day === 0) dayElement.classList.add('sunday');
  else if (day === 5) dayElement.classList.add('friday');
  else dayElement.classList.add('other');
}

// Update tampilan jadwal
function updateSchedulesUI(schedulesData) {
  const scheduleList = document.getElementById('schedule-list');
  let htmlContent = '';
  
  if (schedulesData && schedulesData.schedules) {
    schedulesData.schedules.forEach(item => {
      const timeStr = `${item.hour}:${item.minute < 10 ? '0' : ''}${item.minute}`;
      const action = item.action === "ON" ? "Menyalakan" : "Mematikan";
      const device = getDeviceName(item.relay);
      htmlContent += `<div class="schedule-item">${action} ${device} pada jam ${timeStr}</div>`;
    });
  }
  
  scheduleList.innerHTML = htmlContent;
}

// Helper: get device name
function getDeviceName(relayIndex) {
  const devices = ["Lampu", "Kipas", "Nyamuk", "LED", "Stop Kontak"];
  return devices[relayIndex] || "Perangkat";
}

// Tampilkan notifikasi
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

// Toggle tampilan jadwal
function toggleSchedule() {
  const schedulePanel = document.getElementById('schedule-setting');
  schedulePanel.classList.toggle('hidden');
  
  if (!schedulePanel.classList.contains('hidden')) {
    updateSchedules();
  }
}

function closeScheduleList() {
  document.getElementById('schedule-setting').classList.add('hidden');
}

// Load data jadwal
function updateSchedules() {
  if (isOnline) {
    database.ref('schedules').once('value')
      .then(snapshot => updateSchedulesUI(snapshot.val()))
      .catch(error => {
        console.error("Firebase schedules error:", error);
        fetchLocalSchedules();
      });
  } else {
    fetchLocalSchedules();
  }
}

// Fallback ke jadwal lokal
function fetchLocalSchedules() {
  fetch('/getNextSchedules')
    .then(response => {
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    })
    .then(data => {
      let htmlContent = '';
      data.schedules.forEach(item => {
        htmlContent += `<div class="schedule-item">${item}</div>`;
      });
      document.getElementById('schedule-list').innerHTML = htmlContent;
    })
    .catch(error => {
      console.error("Error fetching local schedules:", error);
    });
}

// Inisialisasi aplikasi
document.addEventListener('DOMContentLoaded', init);