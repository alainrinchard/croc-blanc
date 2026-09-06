/* Interactions natives : navigation et onglets accessibles, sans dépendance. */
'use strict';

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');

function closeMenu() {
  if (!menuButton || !navigation) return;
  menuButton.setAttribute('aria-expanded', 'false');
  navigation.classList.remove('is-open');
}

menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('is-open', open);
});
navigation?.addEventListener('click', (event) => {
  if (event.target.closest('a')) closeMenu();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menuButton.focus();
  }
});
document.addEventListener('click', (event) => {
  if (!event.target.closest('.header-inner')) closeMenu();
});
window.matchMedia('(min-width: 1281px)').addEventListener('change', closeMenu);

document.querySelectorAll('[data-tabs]').forEach((group) => {
  const tabs = [...group.querySelectorAll('[role="tab"]')];
  const panels = [...group.querySelectorAll('[role="tabpanel"]')];

  function activate(tab, focus = false) {
    tabs.forEach((item) => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
    });
    panels.forEach((panel) => { panel.hidden = panel.id !== tab.getAttribute('aria-controls'); });
    if (focus) tab.focus();
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(tab));
    tab.addEventListener('keydown', (event) => {
      const vertical = tab.closest('[role="tablist"]').getAttribute('aria-orientation') === 'vertical';
      let next;
      if (event.key === (vertical ? 'ArrowDown' : 'ArrowRight')) next = (index + 1) % tabs.length;
      if (event.key === (vertical ? 'ArrowUp' : 'ArrowLeft')) next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) {
        event.preventDefault();
        activate(tabs[next], true);
      }
    });
  });
});

/* Les événements de défilement partagent une seule mise à jour par image. */
const progress = document.querySelector('.reading-progress');
const navLinks = [...document.querySelectorAll('#navigation a[href^="#"]')];
const sections = navLinks.map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean);
let framePending = false;
function updateReadingPosition() {
  const available = document.documentElement.scrollHeight - window.innerHeight;
  if (progress) progress.style.transform = `scaleX(${available > 0 ? Math.min(1, window.scrollY / available) : 0})`;
  let current = '';
  sections.forEach((section) => {
    if (section.getBoundingClientRect().top <= 160) current = `#${section.id}`;
  });
  navLinks.forEach((link) => {
    if (link.getAttribute('href') === current) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  framePending = false;
}
function schedulePositionUpdate() {
  if (!framePending) { framePending = true; window.requestAnimationFrame(updateReadingPosition); }
}
window.addEventListener('scroll', schedulePositionUpdate, { passive: true });
window.addEventListener('resize', schedulePositionUpdate);
document.addEventListener('toggle', schedulePositionUpdate, true);
updateReadingPosition();

/* Préférence d’affichage partagée par le site, le dossier et les fiches. */
const themeButtons = document.querySelectorAll('.theme-toggle');
function updateThemeControls() {
  const dark = document.documentElement.dataset.theme === 'dark';
  themeButtons.forEach((button) => {
    button.textContent = dark ? 'Mode clair' : 'Mode sombre';
    button.setAttribute('aria-pressed', String(dark));
    button.setAttribute('aria-label', dark ? 'Activer le mode clair' : 'Activer le mode sombre');
  });
}
themeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('lecture-theme', theme); } catch { /* Préférence pour cette page seulement. */ }
    updateThemeControls();
  });
});
window.addEventListener('storage', (event) => {
  if (event.key === 'lecture-theme' && ['light', 'dark'].includes(event.newValue)) {
    document.documentElement.dataset.theme = event.newValue;
    updateThemeControls();
  }
});
updateThemeControls();

/* Chaque page imprimable contient exclusivement la fiche choisie, en entier. */
document.querySelectorAll('[data-print]').forEach((button) => {
  button.addEventListener('click', () => window.print());
});
if (document.body.classList.contains('print-sheet')
    && new URLSearchParams(window.location.search).get('imprimer') === '1') {
  window.addEventListener('load', () => {
    window.requestAnimationFrame(() => window.print());
  }, { once: true });
}

/* Apparitions légères, une seule fois, sans masquer le contenu au préalable. */
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const runningAnimations = new Set();
if ('IntersectionObserver' in window && typeof Element.prototype.animate === 'function') {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      if (reducedMotion.matches) return;
      const animation = entry.target.animate([
        { opacity: 0.7, transform: 'translateY(12px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ], { duration: 450, easing: 'ease-out' });
      runningAnimations.add(animation);
      animation.finished.then(() => runningAnimations.delete(animation)).catch(() => runningAnimations.delete(animation));
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.hero-copy, .section-heading, .theme, .author-photo').forEach((element) => revealObserver.observe(element));
}
function stopAnimations() {
  runningAnimations.forEach((animation) => animation.cancel());
  runningAnimations.clear();
}
reducedMotion.addEventListener('change', (event) => { if (event.matches) stopAnimations(); });
window.addEventListener('beforeprint', stopAnimations);
