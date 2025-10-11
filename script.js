/* Lightweight shared JS for Resident & Official pages
   - stores reports in localStorage under key "barangay_reports"
   - works on resident.html and official.html
*/

const STORAGE_KEY = 'barangay_reports';

function loadReports() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch (e) { return []; }
}
function saveReports(r) { localStorage.setItem(STORAGE_KEY, JSON.stringify(r)); }

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

function renderResident() {
  const container = document.getElementById('reportList');
  if (!container) return;
  const reports = loadReports();
  if (!reports.length) {
    container.innerHTML = '<p>No reports yet.</p>';
    return;
  }
  container.innerHTML = reports.map(r => `
    <div class="report-card">
      <div><strong>${escapeHtml(r.issue)}</strong>
        <span class="status ${r.status.toLowerCase().replace(/\s+/g,'-')}">${escapeHtml(r.status)}</span>
      </div>
      <div style="margin-top:6px">${escapeHtml(r.description)}</div>
      <div class="meta"><em>Location:</em> ${escapeHtml(r.location)} — <small>${escapeHtml(r.timestamp)}</small></div>
    </div>
  `).join('');
}

function renderOfficialReports() {
  const container = document.getElementById('officialList');
  if (!container) return;
  const reports = loadReports();
  if (!reports.length) {
    container.innerHTML = '<p>No reports yet.</p>';
    return;
  }
  container.innerHTML = reports.map(r => `
    <div class="report-card">
      <div><strong>${escapeHtml(r.issue)}</strong>
        <span class="status ${r.status.toLowerCase().replace(/\s+/g,'-')}">${escapeHtml(r.status)}</span>
      </div>
      <div style="margin-top:6px">${escapeHtml(r.description)}</div>
      <div class="meta"><em>Location:</em> ${escapeHtml(r.location)} — <small>${escapeHtml(r.timestamp)}</small></div>
      <div class="actions">
        <button onclick="updateStatus(${r.id},'Acknowledged')">Acknowledge</button>
        <button onclick="updateStatus(${r.id},'In Progress')">In Progress</button>
        <button onclick="updateStatus(${r.id},'Resolved')">Resolved</button>
      </div>
    </div>
  `).join('');
}

function addReport(issue, description, location) {
  const reports = loadReports();
  const newReport = {
    id: Date.now(),
    issue, description, location,
    status: 'Pending',
    timestamp: new Date().toLocaleString()
  };
  reports.push(newReport);
  saveReports(reports);
}

window.updateStatus = function(id, newStatus) {
  const reports = loadReports();
  const idx = reports.findIndex(r => r.id === id);
  if (idx === -1) return;
  reports[idx].status = newStatus;
  saveReports(reports);
  // rerender both views (if open)
  renderOfficialReports();
  renderResident();
};

// DOM ready wiring
document.addEventListener('DOMContentLoaded', () => {
  // Resident form
  const form = document.getElementById('reportForm');
  if (form) {
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const issue = document.getElementById('issue').value.trim();
      const description = document.getElementById('description').value.trim();
      const location = document.getElementById('location').value.trim();
      if (!issue || !description || !location) { alert('Please fill all fields.'); return; }
      addReport(issue, description, location);
      form.reset();
      renderResident();
      alert('Report submitted.');
    });
  }

  // initial render (works even if only one of the pages is open)
  renderResident();
  renderOfficialReports();
});
