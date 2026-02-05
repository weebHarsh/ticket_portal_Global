# Cloudflare R2 Setup Guide

This guide will help you set up Cloudflare R2 storage for file attachments in the Ticketing Portal.

## Why Cloudflare R2?

- ✅ **10 GB free storage** per month
- ✅ **FREE egress** (unlimited downloads)
- ✅ **S3-compatible** API
- ✅ **No surprise costs**
- ✅ **Works with Vercel serverless**

## Step 1: Create Cloudflare Account

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/sign-up)
2. Sign up for a free account
3. Verify your email

## Step 2: Create R2 Bucket

1. Log into [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **R2** in the left sidebar
3. Click **"Create bucket"**
4. **Bucket name**: `ticketing-portal-attachments` (or any name you prefer)
5. **Location**: Choose "Automatic" (or closest region)
6. Click **"Create bucket"**

## Step 3: Enable Public Access (for file downloads)

1. In your bucket, go to **Settings** tab
2. Scroll to **"Public access"** section
3. Click **"Connect Domain"** or **"Allow Access"**
4. Choose one of these options:

### Option A: Use R2.dev subdomain (Easiest - Free)
1. Click **"Allow Access"**
2. Copy the **Public R2.dev URL** (looks like: `https://pub-xxxxx.r2.dev`)
3. This is your `R2_PUBLIC_URL`

### Option B: Use Custom Domain (Requires domain)
1. Click **"Connect Domain"**
2. Enter a subdomain like: `files.yourdomain.com`
3. Follow DNS setup instructions
4. Use `https://files.yourdomain.com` as your `R2_PUBLIC_URL`

**For now, use Option A (R2.dev subdomain) - it's free and instant!**

## Step 4: Create API Token

1. In R2 overview, click **"Manage R2 API Tokens"** (top right)
2. Click **"Create API Token"**
3. **Token name**: `ticketing-portal-upload`
4. **Permissions**: Select **"Object Read & Write"**
5. **Bucket**: Select your bucket (`ticketing-portal-attachments`)
6. Click **"Create API Token"**

7. **IMPORTANT**: Copy these values (shown only once):
   - **Access Key ID**: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **Secret Access Key**: `yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy`
   - **Endpoint**: `https://xxxxxxxxxxxxx.r2.cloudflarestorage.com`

## Step 5: Add Environment Variables

### For Local Development (.env.local)

Add these to your `.env.local` file:

```bash
# Cloudflare R2 Configuration
R2_ENDPOINT=https://xxxxxxxxxxxxx.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_access_key_id_here
R2_SECRET_ACCESS_KEY=your_secret_access_key_here
R2_BUCKET_NAME=ticketing-portal-attachments
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
```

Replace the values with your actual credentials from Step 4.

### For Vercel Production

1. Go to your Vercel project
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:
   - `R2_ENDPOINT` = `https://xxxxxxxxxxxxx.r2.cloudflarestorage.com`
   - `R2_ACCESS_KEY_ID` = `your_access_key_id_here`
   - `R2_SECRET_ACCESS_KEY` = `your_secret_access_key_here`
   - `R2_BUCKET_NAME` = `ticketing-portal-attachments`
   - `R2_PUBLIC_URL` = `https://pub-xxxxx.r2.dev`
4. **Important**: Set environment to **"Production, Preview, and Development"**
5. Click **"Save"**
6. **Redeploy** your application for changes to take effect

## Step 6: Test the Setup

### Test Locally:
1. Start your dev server: `npm run dev`
2. Create a new ticket
3. Upload a file attachment
4. Check if it appears in your R2 bucket
5. Try downloading the file

### Test on Vercel:
1. After adding environment variables, redeploy your app
2. Create a new ticket on production
3. Upload a file attachment
4. Verify it works!

## Verification Checklist

- [ ] R2 bucket created
- [ ] Public access enabled (R2.dev URL obtained)
- [ ] API token created with Read & Write permissions
- [ ] All 5 environment variables added to `.env.local`
- [ ] All 5 environment variables added to Vercel
- [ ] Local upload test successful
- [ ] Production upload test successful
- [ ] File download works

## Troubleshooting

### Error: "Failed to upload attachment"
- **Check**: Environment variables are set correctly
- **Check**: API token has "Object Read & Write" permissions
- **Check**: Bucket name matches exactly
- **Check**: Endpoint URL is correct

### Error: "Access Denied" or 403
- **Check**: Public access is enabled on the bucket
- **Check**: R2_PUBLIC_URL is correct
- **Check**: API token is for the correct bucket

### Files upload but can't download
- **Check**: Public access is enabled
- **Check**: R2_PUBLIC_URL matches your R2.dev domain
- **Check**: File URLs in database use the correct public URL

### Local works but Vercel fails
- **Check**: All environment variables are added to Vercel
- **Check**: Variables are set for "Production" environment
- **Check**: You've redeployed after adding variables

## Cost Monitoring

### Free Tier Limits:
- **Storage**: 10 GB/month
- **Class A Operations** (PUT, POST, DELETE): 1 million/month
- **Class B Operations** (GET, HEAD, LIST): 10 million/month
- **Egress**: Unlimited FREE

### Monitor Usage:
1. Go to Cloudflare Dashboard → R2
2. View **Analytics** tab
3. Check storage and operations usage

### Staying Within Free Tier:
- **10 GB = ~2,000 files** at 5MB each
- **Typical usage**: 50-100 tickets/month with 2-3 files each = ~300 files/month
- **You should stay in free tier** for a long time!

## Security Best Practices

1. ✅ **Never commit** `.env.local` to git (already in `.gitignore`)
2. ✅ **Rotate API tokens** every 90 days
3. ✅ **Use separate tokens** for dev and production
4. ✅ **Set bucket permissions** to minimum required
5. ✅ **Enable CORS** if needed for direct uploads

## Support

If you encounter issues:
1. Check [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
2. Check [Cloudflare Community](https://community.cloudflare.com/)
3. Verify all environment variables are correct

## Summary

Once configured, attachments will:
- ✅ Upload to Cloudflare R2 (not local filesystem)
- ✅ Work on both local and Vercel
- ✅ Be publicly downloadable via R2.dev URL
- ✅ Stay within free tier (10 GB)
- ✅ Have unlimited free downloads

**Estimated setup time**: 10-15 minutes

Good luck! 🚀
