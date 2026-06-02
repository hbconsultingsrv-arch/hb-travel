const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
const contactForm = document.getElementById('contactForm');
const formNote = document.getElementById('formNote');
const contactLoginHint = document.getElementById('contactLoginHint');

navToggle?.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', isOpen);
});

navLinks?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle?.setAttribute('aria-expanded', 'false');
  });
});

async function prefillContactForm() {
  const session = await getSession();
  if (!session || !contactForm) return;

  if (contactLoginHint) {
    contactLoginHint.innerHTML = typeof t === 'function' ? t('contact.loggedHint') : 'Connecté — votre demande sera enregistrée dans <a href="compte.html">votre espace client</a>.';
  }

  try {
    const profile = await getProfile(session.user.id);
    if (profile?.full_name) contactForm.name.value = profile.full_name;
    if (profile?.phone) contactForm.phone.value = profile.phone;
    if (session.user.email) contactForm.email.value = session.user.email;
  } catch (_) { /* profil pas encore créé */ }
}

contactForm?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const session = await getSession();
  const fd = new FormData(contactForm);

  if (!session) {
    formNote.textContent = typeof t === 'function' ? t('contact.needLogin') : 'Connectez-vous pour enregistrer votre demande et la suivre en ligne.';
    formNote.className = 'form-note error';
    setTimeout(() => { window.location.href = 'login.html?redirect=index.html'; }, 2000);
    return;
  }

  if (!isConfigured()) {
    formNote.textContent = configErrorMessage();
    formNote.className = 'form-note error';
    return;
  }

  try {
    await createTravelRequest(session.user.id, {
      full_name: fd.get('name'),
      phone: fd.get('phone'),
      email: fd.get('email'),
      destination: fd.get('destination'),
      message: fd.get('message') || ''
    });

    await updateProfile(session.user.id, {
      full_name: fd.get('name'),
      phone: fd.get('phone')
    }).catch(() => {});

    formNote.textContent = typeof t === 'function' ? t('contact.success') : 'Demande enregistrée ! Consultez-la dans votre espace client.';
    formNote.className = 'form-note success';
    contactForm.reset();
    prefillContactForm();
  } catch (err) {
    formNote.textContent = err.message || (typeof t === 'function' ? t('contact.error') : 'Erreur lors de l\'envoi. Réessayez ou contactez-nous par téléphone.');
    formNote.className = 'form-note error';
  }
});

/* scroll géré par home.js pour .nav-3d */

document.addEventListener('DOMContentLoaded', prefillContactForm);
