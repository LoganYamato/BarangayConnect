import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  orderBy
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const db = window.db;
const auth = window.auth;

const reportList = document.getElementById("reportList");
const filterStatus = document.getElementById("filterStatus");
const refreshBtn = document.getElementById("refreshBtn");
const detailDiv = document.getElementById("reportDetail");

// === Utility: Show Report Details ===
function showDetail(report, id) {
  detailDiv.innerHTML = `
    <h3>${report.issueType}</h3>
    <p><strong>Location:</strong> ${report.location}</p>
    <p><strong>Description:</strong> ${report.description || report.desc || "No description"}</p>
    <p><strong>Status:</strong> ${report.status}</p>
    <p><strong>Reported by:</strong> ${report.author || "Unknown"}</p>
    <p><strong>Barangay:</strong> ${report.barangay || "N/A"}</p>
    <button id="markPending">Mark Pending</button>
    <button id="markInProgress">Mark In Progress</button>
    <button id="markResolved">Mark Resolved</button>
  `;

  const updateStatus = async (newStatus) => {
    try {
      await updateDoc(doc(db, "reports", id), { status: newStatus });
      alert(`Status updated to ${newStatus}`);
      loadReports();
    } catch (err) {
      alert("Error updating status: " + err.message);
    }
  };

  document.getElementById("markPending").onclick = () => updateStatus("Pending");
  document.getElementById("markInProgress").onclick = () => updateStatus("In Progress");
  document.getElementById("markResolved").onclick = () => updateStatus("Resolved");
}

// === Load Reports from Firestore ===
async function loadReports() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser || !currentUser.barangay) {
    reportList.innerHTML = "<li>No official logged in or barangay missing.</li>";
    return;
  }

  reportList.innerHTML = "<li>Loading reports...</li>";

  try {
    const selectedStatus = filterStatus.value;
    const q = query(
      collection(db, "reports"),
      where("barangay", "==", currentUser.barangay),
      orderBy("timestamp", "desc")
    );

    const snapshot = await getDocs(q);
    const reports = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    // Apply filter
    const filtered = selectedStatus === "All"
      ? reports
      : reports.filter(r => r.status === selectedStatus);

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

  } catch (err) {
    console.error("Error loading reports:", err);
    reportList.innerHTML = "<li>⚠️ Failed to load reports.</li>";
  }
}

// === Event Listeners ===
filterStatus.addEventListener("change", loadReports);
refreshBtn.addEventListener("click", loadReports);

// === Logout Button ===
document.getElementById("logoutBtn")?.addEventListener("click", () => {
  localStorage.removeItem("currentUser");
  window.location.href = "index.html";
});

// === Auth Watcher ===
onAuthStateChanged(auth, (user) => {
  if (user) loadReports();
  else {
    const localUser = JSON.parse(localStorage.getItem("currentUser"));
    if (localUser?.role === "official") loadReports();
    else window.location.href = "index.html";
  }
});
