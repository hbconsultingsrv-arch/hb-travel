async function getActiveTrips() {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from('trips')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

async function getAllTrips() {
  const sb = getSupabase();
  if (!sb) throw new Error(configErrorMessage());
  const { data, error } = await sb
    .from('trips')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

async function createTrip(trip) {
  const sb = getSupabase();
  if (!sb) throw new Error(configErrorMessage());
  const { data, error } = await sb.from('trips').insert(trip).select().single();
  if (error) throw error;
  return data;
}

async function updateTrip(id, trip) {
  const sb = getSupabase();
  if (!sb) throw new Error(configErrorMessage());
  const { data, error } = await sb.from('trips').update(trip).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

async function deleteTrip(id) {
  const sb = getSupabase();
  if (!sb) throw new Error(configErrorMessage());
  const { error } = await sb.from('trips').delete().eq('id', id);
  if (error) throw error;
}

function formatPrice(price) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(price);
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50) || 'sejour';
}

function renderTripCard(trip) {
  const article = document.createElement('article');
  article.className = 'destination-card';
  article.innerHTML = `
    <div class="destination-img" style="background-image: url('${escapeHtml(trip.image_url)}')"></div>
    <div class="destination-body">
      ${trip.tag ? `<span class="destination-tag">${escapeHtml(trip.tag)}</span>` : ''}
      <h3>${escapeHtml(trip.title)}</h3>
      <p>${escapeHtml(trip.description)}</p>
      <div class="destination-footer">
        <span class="price">À partir de <strong>${formatPrice(trip.price)}</strong></span>
        <a href="#contact" class="btn btn-sm btn-book" data-slug="${escapeHtml(trip.slug)}">Réserver</a>
      </div>
    </div>
  `;
  return article;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function loadTripsOnHomepage() {
  const grid = document.getElementById('destinationsGrid');
  if (!grid) return;

  if (!isConfigured()) {
    grid.innerHTML = '<p class="empty-state">Configurez Supabase pour afficher les séjours.</p>';
    return;
  }

  try {
    const trips = await getActiveTrips();
    grid.innerHTML = '';

    if (!trips.length) {
      grid.innerHTML = '<p class="empty-state">Aucun séjour disponible pour le moment.</p>';
      return;
    }

    trips.forEach((trip) => grid.appendChild(renderTripCard(trip)));

    grid.querySelectorAll('.btn-book').forEach((btn) => {
      btn.addEventListener('click', () => {
        const select = document.querySelector('#contactForm select[name="destination"]');
        if (select) select.value = btn.dataset.slug;
      });
    });

    populateDestinationSelect(trips);
  } catch (err) {
    grid.innerHTML = `<p class="empty-state error">${escapeHtml(err.message)}</p>`;
  }
}

function populateDestinationSelect(trips) {
  const select = document.querySelector('#contactForm select[name="destination"]');
  if (!select) return;

  select.innerHTML = '<option value="">Choisir une destination</option>';
  trips.forEach((trip) => {
    const opt = document.createElement('option');
    opt.value = trip.slug;
    opt.textContent = trip.title;
    select.appendChild(opt);
  });
  const autre = document.createElement('option');
  autre.value = 'autre';
  autre.textContent = 'Autre destination';
  select.appendChild(autre);
}

async function getTripLabel(slug) {
  if (!slug) return '—';
  if (slug === 'autre') return 'Autre destination';
  try {
    const trips = await getActiveTrips();
    const trip = trips.find((t) => t.slug === slug);
    return trip?.title || slug;
  } catch {
    return DESTINATION_LABELS[slug] || slug;
  }
}
