
/**
 * Gets the database URL from environment variables
 * Uses a single DATABASE_URL for both development and production
 * 
 * @returns The database connection string
 * @throws Error if DATABASE_URL is not configured
 */
export function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL
  
  if (!databaseUrl) {
    console.error('❌ Database Configuration Error:')
    console.error('   DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Not set')
    throw new Error(
      'DATABASE_URL environment variable is required'
    )
  }
  
  return databaseUrl
}

/**
 * Validates that a database URL is properly configured
 * @returns true if valid, throws error if not
 */
export function validateDatabaseConfig(): boolean {
  try {
    const url = getDatabaseUrl()
    // Basic validation - check if it's a valid PostgreSQL URL format
    if (!url.startsWith('postgresql://') && !url.startsWith('postgres://')) {
      throw new Error('Database URL must be a PostgreSQL connection string')
    }
    return true
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Invalid database configuration')
  }
}
