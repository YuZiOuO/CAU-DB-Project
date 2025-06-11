#!/bin/bash
# filepath: /home/kanata/CAU-DB-Project/generate_mock_data.sh

# Script to populate the database with mock data.
# PLEASE ADJUST THE COMMAND BELOW ACCORDING TO YOUR DATABASE SYSTEM AND CREDENTIALS.

# Example for PostgreSQL:
# PGPASSWORD="your_password" psql -h your_host -U your_user -d your_database -f mock_data.sql

# Example for MySQL:
# mysql -h your_host -u your_user -p'your_password' your_database < mock_data.sql

# Example for SQLite:
# sqlite3 your_database.db < mock_data.sql

DB_TYPE="postgresql" # Change to "mysql", "sqlite", etc. as needed
DB_NAME="car_rental_dev"
DB_USER="kanata" # Change this if your PostgreSQL username is different
DB_HOST="localhost"
SQL_FILE="mock_data.sql"

# Get the directory of the script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
SQL_FILE_PATH="$SCRIPT_DIR/$SQL_FILE"

if [ ! -f "$SQL_FILE_PATH" ]; then
    echo "Error: SQL file not found at $SQL_FILE_PATH"
    exit 1
fi

echo "Attempting to populate database '$DB_NAME' with mock data from '$SQL_FILE_PATH'..."

if [ "$DB_TYPE" == "postgresql" ]; then
    echo "Using PostgreSQL. You will be prompted for the password for user '$DB_USER'."
    # PGPASSWORD is removed, so psql will prompt for a password if required by the server.
    psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -a -f "$SQL_FILE_PATH"
elif [ "$DB_TYPE" == "mysql" ]; then
    echo "Using MySQL."
    mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$SQL_FILE_PATH"
elif [ "$DB_TYPE" == "sqlite" ]; then
    echo "Using SQLite. Database file: $DB_NAME"
    sqlite3 "$DB_NAME" < "$SQL_FILE_PATH"
else
    echo "Unsupported DB_TYPE: $DB_TYPE"
    echo "Please edit this script to support your database or run the SQL file manually."
    exit 1
fi

if [ $? -eq 0 ]; then
    echo "Mock data imported successfully."
else
    echo "Error importing mock data. Please check the output above."
fi