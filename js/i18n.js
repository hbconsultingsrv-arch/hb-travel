/* HB Travel — Moteur i18n + détection navigateur */

const HB_LANG_STORAGE = 'hb_lang';
const HB_LANG_PROMPT_KEY = 'hb_lang_prompt_done';

let _currentLang = HB_DEFAULT_LANG;

function detectBrowserLanguage() {
  const list = navigator.languages?.length ? navigator.languages : [navigator.language || 'fr'];
  for (const raw of list) {
    const code = String(raw).toLowerCase().split('-')[0];
    if (HB_LANGS[code]) return code;
  }
  return HB_DEFAULT_LANG;
}

function getStoredLanguage() {
  const stored = localStorage.getItem(HB_LANG_STORAGE);
  return stored && HB_LANGS[stored] ? stored : null;
}

function getCurrentLang() {
  return _currentLang;
}

function getBrowserLocaleDetails() {
  const raw = navigator.language || 'fr-FR';
  const parts = raw.split('-');
  const langCode = detectBrowserLanguage();
  const langName = HB_LANGS[langCode]?.native || langCode.toUpperCase();
  let region = '';
  if (parts[1]) {
    try {
      const dn = new Intl.DisplayNames([getCurrentLang()], { type: 'region' });
      region = ` (${dn.of(parts[1].toUpperCase())})`;
    } catch {
      region = ` (${parts[1].toUpperCase()})`;
    }
  }
  return { langCode, langName, region, raw };
}

function t(key, params = {}, langOverride) {
  const lang = langOverride || _currentLang;
  const dict = HB_TRANSLATIONS[lang] || HB_TRANSLATIONS[HB_DEFAULT_LANG];
  const fallback = HB_TRANSLATIONS[HB_DEFAULT_LANG];
  let str = dict?.[key] ?? fallback?.[key] ?? key;
  Object.entries(params).forEach(([k, v]) => {
    str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
  });
  return str;
}

function applyDocumentLanguage(lang) {
  const meta = HB_LANGS[lang] || HB_LANGS[HB_DEFAULT_LANG];
  document.documentElement.lang = lang;
  document.documentElement.dir = meta.dir || 'ltr';
  document.body?.classList.toggle('is-rtl', meta.dir === 'rtl');
}

function applyTranslations(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (!key) return;
    el.textContent = t(key);
  });

  root.querySelectorAll('[data-i18n-html]').forEach((el) => {
    const key = el.getAttribute('data-i18n-html');
    if (!key) return;
    el.innerHTML = t(key);
  });

  root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key) el.placeholder = t(key);
  });

  root.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    const key = el.getAttribute('data-i18n-aria');
    if (key) el.setAttribute('aria-label', t(key));
  });

  root.querySelectorAll('[data-i18n-title]').forEach((el) => {
    const key = el.getAttribute('data-i18n-title');
    if (key) el.setAttribute('title', t(key));
  });

  const titleKey = document.querySelector('title[data-i18n]')?.getAttribute('data-i18n');
  if (titleKey) document.title = t(titleKey);

  const metaDesc = document.querySelector('meta[name="description"][data-i18n]');
  if (metaDesc) {
    const key = metaDesc.getAttribute('data-i18n');
    if (key) metaDesc.setAttribute('content', t(key));
  }

  document.querySelectorAll('.lang-select').forEach((sel) => {
    sel.value = _currentLang;
  });
}

function setLanguage(lang, { persist = true, skipEvent = false } = {}) {
  if (!HB_LANGS[lang]) lang = HB_DEFAULT_LANG;
  _currentLang = lang;
  if (persist) localStorage.setItem(HB_LANG_STORAGE, lang);
  applyDocumentLanguage(lang);
  applyTranslations();
  if (!skipEvent) {
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
  }
}

function markPromptDone() {
  localStorage.setItem(HB_LANG_PROMPT_KEY, '1');
}

function shouldShowLanguagePrompt() {
  if (getStoredLanguage()) return false;
  if (localStorage.getItem(HB_LANG_PROMPT_KEY)) return false;
  const detected = detectBrowserLanguage();
  return detected !== HB_DEFAULT_LANG;
}

function showLanguagePrompt() {
  if (!shouldShowLanguagePrompt()) return;

  const { langCode, langName, region } = getBrowserLocaleDetails();
  const promptLang = langCode !== HB_DEFAULT_LANG ? langCode : HB_DEFAULT_LANG;
  const overlay = document.createElement('div');
  overlay.className = 'lang-prompt-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.innerHTML = `
    <div class="lang-prompt-card">
      <button type="button" class="lang-prompt-close" aria-label="${t('lang.promptClose', {}, promptLang)}">×</button>
      <div class="lang-prompt-icon">🌐</div>
      <h2 class="lang-prompt-title">${t('lang.promptTitle', {}, promptLang)}</h2>
      <p class="lang-prompt-text">${t('lang.promptText', { langName, region }, promptLang)}</p>
      <div class="lang-prompt-actions">
        <button type="button" class="btn btn-primary lang-prompt-yes">${t('lang.promptYes', { langName }, promptLang)}</button>
        <button type="button" class="btn btn-outline-light lang-prompt-no">${t('lang.promptNo', {}, promptLang)}</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const close = (chosenLang) => {
    markPromptDone();
    if (chosenLang) setLanguage(chosenLang);
    overlay.remove();
  };

  overlay.querySelector('.lang-prompt-yes')?.addEventListener('click', () => close(langCode));
  overlay.querySelector('.lang-prompt-no')?.addEventListener('click', () => {
    setLanguage(HB_DEFAULT_LANG);
    close(null);
  });
  overlay.querySelector('.lang-prompt-close')?.addEventListener('click', () => {
    markPromptDone();
    overlay.remove();
  });
}

function createLanguageSwitcher() {
  const wrap = document.createElement('div');
  wrap.className = 'lang-switcher';
  const label = document.createElement('label');
  label.className = 'lang-switcher-label';
  label.innerHTML = `<span class="lang-globe" aria-hidden="true">🌐</span>`;
  const select = document.createElement('select');
  select.className = 'lang-select';
  select.setAttribute('aria-label', t('nav.lang'));
  Object.entries(HB_LANGS).forEach(([code, info]) => {
    const opt = document.createElement('option');
    opt.value = code;
    opt.textContent = info.native;
    select.appendChild(opt);
  });
  select.value = _currentLang;
  select.addEventListener('change', () => {
    markPromptDone();
    setLanguage(select.value);
  });
  label.appendChild(select);
  wrap.appendChild(label);
  return wrap;
}

function injectLanguageSwitcher() {
  if (document.querySelector('.lang-switcher')) return;

  const nav3d = document.querySelector('.nav-links-3d');
  if (nav3d) {
    const li = document.createElement('li');
    li.className = 'nav-lang-item';
    li.appendChild(createLanguageSwitcher());
    const quote = nav3d.querySelector('a[href="#contact"]')?.parentElement;
    if (quote) nav3d.insertBefore(li, quote);
    else nav3d.appendChild(li);
    return;
  }

  const navSimple = document.querySelector('.nav-simple.container');
  if (navSimple) {
    const sw = createLanguageSwitcher();
    sw.classList.add('lang-switcher-nav-simple');
    const btn = navSimple.querySelector('a.btn, .nav-actions');
    if (btn) navSimple.insertBefore(sw, btn);
    else navSimple.appendChild(sw);
    return;
  }

  const navActions = document.querySelector('.nav-actions');
  if (navActions) {
    navActions.insertBefore(createLanguageSwitcher(), navActions.firstChild);
  }
}

function initI18n() {
  const stored = getStoredLanguage();
  const initial = stored || HB_DEFAULT_LANG;
  setLanguage(initial, { persist: false, skipEvent: true });
  injectLanguageSwitcher();
  applyTranslations();
  if (!stored) showLanguagePrompt();
  window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: _currentLang } }));
}

(function bootstrapLang() {
  const stored = getStoredLanguage();
  _currentLang = stored || HB_DEFAULT_LANG;
  if (document.documentElement) {
    applyDocumentLanguage(_currentLang);
  }
})();

document.addEventListener('DOMContentLoaded', initI18n);

window.t = t;
window.setLanguage = setLanguage;
window.getCurrentLang = getCurrentLang;
