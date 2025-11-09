#!/bin/bash

# ============================================================================
# Database Setup Script for GGW Amalthea
# ============================================================================
# This script:
# 1. Creates the database if it doesn't exist
# 2. Sets up the simple auth schema (public.users)
# 3. Sets up the OneFlow ERP schema
# ============================================================================

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Database configuration (can be overridden by environment variables)
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-ggw_amalthea_db}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-postgres}

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}GGW Amalthea Database Setup${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"

# Export password for psql
export PGPASSWORD="$DB_PASSWORD"

# Step 1: Check if PostgreSQL is running
echo -e "${YELLOW}Step 1: Checking PostgreSQL connection...${NC}"
if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" > /dev/null 2>&1; then
    echo -e "${RED}✗ PostgreSQL is not running or not accessible${NC}"
    echo "Please ensure PostgreSQL is running and try again."
    exit 1
fi
echo -e "${GREEN}✓ PostgreSQL is running${NC}"
echo ""

# Step 2: Create database if it doesn't exist
echo -e "${YELLOW}Step 2: Creating database (if it doesn't exist)...${NC}"
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    echo -e "${YELLOW}  Database '$DB_NAME' already exists${NC}"
    read -p "  Do you want to drop and recreate it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "  Dropping existing database..."
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "DROP DATABASE IF EXISTS $DB_NAME;"
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;"
        echo -e "${GREEN}✓ Database recreated${NC}"
    else
        echo -e "${YELLOW}  Keeping existing database${NC}"
    fi
else
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;"
    echo -e "${GREEN}✓ Database created${NC}"
fi
echo ""

# Step 3: Set up simple auth schema (public.users)
echo -e "${YELLOW}Step 3: Setting up simple auth schema (public.users)...${NC}"
if [ -f "$SCRIPT_DIR/schema.sql.OLD_SIMPLE_AUTH_BACKUP" ]; then
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SCRIPT_DIR/schema.sql.OLD_SIMPLE_AUTH_BACKUP"
    echo -e "${GREEN}✓ Simple auth schema created${NC}"
else
    echo -e "${YELLOW}  Warning: schema.sql.OLD_SIMPLE_AUTH_BACKUP not found, skipping simple auth setup${NC}"
fi
echo ""

# Step 4: Set up OneFlow ERP schema
echo -e "${YELLOW}Step 4: Setting up OneFlow ERP schema...${NC}"
if [ -f "$SCRIPT_DIR/oneflow-schema.sql" ]; then
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SCRIPT_DIR/oneflow-schema.sql"
    echo -e "${GREEN}✓ OneFlow ERP schema created${NC}"
else
    echo -e "${RED}✗ Error: oneflow-schema.sql not found${NC}"
    exit 1
fi
echo ""

# Step 5: Create default organization (required for OneFlow multi-tenant system)
echo -e "${YELLOW}Step 5: Creating default organization...${NC}"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
INSERT INTO auth.orgs (name, slug, base_currency, default_timezone, is_active)
VALUES ('Default Organization', 'default', 'USD', 'America/New_York', true)
ON CONFLICT (slug) DO NOTHING;
" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Default organization created${NC}"
else
    echo -e "${YELLOW}  Note: Default organization may already exist${NC}"
fi
echo ""

# Step 6: Verify setup
echo -e "${YELLOW}Step 6: Verifying database setup...${NC}"
TABLES_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema IN ('public', 'auth', 'catalog', 'project', 'finance', 'ops', 'analytics');")
echo -e "${GREEN}✓ Found $TABLES_COUNT tables across all schemas${NC}"
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Database setup complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "User: $DB_USER"
echo ""
echo "You can now start the backend server with:"
echo "  cd $BACKEND_DIR && npm start"
echo ""

# Unset password
unset PGPASSWORD

