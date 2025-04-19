#!/bin/bash

# This script sets up the Political Promises form in the tenant database

# Get environment variables
source .env

# Check if SQL Server command line tools are available
if ! command -v sqlcmd &> /dev/null
then
    echo "Error: sqlcmd is not installed."
    echo "Please install the Microsoft SQL Server command-line tools."
    exit 1
fi

echo "Setting up Political Promises Tracker form..."

# Run the SQL script
sqlcmd -S $DB_SERVER -d $DB_NAME -U $DB_USER -P $DB_PASSWORD -i server/db/promises_form_schema.sql

echo "Setup complete. You should see a 'Political Promises Tracker' form in the system." 