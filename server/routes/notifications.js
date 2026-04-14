const express = require('express');
const { getDb, query, queryGet, queryRun } = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    await getDb();
    const notifications = query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50', [req.user.id]);
    const unread = notifications.filter(n => !n.is_read).length;
    res.json({ notifications, unread_count: unread });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id/read', async (req, res) => {
  try {
    await getDb();
    queryRun('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [parseInt(req.params.id), req.user.id]);
    res.json({ message: 'Marked as read' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/read-all', async (req, res) => {
  try {
    await getDb();
    queryRun('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
    res.json({ message: 'All marked as read' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/preferences', async (req, res) => {
  try {
    await getDb();
    let prefs = queryGet('SELECT * FROM notification_preferences WHERE user_id = ?', [req.user.id]);
    if (!prefs) {
      queryRun('INSERT INTO notification_preferences (user_id) VALUES (?)', [req.user.id]);
      prefs = queryGet('SELECT * FROM notification_preferences WHERE user_id = ?', [req.user.id]);
    }
    res.json({ preferences: prefs });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/preferences', async (req, res) => {
  try {
    const { grade_threshold, absence_threshold, email_enabled, push_enabled, sms_enabled, digest_mode, dnd_start, dnd_end } = req.body;
    await getDb();
    queryRun(`INSERT INTO notification_preferences (user_id, grade_threshold, absence_threshold, email_enabled, push_enabled, sms_enabled, digest_mode, dnd_start, dnd_end) VALUES (?,?,?,?,?,?,?,?,?)
      ON CONFLICT(user_id) DO UPDATE SET grade_threshold=excluded.grade_threshold, absence_threshold=excluded.absence_threshold, email_enabled=excluded.email_enabled, push_enabled=excluded.push_enabled, sms_enabled=excluded.sms_enabled, digest_mode=excluded.digest_mode, dnd_start=excluded.dnd_start, dnd_end=excluded.dnd_end`,
      [req.user.id, grade_threshold||40, absence_threshold||3, email_enabled?1:0, push_enabled?1:0, sms_enabled?1:0, digest_mode||'instant', dnd_start||'22:00', dnd_end||'07:00']);
    res.json({ message: 'Preferences updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
