import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const db = window.db;
const auth = window.auth;

const reportList = document.getElementById("reportList");
const filterStatus = document.getElementById("filterStatus");
const refreshBtn = document.getElementById("refreshBtn");
const detailDiv = document.getElementById("reportDetail");

// === Utility: Render Details ===
function showDetail(report, id) {
  detailDiv.innerHTML = `
    <h3>${report.issueType}</h3>
    <p><strong>Location:</strong> ${report.location}</p>
    <p><strong>Description:</strong> ${report.desc || "No description"}</p>
    <p><strong>Status:</strong> ${report.status}</p>
    <p><strong>Reported by:</strong> ${report.author || "Unknown"}</p>
    <p><strong>Barangay:</strong> ${report.barangay}</p>
    <button id="markPending">Mark Pending</button>
    <button id="markInProgress">Mark In Progress</button>
    <button id="markResolved">Mark Resolved</button>
  `;

  const updateStatus = async (newStatus) => {
    await updateDoc(doc(db, "reports", id), { status: newStatus });
    alert(`Status updated to ${newStatus}`);
    loadReports(); // Refresh list
  };

  document.getElementById("markPending").onclick = () => updateStatus("Pending");
  document.getElementById("markInProgress").onclick = () => updateStatus("In Progress");
  document.getElementById("markResolved").onclick = () => updateStatus("Resolved");
}

// === Core Loader ===
async function loadReports() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser || !currentUser.barangay) {
    reportList.innerHTML = "<li>No official logged in or barangay missing.</li>";
    return;
  }

  reportList.innerHTML = "<li>Loading reports...</li>";

  const selectedStatus = filterStatus.value;
  let q = query(collection(db, "reports"), where("barangay", "==", currentUser.barangay));

  const snapshot = await getDocs(q);
  const reports = [];
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    reports.push({ id: docSnap.id, ...data });
  });

  // Apply status filter locally
  const filtered = selectedStatus === "All"
    ? reports
    : reports.filter(r => r.status === selectedStatus);

  // Render list
  reportList.innerHTML = "";
  if (filtered.length === 0) {
    reportList.innerHTML = "<li>No reports found.</li>";
  } else {
    filtered.forEach(r => {
      const li = document.createElement("li");
      li.textContent = `${r.issueType} — ${r.location} (${r.status})`;
      li.style.cursor = "pointer";
      li.onclick = () => showDetail(r, r.id);
      reportList.appendChild(li);
    });
  }
}

// === Listeners ===
filterStatus.addEventListener("change", loadReports);
refreshBtn.addEventListener("click", loadReports);

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("currentUser");
    window.location.href = "index.html";
  });
}

// === Authentication Watcher ===
onAuthStateChanged(auth, (user) => {
  if (user) {
    loadReports();
  } else {
    // If no Firebase auth, still fallback to localStorage login
    const localUser = JSON.parse(localStorage.getItem("currentUser"));
    if (localUser && localUser.role === "official") {
      loadReports();
    } else {
      window.location.href = "index.html";
    }
  }
});