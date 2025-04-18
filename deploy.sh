#!/bin/bash

# Production deployment script

echo "Starting deployment..."

# Pull latest changes
git pull

# Build and start containers
docker-compose down
docker-compose build
docker-compose up -d

echo "Deployment completed!"
