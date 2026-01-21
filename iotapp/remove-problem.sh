#!/bin/bash
set -e

echo "🧹 Resetting iotapp problem"

kubectl delete deployment \
  iotapp-shouting-device1 \
  iotapp-shouting-device2 \
  --ignore-not-found

kubectl delete service \
  iotapp-shouting-device1 \
  iotapp-shouting-device2 \
  --ignore-not-found

echo "✅ Reset done"
