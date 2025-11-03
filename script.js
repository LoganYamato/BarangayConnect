// ======================================================
// BarangayConnect | Unified Auth + Local Fallback System
// ======================================================

// === Default Accounts (with barangays) ===
const defaultUsers = [
  { email: "official@barangay.gov", password: "official123", role: "official", name: "Brgy. Official", barangay: "Santa Cruz" },
  { email: "resident1@gmail.com", password: "resident123", role: "resident", name: "Resident One", barangay: "Santa Cruz" },
  { email: "resident2@gmail.com", password: "resident123", role: "resident", name: "Resident Two", barangay: "Santa Cruz" },
  { email: "brgycpt@gmail.com", password: "captain123", role: "captain", name: "Captain", barangay: "Santa Cruz" },
  { email: "lgu@province.gov", password: "lgu123", role: "lgu", name: "Provincial LGU Officer" },
  { email: "staff@barangay.gov", password: "staff123", role: "staff", name: "Barangay Staff", barangay: "Santa Cruz" }
];

// === Merge Default + Existing Users ===
let storedUsers = JSON.parse(localStorage.getItem("users")) || [];
defaultUsers.forEach(defaultUser => {
  if (!storedUsers.some(u => u.email === defaultUser.email)) {
    storedUsers.push(defaultUser);
  }
});
localStorage.setItem("users", JSON.stringify(storedUsers));

const users = JSON.parse(localStorage.getItem("users")) || [];

// ======================================================
// LOGIN HANDLER
// ======================================================
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();
    const msg = document.getElementById("loginMessage");

    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
  localStorage.setItem("currentUser", JSON.stringify(user));
  msg.textContent = "Login successful!";

  setTimeout(() => {
    switch (user.role) {
      case "official":
        window.location.href = "official.html";
        break;
      case "resident":
        window.location.href = "resident.html";
        break;
      case "lgu":
        window.location.href = "lgu.html";
        break;
      case "captain":
        window.location.href = "staff.html";
        break;
      default:
        // 🔹 fallback: send to index and warn in console
        console.warn("Unknown role:", user.role);
        alert("Unrecognized role — redirecting to homepage.");
        window.location.href = "index.html";
    }
  }, 800);
}


// ======================================================
// REGISTRATION HANDLER
// ======================================================
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value.trim();
    const role = document.getElementById("registerRole").value;
    const barangay = document.getElementById("registerBarangay")?.value || "Santa Cruz";
    const msg = document.getElementById("registerMessage");

    let users = JSON.parse(localStorage.getItem("users")) || [];

    if (users.some(u => u.email === email)) {
      msg.textContent = "Email already registered.";
      msg.style.color = "red";
      return;
    }

    const newUser = { email, password, role, name, barangay };
    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));

    msg.textContent = "Registration successful!";
    msg.style.color = "green";

    setTimeout(() => (window.location.href = "index.html"), 1000);
  });
}

// ======================================================
// LOGOUT HANDLER (GLOBAL)
// ======================================================
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("currentUser");
    window.location.href = "index.html";
  });
}

// ======================================================
// LOCAL REPORT FALLBACK (if Firestore fails)
// ======================================================
const reportList = document.getElementById("reportList");
if (reportList) {
  try {
    // Only show if Firestore isn't syncing yet
    if (!window.firestoreActive) {
      const reports = JSON.parse(localStorage.getItem("reports")) || [];

      reportList.innerHTML = "";
      if (reports.length === 0) {
        const li = document.createElement("li");
        li.textContent = "No reports found (local mode).";
        li.style.textAlign = "center";
        li.style.color = "#666";
        reportList.appendChild(li);
      } else {
        reports.forEach(r => {
          const li = document.createElement("li");
          li.textContent = `${r.issueType || r.issue} — ${r.location} (${r.status || "Pending"})`;
          li.style.padding = "10px";
          li.style.borderBottom = "1px solid #ddd";
          reportList.appendChild(li);
        });
      }
    }
  } catch (err) {
    console.error("Error rendering local reports:", err);
  }
}
