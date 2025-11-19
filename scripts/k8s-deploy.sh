#!/bin/bash
set -e

echo "🚀 Deploying ProjectPulse to Kubernetes..."

# Create namespace
kubectl apply -f k8s/namespace.yaml

# Create secrets (check if exists first)
if ! kubectl get secret projectpulse-secrets -n projectpulse &> /dev/null; then
  echo "⚠️  Creating secrets from example file..."
  echo "⚠️  IMPORTANT: Update k8s/secrets.yaml with production values!"
  kubectl apply -f k8s/secrets.yaml
fi

# Apply ConfigMap
kubectl apply -f k8s/configmap.yaml

# Deploy databases (StatefulSets)
echo "📊 Deploying PostgreSQL..."
kubectl apply -f k8s/postgres-statefulset.yaml

echo "🔴 Deploying Redis..."
kubectl apply -f k8s/redis-statefulset.yaml

# Wait for databases
echo "⏳ Waiting for databases to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres -n projectpulse --timeout=300s
kubectl wait --for=condition=ready pod -l app=redis -n projectpulse --timeout=300s

# Run database migrations
echo "🔄 Running Prisma migrations..."
kubectl run prisma-migrate --rm -i --restart=Never \
  --image=projectpulse/web:latest \
  --namespace=projectpulse \
  --env="DATABASE_URL=$(kubectl get secret projectpulse-secrets -n projectpulse -o jsonpath='{.data.DATABASE_URL}' | base64 -d)" \
  --command -- sh -c "cd apps/web && npx prisma migrate deploy"

# Deploy applications
echo "🌐 Deploying Next.js..."
kubectl apply -f k8s/nextjs-deployment.yaml

echo "🔧 Deploying MCP Server..."
kubectl apply -f k8s/mcp-deployment.yaml

# Deploy Ingress
echo "🌍 Deploying Ingress..."
kubectl apply -f k8s/ingress.yaml

# Deploy HPA
echo "📈 Deploying Horizontal Pod Autoscalers..."
kubectl apply -f k8s/hpa.yaml

echo "✅ Deployment complete!"
echo ""
echo "📊 Check status:"
echo "  kubectl get pods -n projectpulse"
echo ""
echo "🔍 View logs:"
echo "  kubectl logs -f deployment/nextjs -n projectpulse"
echo "  kubectl logs -f deployment/mcp-server -n projectpulse"
echo ""
echo "🌐 Access application:"
echo "  https://projectpulse.example.com"
echo "  https://api.projectpulse.example.com"
