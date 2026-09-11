#!/bin/sh
set -e

DB_FILE="./data/data.db"

# Create data directory if not exists
mkdir -p ./data

# If database doesn't exist, initialize it
if [ ! -f "$DB_FILE" ]; then
  echo "First run detected. Initializing database..."
  npx prisma db push --skip-generate 2>/dev/null || true
  node -e "require('./prisma/seed.js')" 2>/dev/null || true
  echo "Database initialized!"
else
  echo "Database exists. Starting server..."
fi

exec node server.js
