let editingSejourId = null;

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

function formatPrice(price) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(price);
}

function formatStars(rating) {
  const safeRating = Math.max(0, Math.min(5, Number(rating) || 0));
  return `${'★'.repeat(safeRating)}${'☆'.repeat(5 - safeRating)}`;
}

function switchTab(tabId) {
  document.querySelectorAll('.admin-tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === tabId));
  document.querySelectorAll('.admin-panel').forEach((p) => p.hidden = p.id !== `panel-${tabId}`);
}

async function initAdmin() {
  if (!isConfigured()) {
    document.querySelector('.admin-main').innerHTML = `<div class="auth-card"><p>${configErrorMessage()}</p></div>`;
    return;
  }

  const session = await requireAdmin();
  if (!session) return;

  document.getElementById('logoutBtn')?.addEventListener('click', signOut);

  document.querySelectorAll('.admin-tab').forEach((tab) => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  document.getElementById('sejourForm').addEventListener('submit', saveSejourForm);
  document.getElementById('cancelSejourBtn').addEventListener('click', resetSejourForm);
  document.getElementById('sejourTitle').addEventListener('input', (e) => {
    const slugField = document.getElementById('sejourSlug');
    if (!editingSejourId && slugField) slugField.value = slugify(e.target.value);
  });

  await loadSejoursAdmin();
  await loadRequestsAdmin();
  await loadReviewsAdmin();
}

async function loadSejoursAdmin() {
  const tbody = document.getElementById('sejoursBody');
  tbody.innerHTML = '';

  try {
    const sejours = await fetchAllSejours();
    if (!sejours.length) {
      tbody.innerHTML = '<tr><td colspan="6">Aucun séjour. Ajoutez-en un ci-dessus.</td></tr>';
      return;
    }

    sejours.forEach((s) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><img src="${escapeHtml(s.image_url)}" alt="" class="admin-thumb"></td>
        <td><strong>${escapeHtml(s.title)}</strong><br><small>${escapeHtml(s.description)}</small></td>
        <td>${formatPrice(s.price)}</td>
        <td>${escapeHtml(s.tag)}</td>
        <td>${s.active ? '<span class="status-badge status-accepte">Actif</span>' : '<span class="status-badge status-rejete">Inactif</span>'}</td>
        <td class="admin-actions">
          <button type="button" class="btn btn-sm btn-outline-dark" data-edit="${s.id}">Modifier</button>
          <button type="button" class="btn btn-sm btn-danger" data-delete="${s.id}">Supprimer</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('[data-edit]').forEach((btn) => {
      btn.addEventListener('click', () => editSejour(btn.dataset.edit, sejours));
    });
    tbody.querySelectorAll('[data-delete]').forEach((btn) => {
      btn.addEventListener('click', () => removeSejour(btn.dataset.delete));
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6">${escapeHtml(err.message)}</td></tr>`;
  }
}

function editSejour(id, sejours) {
  const s = sejours.find((x) => x.id === id);
  if (!s) return;
  editingSejourId = id;
  const form = document.getElementById('sejourForm');
  form.title.value = s.title;
  form.slug.value = s.slug;
  form.description.value = s.description;
  form.price.value = s.price;
  form.image_url.value = s.image_url;
  form.tag.value = s.tag;
  form.sort_order.value = s.sort_order;
  form.active.checked = s.active;
  document.getElementById('sejourFormTitle').textContent = 'Modifier le séjour';
  document.getElementById('saveSejourBtn').textContent = 'Mettre à jour';
  form.scrollIntoView({ behavior: 'smooth' });
}

function resetSejourForm() {
  editingSejourId = null;
  const form = document.getElementById('sejourForm');
  form.reset();
  form.active.checked = true;
  form.sort_order.value = 0;
  document.getElementById('sejourFormTitle').textContent = 'Ajouter un séjour';
  document.getElementById('saveSejourBtn').textContent = 'Ajouter';
  document.getElementById('sejourNote').textContent = '';
}

async function saveSejourForm(e) {
  e.preventDefault();
  const note = document.getElementById('sejourNote');
  const fd = new FormData(e.target);

  const payload = {
    title: fd.get('title'),
    slug: fd.get('slug'),
    description: fd.get('description'),
    price: parseFloat(fd.get('price')),
    image_url: fd.get('image_url'),
    tag: fd.get('tag') || 'Nouveau',
    sort_order: parseInt(fd.get('sort_order') || '0', 10),
    active: fd.get('active') === 'on'
  };

  try {
    if (editingSejourId) {
      await updateSejour(editingSejourId, payload);
      showAlert(note, 'Séjour mis à jour.', 'success');
    } else {
      await createSejour(payload);
      showAlert(note, 'Séjour ajouté.', 'success');
    }
    resetSejourForm();
    await loadSejoursAdmin();
  } catch (err) {
    showAlert(note, err.message || 'Erreur lors de la sauvegarde.');
  }
}

async function removeSejour(id) {
  if (!confirm('Supprimer ce séjour ?')) return;
  try {
    await deleteSejour(id);
    await loadSejoursAdmin();
  } catch (err) {
    alert(err.message);
  }
}

async function loadRequestsAdmin() {
  const tbody = document.getElementById('requestsAdminBody');
  tbody.innerHTML = '';

  try {
    const requests = await fetchAllRequests();
    if (!requests.length) {
      tbody.innerHTML = '<tr><td colspan="7">Aucune demande pour le moment.</td></tr>';
      return;
    }

    for (const req of requests) {
      const label = await getDestinationLabel(req.destination);
      const bookingType = BOOKING_TYPE_LABELS[req.booking_type] || 'Réservation libre';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${formatDate(req.created_at)}</td>
        <td>${escapeHtml(req.full_name)}<br><small>${escapeHtml(req.email)} · ${escapeHtml(req.phone)}</small></td>
        <td>${escapeHtml(label)}</td>
        <td>${escapeHtml(bookingType)}</td>
        <td class="msg-cell">${escapeHtml(req.message || '—')}</td>
        <td><span class="status-badge status-${req.status}">${STATUS_LABELS[req.status] || req.status}</span></td>
        <td class="admin-actions">
          ${req.status === 'en_attente' ? `
            <button type="button" class="btn btn-sm btn-success" data-accept="${req.id}">Accepter</button>
            <button type="button" class="btn btn-sm btn-danger" data-reject="${req.id}">Rejeter</button>
          ` : '—'}
        </td>
      `;
      tbody.appendChild(tr);
    }

    tbody.querySelectorAll('[data-accept]').forEach((btn) => {
      btn.addEventListener('click', () => setRequestStatus(btn.dataset.accept, 'accepte'));
    });
    tbody.querySelectorAll('[data-reject]').forEach((btn) => {
      btn.addEventListener('click', () => setRequestStatus(btn.dataset.reject, 'rejete'));
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7">${escapeHtml(err.message)}</td></tr>`;
  }
}

async function setRequestStatus(id, status) {
  try {
    await updateRequestStatus(id, status);
    await loadRequestsAdmin();
  } catch (err) {
    alert(err.message);
  }
}

async function loadReviewsAdmin() {
  const tbody = document.getElementById('reviewsAdminBody');
  tbody.innerHTML = '';

  try {
    const reviews = await fetchAllReviews();
    if (!reviews.length) {
      tbody.innerHTML = '<tr><td colspan="6">Aucun avis pour le moment.</td></tr>';
      return;
    }

    reviews.forEach((review) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${formatDate(review.created_at)}</td>
        <td>${escapeHtml(review.full_name || 'Voyageur HB Travel')}</td>
        <td><span class="review-stars">${formatStars(review.rating)}</span></td>
        <td class="msg-cell">${escapeHtml(review.comment)}</td>
        <td><span class="status-badge status-${review.status}">${REVIEW_STATUS_LABELS[review.status] || review.status}</span></td>
        <td class="admin-actions">
          ${review.status === 'en_attente' ? `
            <button type="button" class="btn btn-sm btn-success" data-approve-review="${review.id}">Approuver</button>
            <button type="button" class="btn btn-sm btn-danger" data-reject-review="${review.id}">Rejeter</button>
          ` : '—'}
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('[data-approve-review]').forEach((btn) => {
      btn.addEventListener('click', () => setReviewStatus(btn.dataset.approveReview, 'approuve'));
    });
    tbody.querySelectorAll('[data-reject-review]').forEach((btn) => {
      btn.addEventListener('click', () => setReviewStatus(btn.dataset.rejectReview, 'rejete'));
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6">${escapeHtml(err.message)}</td></tr>`;
  }
}

async function setReviewStatus(id, status) {
  try {
    await updateReviewStatus(id, status);
    await loadReviewsAdmin();
  } catch (err) {
    alert(err.message);
  }
}

document.addEventListener('DOMContentLoaded', initAdmin);
