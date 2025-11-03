// ======================================================
// BarangayConnect | Official Report Sync
// Compatible with Spark Plan (no Storage dependency)
// ======================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  updateDoc, 
  doc 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// ======================================================
// Firebase Config
// ======================================================
const firebaseConfig = {
  apiKey: "AIzaSyDPrpZYIJYhAmZRxW0Ph3udw-vUz6UiPNk",
  authDomain: "iss-bc.firebaseapp.com",
  projectId: "iss-bc",
  storageBucket: "iss-bc.firebasestorage.app",
  messagingSenderId: "455122393981",
  appId: "1:455122393981:web:bdf281da744767c0064a14"
};

// ======================================================
// Initialize Firebase
// ======================================================
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ======================================================
// DOM Elements
// ======================================================
const reportsContainer = document.getElementById("reportsContainer");

// ======================================================
// Load and Display Reports
// ======================================================
async function loadReports() {
  if (!reportsContainer) return;
  reportsContainer.innerHTML = "<p>Loading reports...</p>";

  try {
    const querySnapshot = await getDocs(collection(db, "reports"));
    reportsContainer.innerHTML = "";

    if (querySnapshot.empty) {
      reportsContainer.innerHTML = "<p>No reports available yet.</p>";
      return;
    }

    querySnapshot.forEach((docSnap) => {
      const report = docSnap.data();
      const reportDiv = document.createElement("div");
      reportDiv.className = "report-card";

      // Handle both base64 (imageData) and URL (imageUrl)
      const imgHTML = report.imageData 
        ? `<img src="${report.imageData}" alt="Proof Image">`
        : report.imageUrl
          ? `<img src="${report.imageUrl}" alt="Proof Image">`
          : "";

      reportDiv.innerHTML = `
        <strong>${report.issueType || 'N/A'}</strong> — 
        ${report.barangay || ''}, ${report.location || ''}<br>
        <em>${report.desc || report.description || ''}</em><br>
        <small>Author: ${report.author || 'Unknown'}</small><br>
        <small>Status: ${report.status || 'Pending'}</small><br>
        ${imgHTML}
        <br>
        <button class="status-btn ${report.status === 'Resolved' ? 'status-resolved' : 'status-pending'}"
          data-id="${docSnap.id}">
          ${report.status === 'Resolved' ? 'Resolved' : 'Mark as Resolved'}
        </button>
      `;

      reportsContainer.appendChild(reportDiv);
    });

    attachStatusListeners();
  } catch (error) {
    console.error("Error loading reports:", error);
    reportsContainer.innerHTML = "<p>Failed to load reports. Try again later.</p>";
  }
}

// ======================================================
// Mark Report as Resolved
// ======================================================
function attachStatusListeners() {
  document.querySelectorAll(".status-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      try {
        await updateDoc(doc(db, "reports", id), { status: "Resolved" });
        alert("✅ Report marked as resolved!");
        loadReports();
      } catch (err) {
        console.error("Error updating status:", err);
        alert("❌ Failed to update report status.");
      }
    });
  });
}

// ======================================================
// Initialize
// ======================================================
document.addEventListener("DOMContentLoaded", loadReports);