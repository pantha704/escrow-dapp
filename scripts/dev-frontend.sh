#!/bin/bash

# Development script for the escrow frontend
# This script ensures IDL is synced and starts the frontend dev server

echo "🚀 Starting Escrow Frontend Development..."

# Check if we're in the right directory
if [ ! -f "Anchor.toml" ]; then
    echo "❌ Please run this script from the escrow project root directory"
    exit 1
fi

# Sync IDL
echo "📋 Syncing IDL..."
bun run copy-idl

if [ $? -ne 0 ]; then
    echo "❌ Failed to sync IDL. Make sure the program is built with 'anchor build'"
    exit 1
fi

# Install frontend dependencies if needed
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && bun install && cd ..
fi

# Start frontend dev server
echo "🌐 Starting frontend development server..."
echo "Frontend will be available at: http://localhost:5173"
echo "Press Ctrl+C to stop"
echo ""

cd frontend && bun run dev