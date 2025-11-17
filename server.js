const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

// Supabase connection
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
let supabase = null;

if (SUPABASE_URL && SUPABASE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  console.log('Connected to Supabase');
} else {
  console.log('Supabase credentials not set, falling back to file-based storage');
}

// Allowed admin emails (add your three user emails here)
const ALLOWED_ADMIN_EMAILS = process.env.ALLOWED_ADMIN_EMAILS 
  ? process.env.ALLOWED_ADMIN_EMAILS.split(',')
  : ['support@millieshomemade.com']; // Default, add your three emails

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || `${process.env.BASE_URL || 'http://localhost:3000'}/api/auth/google/callback`;

// JWT Secret (needed for session)
const JWT_SECRET = process.env.JWT_SECRET || 'millies-secret-key-change-in-production';

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Configure Google OAuth Strategy
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: GOOGLE_CALLBACK_URL
  },
  async (accessToken, refreshToken, profile, done) => {
    const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
    
    // Check if email is in allowed list
    if (email && ALLOWED_ADMIN_EMAILS.includes(email.toLowerCase())) {
      return done(null, {
        id: profile.id,
        email: email,
        name: profile.displayName,
        photo: profile.photos && profile.photos[0] ? profile.photos[0].value : null
      });
    } else {
      return done(null, false, { message: 'Email not authorized' });
    }
  }));

  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user, done) => {
    done(null, user);
  });
  
  console.log('Google OAuth configured');
} else {
  console.log('Google OAuth credentials not set. Google sign-in will be disabled.');
}

// Middleware
app.use(cors({
  origin: true,
  credentials: true // Allow cookies
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Ensure uploads and data directories exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory:', uploadsDir);
}

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('Created data directory:', dataDir);
}

// Verify directories exist on startup
console.log('Uploads directory exists:', fs.existsSync(uploadsDir), uploadsDir);
console.log('Data directory exists:', fs.existsSync(dataDir), dataDir);

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

// Google OAuth Routes
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  // Initiate Google OAuth
  app.get('/api/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  // Google OAuth callback
  app.get('/api/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/admin.html?error=unauthorized' }),
    (req, res) => {
      // Successful authentication, redirect to admin page
      res.redirect('/admin.html?googleAuth=success');
    }
  );

  // Check Google auth status
  app.get('/api/auth/status', (req, res) => {
    if (req.user) {
      res.json({ 
        authenticated: true, 
        user: {
          email: req.user.email,
          name: req.user.name,
          photo: req.user.photo
        }
      });
    } else {
      res.json({ authenticated: false });
    }
  });

  // Logout
  app.post('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: 'Logout failed' });
      }
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ error: 'Session destruction failed' });
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'Logged out successfully' });
      });
    });
  });
}

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
app.get('/api/events', async (req, res) => {
  try {
    if (supabase) {
      // Use Supabase
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });
      
      if (error) throw error;
      
      // Sort: featured first, then by date
      const sorted = data.sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return new Date(a.date) - new Date(b.date);
      });
      
      // Convert id field for compatibility
      const formatted = sorted.map(e => ({
        ...e,
        id: e.id.toString()
      }));
      res.json(formatted);
    } else {
      // Fallback to file system
      events = loadEvents();
      const sorted = events.sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return new Date(a.date) - new Date(b.date);
      });
      res.json(sorted);
    }
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single event
app.get('/api/events/:id', async (req, res) => {
  try {
    if (supabase) {
      // Use Supabase
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', req.params.id)
        .single();
      
      if (error) throw error;
      if (!data) {
        return res.status(404).json({ error: 'Event not found' });
      }
      res.json({ ...data, id: data.id.toString() });
    } else {
      // Fallback to file system
      events = loadEvents();
      const event = events.find(e => e.id === req.params.id);
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
      res.json(event);
    }
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new event
app.post('/api/events', upload.single('photo'), async (req, res) => {
  try {
    const { title, date, description, time, featured, location, outside, publicEvent, petFriendly } = req.body;
    
    console.log('Received location:', location);
    
    if (!title || !date || !description || !time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Helper function to convert string/boolean to boolean
    const toBoolean = (value) => {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') return value === 'true' || value.toLowerCase() === 'true';
      return false;
    };

    const eventData = {
      title,
      date,
      description,
      time,
      location: (location && typeof location === 'string' && location.trim()) ? location.trim() : null,
      featured: toBoolean(featured),
      outside: toBoolean(outside),
      publicEvent: toBoolean(publicEvent),
      petFriendly: toBoolean(petFriendly),
      photo: req.file ? `/uploads/${req.file.filename}` : null
    };

    if (supabase) {
      // Use Supabase
      const { data, error } = await supabase
        .from('events')
        .insert([eventData])
        .select()
        .single();
      
      if (error) throw error;
      console.log('Event saved to Supabase:', data.id);
      if (req.file) {
        console.log('Image saved to:', req.file.path);
      }
      res.status(201).json({ ...data, id: data.id.toString() });
    } else {
      // Fallback to file system
      events = loadEvents();
      const event = {
        id: Date.now().toString(),
        ...eventData,
        createdAt: new Date().toISOString()
      };
      if (req.file) {
        console.log('Image saved to:', req.file.path);
      }
      events.push(event);
      saveEvents(events);
      console.log('Event saved to file. Total events:', events.length);
      res.status(201).json(event);
    }
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update event
app.put('/api/events/:id', upload.single('photo'), async (req, res) => {
  try {
    const { title, date, description, time, featured, location, outside, publicEvent, petFriendly } = req.body;

    if (supabase) {
      // Use Supabase
      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (date !== undefined) updateData.date = date;
      if (description !== undefined) updateData.description = description;
      if (time !== undefined) updateData.time = time;
      if (location !== undefined) {
        updateData.location = (location && typeof location === 'string' && location.trim()) ? location.trim() : null;
      }
      if (featured !== undefined) updateData.featured = featured === 'true' || featured === true;
      if (outside !== undefined) updateData.outside = outside === 'true' || outside === true;
      if (publicEvent !== undefined) updateData.publicEvent = publicEvent === 'true' || publicEvent === true;
      if (petFriendly !== undefined) updateData.petFriendly = petFriendly === 'true' || petFriendly === true;
      if (req.file) updateData.photo = `/uploads/${req.file.filename}`;

      const { data, error } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', req.params.id)
        .select()
        .single();
      
      if (error) throw error;
      if (!data) {
        return res.status(404).json({ error: 'Event not found' });
      }
      res.json({ ...data, id: data.id.toString() });
    } else {
      // Fallback to file system
      events = loadEvents();
      const eventIndex = events.findIndex(e => e.id === req.params.id);
      
      if (eventIndex === -1) {
        return res.status(404).json({ error: 'Event not found' });
      }

      const existingEvent = events[eventIndex];
      let finalLocation = existingEvent.location;
      if (location !== undefined) {
        finalLocation = (location && typeof location === 'string' && location.trim()) ? location.trim() : null;
      }

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
    }
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete event
app.delete('/api/events/:id', async (req, res) => {
  try {
    if (supabase) {
      // Use Supabase
      // First get the event to check for photo
      const { data: event, error: fetchError } = await supabase
        .from('events')
        .select('photo')
        .eq('id', req.params.id)
        .single();
      
      if (fetchError || !event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      // Delete photo file if it exists
      if (event.photo) {
        const photoPath = path.join(__dirname, event.photo);
        if (fs.existsSync(photoPath)) {
          fs.unlinkSync(photoPath);
        }
      }

      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', req.params.id);
      
      if (error) throw error;
      res.json({ message: 'Event deleted successfully' });
    } else {
      // Fallback to file system
      events = loadEvents();
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
    }
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: error.message });
  }
});

// Static files (must come after API routes)
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
