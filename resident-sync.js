// official.js — Updated for Firestore announcement sync
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore, collection, addDoc, serverTimestamp,
  getDocs, orderBy, query, onSnapshot
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDPrpZYIJYhAmZRxW0Ph3udw-vUz6UiPNk",
  authDomain: "iss-bc.firebaseapp.com",
  projectId: "iss-bc",
  storageBucket: "iss-bc.firebasestorage.app",
  messagingSenderId: "455122393981",
  appId: "1:455122393981:web:bdf281da744767c0064a14"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Retrieve current logged official
const currentOfficial = JSON.parse(localStorage.getItem("currentOfficial"));
if (!currentOfficial) {
  window.location.href = "index.html";
}

document.getElementById("welcomeText").textContent = `Welcome, ${currentOfficial.name || "Official"}!`;

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("currentOfficial");
  window.location.href = "index.html";
});


// -----------------------------
// ANNOUNCEMENTS MANAGEMENT
// -----------------------------
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

// Post new announcement
annForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = annTitle.value.trim();
  const body = annBody.value.trim();
  if (!title || !body) return;

  try {
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

// Initialize
document.addEventListener("DOMContentLoaded", loadAnnouncements);