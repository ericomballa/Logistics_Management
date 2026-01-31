import { Controller, Post, Get, Body, Query, HttpCode, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WhatsappBotOrchestrator } from '../orchestrators/bot.orchestrator';
import { WhatsAppWebhookDto } from '../dto/webhook.dto';

@Controller('webhook')
export class WhatsappWebhookController {
  private readonly logger = new Logger(WhatsappWebhookController.name);

  constructor(
    private configService: ConfigService,
    private botOrchestrator: WhatsappBotOrchestrator,
  ) {}

  // Vérification du webhook (requis par Meta)
  @Get()
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    console.log('hello webhook =====>');

    const verifyToken = this.configService.get('WHATSAPP_VERIFY_TOKEN');
    console.log('token meta ===>', token);
    console.log('verifyToken ===>', verifyToken);
    console.log('mode ===>', mode);

    if (mode === 'subscribe' && token === verifyToken) {
      this.logger.log('✅ Webhook vérifié avec succès');
      return challenge;
    }

    this.logger.error('❌ Échec de vérification du webhook');
    return 'Forbidden';
  }

  // Reception des messages WhatsApp
  @Post()
  @HttpCode(200)
  async handleWebhook(@Body() body: WhatsAppWebhookDto) {
    try {
      console.log('weebhook hello');

      this.logger.log('📨 Webhook reçu');

      if (body.object === 'whatsapp_business_account') {
        for (const entry of body.entry) {
          for (const change of entry.changes) {
            if (change.value.messages) {
              for (const message of change.value.messages) {
                if (message.type === 'text' && message.text?.body) {
                  const from = message.from;
                  const messageText = message.text.body;
                  const messageId = message.id;

                  // Récupérer le nom de l'utilisateur
                  const userName = change.value.contacts?.[0]?.profile?.name;

                  this.logger.log(`📱 Message de ${from}: ${messageText}`);

                  // Traiter le message de manière asynchrone
                  this.botOrchestrator
                    .handleIncomingMessage(from, messageText, messageId, userName)
                    .catch((err) => {
                      this.logger.error(`Erreur traitement: ${err.message}`);
                    });
                }
              }
            }
          }
        }
      }

      return { status: 'success' };
    } catch (error) {
      this.logger.error(`Erreur webhook: ${error.message}`);
      return { status: 'error' };
    }
  }
}
