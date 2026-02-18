# Environment File Setup Instructions

## Quick Setup

Your `.env.local` file already exists. Here's what you need to do:

### Step 1: Open `.env.local` file

The file is located at the root of your project:
```
ticket_portal_Global/.env.local
```

### Step 2: Paste Your Database URLs

Replace the placeholder URLs with your actual database connection strings:

```env
# Development Database URL (paste your dev database URL here)
DATABASE_URL_DEV=postgresql://your-dev-user:your-dev-password@your-dev-host:5432/your-dev-database?sslmode=require

# Production Database URL (paste your prod database URL here)
DATABASE_URL_PROD=postgresql://your-prod-user:your-prod-password@your-prod-host:5432/your-prod-database?sslmode=require
```

### Step 3: Configure Other Variables

Make sure to also set:

```env
# Generate a secret key (minimum 32 characters)
AUTH_SECRET=your-generated-secret-here-minimum-32-characters

# Your application URL
NEXTAUTH_URL=http://localhost:4000
NEXTAUTH_URL_INTERNAL=http://localhost:4000
```

## Example Format

Your database URLs should look like this:

**Neon Database:**
```
DATABASE_URL_DEV=postgresql://username:password@ep-xxxxx-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

**Local PostgreSQL:**
```
DATABASE_URL_DEV=postgresql://postgres:postgres@localhost:5432/ticketing_dev?sslmode=disable
```

**Supabase:**
```
DATABASE_URL_DEV=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres?sslmode=require
```

## Important Notes

1. **No spaces** around the `=` sign
2. **No quotes needed** (unless your password contains special characters)
3. **Keep it secure** - Never commit `.env.local` to git (it's already in `.gitignore`)
4. **Development vs Production**:
   - Development: Uses `DATABASE_URL_DEV` when `NODE_ENV` is not set to 'production'
   - Production: Uses `DATABASE_URL_PROD` when `NODE_ENV=production`

## Testing Your Configuration

After setting up your URLs, test the connection:

```bash
node scripts/setup-database.js
```

This will:
- Check if your database URL is configured
- Test the connection
- Show which environment is being used

## Troubleshooting

### "Database URL not found" error
- Make sure `.env.local` is in the project root
- Check that the variable names are exactly: `DATABASE_URL_DEV` and `DATABASE_URL_PROD`
- Restart your dev server after making changes

### Wrong database being used
- Check `NODE_ENV` environment variable
- In development, it should be unset or set to 'development'
- In production, it should be set to 'production'

## File Location

Your `.env.local` file should be here:
```
C:\Users\User\github\TicketPortal\ticket_portal_Global\.env.local
```

Open it in your editor and paste your database URLs!
