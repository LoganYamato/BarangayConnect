// Basic proof-of-concept data persistence
let reports = JSON.parse(localStorage.getItem("reports")) || [];

function saveReports() {
  localStorage.setItem("reports", JSON.stringify(reports));
}

// Resident submission
const form = document.getElementById("reportForm");
if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const issue = document.getElementById("issue").value;
    const desc = document.getElementById("description").value;
    const loc = document.getElementById("location").value;

    const newReport = {
      id: Date.now(),
      issue,
      desc,
      loc,
      status: "Pending",
      time: new Date().toLocaleString(),
    };

    reports.push(newReport);
    saveReports();
    form.reset();
    alert("✅ Report submitted successfully!");
    renderResident();
  });
}

// Render for Resident
function renderResident() {
  const container = document.getElementById("reportList");
  if (!container) return;
  container.innerHTML = "";
  reports.forEach(r => {
    container.innerHTML += `
      <div class="report-item">
        <strong>${r.issue}</strong> <span class="status ${r.status.toLowerCase()}">${r.status}</span><br>
        ${r.desc}<br>
        <em>Location:</em> ${r.loc}<br>
        <small>${r.time}</small>
      </div>`;
  });
}
renderResident();

// Render for Officials
function renderOfficial() {
  const container = document.getElementById("officialList");
  if (!container) return;
  container.innerHTML = "";
  reports.forEach(r => {
    container.innerHTML += `
      <div class="report-item">
        <strong>${r.issue}</strong> <span class="status ${r.status.toLowerCase()}">${r.status}</span><br>
        ${r.desc}<br>
        <em>Location:</em> ${r.loc}<br>
        <small>${r.time}</small><br>
        <button onclick="updateStatus(${r.id}, 'In Progress')">In Progress</button>
        <button onclick="updateStatus(${r.id}, 'Resolved')">Resolved</button>
      </div>`;
  });
}
renderOfficial();

function updateStatus(id, newStatus) {
  reports = reports.map(r => r.id === id ? {...r, status: newStatus} : r);
  saveReports();
  renderOfficial();
}