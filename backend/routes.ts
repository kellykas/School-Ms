import { Router } from 'express';
import db from './database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();

// SECURITY: Use environment variable in production.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.warn("WARNING: JWT_SECRET environment variable is not set. Using insecure default for development.");
}
const SECRET_KEY = JWT_SECRET || 'dev-secret-key-change-in-prod';

// Helper: Get Admin ID from token
const getAdminFromRequest = (req: any): string => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return 'System';
  try {
    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, SECRET_KEY);
    return decoded.email || 'Admin';
  } catch (e) {
    return 'Unknown Admin';
  }
};

// Helper: Log Action
const logAction = (action: string, targetId: string, targetName: string, performedBy: string, details: string) => {
  const id = `log-${Date.now()}-${Math.floor(Math.random()*1000)}`;
  const timestamp = new Date().toISOString();
  db.run(
    "INSERT INTO audit_logs (id, action, targetUserId, targetUserName, performedBy, timestamp, details) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [id, action, targetId, targetName, performedBy, timestamp, details]
  );
};

// --- AUTHENTICATION ---

router.post('/auth/login', (req, res) => {
  const { email, password } = req.body;

  db.get("SELECT * FROM users WHERE email = ?", [email], async (err: any, user: any) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    if (user.status === 'INACTIVE') {
      return res.status(403).json({ error: 'Account is inactive' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      SECRET_KEY,
      { expiresIn: '24h' }
    );

    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  });
});

router.get('/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];

  try {
    jwt.verify(token, SECRET_KEY, (err: any, decoded: any) => {
      if (err) return res.status(401).json({ error: 'Invalid token' });

      db.get("SELECT * FROM users WHERE id = ?", [decoded.id], (err: any, user: any) => {
        if (!user) return res.status(404).json({ error: 'User not found' });
        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      });
    });
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

// --- USER MANAGEMENT ---

router.get('/users', (req, res) => {
  db.all("SELECT id, name, email, role, avatarUrl, status FROM users", [], (err: any, rows: any) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post('/users', async (req, res) => {
  const { name, email, role, password, avatarUrl, status } = req.body;
  const adminName = getAdminFromRequest(req);
  const id = `u-${Date.now()}`;
  const hashedPassword = await bcrypt.hash(password || 'password123', 10);
  
  const stmt = db.prepare("INSERT INTO users (id, name, email, role, password, avatarUrl, status) VALUES (?, ?, ?, ?, ?, ?, ?)");
  stmt.run([id, name, email, role, hashedPassword, avatarUrl, status || 'ACTIVE'], (err: any) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Log Creation
    logAction('USER_CREATED', id, name, adminName, `Role: ${role}`);
    
    res.json({ id, name, email, role, status });
  });
  stmt.finalize();
});

router.put('/users/:id', async (req, res) => {
  const { name, email, avatarUrl, status, password } = req.body;
  const { id } = req.params;
  const adminName = getAdminFromRequest(req);

  // Get current state to compare for logs
  db.get("SELECT * FROM users WHERE id = ?", [id], async (err: any, currentUser: any) => {
    if (!currentUser) return res.status(404).json({ error: 'User not found' });

    // Build dynamic query
    let query = "UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email), avatarUrl = COALESCE(?, avatarUrl), status = COALESCE(?, status)";
    const params = [name, email, avatarUrl, status];

    // Detect changes for logs
    let action = 'USER_UPDATED';
    let details = [];

    if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        query += ", password = ?";
        params.push(hashedPassword);
        action = 'PASSWORD_RESET';
        details.push('Password changed');
    }

    if (status && status !== currentUser.status) {
        action = 'STATUS_CHANGE';
        details.push(`Status changed from ${currentUser.status} to ${status}`);
    }

    if (details.length === 0) details.push('Profile details updated');

    query += " WHERE id = ?";
    params.push(id);

    db.run(query, params, function(this: any, err: any) {
        if (err) return res.status(500).json({ error: err.message });
        
        // Log Update
        logAction(action, id, currentUser.name, adminName, details.join(', '));

        res.json({ success: true });
      }
    );
  });
});

router.get('/audit-logs', (req, res) => {
  db.all("SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100", [], (err: any, rows: any) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// --- STUDENTS ---

router.get('/students', (req, res) => {
  db.all("SELECT * FROM students", [], (err: any, rows: any) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post('/students/bulk', (req, res) => {
  const students = req.body.students;
  if (!Array.isArray(students)) return res.status(400).json({ error: 'Invalid data' });

  const stmt = db.prepare("INSERT OR REPLACE INTO students (id, name, grade, section, guardian_name, contact, attendance_rate, fees_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    students.forEach(s => {
      stmt.run([s.id || `s-${Date.now()}`, s.name, s.grade, s.section, s.guardianName, s.contact, s.attendanceRate, s.feesStatus]);
    });
    db.run("COMMIT", (err: any) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ message: `Imported ${students.length} students` });
    });
  });
  stmt.finalize();
});

// --- TEACHERS ---

router.get('/teachers', (req, res) => {
  db.all("SELECT * FROM teachers", [], (err: any, rows: any) => {
    if (err) return res.status(500).json({ error: err.message });
    // Parse JSON classes
    const teachers = rows.map((r: any) => ({
      ...r,
      classes: JSON.parse(r.classes || '[]')
    }));
    res.json(teachers);
  });
});

router.post('/teachers', (req, res) => {
  const { name, subject, email, classes } = req.body;
  const id = `t-${Date.now()}`;
  
  db.run(
    "INSERT INTO teachers (id, name, subject, email, classes) VALUES (?, ?, ?, ?, ?)",
    [id, name, subject, email, JSON.stringify(classes)],
    function(this: any, err: any) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id, name, subject, email, classes });
    }
  );
});

// --- ASSIGNMENTS ---

router.get('/assignments', (req, res) => {
  db.all("SELECT * FROM assignments", [], (err: any, rows: any) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post('/assignments', (req, res) => {
  const { classId, title, description, dueDate, subject, status, attachmentName } = req.body;
  const id = `as${Date.now()}`;
  
  db.run(
    "INSERT INTO assignments (id, classId, title, description, dueDate, subject, status, attachmentName) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [id, classId, title, description, dueDate, subject, status, attachmentName],
    function(this: any, err: any) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id });
    }
  );
});

// --- EXAMS ---

router.get('/exams', (req, res) => {
  db.all("SELECT * FROM exams", [], (err: any, rows: any) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// --- FEES ---

router.get('/fees', (req, res) => {
  db.all("SELECT * FROM fees", [], (err: any, rows: any) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post('/fees/pay', (req, res) => {
  const { invoiceId } = req.body;
  db.run("UPDATE fees SET feesStatus = 'PAID' WHERE invoiceId = ?", [invoiceId], function(this: any, err: any) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// --- ATTENDANCE ---

router.post('/attendance', (req, res) => {
  const { date, records } = req.body; // records: [{studentId, status}]
  if (!date || !records || !Array.isArray(records)) {
    return res.status(400).json({ error: 'Invalid attendance data' });
  }

  const stmt = db.prepare("INSERT OR REPLACE INTO attendance (id, date, studentId, status) VALUES (?, ?, ?, ?)");
  
  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    records.forEach((r: any) => {
        const id = `${r.studentId}-${date}`;
        stmt.run([id, date, r.studentId, r.status]);
    });
    db.run("COMMIT", (err: any) => {
        if (err) {
            console.error(err);
            return res.status(500).json({error: err.message});
        }
        res.json({success: true, count: records.length});
    });
  });
  stmt.finalize();
});

// --- STATS ---
router.get('/stats', (req, res) => {
  const stats = { students: 0, teachers: 0, revenue: 0 };
  
  db.serialize(() => {
    db.get("SELECT count(*) as c FROM students", (err, row: any) => stats.students = row?.c || 0);
    db.get("SELECT count(*) as c FROM teachers", (err, row: any) => stats.teachers = row?.c || 0);
    db.get("SELECT sum(amount) as s FROM fees WHERE feesStatus = 'PAID'", (err, row: any) => {
      stats.revenue = row?.s || 0;
      res.json(stats);
    });
  });
});

// --- NOTIFICATIONS (EMAIL MOCK) ---
router.post('/notifications/email', (req, res) => {
  const { recipientName, subject, message, type } = req.body;
  
  // Simulate sending email
  console.log(`\n--- [MOCK EMAIL SERVICE] ---`);
  console.log(`TYPE:    ${type}`);
  console.log(`TO:      ${recipientName} <${recipientName.toLowerCase().replace(/\s/g, '.')}@edusphere.school>`);
  console.log(`SUBJECT: ${subject}`);
  console.log(`BODY:    ${message}`);
  console.log(`----------------------------\n`);

  // Simulate network delay
  setTimeout(() => {
    res.json({ success: true, message: 'Email queued for delivery' });
  }, 600);
});

export default router;