#!/usr/bin/env bash
set -e

BUILD_IMAGES=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --build)
      BUILD_IMAGES=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;  
  esac
done

echo "🚀 Deploying NOMINAL IoT architecture"



if [ "$BUILD_IMAGES" = true ]; then
  docker build -t iotapp-node-image:latest .
fi

kubectl apply -f server/
kubectl rollout status deployment/iotapp-server-deployment

kubectl apply -f gateway/ # gwi
kubectl rollout status deployment/iotapp-gwi-deployment

# gwfX
kubectl apply -f gateway/z1
kubectl apply -f gateway/z2
kubectl apply -f gateway/z3
kubectl rollout status deployment/iotapp-gwf1-deployment
kubectl rollout status deployment/iotapp-gwf2-deployment
kubectl rollout status deployment/iotapp-gwf3-deployment

# devXY
kubectl apply -f device/z1
kubectl apply -f device/z2
kubectl apply -f device/z3

echo "✅ Nominal architecture deployed"
