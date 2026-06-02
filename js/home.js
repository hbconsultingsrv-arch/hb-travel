/* Accueil 3D — carrousel swipe + interactions */

function initNav3d() {
  const nav = document.querySelector('.nav-3d');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  });
}

function initCategoryFilter() {
  const cards = document.querySelectorAll('.cat-card-3d');
  const filterMsg = document.getElementById('filterActiveMsg');
  const destSection = document.getElementById('destinations');

  cards.forEach((card) => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      const filter = card.dataset.filter;
      cards.forEach((c) => c.classList.remove('active'));
      card.classList.add('active');
      applyFilter(filter, filterMsg);
      destSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

function applyFilter(filter, filterMsg) {
  if (filterMsg) {
    const labelKeys = { omra: 'filter.omra', halal: 'filter.halal', famille: 'filter.famille', hotel: 'filter.hotel' };
    const label = typeof t === 'function' ? t(labelKeys[filter] || filter) : filter;
    filterMsg.textContent = typeof t === 'function' ? t('filter.active', { label }) : `Filtre actif : ${label}`;
  }
  window.dispatchEvent(new CustomEvent('filterSejours', { detail: { filter } }));
  document.querySelectorAll('.cat-card-3d').forEach((c) => {
    c.classList.toggle('active', c.dataset.filter === filter);
  });
}

function getSlideImage(slide) {
  const photo = slide.querySelector('.slide-photo');
  if (photo?.src) return photo.src;

  const inline = slide.style.backgroundImage;
  if (inline) {
    const m = inline.match(/url\(["']?([^"')]+)["']?\)/);
    if (m) return m[1];
  }
  return '';
}

function starsFromRating(rating) {
  const r = parseFloat(rating) || 5;
  const full = Math.round(r);
  return '★'.repeat(full) + '☆'.repeat(5 - full) + ` ${rating}`;
}

function updateHeroAmbience(slideIndex, slides) {
  const slide = slides[slideIndex];
  if (!slide) return;

  const img = getSlideImage(slide);
  const layerA = document.querySelector('.hero-bg-a');
  const layerB = document.querySelector('.hero-bg-b');
  if (!layerA || !layerB || !img) return;

  const inactive = layerA.classList.contains('active') ? layerB : layerA;
  const active = layerA.classList.contains('active') ? layerA : layerB;

  inactive.style.backgroundImage = `url('${img}')`;
  inactive.classList.add('active');
  active.classList.remove('active');

  const priceEl = document.getElementById('bgChipPrice');
  const starsEl = document.getElementById('bgChipStars');
  const reviewsEl = document.getElementById('bgChipReviews');
  const tagEl = document.getElementById('bgChipTag');

  [priceEl, starsEl, reviewsEl, tagEl].forEach((el) => {
    if (el) el.classList.add('chip-fade');
  });

  setTimeout(() => {
    if (priceEl) priceEl.textContent = `${typeof t === 'function' ? t('chip.from') : 'dès'} ${slide.dataset.price || '—'}`;
    if (starsEl) starsEl.textContent = starsFromRating(slide.dataset.rating);
    if (reviewsEl) reviewsEl.textContent = typeof t === 'function' ? t('chip.reviews', { n: slide.dataset.reviews || '0' }) : `${slide.dataset.reviews || '0'} avis`;
    if (tagEl) {
      const tagKey = slide.dataset.tagKey;
      tagEl.textContent = tagKey && typeof t === 'function' ? t(tagKey) : (slide.dataset.tag || '');
    }
    [priceEl, starsEl, reviewsEl, tagEl].forEach((el) => {
      if (el) el.classList.remove('chip-fade');
    });
  }, 200);
}

function initCarousel3d() {
  const track = document.getElementById('carouselTrack');
  const viewport = document.querySelector('.carousel-3d-viewport');
  const dotsContainer = document.getElementById('carouselDots');
  if (!track || !viewport) return;

  const slides = [...track.querySelectorAll('.carousel-slide')];
  const total = slides.length;
  let current = 0;
  let ambienceIndex = -1;
  let startX = 0;
  let dragging = false;
  let dragDelta = 0;

  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Slide ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    dotsContainer?.appendChild(dot);
  });

  const dots = dotsContainer ? [...dotsContainer.querySelectorAll('.carousel-dot')] : [];

  function previewAmbienceIndex(index) {
    if (index === ambienceIndex) return;
    ambienceIndex = index;
    updateHeroAmbience(index, slides);
  }

  function ambienceIndexFromDrag(dragOffset) {
    if (dragOffset < -0.22) return (current + 1) % total;
    if (dragOffset > 0.22) return (current - 1 + total) % total;
    return current;
  }

  function updateSlides(dragOffset = 0) {
    slides.forEach((slide, i) => {
      let offset = i - current;
      const progress = offset + dragOffset;

      if (Math.abs(progress) > 2.5) {
        slide.style.opacity = '0';
        slide.style.pointerEvents = 'none';
        slide.style.transform = `translateX(${progress * 120}%) translateZ(-200px) scale(0.5)`;
        slide.classList.remove('is-active');
        return;
      }

      const abs = Math.abs(progress);
      const tx = progress * 105 + dragOffset * 30;
      const ry = progress * -35;
      const scale = 1 - abs * 0.14;
      const tz = 80 - abs * 60;
      const opacity = Math.max(0.2, 1 - abs * 0.35);

      slide.style.opacity = String(opacity);
      slide.style.zIndex = String(100 - Math.round(abs * 10));
      slide.style.transform = `
        translateX(${tx}%)
        translateZ(${tz}px)
        rotateY(${ry}deg)
        scale(${scale})
      `;

      if (Math.abs(progress) < 0.5) {
        slide.classList.add('is-active');
      } else {
        slide.classList.remove('is-active');
      }
    });

    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  }

  function goTo(index) {
    current = ((index % total) + total) % total;
    dragDelta = 0;
    updateSlides(0);
    previewAmbienceIndex(current);
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  document.querySelector('.carousel-prev')?.addEventListener('click', prev);
  document.querySelector('.carousel-next')?.addEventListener('click', next);

  slides.forEach((slide) => {
    slide.addEventListener('click', () => {
      if (!slide.classList.contains('is-active')) return;
      const filter = slide.dataset.filter;
      applyFilter(filter, document.getElementById('filterActiveMsg'));
      document.getElementById('destinations')?.scrollIntoView({ behavior: 'smooth' });
    });
  });

  function onStart(clientX) {
    dragging = true;
    startX = clientX;
    dragDelta = 0;
    viewport.classList.add('is-dragging');
    slides.forEach((s) => { s.style.transition = 'none'; });
  }

  function onMove(clientX) {
    if (!dragging) return;
    dragDelta = (clientX - startX) / viewport.offsetWidth;
    updateSlides(dragDelta);
    previewAmbienceIndex(ambienceIndexFromDrag(dragDelta));
  }

  function onEnd() {
    if (!dragging) return;
    dragging = false;
    viewport.classList.remove('is-dragging');
    slides.forEach((s) => {
      s.style.transition = '';
    });

    if (dragDelta < -0.18) next();
    else if (dragDelta > 0.18) prev();
    else {
      updateSlides(0);
      previewAmbienceIndex(current);
    }

    dragDelta = 0;
  }

  viewport.addEventListener('touchstart', (e) => onStart(e.touches[0].clientX), { passive: true });
  viewport.addEventListener('touchmove', (e) => onMove(e.touches[0].clientX), { passive: true });
  viewport.addEventListener('touchend', onEnd);

  viewport.addEventListener('mousedown', (e) => {
    e.preventDefault();
    onStart(e.clientX);
  });
  window.addEventListener('mousemove', (e) => onMove(e.clientX));
  window.addEventListener('mouseup', onEnd);

  let autoTimer = setInterval(next, 5000);
  viewport.addEventListener('touchstart', () => clearInterval(autoTimer), { once: false });
  viewport.addEventListener('mousedown', () => clearInterval(autoTimer));

  updateSlides(0);
  previewAmbienceIndex(0);
}

document.addEventListener('DOMContentLoaded', () => {
  initNav3d();
  initCategoryFilter();
  initCarousel3d();
});

window.addEventListener('languageChanged', () => {
  const track = document.getElementById('carouselTrack');
  if (!track) return;
  const slides = [...track.querySelectorAll('.carousel-slide')];
  const active = slides.find((s) => s.classList.contains('is-active'));
  if (active) {
    const idx = parseInt(active.dataset.index, 10);
    if (!Number.isNaN(idx)) updateHeroAmbience(idx, slides);
  }
});
