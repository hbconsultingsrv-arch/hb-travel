const DESTINATION_LABELS = {
  omra: 'Omra / Hajj',
  turquie: 'Turquie',
  maldives: 'Maldives',
  maroc: 'Maroc',
  autre: 'Autre destination'
};

const STATUS_LABELS = {
  en_attente: 'En attente',
  en_cours: 'En cours',
  traite: 'Traité',
  annule: 'Annulé'
};

async function getSession() {
  const sb = getSupabase();
  if (!sb) return null;
  const { data: { session } } = await sb.auth.getSession();
  return session;
}

async function requireAuth(redirectTo = 'login.html') {
  const session = await getSession();
  if (!session) {
    window.location.href = `${redirectTo}?redirect=${encodeURIComponent(window.location.pathname.split('/').pop() || 'compte.html')}`;
    return null;
  }
  return session;
}

async function signIn(email, password) {
  const sb = getSupabase();
  if (!sb) throw new Error(configErrorMessage());
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function signUp({ email, password, fullName, phone }) {
  const sb = getSupabase();
  if (!sb) throw new Error(configErrorMessage());
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, phone }
    }
  });
  if (error) throw error;
  return data;
}

async function signOut() {
  const sb = getSupabase();
  if (!sb) return;
  await sb.auth.signOut();
  window.location.href = 'index.html';
}

async function getProfile(userId) {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function updateProfile(userId, fields) {
  const sb = getSupabase();
  if (!sb) throw new Error(configErrorMessage());
  const { data, error } = await sb
    .from('profiles')
    .update(fields)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function getTravelRequests(userId) {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from('travel_requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function createTravelRequest(userId, request) {
  const sb = getSupabase();
  if (!sb) throw new Error(configErrorMessage());
  const { data, error } = await sb
    .from('travel_requests')
    .insert({ user_id: userId, ...request })
    .select()
    .single();
  if (error) throw error;
  return data;
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
}

function showAlert(el, message, type = 'error') {
  if (!el) return;
  el.textContent = message;
  el.className = `form-note ${type === 'success' ? 'success' : 'error'}`;
}

async function updateNavAuth() {
  const loginLink = document.getElementById('navLogin');
  const accountLink = document.getElementById('navAccount');
  const logoutBtn = document.getElementById('navLogout');
  if (!loginLink && !accountLink) return;

  const session = await getSession();

  if (session) {
    if (loginLink) loginLink.style.display = 'none';
    if (accountLink) accountLink.style.display = '';
    if (logoutBtn) logoutBtn.style.display = '';
  } else {
    if (loginLink) loginLink.style.display = '';
    if (accountLink) accountLink.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
  }

  logoutBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    signOut();
  }, { once: true });
}

document.addEventListener('DOMContentLoaded', updateNavAuth);
