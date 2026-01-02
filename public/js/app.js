/**
 * ISFEC B2B Pilot — Application JavaScript
 */

// Utilitaires
const utils = {
  // Debounce function
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Fetch avec gestion d'erreurs
  async fetchJSON(url, options = {}) {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  },

  // Afficher un message de sauvegarde
  showSaveIndicator(element, saving = false) {
    if (!element) return;

    element.classList.add('visible');

    if (saving) {
      element.classList.add('saving');
      element.innerHTML = '<span class="spinner"></span> Sauvegarde...';
    } else {
      element.classList.remove('saving');
      element.innerHTML = '✓ Sauvegardé';

      // Masquer après 2 secondes
      setTimeout(() => {
        element.classList.remove('visible');
      }, 2000);
    }
  },

  // Scroll fluide vers un élément
  scrollTo(element, offset = 100) {
    if (!element) return;

    const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({
      top,
      behavior: 'smooth',
    });
  },

  // Formater une date
  formatDate(date) {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  },
};

// Gestion de la recherche
const search = {
  init() {
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');

    if (!searchInput) return;

    // Recherche avec debounce
    const performSearch = utils.debounce(async (query) => {
      if (query.length < 2) {
        searchResults.classList.remove('visible');
        return;
      }

      try {
        const version = window.currentVersion || '';
        const data = await utils.fetchJSON(`/api/search?q=${encodeURIComponent(query)}&version=${version}`);

        if (data.results.length > 0) {
          this.renderResults(data.results, searchResults);
          searchResults.classList.add('visible');
        } else {
          searchResults.innerHTML = '<div class="search-no-results">Aucun résultat</div>';
          searchResults.classList.add('visible');
        }
      } catch (error) {
        console.error('Search error:', error);
      }
    }, 300);

    searchInput.addEventListener('input', (e) => {
      performSearch(e.target.value);
    });

    // Fermer les résultats au clic extérieur
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-box')) {
        searchResults.classList.remove('visible');
      }
    });
  },

  renderResults(results, container) {
    container.innerHTML = results.map(result => `
      <a href="/etude/${result.version}?section=${result.sectionId}" class="search-result-item">
        <div class="search-result-title">${result.numero}. ${result.titre}</div>
        <div class="search-result-excerpt">${this.highlightExcerpt(result.excerpt)}</div>
      </a>
    `).join('');
  },

  highlightExcerpt(excerpt) {
    // Simple highlight - peut être amélioré
    return excerpt;
  },
};

// Navigation clavier
const keyboard = {
  init() {
    document.addEventListener('keydown', (e) => {
      // Échapper ferme les modals/menus
      if (e.key === 'Escape') {
        // Fermer le menu utilisateur
        const userDropdown = document.querySelector('.user-dropdown[style*="display: block"]');
        if (userDropdown) {
          userDropdown.style.display = 'none';
        }

        // Fermer les résultats de recherche
        const searchResults = document.getElementById('search-results');
        if (searchResults) {
          searchResults.classList.remove('visible');
        }
      }

      // Navigation sections avec flèches (si dans la page études)
      if (document.body.classList.contains('etude-page')) {
        if (e.key === 'ArrowDown' && e.altKey) {
          e.preventDefault();
          this.navigateSection('next');
        } else if (e.key === 'ArrowUp' && e.altKey) {
          e.preventDefault();
          this.navigateSection('prev');
        }
      }
    });
  },

  navigateSection(direction) {
    const sections = document.querySelectorAll('.section');
    const currentActive = document.querySelector('.toc-item.active');

    if (!currentActive || !sections.length) return;

    const currentIndex = Array.from(document.querySelectorAll('.toc-item')).indexOf(currentActive);
    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

    if (newIndex >= 0 && newIndex < sections.length) {
      const newSection = sections[newIndex];
      utils.scrollTo(newSection);
    }
  },
};

// Hash navigation (pour les ancres)
const hashNav = {
  init() {
    // Scroll vers l'ancre au chargement
    if (window.location.hash) {
      const element = document.getElementById(window.location.hash.substring(1));
      if (element) {
        setTimeout(() => {
          utils.scrollTo(element);
        }, 100);
      }
    }

    // Gérer les clics sur les ancres
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (link) {
        e.preventDefault();
        const id = link.getAttribute('href').substring(1);
        const element = document.getElementById(id);
        if (element) {
          utils.scrollTo(element);
          history.pushState(null, null, `#${id}`);
        }
      }
    });
  },
};

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
  search.init();
  keyboard.init();
  hashNav.init();

  console.log('ISFEC B2B Pilot initialized');
});

// Export pour utilisation dans d'autres scripts
window.ISFECApp = {
  utils,
  search,
};
