/* ═══════════════════════════════════════════
   EduBridge — API Client
   Communicates with Node.js + Express backend
   ═══════════════════════════════════════════ */

const API = {
  BASE: '/api',
  token: null,
  user: null,

  /* ── Core request method ── */
  async request(path, options = {}) {
    const url = this.BASE + path;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (err) {
      console.error(`API Error [${path}]:`, err.message);
      throw err;
    }
  },

  /* ── Auth ── */
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    this.token = data.token;
    this.user = data.user;
    Utils.store.set('token', data.token);
    Utils.store.set('user', data.user);
    return data;
  },

  async register(name, email, password, role, phone) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: { name, email, password, role, phone },
    });
    this.token = data.token;
    this.user = data.user;
    Utils.store.set('token', data.token);
    Utils.store.set('user', data.user);
    return data;
  },

  async validateToken() {
    try {
      const data = await this.request('/auth/me');
      this.user = data.user;
      return data.user;
    } catch {
      this.logout();
      return null;
    }
  },

  logout() {
    this.token = null;
    this.user = null;
    Utils.store.remove('token');
    Utils.store.remove('user');
  },

  restoreSession() {
    this.token = Utils.store.get('token');
    this.user = Utils.store.get('user');
    return !!this.token;
  },

  /* ── Students ── */
  async getStudents() {
    return this.request('/students');
  },

  async getStudentDashboard(studentId) {
    return this.request(`/students/${studentId}/dashboard`);
  },

  /* ── Grades ── */
  async getGrades(studentId) {
    return this.request(`/grades/${studentId}`);
  },

  async submitGrade(gradeData) {
    return this.request('/grades', {
      method: 'POST',
      body: gradeData,
    });
  },

  async updateGrade(id, data) {
    return this.request(`/grades/${id}`, {
      method: 'PUT',
      body: data,
    });
  },

  /* ── Attendance ── */
  async getAttendance(studentId, from, to) {
    let path = `/attendance/${studentId}`;
    const params = [];
    if (from) params.push(`from=${from}`);
    if (to) params.push(`to=${to}`);
    if (params.length) path += '?' + params.join('&');
    return this.request(path);
  },

  async markAttendance(records) {
    return this.request('/attendance', {
      method: 'POST',
      body: { records },
    });
  },

  /* ── Notifications ── */
  async getNotifications() {
    return this.request('/notifications');
  },

  async markNotificationRead(id) {
    return this.request(`/notifications/${id}/read`, { method: 'PUT' });
  },

  async markAllNotificationsRead() {
    return this.request('/notifications/read-all', { method: 'PUT' });
  },

  async getNotificationPreferences() {
    return this.request('/notifications/preferences');
  },

  async updateNotificationPreferences(prefs) {
    return this.request('/notifications/preferences', {
      method: 'PUT',
      body: prefs,
    });
  },

  /* ── Calendar ── */
  async getCalendarEvents(classId, from, to) {
    let path = `/calendar/${classId}`;
    const params = [];
    if (from) params.push(`from=${from}`);
    if (to) params.push(`to=${to}`);
    if (params.length) path += '?' + params.join('&');
    return this.request(path);
  },

  async createEvent(eventData) {
    return this.request('/calendar', {
      method: 'POST',
      body: eventData,
    });
  },

  /* ── Messages ── */
  async getMessages() {
    return this.request('/calendar/messages/inbox');
  },

  async sendMessage(receiverId, subject, body) {
    return this.request('/calendar/messages', {
      method: 'POST',
      body: { receiver_id: receiverId, subject, body },
    });
  },

  /* ── Analytics (Python service) ── */
  async getInsights(studentId) {
    return this.request(`/analytics/insights/${studentId}`);
  },

  async getStudyPlan(studentId, grades, availableHours) {
    return this.request(`/analytics/study-plan/${studentId}`, {
      method: 'POST',
      body: { grades, available_hours: availableHours },
    });
  },
};
