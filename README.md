# 🎓 EduBridge

**EduBridge** is a premium Parent-Student Engagement Platform designed to bridge the communication gap between schools and homes. It features real-time performance tracking, AI-powered academic insights, and a seamless dashboard experience.

## 🚀 Key Features

- **📊 Comprehensive Dashboard**: Real-time visualization of grades, attendance, and class ranking.
- **💡 AI Academic Insights**: Statistical trend analysis and personalized study recommendations.
- **📅 Smart Calendar**: Integrated academic schedule with exam alerts and event tracking.
- **✅ Attendance Heatmap**: Visual history of student attendance patterns.
- **🛡️ Secure Access**: Role-based authentication (Parent, Teacher, Admin).

## 🌍 Live Deployment (GitHub & Vercel)

This project is pre-configured for **Vercel**. 
1. **GitHub**: Push your code (including the `api/` folder and `vercel.json`).
2. **Vercel**: Import your repository. Vercel will automatically detect the Node.js serverless functions.
3. **Database**: Uses SQLite (`sql.js`) with an automatic `/tmp` fallback for serverless persistence.

## 🛠️ Local Setup

### 1. Installation
```bash
npm install
```

### 2. Running
- **Windows**: Double-click `start.bat`
- **Manual Node**: `node server/server.js`

Open **`http://localhost:3000`** in your browser.

## 🔑 Demo Accounts
| Role | Email | Password |
| :--- | :--- | :--- |
| **Parent** | `parent@edubridge.com` | `password123` |
| **Teacher** | `teacher@edubridge.com` | `password123` |
| **Admin** | `admin@edubridge.com` | `password123` |

## 📄 License
MIT License. Created for the EduBridge Platform.
