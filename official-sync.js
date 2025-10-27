// official-sync.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, doc, setDoc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// === Firebase Config ===
const firebaseConfig = {
  apiKey: "AIzaSyD6f9Fo1aDebjEurvWFsffM33izUPUTylw",
  authDomain: "iss-bc.firebaseapp.com",
  projectId: "iss-bc",
  storageBucket: "iss-bc.firebasestorage.app",
  messagingSenderId: "455122393981",
  appId: "1:455122393981:web:bdf281da744767c0064a14",
  measurementId: "G-6VQLV0PG81"
};

// === Initialize Firestore ===
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// === Firestore Sync Functions ===
const COL = collection(db, "execTickets");

// Save to Firestore whenever DB changes locally
function saveToFirestore(id, data) {
  return setDoc(doc(COL, id), data);
}

// Load from Firestore (for the ticket)
async function loadFromFirestore(id) {
  const snap = await getDoc(doc(COL, id));
  return snap.exists() ? snap.data() : null;
}

// Observe Firestore for real-time updates
function subscribeToTicket(id, callback) {
  return onSnapshot(doc(COL, id), (snap) => {
    if (snap.exists()) callback(snap.data());
  });
}

// === Hook into your existing page ===
window.addEventListener("load", () => {
  const ticketInput = document.getElementById("ticketId");
  const loadBtn = document.getElementById("loadBtn");

  if (!ticketInput || !loadBtn) return;

  loadBtn.addEventListener("click", async () => {
    const id = ticketInput.value.trim();
    if (!id) return alert("Enter a Ticket ID");

    // Try Firestore first
    const data = await loadFromFirestore(id);
    if (data) {
      // Replace localStorage copy
      const DB = JSON.parse(localStorage.getItem("bc_exec_fw_min") || "{}");
      DB[id] = data;
      localStorage.setItem("bc_exec_fw_min", JSON.stringify(DB));
      console.log("Loaded from Firestore ✅");
    } else {
      console.log("No Firestore data for this ticket yet. Using local copy.");
    }

    // Subscribe for live updates
    subscribeToTicket(id, (data) => {
      const DB = JSON.parse(localStorage.getItem("bc_exec_fw_min") || "{}");
      DB[id] = data;
      localStorage.setItem("bc_exec_fw_min", JSON.stringify(DB));
      console.log("Realtime update from Firestore 🔄");
    });
  });

  // Watch for localStorage changes and upload
  window.addEventListener("beforeunload", () => {
    const DB = JSON.parse(localStorage.getItem("bc_exec_fw_min") || "{}");
    for (const [id, data] of Object.entries(DB)) {
      saveToFirestore(id, data);
    }
  });
});
