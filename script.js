// ==========================================
// SETTINGS & FACULTY LIST
// ==========================================
const ADMIN_PIN = "AWALI143"; 
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzRjcLmVnUxiqheX2uD46gmVFGT-Y7r4PwtQqiYXQshW-nAkz2GvhRhbhVa3ENFR_bToA/exec"; 

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
let progressInterval = null;

// Populate Dropdown Alphabetically
const selectEl = document.getElementById("faculty-select");
FACULTY_LIST.sort().forEach(name => {
  const opt = document.createElement("option");
  opt.value = name;
  opt.textContent = name;
  selectEl.appendChild(opt);
});

// Helper to get today's local date (YYYY-MM-DD)
function getTodayLocal() {
  return new Date().toLocaleDateString('en-CA');
}

// Initialize Admin date filter to today
const adminDateFilter = document.getElementById("admin-date-filter");
if (adminDateFilter) {
  adminDateFilter.value = getTodayLocal();
}

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

function unlockAdmin() {
  const pin = prompt("Enter Admin PIN to view records:");
  if (pin === ADMIN_PIN) {
    document.getElementById("admin-section").style.display = "block";
    showToast("Admin access unlocked.");
  } else if (pin !== null) {
    alert("Incorrect PIN.");
  }
}

// Fetch logs from Google Sheet database when admin unlocks
function fetchLogsFromCloud(callback) {
  if (WEB_APP_URL.includes("YOUR_GOOGLE_APPS_SCRIPT")) {
    showToast("Please configure your Google Apps Script Web App URL in script.js");
    if (callback) callback();
    return;
  }
  
  fetch(WEB_APP_URL)
    .then(res => res.json())
    .then(data => {
      logs = data;
      if (callback) callback();
    })
    .catch(err => {
      console.error("Error fetching logs:", err);
      showToast("Error connecting to cloud database.");
      if (callback) callback();
    });
}

function setButtonsDisabled(disabled) {
  const buttons = document.querySelectorAll(".button-grid button");
  buttons.forEach(btn => { btn.disabled = disabled; });
}

function logAttendance(slot) {
  const name = selectEl.value;
  const todayDate = getTodayLocal();

  if (!name) {
    alert("Please select your name first.");
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

  // Elements for the inline loading bar
  const statusContainer = document.getElementById("status-bar-container");
  const statusText = document.getElementById("status-text");
  const statusPercent = document.getElementById("status-percent");
  const progressFill = document.getElementById("progress-fill");
  const statusDetail = document.getElementById("status-detail");

  // Reset and show "Saving please wait" loading bar
  if (progressInterval) clearInterval(progressInterval);
  statusContainer.classList.remove("completed");
  statusContainer.style.display = "block";
  statusText.textContent = "Saving please wait...";
  statusDetail.textContent = `${name} — ${slotLabels[slot]}`;

  let progress = 10;
  progressFill.style.width = progress + "%";
  statusPercent.textContent = progress + "%";
  setButtonsDisabled(true);

  progressInterval = setInterval(() => {
    if (progress < 90) {
      progress += Math.floor(Math.random() * 12) + 5;
      if (progress > 90) progress = 90;
      progressFill.style.width = progress + "%";
      statusPercent.textContent = progress + "%";
    }
  }, 180);

  // Send data to Google Sheet database
  fetch(WEB_APP_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      date: todayDate,
      name: name,
      slot: slot,
      timeNow: timeNow
    })
  }).then(() => {
    clearInterval(progressInterval);
    progressFill.style.width = "100%";
    statusPercent.textContent = "100%";
    statusContainer.classList.add("completed");
    statusText.textContent = "Your response is recorded";
    statusDetail.textContent = `${name} • ${slotLabels[slot]} (${timeNow})`;
    
    selectEl.value = "";
    setButtonsDisabled(false);
  }).catch(err => {
    clearInterval(progressInterval);
    console.error(err);
    statusContainer.style.display = "none";
    setButtonsDisabled(false);
    alert("Failed to save attendance. Check your internet connection.");
  });
}
