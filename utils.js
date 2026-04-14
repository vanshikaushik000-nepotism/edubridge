/* ═══════════════════════════════════════════
   EduBridge — Utilities
   Date, animation, localStorage helpers
   ═══════════════════════════════════════════ */

const Utils = {
  /* ── Date Formatting ── */
  formatDate(dateStr, format = 'short') {
    const d = new Date(dateStr);
    const options = {
      short: { month: 'short', day: 'numeric' },
      medium: { month: 'short', day: 'numeric', year: 'numeric' },
      long: { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' },
      time: { hour: '2-digit', minute: '2-digit' },
    };
    return d.toLocaleDateString('en-IN', options[format] || options.short);
  },

  timeAgo(dateStr) {
    const now = new Date();
    const date = new Date(dateStr);
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return this.formatDate(dateStr);
  },

  daysUntil(dateStr) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  },

  /* ── Animated Counter ── */
  animateCounter(element, target, duration = 1200, suffix = '') {
    let start = 0;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);

      element.textContent = current + suffix;

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        element.textContent = target + suffix;
      }
    }

    requestAnimationFrame(update);
  },

  animateCounterFloat(element, target, duration = 1200, decimals = 1, suffix = '') {
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = (eased * target).toFixed(decimals);
      element.textContent = current + suffix;

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        element.textContent = target.toFixed(decimals) + suffix;
      }
    }

    requestAnimationFrame(update);
  },

  /* ── LocalStorage ── */
  store: {
    get(key, fallback = null) {
      try {
        const val = localStorage.getItem(`edubridge_${key}`);
        return val ? JSON.parse(val) : fallback;
      } catch { return fallback; }
    },
    set(key, value) {
      try {
        localStorage.setItem(`edubridge_${key}`, JSON.stringify(value));
      } catch {}
    },
    remove(key) {
      localStorage.removeItem(`edubridge_${key}`);
    }
  },

  /* ── Debounce ── */
  debounce(fn, delay = 300) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  /* ── Intersection Observer for scroll animations ── */
  observeElements(selector, className = 'animate-fadeInUp') {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add(className);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll(selector).forEach(el => observer.observe(el));
  },

  /* ── Color helpers ── */
  hexToRgba(hex, alpha = 1) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  },

  getGradeColor(percentage) {
    if (percentage >= 90) return '#10b981';
    if (percentage >= 75) return '#6366f1';
    if (percentage >= 60) return '#f59e0b';
    if (percentage >= 40) return '#ef4444';
    return '#dc2626';
  },

  getGradeLabel(percentage) {
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 75) return 'Good';
    if (percentage >= 60) return 'Average';
    if (percentage >= 40) return 'Below Average';
    return 'Needs Improvement';
  },

  /* ── Notification icons ── */
  getNotifIcon(type) {
    const icons = {
      grade: '📊',
      attendance: '📅',
      event: '📌',
      insight: '💡',
      system: '⚙️',
    };
    return icons[type] || '🔔';
  },

  /* ── Event type colors ── */
  getEventColor(type) {
    const colors = {
      exam: '#ef4444',
      assignment: '#f59e0b',
      ptm: '#6366f1',
      holiday: '#10b981',
      event: '#06b6d4',
    };
    return colors[type] || '#6366f1';
  },

  /* ── ID generator ── */
  uid() {
    return Math.random().toString(36).substr(2, 9);
  },

  /* ── Escape HTML ── */
  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};
