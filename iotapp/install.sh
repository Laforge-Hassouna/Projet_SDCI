#!/bin/bash
set -e

echo "🚀 Installing NOMINAL architecture"

# Image commune
docker build -t iotapp-node-image:latest .

# Server
kubectl apply -f server/

# Gateways
kubectl apply -f gateway/gwi_service.yaml
kubectl apply -f gateway/gwi_cluster_ip.yaml
kubectl apply -f gateway/gwi_deployment.yaml

kubectl apply -f gateway/gwf1_service.yaml
kubectl apply -f gateway/gwf1_cluster_ip.yaml
kubectl apply -f gateway/gwf1_deployment.yaml

# Device
kubectl apply -f device/

echo "⏳ Waiting for pods..."
kubectl wait --for=condition=Ready pod -l app=iotapp-server --timeout=60s
kubectl wait --for=condition=Ready pod -l app=iotapp-gwi --timeout=60s
kubectl wait --for=condition=Ready pod -l app=iotapp-gwf1 --timeout=60s


echo "✅ Nominal architecture deployed"
