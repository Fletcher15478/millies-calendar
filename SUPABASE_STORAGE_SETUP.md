# Supabase Storage Setup Guide

Images are now stored in Supabase Storage instead of local files, so they persist across deployments!

## Step 1: Create Storage Bucket

1. Go to your Supabase dashboard
2. Click **Storage** in the left sidebar
3. Click **New bucket**
4. Name it: `event-photos`
5. Make it **Public** (so images can be accessed via URL)
6. Click **Create bucket**

## Step 2: Set Bucket Policies (Optional but Recommended)

1. Go to **Storage** → **Policies** → `event-photos`
2. Add a policy for public read access:
   - Policy name: "Public read access"
   - Allowed operation: `SELECT`
   - Policy definition: `true` (allows everyone to read)

3. Add a policy for authenticated uploads (if you want to restrict uploads):
   - Policy name: "Authenticated uploads"
   - Allowed operation: `INSERT`
   - Policy definition: `auth.role() = 'authenticated'`

   **OR** for service role access (what we're using):
   - Policy name: "Service role full access"
   - Allowed operation: `ALL`
   - Policy definition: `true`

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

### Upload fails
- Check that your `SUPABASE_KEY` is the **service_role** key (not anon key)
- Verify file size is under 5MB
- Check Supabase Storage logs in dashboard

