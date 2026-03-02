# Guide de déploiement sur Railway

## Étape 1 : Créer un compte et installer Railway CLI

1. Allez sur [railway.app](https://railway.app) et créez un compte
2. Installez le CLI Railway :
```bash
npm install -g @railway/cli
```
3. Connectez-vous à votre compte :
```bash
railway login
```

## Étape 2 : Initialiser votre projet sur Railway

1. Dans le répertoire de votre projet, exécutez :
```bash
railway init
```
2. Sélectionnez "Deploy from your current directory"
3. Nommez votre projet (ex: "logistics-backend")

## Étape 3 : Configurer les variables d'environnement

1. Accédez à votre projet sur le dashboard Railway
2. Allez dans l'onglet "Variables"
3. Ajoutez toutes les variables d'environnement nécessaires :

### Variables de base
- `NODE_ENV=production`
- `PORT=8080` (Railway utilise le port 8080 par défaut)

### Variables de base de données
- `DATABASE_URL=` (URL de votre base PostgreSQL sur Railway)
- `MONGODB_URI=` (si vous utilisez MongoDB)
- `REDIS_URL=` (si vous utilisez Redis)
- `RABBITMQ_URL=` (si vous utilisez RabbitMQ)

### Variables de sécurité
- `JWT_SECRET=` (générez une clé sécurisée)
- `JWT_REFRESH_SECRET=` (générez une clé sécurisée)

### Variables d'API
- `WHATSAPP_API_KEY=`
- `WHATSAPP_PHONE_NUMBER_ID=`
- `WHATSAPP_ACCESS_TOKEN=`
- `ANTHROPIC_API_KEY=`
- `SMS_API_KEY=`
- `EMAIL_API_KEY=`

### Variables de paiement
- `MTN_MOMO_API_KEY=`
- `ORANGE_MONEY_API_KEY=`

### Variables d'application
- `APP_URL=` (URL de votre application Railway)
- `FRONTEND_URL=` (URL de votre frontend)

## Étape 4 : Ajouter des services supplémentaires

1. Dans votre projet Railway, cliquez sur "New" → "Database"
2. Sélectionnez PostgreSQL et nommez-le (ex: "logistics-db")
3. Répétez pour MongoDB, Redis, ou RabbitMQ si nécessaire
4. Les variables d'environnement seront automatiquement ajoutées

## Étape 5 : Configurer les paramètres de déploiement

1. Allez dans l'onglet "Settings" de votre projet
2. Dans "Build & Run Settings", assurez-vous que :
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start:prod`

## Étape 6 : Déployer

1. Pour déployer manuellement :
```bash
railway up
```
2. Pour activer le déploiement automatique depuis GitHub :
   - Allez dans "Settings" → "Continuous Deployment"
   - Connectez votre dépôt GitHub
   - Activez le déploiement automatique

## Étape 7 : Gérer les migrations de base de données

Pour exécuter les migrations, vous pouvez soit :

1. Exécuter manuellement via le terminal Railway :
```bash
railway run npm run migration:run
```

2. Ou ajouter une étape de pré-déploiement dans votre configuration :
```bash
npm run migration:run && npm run start:prod
```

## Configuration spécifique pour Railway

Vous pouvez également créer un fichier `railway.toml` à la racine de votre projet :

```toml
[build]
builder = "nixpacks"
buildCommand = "npm install && npm run build"
startCommand = "npm run start:prod"

[variables]
NODE_ENV = "production"
PORT = "8080"
```

## Points spécifiques à Railway

1. **Port** : Railway attribue dynamiquement le port via la variable d'environnement `PORT`
2. **Temps d'inactivité** : Le plan gratuit met en veille les applications inactives
3. **Quotas** : 500 heures/mois gratuits pour les projets personnels
4. **Domaines** : Utilisez le domaine par défaut `.railway.app` ou connectez un domaine personnalisé

Votre application sera accessible via une URL comme `https://votre-app.railway.app`.

## Dépannage

Si vous rencontrez des problèmes :
- Vérifiez les logs dans l'onglet "Logs" du dashboard
- Assurez-vous que toutes les variables d'environnement sont correctement définies
- Confirmez que votre application écoute sur le port fourni par la variable `PORT`
- Vérifiez que les dépendances sont correctement installées dans `package.json`