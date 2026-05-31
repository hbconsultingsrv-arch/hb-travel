let currentUser = null;

async function initDashboard() {
  if (!isConfigured()) {
    document.querySelector('.dashboard-main').innerHTML = `
      <div class="auth-card">
        <h2>Configuration requise</h2>
        <p>${configErrorMessage()}</p>
        <p>Voir le fichier <strong>SETUP.md</strong> pour les instructions.</p>
      </div>`;
    return;
  }

  const session = await requireAuth();
  if (!session) return;

  currentUser = session.user;
  document.getElementById('logoutBtn')?.addEventListener('click', signOut);

  await loadProfileForm();
  await loadRequestsList();

  document.getElementById('profileForm').addEventListener('submit', saveProfileForm);
}

async function loadProfileForm() {
  const profile = await getProfile(currentUser.id);
  const form = document.getElementById('profileForm');

  form.full_name.value = profile?.full_name || currentUser.user_metadata?.full_name || '';
  form.email.value = currentUser.email || profile?.email || '';
  form.phone.value = profile?.phone || currentUser.user_metadata?.phone || '';
  form.address.value = profile?.address || '';

  const name = form.full_name.value || currentUser.email?.split('@')[0] || 'Client';
  document.getElementById('welcomeName').textContent = name.split(' ')[0];
}

async function saveProfileForm(e) {
  e.preventDefault();
  const note = document.getElementById('profileNote');
  const fd = new FormData(e.target);

  try {
    await updateProfile(currentUser.id, {
      full_name: fd.get('full_name'),
      phone: fd.get('phone'),
      address: fd.get('address')
    });
    showAlert(note, 'Profil mis à jour avec succès.', 'success');
    document.getElementById('welcomeName').textContent = fd.get('full_name').split(' ')[0];
  } catch (err) {
    showAlert(note, err.message || 'Erreur lors de la sauvegarde.');
  }
}

async function loadRequestsList() {
  const requests = await getTravelRequests(currentUser.id);
  const empty = document.getElementById('requestsEmpty');
  const table = document.getElementById('requestsTable');
  const tbody = document.getElementById('requestsBody');

  tbody.innerHTML = '';

  if (!requests.length) {
    empty.hidden = false;
    table.hidden = true;
    return;
  }

  empty.hidden = true;
  table.hidden = false;

  requests.forEach((req) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${formatDate(req.created_at)}</td>
      <td>${DESTINATION_LABELS[req.destination] || req.destination}</td>
      <td><span class="status-badge status-${req.status}">${STATUS_LABELS[req.status] || req.status}</span></td>
      <td class="msg-cell">${req.message || '—'}</td>
    `;
    tbody.appendChild(tr);
  });
}

document.addEventListener('DOMContentLoaded', initDashboard);
