const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Ensure uploads and data directories exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const eventsFile = path.join(dataDir, 'events.json');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'event-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Load events from JSON file
function loadEvents() {
  try {
    if (fs.existsSync(eventsFile)) {
      const data = fs.readFileSync(eventsFile, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading events:', error);
  }
  return [];
}

// Save events to JSON file
function saveEvents(eventsArray) {
  try {
    fs.writeFileSync(eventsFile, JSON.stringify(eventsArray, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving events:', error);
    throw error;
  }
}

// Initialize events from file
let events = loadEvents();

// Admin credentials (in production, store in database with hashed passwords)
// Default: username: support@millieshomemade.com, password: Password1
// Change these in production!
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'support@millieshomemade.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Password1';
const JWT_SECRET = process.env.JWT_SECRET || 'millies-secret-key-change-in-production';

// Simple authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// API Routes (must come before static files)
// Admin login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Simple authentication (in production, use database and bcrypt)
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const token = jwt.sign(
        { username: username, admin: true },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      res.json({ token, message: 'Login successful' });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all events (public) - featured events first, then by date
app.get('/api/events', (req, res) => {
  const sorted = events.sort((a, b) => {
    // Featured events first
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    // Then by date
    return new Date(a.date) - new Date(b.date);
  });
  res.json(sorted);
});

// Get single event
app.get('/api/events/:id', (req, res) => {
  const event = events.find(e => e.id === req.params.id);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }
  res.json(event);
});

// Create new event
app.post('/api/events', upload.single('photo'), (req, res) => {
  try {
    const { title, date, description, time, featured, location, outside, publicEvent, petFriendly } = req.body;
    
    console.log('Received location:', location); // Debug log
    
    if (!title || !date || !description || !time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const event = {
      id: Date.now().toString(),
      title,
      date,
      description,
      time,
      location: (location && typeof location === 'string' && location.trim()) ? location.trim() : null,
      featured: featured === 'true' || featured === true,
      outside: outside === 'true' || outside === true,
      publicEvent: publicEvent === 'true' || publicEvent === true,
      petFriendly: petFriendly === 'true' || petFriendly === true,
      photo: req.file ? `/uploads/${req.file.filename}` : null,
      createdAt: new Date().toISOString()
    };

    console.log('Saving event with location:', event.location); // Debug log

    events.push(event);
    saveEvents(events);
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update event
app.put('/api/events/:id', upload.single('photo'), (req, res) => {
  const eventIndex = events.findIndex(e => e.id === req.params.id);
  
  if (eventIndex === -1) {
    return res.status(404).json({ error: 'Event not found' });
  }

  const { title, date, description, time, featured, location, outside, publicEvent, petFriendly } = req.body;
  const existingEvent = events[eventIndex];

  console.log('Update - Received location:', location); // Debug log

  let finalLocation = existingEvent.location;
  if (location !== undefined) {
    finalLocation = (location && typeof location === 'string' && location.trim()) ? location.trim() : null;
  }

  console.log('Update - Final location:', finalLocation); // Debug log

  events[eventIndex] = {
    ...existingEvent,
    title: title || existingEvent.title,
    date: date || existingEvent.date,
    description: description || existingEvent.description,
    time: time || existingEvent.time,
    location: finalLocation,
    featured: featured === 'true' || featured === true || (featured === undefined ? existingEvent.featured : false),
    outside: outside === 'true' || outside === true || (outside === undefined ? existingEvent.outside : false),
    publicEvent: publicEvent === 'true' || publicEvent === true || (publicEvent === undefined ? existingEvent.publicEvent : false),
    petFriendly: petFriendly === 'true' || petFriendly === true || (petFriendly === undefined ? existingEvent.petFriendly : false),
    photo: req.file ? `/uploads/${req.file.filename}` : existingEvent.photo,
    updatedAt: new Date().toISOString()
  };

  saveEvents(events);
  res.json(events[eventIndex]);
});

// Delete event
app.delete('/api/events/:id', (req, res) => {
  const eventIndex = events.findIndex(e => e.id === req.params.id);
  
  if (eventIndex === -1) {
    return res.status(404).json({ error: 'Event not found' });
  }

  const event = events[eventIndex];
  
  // Delete photo file if it exists
  if (event.photo) {
    const photoPath = path.join(__dirname, event.photo);
    if (fs.existsSync(photoPath)) {
      fs.unlinkSync(photoPath);
    }
  }

  events.splice(eventIndex, 1);
  saveEvents(events);
  res.json({ message: 'Event deleted successfully' });
});

// Static files (must come after API routes)
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
