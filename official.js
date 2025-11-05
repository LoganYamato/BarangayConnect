// ======================================================
// BarangayConnect | Official Dashboard (Optimized Unified Build)
// ======================================================

// === Firebase Imports ===
import { 
  initializeApp 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { 
  getFirestore, collection, getDocs, updateDoc, doc, query, orderBy 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// === Firebase Config ===
const firebaseConfig = {
  apiKey: "AIzaSyDPrpZYIJYhAmZRxW0Ph3udw-vUz6UiPNk",
  authDomain: "iss-bc.firebaseapp.com",
  projectId: "iss-bc",
  storageBucket: "iss-bc.firebasestorage.app",
  messagingSenderId: "455122393981",
  appId: "1:455122393981:web:bdf281da744767c0064a14",
  measurementId: "G-6VQLV0PG81"
};

// === Initialize Firebase ===
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// === DOM Elements ===
const reportList = document.getElementById("reportList");
const logoutBtn = document.getElementById("logoutBtn");

// === Load Reports ===
async function loadReports() {
  if (!reportList) return console.warn("❗ Element #reportList not found.");

  reportList.innerHTML = "<p>Loading reports...</p>";

  try {
    // Fetch reports ordered by timestamp
    const q = query(collection(db, "reports"), orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      reportList.innerHTML = "<p>No reports available.</p>";
      return;
    }

    reportList.innerHTML = "";

    querySnapshot.forEach((docSnap) => {
      const report = docSnap.data();
      const reportId = docSnap.id;

      // Handle multiple possible image sources
      const imgHTML =
        report.imageBase64
          ? `<img src="${report.imageBase64}" class="previewImg" alt="Proof Image">`
          : report.imageData
          ? `<img src="${report.imageData}" class="previewImg" alt="Proof Image">`
          : report.imageUrl
          ? `<img src="${report.imageUrl}" class="previewImg" alt="Proof Image">`
          : "";

      // Build report card
      const card = document.createElement("div");
      card.className = "report-item";
      card.innerHTML = `
        <h4>${report.issueType || "Unknown Issue"}</h4>
        <small><strong>Barangay:</strong> ${report.barangay || "N/A"}</small><br>
        <small><strong>Location:</strong> ${report.location || "N/A"}</small><br>
        <p><strong>Description:</strong> ${report.desc || report.description || "No description provided."}</p>
        ${imgHTML}
        <div>
          <span class="status ${report.status || "Pending"}">${report.status || "Pending"}</span>
          <select class="statusSelect" data-id="${reportId}">
            <option value="Pending" ${report.status==="Pending"?"selected":""}>Pending</option>
            <option value="InProgress" ${report.status==="InProgress"?"selected":""}>In Progress</option>
            <option value="Resolved" ${report.status==="Resolved"?"selected":""}>Resolved</option>
          </select>
        </div>
      `;

      reportList.appendChild(card);
    });

    // Setup interactive elements
    attachStatusListeners();
    setupImagePreview();

  } catch (error) {
    console.error("❌ Error loading reports:", error);
    reportList.innerHTML = "<p>Failed to load reports. Please try again later.</p>";
  }
}

// === Status Update Handler ===
function attachStatusListeners() {
  document.querySelectorAll(".statusSelect").forEach((select) => {
    select.addEventListener("change", async (e) => {
      const id = e.target.dataset.id;
      const newStatus = e.target.value;
      try {
        await updateDoc(doc(db, "reports", id), { status: newStatus });
        e.target.previousElementSibling.textContent = newStatus;
        e.target.previousElementSibling.className = `status ${newStatus}`;
      } catch (err) {
        console.error("Error updating report:", err);
        alert("❌ Failed to update report status.");
      }
    });
  });
}

// === Image Preview Modal ===
function setupImagePreview() {
  const oldModal = document.getElementById("imgModal");
  if (oldModal) oldModal.remove();

  const modal = document.createElement("div");
  modal.id = "imgModal";
  modal.style.cssText = `
    display: none;
    position: fixed;
    z-index: 1000;
    left: 0; top: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.8);
    justify-content: center;
    align-items: center;
  `;

  const modalImg = document.createElement("img");
  modalImg.style.cssText = `
    max-width: 90%;
    max-height: 90%;
    border-radius: 10px;
    box-shadow: 0 0 15px rgba(255,255,255,0.3);
  `;
  modal.appendChild(modalImg);
  document.body.appendChild(modal);

  modal.addEventListener("click", () => (modal.style.display = "none"));

  document.querySelectorAll(".previewImg").forEach((img) => {
    img.addEventListener("click", () => {
      modalImg.src = img.src;
      modal.style.display = "flex";
    });
  });
}

// === Logout ===
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("currentUser");
    window.location.href = "index.html";
  });
}

// === Auto Refresh (Every 60 seconds for Sync) ===
setInterval(loadReports, 60000);

// === Initialize ===
document.addEventListener("DOMContentLoaded", loadReports);