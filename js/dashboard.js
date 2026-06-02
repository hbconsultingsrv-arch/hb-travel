let currentUser = null;
let userSejours = [];
let userRequests = [];

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

  if (await isAdmin()) {
    document.getElementById('compteAdminLink').style.display = '';
  }

  await loadProfileForm();
  await loadRequestsList();
  await initAvisSection();

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
  userRequests = requests;
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

  for (const req of requests) {
    const label = await getDestinationLabel(req.destination);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${formatDate(req.created_at)}</td>
      <td>${label}</td>
      <td><span class="status-badge status-${req.status}">${STATUS_LABELS[req.status] || req.status}</span></td>
      <td class="msg-cell">${req.message || '—'}</td>
    `;
    tbody.appendChild(tr);
  }
}

async function initAvisSection() {
  const starContainer = document.getElementById('starRatingContainer');
  const ratingInput = document.getElementById('avisRating');
  if (starContainer) {
    starContainer.innerHTML = renderStars(0, true);
    initStarRating(starContainer, ratingInput);
  }

  userSejours = await fetchActiveSejours();

  document.getElementById('avisType')?.addEventListener('change', updateAvisTargets);
  document.getElementById('avisForm')?.addEventListener('submit', submitAvisForm);

  await loadMyAvis();
}

async function updateAvisTargets() {
  const type = document.getElementById('avisType').value;
  const select = document.getElementById('avisTarget');
  const existingAvis = await fetchUserAvis(currentUser.id);

  select.innerHTML = '<option value="">Choisir…</option>';
  select.disabled = !type;

  if (type === 'sejour') {
    for (const s of userSejours) {
      const already = existingAvis.some((a) => a.sejour_id === s.id);
      if (!already) {
        const opt = document.createElement('option');
        opt.value = `sejour:${s.id}`;
        opt.textContent = s.title;
        opt.dataset.label = s.title;
        select.appendChild(opt);
      }
    }
  }

  if (type === 'demande') {
    for (const r of userRequests) {
      const already = existingAvis.some((a) => a.travel_request_id === r.id);
      if (!already) {
        const label = await getDestinationLabel(r.destination);
        const opt = document.createElement('option');
        opt.value = `demande:${r.id}`;
        opt.textContent = `${label} (${formatDate(r.created_at)})`;
        opt.dataset.label = label;
        select.appendChild(opt);
      }
    }
  }

  if (select.options.length === 1) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = type === 'sejour' ? 'Tous les séjours sont déjà notés' : 'Toutes les demandes sont déjà notées';
    select.appendChild(opt);
  }
}

async function submitAvisForm(e) {
  e.preventDefault();
  const note = document.getElementById('avisNote');
  const fd = new FormData(e.target);
  const targetVal = fd.get('target_id');
  const rating = fd.get('rating');
  const message = fd.get('message');

  if (!rating || parseInt(rating, 10) < 1) {
    showAlert(note, 'Veuillez sélectionner une note entre 1 et 5 étoiles.');
    return;
  }

  if (!targetVal) {
    showAlert(note, 'Veuillez choisir un séjour ou une demande.');
    return;
  }

  const profile = await getProfile(currentUser.id);
  const authorName = profile?.full_name || currentUser.user_metadata?.full_name || 'Client';
  const select = document.getElementById('avisTarget');
  const selectedOpt = select.options[select.selectedIndex];
  const targetLabel = selectedOpt?.dataset?.label || selectedOpt?.textContent || 'Voyage';

  const [type, id] = targetVal.split(':');

  try {
    await createAvis({
      userId: currentUser.id,
      authorName,
      sejourId: type === 'sejour' ? id : null,
      travelRequestId: type === 'demande' ? id : null,
      targetLabel,
      rating,
      message
    });

    showAlert(note, 'Merci ! Votre avis a été envoyé. Il sera publié après validation par notre équipe.', 'success');
    e.target.reset();
    document.getElementById('avisRating').value = '';
    document.getElementById('starRatingContainer').innerHTML = renderStars(0, true);
    initStarRating(document.getElementById('starRatingContainer'), document.getElementById('avisRating'));
    document.getElementById('avisTarget').disabled = true;
    await loadMyAvis();
    await updateAvisTargets();
  } catch (err) {
    const msg = err.message?.includes('duplicate')
      ? 'Vous avez déjà laissé un avis pour cet élément.'
      : (err.message || 'Erreur lors de l\'envoi.');
    showAlert(note, msg);
  }
}

async function loadMyAvis() {
  const avis = await fetchUserAvis(currentUser.id);
  const empty = document.getElementById('myAvisEmpty');
  const table = document.getElementById('myAvisTable');
  const tbody = document.getElementById('myAvisBody');

  tbody.innerHTML = '';

  if (!avis.length) {
    empty.hidden = false;
    table.hidden = true;
    return;
  }

  empty.hidden = true;
  table.hidden = false;

  avis.forEach((a) => {
    const statusClass = a.status === 'approuve' ? 'accepte' : (a.status === 'refuse' ? 'rejete' : 'en_attente');
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${formatDate(a.created_at)}</td>
      <td>${escapeHtmlAvis(a.target_label)}</td>
      <td>${renderStars(a.rating)}</td>
      <td class="msg-cell">${escapeHtmlAvis(a.message)}</td>
      <td><span class="status-badge status-${statusClass}">${AVIS_STATUS_LABELS[a.status] || a.status}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

document.addEventListener('DOMContentLoaded', initDashboard);
