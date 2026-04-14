const express = require('express');
const { getDb, query, queryGet, queryRun } = require('../db');
const router = express.Router();

router.get('/:classId', async (req, res) => {
  try {
    await getDb();
    const { from, to } = req.query;
    let sql = 'SELECT * FROM events WHERE (class = ? OR class IS NULL)';
    const params = [req.params.classId];
    if (from) { sql += ' AND date >= ?'; params.push(from); }
    if (to) { sql += ' AND (date <= ? OR end_date <= ?)'; params.push(to, to); }
    sql += ' ORDER BY date ASC';
    const events = query(sql, params);
    res.json({ events });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') return res.status(403).json({ error: 'Only teachers/admins can create events' });
    const { title, description, event_type, date, end_date, class: cls, subject_id } = req.body;
    if (!title || !event_type || !date) return res.status(400).json({ error: 'Title, event_type, and date are required' });
    await getDb();
    const result = queryRun('INSERT INTO events (title, description, event_type, date, end_date, class, subject_id, created_by) VALUES (?,?,?,?,?,?,?,?)',
      [title, description||'', event_type, date, end_date||null, cls||null, subject_id||null, req.user.id]);
    res.status(201).json({ id: result.lastInsertRowid, message: 'Event created' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/messages/inbox', async (req, res) => {
  try {
    await getDb();
    const messages = query(
      `SELECT m.*, u.name as sender_name, u.role as sender_role, u.avatar as sender_avatar
       FROM messages m JOIN users u ON m.sender_id = u.id
       WHERE m.receiver_id = ? ORDER BY m.created_at DESC`, [req.user.id]);
    res.json({ messages });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/messages', async (req, res) => {
  try {
    const { receiver_id, subject, body, parent_message_id } = req.body;
    if (!receiver_id || !body) return res.status(400).json({ error: 'Receiver and body are required' });
    await getDb();
    const result = queryRun('INSERT INTO messages (sender_id, receiver_id, subject, body, parent_message_id) VALUES (?,?,?,?,?)',
      [req.user.id, receiver_id, subject||'', body, parent_message_id||null]);
    queryRun('INSERT INTO notifications (user_id, title, message, type) VALUES (?,?,?,?)',
      [receiver_id, 'New Message', `${req.user.name} sent you a message`, 'system']);
    res.status(201).json({ id: result.lastInsertRowid, message: 'Message sent' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
