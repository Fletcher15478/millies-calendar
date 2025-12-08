# Setting Up Custom Domain with Render

This guide walks you through buying a domain on domain.com and connecting it to your Render deployment.

## Step 1: Buy Domain on domain.com

1. Go to **https://www.domain.com**
2. Search for your desired domain (e.g., `milliescalendar.com`, `milliesevents.com`)
3. Add it to cart and complete the purchase
4. Complete the registration process
5. **Important**: Note down where your domain DNS is managed (usually domain.com's nameservers)

## Step 2: Add Custom Domain in Render

1. Log into **Render Dashboard**: https://dashboard.render.com
2. Click on your **Web Service** (millies-calendar)
3. Go to **Settings** tab (left sidebar)
4. Scroll down to **Custom Domains** section
5. Click **Add Custom Domain**
6. Enter your domain name (e.g., `milliescalendar.com`)
7. Click **Save**

**Render will show you DNS records to add** - keep this page open!

## Step 3: Configure DNS Records on domain.com

You'll need to add DNS records in domain.com's DNS management:

### Option A: Using CNAME (Recommended for subdomains)

If Render shows a CNAME record:

1. Log into **domain.com**
2. Go to **My Domains** → Select your domain
3. Click **DNS Management** or **Manage DNS**
4. Click **Add Record** or **Add DNS Record**
5. Add the CNAME record:
   - **Type**: CNAME
   - **Host/Name**: `@` (or leave blank for root domain) or `www` (for www subdomain)
   - **Value/Points to**: The CNAME value Render provided (e.g., `millies-calendar.onrender.com`)
   - **TTL**: 3600 (or default)
6. Click **Save**

### Option B: Using A Record (For root domain)

If Render shows A records:

1. Log into **domain.com**
2. Go to **My Domains** → Select your domain
3. Click **DNS Management** or **Manage DNS**
4. Click **Add Record** or **Add DNS Record**
5. Add the A record:
   - **Type**: A
   - **Host/Name**: `@` (or leave blank for root domain)
   - **Value/Points to**: The IP address Render provided
   - **TTL**: 3600 (or default)
6. Click **Save**

**Note**: Render may provide multiple A records - add all of them.

## Step 4: Wait for DNS Propagation

- DNS changes can take **5 minutes to 48 hours** to propagate
- Usually takes **15-30 minutes**
- You can check status in Render dashboard (it will show "Pending" then "Live")

## Step 5: Verify SSL Certificate

- Render automatically provisions SSL certificates via Let's Encrypt
- This happens automatically once DNS is verified
- May take a few minutes after DNS propagates

## Step 6: Test Your Domain

Once DNS propagates and SSL is active:

1. Visit `https://yourdomain.com/events` - Should show landing page
2. Visit `https://yourdomain.com/calendar` - Should show calendar
3. Visit `https://www.yourdomain.com/events` - If you set up www subdomain

## Troubleshooting

### DNS Not Working After 30 Minutes
- Double-check DNS records match exactly what Render provided
- Verify you saved the records in domain.com
- Check domain.com's DNS propagation status
- Try using a DNS checker: https://dnschecker.org

### SSL Certificate Not Issuing
- Wait 10-15 minutes after DNS propagates
- Check Render dashboard for SSL status
- Make sure you're accessing via HTTPS

### Domain Shows "Pending" in Render
- DNS hasn't propagated yet - wait longer
- Verify DNS records are correct
- Check that domain.com's nameservers are active

### Can't Find DNS Management in domain.com
- Look for "DNS", "DNS Management", "DNS Settings", or "Name Servers"
- May be under "Advanced Settings" or "Domain Settings"
- Contact domain.com support if you can't find it

## What Your URLs Will Be

After setup:
- **Landing Page**: `https://yourdomain.com/events`
- **Calendar**: `https://yourdomain.com/calendar`
- **Admin Panel**: `https://yourdomain.com/admin.html`

## Need Help?

If you get stuck:
1. Check Render dashboard for any error messages
2. Verify DNS records match Render's requirements exactly
3. Contact domain.com support for DNS management help
4. Check Render's documentation: https://render.com/docs/custom-domains

