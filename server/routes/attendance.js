const express = require('express');
const { getDb, query, queryGet, queryRun } = require('../db');
const router = express.Router();

router.get('/:studentId', async (req, res) => {
  try {
    await getDb();
    const { from, to } = req.query;
    let sql = 'SELECT * FROM attendance WHERE student_id = ?';
    const params = [parseInt(req.params.studentId)];
    if (from) { sql += ' AND date >= ?'; params.push(from); }
    if (to) { sql += ' AND date <= ?'; params.push(to); }
    sql += ' ORDER BY date DESC';
    const records = query(sql, params);

    const summary = { present: 0, absent: 0, late: 0, total: records.length };
    for (const r of records) summary[r.status]++;
    summary.percentage = summary.total > 0 ? (((summary.present + summary.late) / summary.total) * 100).toFixed(1) : '100.0';

    res.json({ records, summary });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') return res.status(403).json({ error: 'Only teachers can mark attendance' });
    const { records } = req.body;
    if (!records || !Array.isArray(records)) return res.status(400).json({ error: 'Records array required' });

    await getDb();
    for (const r of records) {
      queryRun('INSERT OR REPLACE INTO attendance (student_id, date, status, marked_by, remarks) VALUES (?,?,?,?,?)',
        [r.student_id, r.date, r.status, req.user.id, r.remarks || '']);
      if (r.status === 'absent') {
        const student = queryGet('SELECT * FROM students WHERE id = ?', [r.student_id]);
        if (student && student.parent_id) {
          queryRun('INSERT INTO notifications (user_id, title, message, type) VALUES (?,?,?,?)',
            [student.parent_id, 'Attendance Alert', `${student.name} was marked absent on ${r.date}`, 'attendance']);
        }
      }
    }
    res.status(201).json({ message: `${records.length} attendance records saved` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
