
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
  }, 6000); // total 4 detik
}
function toggleRelay(id) {
  fetch(`/control?relay${id}=TOGGLE`)
    .then(r => {
      if(!r.ok) throw Error("Gagal");
      return r.text();
    })
    .then(s => {
      let e = document.getElementById(`relay${id}`);
      e.classList.toggle('on', s === "ON");
      showNotification(`${e.dataset.name} ${s === "ON" ? "Menyala" : "Mati"}`);
    })
    .catch(e => console.error("Error:", e));
}

function updateTime() {
  fetch('/getTime')
    .then(r => r.json())
    .then(d => {
      document.getElementById('time').innerText = `${d.hour}:${d.minute}:${d.second}`;
      updateDayDisplay(d.day);
    })
    .catch(e => console.error("Gagal memperbarui waktu:", e));
}

function updateDayDisplay(day) {
  let e = document.getElementById('day-display');
  let n = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jum'at", "Sabtu"];
  e.innerText = n[day];
  e.className = "day-display";
  if(day === 0) e.classList.add('sunday');
  else if(day === 5) e.classList.add('friday');
  else e.classList.add('other');
}


function submitWiFiForm() {
  let ssid = document.getElementById('wifi-ssid').value;
  let password = document.getElementById('wifi-password').value;
  
  fetch(`/setWiFi`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ssid: ssid, password: password})
  })
  .then(response => {
    if(!response.ok) throw Error('Gagal mengirim data WiFi');
   // showNotification('Pengaturan WiFi berhasil disimpan');
 
    toggleWiFiForm();
  })
  .catch(e => {
    console.error(e);
    showNotification('BERHASIL! IP. http://192.168.1.6/');
  });
}

function hideWarningMessage() {
  let e = document.getElementById('warning-message');
  if(e) e.remove();
}

function updateRelayStatus() {
  fetch('/getRelayStatus')
    .then(r => {
      if(!r.ok) throw Error("Gagal mengambil status relay");
      return r.json();
    })
    .then(d => {
      for(let i = 0; i < 5; i++) {
        let e = document.getElementById(`relay${i}`);
        let s = d[`relay${i}`];
        e.classList.toggle('on', s === "ON");
      }
    })
    .catch(e => console.error("Gagal memperbarui status relay:", e));
}

function setWiFi() {
  let ssid = document.getElementById('ssid').value;
  let pass = document.getElementById('password').value;

  fetch(`/setWiFi?ssid=${encodeURIComponent(ssid)}&password=${encodeURIComponent(pass)}`)
  .then(() => {
    const form = document.getElementById('wifi-setting');
    form.style.animation = 'formClose 0.6s forwards';
    form.addEventListener('animationend', () => {
      form.classList.add('hidden');
      showNotification("WiFi berhasil disimpan!");
    }, { once: true });
  })
  .catch(e => {
    console.error("Gagal menyimpan WiFi:", e);
    showNotification("Gagal menyimpan WiFi");
  });
}
function setTime() {
  // 1. Cek koneksi internet terlebih dahulu
  fetch('/checkInternet')
    .then(response => response.json())
    .then(data => {
      const timeForm = document.getElementById('time-settings');
      
      // 2. Jika online: tampilkan IP dan nonaktifkan form
      if (data.connected) {
        // Buat/munculkan elemen IP
        const ipInfo = timeForm.querySelector('.ip-info') || document.createElement('div');
        ipInfo.className = 'ip-info';
        ipInfo.innerHTML = ` Terhubung (IP: ${data.publicIP})`;
        timeForm.insertBefore(ipInfo, timeForm.firstChild);
        
        // Nonaktifkan input dan ganti pesan tombol
        timeForm.querySelectorAll('input, select').forEach(el => el.disabled = true);
        showNotification("Waktu disinkronisasi otomatis via NTP");
      } 
      // 3. Jika offline: set waktu manual
      else {
        const h = document.getElementById('hour').value;
        const m = document.getElementById('minute').value;
        const d = document.getElementById('day').value;
        
        fetch(`/setTime?hour=${h}&minute=${m}&day=${d}`)
          .then(() => {
            timeForm.classList.add('hidden');
            updateTime();
            hideWarningMessage();
          })
          .catch(e => {
            console.error("Gagal mengatur waktu:", e);
            showNotification("Gagal mengatur waktu");
          });
      }
    })
    .catch(e => console.error("Gagal cek internet:", e));
}
function updateSchedules() {
  fetch('/getNextSchedules')
    .then(r => r.json())
    .then(d => {
      let s = '';
      d.schedules.forEach(i => {
        s += `<div class="schedule-item">${i}</div>`;
      });
      document.getElementById('schedule-list').innerHTML = s;
    })
    .catch(e => console.error("Gagal memperbarui jadwal:", e));
}

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

  // Jika ingin menutup form
  if (action === 'close' || !form.classList.contains('hidden')) {
    form.style.animation = 'formClose 0.6s cubic-bezier(0.65, 0, 0.35, 1) forwards';
    form.addEventListener('animationend', () => {
      form.classList.add('hidden');
    }, { once: true });
  } 
  // Jika ingin membuka form
  else {
    form.classList.remove('hidden');
    form.style.animation = 'formAppear 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards';
  }
}

function closeScheduleList() {
  toggleForm('schedule', 'close');
}
setInterval(updateTime, 1000);
setInterval(updateRelayStatus, 1000);
setInterval(updateSchedules, 900000);

updateTime();
updateRelayStatus();
updateSchedules();