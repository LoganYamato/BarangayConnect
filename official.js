// official.js
// Module that powers official.html (Firestore-backed)
// Keep this file next to official.html and reference as module (type="module")

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* =========================
   Firebase config (use your project values)
   ========================= */
const firebaseConfig = {
  apiKey: "AIzaSyDPrpZYIJYhAmZRxW0Ph3udw-vUz6UiPNk",
  authDomain: "iss-bc.firebaseapp.com",
  projectId: "iss-bc",
  storageBucket: "iss-bc.appspot.com",
  messagingSenderId: "455122393981",
  appId: "1:455122393981:web:bdf281da744767c0064a14",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
window.firestoreActive = true;

/* ======= UI refs ======= */
const reportList = document.getElementById("reportList");
const filterSelect = document.getElementById("filterStatus");
const sortSelect = document.getElementById("sortReports");
const searchInput = document.getElementById("searchInput");
const refreshBtn = document.getElementById("refreshBtn");
const statusIndicator = document.getElementById("statusIndicator");

const detailTitle = document.getElementById("detailTitle");
const detailSub = document.getElementById("detailSub");
const detailIssue = document.getElementById("detailIssue");
const detailLocation = document.getElementById("detailLocation");
const detailAuthor = document.getElementById("detailAuthor");
const detailTimestamp = document.getElementById("detailTimestamp");
const detailDesc = document.getElementById("detailDesc");
const statusBar = document.getElementById("statusBar");
const timelineEl = document.getElementById("timeline");
const proofGallery = document.getElementById("proofGallery");
const officialBarangayEl = document.getElementById("officialBarangay");
const mapEl = document.getElementById("map");

let cachedReports = []; // array of { id, ...data }
let selectedReport = null;
let unsubscribe = null;

/* ======= Helpers ======= */
function toast(msg, color = "#1e5bb8") {
  const t = document.createElement("div");
  t.textContent = msg;
  Object.assign(t.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    background: color,
    color: "white",
    padding: "10px 14px",
    borderRadius: "8px",
    boxShadow: "0 3px 8px rgba(0,0,0,0.25)",
    zIndex: 9999,
    opacity: "0",
    transition: "opacity 0.3s"
  });
  document.body.appendChild(t);
  setTimeout(() => (t.style.opacity = "1"), 10);
  setTimeout(() => {
    t.style.opacity = "0";
    setTimeout(() => t.remove(), 400);
  }, 3000);
}

function fmtTimestamp(ts) {
  if (!ts) return "—";
  // Firestore Timestamp ?
  if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleString();
  // ISO string?
  const d = new Date(ts);
  if (!isNaN(d)) return d.toLocaleString();
  return String(ts);
}

function safeGetString(v) {
  return (typeof v === "string" && v.trim() !== "") ? v : "—";
}

/* ======= Auth + user check ======= */
const currentUser = JSON.parse(localStorage.getItem("currentUser"));
if (!currentUser || currentUser.role !== "official") {
  alert("Unauthorized access. Please login as an official.");
  window.location.href = "index.html";
}
officialBarangayEl.textContent = currentUser.barangay || "—";

if (!currentUser.barangay) {
  statusIndicator.textContent = "⚠️ Your account has no barangay set. Showing local mode only.";
  statusIndicator.style.color = "orange";
  // fallback: render local reports (script.js provides local fallback)
}

/* ======= Render & UI actions ======= */
function clearDetail() {
  selectedReport = null;
  detailTitle.textContent = "Select a report";
  detailSub.textContent = "Click a report from the list to view details.";
  detailIssue.textContent = "—";
  detailLocation.textContent = "—";
  detailAuthor.textContent = "—";
  detailTimestamp.textContent = "—";
  detailDesc.textContent = "—";
  timelineEl.innerHTML = "";
  proofGallery.innerHTML = "";
  statusBar.innerHTML = "";
  mapEl.textContent = "No coordinates";
}

function buildStatusButtons(report) {
  statusBar.innerHTML = "";
  const statuses = ["Pending", "In Progress", "Resolved", "Closed"];
  statuses.forEach(s => {
    const b = document.createElement("button");
    b.textContent = s;
    b.className = s === (report.status || "Pending") ? "btn" : "btn secondary";
    if (s === report.status) {
      b.disabled = true;
      b.style.opacity = "0.85";
    }
    b.addEventListener("click", async () => {
      try {
        await updateDoc(doc(db, "reports", report.id), {
          status: s,
          lastUpdate: new Date().toISOString()
        });
        toast(`Status changed → ${s}`, "#1e5bb8");
      } catch (err) {
        console.error("Status update failed:", err);
        toast("Failed to update status", "red");
      }
    });
    statusBar.appendChild(b);
  });
}

function renderTimeline(report) {
  timelineEl.innerHTML = "";
  const history = report.history || [];
  if (Array.isArray(history) && history.length) {
    history.slice().reverse().forEach(h => {
      const div = document.createElement("div");
      div.className = "timeline-item";
      const t = fmtTimestamp(h.ts || h.timestamp || h.time);
      const text = h.text || h.msg || h.note || "";
      div.innerHTML = `<div class="muted small">${t}</div><div>${text}</div>`;
      timelineEl.appendChild(div);
    });
  } else if (report.lastMessage) {
    const div = document.createElement("div");
    div.className = "timeline-item";
    div.innerHTML = `<div class="muted small">${fmtTimestamp(report.lastUpdate || report.updatedAt)}</div><div>${report.lastMessage}</div>`;
    timelineEl.appendChild(div);
  } else {
    timelineEl.innerHTML = `<div class="muted small">No updates yet</div>`;
  }
}

function renderGallery(report) {
  proofGallery.innerHTML = "";
  const urls = report.proofUrls || report.proofs || (report.imageUrl ? [report.imageUrl] : []);
  if (!Array.isArray(urls) || urls.length === 0) {
    proofGallery.innerHTML = `<div class="muted small">No media</div>`;
    return;
  }
  urls.forEach(u => {
    const d = document.createElement("div"); d.className = "thumb";
    if (/\.(mp4|webm|ogg)$/i.test(u) || u.includes("video")) {
      const v = document.createElement("video"); v.src = u; v.controls = true; d.appendChild(v);
    } else {
      const img = new Image(); img.src = u; img.alt = "proof"; d.appendChild(img);
    }
    proofGallery.appendChild(d);
  });
}

function setMap(report) {
  mapEl.textContent = "No coordinates";
  const lat = report.lat ?? (Array.isArray(report.coords) ? report.coords[0] : undefined);
  const lng = report.lng ?? (Array.isArray(report.coords) ? report.coords[1] : undefined);
  if (lat != null && lng != null) {
    // simple link to google maps preview (keeps bundle small for presentation)
    mapEl.innerHTML = `<a href="https://www.google.com/maps?q=${lat},${lng}" target="_blank">Open coordinates in Google Maps — ${lat.toFixed(6)}, ${lng.toFixed(6)}</a>`;
  }
}

/* ======= List rendering ======= */
function renderList(reportsArray) {
  reportList.innerHTML = "";

  // apply status filter client-side
  const statusFilter = filterSelect?.value || "All";
  const search = (searchInput?.value || "").trim().toLowerCase();
  const sort = sortSelect?.value || "latest";

  let list = reportsArray.slice(); // copy

  // status filter
  if (statusFilter !== "All") {
    list = list.filter(r => (r.status || "Pending") === statusFilter);
  }

  // search filter
  if (search) {
    list = list.filter(r => {
      const hay = `${r.issueType || r.issue || ""} ${r.location || ""} ${r.author || r.name || ""} ${r.desc || r.description || ""}`.toLowerCase();
      return hay.includes(search);
    });
  }

  // sort by timestamp (client-side)
  list.sort((a, b) => {
    const ta = a.timestamp ? (a.timestamp.seconds ? a.timestamp.seconds * 1000 : Date.parse(a.timestamp)) : 0;
    const tb = b.timestamp ? (b.timestamp.seconds ? b.timestamp.seconds * 1000 : Date.parse(b.timestamp)) : 0;
    return sort === "latest" ? tb - ta : ta - tb;
  });

  if (list.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No reports match the current filters.";
    li.style.textAlign = "center";
    li.style.color = "#666";
    reportList.appendChild(li);
    clearDetail();
    return;
  }

  list.forEach(r => {
    const li = document.createElement("li");
    li.dataset.id = r.id;
    li.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <strong>${safeGetString(r.issueType || r.issue)}</strong>
          <div class="muted small">${safeGetString(r.location)}</div>
        </div>
        <div style="text-align:right">
          <div class="muted small">${safeGetString(r.status || "Pending")}</div>
          <div class="muted small">${fmtTimestamp(r.timestamp)}</div>
        </div>
      </div>
    `;
    li.addEventListener("click", () => {
      // mark selected UI
      document.querySelectorAll("#reportList li").forEach(x => x.classList.remove("selected"));
      li.classList.add("selected");
      showDetail(r);
    });
    reportList.appendChild(li);
  });
}

/* ======= Show detail for clicked report ======= */
function showDetail(r) {
  selectedReport = r;
  detailTitle.textContent = r.issueType || r.issue || "Report";
  detailSub.textContent = `${r.barangay || ""} — ${r.location || ""}`;
  detailIssue.textContent = safeGetString(r.issueType || r.issue);
  detailLocation.textContent = `${r.barangay || ""} • ${r.location || ""}`;
  detailAuthor.textContent = r.author || r.name || "Anonymous";
  detailTimestamp.textContent = fmtTimestamp(r.timestamp || r.createdAt);
  detailDesc.textContent = r.desc || r.description || "No description provided";
  buildStatusButtons(r);
  renderTimeline(r);
  renderGallery(r);
  setMap(r);
}

/* ======= Firestore listener: only filter by barangay (server-side) and then client-side filters ======= */
function attachLiveListener() {
  if (!currentUser || !currentUser.barangay) {
    // no barangay — fall back to local storage (script.js provides local fallback)
    statusIndicator.textContent = "⚠️ No barangay assigned to account — local mode.";
    statusIndicator.style.color = "orange";
    const localReports = JSON.parse(localStorage.getItem("reports") || "[]");
    cachedReports = localReports.map((r, i) => ({ id: r.id || `local-${i}`, ...r }));
    renderList(cachedReports);
    return;
  }

  const reportsRef = collection(db, "reports");
  const q = query(reportsRef, where("barangay", "==", currentUser.barangay));

  // show connecting
  statusIndicator.textContent = "Connecting to Firestore...";
  statusIndicator.style.color = "#666";

  // preload (getDocs) then realtime
  (async () => {
    try {
      const snap = await getDocs(q);
      cachedReports = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      renderList(cachedReports);
      statusIndicator.textContent = "✅ Firestore initial load";
      statusIndicator.style.color = "#16a34a";
    } catch (err) {
      console.error("Initial load error:", err);
      statusIndicator.textContent = "⚠️ Initial Firestore load failed — check console";
      statusIndicator.style.color = "orange";
      // fallback to local
      const localReports = JSON.parse(localStorage.getItem("reports") || "[]");
      cachedReports = localReports.map((r, i) => ({ id: r.id || `local-${i}`, ...r }));
      renderList(cachedReports);
    }

    // attach realtime (keeps only where on barangay — avoids composite-index requirement)
    unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        cachedReports = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        renderList(cachedReports);
        statusIndicator.textContent = "✅ Firestore Live Connected";
        statusIndicator.style.color = "#16a34a";
      },
      (err) => {
        console.error("Realtime onSnapshot error:", err);
        statusIndicator.textContent = "❌ Firestore Error — check console";
        statusIndicator.style.color = "red";
      }
    );
  })();
}

/* ======= Wire UI controls ======= */
filterSelect?.addEventListener("change", () => {
  renderList(cachedReports);
});
sortSelect?.addEventListener("change", () => {
  renderList(cachedReports);
});
searchInput?.addEventListener("input", () => {
  renderList(cachedReports);
});
refreshBtn?.addEventListener("click", () => {
  toast("Refreshing…");
  // re-attach listener (will also call getDocs pre-load)
  if (unsubscribe) unsubscribe();
  attachLiveListener();
});

/* ======= expose small API for other scripts (optional) ======= */
window.loadReports = async () => {
  if (unsubscribe) unsubscribe();
  attachLiveListener();
};

/* ======= initialize ======= */
clearDetail();
attachLiveListener();

/* ======= cleanup on unload ======= */
window.addEventListener("beforeunload", () => {
  if (unsubscribe) unsubscribe();
});