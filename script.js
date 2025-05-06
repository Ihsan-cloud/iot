// Konfigurasi Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB9-JkNWyY2tWDFH3O25I1iK7ANoL6zg-0",
  authDomain: "ihsan-cloud-f3a02.firebaseapp.com",
  databaseURL: "https://ihsan-cloud-f3a02-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ihsan-cloud-f3a02",
  storageBucket: "ihsan-cloud-f3a02.appspot.com",
  messagingSenderId: "442997712719",
  appId: "1:442997712719:web:de3ef3dc4cbb5b5925873a"
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

// Cek koneksi internet (versi sederhana)
function checkConnection() {
  isOnline = navigator.onLine;
  updateConnectionUI(isOnline);
  
  if (isOnline) {
    showNotification("Terhubung dengan Cloud Firebase");
    // Sinkronkan status relay saat online
    database.ref('relays/status').once('value').then(snapshot => {
      const data = snapshot.val();
      if (data) {
        for (let i = 0; i < 5; i++) {
          const element = document.getElementById(`relay${i}`);
          if (element && data[`relay${i}`] !== undefined) {
            element.classList.toggle('on', data[`relay${i}`]);
            relayStates[i] = data[`relay${i}`];
          }
        }
      }
    });
  } else {
    showNotification("Mode Offline - Tidak bisa kontrol cloud");
  }
}

// Update tampilan status koneksi
function updateConnectionUI(connected) {
  const badge = document.getElementById('connection-badge');
  const text = document.getElementById('connection-text');
  
  badge.className = connected ? 'connection-status online-status' : 'connection-status offline-status';
  text.textContent = connected ? 'Cloud Connected' : 'Offline Mode';
}

// Kontrol relay (Firebase-only)
async function toggleRelay(relayId) {
  const relayElement = document.getElementById(`relay${relayId}`);
  const deviceName = relayElement.dataset.name;
  
  try {
    const newState = !relayElement.classList.contains('on');
    await database.ref(`relays/control/relay${relayId}`).set(newState);
    showNotification(`${deviceName} ${newState ? "Menyala" : "Mati"} (Cloud)`);
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
    updateSchedulesUI(snapshot.val());
  });
}

// Update tampilan waktu (versi lokal)
function updateTime() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  
  document.getElementById('time').textContent = `${hours}:${minutes}:${seconds}`;
  updateDayDisplay(now.getDay());
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

// Inisialisasi aplikasi
document.addEventListener('DOMContentLoaded', init);