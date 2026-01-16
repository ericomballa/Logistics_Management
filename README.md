# 🚚 Logistics Management Platform - Backend API

[![NestJS](https://img.shields.io/badge/NestJS-10.x-E0234E?logo=nestjs)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql)](https://www.postgresql.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.x-47A248?logo=mongodb)](https://www.mongodb.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Plateforme complète de gestion logistique internationale avec suivi en temps réel, facturation automatisée et notifications multi-canaux (WhatsApp, SMS, Email).

---

## 📋 Table des matières

- [Fonctionnalités](#-fonctionnalités)
- [Architecture](#-architecture)
- [Technologies](#-technologies)
- [Installation Rapide](#-installation-rapide)
- [Configuration](#-configuration)
- [Lancement](#-lancement)
- [Documentation API](#-documentation-api)
- [Structure du Projet](#-structure-du-projet)
- [Modules](#-modules)
- [Tests](#-tests)
- [Déploiement](#-déploiement)
- [Contributing](#-contributing)
- [Support](#-support)
- [License](#-license)

---

## ✨ Fonctionnalités

### 🎯 Gestion Logistique
- ✅ **Gestion des colis** - CRUD complet avec génération automatique de tracking numbers
- ✅ **Tracking en temps réel** - Suivi événementiel avec MongoDB pour performance
- ✅ **Routes internationales** - Support Chine/Dubaï → Cameroun/Afrique Centrale
- ✅ **Statuts multiples** - 10+ statuts de suivi détaillés

### 🏭 Gestion des Entrepôts
- ✅ **Multi-entrepôts** - Gestion centralisée des entrepôts internationaux
- ✅ **Inventaire intelligent** - Scan QR/Barcode, localisation précise (A-15-03)
- ✅ **Capacité & occupation** - Monitoring en temps réel
- ✅ **Dispatch automatique** - Workflow optimisé

### 💰 Facturation & Paiements
- ✅ **Calcul automatique** - Tarifs par route, poids, volume
- ✅ **Paiements mobiles** - MTN Mobile Money, Orange Money
- ✅ **Paiements partiels** - Gestion flexible des versements
- ✅ **Factures professionnelles** - Numérotation automatique (INV-YYYYMM-XXXX)

### 📲 Notifications Multi-canaux
- ✅ **WhatsApp Business** - Canal prioritaire pour l'Afrique
- ✅ **SMS** - Fallback automatique si WhatsApp échoue
- ✅ **Email** - Confirmations et rapports détaillés
- ✅ **Messages intelligents** - Templates en français avec emojis

### 👥 Gestion des Utilisateurs
- ✅ **4 niveaux de rôles** - SUPER_ADMIN, ADMIN, AGENT, CLIENT
- ✅ **Multi-agences** - Gestion décentralisée
- ✅ **Authentification JWT** - Sécurisé avec refresh tokens
- ✅ **RBAC complet** - Guards et decorators

### 📊 Rapports & Analytics
- ✅ **Dashboard statistiques** - Vue globale en temps réel
- ✅ **Rapports revenus** - Par période, par agence
- ✅ **Performance entrepôts** - Occupation, temps de traitement
- ✅ **Temps de livraison** - Moyennes par route

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Client Applications                     │
│         (Web Dashboard / Mobile App / WhatsApp)         │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                      API Gateway                         │
│          (NestJS + JWT Auth + Rate Limiting)            │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                    Backend Services                      │
├─────────────────────────────────────────────────────────┤
│  Auth  │ Users │ Shipments │ Tracking │ Warehouse      │
│  Billing │ Notifications │ Reports │ WhatsApp Bot      │
└─────────────────────────────────────────────────────────┘
            ↓                ↓               ↓
    ┌───────────┐    ┌──────────┐    ┌──────────┐
    │PostgreSQL │    │ MongoDB  │    │  Redis   │
    │(Relations)│    │ (Events) │    │ (Cache)  │
    └───────────┘    └──────────┘    └──────────┘
            ↓
    ┌───────────┐
    │ RabbitMQ  │
    │  (Queue)  │
    └───────────┘
```

### Principes Architecturaux
- **DDD** (Domain-Driven Design)
- **Clean Architecture** - Séparation des responsabilités
- **Event-Driven** - Communication asynchrone avec RabbitMQ
- **SOLID Principles** - Code maintenable et extensible
- **API-First** - Documentation Swagger/OpenAPI

---

## 🛠️ Technologies

### Backend Framework
- **NestJS 10.x** - Framework Node.js progressif
- **TypeScript 5.x** - Typage statique fort
- **Express** - Serveur HTTP sous-jacent

### Bases de Données
- **PostgreSQL 15** - Données critiques (users, shipments, invoices)
- **MongoDB 6** - Événements de tracking (haute performance)
- **Redis 7** - Cache, sessions, rate limiting

### Message Queue
- **RabbitMQ** - Communication asynchrone entre services

### Authentification & Sécurité
- **Passport JWT** - Authentification stateless
- **bcrypt** - Hachage des mots de passe
- **Helmet** - Headers HTTP sécurisés
- **class-validator** - Validation robuste des données

### APIs Externes
- **WhatsApp Business API** - Notifications prioritaires
- **Meta Graph API** - Intégration WhatsApp
- **SMS Gateway** - Fallback notifications
- **SendGrid/Mailgun** - Emails transactionnels

### DevOps & Monitoring
- **Docker & Docker Compose** - Conteneurisation
- **TypeORM** - ORM avec migrations
- **Swagger/OpenAPI** - Documentation auto-générée
- **Jest** - Tests unitaires et E2E

---

## ⚡ Installation Rapide

### Prérequis

```bash
node --version    # v18.0.0 ou supérieur
npm --version     # 9.0.0 ou supérieur
docker --version  # 20.10.0 ou supérieur
```

### Installation en 3 commandes

```bash
# 1. Cloner le repository
git clone https://github.com/votre-org/logistics-backend.git
cd logistics-backend

# 2. Installation automatique (Docker + DB + Seed)
npm run setup

# 3. Lancer l'application
npm run start:dev
```

**🎉 C'est prêt !**
- API: http://localhost:3000/api/v1
- Swagger: http://localhost:3000/api/docs

---

## ⚙️ Configuration

### 1. Variables d'environnement

```bash
# Copier le template
cp .env.example .env
```

Éditez `.env` avec vos configurations :

```env
# Application
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://logistics_user:logistics_password@localhost:5432/logistics_db
MONGODB_URI=mongodb://logistics_user:logistics_password@localhost:27017/logistics_tracking

# JWT
JWT_SECRET=changez-cette-clé-en-production
JWT_REFRESH_SECRET=changez-cette-clé-refresh
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# WhatsApp Business
WHATSAPP_API_KEY=your_meta_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_VERIFY_TOKEN=your_webhook_token

# Payment Gateways
MTN_MOMO_API_KEY=your_mtn_api_key
ORANGE_MONEY_API_KEY=your_orange_api_key
```

### 2. Base de données

```bash
# Démarrer les services Docker
npm run docker:up

# Exécuter les migrations
npm run migration:run

# Peupler avec des données de test
npm run seed
```

---

## 🚀 Lancement

### Mode Développement

```bash
npm run start:dev
```

Serveur avec hot-reload sur http://localhost:3000

### Mode Production

```bash
# Build
npm run build

# Lancer
npm run start:prod
```

### Avec Docker

```bash
# Tout en un
docker-compose up -d

# Voir les logs
docker-compose logs -f app
```

---

## 📚 Documentation API

### Swagger UI

Ouvrez http://localhost:3000/api/docs pour explorer l'API interactive.

### Endpoints Principaux

#### 🔐 Authentification

```bash
POST /api/v1/auth/login          # Connexion
POST /api/v1/auth/register       # Inscription
POST /api/v1/auth/refresh        # Rafraîchir token
GET  /api/v1/auth/me             # Profil utilisateur
```

#### 👥 Utilisateurs

```bash
GET    /api/v1/users             # Liste utilisateurs
POST   /api/v1/users             # Créer utilisateur
GET    /api/v1/users/:id         # Détails utilisateur
PATCH  /api/v1/users/:id         # Modifier utilisateur
DELETE /api/v1/users/:id         # Supprimer utilisateur

GET    /api/v1/users/agencies    # Liste agences
POST   /api/v1/users/agencies    # Créer agence
```

#### 📦 Colis

```bash
GET    /api/v1/shipments                      # Liste colis
POST   /api/v1/shipments                      # Créer colis
GET    /api/v1/shipments/:id                  # Détails colis
GET    /api/v1/shipments/track/:trackingNumber # Tracker colis
PATCH  /api/v1/shipments/:id                  # Modifier colis
GET    /api/v1/shipments/stats                # Statistiques
```

#### 📍 Tracking

```bash
POST /api/v1/tracking/events              # Créer événement
GET  /api/v1/tracking/shipment/:id        # Timeline complète
GET  /api/v1/tracking/events/recent       # Événements récents
```

#### 🏭 Entrepôts

```bash
GET    /api/v1/warehouse                  # Liste entrepôts
POST   /api/v1/warehouse                  # Créer entrepôt
POST   /api/v1/warehouse/inventory        # Ajouter au stock
GET    /api/v1/warehouse/:id/inventory    # Inventaire entrepôt
PATCH  /api/v1/warehouse/inventory/:id/dispatch # Dispatcher
GET    /api/v1/warehouse/scan/qr/:code    # Scan QR
```

#### 💰 Facturation

```bash
POST   /api/v1/billing/calculate          # Calculer coût
POST   /api/v1/billing/invoices           # Créer facture
GET    /api/v1/billing/invoices           # Liste factures
POST   /api/v1/billing/payments           # Enregistrer paiement
GET    /api/v1/billing/reports/revenue    # Rapport revenus
```

#### 📲 Notifications

```bash
POST /api/v1/notifications/send                    # Envoyer notification
POST /api/v1/notifications/shipment-update         # Mise à jour colis
POST /api/v1/notifications/delivery-ready          # Colis prêt
POST /api/v1/notifications/payment-confirmation    # Confirmation paiement
```

### Exemple d'utilisation

```bash
# 1. Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@logistics.cm","password":"Admin@123"}'

# Réponse
{
  "user": {...},
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "..."
}

# 2. Créer un colis (avec le token)
curl -X POST http://localhost:3000/api/v1/shipments \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "senderName": "John Doe",
    "receiverName": "Jane Smith",
    "receiverPhone": "+237670123456",
    "receiverAddress": "Akwa, Douala",
    "origin": "CHINA",
    "destination": "CAMEROON",
    "weight": 5.5
  }'

# 3. Tracker le colis
curl -X GET "http://localhost:3000/api/v1/shipments/track/CN-ABC12345" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 📁 Structure du Projet

```
logistics-backend/
│
├── src/
│   ├── main.ts                    # Point d'entrée
│   ├── app.module.ts              # Module racine
│   │
│   ├── auth/                      # 🔐 Authentification
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   ├── auth.controller.ts
│   │   ├── strategies/            # JWT, Local
│   │   ├── guards/                # Auth & RBAC
│   │   └── dto/
│   │
│   ├── users/                     # 👥 Utilisateurs & Agences
│   │   ├── users.module.ts
│   │   ├── users.service.ts
│   │   ├── users.controller.ts
│   │   ├── entities/
│   │   └── dto/
│   │
│   ├── shipments/                 # 📦 Gestion Colis
│   │   ├── shipments.module.ts
│   │   ├── shipments.service.ts
│   │   ├── shipments.controller.ts
│   │   ├── entities/
│   │   └── dto/
│   │
│   ├── tracking/                  # 📍 Tracking Événementiel
│   │   ├── tracking.module.ts
│   │   ├── tracking.service.ts
│   │   ├── schemas/               # MongoDB schemas
│   │   └── dto/
│   │
│   ├── warehouse/                 # 🏭 Entrepôts
│   │   ├── warehouse.module.ts
│   │   ├── warehouse.service.ts
│   │   ├── entities/
│   │   └── dto/
│   │
│   ├── billing/                   # 💰 Facturation
│   │   ├── billing.module.ts
│   │   ├── billing.service.ts
│   │   ├── entities/
│   │   └── dto/
│   │
│   ├── notifications/             # 📲 Notifications
│   │   ├── notifications.module.ts
│   │   ├── notifications.service.ts
│   │   ├── services/              # WhatsApp, SMS, Email
│   │   └── dto/
│   │
│   ├── reports/                   # 📊 Rapports & Analytics
│   │   ├── reports.module.ts
│   │   ├── reports.service.ts
│   │   └── reports.controller.ts
│   │
│   └── shared/                    # 🔧 Modules Partagés
│       ├── redis/
│       ├── queue/
│       └── database/
│
├── test/                          # 🧪 Tests
│   └── *.e2e-spec.ts
│
├── docker-compose.yml             # 🐳 Docker config
├── Dockerfile
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🧩 Modules

### Auth Module
- Authentification JWT avec refresh tokens
- Stratégies Passport (JWT, Local)
- Guards pour protection des routes
- Decorators personnalisés (`@CurrentUser`, `@Roles`)

### Users Module
- CRUD utilisateurs avec 4 niveaux de rôles
- Gestion multi-agences
- Statistiques par utilisateur/agence

### Shipments Module
- Création avec tracking number auto-généré
- 10+ statuts de suivi
- Filtrage avancé (statut, origine, destination)
- Intégration avec Tracking & Billing

### Tracking Module
- Événements stockés dans MongoDB pour performance
- Timeline complète par colis
- Recherche par période, statut, localisation

### Warehouse Module
- Gestion multi-entrepôts
- Inventaire avec QR/Barcode
- Localisation précise (A-15-03)
- Taux d'occupation en temps réel

### Billing Module
- Calcul automatique des coûts (route + poids + volume)
- Factures avec numérotation auto
- Paiements partiels
- Support MTN MoMo & Orange Money

### Notifications Module
- WhatsApp Business API (prioritaire)
- SMS fallback automatique
- Email pour confirmations
- Templates en français avec emojis

### Reports Module
- Dashboard statistiques
- Rapports revenus par période
- Performance entrepôts
- Temps de livraison moyens

---

## 🧪 Tests

### Tests Unitaires

```bash
# Tous les tests
npm test

# Avec couverture
npm run test:cov

# Mode watch
npm run test:watch
```

### Tests E2E

```bash
npm run test:e2e
```

### Structure des Tests

```typescript
// users.service.spec.ts
describe('UsersService', () => {
  it('should create a user', async () => {
    const user = await service.create({...});
    expect(user).toBeDefined();
    expect(user.email).toBe('test@example.com');
  });
});
```

---

## 🚢 Déploiement

### Option 1 : VPS (DigitalOcean, Linode)

```bash
# 1. Sur votre VPS
git clone https://github.com/votre-org/logistics-backend.git
cd logistics-backend

# 2. Configuration
cp .env.example .env
# Éditer .env avec vos configurations production

# 3. Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# 4. Migrations
docker-compose exec app npm run migration:run
```

### Option 2 : Cloud (AWS, GCP, Azure)

**AWS ECS/Fargate :**
1. Build image Docker
2. Push vers ECR
3. Créer service ECS
4. Configurer RDS, DocumentDB, ElastiCache

**Configuration recommandée :**
- **Compute** : ECS Fargate (2 vCPU, 4GB RAM)
- **Database** : RDS PostgreSQL (db.t3.medium)
- **Cache** : ElastiCache Redis
- **Storage** : S3 pour fichiers

### Option 3 : Heroku

```bash
# 1. Créer l'app
heroku create logistics-api

# 2. Add-ons
heroku addons:create heroku-postgresql:hobby-dev
heroku addons:create heroku-redis:hobby-dev

# 3. Variables d'environnement
heroku config:set JWT_SECRET=your-secret

# 4. Déployer
git push heroku main
```

### Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name api.logistics.cm;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### SSL avec Let's Encrypt

```bash
# Installer Certbot
sudo apt install certbot python3-certbot-nginx

# Obtenir certificat
sudo certbot --nginx -d api.logistics.cm
```

---

## 🤝 Contributing

Les contributions sont les bienvenues ! Voici comment procéder :

### 1. Fork & Clone

```bash
git clone https://github.com/votre-username/logistics-backend.git
cd logistics-backend
git checkout -b feature/ma-fonctionnalite
```

### 2. Développer

```bash
# Installer les dépendances
npm install

# Lancer en dev
npm run start:dev

# Tester
npm test
```

### 3. Commit & Push

```bash
git add .
git commit -m "feat(shipments): add bulk import feature"
git push origin feature/ma-fonctionnalite
```

### 4. Pull Request

Créez une PR sur GitHub avec une description détaillée.

### Conventions

**Commits** : Suivre [Conventional Commits](https://www.conventionalcommits.org/)
```
feat(module): description
fix(module): description
docs: description
test: description
```

**Code Style** : ESLint + Prettier (auto-formaté)

---

## 📞 Support

### Documentation
- **Swagger** : http://localhost:3000/api/docs
- **NestJS Docs** : https://docs.nestjs.com
- **TypeORM** : https://typeorm.io

### Contact
- 📧 Email : support@logistics.cm
- 🐛 Issues : [GitHub Issues](https://github.com/votre-org/logistics-backend/issues)
- 💬 Discord : [Rejoindre notre serveur](https://discord.gg/...)

### FAQ

**Q : Comment changer le port ?**
```env
PORT=4000
```

**Q : Comment activer les logs détaillés ?**
```env
LOG_LEVEL=debug
```

**Q : MongoDB est obligatoire ?**
Oui, pour le tracking événementiel haute performance.

**Q : Puis-je utiliser MySQL au lieu de PostgreSQL ?**
Oui, changez `type: 'mysql'` dans `app.module.ts`

---

## 📜 License

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

## 🙏 Remerciements

- [NestJS](https://nestjs.com/) - Framework backend extraordinaire
- [TypeORM](https://typeorm.io/) - ORM puissant pour TypeScript
- Communauté open-source africaine 🇨🇲

---

## 📊 Statistiques du Projet

![GitHub Stars](https://img.shields.io/github/stars/votre-org/logistics-backend?style=social)
![GitHub Forks](https://img.shields.io/github/forks/votre-org/logistics-backend?style=social)
![GitHub Issues](https://img.shields.io/github/issues/votre-org/logistics-backend)
![GitHub Pull Requests](https://img.shields.io/github/issues-pr/votre-org/logistics-backend)

---

<div align="center">

**Développé avec ❤️ pour l'Afrique 🌍**

[⭐ Star ce projet](https://github.com/votre-org/logistics-backend) • [🐛 Reporter un bug](https://github.com/votre-org/logistics-backend/issues) • [💡 Demander une fonctionnalité](https://github.com/votre-org/logistics-backend/issues)

</div>


echo "# Logistics_Management" >> README.md
git init
git add README.md
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/ericomballa/Logistics_Management.git
git push -u origin main

…or push an existing repository from the command line
git remote add origin https://github.com/ericomballa/Logistics_Management.git
git branch -M main
git push -u origin main







user.email=eric.mballa@kaeyros-analytics.com
user.name=ericmballankoa
pull.ff=only
pull.rebase=true
rebase.autostash=true
http.postbuffer=157286400
http.version=HTTP/2
gemini.apikey=AIzaSyABFrxovUVf8bbBU8jlZCqWtJYI13I4ABc
