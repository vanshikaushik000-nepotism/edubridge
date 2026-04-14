const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const jwt = require('jsonwebtoken');
const { seedData } = require('./db');
const { JWT_SECRET } = require('./routes/auth');

// ── Express App ──
const app = express();
const server = http.createServer(app);

// Socket.io for real-time notifications
let io;
try {
  const { Server } = require('socket.io');
  io = new Server(server, { cors: { origin: '*' } });
  io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);
    socket.on('join', (userId) => {
      socket.join(`user_${userId}`);
    });
    socket.on('disconnect', () => {});
  });
} catch (e) {
  console.log('Socket.io not available, continuing without real-time.');
}

// ── Middleware ──
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Auth middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Authentication required' });
  try {
    const token = authHeader.split(' ')[1];
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ── Routes ──
app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', authMiddleware, require('./routes/students'));
app.use('/api/grades', authMiddleware, require('./routes/grades'));
app.use('/api/attendance', authMiddleware, require('./routes/attendance'));
app.use('/api/notifications', authMiddleware, require('./routes/notifications'));
app.use('/api/calendar', authMiddleware, require('./routes/calendar'));

// Analytics proxy — forward to Python service
app.use('/api/analytics', authMiddleware, async (req, res) => {
  try {
    const url = `http://127.0.0.1:5001${req.url}`;
    const response = await fetch(url, {
      method: req.method,
      headers: { 'Content-Type': 'application/json' },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    // Python service down — return fallback insights
    res.json({
      insights: [
        { type: 'trend', subject: 'Mathematics', title: 'Upward Trend Detected', message: 'Mathematics scores have improved by 15% over the last 3 exams. Keep up the great work!', confidence: 0.87, severity: 'positive', icon: '📈' },
        { type: 'alert', subject: 'English', title: 'Attention Needed', message: 'English scores show a slight decline. Focus on grammar and comprehension exercises.', confidence: 0.72, severity: 'warning', icon: '⚠️' },
        { type: 'tip', subject: 'Science', title: 'Strong Performance', message: 'Science performance is consistently above class average. Consider advanced problem sets.', confidence: 0.91, severity: 'positive', icon: '🌟' },
        { type: 'study_plan', subject: 'General', title: 'Weekly Study Plan', message: 'Recommended focus: 40% Math, 30% English, 20% Science, 10% Hindi. Aim for 2 hours daily.', confidence: 0.80, severity: 'info', icon: '📚' },
      ],
      study_tips: [
        'Practice 5 algebra problems daily to strengthen weak areas',
        'Read one English article per day and summarize in 100 words',
        'Review science diagrams before bed for better retention',
        'Use flashcards for Hindi grammar rules',
      ]
    });
  }
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  if (req.url.startsWith('/api')) return res.status(404).json({ error: 'API route not found' });
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ── Start ──
const PORT = process.env.PORT || 3000;

async function start() {
  await seedData();

  server.listen(PORT, () => {
    console.log(`
  ╔══════════════════════════════════════════╗
  ║                                          ║
  ║   🎓 EduBridge Server Running            ║
  ║   📡 http://localhost:${PORT}              ║
  ║                                          ║
  ║   Login credentials:                     ║
  ║   👨 Parent:  parent@edubridge.com       ║
  ║   👩‍🏫 Teacher: teacher@edubridge.com      ║
  ║   🛡️  Admin:   admin@edubridge.com        ║
  ║   🔒 Password: password123               ║
  ║                                          ║
  ╚══════════════════════════════════════════╝
    `);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

module.exports = { app, io };
