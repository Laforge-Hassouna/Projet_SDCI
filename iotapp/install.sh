#!/bin/bash
set -e

export PATH=$PATH:$PWD/istio-1.28.2
istioctl install -y
kubectl label namespace default istio-injection=enabled
kubectl apply -f istio-1.28.2/samples/addons/
