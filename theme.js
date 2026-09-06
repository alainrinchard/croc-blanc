/* Appliquer la préférence avant l’affichage évite un éclair clair au chargement. */
'use strict';
(() => {
  let savedTheme = null;
  try {
    savedTheme = localStorage.getItem('lecture-theme');
  } catch {
    // La navigation privée ou les fichiers locaux peuvent interdire le stockage.
  }
  const dark = savedTheme === 'dark'
    || (savedTheme !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
})();
