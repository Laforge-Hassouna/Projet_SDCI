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

if [ "$BUILD_IMAGES" = true ]; then
  source ./build-images.sh
fi
source ./create-services.sh

kubectl apply -f server/server_deployment.yaml
kubectl rollout status deployment/iotapp-server-deployment

kubectl apply -f gateway/gwi_deployment.yaml
kubectl rollout status deployment/iotapp-gwi-deployment

kubectl apply -f gateway/gwf1_deployment.yaml
kubectl rollout status deployment/iotapp-gwf1-deployment

kubectl apply -f device/device_deployment.yaml


