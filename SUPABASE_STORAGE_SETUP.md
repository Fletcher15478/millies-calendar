# Supabase Storage Setup Guide

Images are now stored in Supabase Storage instead of local files, so they persist across deployments!

## Step 1: Create Storage Bucket

1. Go to your Supabase dashboard
2. Click **Storage** in the left sidebar
3. Click **New bucket**
4. Name it: `event-photos`
5. Make it **Public** (so images can be accessed via URL)
6. Click **Create bucket**

## Step 2: Configure Bucket Policies (REQUIRED)

**IMPORTANT:** If you get a "row-level security policy" error, you need to configure policies:

### Option A: Disable RLS (Easiest for public bucket)

1. Go to **Storage** → `event-photos` bucket
2. Click **Settings** (gear icon)
3. **Disable RLS** toggle (turn it OFF)
4. Save

### Option B: Add Policies (More secure)

1. Go to **Storage** → **Policies** → `event-photos`
2. Click **New Policy** → **Create policy from scratch**

3. **Policy 1: Public Read Access**
   - Policy name: "Public read access"
   - Allowed operation: `SELECT`
   - Policy definition: `true` (allows everyone to read)
   - Click **Review** → **Save policy**

4. **Policy 2: Service Role Upload Access** (REQUIRED for uploads)
   - Policy name: "Service role uploads"
   - Allowed operation: `INSERT`
   - Policy definition: `true` (allows service role to upload)
   - Click **Review** → **Save policy**

5. **Policy 3: Service Role Delete Access** (for updates/deletes)
   - Policy name: "Service role deletes"
   - Allowed operation: `DELETE`
   - Policy definition: `true`
   - Click **Review** → **Save policy**

## Step 3: Verify Setup

That's it! The code will automatically:
- Upload images to `event-photos` bucket
- Generate public URLs for images
- Store URLs in the database
- Delete old images when events are updated/deleted

## Benefits

✅ **Images persist** across deployments  
✅ **No file system limitations** on Render  
✅ **Scalable** - Supabase Storage handles large files  
✅ **CDN-backed** - Fast image delivery  
✅ **Free tier** - 1 GB storage included

## Troubleshooting

### "Bucket not found" error
- Make sure the bucket is named exactly `event-photos`
- Check that the bucket is created in your Supabase project

### Images not showing
- Verify the bucket is set to **Public**
- Check that the public URL policy is set correctly
- Look at browser console for any CORS errors

### Upload fails with "row-level security policy" error
- **This is the most common issue!** The bucket has RLS enabled but no policies
- **Solution:** Follow Step 2 above to either disable RLS or add upload policies
- Make sure you add an `INSERT` policy with definition `true` for service role access

### Other upload issues
- Check that your `SUPABASE_KEY` is the **service_role** key (not anon key)
- Verify file size is under 5MB
- Check Supabase Storage logs in dashboard

