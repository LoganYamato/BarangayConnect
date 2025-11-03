// ======================================================
// BarangayConnect | Official Dashboard Firebase Sync (Safe Build)
// Compatible with resident.html + official.js
// ======================================================

// Use the same SDK version and pattern as resident-sync.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ======================================================
// Firebase Config (same as resident)
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
const auth = getAuth(app);

// ======================================================
// Make Firestore & Auth globally available
// ======================================================
window.app = app;
window.db = db;
window.auth = auth;

// ======================================================
// Optional Test Load (for debugging only)
// ======================================================
// This helps confirm that official.html can “see” reports like resident.html.
(async () => {
  try {
    const q = query(collection(db, "reports"), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    console.log(`✅ [Official-Sync] Found ${snapshot.size} reports in Firestore`);
  } catch (err) {
    console.error("❌ [Official-Sync] Firestore test failed:", err);
  }
})();
