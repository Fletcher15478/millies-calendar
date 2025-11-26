const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Supabase connection
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY; // Service role key for server
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY; // Anon key for client auth
let supabase = null;

// User email to name mapping
const USER_NAMES = {
  'lauren@millieshomemade.com': 'Lauren',
  'caroline@millieshomemade.com': 'Caroline',
  'support@millieshomemade.com': 'Fletcher'
};

// Allowed admin emails
const ALLOWED_EMAILS = Object.keys(USER_NAMES);

if (SUPABASE_URL && SUPABASE_KEY) {
  // Create Supabase client with service role key (bypasses RLS)
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  console.log('Connected to Supabase');
} else {
  console.log('Supabase credentials not set, falling back to file-based storage');
}

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'millies-secret-key-change-in-production';

// Middleware
app.use(cors());
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

// Helper function to upload image to Supabase Storage
async function uploadImageToSupabase(file) {
  if (!supabase || !file) {
    console.log('uploadImageToSupabase: Missing supabase client or file', { hasSupabase: !!supabase, hasFile: !!file });
    return null;
  }

  try {
    const fileExt = path.extname(file.originalname);
    const fileName = `event-${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
    const filePath = `event-photos/${fileName}`;

    console.log('Uploading image to Supabase Storage:', { fileName, filePath, size: file.buffer?.length, mimetype: file.mimetype });

    // Upload to Supabase Storage using service role (should bypass RLS)
    const { data, error } = await supabase.storage
      .from('event-photos')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
        cacheControl: '3600'
      });

    if (error) {
      console.error('Error uploading to Supabase Storage:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // Check for specific error types
      if (error.message && error.message.includes('Bucket not found')) {
        console.error('⚠️  BUCKET NOT FOUND! Please create a bucket named "event-photos" in Supabase Storage');
      } else if (error.message && error.message.includes('row-level security')) {
        console.error('⚠️  RLS POLICY ISSUE! The bucket has RLS enabled. You need to:');
        console.error('   1. Go to Supabase Dashboard → Storage → Policies');
        console.error('   2. For the "event-photos" bucket, add a policy:');
        console.error('      - Policy name: "Allow service role uploads"');
        console.error('      - Allowed operation: INSERT');
        console.error('      - Policy definition: true');
        console.error('   OR disable RLS on the bucket (Settings → Disable RLS)');
      }
      
      return null;
    }

    console.log('Image uploaded successfully:', data);

    // Get public URL - try different methods
    let publicUrl = null;
    
    // Method 1: getPublicUrl (returns { data: { publicUrl: ... } })
    const { data: urlData } = supabase.storage
      .from('event-photos')
      .getPublicUrl(filePath);
    
    if (urlData && urlData.publicUrl) {
      publicUrl = urlData.publicUrl;
    } else if (urlData && typeof urlData === 'string') {
      // Sometimes it returns the URL directly
      publicUrl = urlData;
    } else {
      // Construct URL manually if needed
      const projectUrl = SUPABASE_URL.replace('/rest/v1', '');
      publicUrl = `${projectUrl}/storage/v1/object/public/event-photos/${filePath}`;
    }

    console.log('Public URL generated:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('Error in uploadImageToSupabase:', error);
    console.error('Error stack:', error.stack);
    return null;
  }
}

// Configure multer for file uploads (memory storage for Supabase)
const storage = multer.memoryStorage();

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

// Supabase Auth endpoints

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

// Supabase Auth: Signup (create password)
app.post('/api/admin/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const emailLower = email.toLowerCase().trim();
    
    // Check if email is allowed
    if (!ALLOWED_EMAILS.includes(emailLower)) {
      return res.status(403).json({ error: 'Email not authorized' });
    }

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const userExists = existingUsers?.users?.some(u => u.email?.toLowerCase() === emailLower);

    if (userExists) {
      return res.status(400).json({ error: 'User already exists. Please sign in instead.' });
    }

    // Create user with Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email: emailLower,
      password: password,
      email_confirm: true // Auto-confirm email
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Sign in the user
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: emailLower,
      password: password
    });

    if (signInError) {
      return res.status(400).json({ error: signInError.message });
    }

    res.json({
      token: signInData.session.access_token,
      user: {
        email: signInData.user.email,
        name: USER_NAMES[emailLower] || 'Admin'
      },
      message: 'Account created successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Supabase Auth: Signin (login)
app.post('/api/admin/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const emailLower = email.toLowerCase().trim();
    
    // Check if email is allowed
    if (!ALLOWED_EMAILS.includes(emailLower)) {
      return res.status(403).json({ error: 'Email not authorized' });
    }

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailLower,
      password: password
    });

    if (error) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json({
      token: data.session.access_token,
      user: {
        email: data.user.email,
        name: USER_NAMES[emailLower] || 'Admin'
      },
      message: 'Login successful'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check if user exists
app.post('/api/admin/check-user', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !supabase) {
      return res.json({ exists: false });
    }

    const emailLower = email.toLowerCase().trim();
    
    // Check if email is allowed
    if (!ALLOWED_EMAILS.includes(emailLower)) {
      return res.status(403).json({ error: 'Email not authorized' });
    }

    // Check if user exists in Supabase Auth
    const { data: users } = await supabase.auth.admin.listUsers();
    const userExists = users?.users?.some(u => u.email?.toLowerCase() === emailLower);

    res.json({ exists: userExists || false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user info (for welcome message)
app.get('/api/admin/user', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token || !supabase) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if email is allowed
    const email = user.email.toLowerCase();
    if (!ALLOWED_EMAILS.includes(email)) {
      return res.status(403).json({ error: 'Email not authorized' });
    }

    res.json({
      email: user.email,
      name: USER_NAMES[email] || 'Admin'
    });
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

    // Upload image to Supabase Storage if provided
    let photoUrl = null;
    if (req.file) {
      console.log('File received:', { 
        originalname: req.file.originalname, 
        mimetype: req.file.mimetype, 
        size: req.file.buffer?.length,
        hasSupabase: !!supabase 
      });
      
      if (supabase) {
        photoUrl = await uploadImageToSupabase(req.file);
        if (!photoUrl) {
          console.error('Failed to upload image to Supabase Storage');
          // Don't block event creation - allow event without photo
          // User can see the error in console logs
          console.warn('Continuing with event creation without photo');
        }
      } else {
        // Fallback to local storage if Supabase not configured
        const filename = `event-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(req.file.originalname)}`;
        photoUrl = `/uploads/${filename}`;
        // Save file locally
        fs.writeFileSync(path.join(uploadsDir, filename), req.file.buffer);
        console.log('Image saved locally:', photoUrl);
      }
    }

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
      photo: photoUrl
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
      if (photoUrl) {
        console.log('Image saved to Supabase Storage:', photoUrl);
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
        // Save file locally for fallback
        fs.writeFileSync(path.join(uploadsDir, req.file.filename), req.file.buffer);
        console.log('Image saved to:', path.join(uploadsDir, req.file.filename));
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
      
      // Upload new image to Supabase Storage if provided
      if (req.file) {
        // Get old photo URL to delete it later
        const { data: oldEvent } = await supabase
          .from('events')
          .select('photo')
          .eq('id', req.params.id)
          .single();
        
        const newPhotoUrl = await uploadImageToSupabase(req.file);
        if (newPhotoUrl) {
          updateData.photo = newPhotoUrl;
          
          // Delete old image from Supabase Storage if it exists
          if (oldEvent?.photo && oldEvent.photo.includes('supabase.co/storage')) {
            try {
              const oldPath = oldEvent.photo.split('/storage/v1/object/public/event-photos/')[1];
              if (oldPath) {
                await supabase.storage
                  .from('event-photos')
                  .remove([`event-photos/${oldPath}`]);
              }
            } catch (deleteError) {
              console.warn('Could not delete old image:', deleteError);
            }
          }
        } else {
          console.warn('Failed to upload new image, keeping old photo');
        }
      }

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
        photo: (() => {
          if (req.file) {
            // Save file locally for fallback
            const filename = `event-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(req.file.originalname)}`;
            fs.writeFileSync(path.join(uploadsDir, filename), req.file.buffer);
            return `/uploads/${filename}`;
          }
          return existingEvent.photo;
        })(),
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

      // Delete photo from Supabase Storage if it exists
      if (event.photo) {
        if (event.photo.includes('supabase.co/storage')) {
          // Extract file path from Supabase URL
          try {
            const urlParts = event.photo.split('/storage/v1/object/public/event-photos/');
            if (urlParts.length > 1) {
              const filePath = `event-photos/${urlParts[1]}`;
              await supabase.storage
                .from('event-photos')
                .remove([filePath]);
            }
          } catch (deleteError) {
            console.warn('Could not delete image from Supabase Storage:', deleteError);
          }
        } else {
          // Fallback: delete local file
          const photoPath = path.join(__dirname, event.photo);
          if (fs.existsSync(photoPath)) {
            fs.unlinkSync(photoPath);
          }
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

// Clean URL routes
app.get('/events', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/calendar', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'calendar.html'));
});

// Root redirects to /events
app.get('/', (req, res) => {
  res.redirect('/events');
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
