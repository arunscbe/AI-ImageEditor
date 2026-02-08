#!/usr/bin/env sh
# Run Alembic migrations using DATABASE_URL from env or .env
# switch to database folder and run alembic there
cd backend/database || exit 1
# load .env when available
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi
alembic -c alembic.ini upgrade head
