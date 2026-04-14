const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'edubridge.db');

let db;
let SQL;

async function getDb() {
  if (db) return db;
  SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  db.run('PRAGMA foreign_keys = ON');
  return db;
}

function saveDb() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

// Helper to mimic better-sqlite3's prepare().get() / .all() / .run()
function query(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function queryGet(sql, params = []) {
  const results = query(sql, params);
  return results[0] || null;
}

function queryRun(sql, params = []) {
  db.run(sql, params);
  saveDb();
  return {
    lastInsertRowid: db.exec("SELECT last_insert_rowid()")[0]?.values[0][0] || 0,
    changes: db.getRowsModified(),
  };
}

/* ──────────────────────────────────────────
   Schema creation
   ────────────────────────────────────────── */
async function initSchema() {
  const d = await getDb();

  d.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT CHECK(role IN ('parent','teacher','admin')) NOT NULL,
      avatar TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  d.run(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      roll_number TEXT UNIQUE NOT NULL,
      class TEXT NOT NULL,
      section TEXT DEFAULT 'A',
      parent_id INTEGER REFERENCES users(id),
      avatar TEXT DEFAULT '',
      date_of_birth TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  d.run(`
    CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      teacher_id INTEGER REFERENCES users(id),
      class TEXT NOT NULL,
      color TEXT DEFAULT '#6366f1'
    )
  `);

  d.run(`
    CREATE TABLE IF NOT EXISTS grades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER REFERENCES students(id),
      subject_id INTEGER REFERENCES subjects(id),
      marks REAL NOT NULL,
      max_marks REAL DEFAULT 100,
      exam_type TEXT CHECK(exam_type IN ('unit_test','midterm','final','assignment','quiz')) NOT NULL,
      exam_name TEXT DEFAULT '',
      date TEXT NOT NULL,
      remarks TEXT DEFAULT '',
      entered_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  d.run(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER REFERENCES students(id),
      date TEXT NOT NULL,
      status TEXT CHECK(status IN ('present','absent','late')) NOT NULL,
      marked_by INTEGER REFERENCES users(id),
      remarks TEXT DEFAULT '',
      UNIQUE(student_id, date)
    )
  `);

  d.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT CHECK(type IN ('grade','attendance','event','system','insight')) NOT NULL,
      is_read INTEGER DEFAULT 0,
      link TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  d.run(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      event_type TEXT CHECK(event_type IN ('exam','holiday','ptm','assignment','event')) NOT NULL,
      date TEXT NOT NULL,
      end_date TEXT,
      class TEXT,
      subject_id INTEGER REFERENCES subjects(id),
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  d.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER REFERENCES users(id),
      receiver_id INTEGER REFERENCES users(id),
      subject TEXT DEFAULT '',
      body TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      parent_message_id INTEGER REFERENCES messages(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  d.run(`
    CREATE TABLE IF NOT EXISTS notification_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE REFERENCES users(id),
      grade_threshold REAL DEFAULT 40,
      absence_threshold INTEGER DEFAULT 3,
      email_enabled INTEGER DEFAULT 1,
      push_enabled INTEGER DEFAULT 1,
      sms_enabled INTEGER DEFAULT 0,
      digest_mode TEXT CHECK(digest_mode IN ('instant','daily','weekly')) DEFAULT 'instant',
      dnd_start TEXT DEFAULT '22:00',
      dnd_end TEXT DEFAULT '07:00'
    )
  `);

  saveDb();
  return d;
}

/* ──────────────────────────────────────────
   Seed data
   ────────────────────────────────────────── */
async function seedData() {
  await initSchema();
  const d = await getDb();

  const existing = queryGet('SELECT COUNT(*) as cnt FROM users');
  if (existing && existing.cnt > 0) {
    console.log('Database already seeded.');
    return;
  }

  console.log('Seeding database...');
  const hash = bcrypt.hashSync('password123', 10);

  // Users
  const users = [
    ['Rajesh Kumar', 'parent@edubridge.com', hash, 'parent', '👨', '+91-9876543210'],
    ['Priya Sharma', 'parent2@edubridge.com', hash, 'parent', '👩', '+91-9876543211'],
    ['Anita Desai', 'teacher@edubridge.com', hash, 'teacher', '👩‍🏫', '+91-9876543212'],
    ['Vikram Singh', 'teacher2@edubridge.com', hash, 'teacher', '👨‍🏫', '+91-9876543213'],
    ['Sunita Patel', 'teacher3@edubridge.com', hash, 'teacher', '👩‍🏫', '+91-9876543214'],
    ['Admin User', 'admin@edubridge.com', hash, 'admin', '🛡️', '+91-9876543215'],
  ];
  for (const u of users) {
    queryRun('INSERT INTO users (name, email, password, role, avatar, phone) VALUES (?,?,?,?,?,?)', u);
  }

  // Students
  const students = [
    ['Arjun Kumar', 'STU-2024-001', '10', 'A', 1, '👦', '2010-05-15'],
    ['Meera Kumar', 'STU-2024-002', '8', 'A', 1, '👧', '2012-08-22'],
    ['Rohan Sharma', 'STU-2024-003', '10', 'A', 2, '👦', '2010-03-10'],
    ['Aanya Sharma', 'STU-2024-004', '10', 'B', 2, '👧', '2010-11-01'],
  ];
  for (const s of students) {
    queryRun('INSERT INTO students (name, roll_number, class, section, parent_id, avatar, date_of_birth) VALUES (?,?,?,?,?,?,?)', s);
  }

  // Subjects
  const subjects = [
    ['Mathematics', 'MATH10', 3, '10', '#6366f1'],
    ['Science', 'SCI10', 4, '10', '#10b981'],
    ['English', 'ENG10', 5, '10', '#f59e0b'],
    ['Hindi', 'HIN10', 3, '10', '#ef4444'],
    ['Social Studies', 'SST10', 4, '10', '#3b82f6'],
    ['Computer Science', 'CS10', 5, '10', '#8b5cf6'],
    ['Mathematics', 'MATH8', 3, '8', '#6366f1'],
    ['Science', 'SCI8', 4, '8', '#10b981'],
  ];
  for (const s of subjects) {
    queryRun('INSERT INTO subjects (name, code, teacher_id, class, color) VALUES (?,?,?,?,?)', s);
  }

  // Grades
  const examTypes = ['unit_test', 'quiz', 'unit_test', 'midterm', 'quiz', 'unit_test', 'final'];
  const examNames = ['UT-1', 'Quiz-1', 'UT-2', 'Midterm', 'Quiz-2', 'UT-3', 'Final'];
  const months = ['2025-08-15', '2025-09-10', '2025-10-05', '2025-11-12', '2025-12-08', '2026-01-20', '2026-03-15'];

  const arjunMarks = { 1: [78,82,75,88,72,85,90], 2: [85,88,82,90,87,92,91], 3: [70,65,72,68,75,71,74], 4: [80,78,82,85,79,83,86], 5: [75,80,78,82,85,80,83], 6: [92,95,88,90,93,96,94] };
  for (const [subId, marks] of Object.entries(arjunMarks)) {
    marks.forEach((m, i) => {
      queryRun('INSERT INTO grades (student_id, subject_id, marks, max_marks, exam_type, exam_name, date, entered_by) VALUES (?,?,?,?,?,?,?,?)',
        [1, parseInt(subId), m, 100, examTypes[i], examNames[i], months[i], 3]);
    });
  }

  const rohanMarks = { 1: [65,70,62,75,68,72,78], 2: [72,75,70,78,74,80,82], 3: [80,82,78,85,83,88,86], 4: [70,68,72,75,70,74,76], 5: [78,82,80,85,83,86,88], 6: [60,65,58,70,62,68,72] };
  for (const [subId, marks] of Object.entries(rohanMarks)) {
    marks.forEach((m, i) => {
      queryRun('INSERT INTO grades (student_id, subject_id, marks, max_marks, exam_type, exam_name, date, entered_by) VALUES (?,?,?,?,?,?,?,?)',
        [3, parseInt(subId), m, 100, examTypes[i], examNames[i], months[i], 4]);
    });
  }

  const meeraMarks = { 7: [88,90,85,92,87,94,91], 8: [82,85,80,88,84,90,87] };
  for (const [subId, marks] of Object.entries(meeraMarks)) {
    marks.forEach((m, i) => {
      queryRun('INSERT INTO grades (student_id, subject_id, marks, max_marks, exam_type, exam_name, date, entered_by) VALUES (?,?,?,?,?,?,?,?)',
        [2, parseInt(subId), m, 100, examTypes[i], examNames[i], months[i], 3]);
    });
  }

  // Attendance (last 90 days)
  const today = new Date();
  for (let i = 90; i >= 0; i--) {
    const d2 = new Date(today);
    d2.setDate(d2.getDate() - i);
    if (d2.getDay() === 0) continue;
    const dateStr = d2.toISOString().split('T')[0];
    for (const sid of [1, 2, 3, 4]) {
      const rand = Math.random();
      let status = 'present';
      if (rand < 0.05) status = 'absent';
      else if (rand < 0.1) status = 'late';
      try {
        queryRun('INSERT OR IGNORE INTO attendance (student_id, date, status, marked_by) VALUES (?,?,?,?)', [sid, dateStr, status, 3]);
      } catch(e) {}
    }
  }

  // Events
  const eventData = [
    ['Unit Test 4 - Mathematics', 'Chapters 8-10', 'exam', '2026-04-20', null, '10', 1, 3],
    ['Science Project Submission', 'Final project submission', 'assignment', '2026-04-18', null, '10', 2, 4],
    ['Parent-Teacher Meeting', 'Term 2 progress review', 'ptm', '2026-04-25', null, '10', null, 6],
    ['Summer Vacation', 'School closed', 'holiday', '2026-05-15', '2026-06-15', null, null, 6],
    ['Annual Day Celebration', 'Cultural program', 'event', '2026-04-28', null, null, null, 6],
    ['English Essay Competition', 'Inter-class essay writing', 'event', '2026-04-22', null, '10', 3, 5],
    ['Midterm Exams Begin', 'All subjects', 'exam', '2026-05-01', '2026-05-10', '10', null, 6],
    ['Hindi Quiz', 'Online quiz Chapter 6-8', 'exam', '2026-04-19', null, '10', 4, 3],
  ];
  for (const e of eventData) {
    queryRun('INSERT INTO events (title, description, event_type, date, end_date, class, subject_id, created_by) VALUES (?,?,?,?,?,?,?,?)', e);
  }

  // Notifications
  const notifData = [
    [1, 'Grade Update', 'Arjun scored 90/100 in Mathematics Final exam', 'grade', 0, '2026-04-14 09:00:00'],
    [1, 'Attendance Alert', 'Arjun was marked late today', 'attendance', 0, '2026-04-13 08:30:00'],
    [1, 'Upcoming Exam', 'Unit Test 4 - Mathematics on April 20', 'event', 0, '2026-04-12 10:00:00'],
    [1, 'AI Insight', "Arjun's English scores show a declining trend. Consider focusing on grammar.", 'insight', 1, '2026-04-11 14:00:00'],
    [1, 'PTM Scheduled', 'Parent-Teacher Meeting on April 25 at 10:00 AM', 'event', 1, '2026-04-10 09:00:00'],
    [1, 'Grade Update', 'Meera scored 91/100 in Mathematics Final exam', 'grade', 1, '2026-04-09 11:00:00'],
    [1, 'System', 'Welcome to EduBridge! Set up your notification preferences.', 'system', 1, '2026-04-01 08:00:00'],
  ];
  for (const n of notifData) {
    queryRun('INSERT INTO notifications (user_id, title, message, type, is_read, created_at) VALUES (?,?,?,?,?,?)', n);
  }

  // Notification preferences
  queryRun('INSERT INTO notification_preferences (user_id, grade_threshold, absence_threshold) VALUES (?,?,?)', [1, 40, 3]);
  queryRun('INSERT INTO notification_preferences (user_id, grade_threshold, absence_threshold) VALUES (?,?,?)', [2, 50, 2]);

  console.log('✓ Database seeded successfully!');
}

// Run seed if called directly
if (require.main === module) {
  seedData().then(() => process.exit(0));
}

module.exports = { getDb, initSchema, seedData, query, queryGet, queryRun };
