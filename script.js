(() => {
  document.documentElement.classList.add('js');
  const header = document.querySelector('.site-header');
  const nav = document.querySelector('.site-nav');
  const toggle = document.querySelector('.nav-toggle');

  const setHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 12);
  setHeader();
  window.addEventListener('scroll', setHeader, { passive: true });

  if (nav && toggle) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
      toggle.textContent = open ? '×' : '☰';
    });

    nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Abrir menu');
      toggle.textContent = '☰';
    }));

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.textContent = '☰';
        toggle.focus();
      }
    });
  }

  document.querySelectorAll('video[data-autopause]').forEach((video) => {
    if (!('IntersectionObserver' in window)) return;
    const videoObserver = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting && !video.paused) video.pause();
    }, { threshold: 0.1 });
    videoObserver.observe(video);
  });

  // --- Toggle de Tema (Cinema / Studio) ---
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      const newTheme = isLight ? 'dark' : 'light';
      
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      
      // Update meta theme-color based on active theme
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', newTheme === 'light' ? '#f7f7f8' : '#08090b');
      }

      const themeLabel = themeToggle.querySelector('.theme-toggle-label');
      if (themeLabel) {
        themeLabel.textContent = newTheme === 'light' ? 'Studio' : 'Cinema';
      }
    });

    // Set initial label on load
    const currentTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    const themeLabel = themeToggle.querySelector('.theme-toggle-label');
    if (themeLabel) {
      themeLabel.textContent = currentTheme === 'light' ? 'Studio' : 'Cinema';
    }
  }
})();
