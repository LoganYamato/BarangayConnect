// === OFFICIAL.JS (v2.1) ===
// BarangayConnect — Official Dashboard Logic

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// === Firebase Config ===
const firebaseConfig = {
  apiKey: "AIzaSyDPrpZYIJYhAmZRxW0Ph3udw-vUz6UiPNk",
  authDomain: "iss-bc.firebaseapp.com",
  projectId: "iss-bc",
  storageBucket: "iss-bc.appspot.com",
  messagingSenderId: "455122393981",
  appId: "1:455122393981:web:bdf281da744767c0064a14",
};

// === Initialize Firebase ===
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
window.firestoreActive = true;

// === User Check ===
const currentUser = JSON.parse(localStorage.getItem("currentUser"));
if (!currentUser || currentUser.role !== "official") {
  alert("Unauthorized access. Redirecting...");
  window.location.href = "index.html";
}

// === UI References ===
const reportList = document.getElementById("reportList");
const reportDetail = document.getElementById("reportDetail"); // NEW: fix for null error
const filterSelect = document.getElementById("filterStatus");
const sortSelect = document.getElementById("sortReports");
const searchInput = document.getElementById("searchInput");
const refreshBtn = document.getElementById("refreshBtn");
const officialBarangay = document.getElementById("officialBarangay");
if (officialBarangay) officialBarangay.textContent = currentUser.barangay;

// === Toast Helper ===
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

// === Clear Detail Panel ===
function clearDetail() {
  if (reportDetail) reportDetail.innerHTML = `<h2>Select a report to view details</h2>`;
}

// === Show Report Detail ===
function showDetail(r, id) {
  if (!reportDetail) return;
  reportDetail.innerHTML = `
    <h2>${r.issueType || "Unknown Issue"}</h2>
    <p><strong>Location:</strong> ${r.location || "N/A"}</p>
    <p><strong>Barangay:</strong> ${r.barangay || currentUser.barangay}</p>
    <p><strong>Reported by:</strong> ${r.author || "Anonymous"}</p>
    <p><strong>Status:</strong> ${r.status || "Pending"}</p>
    <p><strong>Description:</strong><br>${r.description || "No description"}</p>
    ${r.imageUrl ? `<img src="${r.imageUrl}" alt="Report Image" style="max-width:100%;border-radius:8px;margin-top:8px;">` : ""}
    <div style="margin-top:12px;display:flex;gap:8px;">
      <button id="btnInProgress" class="btn secondary">Mark In Progress</button>
      <button id="btnResolved" class="btn">Mark Resolved</button>
    </div>
  `;

  // === Button Handlers ===
  const btnInProgress = document.getElementById("btnInProgress");
  const btnResolved = document.getElementById("btnResolved");

  btnInProgress.addEventListener("click", async () => {
    await updateDoc(doc(db, "reports", id), { status: "In Progress" });
    toast("Report marked as In Progress", "#1e5bb8");
  });

  btnResolved.addEventListener("click", async () => {
    await updateDoc(doc(db, "reports", id), { status: "Resolved" });
    toast("Report marked as Resolved", "#16a34a");
  });
}

// === Render List ===
function renderList(snapshotOrArray) {
  if (!reportList) return;
  reportList.innerHTML = "";

  const reports = Array.isArray(snapshotOrArray)
    ? snapshotOrArray
    : snapshotOrArray.docs.map(d => ({ id: d.id, ...d.data() }));

  if (reports.length === 0) {
    reportList.innerHTML = `<li style="text-align:center;color:#666;">No reports found.</li>`;
    clearDetail();
    return;
  }

  reports.forEach(r => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${r.issueType || "Unknown"} — ${r.location || ""}</strong>
      <div class="small">Status: ${r.status || "Pending"} | Reporter: ${r.author || "Unknown"}</div>
    `;
    li.style.cursor = "pointer";
    li.addEventListener("click", () => {
      document.querySelectorAll("#reportList li").forEach(el => el.classList.remove("selected"));
      li.classList.add("selected");
      showDetail(r, r.id);
    });
    reportList.appendChild(li);
  });
}

// === Build Query ===
function buildQuery() {
  const base = [where("barangay", "==", currentUser.barangay)];
  const statusVal = filterSelect?.value || "All";
  const sortVal = sortSelect?.value === "latest" ? "desc" : "asc";

  if (statusVal !== "All") base.push(where("status", "==", statusVal));
  return query(collection(db, "reports"), ...base, orderBy("timestamp", sortVal));
}

// === Attach Firestore Listener ===
let unsubscribe = null;
function attachLiveListener() {
  if (unsubscribe) unsubscribe();
  const q = buildQuery();

  const statusIndicator = document.getElementById("statusIndicator");
  if (statusIndicator) {
    statusIndicator.textContent = "Connecting to Firestore...";
    statusIndicator.style.color = "#1e5bb8";
  }

  unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      renderList(snapshot);
      if (statusIndicator) {
        statusIndicator.textContent = "✅ Firestore Live Connected";
        statusIndicator.style.color = "#16a34a";
      }
    },
    (err) => {
      console.error("Firestore error:", err);
      if (statusIndicator) {
        statusIndicator.textContent = "❌ Firestore Error";
        statusIndicator.style.color = "red";
      }
    }
  );
}

// === Search Filter ===
if (searchInput) {
  searchInput.addEventListener("input", () => {
    const val = searchInput.value.toLowerCase();
    const filtered = window.cachedReports?.filter(r =>
      (r.issueType?.toLowerCase().includes(val)) ||
      (r.location?.toLowerCase().includes(val)) ||
      (r.description?.toLowerCase().includes(val))
    );
    renderList(filtered || []);
  });
}

// === Refresh Button ===
if (refreshBtn) refreshBtn.addEventListener("click", attachLiveListener);

// === Dropdown Filters ===
if (filterSelect) filterSelect.addEventListener("change", attachLiveListener);
if (sortSelect) sortSelect.addEventListener("change", attachLiveListener);

// === Logout ===
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("currentUser");
    window.location.href = "index.html";
  });
}

// === Init ===
clearDetail();
attachLiveListener();