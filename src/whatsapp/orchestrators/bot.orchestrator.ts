import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WhatsappApiService } from '../services/whatsapp-api.service';
import { AIService } from '../services/ai.service';
import { ConversationService } from '../services/conversation.service';
import { ShipmentsService } from '../../shipments/shipments.service';
import { CreateShipmentDto } from '../../shipments/dto/create-shipment.dto';
import { UpdateShipmentDto } from '../../shipments/dto/update-shipment.dto';
import { OriginCountry } from '../../shipments/enums/origin-country.enum';
import { DestinationCountry } from '../../shipments/enums/destination-country.enum';
import { ShipmentStatus } from '../../shipments/enums/shipment-status.enum';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../users/enums/user-role.enum';
import { WhatsappUser } from '../entities/whatsapp-user.entity';

@Injectable()
export class WhatsappBotOrchestrator {
  private readonly logger = new Logger(WhatsappBotOrchestrator.name);

  constructor(
    private whatsappService: WhatsappApiService,
    private aiService: AIService,
    private conversationService: ConversationService,
    private shipmentService: ShipmentsService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(WhatsappUser)
    private whatsappUserRepository: Repository<WhatsappUser>,
  ) {}

  async handleIncomingMessage(
    from: string,
    messageText: string,
    messageId: string,
    userName?: string,
  ) {
    try {
      // Marquer le message comme lu
      await this.whatsappService.markAsRead(messageId);

      // Obtenir ou créer l'utilisateur WhatsApp
      const whatsappUser = await this.conversationService.getOrCreateUser(from, userName);

      // Essayer de trouver un utilisateur existant avec le même numéro de téléphone
      let existingUser = await this.userRepository.findOne({
        where: { phone: from },
      });

      // Si aucun utilisateur existant trouvé, créer un utilisateur client basique
      if (!existingUser) {
        existingUser = this.userRepository.create({
          phone: from,
          name: whatsappUser.name || 'WhatsApp User',
          email: `${from}@whatsapp-client.com`,
          role: UserRole.CLIENT,
          isActive: true,
        });
        existingUser = await this.userRepository.save(existingUser);
      }

      // Obtenir la conversation active
      const conversation = await this.conversationService.getActiveConversation(whatsappUser.id);

      // Sauvegarder le message de l'utilisateur
      await this.conversationService.saveMessage(conversation.id, messageText, 'user', messageId);

      // Vérifier si c'est un numéro de suivi
      if (await this.handleTrackingQuery(messageText, from)) {
        return;
      }

      // Vérifier si c'est une demande de création d'envoi
      if (this.isShipmentCreationIntent(messageText)) {
        await this.conversationService.updateConversationStep(conversation.id, 'creating_shipment');
      }

      // Obtenir l'historique
      const history = await this.conversationService.getConversationHistory(conversation.id, 10);
      const reversedHistory = history.reverse();

      // Générer une réponse avec l'IA
      const aiResponse = await this.aiService.generateResponse(
        reversedHistory,
        messageText,
        conversation.context,
      );

      // Sauvegarder la réponse
      await this.conversationService.saveMessage(conversation.id, aiResponse, 'bot');

      // Envoyer la réponse
      await this.whatsappService.sendTextMessage(from, aiResponse);

      // Traiter les intentions spéciales
      await this.processSpecialIntents(messageText, conversation, existingUser.id, from);
    } catch (error) {
      this.logger.error(`Erreur traitement message: ${error.message}`);
      await this.whatsappService.sendTextMessage(
        from,
        "😔 Désolé, une erreur s'est produite. Notre équipe a été notifiée. Veuillez réessayer.",
      );
    }
  }

  private async handleTrackingQuery(message: string, from: string): Promise<boolean> {
    // Chercher un numéro de suivi dans le message
    const trackingPattern = /[A-Z]{2}-[A-Z0-9]{8,12}/gi;
    const trackingMatches = message.match(trackingPattern);

    if (trackingMatches) {
      for (const trackingNumber of trackingMatches) {
        try {
          const shipment = await this.shipmentService.findByTrackingNumber(trackingNumber);

          if (shipment) {
            const statusText = this.getStatusText(shipment.status);
            const response = `
📦 *Suivi du colis ${trackingNumber}*

📍 Origine: ${shipment.origin}
🎯 Destination: ${shipment.destination}
⚖️ Poids: ${shipment.weight} kg
${shipment.description ? `📝 Description: ${shipment.description}` : ''}

${statusText}

💰 Coût: ${shipment.declaredValue?.toLocaleString('fr-FR')} FCFA

📅 Créé le: ${new Date(shipment.createdAt).toLocaleDateString('fr-FR')}

Pour toute question, répondez à ce message !
            `.trim();

            await this.whatsappService.sendTextMessage(from, response);
            return true;
          }
        } catch (error) {
          // Si le colis n'existe pas, continuer à chercher d'autres numéros
          continue;
        }
      }
    }

    return false;
  }

  private isShipmentCreationIntent(message: string): boolean {
    const keywords = [
      'envoyer',
      'envoi',
      'colis',
      'expédier',
      'expédition',
      'transporter',
      'livraison',
      'nouveau',
      'créer',
      'commander',
    ];

    const lowerMessage = message.toLowerCase();
    return keywords.some((keyword) => lowerMessage.includes(keyword));
  }

  private async processSpecialIntents(
    message: string,
    conversation: any,
    userId: string,
    from: string,
  ): Promise<void> {
    const lowerMessage = message.toLowerCase();

    // Détection de confirmation de création d'envoi
    if (
      conversation.currentStep === 'creating_shipment' &&
      (lowerMessage.includes('oui') ||
        lowerMessage.includes('confirmer') ||
        lowerMessage.includes('valider'))
    ) {
      const history = await this.conversationService.getConversationHistory(conversation.id, 20);
      const shipmentInfo = await this.aiService.extractShipmentInfo(history.reverse());

      if (shipmentInfo && shipmentInfo.origin && shipmentInfo.weight) {
        try {
          // Convertir l'origine en enum approprié
          let originEnum: OriginCountry;
          if (
            shipmentInfo.origin.toLowerCase().includes('chine') ||
            shipmentInfo.origin.toLowerCase().includes('china')
          ) {
            originEnum = OriginCountry.CHINA;
          } else if (
            shipmentInfo.origin.toLowerCase().includes('dubaï') ||
            shipmentInfo.origin.toLowerCase().includes('dubai')
          ) {
            originEnum = OriginCountry.DUBAI;
          } else {
            // Par défaut, utiliser China
            originEnum = OriginCountry.CHINA;
          }

          // Créer le DTO pour la création de l'envoi
          const createShipmentDto: CreateShipmentDto = {
            senderName: shipmentInfo.recipientName || 'Client WhatsApp',
            senderPhone: from,
            receiverName: shipmentInfo.recipientName || 'Destinataire',
            receiverPhone: shipmentInfo.recipientPhone || from,
            receiverAddress: shipmentInfo.deliveryAddress || 'À préciser',
            origin: originEnum,
            destination: DestinationCountry.CAMEROON,
            weight: parseFloat(shipmentInfo.weight),
            description: shipmentInfo.description || 'Colis depuis WhatsApp',
            numberOfPackages: 1,
            volume: 0,
            declaredValue: 0,
          };

          // Créer l'envoi via le service existant
          const shipment = await this.shipmentService.create(createShipmentDto, userId);

          const confirmationMessage = `
✅ *Envoi créé avec succès !*

📝 Numéro de suivi: *${shipment.trackingNumber}*

📍 ${shipment.origin} → ${shipment.destination}
⚖️ Poids: ${shipment.weight} kg
💰 Coût estimé: ${shipment.declaredValue?.toLocaleString('fr-FR')} FCFA

⏱️ Délai de livraison: ${shipment.origin.includes('CH') ? '15-20 jours' : '10-15 jours'}

Conservez votre numéro de suivi pour suivre votre colis ! 📱
          `.trim();

          await this.whatsappService.sendTextMessage(from, confirmationMessage);
          await this.conversationService.updateConversationStep(conversation.id, 'completed');
        } catch (error) {
          this.logger.error(`Erreur création envoi: ${error.message}`);
          await this.whatsappService.sendTextMessage(
            from,
            '❌ Une erreur est survenue lors de la création de votre envoi. Veuillez réessayer.',
          );
        }
      } else {
        // Demander plus d'informations
        const requestMessage = `
📦 Pour créer votre envoi, j'ai besoin de quelques informations :

📍 *Origine* : Chine ou Dubaï ?
⚖️ *Poids* : Combien de kg ?
📝 *Description* : Qu'y a-t-il dans le colis ?
👤 *Destinataire* : Nom et téléphone
🏠 *Adresse* : Où faut-il livrer ?

Veuillez fournir ces détails pour que je puisse créer votre envoi.
        `.trim();

        await this.whatsappService.sendTextMessage(from, requestMessage);
      }
    }

    // Demande de tarifs
    if (
      lowerMessage.includes('tarif') ||
      lowerMessage.includes('prix') ||
      lowerMessage.includes('coût')
    ) {
      await this.whatsappService.sendInteractiveButtons(from, '💰 Nos tarifs par kilogramme:', [
        { id: 'rate_china', title: '🇨🇳 Chine: 5000 FCFA/kg' },
        { id: 'rate_dubai', title: '🇦🇪 Dubaï: 4000 FCFA/kg' },
      ]);
    }

    // Fonctionnalités pour les agents - mise à jour de colis
    const isAgent = await this.isUserAgent(from);
    if (isAgent) {
      await this.processAgentCommands(lowerMessage, from, userId);
    }
  }

  private async isUserAgent(phoneNumber: string): Promise<boolean> {
    try {
      // Rechercher l'utilisateur par numéro de téléphone
      const user = await this.userRepository.findOne({
        where: { phone: phoneNumber, role: UserRole.AGENT },
      });

      // Retourner vrai si un utilisateur avec le rôle AGENT est trouvé
      return !!user;
    } catch (error) {
      this.logger.error(`Erreur lors de la vérification du rôle de l'agent: ${error.message}`);
      return false;
    }
  }

  private async processAgentCommands(lowerMessage: string, from: string, userId: string) {
    // Commande pour changer le statut d'un colis
    const statusChangeMatch = lowerMessage.match(
      /(changer|mettre à jour|update|status|statut)\s+(.+?)\s+(en|to)\s+(.+)/i,
    );
    if (statusChangeMatch) {
      const trackingNumber = this.extractTrackingNumber(lowerMessage);
      const newStatus = this.normalizeStatus(statusChangeMatch[4]);

      if (trackingNumber && newStatus) {
        try {
          // Trouver le colis
          const shipment = await this.shipmentService.findByTrackingNumber(trackingNumber);

          // Mettre à jour le colis
          const updateDto: UpdateShipmentDto = { status: newStatus as ShipmentStatus };
          await this.shipmentService.update(shipment.id, updateDto, userId);

          await this.whatsappService.sendTextMessage(
            from,
            `✅ Statut du colis ${trackingNumber} mis à jour à: ${newStatus}`,
          );
        } catch (error) {
          await this.whatsappService.sendTextMessage(
            from,
            `❌ Impossible de mettre à jour le colis ${trackingNumber}: ${error.message}`,
          );
        }
      }
    }

    // Commande pour ajouter une note de suivi
    const trackingNoteMatch = lowerMessage.match(/(ajouter|note|commentaire)\s+(.+)/i);
    if (trackingNoteMatch) {
      const trackingNumber = this.extractTrackingNumber(lowerMessage);
      const note = trackingNoteMatch[2];

      if (trackingNumber && note) {
        try {
          // Trouver le colis
          const shipment = await this.shipmentService.findByTrackingNumber(trackingNumber);

          // Ajouter un événement de suivi (vous devrez peut-être étendre le service pour cela)
          await this.whatsappService.sendTextMessage(
            from,
            `📝 Note ajoutée au colis ${trackingNumber}: "${note}"`,
          );
        } catch (error) {
          await this.whatsappService.sendTextMessage(
            from,
            `❌ Impossible d'ajouter la note au colis ${trackingNumber}: ${error.message}`,
          );
        }
      }
    }
  }

  private extractTrackingNumber(text: string): string | null {
    const trackingPattern = /[A-Z]{2}-[A-Z0-9]{8,12}/gi;
    const matches = text.match(trackingPattern);
    return matches ? matches[0] : null;
  }

  private normalizeStatus(statusInput: string): string {
    const statusMap: { [key: string]: string } = {
      pending: 'PENDING',
      'en attente': 'PENDING',
      processing: 'PROCESSING',
      'en cours': 'PROCESSING',
      'in transit': 'IN_TRANSIT',
      'en transit': 'IN_TRANSIT',
      arrived: 'ARRIVED',
      arrivée: 'ARRIVED',
      'out for delivery': 'OUT_FOR_DELIVERY',
      'en cours de livraison': 'OUT_FOR_DELIVERY',
      delivered: 'DELIVERED',
      livré: 'DELIVERED',
      cancelled: 'CANCELLED',
      annulé: 'CANCELLED',
    };

    const normalized = statusInput.toLowerCase().trim();
    return statusMap[normalized] || normalized.toUpperCase();
  }

  private getStatusText(status: string): string {
    const translations = {
      PENDING: '⏳ En attente de traitement',
      PROCESSING: '📦 En cours de traitement',
      IN_TRANSIT: '✈️ En transit',
      ARRIVED: '🛬 Arrivé au Cameroun',
      OUT_FOR_DELIVERY: '🚚 En cours de livraison',
      DELIVERED: '✅ Livré',
      CANCELLED: '❌ Annulé',
    };
    return translations[status] || status;
  }
}
