document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logoutBtn");
  const reportList = document.getElementById("reportList");
  const refreshBtn = document.getElementById("refreshBtn");

  // --- Safety check for Firebase loader ---
  if (typeof window.loadReports !== "function") {
    console.warn("loadReports() not found yet. Retrying in 1s...");
    setTimeout(() => window.loadReports && window.loadReports(), 1000);
  } else {
    window.loadReports();
  }

  // --- Logout handler ---
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      const confirmOut = confirm("Are you sure you want to log out?");
      if (confirmOut) {
        localStorage.removeItem("currentUser");
        window.location.href = "index.html";
      }
    });
  }

  // --- Manual refresh button (⟳ icon) ---
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      refreshBtn.textContent = "⟳";
      refreshBtn.style.opacity = "0.5";
      window.loadReports?.().then(() => {
        setTimeout(() => {
          refreshBtn.style.opacity = "1";
        }, 400);
      });
    });
  }

  // --- Optional: auto-refresh every 30 seconds ---
  setInterval(() => {
    window.loadReports?.();
  }, 30000);
});
