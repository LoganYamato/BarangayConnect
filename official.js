// official.js
import { loadReportsRealtime } from "./official-sync.js";

const reportsContainer = document.getElementById("reportsContainer");
const statusFilter = document.getElementById("statusFilter");
const issueFilter = document.getElementById("issueFilter");
const modal = document.getElementById("imageModal");
const modalImg = document.getElementById("modalImg");

// RENDER
export function renderReports(reports) {
  const selectedStatus = statusFilter.value;
  const selectedIssue = issueFilter.value;
  reportsContainer.innerHTML = "";

  const filtered = reports.filter((r) => {
    const matchStatus = selectedStatus === "All" || r.status === selectedStatus;
    const matchIssue = selectedIssue === "All" || r.issueType === selectedIssue;
    return matchStatus && matchIssue;
  });

  if (filtered.length === 0) {
    reportsContainer.innerHTML = "<p>No matching reports found.</p>";
    return;
  }

  filtered.forEach((report) => {
    const div = document.createElement("div");
    div.className = "report-card";

    const imgHTML = report.imageData
      ? `<img src="${report.imageData}" class="previewImg">`
      : report.imageUrl
      ? `<img src="${report.imageUrl}" class="previewImg">`
      : "";

    const time = report.timestamp?.toDate
      ? report.timestamp.toDate().toLocaleString()
      : "Unknown time";

    div.innerHTML = `
      <strong>${report.issueType || "Issue"}</strong><br>
      <em>${report.description || "No description"}</em><br>
      <small>Barangay: ${report.barangay || "N/A"}</small><br>
      <small>Location: ${report.location || "N/A"}</small><br>
      <small>Author: ${report.author || "Unknown"}</small><br>
      <small>Submitted: ${time}</small><br>
      ${imgHTML}<br>
      <button class="status-btn ${
        report.status === "Resolved" ? "status-resolved" : "status-pending"
      }" data-id="${report.id}">
        ${report.status === "Resolved" ? "Resolved" : "Mark as Resolved"}
      </button>
    `;

    reportsContainer.appendChild(div);
  });

  // Modal preview
  document.querySelectorAll(".previewImg").forEach((img) =>
    img.addEventListener("click", () => {
      modal.style.display = "flex";
      modalImg.src = img.src;
    })
  );

  // Update status buttons
  document.querySelectorAll(".status-btn").forEach((btn) =>
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      await window.updateReportStatus(id);
    })
  );
}

modal.addEventListener("click", () => (modal.style.display = "none"));
statusFilter.addEventListener("change", loadReportsRealtime);
issueFilter.addEventListener("change", loadReportsRealtime);

document.addEventListener("DOMContentLoaded", loadReportsRealtime);

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("currentUser");
  window.location.href = "index.html";
});