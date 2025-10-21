// Simulated Firebase initialization (for proof-of-concept)
const firebaseConfig = {
  apiKey: "demo",
  authDomain: "demo.firebaseapp.com",
  projectId: "demo",
};

// Default user database
const defaultUsers = [
  { email: "official@barangay.gov", password: "official123", role: "official", name: "Brgy. Official" },
  { email: "resident1@gmail.com", password: "resident123", role: "resident", name: "Resident One" },
  { email: "resident2@gmail.com", password: "resident123", role: "resident", name: "Resident Two" },
  { email: "lgu@province.gov", password: "lgu123", role: "lgu", name: "Provincial LGU Officer" } // ✅ LGU account
];

// Merge saved users (if any)
const storedUsers = JSON.parse(localStorage.getItem("users")) || [];
const users = [...defaultUsers, ...storedUsers.filter(su => !defaultUsers.some(du => du.email === su.email))];

// Local storage reports
const reports = JSON.parse(localStorage.getItem("reports")) || [];

// Handle login
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();
    const user = users.find(u => u.email === email && u.password === password);
    const msg = document.getElementById("loginMessage");

    if (user) {
      localStorage.setItem("currentUser", JSON.stringify(user));
      msg.textContent = "Login successful!";
      setTimeout(() => {
        if (user.role === "official") {
          window.location.href = "official.html";
        } else if (user.role === "resident") {
          window.location.href = "resident.html";
        } else if (user.role === "lgu") {
          window.location.href = "lgu.html";
        } else {
          msg.textContent = "Unknown role. Please contact admin.";
        }
      }, 800);
    } else {
      msg.textContent = "Invalid credentials. Please try again.";
    }
  });
}

// Handle registration
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value.trim();
    const role = document.getElementById("registerRole").value;

    const msg = document.getElementById("registerMessage");
    if (users.some(u => u.email === email)) {
      msg.textContent = "Email already registered.";
      return;
    }

    const newUser = { email, password, role, name };
    storedUsers.push(newUser);
    localStorage.setItem("users", JSON.stringify(storedUsers));
    msg.textContent = "Registration successful!";
    setTimeout(() => (window.location.href = "index.html"), 1000);
  });
}

// Handle logout
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("currentUser");
    window.location.href = "index.html";
  });
}

// Display reports (Official)
const reportReviewList = document.getElementById("reportReviewList");
if (reportReviewList) {
  const loadedReports = JSON.parse(localStorage.getItem("reports")) || [];
  loadedReports.forEach(r => {
    const li = document.createElement("li");
    li.textContent = `${r.issueType || r.issue} (${r.location}) — reported by ${r.author || r.name}`;
    reportReviewList.appendChild(li);
  });
}