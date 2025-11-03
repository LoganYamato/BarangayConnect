// official.js (production - no debug console)
// Loads reports for the logged-in official and allows status updates.
// Uses single where('barangay','==', ...) then filters/sorts client-side to avoid composite index requirements.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- Firebase config (your project) ---
const firebaseConfig = {
  apiKey: "AIzaSyDPrpZYIJYhAmZRxW0Ph3udw-vUz6UiPNk",
  authDomain: "iss-bc.firebaseapp.com",
  projectId: "iss-bc",
  storageBucket: "iss-bc.appspot.com",
  messagingSenderId: "455122393981",
  appId: "1:455122393981:web:bdf281da744767c0064a14"
};

// Initialize
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// UI refs
const reportList = document.getElementById("reportList");
const filterStatus = document.getElementById("filterStatus");
const sortReports = document.getElementById("sortReports");
const searchInput = document.getElementById("searchInput");
const refreshBtn = document.getElementById("refreshBtn");
const statusIndicator = document.getElementById("statusIndicator");
const logoutBtn = document.getElementById("logoutBtn");

// Detail refs
const detailTitle = document.getElementById("detailTitle");
const detailSub = document.getElementById("detailSub");
const detailIssue = document.getElementById("detailIssue");
const detailLocation = document.getElementById("detailLocation");
const detailAuthor = document.getElementById("detailAuthor");
const detailTimestamp = document.getElementById("detailTimestamp");
const detailDesc = document.getElementById("detailDesc");
const detailStatus = document.getElementById("detailStatus");
const statusBar = document.getElementById("statusBar");
const proofGallery = document.getElementById("proofGallery");

function toast(msg, color = "#1e5bb8") {
  const t = document.createElement("div");
  t.textContent = msg;
  Object.assign(t.style, {
    position: "fixed", right: "20px", bottom: "20px", padding: "10px 14px",
    background: color, color: "#fff", borderRadius: "8px", zIndex: 9999
  });
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2600);
}

// Helper: safe timestamp to number (ms)
function tsToMs(ts) {
  if (!ts) return 0;
  if (typeof ts === "number") return ts;
  if (ts.toMillis) return ts.toMillis();         // Firestore Timestamp
  if (typeof ts === "string") return Date.parse(ts);
  if (ts._seconds) return (ts._seconds * 1000) + Math.floor((ts._nanoseconds||0)/1e6);
  return 0;
}

// Get current user from localStorage (fallback)
const currentUser = (() => {
  try { return JSON.parse(localStorage.getItem("currentUser")) || {}; } catch (e) { return {}; }
})();

if (!currentUser || currentUser.role !== "official") {
  alert("Unauthorized access. Redirecting...");
  localStorage.removeItem("currentUser");
  window.location.href = "index.html";
} else {
  document.getElementById("officialBarangay").textContent = currentUser.barangay || "—";
}

// State
let unsubscribe = null;
let cachedReports = []; // array of {id, ...data}
let selectedId = null;

// Build a safe query — only single equality on barangay (no orderBy) to avoid composite index requirements
function buildBaseQuery() {
  const barangay = currentUser.barangay || "Santa Cruz";
  return query(collection(db, "reports"), where("barangay", "==", barangay));
}

// Apply client-side status filter + search + sort, then render
function applyFiltersAndRender() {
  const statusVal = filterStatus.value || "All";
  const searchVal = (searchInput.value || "").toLowerCase();
  const sortVal = sortReports.value || "latest";

  let list = cachedReports.slice();

  if (statusVal !== "All") {
    list = list.filter(r => (r.status || "Pending") === statusVal);
  }

  if (searchVal) {
    list = list.filter(r => {
      return (r.issueType || "").toLowerCase().includes(searchVal)
        || (r.location || "").toLowerCase().includes(searchVal)
        || (r.author || "").toLowerCase().includes(searchVal)
        || ((r.desc || r.description || "") + "").toLowerCase().includes(searchVal);
    });
  }

  // sort by timestamp (client-side)
  list.sort((a, b) => {
    const ta = tsToMs(a.timestamp);
    const tb = tsToMs(b.timestamp);
    return sortVal === "latest" ? tb - ta : ta - tb;
  });

  renderList(list);
}

function renderList(list) {
  reportList.innerHTML = "";
  if (!list || list.length === 0) {
    reportList.innerHTML = '<li style="text-align:center;color:#666">No reports found.</li>';
    clearDetail();
    return;
  }

  list.forEach(r => {
    const li = document.createElement("li");
    li.dataset.id = r.id;
    li.innerHTML = `
      <strong>${r.issueType || "Unknown"}</strong>
      <div class="small">${r.location || ""} — ${r.author || "Unknown"}</div>
      <div class="small muted">Status: <span class="pill">${r.status || "Pending"}</span></div>
    `;
    li.addEventListener("click", () => selectReport(r.id));
    if (r.id === selectedId) li.classList.add("selected");
    reportList.appendChild(li);
  });
}

function clearDetail() {
  selectedId = null;
  detailTitle.textContent = "Select a report";
  detailSub.textContent = "Click a report from the list to view details.";
  detailIssue.textContent = "—";
  detailLocation.textContent = "—";
  detailAuthor.textContent = "—";
  detailTimestamp.textContent = "—";
  detailDesc.textContent = "—";
  detailStatus.textContent = "—";
  statusBar.innerHTML = "";
  proofGallery.innerHTML = "";
}

function selectReport(id) {
  selectedId = id;
  const r = cachedReports.find(x => x.id === id);
  if (!r) return;
  // populate details
  detailTitle.textContent = `${r.issueType || "Report"} — ${r.location || ""}`;
  const tsMs = tsToMs(r.timestamp);
  detailSub.textContent = `${r.author || "Unknown"} • ${tsMs ? new Date(tsMs).toLocaleString() : ""}`;
  detailIssue.textContent = r.issueType || "—";
  detailLocation.textContent = r.location || "—";
  detailAuthor.textContent = r.author || "—";
  detailTimestamp.textContent = tsMs ? new Date(tsMs).toLocaleString() : "—";
  detailDesc.textContent = (r.desc || r.description) || "—";
  detailStatus.textContent = r.status || "Pending";

  // media
  proofGallery.innerHTML = "";
  if (r.imageUrl) {
    const div = document.createElement("div");
    div.className = "thumb";
    div.innerHTML = `<img src="${r.imageUrl}" alt="media" />`;
    proofGallery.appendChild(div);
  }

  // status buttons
  statusBar.innerHTML = "";
  const makeBtn = (label, color, cb) => {
    const b = document.createElement("button");
    b.className = "btn";
    b.textContent = label;
    b.style.background = color;
    b.style.border = "0";
    b.addEventListener("click", cb);
    return b;
  };

  const pendingBtn = makeBtn("Mark Pending", "#6b7280", () => updateStatus(id, "Pending"));
  const inProgBtn = makeBtn("Mark In Progress", "#1e5bb8", () => updateStatus(id, "In Progress"));
  const resolvedBtn = makeBtn("Mark Resolved", "#16a34a", () => updateStatus(id, "Resolved"));

  // disable if already resolved
  if ((r.status || "") === "Resolved") {
    pendingBtn.disabled = true; inProgBtn.disabled = true; resolvedBtn.disabled = true;
    pendingBtn.style.opacity = "0.5"; inProgBtn.style.opacity = "0.5"; resolvedBtn.style.opacity = "0.5";
  }

  statusBar.appendChild(pendingBtn);
  statusBar.appendChild(inProgBtn);
  statusBar.appendChild(resolvedBtn);

  // visually mark selection in list
  Array.from(reportList.children).forEach(li => {
    li.classList.toggle("selected", li.dataset.id === id);
  });
}

async function updateStatus(id, newStatus) {
  try {
    const ref = doc(db, "reports", id);
    await updateDoc(ref, { status: newStatus });
    toast(`Status updated to "${newStatus}"`, "#16a34a");
    // update cache locally
    const idx = cachedReports.findIndex(r => r.id === id);
    if (idx !== -1) { cachedReports[idx].status = newStatus; applyFiltersAndRender(); selectReport(id); }
  } catch (err) {
    console.error("Update failed", err);
    toast("Failed to update status — check console", "#c62828");
  }
}

// Live listener using only barangay equality filter (avoids composite index requirements)
let liveUnsub = null;
function attachListener() {
  if (liveUnsub) {
    try { liveUnsub(); } catch (e) { /* ignore */ }
    liveUnsub = null;
  }

  const q = buildListenerQuery();
  statusIndicator.textContent = "Listening for updates...";
  try {
    liveUnsub = onSnapshot(q,
      snap => {
        cachedReports = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        applyFiltersAndRender();
        statusIndicator.textContent = "✅ Live connected";
        statusIndicator.style.color = "#16a34a";
      },
      err => {
        console.error("onSnapshot error", err);
        statusIndicator.textContent = "❌ Firestore error (see console)";
        statusIndicator.style.color = "red";
        // fallback to localStorage
        const local = JSON.parse(localStorage.getItem("reports") || "[]");
        cachedReports = local.map((r, i) => ({ id: r.id || `local-${i}`, ...r }));
        applyFiltersAndRender();
      }
    );
  } catch (err) {
    console.error("Attach listener failed", err);
    statusIndicator.textContent = "Listener attach failed";
    statusIndicator.style.color = "red";
  }
}

function buildListenerQuery() {
  // single equality where — do not call orderBy on server to avoid composite index requirements.
  const barangay = currentUser.barangay || "Santa Cruz";
  return query(collection(db, "reports"), where("barangay", "==", barangay));
}

// Initial one-shot load (getDocs) as warm-up then attach live listener
async function initialLoad() {
  statusIndicator.textContent = "Fetching initial data...";
  try {
    const q = buildListenerQuery();
    const snap = await getDocs(q);
    cachedReports = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    applyFiltersAndRender();
    statusIndicator.textContent = "✅ Initial load OK";
    statusIndicator.style.color = "#16a34a";
  } catch (err) {
    console.error("Initial getDocs failed", err);
    statusIndicator.textContent = "Initial load failed — using local data";
    statusIndicator.style.color = "orange";
    const local = JSON.parse(localStorage.getItem("reports") || "[]");
    cachedReports = local.map((r,i)=>({ id: r.id || `local-${i}`, ...r }));
    applyFiltersAndRender();
  }

  attachListener();
}

// Events
filterStatus.addEventListener("change", () => applyFiltersAndRender());
sortReports.addEventListener("change", () => applyFiltersAndRender());
searchInput.addEventListener("input", () => applyFiltersAndRender());
refreshBtn.addEventListener("click", () => initialLoad());
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("currentUser");
  window.location.href = "index.html";
});

// Kick off
initialLoad();