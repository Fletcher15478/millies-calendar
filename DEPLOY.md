# Deploy to Render (No Database Required!)

This app uses JSON file storage, so no database setup needed! Render's free tier supports persistent file storage.

## Quick Deployment Steps

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Ready for Render deployment"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### Step 2: Deploy on Render

1. **Go to Render**: https://render.com (sign up/login - free tier available)

2. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub account if not already connected
   - Select your repository

3. **Configure Settings**:
   - **Name**: `millies-calendar` (or your choice)
   - **Environment**: `Node`
   - **Region**: Choose closest to you
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: (leave empty)
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or choose a paid plan for better performance)

4. **Set Environment Variables**:
   Click "Advanced" and add:
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = (generate a random string - you can use: `openssl rand -hex 32`)
   - `ADMIN_USERNAME` = `support@millieshomemade.com`
   - `ADMIN_PASSWORD` = (set a strong password)

5. **Deploy**:
   - Click "Create Web Service"
   - Render will build and deploy (takes 2-3 minutes)
   - Your app will be live at: `https://millies-calendar.onrender.com` (or your custom name)

### Step 3: Set Up WordPress Redirects

In your WordPress site, set up redirects:
- `/events` or `/calendar` → `https://your-app-name.onrender.com`
- `/events/calendar` → `https://your-app-name.onrender.com/calendar.html`

## Alternative: Railway.app

Railway also supports persistent storage and is very easy:

1. Go to https://railway.app
2. "New Project" → "Deploy from GitHub repo"
3. Select your repo
4. Railway auto-detects Node.js
5. Add environment variables in the Variables tab
6. Deploy!

## File Storage

✅ **Good News**: Render's free tier supports persistent file storage!
- Your `data/events.json` file will persist
- Uploaded images in `uploads/` will persist
- No database needed!

**Note**: On the free tier, the app may spin down after 15 minutes of inactivity, but files are preserved.

## After Deployment

1. **Test your app**:
   - Visit your Render URL
   - Test landing page
   - Test calendar
   - Test admin login
   - Create an event with an image upload

2. **Monitor**:
   - View logs in Render dashboard
   - Check for any errors

3. **Custom Domain** (Optional):
   - In Render dashboard → Settings → Custom Domains
   - Add your domain
   - Update DNS records as instructed

## Troubleshooting

- **Build fails**: Check build logs in Render dashboard
- **App crashes**: Check runtime logs
- **Files not persisting**: Make sure you're not on a serverless platform
- **Slow first load**: Free tier apps spin down after inactivity - first request may take 30-60 seconds

## Why Render?

- ✅ Free tier available
- ✅ Persistent file storage (no database needed!)
- ✅ Easy GitHub integration
- ✅ Automatic HTTPS
- ✅ Custom domains supported
- ✅ Perfect for JSON file storage approach
