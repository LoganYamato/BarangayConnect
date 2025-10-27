// ======================================================
// BarangayConnect | Official Dashboard Firestore Sync
// ======================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  query, 
  orderBy 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// ======================================================
// Firebase Config (same as resident-sync.js)
// ======================================================
const firebaseConfig = {
  apiKey: "AIzaSyDPrpZYIJYhAmZRxW0Ph3udw-vUz6UiPNk",
  authDomain: "iss-bc.firebaseapp.com",
  projectId: "iss-bc",
  storageBucket: "iss-bc.firebasestorage.app",
  messagingSenderId: "455122393981",
  appId: "1:455122393981:web:bdf281da744767c0064a14",
  measurementId: "G-6VQLV0PG81"
};

// ======================================================
// Initialize Firebase + Firestore
// ======================================================
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ======================================================
// DOM Elements
// ======================================================
const reportList = document.getElementById("reportReviewList");
const refreshBtn = document.getElementById("refreshBtn");
const statusMsg = document.getElementById("statusMessage");

// ======================================================
// Load Reports from Firestore
// ======================================================
async function loadReports() {
  if (!reportList) return;

  reportList.innerHTML = "<li>Loading reports...</li>";
  
  try {
    const q = query(collection(db, "reports"), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);

    reportList.innerHTML = ""; // clear placeholder

    if (snapshot.empty) {
      reportList.innerHTML = "<li>No reports available yet.</li>";
      return;
    }

    snapshot.forEach((doc) => {
      const r = doc.data();
      const li = document.createElement("li");
      li.innerHTML = `
        <strong>${r.issueType || "Unknown Issue"}</strong><br>
        📍 ${r.location || "No location"}<br>
        🧑‍💼 Reported by: ${r.author || "Anonymous"}<br>
        📝 ${r.description || ""}<br>
        <small>Status: ${r.status || "Pending"}</small>
      `;
      li.style.marginBottom = "10px";
      li.style.padding = "8px";
      li.style.border = "1px solid #ccc";
      li.style.borderRadius = "8px";
      li.style.backgroundColor = "#f9f9f9";
      reportList.appendChild(li);
    });

    if (statusMsg) {
      statusMsg.textContent = "✅ Reports updated successfully!";
      statusMsg.style.color = "green";
    }

  } catch (err) {
    console.error("Error loading reports:", err);
    reportList.innerHTML = "<li>❌ Failed to load reports.</li>";
    if (statusMsg) {
      statusMsg.textContent = "⚠️ Error loading reports.";
      statusMsg.style.color = "red";
    }
  }
}

// ======================================================
// Manual Refresh
// ======================================================
if (refreshBtn) {
  refreshBtn.addEventListener("click", () => {
    loadReports();
  });
}

// ======================================================
// Initial Load
// ======================================================
loadReports();

// ======================================================
// Logout (optional, matches your main script.js)
// ======================================================
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("currentUser");
    window.location.href = "index.html";
  });
}
