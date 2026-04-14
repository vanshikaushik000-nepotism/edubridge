const express = require('express');
const { getDb, query, queryGet, queryRun } = require('../db');
const router = express.Router();

router.get('/:studentId', async (req, res) => {
  try {
    await getDb();
    const grades = query(
      `SELECT g.*, s.name as subject_name, s.code as subject_code, s.color as subject_color
       FROM grades g JOIN subjects s ON g.subject_id = s.id
       WHERE g.student_id = ? ORDER BY g.date DESC`, [parseInt(req.params.studentId)]
    );
    res.json({ grades });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') return res.status(403).json({ error: 'Only teachers can submit grades' });
    const { student_id, subject_id, marks, max_marks, exam_type, exam_name, date, remarks } = req.body;
    if (!student_id || !subject_id || marks === undefined || !exam_type || !date) return res.status(400).json({ error: 'Missing required fields' });

    await getDb();
    const result = queryRun(
      'INSERT INTO grades (student_id, subject_id, marks, max_marks, exam_type, exam_name, date, remarks, entered_by) VALUES (?,?,?,?,?,?,?,?,?)',
      [student_id, subject_id, marks, max_marks || 100, exam_type, exam_name || '', date, remarks || '', req.user.id]
    );

    const student = queryGet('SELECT * FROM students WHERE id = ?', [student_id]);
    const subject = queryGet('SELECT * FROM subjects WHERE id = ?', [subject_id]);
    if (student && student.parent_id) {
      queryRun('INSERT INTO notifications (user_id, title, message, type) VALUES (?,?,?,?)',
        [student.parent_id, 'Grade Update', `${student.name} scored ${marks}/${max_marks || 100} in ${subject?.name || 'a subject'} (${exam_name || exam_type})`, 'grade']);
    }
    res.status(201).json({ id: result.lastInsertRowid, message: 'Grade submitted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') return res.status(403).json({ error: 'Only teachers can update grades' });
    const { marks, max_marks, remarks } = req.body;
    await getDb();
    queryRun('UPDATE grades SET marks = ?, max_marks = ?, remarks = ? WHERE id = ?', [marks, max_marks || 100, remarks || '', parseInt(req.params.id)]);
    res.json({ message: 'Grade updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
