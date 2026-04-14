/* ═══════════════════════════════════════════
   EduBridge — Main Application
   SPA routing, state management, page renders
   ═══════════════════════════════════════════ */

const App = {
  state: {
    currentPage: 'dashboard',
    students: [],
    selectedStudentId: null,
    dashboardData: null,
    notifications: [],
    notifOpen: false,
    calendarMonth: new Date().getMonth(),
    calendarYear: new Date().getFullYear(),
    loading: true,
  },

  /* ── Initialize ── */
  async init() {
    // Check for existing session
    const hasSession = API.restoreSession();
    if (hasSession) {
      const user = await API.validateToken();
      if (user) {
        this.showApp();
        return;
      }
    }
    this.showLogin();
  },

  /* ── Login Screen ── */
  showLogin() {
    document.getElementById('app').innerHTML = `
      <div class="login-page">
        <div class="login-bg"></div>
        <div class="login-card">
          <div class="login-logo">
            <div class="login-logo-icon">🎓</div>
            <div class="login-logo-text"><span>EduBridge</span></div>
          </div>

          <div class="login-error" id="login-error"></div>

          <form class="login-form" onsubmit="App.handleLogin(event)">
            <div class="input-group">
              <label class="input-label" for="login-email">Email</label>
              <input class="input" type="email" id="login-email" placeholder="Enter your email" required autocomplete="email" value="parent@edubridge.com">
            </div>
            <div class="input-group">
              <label class="input-label" for="login-password">Password</label>
              <input class="input" type="password" id="login-password" placeholder="Enter your password" required autocomplete="current-password" value="password123">
            </div>
            <button class="btn btn-primary btn-lg w-full" type="submit" id="login-btn">
              Sign In
            </button>
          </form>

          <div class="login-divider">Quick Demo Login</div>

          <div class="demo-accounts">
            <div class="demo-account" onclick="App.demoLogin('parent')">
              <div class="demo-account-icon">👨</div>
              <div class="demo-account-role">Parent</div>
            </div>
            <div class="demo-account" onclick="App.demoLogin('teacher')">
              <div class="demo-account-icon">👩‍🏫</div>
              <div class="demo-account-role">Teacher</div>
            </div>
            <div class="demo-account" onclick="App.demoLogin('admin')">
              <div class="demo-account-icon">🛡️</div>
              <div class="demo-account-role">Admin</div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  async handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const btn = document.getElementById('login-btn');
    const error = document.getElementById('login-error');

    btn.textContent = 'Signing in...';
    btn.disabled = true;
    error.classList.remove('show');

    try {
      await API.login(email, password);
      this.showApp();
    } catch (err) {
      error.textContent = err.message || 'Login failed. Check your credentials.';
      error.classList.add('show');
      btn.textContent = 'Sign In';
      btn.disabled = false;
    }
  },

  async demoLogin(role) {
    const emails = {
      parent: 'parent@edubridge.com',
      teacher: 'teacher@edubridge.com',
      admin: 'admin@edubridge.com',
    };
    document.getElementById('login-email').value = emails[role];
    document.getElementById('login-password').value = 'password123';

    try {
      await API.login(emails[role], 'password123');
      this.showApp();
    } catch (err) {
      const error = document.getElementById('login-error');
      error.textContent = err.message;
      error.classList.add('show');
    }
  },

  /* ── Main App Shell ── */
  async showApp() {
    this.state.loading = true;
    const role = API.user.role;

    // Load initial data
    try {
      if (role === 'parent') {
        const { students } = await API.getStudents();
        this.state.students = students;
        this.state.selectedStudentId = students[0]?.id;
      }
      const { notifications, unread_count } = await API.getNotifications();
      this.state.notifications = notifications;
      this.state.unreadCount = unread_count;
    } catch (err) {
      console.error('Init error:', err);
    }

    this.state.loading = false;
    this.render();
  },

  /* ── Render ── */
  render() {
    const user = API.user;
    const page = this.state.currentPage;
    const pageTitles = {
      dashboard: user.role === 'parent' ? 'Dashboard' : user.role === 'teacher' ? 'Class Overview' : 'School Analytics',
      grades: 'Grades',
      attendance: 'Attendance',
      insights: 'AI Insights',
      calendar: 'Academic Calendar',
      studyplan: 'Study Plan',
      messages: 'Messages',
      settings: 'Settings',
      gradeentry: 'Grade Entry',
      markattendance: 'Mark Attendance',
      students: 'Students',
      users: 'User Management',
      broadcast: 'Broadcast',
    };

    document.getElementById('app').innerHTML = `
      ${Components.renderSidebar(user, page, this.state.unreadCount || 0)}
      <main class="main">
        ${Components.renderTopbar(pageTitles[page] || 'Dashboard', this.state.unreadCount || 0)}
        <div class="page-content" id="page-content">
          ${this.state.loading ? Components.renderSkeleton() : ''}
        </div>
      </main>
      ${Components.renderNotificationPanel(this.state.notifications, this.state.notifOpen)}
    `;

    // Apply theme
    const theme = Utils.store.get('theme', 'dark');
    document.documentElement.setAttribute('data-theme', theme);

    if (!this.state.loading) {
      this.renderPage();
    }
  },

  /* ── Page Router ── */
  async renderPage() {
    const content = document.getElementById('page-content');
    const role = API.user.role;

    switch (this.state.currentPage) {
      case 'dashboard':
        if (role === 'parent') await this.renderParentDashboard(content);
        else if (role === 'teacher') await this.renderTeacherDashboard(content);
        else await this.renderAdminDashboard(content);
        break;
      case 'grades':
        await this.renderGradesPage(content);
        break;
      case 'attendance':
        await this.renderAttendancePage(content);
        break;
      case 'insights':
        await this.renderInsightsPage(content);
        break;
      case 'calendar':
        await this.renderCalendarPage(content);
        break;
      case 'studyplan':
        await this.renderStudyPlanPage(content);
        break;
      case 'messages':
        await this.renderMessagesPage(content);
        break;
      case 'settings':
        this.renderSettingsPage(content);
        break;
      case 'gradeentry':
        await this.renderGradeEntryPage(content);
        break;
      case 'markattendance':
        await this.renderMarkAttendancePage(content);
        break;
      case 'students':
        await this.renderStudentsPage(content);
        break;
      case 'users':
        await this.renderUsersPage(content);
        break;
      case 'broadcast':
        this.renderBroadcastPage(content);
        break;
      default:
        content.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🚧</div><div class="empty-state-text">Page coming soon</div></div>';
    }

    // Initialize sparklines after render
    this.initSparklines();
  },

  /* ────────────────────────────────────────
     PARENT DASHBOARD
     ──────────────────────────────────────── */
  async renderParentDashboard(container) {
    const studentId = this.state.selectedStudentId;
    if (!studentId) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">👶</div><div class="empty-state-text">No students linked to your account</div></div>';
      return;
    }

    try {
      const data = await API.getStudentDashboard(studentId);
      this.state.dashboardData = data;

      const { student, subjects, summary, events } = data;
      const attendance = await API.getAttendance(studentId);
      const insights = await API.getInsights(studentId);

      container.innerHTML = `
        ${Components.renderStudentSelector(this.state.students, studentId)}

        <div class="stats-grid stagger">
          ${Components.renderStatCard('📊', summary.overall_percentage, 'Overall Score', '+2.3% this month', 'up', 'indigo', '%')}
          ${Components.renderStatCard('📅', summary.attendance_percentage, 'Attendance', summary.attendance_percentage >= 90 ? 'On track' : 'Needs improvement', summary.attendance_percentage >= 90 ? 'up' : 'down', 'emerald', '%')}
          ${Components.renderStatCard('📝', summary.upcoming_tasks, 'Upcoming Tasks', '', '', 'amber', '')}
          ${Components.renderStatCard('🏆', summary.rank, 'Class Rank', 'of ' + summary.total_students + ' students', 'up', 'coral', '')}
        </div>

        <div class="dashboard-grid">
          <div class="flex flex-col gap-4">
            <!-- Grade cards -->
            <div>
              <h3 style="margin-bottom: var(--space-4); font-size: var(--text-lg)">📝 Subject Performance</h3>
              <div class="grades-grid stagger">
                ${subjects.map(s => Components.renderGradeCard(s)).join('')}
              </div>
            </div>

            <!-- Performance Chart -->
            <div class="card">
              <div class="card-header">
                <div class="card-title">📈 Performance Trends</div>
                <div class="tab-bar">
                  <button class="tab-item active" onclick="App.switchChartView('line')">Line</button>
                  <button class="tab-item" onclick="App.switchChartView('bar')">Bar</button>
                </div>
              </div>
              <canvas id="trend-chart" style="width: 100%; height: 280px;"></canvas>
            </div>

            <!-- Attendance Heatmap -->
            <div class="card">
              <div class="card-header">
                <div class="card-title">📅 Attendance Overview</div>
                <div class="flex items-center gap-3">
                  <span class="badge badge-emerald">${summary.attendance.present} Present</span>
                  <span class="badge badge-amber">${summary.attendance.late} Late</span>
                  <span class="badge badge-coral">${summary.attendance.absent} Absent</span>
                </div>
              </div>
              ${Components.renderHeatmap(attendance.records)}
            </div>

            <!-- AI Insights -->
            <div class="card">
              <div class="card-header">
                <div class="card-title">💡 AI Insights</div>
                <span class="badge badge-violet">Powered by AI</span>
              </div>
              <div class="insights-grid stagger">
                ${(insights.insights || []).map(i => Components.renderInsightCard(i)).join('')}
              </div>
              ${insights.study_tips ? `
                <div style="margin-top: var(--space-4); padding: var(--space-4); background: var(--bg-glass); border-radius: var(--radius-md);">
                  <div class="text-sm" style="font-weight: var(--weight-semibold); margin-bottom: var(--space-2);">📚 Quick Study Tips</div>
                  <ul style="list-style: none; padding: 0;">
                    ${insights.study_tips.map(tip => `
                      <li style="display: flex; align-items: flex-start; gap: 8px; margin-bottom: 8px; font-size: var(--text-xs); color: var(--text-secondary);">
                        <span style="color: var(--accent-emerald);">✦</span>${Utils.escapeHtml(tip)}
                      </li>
                    `).join('')}
                  </ul>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Right Sidebar -->
          <div class="flex flex-col gap-4">
            <!-- Attendance Donut -->
            <div class="card">
              <div class="card-header">
                <div class="card-title">📊 Attendance</div>
              </div>
              <div style="display: flex; justify-content: center; padding: var(--space-4);">
                <canvas id="attendance-donut" style="width: 160px; height: 160px;"></canvas>
              </div>
            </div>

            <!-- Calendar -->
            <div class="card">
              <div class="card-header">
                <div class="card-title">🗓️ Calendar</div>
              </div>
              ${Components.renderCalendar(events, this.state.calendarMonth, this.state.calendarYear)}
            </div>
          </div>
        </div>
      `;

      // Render charts
      setTimeout(() => {
        this.renderTrendChart(subjects);
        this.renderAttendanceDonut(summary.attendance);
        this.animateStatCounters();
      }, 100);

    } catch (err) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-text">Error loading dashboard: ${err.message}</div></div>`;
    }
  },

  /* ── TEACHER DASHBOARD ── */
  async renderTeacherDashboard(container) {
    try {
      const { students } = await API.getStudents();
      container.innerHTML = `
        <div class="stats-grid stagger">
          ${Components.renderStatCard('👥', students.length, 'Total Students', '', '', 'indigo', '')}
          ${Components.renderStatCard('📝', '6', 'Subjects', '', '', 'emerald', '')}
          ${Components.renderStatCard('📅', 'Today', 'Attendance', 'Mark now', '', 'amber', '')}
          ${Components.renderStatCard('📊', '0', 'Pending Reviews', '', '', 'coral', '')}
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title">👥 Students</div>
            <button class="btn btn-primary btn-sm" onclick="App.navigate('gradeentry')">+ Add Grade</button>
          </div>
          <div class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Roll No.</th>
                  <th>Class</th>
                  <th>Section</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${students.map(s => `
                  <tr>
                    <td><div class="flex items-center gap-2"><span class="avatar avatar-sm">${s.avatar || '👤'}</span>${Utils.escapeHtml(s.name)}</div></td>
                    <td><code style="font-size: var(--text-xs); color: var(--text-secondary)">${s.roll_number}</code></td>
                    <td>${s.class}</td>
                    <td>${s.section}</td>
                    <td>
                      <button class="btn btn-ghost btn-sm" onclick="App.viewStudentAsTeacher(${s.id})">View</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
      this.animateStatCounters();
    } catch (err) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-text">${err.message}</div></div>`;
    }
  },

  /* ── ADMIN DASHBOARD ── */
  async renderAdminDashboard(container) {
    try {
      const { students } = await API.getStudents();
      container.innerHTML = `
        <div class="stats-grid stagger">
          ${Components.renderStatCard('👥', students.length, 'Total Students', '', '', 'indigo', '')}
          ${Components.renderStatCard('👩‍🏫', '3', 'Teachers', '', '', 'emerald', '')}
          ${Components.renderStatCard('📊', '8', 'Subjects', '', '', 'amber', '')}
          ${Components.renderStatCard('📅', '8', 'Events', '', '', 'coral', '')}
        </div>

        <div class="grid grid-2 gap-4">
          <div class="card">
            <div class="card-header"><div class="card-title">👥 Recent Students</div></div>
            <div class="table-container">
              <table class="table">
                <thead><tr><th>Name</th><th>Class</th><th>Roll No.</th></tr></thead>
                <tbody>
                  ${students.map(s => `
                    <tr>
                      <td><div class="flex items-center gap-2"><span class="avatar avatar-sm">${s.avatar}</span>${s.name}</div></td>
                      <td>${s.class}-${s.section}</td>
                      <td><code style="font-size: 11px">${s.roll_number}</code></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
          <div class="card">
            <div class="card-header"><div class="card-title">📢 Quick Actions</div></div>
            <div class="flex flex-col gap-3" style="padding: var(--space-4);">
              <button class="btn btn-secondary w-full" onclick="App.navigate('broadcast')">📢 Send Broadcast</button>
              <button class="btn btn-secondary w-full" onclick="App.navigate('calendar')">🗓️ Manage Calendar</button>
              <button class="btn btn-secondary w-full" onclick="App.navigate('users')">👥 Manage Users</button>
              <button class="btn btn-secondary w-full" onclick="App.navigate('settings')">⚙️ Settings</button>
            </div>
          </div>
        </div>
      `;
      this.animateStatCounters();
    } catch (err) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-text">${err.message}</div></div>`;
    }
  },

  /* ── GRADES PAGE ── */
  async renderGradesPage(container) {
    const studentId = this.state.selectedStudentId;
    if (!studentId) return;
    try {
      const { grades } = await API.getGrades(studentId);
      container.innerHTML = `
        ${Components.renderStudentSelector(this.state.students, studentId)}
        <div class="card">
          <div class="card-header">
            <div class="card-title">📝 All Grades</div>
          </div>
          <div class="table-container">
            <table class="table">
              <thead><tr><th>Subject</th><th>Exam</th><th>Score</th><th>Percentage</th><th>Date</th></tr></thead>
              <tbody>
                ${grades.map(g => {
                  const pct = ((g.marks / g.max_marks) * 100).toFixed(0);
                  return `
                    <tr>
                      <td><div class="flex items-center gap-2"><span style="width:8px;height:8px;border-radius:50%;background:${g.subject_color}"></span>${g.subject_name}</div></td>
                      <td>${g.exam_name || g.exam_type}</td>
                      <td><strong>${g.marks}</strong>/${g.max_marks}</td>
                      <td>
                        <div class="flex items-center gap-2">
                          <div class="progress" style="width:80px"><div class="progress-fill ${pct >= 75 ? 'emerald' : pct >= 50 ? 'amber' : 'coral'}" style="width:${pct}%"></div></div>
                          <span class="text-sm">${pct}%</span>
                        </div>
                      </td>
                      <td class="text-muted">${Utils.formatDate(g.date)}</td>
                    </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-text">${err.message}</div></div>`;
    }
  },

  /* ── ATTENDANCE PAGE ── */
  async renderAttendancePage(container) {
    const studentId = this.state.selectedStudentId;
    if (!studentId) return;
    try {
      const data = await API.getAttendance(studentId);
      container.innerHTML = `
        ${Components.renderStudentSelector(this.state.students, studentId)}
        <div class="stats-grid stagger" style="grid-template-columns: repeat(4, 1fr);">
          ${Components.renderStatCard('✅', data.summary.present, 'Present', '', '', 'emerald', '')}
          ${Components.renderStatCard('⏰', data.summary.late, 'Late', '', '', 'amber', '')}
          ${Components.renderStatCard('❌', data.summary.absent, 'Absent', '', '', 'coral', '')}
          ${Components.renderStatCard('📊', data.summary.percentage, 'Attendance %', '', data.summary.percentage >= 90 ? 'up' : 'down', 'indigo', '%')}
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">📅 Attendance Heatmap</div></div>
          ${Components.renderHeatmap(data.records)}
        </div>
        <div class="card" style="margin-top: var(--space-4);">
          <div class="card-header"><div class="card-title">📋 Recent Records</div></div>
          <div class="table-container">
            <table class="table">
              <thead><tr><th>Date</th><th>Day</th><th>Status</th></tr></thead>
              <tbody>
                ${data.records.slice(0, 20).map(r => `
                  <tr>
                    <td>${Utils.formatDate(r.date, 'medium')}</td>
                    <td class="text-muted">${new Date(r.date).toLocaleDateString('en', { weekday: 'long' })}</td>
                    <td><span class="badge badge-${r.status === 'present' ? 'emerald' : r.status === 'late' ? 'amber' : 'coral'}">${r.status}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
      this.animateStatCounters();
    } catch (err) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-text">${err.message}</div></div>`;
    }
  },

  /* ── INSIGHTS PAGE ── */
  async renderInsightsPage(container) {
    const studentId = this.state.selectedStudentId;
    if (!studentId) return;
    try {
      const insights = await API.getInsights(studentId);
      container.innerHTML = `
        ${Components.renderStudentSelector(this.state.students, studentId)}
        <div class="card" style="margin-bottom: var(--space-4);">
          <div class="card-header">
            <div class="card-title">💡 AI-Generated Insights</div>
            <span class="badge badge-violet">🤖 AI Powered</span>
          </div>
          <div class="insights-grid stagger">
            ${(insights.insights || []).map(i => Components.renderInsightCard(i)).join('')}
          </div>
        </div>
        ${insights.study_tips ? `
          <div class="card">
            <div class="card-header"><div class="card-title">📚 Study Recommendations</div></div>
            <div style="padding: var(--space-2);">
              ${insights.study_tips.map((tip, i) => `
                <div class="study-subject" style="animation-delay: ${i * 80}ms">
                  <span style="font-size: 20px; width: 36px; text-align: center;">✦</span>
                  <div class="study-subject-bar">
                    <div class="study-subject-name">${Utils.escapeHtml(tip)}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      `;
    } catch (err) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-text">${err.message}</div></div>`;
    }
  },

  /* ── CALENDAR PAGE ── */
  async renderCalendarPage(container) {
    try {
      const classId = this.state.students[0]?.class || '10';
      const { events } = await API.getCalendarEvents(classId);
      container.innerHTML = `
        <div class="grid grid-2 gap-4">
          <div class="card">
            ${Components.renderCalendar(events, this.state.calendarMonth, this.state.calendarYear)}
          </div>
          <div class="card">
            <div class="card-header"><div class="card-title">📋 All Events</div></div>
            <div class="table-container">
              <table class="table">
                <thead><tr><th>Event</th><th>Type</th><th>Date</th><th>Days</th></tr></thead>
                <tbody>
                  ${events.map(e => `
                    <tr>
                      <td>${Utils.escapeHtml(e.title)}</td>
                      <td><span class="badge badge-${e.event_type === 'exam' ? 'coral' : e.event_type === 'holiday' ? 'emerald' : e.event_type === 'ptm' ? 'indigo' : 'amber'}">${e.event_type}</span></td>
                      <td>${Utils.formatDate(e.date)}</td>
                      <td>${Utils.daysUntil(e.date) >= 0 ? Utils.daysUntil(e.date) + 'd away' : 'Past'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-text">${err.message}</div></div>`;
    }
  },

  /* ── STUDY PLAN PAGE ── */
  async renderStudyPlanPage(container) {
    const studentId = this.state.selectedStudentId;
    if (!studentId) return;
    try {
      const { grades } = await API.getGrades(studentId);
      const plan = await API.getStudyPlan(studentId, grades, 2);
      const sp = plan.study_plan || plan;

      container.innerHTML = `
        ${Components.renderStudentSelector(this.state.students, studentId)}
        <div class="card" style="margin-bottom: var(--space-4);">
          <div class="card-header">
            <div class="card-title">📚 Personalized Study Plan</div>
            <span class="badge badge-violet">AI Generated</span>
          </div>
          <p class="text-sm text-muted" style="margin-bottom: var(--space-4);">Daily study time: <strong>${sp.daily_hours || 2} hours</strong></p>
          ${(sp.subjects || []).map(s => `
            <div class="study-subject">
              <div style="font-size: 20px; width: 36px; text-align: center;">📖</div>
              <div class="study-subject-bar" style="flex: 1;">
                <div class="flex items-center justify-between">
                  <div class="study-subject-name">${s.subject}</div>
                  <span class="badge badge-${s.priority === 'high' ? 'coral' : s.priority === 'medium' ? 'amber' : 'emerald'}">${s.priority}</span>
                </div>
                <div class="study-subject-time">${s.minutes_per_day} min/day · Avg: ${s.average}% · Trend: ${s.trend || 'stable'}</div>
                <div class="progress" style="margin-top: 6px"><div class="progress-fill indigo" style="width: ${Math.min(s.minutes_per_day / 1.2, 100)}%"></div></div>
                ${s.focus_areas ? `<div class="text-xs text-muted" style="margin-top: 4px;">Focus: ${s.focus_areas.join(', ')}</div>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
        ${(sp.tips || []).length > 0 ? `
          <div class="card">
            <div class="card-header"><div class="card-title">💡 Tips</div></div>
            <ul style="list-style: none; padding: var(--space-3);">
              ${sp.tips.map(t => `<li style="padding: 8px 0; border-bottom: 1px solid var(--border-secondary); font-size: var(--text-sm); color: var(--text-secondary); display: flex; gap: 8px;"><span>💡</span>${Utils.escapeHtml(t)}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      `;
    } catch (err) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-text">${err.message}</div></div>`;
    }
  },

  /* ── MESSAGES PAGE ── */
  async renderMessagesPage(container) {
    try {
      const { messages } = await API.getMessages();
      container.innerHTML = `
        <div class="card">
          <div class="card-header">
            <div class="card-title">💬 Messages</div>
            <button class="btn btn-primary btn-sm" onclick="App.showComposeModal()">+ New Message</button>
          </div>
          ${messages.length === 0 ? `
            <div class="empty-state"><div class="empty-state-icon">💬</div><div class="empty-state-text">No messages yet</div></div>
          ` : `
            <div class="table-container">
              <table class="table">
                <thead><tr><th>From</th><th>Subject</th><th>Message</th><th>Date</th></tr></thead>
                <tbody>${messages.map(m => `
                  <tr class="${m.is_read ? '' : 'unread'}">
                    <td><div class="flex items-center gap-2"><span class="avatar avatar-sm">${m.sender_avatar}</span>${m.sender_name}</div></td>
                    <td>${Utils.escapeHtml(m.subject || 'No subject')}</td>
                    <td class="truncate" style="max-width: 300px">${Utils.escapeHtml(m.body)}</td>
                    <td class="text-muted">${Utils.timeAgo(m.created_at)}</td>
                  </tr>
                `).join('')}</tbody>
              </table>
            </div>
          `}
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-text">${err.message}</div></div>`;
    }
  },

  /* ── SETTINGS PAGE ── */
  renderSettingsPage(container) {
    const user = API.user;
    container.innerHTML = `
      <div class="grid grid-2 gap-4">
        <div class="card">
          <div class="card-header"><div class="card-title">👤 Profile</div></div>
          <div style="display: flex; flex-direction: column; align-items: center; padding: var(--space-6); gap: var(--space-4);">
            <div class="avatar avatar-xl">${user.avatar || '👤'}</div>
            <h3>${Utils.escapeHtml(user.name)}</h3>
            <span class="badge badge-indigo">${user.role}</span>
            <p class="text-sm text-muted">${user.email}</p>
          </div>
          <div style="padding: var(--space-4); border-top: 1px solid var(--border-secondary);">
            <button class="btn btn-danger w-full" onclick="App.logout()">🚪 Sign Out</button>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">🎨 Preferences</div></div>
          <div style="padding: var(--space-4);">
            <div class="input-group" style="margin-bottom: var(--space-4);">
              <label class="input-label">Theme</label>
              <div class="tab-bar" style="width: 100%;">
                <button class="tab-item ${Utils.store.get('theme','dark')==='dark'?'active':''}" onclick="App.setTheme('dark')" style="flex:1">🌙 Dark</button>
                <button class="tab-item ${Utils.store.get('theme','dark')==='light'?'active':''}" onclick="App.setTheme('light')" style="flex:1">☀️ Light</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /* ── TEACHER: Grade Entry ── */
  async renderGradeEntryPage(container) {
    try {
      const { students } = await API.getStudents();
      container.innerHTML = `
        <div class="card">
          <div class="card-header"><div class="card-title">📝 Submit Grade</div></div>
          <form class="grade-entry-form" onsubmit="App.handleGradeSubmit(event)" style="padding: var(--space-4);">
            <div class="input-group">
              <label class="input-label">Student</label>
              <select class="input select" id="ge-student" required>
                <option value="">Select student...</option>
                ${students.map(s => `<option value="${s.id}">${s.name} (${s.class}-${s.section})</option>`).join('')}
              </select>
            </div>
            <div class="input-group">
              <label class="input-label">Subject</label>
              <select class="input select" id="ge-subject" required>
                <option value="">Select subject...</option>
                <option value="1">Mathematics</option>
                <option value="2">Science</option>
                <option value="3">English</option>
                <option value="4">Hindi</option>
                <option value="5">Social Studies</option>
                <option value="6">Computer Science</option>
              </select>
            </div>
            <div class="input-group">
              <label class="input-label">Marks</label>
              <input class="input" type="number" id="ge-marks" min="0" max="100" required placeholder="Enter marks">
            </div>
            <div class="input-group">
              <label class="input-label">Max Marks</label>
              <input class="input" type="number" id="ge-max" value="100" min="1" required>
            </div>
            <div class="input-group">
              <label class="input-label">Exam Type</label>
              <select class="input select" id="ge-type" required>
                <option value="unit_test">Unit Test</option>
                <option value="quiz">Quiz</option>
                <option value="midterm">Midterm</option>
                <option value="final">Final</option>
                <option value="assignment">Assignment</option>
              </select>
            </div>
            <div class="input-group">
              <label class="input-label">Date</label>
              <input class="input" type="date" id="ge-date" required value="${new Date().toISOString().split('T')[0]}">
            </div>
            <div style="grid-column: span 2;">
              <button class="btn btn-primary btn-lg w-full" type="submit">Submit Grade</button>
            </div>
          </form>
          <div id="ge-result" style="padding: var(--space-4); display: none;"></div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-text">${err.message}</div></div>`;
    }
  },

  async handleGradeSubmit(e) {
    e.preventDefault();
    try {
      await API.submitGrade({
        student_id: parseInt(document.getElementById('ge-student').value),
        subject_id: parseInt(document.getElementById('ge-subject').value),
        marks: parseFloat(document.getElementById('ge-marks').value),
        max_marks: parseFloat(document.getElementById('ge-max').value),
        exam_type: document.getElementById('ge-type').value,
        exam_name: document.getElementById('ge-type').selectedOptions[0].text,
        date: document.getElementById('ge-date').value,
      });
      const result = document.getElementById('ge-result');
      result.innerHTML = '<div class="badge badge-emerald" style="padding: 10px 16px; font-size: 14px;">✅ Grade submitted successfully! Parent has been notified.</div>';
      result.style.display = 'block';
      e.target.reset();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  },

  /* ── TEACHER: Mark Attendance ── */
  async renderMarkAttendancePage(container) {
    try {
      const { students } = await API.getStudents();
      const today = new Date().toISOString().split('T')[0];
      container.innerHTML = `
        <div class="card">
          <div class="card-header">
            <div class="card-title">✅ Mark Attendance — ${Utils.formatDate(today, 'long')}</div>
          </div>
          <form onsubmit="App.handleAttendanceSubmit(event)" style="padding: var(--space-4);">
            <div class="table-container">
              <table class="table">
                <thead><tr><th>Student</th><th>Class</th><th>Present</th><th>Late</th><th>Absent</th></tr></thead>
                <tbody>
                  ${students.map(s => `
                    <tr>
                      <td><div class="flex items-center gap-2"><span class="avatar avatar-sm">${s.avatar}</span>${s.name}</div></td>
                      <td>${s.class}-${s.section}</td>
                      <td><input type="radio" name="att-${s.id}" value="present" checked></td>
                      <td><input type="radio" name="att-${s.id}" value="late"></td>
                      <td><input type="radio" name="att-${s.id}" value="absent"></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            <button class="btn btn-primary btn-lg w-full" style="margin-top: var(--space-4);" type="submit">Save Attendance</button>
            <div id="att-result" style="margin-top: var(--space-4); display: none;"></div>
          </form>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-text">${err.message}</div></div>`;
    }
  },

  async handleAttendanceSubmit(e) {
    e.preventDefault();
    try {
      const { students } = await API.getStudents();
      const today = new Date().toISOString().split('T')[0];
      const records = students.students.map(s => {
        const status = document.querySelector(`input[name="att-${s.id}"]:checked`)?.value || 'present';
        return { student_id: s.id, date: today, status };
      });
      await API.markAttendance(records);
      const result = document.getElementById('att-result');
      result.innerHTML = '<div class="badge badge-emerald" style="padding: 10px 16px; font-size: 14px;">✅ Attendance saved successfully!</div>';
      result.style.display = 'block';
    } catch (err) {
      alert('Error: ' + err.message);
    }
  },

  /* ── TEACHER: Students Page ── */
  async renderStudentsPage(container) {
    await this.renderTeacherDashboard(container);
  },

  /* ── ADMIN: Users Page ── */
  async renderUsersPage(container) {
    container.innerHTML = `
      <div class="card">
        <div class="card-header"><div class="card-title">👥 User Management</div></div>
        <div class="empty-state">
          <div class="empty-state-icon">👥</div>
          <div class="empty-state-text">User management interface — Connect to backend to manage users</div>
        </div>
      </div>
    `;
  },

  /* ── ADMIN: Broadcast ── */
  renderBroadcastPage(container) {
    container.innerHTML = `
      <div class="card">
        <div class="card-header"><div class="card-title">📢 Send Broadcast</div></div>
        <form style="padding: var(--space-4);" onsubmit="App.handleBroadcast(event)">
          <div class="input-group" style="margin-bottom: var(--space-4);">
            <label class="input-label">Title</label>
            <input class="input" type="text" id="bc-title" required placeholder="Announcement title">
          </div>
          <div class="input-group" style="margin-bottom: var(--space-4);">
            <label class="input-label">Message</label>
            <textarea class="input" id="bc-message" rows="5" required placeholder="Type your announcement..."></textarea>
          </div>
          <div class="input-group" style="margin-bottom: var(--space-4);">
            <label class="input-label">Target Audience</label>
            <select class="input select" id="bc-target">
              <option value="all">All Users</option>
              <option value="parents">Parents Only</option>
              <option value="teachers">Teachers Only</option>
            </select>
          </div>
          <button class="btn btn-primary btn-lg w-full" type="submit">📢 Send Broadcast</button>
          <div id="bc-result" style="margin-top: var(--space-4); display: none;"></div>
        </form>
      </div>
    `;
  },

  handleBroadcast(e) {
    e.preventDefault();
    const result = document.getElementById('bc-result');
    result.innerHTML = '<div class="badge badge-emerald" style="padding: 10px 16px; font-size: 14px;">✅ Broadcast sent to all users!</div>';
    result.style.display = 'block';
  },

  /* ────────────────────────────────────────
     CHART RENDERING
     ──────────────────────────────────────── */
  renderTrendChart(subjects) {
    const canvas = document.getElementById('trend-chart');
    if (!canvas) return;

    const labels = ['UT-1', 'Q-1', 'UT-2', 'Mid', 'Q-2', 'UT-3', 'Final'];
    const datasets = subjects.slice(0, 4).map(s => ({
      data: s.history.map(h => h.marks).reverse(),
      color: s.subject_color || '#6366f1',
      label: s.subject_name,
    }));

    Charts.lineChart(canvas, datasets, labels);
  },

  renderAttendanceDonut(attendance) {
    const canvas = document.getElementById('attendance-donut');
    if (!canvas) return;

    Charts.donutChart(
      canvas,
      [attendance.present, attendance.late, attendance.absent],
      ['#10b981', '#f59e0b', '#ef4444'],
      ['Present', 'Late', 'Absent']
    );
  },

  /* ────────────────────────────────────────
     ACTIONS & STATE
     ──────────────────────────────────────── */
  navigate(page) {
    this.state.currentPage = page;
    this.render();
    window.scrollTo(0, 0);
  },

  async selectStudent(id) {
    this.state.selectedStudentId = id;
    this.render();
  },

  toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth <= 1024) {
      sidebar.classList.toggle('open');
    } else {
      sidebar.classList.toggle('collapsed');
      Utils.store.set('sidebar_collapsed', sidebar.classList.contains('collapsed'));
    }
  },

  toggleTheme() {
    const current = Utils.store.get('theme', 'dark');
    const next = current === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
  },

  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    Utils.store.set('theme', theme);
    // Re-render to update theme toggle button states
    const settingsContent = document.getElementById('page-content');
    if (this.state.currentPage === 'settings' && settingsContent) {
      this.renderSettingsPage(settingsContent);
    }
  },

  toggleNotifications() {
    this.state.notifOpen = !this.state.notifOpen;
    const panel = document.getElementById('notif-panel');
    if (panel) panel.classList.toggle('open', this.state.notifOpen);
  },

  async readNotification(id) {
    try {
      await API.markNotificationRead(id);
      const n = this.state.notifications.find(n => n.id === id);
      if (n) n.is_read = 1;
      this.state.unreadCount = Math.max(0, (this.state.unreadCount || 0) - 1);
      const panel = document.getElementById('notif-panel');
      if (panel) {
        panel.outerHTML = Components.renderNotificationPanel(this.state.notifications, this.state.notifOpen);
      }
    } catch (err) {
      console.error(err);
    }
  },

  async markAllRead() {
    try {
      await API.markAllNotificationsRead();
      this.state.notifications.forEach(n => n.is_read = 1);
      this.state.unreadCount = 0;
      const panel = document.getElementById('notif-panel');
      if (panel) {
        panel.outerHTML = Components.renderNotificationPanel(this.state.notifications, this.state.notifOpen);
      }
    } catch (err) {
      console.error(err);
    }
  },

  changeCalendarMonth(delta) {
    this.state.calendarMonth += delta;
    if (this.state.calendarMonth > 11) {
      this.state.calendarMonth = 0;
      this.state.calendarYear++;
    } else if (this.state.calendarMonth < 0) {
      this.state.calendarMonth = 11;
      this.state.calendarYear--;
    }
    this.render();
  },

  switchChartView(view) {
    document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    // Re-render chart
    if (this.state.dashboardData) {
      const canvas = document.getElementById('trend-chart');
      if (!canvas) return;
      const subjects = this.state.dashboardData.subjects;
      if (view === 'bar') {
        const latestScores = subjects.map(s => s.latest.marks);
        const labels = subjects.map(s => s.subject_name.slice(0, 4));
        const colors = subjects.map(s => s.subject_color);
        Charts.barChart(canvas, latestScores, labels, colors);
      } else {
        this.renderTrendChart(subjects);
      }
    }
  },

  viewStudentAsTeacher(studentId) {
    this.state.selectedStudentId = studentId;
    this.state.students = [{ id: studentId }];
    this.state.currentPage = 'grades';
    API.user.role = 'parent'; // Temp switch to see student view
    this.render();
  },

  showComposeModal() {
    alert('Message composition — Connect to backend for full messaging');
  },

  logout() {
    API.logout();
    this.state = {
      currentPage: 'dashboard',
      students: [],
      selectedStudentId: null,
      dashboardData: null,
      notifications: [],
      notifOpen: false,
      calendarMonth: new Date().getMonth(),
      calendarYear: new Date().getFullYear(),
      loading: true,
    };
    this.showLogin();
  },

  /* ── Sparkline Initializer ── */
  initSparklines() {
    document.querySelectorAll('.grade-card-sparkline[data-sparkline]').forEach(canvas => {
      const data = canvas.dataset.sparkline.split(',').map(Number);
      const color = canvas.dataset.color || '#6366f1';
      Charts.sparkline(canvas, data, color);
    });
  },

  /* ── Animate Stat Counters ── */
  animateStatCounters() {
    document.querySelectorAll('.stat-value[data-count]').forEach(el => {
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      if (isNaN(target)) return;
      if (Number.isInteger(target)) {
        Utils.animateCounter(el, target, 1000, suffix);
      } else {
        Utils.animateCounterFloat(el, target, 1000, 1, suffix);
      }
    });
  },
};

/* ── Boot ── */
document.addEventListener('DOMContentLoaded', () => {
  // Hide loading screen
  setTimeout(() => {
    const loader = document.getElementById('loading-screen');
    if (loader) loader.classList.add('hide');
  }, 800);

  App.init();
});
