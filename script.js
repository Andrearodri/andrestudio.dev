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
    const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      video.pause();
      video.removeAttribute('autoplay');
      return;
    }
    if (!('IntersectionObserver' in window)) return;
    const videoObserver = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting && !video.paused) {
        video.pause();
      } else if (entry.isIntersecting && video.paused) {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Silently ignore browser autoplay restrictions without console errors
          });
        }
      }
    }, { threshold: 0.15 });
    videoObserver.observe(video);
  });

  // --- Toggle de tema ---
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
        themeLabel.textContent = newTheme === 'light' ? 'Escuro' : 'Claro';
      }
      themeToggle.setAttribute('aria-label', newTheme === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro');
    });

    // Set initial label on load
    const currentTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    const themeLabel = themeToggle.querySelector('.theme-toggle-label');
    if (themeLabel) {
      themeLabel.textContent = currentTheme === 'light' ? 'Escuro' : 'Claro';
    }
    themeToggle.setAttribute('aria-label', currentTheme === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro');
  }

  // --- Showcase Tabs Filter & Mouse Spotlight ---
  const filterTabs = document.querySelectorAll('.showcase-tab');
  const bentoGrid = document.getElementById('showcase-grid');
  const bentoCards = document.querySelectorAll('.bento-card');

  if (filterTabs.length && bentoGrid) {
    filterTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const filter = tab.getAttribute('data-filter');
        
        filterTabs.forEach((t) => {
          t.classList.remove('is-active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('is-active');
        tab.setAttribute('aria-selected', 'true');

        if (filter === 'all') {
          bentoGrid.classList.remove('is-filtered');
          bentoCards.forEach((card) => {
            card.classList.remove('is-hidden');
          });
        } else {
          bentoGrid.classList.add('is-filtered');
          bentoCards.forEach((card) => {
            const category = card.getAttribute('data-category');
            if (category === filter) {
              card.classList.remove('is-hidden');
            } else {
              card.classList.add('is-hidden');
            }
          });
        }
      });
    });

    // Spotlight cursor effect on desktop pointer devices
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      bentoCards.forEach((card) => {
        card.addEventListener('mousemove', (e) => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          card.style.setProperty('--mouse-x', `${x}px`);
          card.style.setProperty('--mouse-y', `${y}px`);
        });
      });
    }
  }
})();
