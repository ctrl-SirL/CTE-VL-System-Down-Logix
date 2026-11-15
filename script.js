// ==========================================
// SETTINGS & FACULTY LIST
// ==========================================
const ADMIN_PIN = "AWALI143"; 
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyk9ukESOeVNUVGZxQrEtpt4NsGBJWNU7XGqVCKtd_DXwmqXWZh3Y6BKejCLwE5XPnxXg/exec"; 

const FACULTY_LIST = [
  "ALFEREZ, JOHNDREB O.",
  "AWALI, ELIAZER A.",
  "CABALBAG, JIMSON J.",
  "DATO, HUDJAYFA H.",
  "DELOS SANTOS, SUNSHINE",
  "GALANAGA, JAMES B.",
  "GALLETO, EDWARD ARON O.",
  "MACABOCSIT, MARIAN A.",
  "NURULLA, KADEL-SAH J.",
  "REGUNAS, WILLAJOY I.",
  "SALUNGKAG, FATIMA K.",
  "SANICO, ROMEO ANGELICA C."
];

let logs = [];

// Populate Dropdown Alphabetically
const selectEl = document.getElementById("faculty-select");
FACULTY_LIST.sort().forEach(name => {
  const opt = document.createElement("option");
  opt.value = name;
  opt.textContent = name;
  selectEl.appendChild(opt);
});

// Set default date input to today
const dateInput = document.getElementById("log-date");
const todayLocal = new Date().toLocaleDateString('en-CA'); 
dateInput.value = todayLocal;

// Live Clock Update
function updateClock() {
  const now = new Date();
  document.getElementById("live-clock").textContent = now.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
  });
  document.getElementById("live-date").textContent = now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}
setInterval(updateClock, 1000);
updateClock();

function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.style.display = "block";
  setTimeout(() => { toast.style.display = "none"; }, 3500);
}

function getCurrentTimeFormatted() {
  return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// Fetch logs from Google Sheet database when admin unlocks
function fetchLogsFromCloud(callback) {
  if (WEB_APP_URL.includes("YOUR_GOOGLE_APPS_SCRIPT")) {
    showToast("Please configure your Google Apps Script Web App URL in script.js");
    if(callback) callback();
    return;
  }
  
  fetch(WEB_APP_URL)
    .then(res => res.json())
    .then(data => {
      logs = data;
      if(callback) callback();
    })
    .catch(err => {
      console.error("Error fetching logs:", err);
      showToast("Error connecting to cloud database.");
      if(callback) callback();
    });
}

function logAttendance(slot) {
  const name = selectEl.value;
  const selectedDate = dateInput.value;

  if (!name) {
    alert("Please select your name first.");
    return;
  }
  if (!selectedDate) {
    alert("Please select a valid date.");
    return;
  }
  if (WEB_APP_URL.includes("YOUR_GOOGLE_APPS_SCRIPT")) {
    alert("Setup Required: Please paste your Google Apps Script Web App URL into script.js first.");
    return;
  }

  const slotLabels = {
    amIn: "AM Time IN",
    amOut: "AM Time OUT",
    pmIn: "PM Time IN",
    pmOut: "PM Time OUT"
  };

  const timeNow = getCurrentTimeFormatted();
  showToast(`Saving ${slotLabels[slot]}... Please wait.`);

  // Send data to Google Sheet database
  fetch(WEB_APP_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      date: selectedDate,
      name: name,
      slot: slot,
      timeNow: timeNow
    })
  }).then(() => {
    showToast(`Successfully Recorded: ${name} — ${slotLabels[slot]} (${timeNow})`);
    selectEl.value = "";
  }).catch(err => {
    console.error(err);
    alert("Failed to save attendance. Check your internet connection.");
  });
}

// Admin Privacy Controls
function unlockAdmin() {
  const enteredPin = prompt("Enter Admin PIN to view attendance records:");
  if (enteredPin === ADMIN_PIN) {
    document.getElementById("admin-section").style.display = "block";
    document.getElementById("privacy-banner").style.display = "none";
    document.getElementById("sheet-link").href = "https://docs.google.com/spreadsheets/d/" + getSheetIdFromScriptUrl();
    fetchLogsFromCloud(() => renderTable());
  } else if (enteredPin !== null) {
    alert("Incorrect PIN.");
  }
}

function getSheetIdFromScriptUrl() {
  // Helper to point directly to your master Google Sheet if needed
  return ""; 
}

function lockAdmin() {
  document.getElementById("admin-section").style.display = "none";
  document.getElementById("privacy-banner").style.display = "flex";
}

function renderTable() {
  const selectedDate = dateInput.value;
  const filteredLogs = logs.filter(item => item.date === selectedDate);
  const tbody = document.getElementById("log-table-body");

  document.getElementById("record-count").textContent = `Records for ${selectedDate}: ${filteredLogs.length}`;

  if (filteredLogs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#64748b;">No records logged for ${selectedDate} in cloud database. Click Admin or refresh after logging.</td></tr>`;
    return;
  }

  tbody.innerHTML = filteredLogs.map((row, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>${row.date}</td>
      <td class="name-col"><strong>${row.name}</strong></td>
      <td>${row.amIn || '<span class="empty-slot">--</span>'}</td>
      <td>${row.amOut || '<span class="empty-slot">--</span>'}</td>
      <td>${row.pmIn || '<span class="empty-slot">--</span>'}</td>
      <td>${row.pmOut || '<span class="empty-slot">--</span>'}</td>
    </tr>
  `).join("");
}

function exportCSV() {
  const selectedDate = dateInput.value;
  const filteredLogs = logs.filter(item => item.date === selectedDate);

  if (filteredLogs.length === 0) {
    alert(`No records found for ${selectedDate} to export.`);
    return;
  }

  const headers = ["No.", "Date", "Faculty Name", "AM Time IN", "AM Time OUT", "PM Time IN", "PM Time OUT"];
  const rows = filteredLogs.map((r, i) => [
    i + 1,
    r.date,
    `"${r.name}"`,
    r.amIn || "",
    r.amOut || "",
    r.pmIn || "",
    r.pmOut || ""
  ]);

  const csvContent = "data:text/csv;charset=utf-8,"
    + headers.join(",") + "\n"
    + rows.map(e => e.join(",")).join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `Faculty_DTR_${selectedDate}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
