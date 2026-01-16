import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private anthropic: Anthropic;

  constructor(private configService: ConfigService) {
    this.anthropic = new Anthropic({
      apiKey: this.configService.get('ANTHROPIC_API_KEY'),
    });
  }

  async generateResponse(
    conversationHistory: any[],
    userMessage: string,
    context?: any,
  ): Promise<string> {
    try {
      const systemPrompt = `Tu es un assistant virtuel pour CARGO EXPRESS, une entreprise de transport de colis depuis la Chine et Dubaï vers le Cameroun.

INFORMATIONS IMPORTANTES:
📦 Services:
- Transport de colis depuis la Chine et Dubaï
- Livraison partout au Cameroun
- Suivi en temps réel

💰 Tarifs:
- Chine → Cameroun: 5000 FCFA/kg
- Dubaï → Cameroun: 4000 FCFA/kg
- Minimum: 1 kg

⏱️ Délais de livraison:
- Depuis la Chine: 15-20 jours ouvrés
- Depuis Dubaï: 10-15 jours ouvrés

📍 Zones de livraison:
- Yaoundé, Douala, Bafoussam, Garoua, Maroua, Ngaoundéré, Bamenda
- Autres villes: nous contacter

FONCTIONNALITÉS:
1. Créer un nouvel envoi
2. Suivre un colis existant
3. Calculer un devis
4. Informations générales

STYLE DE COMMUNICATION:
- Sois amical, professionnel et concis
- Utilise des emojis pertinents
- Pose des questions claires pour collecter les informations nécessaires
- Si l'utilisateur veut créer un envoi, collecte: origine, poids, description, destinataire
- Fournis toujours le numéro de suivi après création

${context ? `CONTEXTE ACTUEL: ${JSON.stringify(context)}` : ''}

Réponds en français de manière claire et engageante.`;

      const messages = conversationHistory.slice(-10).map((msg) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content,
      }));

      messages.push({
        role: 'user',
        content: userMessage,
      });

      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages: messages as any,
      });

      return response.content[0].type === 'text' ? response.content[0].text : '';
    } catch (error) {
      this.logger.error(`Erreur AI: ${error.message}`);
      return 'Désolé, je rencontre un problème technique. Veuillez réessayer dans un instant.';
    }
  }

  async extractShipmentInfo(conversationHistory: any[]): Promise<any> {
    try {
      const messages = conversationHistory.map((msg) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content,
      }));

      const systemPrompt = `Analyse la conversation et extrait les informations d'envoi suivantes au format JSON:
{
  "origin": "Chine ou Dubaï",
  "weight": nombre en kg,
  "description": "description du colis",
  "recipientName": "nom du destinataire",
  "recipientPhone": "téléphone",
  "deliveryAddress": "adresse complète"
}

Si une information manque, mets null. Réponds UNIQUEMENT avec le JSON, sans texte supplémentaire.`;

      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: systemPrompt,
        messages: messages as any,
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '{}';
      return JSON.parse(content);
    } catch (error) {
      this.logger.error(`Erreur extraction info: ${error.message}`);
      return null;
    }
  }
}
