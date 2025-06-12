#!/bin/bash

echo "Stopping Docker containers..."
docker-compose down

echo "Rebuilding Docker containers..."
docker-compose build --no-cache

echo "Starting Docker containers..."
docker-compose up -d

echo "Containers rebuilt and started. Check logs with: docker-compose logs -f" 