#!/bin/bash
set -e

echo "🚀 Deploying NOMINAL IoT architecture"

docker build -t iotapp-node-image:latest .

kubectl apply -f server/
kubectl apply -f gateway/
kubectl apply -f device/

echo "✅ Nominal architecture deployed"
