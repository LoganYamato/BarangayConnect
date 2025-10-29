// official.js (v2) — module
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  updateDoc,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- Firebase config (same project) ---
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

// --- UI refs ---
const reportList = document.getElementById("reportList");
const statusIndicator = document.getElementById("statusIndicator");
const filterStatus = document.getElementById("filterStatus");
const sortReports = document.getElementById("sortReports");
const searchInput = document.getElementById("searchInput");
const refreshBtn = document.getElementById("refreshBtn");

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
const latOut = document.getElementById("latOut");
const lngOut = document.getElementById("lngOut");

let map = L.map("map", { zoomControl: true }).setView([14.5585, 121.0271], 15);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 20 }).addTo(map);
let marker = null;

// --- user / barangay ---
const currentUser = JSON.parse(localStorage.getItem("currentUser")) || { barangay: "Santa Cruz" };
if (!currentUser || !currentUser.role || currentUser.role !== "official") {
  // If not logged-in as official still allow local dev, but redirect in prod
  console.warn("User not official. Using demo / fallback mode.");
}
const barangay = currentUser.barangay || "Santa Cruz";
const officialBarangayEl = document.getElementById("officialBarangay");
if (officialBarangayEl) officialBarangayEl.textContent = barangay;

// --- small toast ---
function toast(msg, color = "#1e5bb8") {
  const t = document.createElement("div");
  t.textContent = msg;
  Object.assign(t.style, { position: "fixed", bottom: "20px", right: "20px", background: color, color: "white", padding: "10px 14px", borderRadius: "8px", zIndex: 9999, opacity: 0, transition: "opacity 0.2s" });
  document.body.appendChild(t);
  requestAnimationFrame(() => (t.style.opacity = 1));
  setTimeout(() => { t.style.opacity = 0; setTimeout(() => t.remove(), 300); }, 2500);
}

// --- selected report ---
let cachedReports = [];
let selectedReport = null;

// --- helpers ---
function fmt(ts) {
  try { return new Date(ts.seconds ? ts.seconds * 1000 : ts).toLocaleString(); } catch (e) { return new Date().toLocaleString(); }
}

function setMap(lat, lng) {
  if (!lat && !lng) return removeMap();
  if (marker) marker.setLatLng([lat, lng]);
  else { marker = L.marker([lat, lng], { draggable: true }).addTo(map); marker.on('dragend', async () => { const p = marker.getLatLng(); latOut.textContent = p.lat.toFixed(6); lngOut.textContent = p.lng.toFixed(6); if (selectedReport) { await updateDoc(doc(db, 'reports', selectedReport.id), { lat: p.lat, lng: p.lng }); toast('Coordinates saved'); } }); }
  map.setView([lat, lng], 16);
  latOut.textContent = Number(lat).toFixed(6); lngOut.textContent = Number(lng).toFixed(6);
}
function removeMap() { if (marker) { map.removeLayer(marker); marker = null; } latOut.textContent = '—'; lngOut.textContent = '—'; }

function renderList(reports) {
  reportList.innerHTML = "";
  if (!reports || reports.length === 0) {
    reportList.innerHTML = '<li class="muted small">No reports found.</li>';
    return;
  }

  reports.forEach(r => {
    const li = document.createElement('li');
    li.className = 'report-row';
    li.dataset.id = r.id;
    li.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <strong>${r.issueType || r.issue || 'Issue'}</strong>
          <div class="small muted">${r.location || 'Unknown'}</div>
        </div>
        <div class="small">${r.status || 'Pending'}</div>
      </div>`;

    li.addEventListener('click', async () => {
      document.querySelectorAll('#reportList li').forEach(x => x.classList.remove('selected'));
      li.classList.add('selected');
      await openReport(r.id);
    });

    reportList.appendChild(li);
  });
}

async function openReport(id) {
  try {
    const ref = doc(db, 'reports', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) { toast('Report not found', 'red'); return; }
    selectedReport = { id: snap.id, ...snap.data() };

    detailTitle.textContent = selectedReport.issueType || selectedReport.issue || 'Report';
    detailSub.textContent = `${selectedReport.barangay || ''} — ${selectedReport.location || ''}`;
    detailIssue.textContent = selectedReport.issueType || selectedReport.issue || '—';
    detailLocation.textContent = `${selectedReport.barangay || ''} • ${selectedReport.location || ''}`;
    detailAuthor.textContent = selectedReport.author || selectedReport.name || 'Anonymous';
    detailTimestamp.textContent = fmt(selectedReport.timestamp || selectedReport.createdAt || Date.now());
    detailDesc.textContent = selectedReport.desc || selectedReport.description || 'No description provided';
    detailStatus.textContent = selectedReport.status || 'Pending';

    // timeline / proof media
    proofGallery.innerHTML = '';
    const urls = selectedReport.proofUrls || selectedReport.proofs || (selectedReport.imageUrl ? [selectedReport.imageUrl] : []);
    if (urls.length === 0) proofGallery.innerHTML = '<div class="muted small">No media</div>';
    else urls.forEach(u => { const d = document.createElement('div'); d.className = 'thumb'; if (/\.(mp4|webm|ogg)$/i.test(u) || u.includes('video')) { const v = document.createElement('video'); v.src = u; v.controls = true; d.appendChild(v); } else { const img = new Image(); img.src = u; d.appendChild(img); } proofGallery.appendChild(d); });

    // map
    const lat = selectedReport.lat ?? selectedReport.coords?.[0] ?? selectedReport.latitude;
    const lng = selectedReport.lng ?? selectedReport.coords?.[1] ?? selectedReport.longitude;
    if (lat != null && lng != null) setMap(lat, lng); else removeMap();

    // status buttons
    buildStatusButtons(selectedReport.status);
  } catch (err) {
    console.error('openReport error', err);
    toast('Failed to open report', 'red');
  }
}

function buildStatusButtons(currentStatus) {
  statusBar.innerHTML = '';
  const statuses = ['Pending','In Progress','Resolved','Closed'];
  statuses.forEach(s => {
    const b = document.createElement('button');
    b.textContent = s;
    b.className = 'btn';
    if (s === currentStatus) { b.classList.add('secondary'); b.style.background = '#16a34a'; b.style.color = '#fff'; }
    b.addEventListener('click', async () => {
      if (!selectedReport) return toast('Open a report first', 'orange');
      try { await updateDoc(doc(db, 'reports', selectedReport.id), { status: s }); toast(`Status updated: ${s}`, '#1e5bb8'); }
      catch (e) { console.error(e); toast('Failed to update status','red'); }
    });
    statusBar.appendChild(b);
  });
}

// --- query builder ---
function buildQuery() {
  const base = [ where('barangay', '==', barangay) ];
  const statusVal = (filterStatus && filterStatus.value) || 'All';
  if (statusVal && statusVal !== 'All') base.push(where('status','==',statusVal));
  // orderBy by timestamp (desc = latest)
  const sortVal = (sortReports && sortReports.value) || 'latest';
  return query(collection(db,'reports'), ...base, orderBy('timestamp', sortVal === 'latest' ? 'desc' : 'asc'));
}

let unsubscribe = null;

async function attachListener() {
  // detach old
  if (unsubscribe) unsubscribe();

  try {
    const q = buildQuery();
    // initial fetch for cachedReports
    const snap = await getDocs(q);
    cachedReports = snap.docs.map(d=>({ id: d.id, ...d.data() }));
    renderList(cachedReports);

    // real-time
    unsubscribe = onSnapshot(q, (snapshot) => {
      cachedReports = snapshot.docs.map(d=>({ id: d.id, ...d.data() }));
      renderList(cachedReports);
      statusIndicator.textContent = '✅ Firestore Live Connected';
      statusIndicator.style.color = '#16a34a';
    }, (err) => {
      console.error('listener error', err);
      statusIndicator.textContent = '❌ Firestore Error — check console';
      statusIndicator.style.color = 'red';
    });
  } catch (err) {
    console.error('attachListener error', err);
    statusIndicator.textContent = '⚠️ Failed to load (check console)';
    statusIndicator.style.color = 'red';
  }
}

// --- filters / search handlers ---
if (filterStatus) filterStatus.addEventListener('change', attachListener);
if (sortReports) sortReports.addEventListener('change', attachListener);
if (searchInput) searchInput.addEventListener('input', (e) => {
  const v = (e.target.value || '').toLowerCase();
  const filtered = cachedReports.filter(r => (
    (r.issueType||'').toLowerCase().includes(v) || (r.location||'').toLowerCase().includes(v) || (r.desc||r.description||'').toLowerCase().includes(v)
  ));
  renderList(filtered);
});

if (refreshBtn) refreshBtn.addEventListener('click', () => { toast('Refreshing…'); attachListener(); });

// --- init ---
attachListener();

// expose small helpers for dev console
window._cachedReports = cachedReports;
window.openReportById = openReport;