# Millie's Calendar & Landing Page

**Status: ✅ Production Ready & Deployed**

A full-featured event calendar and landing page system for Millie's Homemade Ice Cream, deployed and running in production.

## 🌐 Live Application

This application is fully deployed and operational in production on Render, with persistent data storage via Supabase.

## Features

### Public Features
- **Landing Page**: Beautiful landing page with navigation to birthday parties, fundraisers, catering, and calendar
- **Event Calendar**: Interactive calendar displaying all events with filtering by month
- **Event Details**: Click events to see full details, location (with Google Maps integration), and add to calendar
- **Mobile Responsive**: Fully optimized for mobile devices with hamburger menu and responsive layouts
- **Featured Events**: Highlight important events at the top of the calendar

### Admin Features
- **Secure Authentication**: Supabase Auth with password-based login for authorized users
- **Event Management**: Full CRUD operations (Create, Read, Update, Delete) for events
- **Photo Uploads**: Upload and manage event photos
- **CSV Import**: Bulk import events from CSV files
- **Event Attributes**: Mark events as featured, outside, public, or pet-friendly
- **Personalized Dashboard**: Welcome message personalized for each admin user

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **File Storage**: Local file system (uploads directory)
- **Deployment**: Render

## Admin Users

The following users have access to the admin panel:
- `lauren@millieshomemade.com`
- `caroline@millieshomemade.com`
- `support@millieshomemade.com`

Each user creates their own password on first login.

## Setup (For Development)

1. **Install dependencies:**
```bash
npm install
```

2. **Environment Variables:**
Create a `.env` file or set in your deployment platform:
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_service_role_key
PORT=3000
```

3. **Start the server:**
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

4. **Access the application:**
- Landing page: `http://localhost:3000`
- Calendar page: `http://localhost:3000/calendar.html`
- Admin panel: `http://localhost:3000/admin.html`

## Production Deployment

### Current Deployment
- **Platform**: Render
- **Database**: Supabase (PostgreSQL)
- **Status**: ✅ Live and operational

### Required Environment Variables (Render)
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_KEY` - Your Supabase service_role key (for admin operations)
- `PORT` - Server port (automatically set by Render)

### Database Setup
The application uses Supabase for:
- **Events Storage**: All events are stored in the `events` table
- **User Authentication**: Admin users managed through Supabase Auth
- **Data Persistence**: All data persists across server restarts

See `SUPABASE_SETUP.md` for detailed database setup instructions.

## API Endpoints

### Public Endpoints
- `GET /api/events` - Get all events (sorted by featured, then date)
- `GET /api/events/:id` - Get single event by ID

### Admin Endpoints (Authentication Required)
- `POST /api/admin/signup` - Create new admin account (first-time password setup)
- `POST /api/admin/signin` - Login with email and password
- `POST /api/admin/check-user` - Check if user exists
- `GET /api/admin/user` - Get current user info
- `POST /api/events` - Create new event (multipart/form-data)
- `PUT /api/events/:id` - Update event (multipart/form-data)
- `DELETE /api/events/:id` - Delete event

## Event Data Structure

```json
{
  "id": "uuid",
  "title": "string",
  "date": "YYYY-MM-DD",
  "time": "HH:MM",
  "description": "string",
  "location": "string (optional)",
  "photo": "/uploads/filename.jpg (optional)",
  "featured": false,
  "outside": false,
  "publicEvent": false,
  "petFriendly": false,
  "created_at": "ISO timestamp",
  "updated_at": "ISO timestamp"
}
```

## CSV Import Format

The admin panel supports bulk importing events via CSV. Required columns:
- `title` (required)
- `date` (required, format: YYYY-MM-DD)
- `time` (required, format: HH:MM, 24-hour)
- `description` (required)

Optional columns:
- `location`
- `featured` (true/false)
- `outside` (true/false)
- `publicEvent` (true/false)
- `petFriendly` (true/false)

## File Structure

```
Calendar/
├── public/              # Frontend files
│   ├── index.html      # Landing page
│   ├── calendar.html   # Calendar page
│   ├── admin.html      # Admin panel
│   ├── styles.css      # All styles
│   ├── calendar.js     # Calendar functionality
│   ├── admin.js        # Admin panel functionality
│   └── images/         # Image assets
├── server.js           # Express server & API
├── package.json        # Dependencies
├── uploads/            # Event photo storage
└── SUPABASE_SETUP.md   # Database setup guide
```

## Security Features

- ✅ Supabase Auth for secure admin authentication
- ✅ Email-based access control (only authorized emails can access admin)
- ✅ Password-based authentication
- ✅ Session management with JWT tokens
- ✅ Secure file uploads with validation

## Mobile Responsiveness

The application is fully responsive with:
- Hamburger menu for mobile navigation
- Responsive grid layouts for event tiles
- Mobile-optimized image displays
- Touch-friendly interface elements

## Notes

- ✅ **Production Ready**: Fully deployed and operational
- ✅ **Data Persistence**: All events stored in Supabase database
- ✅ **User Management**: Secure authentication via Supabase Auth
- ✅ **File Uploads**: Event photos stored locally in `uploads/` directory
- ✅ **CSV Import**: Bulk event creation supported
- Photo uploads are limited to image files
- Events are automatically sorted: featured first, then by date

## Support

For issues or questions, contact: support@millieshomemade.com
