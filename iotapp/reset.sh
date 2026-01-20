#!/bin/bash
set -e

echo "🧹 Resetting iotapp (FULL CLEAN)"

kubectl delete deployment \
  iotapp-controller \
  iotapp-dev11-deployment \
  iotapp-dev12-deployment \
  iotapp-dev13-deployment \
  iotapp-dev21-deployment \
  iotapp-dev22-deployment \
  iotapp-dev23-deployment \
  iotapp-dev31-deployment \
  iotapp-dev32-deployment \
  iotapp-dev33-deployment \
  iotapp-gwf1-deployment \
  iotapp-gwf2-deployment \
  iotapp-gwf3-deployment \
  iotapp-gwi-deployment \
  iotapp-server-deployment \
  iotapp-encoder \
  iotapp-decoder \
  iotapp-shouting-device1 \
  --ignore-not-found

kubectl delete service \
  iotapp-dev11 \
  iotapp-dev12 \
  iotapp-dev13 \
  iotapp-dev21 \
  iotapp-dev22 \
  iotapp-dev23 \
  iotapp-dev31 \
  iotapp-dev32 \
  iotapp-dev33 \
  iotapp-gwf1 \
  iotapp-gwf2 \
  iotapp-gwf3 \
  iotapp-gwi \
  iotapp-server \
  iotapp-encoder \
  iotapp-decoder \
  iotapp-shouting-device1 \
  iotapp-gwi-forward \
  iotapp-server-forward \
  --ignore-not-found

kubectl delete virtualservice iotapp-reroute --ignore-not-found

kubectl delete rolebinding iotapp-controller-binding --ignore-not-found
kubectl delete role iotapp-controller-role --ignore-not-found
kubectl delete serviceaccount iotapp-controller-sa --ignore-not-found

echo "✅ Reset done"
