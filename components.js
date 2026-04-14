/* ═══════════════════════════════════════════
   EduBridge — Component Renderers
   Sidebar, topbar, cards, heatmap, calendar
   ═══════════════════════════════════════════ */

const Components = {
  /* ── Sidebar ── */
  renderSidebar(user, currentPage, unreadCount = 0) {
    const collapsed = Utils.store.get('sidebar_collapsed', false);
    const parentNav = [
      { id: 'dashboard', icon: '📊', label: 'Dashboard' },
      { id: 'grades', icon: '📝', label: 'Grades' },
      { id: 'attendance', icon: '📅', label: 'Attendance' },
      { id: 'insights', icon: '💡', label: 'AI Insights' },
      { id: 'calendar', icon: '🗓️', label: 'Calendar' },
      { id: 'studyplan', icon: '📚', label: 'Study Plan' },
      { id: 'messages', icon: '💬', label: 'Messages' },
      { id: 'settings', icon: '⚙️', label: 'Settings' },
    ];
    const teacherNav = [
      { id: 'dashboard', icon: '📊', label: 'Overview' },
      { id: 'gradeentry', icon: '📝', label: 'Grade Entry' },
      { id: 'markattendance', icon: '✅', label: 'Mark Attendance' },
      { id: 'students', icon: '👥', label: 'Students' },
      { id: 'calendar', icon: '🗓️', label: 'Calendar' },
      { id: 'messages', icon: '💬', label: 'Messages' },
    ];
    const adminNav = [
      { id: 'dashboard', icon: '📊', label: 'Analytics' },
      { id: 'users', icon: '👥', label: 'Users' },
      { id: 'calendar', icon: '🗓️', label: 'Calendar' },
      { id: 'broadcast', icon: '📢', label: 'Broadcast' },
      { id: 'settings', icon: '⚙️', label: 'Settings' },
    ];

    const navItems = user.role === 'admin' ? adminNav : user.role === 'teacher' ? teacherNav : parentNav;

    return `
      <aside class="sidebar ${collapsed ? 'collapsed' : ''}" id="sidebar">
        <div class="sidebar-header">
          <div class="sidebar-logo">🎓</div>
          <div class="sidebar-brand"><span>EduBridge</span></div>
        </div>
        <nav class="sidebar-nav">
          <div class="nav-section-title">Main Menu</div>
          ${navItems.map(item => `
            <div class="nav-item ${currentPage === item.id ? 'active' : ''}" data-page="${item.id}" onclick="App.navigate('${item.id}')">
              <span class="nav-icon">${item.icon}</span>
              <span class="nav-label">${item.label}</span>
              ${item.id === 'messages' && unreadCount > 0 ? `<span class="nav-badge">${unreadCount}</span>` : ''}
            </div>
          `).join('')}
        </nav>
        <div class="sidebar-footer">
          <div class="sidebar-user" onclick="App.navigate('settings')">
            <div class="avatar">${user.avatar || '👤'}</div>
            <div class="sidebar-footer-info">
              <div class="sidebar-user-name">${Utils.escapeHtml(user.name)}</div>
              <div class="sidebar-user-role">${user.role}</div>
            </div>
          </div>
        </div>
      </aside>
    `;
  },

  /* ── Topbar ── */
  renderTopbar(title, unreadCount = 0) {
    return `
      <header class="topbar">
        <div class="topbar-left">
          <button class="topbar-toggle" onclick="App.toggleSidebar()" aria-label="Toggle sidebar">☰</button>
          <h1 class="topbar-title">${title}</h1>
        </div>
        <div class="topbar-right">
          <div class="topbar-search">
            <span class="topbar-search-icon">🔍</span>
            <input class="input" type="text" placeholder="Search students, subjects..." id="topbar-search-input">
          </div>
          <button class="btn-icon theme-toggle" onclick="App.toggleTheme()" data-tooltip="Toggle theme" aria-label="Toggle theme">
            🌙
          </button>
          <div class="topbar-notif-btn">
            <button class="btn-icon" onclick="App.toggleNotifications()" aria-label="Notifications">
              🔔
              ${unreadCount > 0 ? '<span class="notif-dot"></span>' : ''}
            </button>
          </div>
          <div class="avatar" style="cursor: pointer" onclick="App.navigate('settings')">${API.user?.avatar || '👤'}</div>
        </div>
      </header>
    `;
  },

  /* ── Stat Card ── */
  renderStatCard(icon, value, label, trend, trendDirection, colorClass, suffix = '') {
    return `
      <div class="stat-card ${colorClass}">
        <div class="stat-icon ${colorClass}">${icon}</div>
        <div class="stat-value" data-count="${value}" data-suffix="${suffix}">${value}${suffix}</div>
        <div class="stat-label">${label}</div>
        ${trend ? `
          <div class="stat-trend ${trendDirection}">
            ${trendDirection === 'up' ? '↑' : '↓'} ${trend}
          </div>
        ` : ''}
      </div>
    `;
  },

  /* ── Grade Card with Sparkline ── */
  renderGradeCard(subject) {
    const latest = subject.latest;
    const pct = ((latest.marks / latest.max_marks) * 100).toFixed(0);
    const color = subject.subject_color || '#6366f1';
    const history = subject.history.map(h => h.marks).reverse();
    const prevPct = history.length > 1 ? ((history[history.length - 2] / latest.max_marks) * 100).toFixed(0) : pct;
    const diff = (pct - prevPct).toFixed(1);
    const trendDir = diff > 0 ? 'up' : diff < 0 ? 'down' : '';

    return `
      <div class="grade-card">
        <div class="grade-card-color" style="background: ${color}"></div>
        <div class="grade-card-header">
          <div>
            <div class="grade-card-subject">${subject.subject_name}</div>
            <div class="grade-card-code">${subject.subject_code}</div>
          </div>
          <span class="badge" style="background: ${Utils.hexToRgba(color, 0.15)}; color: ${color}">
            ${latest.exam_name || latest.exam_type}
          </span>
        </div>
        <div class="grade-card-score">
          ${latest.marks}<span class="grade-card-max">/${latest.max_marks}</span>
        </div>
        <div class="grade-card-footer">
          <div>
            ${trendDir ? `
              <span class="stat-trend ${trendDir}" style="font-size: 12px">
                ${trendDir === 'up' ? '↑' : '↓'} ${Math.abs(diff)}%
              </span>
            ` : '<span class="text-xs text-muted">—</span>'}
          </div>
          <canvas class="grade-card-sparkline" data-sparkline="${history.join(',')}" data-color="${color}"></canvas>
        </div>
      </div>
    `;
  },

  /* ── Attendance Heatmap ── */
  renderHeatmap(records) {
    // Build 90-day grid
    const today = new Date();
    const days = [];
    for (let i = 89; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay();
      const record = records.find(r => r.date === dateStr);
      days.push({
        date: dateStr,
        dayOfWeek,
        status: dayOfWeek === 0 ? 'weekend' : (record ? record.status : 'empty'),
        month: d.toLocaleString('en', { month: 'short' }),
      });
    }

    // Group into weeks
    const weeks = [];
    let currentWeek = [];
    days.forEach(day => {
      if (day.dayOfWeek === 1 && currentWeek.length > 0) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(day);
    });
    if (currentWeek.length) weeks.push(currentWeek);

    // Month labels
    const monthLabels = [];
    let lastMonth = '';
    weeks.forEach((week, i) => {
      const m = week[0]?.month;
      if (m && m !== lastMonth) {
        monthLabels.push({ index: i, label: m });
        lastMonth = m;
      }
    });

    const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

    return `
      <div class="heatmap-container">
        <div class="heatmap-grid">
          <div class="heatmap-day-labels">
            ${dayLabels.map(l => `<div class="heatmap-day-label">${l}</div>`).join('')}
          </div>
          <div>
            <div class="heatmap-months" style="display: flex; gap: 3px; margin-bottom: 4px;">
              ${weeks.map((_, i) => {
                const ml = monthLabels.find(m => m.index === i);
                return `<div style="width: 14px; font-size: 10px; color: var(--text-muted)">${ml ? ml.label : ''}</div>`;
              }).join('')}
            </div>
            <div class="heatmap-weeks">
              ${weeks.map(week => `
                <div class="heatmap-week">
                  ${[1,2,3,4,5,6,0].map(dow => {
                    const cell = week.find(d => d.dayOfWeek === dow);
                    if (!cell) return '<div class="heatmap-cell empty"></div>';
                    return `<div class="heatmap-cell ${cell.status}" data-tooltip="${cell.date}: ${cell.status}" title="${cell.date}: ${cell.status}"></div>`;
                  }).join('')}
                </div>
              `).join('')}
            </div>
          </div>
        </div>
        <div class="heatmap-legend">
          <div class="heatmap-legend-item"><div class="heatmap-legend-dot" style="background: var(--accent-emerald)"></div>Present</div>
          <div class="heatmap-legend-item"><div class="heatmap-legend-dot" style="background: var(--accent-amber)"></div>Late</div>
          <div class="heatmap-legend-item"><div class="heatmap-legend-dot" style="background: var(--accent-coral)"></div>Absent</div>
        </div>
      </div>
    `;
  },

  /* ── Insight Card ── */
  renderInsightCard(insight) {
    return `
      <div class="insight-card ${insight.severity}">
        <div class="insight-icon">${insight.icon || '💡'}</div>
        <div class="insight-content">
          <div class="insight-title">${insight.title}</div>
          <div class="insight-message">${insight.message}</div>
          <div class="insight-meta">
            <span class="insight-subject-badge">${insight.subject}</span>
            <div class="confidence-bar" title="Confidence: ${Math.round((insight.confidence || 0) * 100)}%">
              <div class="confidence-fill" style="width: ${(insight.confidence || 0.5) * 100}%"></div>
            </div>
            <span class="text-xs text-muted">${Math.round((insight.confidence || 0) * 100)}%</span>
          </div>
        </div>
      </div>
    `;
  },

  /* ── Mini Calendar ── */
  renderCalendar(events, month, year) {
    const date = new Date(year, month, 1);
    const firstDay = date.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const monthName = date.toLocaleString('en', { month: 'long', year: 'numeric' });

    const eventDates = new Set(events.map(e => e.date));

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let cells = [];

    // Empty cells
    for (let i = 0; i < firstDay; i++) {
      cells.push('<div class="calendar-day other-month"></div>');
    }

    // Day cells
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isToday = dateStr === todayStr;
      const hasEvent = eventDates.has(dateStr);
      cells.push(`<div class="calendar-day ${isToday ? 'today' : ''} ${hasEvent ? 'has-event' : ''}">${d}</div>`);
    }

    // Upcoming events list
    const upcoming = events
      .filter(e => e.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5);

    return `
      <div class="calendar-widget">
        <div class="calendar-header-row">
          <span class="calendar-month">${monthName}</span>
          <div class="calendar-nav">
            <button class="btn-icon btn-sm" onclick="App.changeCalendarMonth(-1)">◀</button>
            <button class="btn-icon btn-sm" onclick="App.changeCalendarMonth(1)">▶</button>
          </div>
        </div>
        <div class="calendar-grid-header">
          ${dayNames.map(n => `<div class="calendar-day-name">${n}</div>`).join('')}
        </div>
        <div class="calendar-grid-body">
          ${cells.join('')}
        </div>
        ${upcoming.length > 0 ? `
          <div class="calendar-events">
            <div class="text-xs text-muted" style="margin-bottom: 4px; font-weight: 500;">UPCOMING</div>
            ${upcoming.map(e => `
              <div class="calendar-event">
                <div class="calendar-event-dot ${e.event_type}"></div>
                <div class="calendar-event-info">
                  <div class="calendar-event-name">${Utils.escapeHtml(e.title)}</div>
                  <div class="calendar-event-date">${Utils.formatDate(e.date)} · ${Utils.daysUntil(e.date)}d away</div>
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  },

  /* ── Notification Panel ── */
  renderNotificationPanel(notifications, isOpen) {
    return `
      <div class="notif-panel ${isOpen ? 'open' : ''}" id="notif-panel">
        <div class="notif-panel-header">
          <h3 style="font-size: var(--text-md); font-weight: var(--weight-semibold);">Notifications</h3>
          <div class="flex items-center gap-2">
            <button class="btn btn-ghost btn-sm" onclick="App.markAllRead()">Mark all read</button>
            <button class="btn-icon btn-sm" onclick="App.toggleNotifications()">✕</button>
          </div>
        </div>
        <div class="notif-panel-body">
          ${notifications.length === 0 ? `
            <div class="empty-state">
              <div class="empty-state-icon">🔔</div>
              <div class="empty-state-text">No notifications yet</div>
            </div>
          ` : notifications.map(n => `
            <div class="notif-item ${n.is_read ? '' : 'unread'}" onclick="App.readNotification(${n.id})">
              <div class="notif-icon ${n.type}">${Utils.getNotifIcon(n.type)}</div>
              <div class="notif-content">
                <div class="notif-title">${Utils.escapeHtml(n.title)}</div>
                <div class="notif-message">${Utils.escapeHtml(n.message)}</div>
                <div class="notif-time">${Utils.timeAgo(n.created_at)}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  /* ── Loading Skeleton ── */
  renderSkeleton(type = 'dashboard') {
    if (type === 'dashboard') {
      return `
        <div class="stats-grid">
          ${[1,2,3,4].map(() => '<div class="stat-card"><div class="skeleton" style="height: 80px"></div></div>').join('')}
        </div>
        <div class="grades-grid">
          ${[1,2,3].map(() => '<div class="card"><div class="skeleton" style="height: 120px"></div></div>').join('')}
        </div>
      `;
    }
    return '<div class="skeleton" style="height: 200px; margin-bottom: 16px"></div>'.repeat(3);
  },

  /* ── Student Selector ── */
  renderStudentSelector(students, selectedId) {
    return `
      <div class="student-selector">
        ${students.map(s => `
          <div class="student-chip ${s.id == selectedId ? 'active' : ''}" onclick="App.selectStudent(${s.id})">
            <span>${s.avatar || '👤'}</span>
            <span>${Utils.escapeHtml(s.name)}</span>
            <span class="badge-indigo badge" style="font-size: 10px">Class ${s.class}-${s.section}</span>
          </div>
        `).join('')}
      </div>
    `;
  },
};
