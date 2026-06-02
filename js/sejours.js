// Chargement et affichage des séjours sur la page d'accueil

let allSejours = [];
let activeFilter = null;
let sejoursLoaded = false;

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

function formatPrice(price) {
  const lang = typeof getCurrentLang === 'function' ? getCurrentLang() : 'fr';
  const locale = { fr: 'fr-FR', en: 'en-GB', ar: 'ar-SA', es: 'es-ES', de: 'de-DE', tr: 'tr-TR' }[lang] || 'fr-FR';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(price);
}

function getSejourCategory(sejour) {
  const text = `${sejour.slug} ${sejour.tag} ${sejour.title} ${sejour.description}`.toLowerCase();
  if (/omra|hajj|makkah|madinah|haram|umrah|umre/.test(text)) return 'omra';
  if (/famille|family|enfant|aile/.test(text)) return 'famille';
  if (/hôtel|hotel|resort|riad|5★|5\s*\*/.test(text)) return 'hotel';
  return 'halal';
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
  article.className = 'destination-card destination-card-3d';
  article.dataset.category = getSejourCategory(sejour);
  const title = translateSejourTitle(sejour);
  const desc = translateSejourDescription(sejour);
  const tag = translateSejourTag(sejour);
  const imgUrl = getSejourImageUrl(sejour);
  const fallbackUrl = HB_SEJOUR_FALLBACK_IMAGES[sejour.slug] || HB_SEJOUR_FALLBACK_IMAGES.omra;

  const imgWrap = document.createElement('div');
  imgWrap.className = 'destination-img';
  const img = document.createElement('img');
  img.src = imgUrl;
  img.alt = title;
  img.loading = 'lazy';
  img.onerror = () => {
    if (!img.dataset.fallback) {
      img.dataset.fallback = '1';
      img.src = fallbackUrl;
    }
  };
  imgWrap.appendChild(img);

  article.appendChild(imgWrap);
  const body = document.createElement('div');
  body.className = 'destination-body';
  body.innerHTML = `
      <span class="destination-tag">${escapeHtml(tag)}</span>
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(desc)}</p>
      <div class="destination-footer">
        <span class="price">${t('dest.from')} <strong>${formatPrice(sejour.price)}</strong></span>
        <a href="#contact" class="btn btn-sm" data-slug="${escapeHtml(sejour.slug)}">${t('dest.book')}</a>
      </div>
  `;
  article.appendChild(body);
  article.querySelector('[data-slug]')?.addEventListener('click', () => {
    const select = document.querySelector('#contactForm select[name="destination"]');
    if (select) select.value = sejour.slug;
  });
  return article;
}

function renderGrid(sejours) {
  const grid = document.getElementById('destinationsGrid');
  if (!grid || typeof t !== 'function') return;

  grid.innerHTML = '';

  const filtered = activeFilter
    ? sejours.filter((s) => getSejourCategory(s) === activeFilter)
    : sejours;

  if (!filtered.length) {
    grid.innerHTML = `<p class="loading-msg">${t('dest.empty')}</p>`;
    return;
  }

  filtered.forEach((s) => grid.appendChild(renderSejourCard(s)));
}

async function loadDestinationsGrid() {
  const grid = document.getElementById('destinationsGrid');
  if (!grid || typeof t !== 'function') return;

  grid.innerHTML = `<p class="loading-msg">${t('dest.loading')}</p>`;

  try {
    if (!allSejours.length) allSejours = await fetchActiveSejours();
    sejoursLoaded = true;
    renderGrid(allSejours);
    populateDestinationSelect(allSejours);
  } catch (err) {
    grid.innerHTML = `<p class="loading-msg error">${escapeHtml(err.message)}</p>`;
  }
}

function populateDestinationSelect(sejours) {
  const select = document.querySelector('#contactForm select[name="destination"]');
  if (!select || typeof t !== 'function') return;

  const current = select.value;
  select.innerHTML = `<option value="">${t('dest.choose')}</option>`;
  sejours.forEach((s) => {
    const opt = document.createElement('option');
    opt.value = s.slug;
    opt.textContent = translateSejourTitle(s);
    select.appendChild(opt);
  });
  const optAutre = document.createElement('option');
  optAutre.value = 'autre';
  optAutre.textContent = t('dest.other');
  select.appendChild(optAutre);
  if (current) select.value = current;
}

window.addEventListener('filterSejours', (e) => {
  activeFilter = e.detail?.filter || null;
  if (sejoursLoaded) renderGrid(allSejours);
});

window.addEventListener('languageChanged', () => {
  if (!document.getElementById('destinationsGrid')) return;
  if (!sejoursLoaded) loadDestinationsGrid();
  else {
    renderGrid(allSejours);
    populateDestinationSelect(allSejours);
  }
});
