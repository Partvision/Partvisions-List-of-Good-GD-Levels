class LevelManager {
  constructor() {
    this.levels = this.loadLevels();
    this.searchQuery = '';
    this.difficultyFilter = 'all';
    this.sortFilter = 'recent';
    this.editingId = null;
    this.init();
  }

  init() {
    this.checkSharedData();
    this.setupEventListeners();
    this.renderLevels();
    this.updateDifficultyOptions();
  }

  setupEventListeners() {
    document.getElementById('addBtn').addEventListener('click', () => {
      this.openModal();
    });

    const closeModal = () => {
      document.getElementById('modal').classList.remove('active');
      document.getElementById('levelForm').reset();
      this.editingId = null;
      document.querySelector('.modal-header h2').textContent = 'Add New Level';
      document.getElementById('submitBtn').textContent = 'Add Level';
    };

    document.getElementById('cancelBtn').addEventListener('click', closeModal);
    document.getElementById('closeModal').addEventListener('click', closeModal);

    document.getElementById('levelForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.addLevel();
    });

    document.getElementById('category').addEventListener('change', () => {
      this.updateDifficultyOptions();
    });

    document.getElementById('difficulty').addEventListener('change', () => {
      this.updateStarRatingOptions();
    });

    document.getElementById('searchBar').addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase();
      this.renderLevels();
      this.updateActiveFilters();
    });

    document.getElementById('difficultyFilter').addEventListener('change', (e) => {
      this.difficultyFilter = e.target.value;
      this.renderLevels();
      this.updateActiveFilters();
    });

    document.getElementById('sortFilter').addEventListener('change', (e) => {
      this.sortFilter = e.target.value;
      this.renderLevels();
      this.updateActiveFilters();
    });

    document.getElementById('clearFilters').addEventListener('click', () => {
      this.searchQuery = '';
      this.difficultyFilter = 'all';
      this.sortFilter = 'recent';
      document.getElementById('searchBar').value = '';
      document.getElementById('difficultyFilter').value = 'all';
      document.getElementById('sortFilter').value = 'recent';
      this.renderLevels();
      this.updateActiveFilters();
    });

    // Close on outside click
    document.getElementById('modal').addEventListener('click', (e) => {
      if (e.target.id === 'modal') closeModal();
    });

    // Share button
    document.getElementById('shareBtn').addEventListener('click', () => {
      this.shareList();
    });

    // Version/Changelog
    document.getElementById('versionBtn').addEventListener('click', () => {
      document.getElementById('changelogModal').classList.add('active');
    });

    document.getElementById('closeChangelog').addEventListener('click', () => {
      document.getElementById('changelogModal').classList.remove('active');
    });

    document.getElementById('changelogModal').addEventListener('click', (e) => {
      if (e.target.id === 'changelogModal') {
        document.getElementById('changelogModal').classList.remove('active');
      }
    });
  }

  checkSharedData() {
    const hash = window.location.hash.slice(1);
    if (!hash) return;

    try {
      const decoded = atob(hash);
      const sharedLevels = JSON.parse(decoded);
      
      if (Array.isArray(sharedLevels) && sharedLevels.length > 0) {
        const confirmImport = confirm(`Import ${sharedLevels.length} shared levels? This will replace your current list.`);
        if (confirmImport) {
          this.levels = sharedLevels;
          this.saveLevels();
          this.renderLevels();
          this.showToast('Levels imported successfully!');
        }
        window.location.hash = '';
      }
    } catch (e) {
      console.error('Invalid shared data');
    }
  }

  shareList() {
    if (this.levels.length === 0) {
      this.showToast('No levels to share!');
      return;
    }

    const encoded = btoa(JSON.stringify(this.levels));
    const shareUrl = `${window.location.origin}${window.location.pathname}#${encoded}`;
    
    navigator.clipboard.writeText(shareUrl).then(() => {
      this.showToast('Share link copied to clipboard!');
    }).catch(() => {
      this.showToast('Failed to copy link');
    });
  }

  showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  updateDifficultyOptions() {
    const category = document.getElementById('category').value;
    const difficultySelect = document.getElementById('difficulty');
    
    const options = category === 'demon' 
      ? [
          { value: 'extreme', label: 'Extreme Demon' },
          { value: 'insane', label: 'Insane Demon' },
          { value: 'hard', label: 'Hard Demon' },
          { value: 'medium', label: 'Medium Demon' },
          { value: 'easy', label: 'Easy Demon' }
        ]
      : [
          { value: 'insane', label: 'Insane (8*-9*)' },
          { value: 'harder', label: 'Harder (6*-7*)' },
          { value: 'hard', label: 'Hard (4*-5*)' },
          { value: 'normal', label: 'Normal (3*)' },
          { value: 'easy', label: 'Easy (2*)' },
          { value: 'auto', label: 'Auto (1*)' }
        ];
    
    const ratingField = document.getElementById('ratingField');
    // Show rating selection for both Rated and Demon categories, but not Unrated
    ratingField.style.display = (category === 'demon' || category === 'rated') ? 'block' : 'none';

    difficultySelect.innerHTML = options
      .map(opt => `<option value="${opt.value}">${opt.label}</option>`)
      .join('');
    
    this.updateStarRatingOptions();
  }

  updateStarRatingOptions() {
    const category = document.getElementById('category').value;
    const difficulty = document.getElementById('difficulty').value;
    const starRatingField = document.getElementById('starRatingField');
    const starRatingSelect = document.getElementById('starRating');
    
    if (category === 'demon' || category === 'unrated') {
      starRatingField.style.display = 'none';
      return;
    }

    const starRanges = {
      'insane': ['8', '9'],
      'harder': ['6', '7'],
      'hard': ['4', '5'],
      'normal': ['3'],
      'easy': ['2'],
      'auto': ['1']
    };

    const stars = starRanges[difficulty];
    if (stars && stars.length > 1) {
      starRatingField.style.display = 'block';
      starRatingSelect.innerHTML = '<option value="">Select stars</option>' + 
        stars.map(s => `<option value="${s}">${s}★</option>`).join('');
    } else {
      starRatingField.style.display = 'none';
    }
  }

  openModal(level = null) {
    if (level) {
      this.editingId = level.id;
      document.querySelector('.modal-header h2').textContent = 'Edit Level';
      document.getElementById('submitBtn').textContent = 'Save Changes';
      
      document.getElementById('levelName').value = level.name;
      document.getElementById('levelCreator').value = level.creator;
      document.getElementById('category').value = level.category;
      this.updateDifficultyOptions();
      document.getElementById('difficulty').value = level.difficulty;
      this.updateStarRatingOptions();
      document.getElementById('starRating').value = level.starRating || '';
      document.getElementById('rating').value = level.rating || 'none';
      document.getElementById('tags').value = level.tags ? level.tags.join(', ') : '';
    } else {
      this.editingId = null;
      document.querySelector('.modal-header h2').textContent = 'Add New Level';
      document.getElementById('submitBtn').textContent = 'Add Level';
    }
    
    document.getElementById('modal').classList.add('active');
  }

  addLevel() {
    const name = document.getElementById('levelName').value;
    const creator = document.getElementById('levelCreator').value;
    const category = document.getElementById('category').value;
    const difficulty = document.getElementById('difficulty').value;
    const rating = document.getElementById('rating').value;
    const starRating = document.getElementById('starRating').value;
    const tagsInput = document.getElementById('tags').value;
    const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : [];

    if (this.editingId) {
      // Update existing level
      const index = this.levels.findIndex(l => l.id === this.editingId);
      if (index !== -1) {
        this.levels[index] = {
          ...this.levels[index],
          name,
          creator,
          category,
          difficulty,
          rating,
          starRating,
          tags
        };
      }
    } else {
      // Add new level
      const level = {
        id: Date.now(),
        name,
        creator,
        category,
        difficulty,
        rating,
        starRating,
        tags
      };
      this.levels.push(level);
    }

    this.saveLevels();
    this.renderLevels();
    
    document.getElementById('modal').classList.remove('active');
    document.getElementById('levelForm').reset();
    this.editingId = null;
    this.updateDifficultyOptions();
  }

  deleteLevel(id) {
    this.levels = this.levels.filter(level => level.id !== id);
    this.saveLevels();
    this.renderLevels();
  }

  filterLevels(levels) {
    let filtered = levels;

    // Apply text search
    if (this.searchQuery) {
      filtered = filtered.filter(level => {
        const searchable = [
          level.name,
          level.creator,
          ...(level.tags || [])
        ].join(' ').toLowerCase();
        
        return searchable.includes(this.searchQuery);
      });
    }

    // Apply difficulty filter
    if (this.difficultyFilter !== 'all') {
      filtered = filtered.filter(level => {
        if (this.difficultyFilter === 'unrated') {
          return level.category === 'unrated';
        }
        
        // For demon difficulties
        const demonDiffs = ['extreme', 'insane-demon', 'hard-demon', 'medium-demon', 'easy-demon'];
        if (demonDiffs.includes(this.difficultyFilter)) {
          const diffMap = {
            'extreme': 'extreme',
            'insane-demon': 'insane',
            'hard-demon': 'hard',
            'medium-demon': 'medium',
            'easy-demon': 'easy'
          };
          return level.category === 'demon' && level.difficulty === diffMap[this.difficultyFilter];
        }
        
        // For rated difficulties
        return (level.category === 'rated' || level.category === 'unrated') && level.difficulty === this.difficultyFilter;
      });
    }

    return filtered;
  }

  sortLevels(levels) {
    const sorted = [...levels];
    
    switch(this.sortFilter) {
      case 'recent':
        return sorted.sort((a, b) => b.id - a.id);
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'creator':
        return sorted.sort((a, b) => a.creator.localeCompare(b.creator));
      default:
        return sorted;
    }
  }

  updateActiveFilters() {
    const container = document.getElementById('activeFilters');
    const chips = [];

    if (this.searchQuery) {
      chips.push(`Search: "${this.searchQuery}"`);
    }

    if (this.difficultyFilter !== 'all') {
      const diffNames = {
        'extreme': 'Extreme Demon',
        'insane-demon': 'Insane Demon',
        'hard-demon': 'Hard Demon',
        'medium-demon': 'Medium Demon',
        'easy-demon': 'Easy Demon',
        'insane': 'Insane',
        'harder': 'Harder',
        'hard': 'Hard',
        'normal': 'Normal',
        'easy': 'Easy',
        'auto': 'Auto',
        'unrated': 'Unrated'
      };
      chips.push(`Difficulty: ${diffNames[this.difficultyFilter]}`);
    }

    if (this.sortFilter !== 'recent') {
      const sortNames = {
        'name': 'Name (A-Z)',
        'creator': 'Creator (A-Z)'
      };
      chips.push(`Sort: ${sortNames[this.sortFilter]}`);
    }

    if (chips.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = chips.map(chip => `
      <div class="filter-chip">
        <svg class="chip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        ${chip}
      </div>
    `).join('');
  }

  renderLevels() {
    const categories = ['unrated', 'rated', 'demon'];
    
    categories.forEach(category => {
      const container = document.getElementById(`${category}Content`);
      if (!container) return;

      const categoryLevels = this.levels.filter(l => l.category === category);
      const filteredLevels = this.filterLevels(categoryLevels);
      const sortedLevels = this.sortLevels(filteredLevels);
      
      if (sortedLevels.length === 0) {
        container.innerHTML = '<div class="empty-state">No levels found</div>';
      } else {
        container.innerHTML = sortedLevels
          .map(level => this.createLevelElement(level))
          .join('');
        
        container.querySelectorAll('.edit-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            const level = this.levels.find(l => l.id === id);
            if (level) this.openModal(level);
          });
        });

        container.querySelectorAll('.delete-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            this.deleteLevel(id);
          });
        });
      }
    });
  }

  getDifficultyAsset(level) {
    if (level.category === 'unrated') return '/Unrated.webp';
    
    if (level.category === 'demon') {
      const demonMap = {
        extreme: '/ExtremeDemon.webp',
        insane: '/InsaneDemon (2).webp',
        hard: '/HardDemon (2).webp',
        medium: '/MediumDemon (1).webp',
        easy: '/EasyDemon.webp'
      };
      return demonMap[level.difficulty] || '/EasyDemon.webp';
    }

    const normalMap = {
      insane: '/Insane.webp',
      harder: '/Harder.webp',
      hard: '/Hard.webp',
      normal: '/Normal.webp',
      easy: '/Easy.webp',
      auto: '/Auto.webp'
    };
    return normalMap[level.difficulty] || '/Normal.webp';
  }

  getDifficultyLabel(level) {
    if (level.category === 'unrated') return 'Unrated';

    const labels = {
      demon: {
        extreme: 'Extreme Demon',
        insane: 'Insane Demon',
        hard: 'Hard Demon',
        medium: 'Medium Demon',
        easy: 'Easy Demon'
      },
      normal: {
        insane: 'Insane (8*-9*)',
        harder: 'Harder (6*-7*)',
        hard: 'Hard (4*-5*)',
        normal: 'Normal (3*)',
        easy: 'Easy (2*)',
        auto: 'Auto (1*)'
      }
    };
    
    const diffType = level.category === 'demon' ? 'demon' : 'normal';
    let label = labels[diffType][level.difficulty] || level.difficulty;
    
    // If a specific star rating is set, show it
    if (level.starRating && level.category === 'rated') {
      label = `${level.starRating}★`;
    }
    
    return label;
  }

  createLevelElement(level) {
    let ratingHTML = '';
    if (level.category !== 'unrated' && level.rating && level.rating !== 'none') {
      const ratingClass = level.rating;
      const ratingText = level.rating.charAt(0).toUpperCase() + level.rating.slice(1);
      ratingHTML = `<div class="level-rating ${ratingClass}">${ratingText}</div>`;
    }

    const tagsHTML = (level.tags && level.tags.length > 0)
      ? `<div class="level-tags">${level.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>`
      : '';
    
    const iconAsset = this.getDifficultyAsset(level);
    
    return `
      <div class="level-item">
        <div class="level-icon-wrapper">
          <img src="${iconAsset}" alt="${level.difficulty}" class="level-face-icon">
        </div>
        <div class="level-info">
          <div class="level-name">${level.name}</div>
          <div class="level-creator">by ${level.creator}</div>
          <div class="level-meta">
            <span class="level-difficulty">${this.getDifficultyLabel(level)}</span>
            ${ratingHTML}
          </div>
          ${tagsHTML}
        </div>
        <div class="level-actions">
          <button class="edit-btn" data-id="${level.id}" title="Edit level">✎</button>
          <button class="delete-btn" data-id="${level.id}" title="Delete level">×</button>
        </div>
      </div>
    `;
  }

  loadLevels() {
    const stored = localStorage.getItem('gdLevels');
    return stored ? JSON.parse(stored) : [];
  }

  saveLevels() {
    localStorage.setItem('gdLevels', JSON.stringify(this.levels));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new LevelManager();
});