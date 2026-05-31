async function isAdmin() {
  const session = await getSession();
  if (!session) return false;
  const profile = await getProfile(session.user.id);
  return profile?.role === 'admin';
}

async function requireAdmin() {
  const session = await requireAuth('login.html?redirect=admin.html');
  if (!session) return null;
  const admin = await isAdmin();
  if (!admin) {
    window.location.href = 'compte.html';
    return null;
  }
  return session;
}

async function fetchAllSejours() {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from('sejours')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

async function createSejour(sejour) {
  const sb = getSupabase();
  if (!sb) throw new Error(configErrorMessage());
  const { data, error } = await sb.from('sejours').insert(sejour).select().single();
  if (error) throw error;
  return data;
}

async function updateSejour(id, fields) {
  const sb = getSupabase();
  if (!sb) throw new Error(configErrorMessage());
  const { data, error } = await sb.from('sejours').update(fields).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

async function deleteSejour(id) {
  const sb = getSupabase();
  if (!sb) throw new Error(configErrorMessage());
  const { error } = await sb.from('sejours').delete().eq('id', id);
  if (error) throw error;
}

async function fetchAllRequests() {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from('travel_requests')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function updateRequestStatus(id, status) {
  const sb = getSupabase();
  if (!sb) throw new Error(configErrorMessage());
  const { data, error } = await sb
    .from('travel_requests')
    .update({ status })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function getDestinationLabel(slug) {
  if (!slug) return '—';
  if (slug === 'autre') return 'Autre destination';
  const sb = getSupabase();
  if (!sb) return DESTINATION_LABELS[slug] || slug;
  const { data } = await sb.from('sejours').select('title').eq('slug', slug).maybeSingle();
  return data?.title || DESTINATION_LABELS[slug] || slug;
}
