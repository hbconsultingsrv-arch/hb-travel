const AVIS_STATUS_LABELS = {
  en_attente: 'En attente de validation',
  approuve: 'Publié',
  refuse: 'Refusé'
};

function renderStars(rating, interactive = false) {
  let html = `<span class="stars ${interactive ? 'stars-interactive' : ''}" ${interactive ? 'role="group" aria-label="Note"' : ''}>`;
  for (let i = 1; i <= 5; i++) {
    const filled = i <= rating;
    if (interactive) {
      html += `<button type="button" class="star-btn ${filled ? 'active' : ''}" data-value="${i}" aria-label="${i} étoile${i > 1 ? 's' : ''}">★</button>`;
    } else {
      html += `<span class="star-display ${filled ? 'active' : ''}">★</span>`;
    }
  }
  html += '</span>';
  return html;
}

function initStarRating(container, hiddenInput) {
  if (!container || !hiddenInput) return;

  container.querySelectorAll('.star-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const val = parseInt(btn.dataset.value, 10);
      hiddenInput.value = val;
      container.querySelectorAll('.star-btn').forEach((b) => {
        b.classList.toggle('active', parseInt(b.dataset.value, 10) <= val);
      });
    });
  });
}

async function fetchUserAvis(userId) {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from('avis')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function fetchApprovedAvis(limit = 6) {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from('avis')
    .select('*')
    .eq('status', 'approuve')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

async function fetchPendingAvis() {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from('avis')
    .select('*')
    .eq('status', 'en_attente')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function fetchAllAvisAdmin() {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from('avis')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function createAvis({ userId, authorName, sejourId, travelRequestId, targetLabel, rating, message }) {
  const sb = getSupabase();
  if (!sb) throw new Error(configErrorMessage());

  const payload = {
    user_id: userId,
    author_name: authorName,
    target_label: targetLabel,
    rating: parseInt(rating, 10),
    message,
    status: 'en_attente'
  };

  if (sejourId) payload.sejour_id = sejourId;
  if (travelRequestId) payload.travel_request_id = travelRequestId;

  const { data, error } = await sb.from('avis').insert(payload).select().single();
  if (error) throw error;
  return data;
}

async function updateAvisStatus(id, status) {
  const sb = getSupabase();
  if (!sb) throw new Error(configErrorMessage());
  const { data, error } = await sb
    .from('avis')
    .update({ status })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function userHasAvisForTarget(userId, { sejourId, travelRequestId }) {
  const sb = getSupabase();
  if (!sb) return false;
  let query = sb.from('avis').select('id').eq('user_id', userId);
  if (sejourId) query = query.eq('sejour_id', sejourId);
  if (travelRequestId) query = query.eq('travel_request_id', travelRequestId);
  const { data } = await query.maybeSingle();
  return !!data;
}

function escapeHtmlAvis(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

async function loadPublicTestimonials() {
  const container = document.getElementById('testimonialsContainer');
  if (!container) return;

  try {
    const avis = await fetchApprovedAvis(3);
    if (!avis.length) {
      container.innerHTML = `
        <div class="testimonial">
          <blockquote>${typeof t === 'function' ? t('testimonial.default') : '« HB Travel a organisé notre Omra en famille. Tout était parfait : proximité du Haram, repas halal, et un guide très pédagogue pour nos enfants. »'}</blockquote>
          <cite>— Fatima & Karim, Lyon</cite>
        </div>`;
      return;
    }

    container.innerHTML = avis.map((a) => `
      <div class="testimonial">
        <div class="testimonial-stars">${renderStars(a.rating)}</div>
        <blockquote>« ${escapeHtmlAvis(a.message)} »</blockquote>
        <cite>— ${escapeHtmlAvis(a.author_name)} · ${escapeHtmlAvis(a.target_label)}</cite>
      </div>
    `).join('');
  } catch (_) {
    /* garde le témoignage par défaut */
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('testimonialsContainer')) {
    loadPublicTestimonials();
  }
});
