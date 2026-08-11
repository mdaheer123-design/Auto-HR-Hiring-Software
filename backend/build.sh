#!/usr/bin/env bash
# Render Build Script — Builds both frontend and backend
set -e

echo "==> Installing backend Python dependencies..."
pip install -r requirements.txt

echo "==> Installing frontend dependencies..."
cd ../frontend
npm install

echo "==> Building frontend production bundle..."
npm run build

echo "==> Build complete!"
ls -la dist/
