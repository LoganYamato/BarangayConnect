// ======================================================
// BarangayConnect | Resident Report Submission Sync
// ======================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } 
  from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// ======================================================
// Firebase Config (corrected)
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
const reportForm = document.getElementById("reportForm");
const issueTypeInput = document.getElementById("issueType");
const locationInput = document.getElementById("location");
const descriptionInput = document.getElementById("description");
const submitMsg = document.getElementById("submitMessage");

// ======================================================
// Handle Submit to Firestore
// ======================================================
if (reportForm) {
  reportForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const currentUser = JSON.parse(localStorage.getItem("currentUser")) || {};
    const author = currentUser.name || "Anonymous Resident";

    const report = {
      issueType: issueTypeInput.value.trim(),
      location: locationInput.value.trim(),
      description: descriptionInput.value.trim(),
      author,
      status: "Pending",
      timestamp: serverTimestamp()
    };

    try {
      await addDoc(collection(db, "reports"), report);
      submitMsg.textContent = "✅ Report submitted successfully!";
      submitMsg.style.color = "green";
      reportForm.reset();

    } catch (err) {
      console.error("Error adding report:", err);
      submitMsg.textContent = "❌ Failed to submit report. Try again.";
      submitMsg.style.color = "red";
    }
  });
}
