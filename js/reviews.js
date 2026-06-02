const reviewForm = document.getElementById('reviewForm');
const reviewNote = document.getElementById('reviewNote');
const reviewLoginHint = document.getElementById('reviewLoginHint');

function escapeReviewHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

function renderStars(rating) {
  const safeRating = Math.max(0, Math.min(5, Number(rating) || 0));
  return `${'★'.repeat(safeRating)}${'☆'.repeat(5 - safeRating)}`;
}

function renderReviewCard(review) {
  const article = document.createElement('article');
  article.className = 'review-card';
  article.innerHTML = `
    <div class="review-stars" aria-label="${review.rating} étoile(s) sur 5">${renderStars(review.rating)}</div>
    <blockquote>${escapeReviewHtml(review.comment)}</blockquote>
    <cite>${escapeReviewHtml(review.full_name || 'Voyageur HB Travel')}</cite>
  `;
  return article;
}

async function loadApprovedReviews() {
  const list = document.getElementById('reviewsList');
  if (!list) return;

  if (!isConfigured()) {
    list.innerHTML = '<p class="empty-state">Configurez Supabase pour afficher les avis.</p>';
    return;
  }

  try {
    const reviews = await fetchApprovedReviews();
    list.innerHTML = '';

    if (!reviews.length) {
      list.innerHTML = '<p class="empty-state">Aucun avis publié pour le moment.</p>';
      return;
    }

    reviews.forEach((review) => list.appendChild(renderReviewCard(review)));
  } catch (err) {
    list.innerHTML = `<p class="empty-state error">${escapeReviewHtml(err.message)}</p>`;
  }
}

async function prefillReviewForm() {
  const session = await getSession();
  if (!session || !reviewForm) return;

  if (reviewLoginHint) {
    reviewLoginHint.textContent = 'Votre avis sera envoyé à l\'équipe pour validation avant publication.';
  }
}

reviewForm?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const session = await getSession();
  if (!session) {
    showAlert(reviewNote, 'Connectez-vous pour envoyer un avis à valider.');
    setTimeout(() => {
      window.location.href = 'login.html?redirect=index.html%23avis';
    }, 1500);
    return;
  }

  if (!isConfigured()) {
    showAlert(reviewNote, configErrorMessage());
    return;
  }

  const fd = new FormData(reviewForm);
  const rating = Number.parseInt(fd.get('rating'), 10);

  if (Number.isNaN(rating) || rating < 0 || rating > 5) {
    showAlert(reviewNote, 'Choisissez une note entre 0 et 5 étoiles.');
    return;
  }

  try {
    const profile = await getProfile(session.user.id).catch(() => null);
    await createReview(session.user.id, {
      full_name: profile?.full_name || session.user.email?.split('@')[0] || 'Voyageur HB Travel',
      rating,
      comment: fd.get('comment')
    });

    showAlert(reviewNote, 'Merci ! Votre avis est envoyé pour validation.', 'success');
    reviewForm.reset();
  } catch (err) {
    showAlert(reviewNote, err.message || 'Erreur lors de l\'envoi de votre avis.');
  }
});

document.addEventListener('DOMContentLoaded', () => {
  loadApprovedReviews();
  prefillReviewForm();
});
