# Supabase Setup Guide

This app uses Supabase (free PostgreSQL database) for persistent event storage. Events will persist even after server restarts!

## Quick Setup with Supabase (100% Free)

### Step 1: Create Supabase Account
1. Go to https://supabase.com
2. Click "Start your project" or "Sign up"
3. Sign up with GitHub (easiest) or email
4. Create a new organization (if needed)

### Step 2: Create a New Project
1. Click "New Project"
2. Fill in:
   - **Name**: `millies-calendar` (or your choice)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free (default)
3. Click "Create new project"
4. Wait 2-3 minutes for project to be ready

### Step 3: Create Events Table

**Option A: Using SQL (Recommended - Fastest)**
1. In your Supabase dashboard, go to "SQL Editor"
2. Click "New Query"
3. Copy and paste the SQL from `create_events_table.sql` file
4. Click "Run" (or press Cmd/Ctrl + Enter)
5. Done! Table is created with all columns and indexes

**Option B: Using Table Editor (Manual)**
1. In your Supabase dashboard, go to "Table Editor"
2. Click "New Table"
3. Name it: `events`
4. Click "Save"
5. Add these columns (click "Add Column" for each):

| Column Name | Type | Default Value | Nullable | Unique |
|------------|------|---------------|----------|--------|
| id | uuid | gen_random_uuid() | No | Yes (Primary Key) |
| title | text | - | No | No |
| date | text | - | No | No |
| time | text | - | No | No |
| description | text | - | No | No |
| location | text | - | Yes | No |
| photo | text | - | Yes | No |
| featured | bool | false | No | No |
| outside | bool | false | No | No |
| publicEvent | bool | false | No | No |
| petFriendly | bool | false | No | No |
| created_at | timestamptz | now() | No | No |
| updated_at | timestamptz | now() | No | No |

6. Make `id` the Primary Key (click the key icon)
7. Click "Save"

### Step 4: Enable Row Level Security (Optional but Recommended)
1. Go to "Authentication" → "Policies"
2. For the `events` table, you can:
   - Allow public read access (for calendar viewing)
   - Or keep it private and use service role key

### Step 5: Get API Keys
1. Go to "Settings" → "API"
2. You'll see:
   - **Project URL** (this is your `SUPABASE_URL`)
   - **anon public** key (this is your `SUPABASE_KEY` for public access)
   - **service_role** key (use this for server-side, more secure)

### Step 6: Add to Render Environment Variables
1. Go to your Render dashboard
2. Select your `millies-calendar` service
3. Go to "Environment" tab
4. Add these variables:
   - **Key**: `SUPABASE_URL`
     - **Value**: Your Project URL from Step 5
   - **Key**: `SUPABASE_KEY`
     - **Value**: Your `service_role` key (or `anon public` if you set up RLS policies)
5. Save

### Step 7: Redeploy
Render will automatically redeploy when you save the environment variables.

## That's It!

Once `SUPABASE_URL` and `SUPABASE_KEY` are set, your app will:
- ✅ Connect to Supabase
- ✅ Store all events in the database
- ✅ Persist data across server restarts
- ✅ Work seamlessly with your existing code

## Free Tier Limits

Supabase free tier includes:
- ✅ 500 MB database storage
- ✅ 2 GB bandwidth
- ✅ Unlimited API requests
- ✅ Perfect for this use case!

## Migration

Existing events in `data/events.json` will need to be manually migrated. You can:
1. Export them from the file
2. Use the admin panel to recreate them, OR
3. I can create a migration script if needed

