// ======================================================
// BarangayConnect | Official Dashboard Logic + Announcements Sync
// ======================================================

// === Firebase Imports ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore, collection, getDocs, updateDoc, doc,
  query, orderBy, addDoc, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// === Firebase Config ===
const firebaseConfig = {
  apiKey: "AIzaSyDPrpZYIJYhAmZRxW0Ph3udw-vUz6UiPNk",
  authDomain: "iss-bc.firebaseapp.com",
  projectId: "iss-bc",
  storageBucket: "iss-bc.firebasestorage.app",
  messagingSenderId: "455122393981",
  appId: "1:455122393981:web:bdf281da744767c0064a14"
};

// === Initialize Firebase ===
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// === DOM Elements ===
const reportsContainer = document.getElementById("reportsContainer");

// === Load Reports ===
async function loadReports() {
  reportsContainer.innerHTML = "<p>Loading reports...</p>";

  const q = query(collection(db, "reports"), orderBy("timestamp", "desc"));
  const snap = await getDocs(q);

  reportsContainer.innerHTML = "";

  if (snap.empty) {
    reportsContainer.innerHTML = "<p>No reports available.</p>";
    return;
  }

  snap.forEach((docSnap) => {
    const report = docSnap.data();
    const reportId = docSnap.id;

    // ✅ Support all image fields (Base64, legacy, storage)
    const imgHTML = report.imageBase64
      ? `<img src="${report.imageBase64}" class="previewImg" alt="Proof Image">`
      : report.imageData
      ? `<img src="${report.imageData}" class="previewImg" alt="Proof Image">`
      : report.imageUrl
      ? `<img src="${report.imageUrl}" class="previewImg" alt="Proof Image">`
      : "";

    const card = document.createElement("div");
    card.classList.add("report-card");

    // Generate card content
    card.innerHTML = `
      <strong>${report.issueType || "Unknown Issue"}</strong> — ${report.barangay || ""}, ${report.location || ""}<br>
      <em>${report.desc || report.description || "No description provided"}</em><br>
      <small>Author: ${report.author || "Unknown"}</small><br>
      <small>Status: ${report.status || "Pending"}</small><br>
      ${imgHTML} <br>
      <button class="status-btn ${report.status === "Resolved" ? "status-resolved" : "status-pending"}" data-id="${reportId}">
        ${report.status === "Resolved" ? "Resolved" : "Mark as Resolved"}
      </button>
    `;
    reportsContainer.appendChild(card);
  });

  // === Image Preview Modal ===
  setupImagePreview();

  // === Event: Mark as Resolved ===
  document.querySelectorAll(".status-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      try {
        await updateDoc(doc(db, "reports", id), { status: "Resolved" });
        alert("✅ Report marked as resolved!");
        loadReports(); // Reload reports after update
      } catch (err) {
        console.error("Error updating report:", err);
        alert("❌ Failed to update report status.");
      }
    });
  });
}

// === Run Load on Start ===
document.addEventListener("DOMContentLoaded", loadReports);

// === Logout ===
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("currentUser");
    window.location.href = "index.html";
  });
}

// ======================================================
// 🖼️ Image Preview Modal Logic
// ======================================================
function setupImagePreview() {
  // Remove any previous modal
  const existing = document.getElementById("imgModal");
  if (existing) existing.remove();

  // Create modal
  const modal = document.createElement("div");
  modal.id = "imgModal";
  modal.style.cssText = `
    display: none; position: fixed; z-index: 1000;
    left: 0; top: 0; width: 100%; height: 100%;
    background-color: rgba(0, 0, 0, 0.8);
    justify-content: center; align-items: center;
  `;

  const img = document.createElement("img");
  img.id = "modalImg";
  img.style.cssText = `
    max-width: 90%; max-height: 90%;
    border-radius: 10px;
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
  `;
  modal.appendChild(img);
  document.body.appendChild(modal);

  // Close modal on click
  modal.addEventListener("click", () => (modal.style.display = "none"));

  // Open modal on image click
  document.querySelectorAll(".previewImg").forEach((image) => {
    image.addEventListener("click", () => {
      img.src = image.src;
      modal.style.display = "flex"; // Show modal
    });
  });
}

// ======================================================
// 📢 ANNOUNCEMENTS SYNC (New)
// ======================================================
const annForm = document.getElementById("annForm");
const annTitle = document.getElementById("annTitle");
const annBody = document.getElementById("annBody");
const annList = document.getElementById("annList");

async function loadAnnouncements() {
  const q = query(collection(db, "announcements"), orderBy("timestamp", "desc"));
  onSnapshot(q, (snapshot) => {
    annList.innerHTML = "";
    snapshot.forEach((doc) => {
      const data = doc.data();
      const el = document.createElement("article");
      el.className = "ann";
      el.innerHTML = `
        <h4>${data.title}</h4>
        <time>${data.timestamp ? new Date(data.timestamp.toDate()).toLocaleString() : ""}</time>
        <p>${data.body}</p>
        <div class="meta">Posted by ${data.author || "Barangay Official"}</div>
      `;
      annList.appendChild(el);
    });
  });
}

annForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = annTitle.value.trim();
  const body = annBody.value.trim();
  if (!title || !body) return;

  try {
    const currentOfficial = JSON.parse(localStorage.getItem("currentUser")) || {};
    await addDoc(collection(db, "announcements"), {
      title,
      body,
      author: currentOfficial.name || "Barangay Official",
      barangay: currentOfficial.barangay || "Santa Cruz, Makati",
      timestamp: serverTimestamp(),
    });
    annForm.reset();
    alert("✅ Announcement posted successfully!");
  } catch (err) {
    console.error("Error posting announcement:", err);
    alert("⚠️ Failed to post announcement. Please try again.");
  }
});

// Run announcements on load (only if elements exist)
document.addEventListener("DOMContentLoaded", () => {
  if (annList) loadAnnouncements();
});