#!/bin/bash
set -e

echo "🔥 Deploying problem scenario (shouting devices)"

kubectl apply -f problem.yaml

echo "⚠️ Problem active"
