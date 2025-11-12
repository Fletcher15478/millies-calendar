# Millies Calendar & Landing Page

This project contains a landing page and calendar system for Millies events and catering services.

## Features

- **Landing Page**: Navigation page directing to birthday parties, fundraisers, and catering form pages
- **Calendar Page**: Full-featured event calendar with backend API
- **Event Management**: Create, read, update, and delete events with photos
- **Backend API**: RESTful API for managing events

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create an `uploads` directory for event photos (created automatically on first run)

3. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

4. Open your browser:
- Landing page: `http://localhost:3000`
- Calendar page: `http://localhost:3000/calendar.html`

## Customization

### Colors
Update the CSS variables in `public/styles.css`:
```css
:root {
    --primary-color: #your-color;
    --secondary-color: #your-color;
    --accent-color: #your-color;
    /* ... */
}
```

### Images
Place your images in `public/images/`:
- `birthday-placeholder.jpg` - Birthday parties card image
- `fundraiser-placeholder.jpg` - Fundraisers card image
- `catering-placeholder.jpg` - Catering card image

Update the image paths in `public/index.html` if needed.

### Form Page URLs
Update the JavaScript in `public/index.html` to point to your actual form pages:
```javascript
document.getElementById('birthday-card').href = 'your-birthday-page-url';
document.getElementById('fundraiser-card').href = 'your-fundraiser-page-url';
document.getElementById('catering-card').href = 'your-catering-page-url';
```

## API Endpoints

- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get single event
- `POST /api/events` - Create new event (multipart/form-data)
- `PUT /api/events/:id` - Update event (multipart/form-data)
- `DELETE /api/events/:id` - Delete event

## Event Data Structure

```json
{
  "id": "string",
  "title": "string",
  "date": "YYYY-MM-DD",
  "time": "HH:MM",
  "description": "string",
  "photo": "/uploads/filename.jpg",
  "createdAt": "ISO date string"
}
```

## Deployment

1. Set the `PORT` environment variable if needed
2. Ensure the `uploads` directory is writable
3. For production, consider:
   - Using a database instead of in-memory storage
   - Adding authentication
   - Setting up proper file storage (S3, etc.)
   - Adding CORS restrictions

## Notes

- Events are stored in memory and will be lost on server restart
- For production, integrate with a database (MongoDB, PostgreSQL, etc.)
- Photo uploads are limited to 5MB and image files only

