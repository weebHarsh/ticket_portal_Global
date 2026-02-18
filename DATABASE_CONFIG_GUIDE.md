# Database Configuration Guide

## Overview

The application now supports environment-specific database URLs. This allows you to use different databases for development and production environments.

## How It Works

The system automatically selects the appropriate database URL based on the `NODE_ENV` environment variable:

- **Development** (`NODE_ENV=development` or not set):
  - Uses `DATABASE_URL_DEV` if available
  - Falls back to `DATABASE_URL` if `DATABASE_URL_DEV` is not set

- **Production** (`NODE_ENV=production`):
  - Uses `DATABASE_URL_PROD` if available
  - Falls back to `DATABASE_URL` if `DATABASE_URL_PROD` is not set

## Configuration

### Option 1: Separate URLs (Recommended)

Use separate environment variables for each environment:

```env
# Development Database
DATABASE_URL_DEV=postgresql://user:password@dev-host:5432/dev_database?sslmode=require

# Production Database
DATABASE_URL_PROD=postgresql://user:password@prod-host:5432/prod_database?sslmode=require
```

### Option 2: Single URL (Fallback)

Use a single `DATABASE_URL` that works for both environments:

```env
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
```

**Note**: This is less secure as you'll use the same database for both environments.

### Option 3: Hybrid Approach

Use specific URLs when available, fallback to single URL:

```env
# Primary (specific to environment)
DATABASE_URL_DEV=postgresql://user:password@dev-host:5432/dev_database?sslmode=require
DATABASE_URL_PROD=postgresql://user:password@prod-host:5432/prod_database?sslmode=require

# Fallback (optional, used if specific URL not found)
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
```

## Environment Setup

### Development Environment

1. Create `.env.local` file in the project root:

```env
# Development Database
DATABASE_URL_DEV=postgresql://user:password@localhost:5432/ticketing_dev?sslmode=disable

# Or use single URL
DATABASE_URL=postgresql://user:password@localhost:5432/ticketing_dev?sslmode=disable
```

2. Run the application:
```bash
npm run dev
```

The system will automatically use the development database.

### Production Environment

1. Set environment variables in your hosting platform (Vercel, Railway, etc.):

**Vercel:**
- Go to Project Settings → Environment Variables
- Add `DATABASE_URL_PROD` with your production database URL
- Add `NODE_ENV=production`

**Railway/Render:**
- Add environment variables in the dashboard
- Set `DATABASE_URL_PROD` and `NODE_ENV=production`

2. Deploy:
```bash
npm run build
npm start
```

The system will automatically use the production database.

## Verification

### Check Current Database URL

The application will log an error if the database URL is not configured. To verify which URL is being used, you can temporarily add logging:

```typescript
// In lib/utils/db-config.ts (for debugging only)
console.log('Using database URL:', isProduction ? 'PROD' : 'DEV')
```

### Test Connection

Run the database setup script to test the connection:

```bash
node scripts/setup-database.js
```

This will:
- Check if the database URL is configured
- Test the connection
- Show which environment is being used

## Security Best Practices

1. **Never commit `.env.local`** - It's already in `.gitignore`
2. **Use different databases** - Always use separate databases for dev and prod
3. **Use strong passwords** - Ensure database passwords are strong
4. **Enable SSL** - Always use `sslmode=require` in production
5. **Rotate credentials** - Regularly rotate database passwords

## Troubleshooting

### Error: "DATABASE_URL_DEV or DATABASE_URL environment variable is required"

**Solution**: Make sure you have either `DATABASE_URL_DEV` or `DATABASE_URL` set in your `.env.local` file.

### Error: "DATABASE_URL_PROD or DATABASE_URL environment variable is required"

**Solution**: In production, make sure you have either `DATABASE_URL_PROD` or `DATABASE_URL` set in your environment variables.

### Wrong Database Being Used

**Check NODE_ENV**:
```bash
# In development
echo $NODE_ENV  # Should be empty or 'development'

# In production
echo $NODE_ENV  # Should be 'production'
```

**Verify Environment Variables**:
```bash
# Check what's set
node -e "console.log('DEV:', process.env.DATABASE_URL_DEV)"
node -e "console.log('PROD:', process.env.DATABASE_URL_PROD)"
node -e "console.log('FALLBACK:', process.env.DATABASE_URL)"
```

## Migration from Single URL

If you're currently using a single `DATABASE_URL`:

1. **No changes needed** - The system will continue to work with just `DATABASE_URL`
2. **Recommended**: Add separate URLs for better security:
   ```env
   DATABASE_URL_DEV=your-dev-url
   DATABASE_URL_PROD=your-prod-url
   ```

## Files Modified

The following files were updated to support environment-specific database URLs:

- `lib/db.ts` - Main database connection
- `lib/actions/auth.ts` - Authentication database connection
- `app/api/users/create/route.ts` - API route database connection
- `lib/utils/db-config.ts` - New utility function (created)

## Example Configuration Files

### `.env.local` (Development)
```env
DATABASE_URL_DEV=postgresql://dev_user:dev_pass@localhost:5432/ticketing_dev?sslmode=disable
NODE_ENV=development
```

### Production Environment Variables (Vercel/Railway/etc.)
```env
DATABASE_URL_PROD=postgresql://prod_user:prod_pass@prod-host:5432/ticketing_prod?sslmode=require
NODE_ENV=production
```
