(() => {
  'use strict';

  let theme = localStorage.getItem('theme');
  if (!theme) {
    theme = matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  if (theme === 'light') document.documentElement.setAttribute('data-theme', 'light');
})();
