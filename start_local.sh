#!/bin/bash
set -e

if pg_isready -q; then
    echo "PostgreSQL already running."
else
    echo "Starting PostgreSQL..."
    brew services start postgresql@14
    until pg_isready -q; do sleep 1; done
    echo "PostgreSQL started."
fi

cd backend
source ../venv/bin/activate
python manage.py runserver
