/**
 * Database Configuration Utility
 * 
 * Dynamically selects the appropriate database URL based on the environment:
 * - Development: Uses DATABASE_URL_DEV or falls back to DATABASE_URL
 * - Production: Uses DATABASE_URL_PROD or falls back to DATABASE_URL
 */

/**
 * Gets the appropriate database URL based on the current environment
 * @returns The database connection string
 * @throws Error if no database URL is configured
 */
export function getDatabaseUrl(): string {
  const isProduction = process.env.NODE_ENV === 'production'
  
  // In production, prefer DATABASE_URL_PROD, fallback to DATABASE_URL
  if (isProduction) {
    const prodUrl = process.env.DATABASE_URL_PROD || process.env.DATABASE_URL
    if (!prodUrl) {
      throw new Error(
        'DATABASE_URL_PROD or DATABASE_URL environment variable is required in production'
      )
    }
    return prodUrl
  }
  
  // In development, prefer DATABASE_URL_DEV, fallback to DATABASE_URL
  const devUrl = process.env.DATABASE_URL_DEV || process.env.DATABASE_URL
  if (!devUrl) {
    throw new Error(
      'DATABASE_URL_DEV or DATABASE_URL environment variable is required in development'
    )
  }
  return devUrl
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
