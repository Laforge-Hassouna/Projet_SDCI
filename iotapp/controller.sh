#!/bin/bash
set -e

echo "🤖 Deploying adaptive controller"

# RBAC (OBLIGATOIRE AVANT le deployment)
kubectl apply -f iotapp-controller/k8s/serviceaccount.yaml
kubectl apply -f iotapp-controller/k8s/role.yaml
kubectl apply -f iotapp-controller/k8s/rolebinding.yaml

# Controller deployment
kubectl apply -f iotapp-controller/k8s/deployment.yaml
kubectl rollout restart deployment iotapp-controller

echo "✅ Controller deployed"

