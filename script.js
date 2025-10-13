// Simulated Firebase initialization (for proof-of-concept)
const firebaseConfig = {
  apiKey: "demo",
  authDomain: "demo.firebaseapp.com",
  projectId: "demo",
};

// Dummy user database (for offline testing)
const users = [
  { email: "official@barangay.gov", password: "official123", role: "official", name: "Brgy. Official" },
  { email: "resident1@gmail.com", password: "resident123", role: "resident", name: "Resident One" },
  { email: "resident2@gmail.com", password: "resident123", role: "resident", name: "Resident Two" }
];

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
        window.location.href = user.role === "official" ? "official.html" : "resident.html";
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

    users.push({ email, password, role, name });
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

// Handle report submission (Resident)
const reportForm = document.getElementById("reportForm");
if (reportForm) {
  reportForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const issue = document.getElementById("issue").value.trim();
    const desc = document.getElementById("description").value.trim();
    const location = document.getElementById("location").value.trim();
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const newReport = {
      id: Date.now(),
      issue, desc, location,
      author: currentUser?.name || "Anonymous"
    };
    reports.push(newReport);
    localStorage.setItem("reports", JSON.stringify(reports));
    alert("Report submitted successfully!");
    reportForm.reset();
  });
}

// Display reports (Official)
const reportReviewList = document.getElementById("reportReviewList");
if (reportReviewList) {
  reports.forEach(r => {
    const li = document.createElement("li");
    li.textContent = `${r.issue} (${r.location}) — reported by ${r.author}`;
    reportReviewList.appendChild(li);
  });
}
