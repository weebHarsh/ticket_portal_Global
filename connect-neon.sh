#!/bin/bash
# Connect to Neon database using psql

# Full connection string
psql "postgresql://neondb_owner:npg_rc7YtW6bLVzQ@ep-shiny-hall-a4xsbbt3-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Alternative: Using individual parameters
# psql -h ep-shiny-hall-a4xsbbt3-pooler.us-east-1.aws.neon.tech \
#      -U neondb_owner \
#      -d neondb \
#      -p 5432
