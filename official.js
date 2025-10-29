// === OFFICIAL.JS ===
// Handles report loading and status updates for officials

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// === Firebase Config ===
const firebaseConfig = {
  apiKey: "AIzaSyDPrpZYIJYhAmZRxW0Ph3udw-vUz6UiPNk",
  authDomain: "iss-bc.firebaseapp.com",
  projectId: "iss-bc",
  storageBucket: "iss-bc.appspot.com",
  messagingSenderId: "455122393981",
  appId: "1:455122393981:web:bdf281da744767c0064a14",
};

// === Initialize Firebase ===
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
window.firestoreActive = true;

// === User Check ===
const currentUser = JSON.parse(localStorage.getItem("currentUser"));

if (!currentUser || currentUser.role !== "official") {
  alert("Unauthorized access. Redirecting...");
  window.location.href = "index.html";
}

// === UI References ===
const reportList = document.getElementById("reportList");
const filterSelect = document.getElementById("filterStatus");
const officialBarangay = document.getElementById("officialBarangay");
if (officialBarangay) officialBarangay.textContent = currentUser.barangay;

// === Toast Helper ===
function toast(msg, color = "#1e5bb8") {
  const t = document.createElement("div");
  t.textContent = msg;
  Object.assign(t.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    background: color,
    color: "white",
    padding: "10px 14px",
    borderRadius: "8px",
    boxShadow: "0 3px 8px rgba(0,0,0,0.25)",
    zIndex: 9999,
    opacity: "0",
    transition: "opacity 0.3s"
  });
  document.body.appendChild(t);
  setTimeout(() => (t.style.opacity = "1"), 10);
  setTimeout(() => {
    t.style.opacity = "0";
    setTimeout(() => t.remove(), 400);
  }, 3000);
}

// === Render Reports ===
function renderReports(snapshot, selectedStatus = "All") {
  reportList.innerHTML = "";

  if (snapshot.empty) {
    const li = document.createElement("li");
    li.textContent = "No reports found for your barangay.";
    li.style.textAlign = "center";
    li.style.color = "#666";
    reportList.appendChild(li);
    return;
  }

  snapshot.forEach((docSnap) => {
    const r = docSnap.data();

    // Filter by selected status
    if (selectedStatus !== "All" && r.status !== selectedStatus) return;

    const li = document.createElement("li");
    li.className = "report-item";
    li.style.marginBottom = "12px";
    li.style.padding = "10px";
    li.style.border = "1px solid #ccc";
    li.style.borderRadius = "10px";
    li.style.background = "#f9fafb";

    const title = document.createElement("strong");
    title.textContent = `${r.issueType || "Unknown"} — ${r.barangay || ""} ${r.location || ""}`;
    li.appendChild(title);

    const info = document.createElement("div");
    info.textContent = `Status: ${r.status || "Pending"} | Reported by: ${r.author || "Unknown"}`;
    info.style.fontSize = "13px";
    info.style.marginTop = "4px";
    li.appendChild(info);

    if (r.imageUrl) {
      const img = document.createElement("img");
      img.src = r.imageUrl;
      img.alt = "Report Image";
      img.style.maxWidth = "120px";
      img.style.marginTop = "8px";
      img.style.borderRadius = "6px";
      li.appendChild(img);
    }

    // === Status Update Buttons ===
    const btnContainer = document.createElement("div");
    btnContainer.style.marginTop = "8px";
    btnContainer.style.display = "flex";
    btnContainer.style.gap = "6px";

    const btnInProgress = document.createElement("button");
    btnInProgress.textContent = "Mark In Progress";
    btnInProgress.className = "btn secondary";

    const btnResolved = document.createElement("button");
    btnResolved.textContent = "Mark Resolved";
    btnResolved.className = "btn";

    if (r.status === "Resolved") {
      btnInProgress.disabled = true;
      btnResolved.disabled = true;
      btnInProgress.style.opacity = "0.5";
      btnResolved.style.opacity = "0.5";
    }

    btnInProgress.addEventListener("click", async () => {
      await updateDoc(doc(db, "reports", docSnap.id), { status: "In Progress" });
      toast("Report marked as In Progress", "#1e5bb8");
    });

    btnResolved.addEventListener("click", async () => {
      await updateDoc(doc(db, "reports", docSnap.id), { status: "Resolved" });
      toast("Report marked as Resolved", "#16a34a");
    });

    btnContainer.appendChild(btnInProgress);
    btnContainer.appendChild(btnResolved);
    li.appendChild(btnContainer);

    reportList.appendChild(li);
  });
}

// === Firestore Query (Safe) ===
async function loadReports() {
  if (!currentUser.barangay) {
    console.error("Barangay missing for user");
    reportList.innerHTML = `<li style="color:red;text-align:center;">Barangay not found for this account.</li>`;
    return;
  }

  const reportsRef = collection(db, "reports");
  const q = query(reportsRef, where("barangay", "==", currentUser.barangay));

  const statusIndicator = document.createElement("div");
  statusIndicator.style.textAlign = "center";
  statusIndicator.style.margin = "6px 0";
  statusIndicator.style.color = "#16a34a";
  statusIndicator.textContent = "Connecting to Firestore...";
  reportList.parentElement.prepend(statusIndicator);

  try {
    const initial = await getDocs(q);
    renderReports(initial);
  } catch (err) {
    console.error("Initial Firestore load failed:", err);
    toast("Initial Firestore load failed", "red");
  }

  onSnapshot(
    q,
    (snapshot) => {
      statusIndicator.textContent = "✅ Firestore Live Connected";
      renderReports(snapshot, filterSelect?.value || "All");
    },
    (err) => {
      console.error("Error loading reports:", err);
      statusIndicator.textContent = "❌ Firestore Error — check console";
      statusIndicator.style.color = "red";
      reportList.innerHTML = "<li style='color:red;text-align:center;'>Error loading reports.</li>";
    }
  );
}

// === Filter Handling ===
if (filterSelect) {
  filterSelect.addEventListener("change", async () => {
    loadReports(); // re-run query and render with filter applied
  });
}

// === Logout ===
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("currentUser");
    window.location.href = "index.html";
  });
}

// === Initialize ===
loadReports();
