import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';

// Allow database path to be configured via environment variable
const DB_PATH = process.env.DB_PATH || './school.db';
const db = new sqlite3.Database(DB_PATH);

export const initDb = () => {
  db.serialize(() => {
    // 1. Users Table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL,
      password TEXT NOT NULL,
      avatarUrl TEXT,
      status TEXT DEFAULT 'ACTIVE'
    )`);

    // 2. Students Table
    db.run(`CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      name TEXT NOT NULL,
      grade TEXT,
      section TEXT,
      guardian_name TEXT,
      contact TEXT,
      attendance_rate INTEGER,
      fees_status TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    // 3. Teachers Table
    db.run(`CREATE TABLE IF NOT EXISTS teachers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      subject TEXT,
      email TEXT,
      classes TEXT -- JSON Array of strings e.g. ["10-A", "9-B"]
    )`);

    // 4. Assignments Table
    db.run(`CREATE TABLE IF NOT EXISTS assignments (
      id TEXT PRIMARY KEY,
      classId TEXT,
      title TEXT,
      description TEXT,
      dueDate TEXT,
      subject TEXT,
      status TEXT,
      attachmentName TEXT
    )`);

    // 5. Exams Table
    db.run(`CREATE TABLE IF NOT EXISTS exams (
      id TEXT PRIMARY KEY,
      studentId TEXT,
      studentName TEXT,
      subject TEXT,
      score INTEGER,
      total INTEGER,
      grade TEXT
    )`);

    // 6. Fees Table
    db.run(`CREATE TABLE IF NOT EXISTS fees (
      invoiceId TEXT PRIMARY KEY,
      studentId TEXT,
      name TEXT,
      grade TEXT,
      amount INTEGER,
      dueDate TEXT,
      feesStatus TEXT
    )`);

    // 7. Attendance Table
    db.run(`CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      date TEXT,
      studentId TEXT,
      status TEXT,
      FOREIGN KEY(studentId) REFERENCES students(id)
    )`);

    // 8. Audit Logs Table (New)
    db.run(`CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      action TEXT,
      targetUserId TEXT,
      targetUserName TEXT,
      performedBy TEXT,
      timestamp TEXT,
      details TEXT
    )`);

    // Ensure the requested Admin user exists
    const adminHash = bcrypt.hashSync('password123', 10);
    
    db.get("SELECT id FROM users WHERE email = 'admin@school.com'", (err, row) => {
        if (!row) {
            const stmt = db.prepare("INSERT INTO users (id, name, email, role, password, avatarUrl, status) VALUES (?, ?, ?, ?, ?, ?, ?)");
            stmt.run(['u0', 'System Admin', 'admin@school.com', 'ADMIN', adminHash, 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin', 'ACTIVE']);
            stmt.finalize();
            console.log("Admin account created: admin@school.com");
        } else {
             // Reset password to ensure access
             db.run("UPDATE users SET password = ? WHERE email = 'admin@school.com'", [adminHash]);
             console.log("Admin password reset to 'password123'.");
        }
    });

    // Seed other data if empty
    db.get("SELECT count(*) as count FROM users", [], (err: any, row: any) => {
      if (err) return console.error(err);
      if (row.count <= 1) { 
        console.log("Seeding initial data...");
        seedData();
      } else {
        console.log("Database initialized at " + DB_PATH);
      }
    });
  });
};

const seedData = () => {
  const hash = bcrypt.hashSync('password123', 10);
  const adminHash = bcrypt.hashSync('kellykas0007', 10);

  // 1. Seed Users
  const users = [
    ['u1', 'Kelly Kasongo', 'kellykasongowww@gmail.com', 'ADMIN', adminHash, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'],
    ['u2', 'Mr. Anderson', 'anderson@school.com', 'TEACHER', hash, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'],
    ['u3', 'Emma Thompson', 'emma@student.com', 'STUDENT', hash, 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma'],
    ['u4', 'Sarah Wilson', 'sarah@parent.com', 'PARENT', hash, 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah']
  ];
  const stmtUser = db.prepare("INSERT OR IGNORE INTO users (id, name, email, role, password, avatarUrl) VALUES (?, ?, ?, ?, ?, ?)");
  users.forEach(user => stmtUser.run(user));
  stmtUser.finalize();

  // 2. Seed Students
  const students = [
    ['s1', 'u3', 'Emma Thompson', '10', 'A', 'John Thompson', '+1234567890', 95, 'PAID'],
    ['s2', null, 'Liam Wilson', '10', 'A', 'Sarah Wilson', '+1234567891', 88, 'PENDING'],
    ['s3', null, 'Olivia Martinez', '10', 'B', 'Carlos Martinez', '+1234567892', 98, 'PAID']
  ];
  const stmtStudent = db.prepare("INSERT OR IGNORE INTO students (id, user_id, name, grade, section, guardian_name, contact, attendance_rate, fees_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
  students.forEach(s => stmtStudent.run(s));
  stmtStudent.finalize();

  // 3. Seed Teachers
  const teachers = [
    ['t1', 'Mr. Anderson', 'Mathematics', 'anderson@school.com', JSON.stringify(['10-A', '9-B'])],
    ['t2', 'Ms. Roberts', 'Science', 'roberts@school.com', JSON.stringify(['10-B', '8-A'])]
  ];
  const stmtTeacher = db.prepare("INSERT OR IGNORE INTO teachers (id, name, subject, email, classes) VALUES (?, ?, ?, ?, ?)");
  teachers.forEach(t => stmtTeacher.run(t));
  stmtTeacher.finalize();

  // 4. Seed Assignments
  const assignments = [
    ['as1', '10-A', 'Algebra Functions', 'Complete Chapter 4 Exercises.', '2023-10-25', 'Mathematics', 'OPEN', 'Algebra.pdf'],
    ['as2', '10-A', 'Geometry Proofs', 'Write proofs for congruency.', '2023-11-01', 'Mathematics', 'OPEN', null]
  ];
  const stmtAssign = db.prepare("INSERT OR IGNORE INTO assignments (id, classId, title, description, dueDate, subject, status, attachmentName) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  assignments.forEach(a => stmtAssign.run(a));
  stmtAssign.finalize();

  // 5. Seed Exams
  const exams = [
    ['ex1', 's1', 'Emma Thompson', 'Math', 95, 100, 'A'],
    ['ex2', 's2', 'Liam Wilson', 'Math', 78, 100, 'B'],
    ['ex3', 's3', 'Olivia Martinez', 'Math', 88, 100, 'A-']
  ];
  const stmtExam = db.prepare("INSERT OR IGNORE INTO exams (id, studentId, studentName, subject, score, total, grade) VALUES (?, ?, ?, ?, ?, ?, ?)");
  exams.forEach(e => stmtExam.run(e));
  stmtExam.finalize();

  // 6. Seed Fees
  const fees = [
    ['INV-001', 's1', 'Emma Thompson', '10', 1250, '2023-11-01', 'PAID'],
    ['INV-002', 's2', 'Liam Wilson', '10', 1250, '2023-11-01', 'PENDING']
  ];
  const stmtFee = db.prepare("INSERT OR IGNORE INTO fees (invoiceId, studentId, name, grade, amount, dueDate, feesStatus) VALUES (?, ?, ?, ?, ?, ?, ?)");
  fees.forEach(f => stmtFee.run(f));
  stmtFee.finalize();
  
  console.log("Database seeded successfully.");
};

export default db;