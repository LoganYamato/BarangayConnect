// ======================================================
// BarangayConnect | Official Dashboard Logic + Announcements
// ======================================================

// === Firebase Imports ===
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc,
  updateDoc, 
  doc, 
  query, 
  orderBy, 
  serverTimestamp 
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

// === Initialize Firebase (Prevents Duplicate App Error) ===
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

// === Wait for DOM to Load ===
document.addEventListener("DOMContentLoaded", () => {

  const reportsContainer = document.getElementById("reportsContainer");
  const logoutBtn = document.getElementById("logoutBtn");
  const annForm = document.getElementById("annForm");
  const annTitle = document.getElementById("annTitle");
  const annBody = document.getElementById("annBody");
  const annList = document.getElementById("annList");

  if (!reportsContainer) {
    console.error("❌ Missing element: #reportsContainer");
    return;
  }

  // ======================================================
  // REPORTS SECTION
  // ======================================================
  async function loadReports() {
    reportsContainer.innerHTML = "<p>Loading reports...</p>";

    try {
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

        const imgHTML = report.imageBase64
          ? `<img src="${report.imageBase64}" class="previewImg" alt="Proof Image">`
          : report.imageData
          ? `<img src="${report.imageData}" class="previewImg" alt="Proof Image">`
          : report.imageUrl
          ? `<img src="${report.imageUrl}" class="previewImg" alt="Proof Image">`
          : "";

        const card = document.createElement("div");
        card.classList.add("report-card");

        card.innerHTML = `
          <strong>${report.issueType || "Unknown Issue"}</strong> — 
          ${report.barangay || ""}, ${report.location || ""}<br>
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

      setupImagePreview();
      attachStatusListeners();

    } catch (err) {
      console.error("❌ Error loading reports:", err);
      reportsContainer.innerHTML = "<p>Failed to load reports.</p>";
    }
  }

  function attachStatusListeners() {
    document.querySelectorAll(".status-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        try {
          await updateDoc(doc(db, "reports", id), { status: "Resolved" });
          alert("✅ Report marked as resolved!");
          loadReports();
        } catch (err) {
          console.error("Error updating report:", err);
          alert("❌ Failed to update report status.");
        }
      });
    });
  }

  // ======================================================
  // ANNOUNCEMENT SECTION
  // ======================================================
  async function loadAnnouncements() {
    if (!annList) return;
    annList.innerHTML = "<p>Loading announcements...</p>";

    try {
      const q = query(collection(db, "announcements"), orderBy("timestamp", "desc"));
      const snap = await getDocs(q);

      annList.innerHTML = "";

      if (snap.empty) {
        annList.innerHTML = "<p>No announcements yet.</p>";
        return;
      }

      snap.forEach((docSnap) => {
        const ann = docSnap.data();
        const el = document.createElement("article");
        el.className = "ann";
        el.innerHTML = `
          <h4>${ann.title}</h4>
          <time>${
  ann.timestamp
    ? (typeof ann.timestamp.toDate === "function"
        ? ann.timestamp.toDate().toLocaleString()
        : new Date(ann.timestamp).toLocaleString())
    : "Unknown time"
}</time>

          <p style="margin:8px 0 0">${ann.body}</p>
        `;
        annList.appendChild(el);
      });
    } catch (err) {
      console.error("Error loading announcements:", err);
      annList.innerHTML = "<p>Failed to load announcements.</p>";
    }
  }

  if (annForm) {
    annForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const title = annTitle.value.trim();
      const body = annBody.value.trim();

      if (!title || !body) {
        alert("⚠️ Please fill out both title and body.");
        return;
      }

      try {
        await addDoc(collection(db, "announcements"), {
          title,
          body,
          timestamp: serverTimestamp()
        });
        alert("✅ Announcement posted successfully!");
        annForm.reset();
        loadAnnouncements();
      } catch (err) {
        console.error("Error posting announcement:", err);
        alert("❌ Failed to post announcement.");
      }
    });
  }

  // ======================================================
  // LOGOUT
  // ======================================================
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("currentUser");
      window.location.href = "index.html";
    });
  }

  // ======================================================
  // IMAGE PREVIEW MODAL
  // ======================================================
  function setupImagePreview() {
    const existing = document.getElementById("imgModal");
    if (existing) existing.remove();

    const modal = document.createElement("div");
    modal.id = "imgModal";
    modal.style.cssText = `
      display: none;
      position: fixed;
      z-index: 1000;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.8);
      justify-content: center;
      align-items: center;
    `;

    const img = document.createElement("img");
    img.id = "modalImg";
    img.style.cssText = `
      max-width: 90%;
      max-height: 90%;
      border-radius: 10px;
      box-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
    `;
    modal.appendChild(img);
    document.body.appendChild(modal);

    modal.addEventListener("click", () => (modal.style.display = "none"));

    document.querySelectorAll(".previewImg").forEach((image) => {
      image.addEventListener("click", () => {
        img.src = image.src;
        modal.style.display = "flex";
      });
    });
  }

  // ======================================================
  // INITIAL LOAD
  // ======================================================
  loadReports();
  loadAnnouncements();
});
