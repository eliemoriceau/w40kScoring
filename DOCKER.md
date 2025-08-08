# 🐳 Docker & Kubernetes - w40kScoring

Guide complet pour le déploiement de l'application w40kScoring en production via Docker et Kubernetes.

## 📋 Table des matières

- [🚀 Démarrage rapide](#-démarrage-rapide)
- [🏗️ Build de l'image Docker](#%EF%B8%8F-build-de-limage-docker)
- [🏃 Exécution locale avec Docker Compose](#-exécution-locale-avec-docker-compose)
- [☸️ Déploiement Kubernetes](#%EF%B8%8F-déploiement-kubernetes)
- [🔧 Configuration](#-configuration)
- [📊 Monitoring & Health Checks](#-monitoring--health-checks)
- [🛠️ Troubleshooting](#%EF%B8%8F-troubleshooting)

## 🚀 Démarrage rapide

### Prérequis

- Docker >= 20.10
- Docker Compose >= 2.0
- Kubernetes >= 1.24 (pour le déploiement K8s)
- kubectl configuré

### Variables d'environnement requises

```bash
# Génération de la clé d'application
node ace generate:key

# Variables essentielles
NODE_ENV=production
HOST=0.0.0.0
PORT=3333
APP_KEY=base64:VOTRE_CLE_GENEREE

# Base de données
DB_CONNECTION=pg
DB_HOST=postgres.staging.svc.cluster.local
DB_PORT=5432
DB_USER=adonis_user
DB_PASSWORD=adonis_password
DB_DATABASE=adonis_db
```

## 🏗️ Build de l'image Docker

### Build simple
```bash
# Build de l'image
docker build -t w40kscoring:latest .

# Build avec tag spécifique
docker build -t w40kscoring:v1.0.0 .
```

### Build multi-plateforme
```bash
# Build pour AMD64 et ARM64
docker buildx build --platform linux/amd64,linux/arm64 \
  -t ghcr.io/eliemoriceau/w40kscoring:latest .
```

### Push vers le registry
```bash
# Tag pour GitHub Container Registry
docker tag w40kscoring:latest ghcr.io/eliemoriceau/w40kscoring:latest

# Push
docker push ghcr.io/eliemoriceau/w40kscoring:latest
```

## 🏃 Exécution locale avec Docker Compose

### Démarrage des services
```bash
# Démarrer tous les services en arrière-plan
docker-compose up -d

# Voir les logs en temps réel
docker-compose logs -f

# Démarrer seulement la base de données
docker-compose up -d postgres
```

### Commandes utiles
```bash
# Arrêter tous les services
docker-compose down

# Arrêter et supprimer les volumes
docker-compose down -v

# Rebuild l'application
docker-compose build app

# Exécuter les migrations
docker-compose exec app node ace migration:run
```

## ☸️ Déploiement Kubernetes

### Déploiement simple
```bash
# Appliquer la configuration
kubectl apply -f manifest/adonis-app.yaml

# Vérifier le déploiement
kubectl get pods -n staging
kubectl get services -n staging
kubectl get ingress -n staging
```

### Configuration des secrets
```bash
# Créer le secret avec les bonnes valeurs
kubectl create secret generic adonis-secret \
  --from-literal=APP_KEY="base64:VOTRE_CLE" \
  --from-literal=DB_PASSWORD="votre_mot_de_passe" \
  --from-literal=DB_USER="votre_utilisateur" \
  --from-literal=DB_HOST="postgres.staging.svc.cluster.local" \
  --from-literal=DB_DATABASE="adonis_db" \
  --from-literal=DB_CONNECTION="pg" \
  --from-literal=DB_PORT="5432" \
  -n staging
```

### Mise à jour du déploiement
```bash
# Mettre à jour l'image
kubectl set image deployment/40kScoring adonis=ghcr.io/eliemoriceau/w40kscoring:v1.0.1 -n staging

# Rollback si nécessaire
kubectl rollout undo deployment/40kScoring -n staging

# Voir l'historique des déploiements
kubectl rollout history deployment/40kScoring -n staging
```

## 🔧 Configuration

### Architecture de l'image Docker

L'image Docker utilise un **build multi-stage** pour optimiser la taille :

1. **Base** : Image Node.js avec les outils système
2. **Dependencies** : Installation des dépendances
3. **Builder** : Compilation TypeScript et build des assets
4. **Production** : Image finale optimisée

### Sécurité

- ✅ Utilisateur non-root (UID 1001)
- ✅ Capacités Linux supprimées
- ✅ Lecture seule du système de fichiers
- ✅ Variables sensibles via secrets K8s
- ✅ Scan de vulnérabilités automatique

### Ressources Kubernetes

```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

## 📊 Monitoring & Health Checks

### Endpoints de santé

- **`/health`** : Status général de l'application
  ```json
  {
    "status": "ok",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "uptime": 3600
  }
  ```

### Probes Kubernetes

- **Liveness Probe** : Vérification toutes les 10s après 30s
- **Readiness Probe** : Vérification toutes les 5s après 5s
- **Health Check Docker** : Vérification toutes les 30s

### Logs

```bash
# Voir les logs de l'application
kubectl logs -f deployment/40kScoring -n staging

# Logs avec Docker Compose
docker-compose logs -f app

# Logs spécifiques
kubectl logs -f pod/40kScoring-xyz123 -c adonis -n staging
```

## 🛠️ Troubleshooting

### Problèmes courants

#### L'application ne démarre pas
```bash
# Vérifier les secrets
kubectl get secret adonis-secret -n staging -o yaml

# Vérifier les logs
kubectl logs deployment/40kScoring -n staging

# Vérifier les variables d'environnement
kubectl describe pod 40kScoring-xyz123 -n staging
```

#### Problèmes de base de données
```bash
# Tester la connexion depuis le pod
kubectl exec -it deployment/40kScoring -n staging -- node ace healthcheck:db

# Vérifier les migrations
kubectl exec -it deployment/40kScoring -n staging -- node ace migration:status
```

#### Health checks qui échouent
```bash
# Tester manuellement le endpoint
kubectl port-forward deployment/40kScoring 3333:3333 -n staging
curl http://localhost:3333/health

# Vérifier les probes
kubectl describe pod 40kScoring-xyz123 -n staging
```

### Commandes de debug

```bash
# Shell dans le container
kubectl exec -it deployment/40kScoring -n staging -- /bin/sh

# Copier des fichiers
kubectl cp staging/40kScoring-xyz123:/app/tmp/logs/app.log ./local-app.log

# Port forwarding pour debug
kubectl port-forward service/adonis-service 3333:80 -n staging
```

### Métriques et monitoring

```bash
# Utilisation des ressources
kubectl top pods -n staging

# Description détaillée
kubectl describe deployment 40kScoring -n staging

# Events du namespace
kubectl get events -n staging --sort-by='.firstTimestamp'
```

## 🔄 CI/CD Integration

### GitHub Actions example
```yaml
name: Build and Deploy

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: |
          docker build -t ghcr.io/eliemoriceau/w40kscoring:${{ github.sha }} .
          
      - name: Push to registry
        run: |
          docker push ghcr.io/eliemoriceau/w40kscoring:${{ github.sha }}
          
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/40kScoring adonis=ghcr.io/eliemoriceau/w40kscoring:${{ github.sha }} -n staging
```

---

## 📞 Support

Pour toute question ou problème :

1. Vérifiez les [logs](#logs)
2. Consultez la section [troubleshooting](#%EF%B8%8F-troubleshooting)
3. Ouvrez une issue sur le repository

**Happy Deploying! 🚀**