<script type="module">
  import { 
    initializeApp 
  } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
  import { 
    getFirestore, collection, query, where, onSnapshot, updateDoc, doc, getDocs 
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

  // === Auth Check ===
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser || currentUser.role !== "official") {
    alert("Unauthorized access. Redirecting...");
    window.location.href = "index.html";
  }
  document.getElementById("officialBarangay").textContent = currentUser.barangay;

  // === Logout ===
  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("currentUser");
    window.location.href = "index.html";
  });

  // === UI References ===
  const reportList = document.getElementById("reportList");
  const filterSelect = document.getElementById("filterStatus");
  const sortSelect = document.getElementById("sortReports");
  const searchInput = document.getElementById("searchInput");
  const refreshBtn = document.getElementById("refreshBtn");

  // === Toast helper ===
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

  // === Query Setup ===
  const reportsRef = collection(db, "reports");
  const q = query(reportsRef, where("barangay", "==", currentUser.barangay));

  let allReports = []; // cached data

  // === Render reports with filters/sorting/search ===
  function renderReports() {
    let filtered = [...allReports];
    const filterVal = filterSelect.value;
    const sortVal = sortSelect.value;
    const searchVal = searchInput.value.toLowerCase();

    // Filter by status
    if (filterVal !== "All") {
      filtered = filtered.filter(r => (r.status || "Pending") === filterVal);
    }

    // Search filter
    if (searchVal) {
      filtered = filtered.filter(r =>
        (r.issueType || "").toLowerCase().includes(searchVal) ||
        (r.location || "").toLowerCase().includes(searchVal)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      const t1 = a.timestamp?.seconds || 0;
      const t2 = b.timestamp?.seconds || 0;
      return sortVal === "latest" ? t2 - t1 : t1 - t2;
    });

    // Render list
    reportList.innerHTML = "";
    if (filtered.length === 0) {
      const li = document.createElement("li");
      li.textContent = "No matching reports.";
      li.style.textAlign = "center";
      li.style.color = "#666";
      reportList.appendChild(li);
      return;
    }

    filtered.forEach((r) => {
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

      // Status update buttons
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
        await updateDoc(doc(db, "reports", r.id), { status: "In Progress" });
        toast("Report marked as In Progress", "#1e5bb8");
      });

      btnResolved.addEventListener("click", async () => {
        await updateDoc(doc(db, "reports", r.id), { status: "Resolved" });
        toast("Report marked as Resolved", "#16a34a");
      });

      btnContainer.appendChild(btnInProgress);
      btnContainer.appendChild(btnResolved);
      li.appendChild(btnContainer);
      reportList.appendChild(li);
    });
  }

  // === Listen to Firestore in realtime ===
  onSnapshot(q, (snapshot) => {
    allReports = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    renderReports();
  }, (err) => {
    console.error("Error loading reports:", err);
    toast("Firestore error", "red");
  });

  // === Event Listeners for filters/search ===
  filterSelect.addEventListener("change", renderReports);
  sortSelect.addEventListener("change", renderReports);
  searchInput.addEventListener("input", renderReports);
  refreshBtn.addEventListener("click", () => {
    toast("Refreshing reports...");
    renderReports();
  });
</script>
