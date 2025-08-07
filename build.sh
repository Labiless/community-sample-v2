#!/bin/bash

echo "📦 Installing and starting backend..."
cd server
npm install

echo "🚀 Starting Express server..."
npm run start

echo "🎨 Building Vue frontend..."
cd ../client
npm install
npm run build

echo "✅ App is ready and running!"