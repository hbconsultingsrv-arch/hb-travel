const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
const contactForm = document.getElementById('contactForm');
const formNote = document.getElementById('formNote');

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

contactForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  formNote.textContent = 'Merci ! Votre demande a été enregistrée. Nous vous recontacterons sous 24 h.';
  formNote.className = 'form-note success';
  contactForm.reset();
});

window.addEventListener('scroll', () => {
  const nav = document.querySelector('.nav');
  if (window.scrollY > 50) {
    nav.style.boxShadow = '0 2px 20px rgba(0,0,0,0.2)';
  } else {
    nav.style.boxShadow = 'none';
  }
});
