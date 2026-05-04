const express = require('express')
const cors = require('cors')
const path = require('path')
const dotenv = require('dotenv')
const connectDB = require('./config/db')
const errorHandler = require('./middleware/errorHandler')

// Load env vars
dotenv.config()

// Connect to MongoDB
connectDB()

const app = express()

// ─── CORS CONFIGURATION (UPDATED) ───────────────────────────────────────────
// Define allowed origins for development
const allowedOrigins = [
 'https://cheery-kelpie-950241.netlify.app'
  'http://localhost:5000',
  'http://localhost:3000',
  'http://localhost:4173',
  'http://localhost:54502',    // Flutter web
  'http://localhost:8000',     // Alternative Flutter port
  'http://127.0.0.1:54502',
  'http://127.0.0.1:8000',
];

// Configure CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    // In development, allow all origins for easier testing
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // In production, check against allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Allow-Origin'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 200
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// Logging middleware for debugging CORS
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - Origin: ${req.headers.origin || 'No origin'}`);
  next();
});

// ─── OTHER MIDDLEWARE ───────────────────────────────────────────────────────
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// ─── ROUTES ─────────────────────────────────────────────────────────────────
app.use('/api/auth',         require('./routes/auth'))
app.use('/api/pharmacies',   require('./routes/pharmacies'))
app.use('/api/medicines',    require('./routes/medicines'))
app.use('/api/inventory',    require('./routes/inventory'))
app.use('/api/reservations', require('./routes/reservations'))

// ─── HEALTH CHECK ───────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '🚀 MedConnect API is running!',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    cors: {
      enabled: true,
      allowedOrigins: process.env.NODE_ENV === 'development' ? 'All origins' : allowedOrigins
    }
  })
})

// ─── TEST CORS ENDPOINT ─────────────────────────────────────────────────────
app.get('/api/test-cors', (req, res) => {
  res.json({
    success: true,
    message: 'CORS is working!',
    origin: req.headers.origin
  })
})

// ─── SERVE FRONTEND IN PRODUCTION ───────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../medconnect-frontend/dist')))
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../medconnect-frontend/dist', 'index.html'))
  })
}

// ─── 404 HANDLER ────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: `Route ${req.originalUrl} not found` 
  })
})

// ─── ERROR HANDLER ──────────────────────────────────────────────────────────
app.use(errorHandler)

// ─── START SERVER ───────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`\n🚀 MedConnect Server running on http://localhost:${PORT}`)
  console.log(`📋 API Base URL: http://localhost:${PORT}/api`)
  console.log(`🌿 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🔓 CORS: ${process.env.NODE_ENV === 'development' ? 'All origins allowed' : 'Restricted to specific origins'}`)
  console.log(`\n📌 Available Routes:`)
  console.log(`   POST   /api/auth/register`)
  console.log(`   POST   /api/auth/login`)
  console.log(`   GET    /api/auth/me`)
  console.log(`   GET    /api/pharmacies`)
  console.log(`   GET    /api/medicines`)
  console.log(`   GET    /api/medicines/search/nearby`)
  console.log(`   GET    /api/inventory`)
  console.log(`   GET    /api/inventory/alerts/low-stock`)
  console.log(`   GET    /api/reservations`)
  console.log(`   GET    /api/reservations/my`)
  console.log(`   GET    /api/health`)
  console.log(`   GET    /api/test-cors\n`)
})

module.exports = app
