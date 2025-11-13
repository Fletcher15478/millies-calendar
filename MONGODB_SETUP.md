# MongoDB Setup Guide

This app now uses MongoDB for persistent event storage. Events will persist even after server restarts!

## Quick Setup with MongoDB Atlas (Free Tier)

### Step 1: Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up for a free account
3. Create a free cluster (M0 - Free tier)

### Step 2: Create Database User
1. In Atlas dashboard, go to "Database Access"
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Create a username and strong password
5. Set privileges to "Atlas admin" or "Read and write to any database"
6. Click "Add User"

### Step 3: Whitelist Your IP
1. Go to "Network Access"
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (or add Render's IP ranges)
4. Click "Confirm"

### Step 4: Get Connection String
1. Go to "Database" → "Connect"
2. Choose "Connect your application"
3. Copy the connection string
4. It will look like: `mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority`
5. Replace `<password>` with your actual password
6. Replace `<database>` with `millies-calendar` (or your preferred name)

### Step 5: Add to Render Environment Variables
1. Go to your Render dashboard
2. Select your `millies-calendar` service
3. Go to "Environment" tab
4. Add new variable:
   - **Key**: `MONGODB_URI`
   - **Value**: Your MongoDB connection string (from Step 4)
5. Save

### Step 6: Redeploy
Render will automatically redeploy when you save the environment variable.

## That's It!

Once `MONGODB_URI` is set, your app will automatically:
- Connect to MongoDB
- Store all events in the database
- Persist data across server restarts
- Work seamlessly with your existing code

## Fallback Mode

If `MONGODB_URI` is not set, the app will fall back to file-based storage (for local development).

## Migration

Existing events in `data/events.json` will need to be manually migrated. You can:
1. Export them from the file
2. Use the admin panel to recreate them, OR
3. Create a migration script (let me know if you need help with this)

