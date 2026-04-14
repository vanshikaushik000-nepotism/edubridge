const express = require('express');
const { getDb, query, queryGet, queryRun } = require('../db');
const router = express.Router();

// GET /api/students
router.get('/', async (req, res) => {
  try {
    await getDb();
    let students;
    if (req.user.role === 'parent') {
      students = query('SELECT * FROM students WHERE parent_id = ?', [req.user.id]);
    } else {
      students = query('SELECT * FROM students');
    }
    res.json({ students });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/students/:id/dashboard
router.get('/:id/dashboard', async (req, res) => {
  try {
    await getDb();
    const studentId = parseInt(req.params.id);
    const student = queryGet('SELECT * FROM students WHERE id = ?', [studentId]);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    // Grades per subject
    const latestGrades = query(
      `SELECT g.*, s.name as subject_name, s.code as subject_code, s.color as subject_color
       FROM grades g JOIN subjects s ON g.subject_id = s.id
       WHERE g.student_id = ? ORDER BY g.date DESC`, [studentId]
    );

    const subjectMap = {};
    for (const g of latestGrades) {
      if (!subjectMap[g.subject_id]) {
        subjectMap[g.subject_id] = {
          subject_id: g.subject_id, subject_name: g.subject_name,
          subject_code: g.subject_code, subject_color: g.subject_color,
          latest: g, history: [],
        };
      }
      subjectMap[g.subject_id].history.push({ marks: g.marks, max_marks: g.max_marks, date: g.date, exam_type: g.exam_type, exam_name: g.exam_name });
    }
    const subjects = Object.values(subjectMap);

    const latestPerSubject = subjects.map(s => s.latest);
    const totalMarks = latestPerSubject.reduce((a, b) => a + b.marks, 0);
    const totalMax = latestPerSubject.reduce((a, b) => a + b.max_marks, 0);
    const overallPct = totalMax > 0 ? ((totalMarks / totalMax) * 100).toFixed(1) : 0;

    // Attendance summary
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const attSummary = query(
      'SELECT status, COUNT(*) as cnt FROM attendance WHERE student_id = ? AND date >= ? GROUP BY status',
      [studentId, thirtyDaysAgo.toISOString().split('T')[0]]
    );
    const attMap = { present: 0, absent: 0, late: 0 };
    for (const a of attSummary) attMap[a.status] = a.cnt;
    const totalDays = attMap.present + attMap.absent + attMap.late;
    const attendancePct = totalDays > 0 ? (((attMap.present + attMap.late) / totalDays) * 100).toFixed(1) : 100;

    // Events
    const today = new Date().toISOString().split('T')[0];
    const events = query(
      'SELECT * FROM events WHERE (class = ? OR class IS NULL) AND date >= ? ORDER BY date ASC LIMIT 10',
      [student.class, today]
    );

    // Notifications
    const notifications = query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20', [req.user.id]);
    const unreadCount = notifications.filter(n => !n.is_read).length;

    // Class rank
    const classStudents = query('SELECT id FROM students WHERE class = ?', [student.class]);
    const rankData = [];
    for (const cs of classStudents) {
      const avg = queryGet('SELECT AVG(marks) as avg_marks FROM grades WHERE student_id = ? AND date = (SELECT MAX(date) FROM grades WHERE student_id = ?)', [cs.id, cs.id]);
      rankData.push({ id: cs.id, avg: avg?.avg_marks || 0 });
    }
    rankData.sort((a, b) => b.avg - a.avg);
    const rank = rankData.findIndex(r => r.id === studentId) + 1;

    res.json({
      student, subjects,
      summary: {
        overall_percentage: parseFloat(overallPct),
        attendance_percentage: parseFloat(attendancePct),
        attendance: attMap, total_attendance_days: totalDays,
        upcoming_tasks: events.length, rank, total_students: classStudents.length,
      },
      events, notifications, unread_count: unreadCount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
