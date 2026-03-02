# Guide de Déploiement - Application Logistics Backend

## Table des Matières
1. [Pré-requis](#pré-requis)
2. [Déploiement sur Render.com](#déploiement-sur-rendercom)
3. [Autres Options de Déploiement Gratuites](#autres-options-de-déploiement-gratuites)
4. [Configuration des Variables d'Environnement](#configuration-des-variables-denvironnement)
5. [Fichiers de Configuration](#fichiers-de-configuration)
6. [Points Importants à Considérer](#points-importants-à-considérer)

## Pré-requis

Avant de procéder au déploiement, assurez-vous que votre application répond aux exigences suivantes :

- Node.js >= 18.0.0
- npm >= 9.0.0
- L'application est basée sur NestJS v10+
- Typescript v5+
- L'application utilise PostgreSQL, MongoDB, Redis et RabbitMQ

## Déploiement sur Render.com

### Étape 1 : Préparer votre application pour le déploiement

1. Créez un fichier `render.yaml` à la racine de votre projet :

```yaml
services:
  - type: web
    name: logistics-backend
    env: node
    region: frankfurt  # Choisissez une région selon vos besoins
    buildCommand: |
      npm install
      npm run build
    startCommand: npm run start:prod
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        sync: false
      - key: DATABASE_URL
        sync: false
      - key: MONGODB_URI
        sync: false
      - key: REDIS_URL
        sync: false
      - key: RABBITMQ_URL
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: JWT_REFRESH_SECRET
        sync: false
      - key: WHATSAPP_API_KEY
        sync: false
      - key: ANTHROPIC_API_KEY
        sync: false
      - key: APP_URL
        sync: false
      - key: FRONTEND_URL
        value: https://votre-frontend.onrender.com  # Remplacez par votre URL frontend
```

2. Modifiez votre fichier `package.json` pour s'assurer que la commande de démarrage en production fonctionne correctement :

```json
{
  "scripts": {
    "start:prod": "node dist/main"
  }
}
```

3. Assurez-vous que votre application écoute sur le port fourni par Render :

Dans votre fichier `src/main.ts`, vérifiez que vous utilisez la variable d'environnement PORT :
```typescript
const port = process.env.PORT || 3000;
await app.listen(port);
```

### Étape 2 : Connectez votre dépôt GitHub à Render

1. Allez sur [https://dashboard.render.com](https://dashboard.render.com)
2. Cliquez sur "New +" et sélectionnez "Web Service"
3. Connectez votre compte GitHub
4. Sélectionnez votre dépôt contenant l'application NestJS
5. Dans les paramètres de création, assurez-vous que :
   - Environment: "Node"
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start:prod`
   - Region: choisissez une région proche de vos utilisateurs

### Étape 3 : Configurez les variables d'environnement

Dans la section "Environment Variables" de votre service Render, ajoutez toutes les variables nécessaires :

- `NODE_ENV=production`
- `DATABASE_URL=` (URL de votre base PostgreSQL sur Render ou externe)
- `MONGODB_URI=` (si vous utilisez MongoDB)
- `REDIS_URL=` (si vous utilisez Redis)
- `RABBITMQ_URL=` (si vous utilisez RabbitMQ)
- `JWT_SECRET=` (générez une clé sécurisée)
- `JWT_REFRESH_SECRET=` (générez une clé sécurisée)
- Toutes les autres variables sensibles de votre `.env`

### Étape 4 : Déployez

1. Cliquez sur "Create Web Service"
2. Le déploiement commencera automatiquement
3. Une fois terminé, vous aurez une URL comme `https://votre-app.onrender.com`

## Autres Options de Déploiement Gratuites

### 1. Railway
- Offre un plan gratuit avec 500 heures par mois
- Support natif pour PostgreSQL, MongoDB, Redis
- Intégration facile avec GitHub
- Interface utilisateur conviviale

### 2. Heroku (Plan Eco disponible)
- Ancienne solution populaire
- Plan Eco gratuit mais avec limitations (dernière mise en veille après 30 min)
- Support de multiples langages et services

### 3. Vercel (pour les API REST)
- Principalement pour les applications front-end
- Mais peut héberger des fonctions serveurless
- Déploiement rapide avec Git

### 4. Fly.io
- Déploiement sur plusieurs régions
- Support Docker natif
- Plan gratuit avec ressources limitées
- Bonne performance

### 5. Google Cloud Platform (Free Tier)
- Compute Engine avec instances gratuites
- Cloud SQL avec quota mensuel gratuit
- Plus complexe à configurer mais très puissant

## Configuration des Variables d'Environnement

Voici les variables d'environnement essentielles à configurer dans votre environnement de production :

### Variables de base
- `NODE_ENV=production`
- `PORT=3000` (ou laisser Render gérer automatiquement)

### Variables de base de données
- `DATABASE_URL=postgresql://user:password@host:port/database`
- `MONGODB_URI=mongodb://username:password@host:port/database`
- `REDIS_URL=redis://host:port`
- `RABBITMQ_URL=amqp://username:password@host:port`

### Variables de sécurité
- `JWT_SECRET=votre_clé_secrète_jwt_très_sécurisée`
- `JWT_REFRESH_SECRET=votre_clé_secrète_refresh_jwt_très_sécurisée`

### Variables d'API
- `WHATSAPP_API_KEY=votre_clé_api_whatsapp`
- `WHATSAPP_PHONE_NUMBER_ID=votre_id_numero_telephone`
- `WHATSAPP_ACCESS_TOKEN=votre_token_acces_whatsapp`
- `ANTHROPIC_API_KEY=votre_clé_api_anthropic`
- `SMS_API_KEY=votre_clé_api_sms`
- `EMAIL_API_KEY=votre_clé_api_email`

### Variables de paiement
- `MTN_MOMO_API_KEY=votre_clé_api_mtn`
- `ORANGE_MONEY_API_KEY=votre_clé_api_orange`

### Variables d'application
- `APP_URL=https://votre-app.onrender.com`
- `FRONTEND_URL=https://votre-frontend.onrender.com`

## Fichiers de Configuration

### Dockerfile

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

### docker-compose.yml (pour référence/local)

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATABASE_URL=postgresql://user:password@db:5432/logistics_db
      - MONGODB_URI=mongodb://mongo:27017/logistics_tracking
      - REDIS_URL=redis://redis:6379
      - RABBITMQ_URL=amqp://rabbitmq:5672
      - JWT_SECRET=your-jwt-secret
      - JWT_REFRESH_SECRET=your-refresh-secret
    depends_on:
      - db
      - mongo
      - redis
      - rabbitmq

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: logistics_db
      POSTGRES_USER: logistics_user
      POSTGRES_PASSWORD: logistics_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  mongo:
    image: mongo:6
    environment:
      MONGO_INITDB_ROOT_USERNAME: logistics_user
      MONGO_INITDB_ROOT_PASSWORD: logistics_password
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      RABBITMQ_DEFAULT_USER: logistics_user
      RABBITMQ_DEFAULT_PASS: logistics_password

volumes:
  postgres_data:
  mongo_data:
```

### Script de migration personnalisé (migration.sh)

```bash
#!/bin/bash
set -e

echo "Running database migrations..."
npm run migration:run

echo "Seeding database..."
npm run seed

echo "Starting application..."
npm run start:prod
```

## Points Importants à Considérer

1. **Base de données** : Vous devrez probablement créer une base PostgreSQL séparément (sur Render, Railway, ou service tiers comme Supabase)

2. **Variables d'environnement** : Ne jamais commiter le fichier `.env` - utilisez toujours des variables d'environnement dans votre service de déploiement

3. **Migration de base de données** : Si votre application nécessite des migrations, configurez-les pour s'exécuter au démarrage ou manuellement

4. **Sécurité** : Remplacez toutes les clés API par défaut par des clés sécurisées dans l'environnement de production

5. **Journaux (Logs)** : Utilisez les outils de journalisation de votre plateforme de déploiement pour surveiller votre application

6. **Santé de l'application** : Assurez-vous que votre endpoint de santé (`/health`) est correctement configuré

7. **Timeouts** : Configurez correctement les timeouts pour les connexions aux bases de données et services externes

8. **Mises à jour** : Mettez en place un système de mise à jour automatique via Git ou manuelle selon vos besoins

Votre application NestJS est prête à être déployée sur Render ou une autre plateforme de votre choix en suivant ces étapes. La configuration spécifique dépendra des services externes dont votre application dépend (bases de données, Redis, RabbitMQ, etc.).