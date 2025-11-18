#!/bin/bash
set -e

echo "⏮️  Rolling back ProjectPulse deployment..."

kubectl rollout undo deployment/nextjs -n projectpulse
kubectl rollout undo deployment/mcp-server -n projectpulse

echo "✅ Rollback initiated. Check status with:"
echo "  kubectl rollout status deployment/nextjs -n projectpulse"
echo "  kubectl rollout status deployment/mcp-server -n projectpulse"
