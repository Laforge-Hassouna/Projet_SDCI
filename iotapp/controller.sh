#!/bin/bash
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

echo "🤖 Deploying adaptive controller"

if [ "$BUILD_IMAGES" = true ]; then
  docker build -t iotapp-controller:latest ./iotapp-controller/
fi

# RBAC (OBLIGATOIRE AVANT le deployment)
kubectl apply -f iotapp-controller/k8s/serviceaccount.yaml
kubectl apply -f iotapp-controller/k8s/role.yaml
kubectl apply -f iotapp-controller/k8s/rolebinding.yaml

# Controller deployment
kubectl apply -f iotapp-controller/k8s/deployment.yaml
kubectl rollout restart deployment iotapp-controller

echo "✅ Controller deployed"

