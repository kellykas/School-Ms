import express, { NextFunction } from 'express';
import router from './routes';
import { initDb } from './database';

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Database
initDb();

// Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} | Origin: ${req.headers.origin || 'Direct'}`);
  next();
});

// DYNAMIC CORS MIDDLEWARE
// This reflects the request origin to allow credentials/auth headers to work correctly.
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // If an origin is present (browser request), allow it specifically
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    // If no origin (e.g. Postman/Curl), allow all
    res.header('Access-Control-Allow-Origin', '*');
  }

  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true'); // Critical for auth headers
  
  // Handle preflight requests immediately
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Increase payload limit for file uploads (e.g. CSV import)
app.use(express.json({ limit: '50mb' }) as any);

// Root Route for Browser Testing
app.get('/', (req, res) => {
  res.json({ 
    status: 'EduSphere Backend Running', 
    timestamp: new Date(),
    port: PORT,
    instructions: 'Frontend is running on a different port. Use the API endpoints at /api'
  });
});

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// API Routes
app.use('/api', router);

// Error handling middleware
app.use((err: any, req: any, res: any, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', details: err.message });
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`===========================================================`);
  console.log(`EduSphere Backend is LIVE`);
  console.log(`- URL: http://127.0.0.1:${PORT}`);
  console.log(`- Test in Browser: http://localhost:${PORT}`);
  console.log(`- CORS Policy: Dynamic Origin Reflection (Credentials Allowed)`);
  console.log(`===========================================================`);
});