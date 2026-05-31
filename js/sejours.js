// Chargement et affichage des séjours sur la page d'accueil

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

async function fetchActiveSejours() {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from('sejours')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

function renderSejourCard(sejour) {
  const article = document.createElement('article');
  article.className = 'destination-card';
  article.innerHTML = `
    <div class="destination-img" style="background-image: url('${escapeHtml(sejour.image_url)}')"></div>
    <div class="destination-body">
      <span class="destination-tag">${escapeHtml(sejour.tag)}</span>
      <h3>${escapeHtml(sejour.title)}</h3>
      <p>${escapeHtml(sejour.description)}</p>
      <div class="destination-footer">
        <span class="price">À partir de <strong>${formatPrice(sejour.price)}</strong></span>
        <a href="#contact" class="btn btn-sm" data-slug="${escapeHtml(sejour.slug)}">Réserver</a>
      </div>
    </div>
  `;
  article.querySelector('[data-slug]')?.addEventListener('click', () => {
    const select = document.querySelector('#contactForm select[name="destination"]');
    if (select) select.value = sejour.slug;
  });
  return article;
}

async function loadDestinationsGrid() {
  const grid = document.getElementById('destinationsGrid');
  if (!grid) return;

  grid.innerHTML = '<p class="loading-msg">Chargement des séjours…</p>';

  try {
    const sejours = await fetchActiveSejours();
    grid.innerHTML = '';

    if (!sejours.length) {
      grid.innerHTML = '<p class="loading-msg">Aucun séjour disponible pour le moment.</p>';
      return;
    }

    sejours.forEach((s) => grid.appendChild(renderSejourCard(s)));
    populateDestinationSelect(sejours);
  } catch (err) {
    grid.innerHTML = `<p class="loading-msg error">${escapeHtml(err.message)}</p>`;
  }
}

function populateDestinationSelect(sejours) {
  const select = document.querySelector('#contactForm select[name="destination"]');
  if (!select) return;

  const current = select.value;
  select.innerHTML = '<option value="">Choisir une destination</option>';
  sejours.forEach((s) => {
    const opt = document.createElement('option');
    opt.value = s.slug;
    opt.textContent = s.title;
    select.appendChild(opt);
  });
  const optAutre = document.createElement('option');
  optAutre.value = 'autre';
  optAutre.textContent = 'Autre destination';
  select.appendChild(optAutre);
  if (current) select.value = current;
}

document.addEventListener('DOMContentLoaded', loadDestinationsGrid);
