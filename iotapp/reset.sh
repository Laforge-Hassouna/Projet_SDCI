#!/bin/bash
set -e

echo "🧹 Resetting iotapp (FULL CLEAN)"

kubectl delete deployment \
  iotapp-controller \
  iotapp-device-deployment \
  iotapp-gwf1-deployment \
  iotapp-gwi-deployment \
  iotapp-server-deployment \
  iotapp-encoder \
  iotapp-decoder \
  iotapp-shouting-device1 \
  iotapp-shouting-device2 \
  iotapp-shouting-device3 \
  --ignore-not-found

kubectl delete service \
  iotapp-device \
  iotapp-gwf1 \
  iotapp-gwi \
  iotapp-server \
  iotapp-encoder \
  iotapp-decoder \
  iotapp-shouting-device1 \
  iotapp-shouting-device2 \
  iotapp-shouting-device3 \
  --ignore-not-found

kubectl delete virtualservice iotapp-reroute --ignore-not-found

kubectl delete rolebinding iotapp-controller-binding --ignore-not-found
kubectl delete role iotapp-controller-role --ignore-not-found
kubectl delete serviceaccount iotapp-controller-sa --ignore-not-found

echo "✅ Reset done"
