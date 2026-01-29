# Solution pour le problème de validation de webhook WhatsApp

## Problème
Vous rencontrez des difficultés pour valider votre URL ngrok avec le webhook WhatsApp Business API.

## Solutions possibles

### 1. Vérifier la configuration de votre endpoint

Votre endpoint doit répondre correctement à la requête GET envoyée par Facebook pour la validation du webhook.

#### Exemple de code pour gérer la validation :

```typescript
// Dans votre contrôleur WhatsApp (ex: whatsapp.controller.ts)
import { Controller, Get, Post, Query, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Controller('whatsapp')
export class WhatsappController {
  
  @Get('webhook')
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    // Votre token de vérification
    const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN; // 'votre_verify_token'

    // Vérifiez si le mode et le token correspondent
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      // Retournez le challenge pour confirmer la validation
      res.status(HttpStatus.OK).send(challenge);
    } else {
      // Token invalide
      res.status(HttpStatus.FORBIDDEN).send('Token de vérification invalide');
    }
  }

  @Post('webhook')
  handleWebhook(@Body() body: any) {
    // Traitez les messages entrants ici
    console.log('Message reçu:', body);
    return { status: 'success' };
  }
}
```

### 2. Alternatives à Ngrok

Voici plusieurs alternatives gratuites à Ngrok pour exposer votre serveur local :

#### A. LocalTunnel
```bash
# Installation
npm install -g local tunnel

# Exposition de votre serveur
npx localtunnel --port 3000
```

#### B. Cloudflare Tunnel (Argo Tunnel)
```bash
# Télécharger et installer cloudflared
# Visitez: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/

# Créer un tunnel
cloudflared tunnel create my-tunnel

# Exécuter le tunnel
cloudflared tunnel run my-tunnel --url http://localhost:3000
```

#### C. Serveo
```bash
# Via SSH
ssh -R 80:localhost:3000 serveo.net
```

#### D. Localtunnel.me (service en ligne)
- Visitez https://localtunnel.me/
- Utilisez leur interface web ou l'API

### 3. Meilleures pratiques pour la configuration WhatsApp

#### A. Variables d'environnement
Assurez-vous que vos variables d'environnement sont correctement configurées :

```
WHATSAPP_VERIFY_TOKEN=votre_verify_token_unique
WHATSAPP_ACCESS_TOKEN=votre_access_token
WHATSAPP_PHONE_NUMBER_ID=votre_phone_number_id
```

#### B. Endpoint correct
- URL: `https://votre-domaine.ngrok-free.dev/whatsapp/webhook`
- Méthode: GET pour la validation, POST pour les messages
- Token de vérification: doit correspondre exactement à celui configuré dans le portail Facebook

### 4. Dépannage

#### A. Vérifier les logs
Activez les logs pour voir les requêtes entrantes :

```typescript
import { Logger } from '@nestjs/common';

// Dans votre contrôleur
private readonly logger = new Logger(WhatsappController.name);

@Get('webhook')
verifyWebhook(...) {
  this.logger.log(`Requête de validation reçue: mode=${mode}, token=${token}`);
  // ... code de validation
}
```

#### B. Tester manuellement
Utilisez curl pour tester manuellement votre endpoint :

```bash
curl -X GET \
  "https://votre-domaine.ngrok-free.dev/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=votre_verify_token&hub.challenge=test_challenge"
```

#### C. Vérifier la configuration SSL
Certains services WhatsApp exigent une connexion HTTPS. Assurez-vous que votre tunnel fournit un certificat SSL valide.

### 5. Configuration complète pour WhatsApp Business API

Voici un exemple complet de configuration :

```typescript
// whatsapp.module.ts
import { Module } from '@nestjs/common';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';

@Module({
  controllers: [WhatsappController],
  providers: [WhatsappService],
})
export class WhatsappModule {}

// whatsapp.service.ts
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly baseUrl = 'https://graph.facebook.com/v17.0';

  async sendMessage(recipientId: string, message: string) {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    try {
      const response = await axios.post(
        `${this.baseUrl}/${phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: recipientId,
          text: { body: message },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data;
    } catch (error) {
      this.logger.error('Erreur lors de l\'envoi du message:', error.message);
      throw error;
    }
  }
}
```

### 6. Recommandations

1. Utilisez un service d'exposition locale fiable et stable
2. Gardez votre token de vérification secret et unique
3. Implémentez une gestion d'erreurs appropriée
4. Surveillez les logs pour détecter les problèmes
5. Testez régulièrement la connectivité de votre webhook

### 7. Déploiement en production

Pour une solution durable, envisagez de déployer votre application sur une plateforme cloud comme Render, Railway, ou AWS, plutôt que d'utiliser un tunnel local pour la production.