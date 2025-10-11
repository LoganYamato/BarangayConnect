// Handle report submission
const form = document.getElementById('reportForm');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const issue = document.getElementById('issue').value;
    const description = document.getElementById('description').value;
    const location = document.getElementById('location').value;

    const newReport = {
      issue,
      description,
      location,
      status: 'Pending',
      timestamp: new Date().toLocaleString()
    };

    const reports = JSON.parse(localStorage.getItem('reports')) || [];
    reports.push(newReport);
    localStorage.setItem('reports', JSON.stringify(reports));

    form.reset();
    renderReports();
  });
}

// Render reports for Resident view
function renderReports() {
  const list = document.getElementById('reportList');
  if (!list) return;

  const reports = JSON.parse(localStorage.getItem('reports')) || [];
  list.innerHTML = reports.length
    ? reports.map((r) => `
      <div class="report-card">
        <h3>${r.issue}</h3>
        <p>${r.description}</p>
        <p><strong>Location:</strong> ${r.location}</p>
        <p><strong>Status:</strong> ${r.status}</p>
        <p><em>${r.timestamp}</em></p>
      </div>
    `).join('')
    : '<p>No reports submitted yet.</p>';
}

// Render and manage reports for Official view
function renderOfficialReports() {
  const list = document.getElementById('officialList');
  if (!list) return;

  const reports = JSON.parse(localStorage.getItem('reports')) || [];
  list.innerHTML = reports.length
    ? reports.map((r, i) => `
      <div class="report-card">
        <h3>${r.issue}</h3>
        <p>${r.description}</p>
        <p><strong>Location:</strong> ${r.location}</p>
        <p><strong>Status:</strong> ${r.status}</p>
        <button onclick="updateStatus(${i}, 'In Progress')">In Progress</button>
        <button onclick="updateStatus(${i}, 'Resolved')">Resolved</button>
      </div>
    `).join('')
    : '<p>No reports yet.</p>';
}

function updateStatus(index, newStatus) {
  const reports = JSON.parse(localStorage.getItem('reports')) || [];
  reports[index].status = newStatus;
  localStorage.setItem('reports', JSON.stringify(reports));
  renderOfficialReports();
}

// Auto-render when loading
window.onload = () => {
  renderReports();
  renderOfficialReports();
};
