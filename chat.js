// ======================================================
// BarangayConnect | Resident Chat
// ======================================================

// === Firebase Imports ===
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
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

// === Initialize Firebase (no duplicate) ===
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

// === Elements ===
const chatContainer = document.getElementById("chatContainer");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

// === Simulate Resident Identity ===
// (Later you can replace with authenticated user data)
let residentName = localStorage.getItem("residentName") || "Resident";

// === Send Message ===
sendBtn.addEventListener("click", async () => {
  const text = messageInput.value.trim();
  if (!text) return;

  try {
    await addDoc(collection(db, "chats"), {
      sender: residentName,
      role: "resident",
      message: text,
      timestamp: serverTimestamp()
    });
    messageInput.value = "";
  } catch (err) {
    console.error("Error sending message:", err);
    alert("❌ Failed to send message.");
  }
});

// === Live Chat Sync ===
const q = query(collection(db, "chats"), orderBy("timestamp", "asc"));
onSnapshot(q, (snapshot) => {
  chatContainer.innerHTML = "";
  snapshot.forEach((doc) => {
    const data = doc.data();
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("message", data.role === "resident" ? "resident" : "official");

    msgDiv.innerHTML = `
      <strong>${data.sender}:</strong><br>${data.message}
      <br><small>${data.timestamp?.toDate ? data.timestamp.toDate().toLocaleString() : ""}</small>
    `;
    chatContainer.appendChild(msgDiv);
  });

  chatContainer.scrollTop = chatContainer.scrollHeight;
});
