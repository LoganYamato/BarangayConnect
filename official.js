document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logoutBtn');
  const reportReviewList = document.getElementById('reportReviewList');

  // --- Function to render reports ---
  function renderReports() {
    const reports = JSON.parse(localStorage.getItem('reports')) || [];
    reportReviewList.innerHTML = '';

    if (reports.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'No reports submitted yet.';
      li.style.textAlign = 'center';
      li.style.color = '#666';
      reportReviewList.appendChild(li);
      return;
    }

    reports.forEach((r, idx) => {
      const li = document.createElement('li');
      li.style.marginBottom = '12px';
      li.style.padding = '10px';
      li.style.border = '1px solid #ccc';
      li.style.borderRadius = '10px';
      li.style.background = '#f9fafb';

      const title = document.createElement('strong');
      title.textContent = `${r.issueType || r.issue} — ${r.barangay || ''} ${r.location || ''}`;
      li.appendChild(title);

      const info = document.createElement('div');
      info.textContent = `Status: ${r.status || 'Pending'} | Reported by: ${r.author || r.name}`;
      info.style.fontSize = '13px';
      info.style.marginTop = '4px';
      li.appendChild(info);

      // --- Status update buttons ---
      const btnContainer = document.createElement('div');
      btnContainer.style.marginTop = '8px';
      btnContainer.style.display = 'flex';
      btnContainer.style.gap = '6px';

      const btnInProgress = document.createElement('button');
      btnInProgress.textContent = 'Mark In Progress';
      btnInProgress.className = 'status-btn blue';

      const btnResolved = document.createElement('button');
      btnResolved.textContent = 'Mark Resolved';
      btnResolved.className = 'status-btn green';

      // Disable buttons if report already resolved
      if (r.status === 'Resolved') {
        btnInProgress.disabled = true;
        btnResolved.disabled = true;
        btnInProgress.style.opacity = '0.5';
        btnResolved.style.opacity = '0.5';
      }

      // --- Button actions ---
      btnInProgress.addEventListener('click', () => {
        r.status = 'In Progress';
        reports[idx] = r;
        localStorage.setItem('reports', JSON.stringify(reports));
        renderReports();
        alert(`Report #${r.id || idx + 1} marked as In Progress`);
      });

      btnResolved.addEventListener('click', () => {
        r.status = 'Resolved';
        reports[idx] = r;
        localStorage.setItem('reports', JSON.stringify(reports));
        renderReports();
        alert(`Report #${r.id || idx + 1} marked as Resolved`);
      });

      btnContainer.appendChild(btnInProgress);
      btnContainer.appendChild(btnResolved);
      li.appendChild(btnContainer);

      reportReviewList.appendChild(li);
    });
  }

  // --- Initial render ---
  renderReports();

  // --- Auto-refresh every 3 seconds ---
  setInterval(renderReports, 3000);

  // --- Logout ---
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('currentUser');
      window.location.href = 'index.html';
    });
  }
});