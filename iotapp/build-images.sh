#!/usr/bin/env bash
set -e

echo "🔨 Building local Docker image for Docker Desktop..."
docker build -t iotapp-node-image:latest .

echo "✅ Image built successfully"
docker images | grep iotapp-node-image
