#!/bin/bash
# Script to add 'draft' status to finance.expense_status enum

# Get database connection details from environment or use defaults
DB_NAME=${DB_NAME:-your_database_name}
DB_USER=${DB_USER:-your_username}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}

echo "Adding 'draft' status to finance.expense_status enum..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$(dirname "$0")/add-draft-status.sql"

if [ $? -eq 0 ]; then
    echo "✅ Successfully added 'draft' status to enum"
else
    echo "❌ Failed to add 'draft' status. Please run the SQL manually:"
    echo "   psql -d $DB_NAME -f $(dirname "$0")/add-draft-status.sql"
fi

