/**
 * Service IA - Intégration Claude API
 *
 * Si CLAUDE_API_KEY n'est pas défini, utilise des réponses mock
 */

const SYSTEM_PROMPT = `Tu es l'assistant IA du projet B2B ISFEC AFAREC IdF.

CONTEXTE :
- L'ISFEC est un institut de formation de l'Enseignement catholique
- Un projet de développement B2B (formation entreprises) est en cours
- Tu as accès aux études de marché V1 et V2
- L'utilisatrice est la responsable du projet

TON RÔLE :
- Répondre aux questions sur les études
- Aider à comprendre les analyses et recommandations
- Guider dans les décisions à prendre
- Expliquer les concepts (OPCO, Qualiopi, etc.)

STYLE :
- Professionnel mais accessible
- Concis (pas de réponses trop longues)
- Cite les sections pertinentes quand c'est utile
- Si tu ne sais pas, dis-le`;

// Réponses mock pour le développement
const MOCK_RESPONSES = [
  {
    keywords: ['opco', 'financement'],
    response: `Les OPCO (Opérateurs de Compétences) sont des organismes qui financent la formation professionnelle. Pour l'ISFEC, les principaux OPCO ciblés sont :

- **AKTO** : OPCO du réseau EC (OGEC), déjà partenaire
- **Uniformation** : Pour l'ESS et les associations
- **OPCO Santé** : Pour le médico-social

L'avantage est que les entreprises peuvent financer leurs formations via ces OPCO, ce qui facilite la décision d'achat.`,
  },
  {
    keywords: ['objectif', 'ca', 'chiffre'],
    response: `Les objectifs de CA du projet B2B sont :

- **Année 1** : 150 000 € (phase de lancement)
- **Année 2** : 350 000 € (croissance)
- **Année 3** : 700 000 € (consolidation)

Ces objectifs sont basés sur un funnel commercial réaliste et une montée en charge progressive des actions commerciales.`,
  },
  {
    keywords: ['segment', 'cible', 'marché'],
    response: `La V2 de l'étude propose une segmentation ambitieuse :

- **ESS non-EC** (37% du CA cible) : Associations, fondations, mutuelles
- **Médico-social** (26%) : EHPAD, établissements de santé
- **PME services** (29%) : Entreprises de services 10-50 salariés
- **Réseau EC** (9%) : OGEC, établissements scolaires catholiques

L'objectif est d'atteindre 65% du CA hors réseau EC à 3 ans.`,
  },
  {
    keywords: ['qualiopi', 'certification'],
    response: `**Qualiopi** est la certification qualité obligatoire pour les organismes de formation souhaitant bénéficier de fonds publics ou mutualisés.

L'ISFEC est déjà certifié Qualiopi, ce qui est un atout majeur pour le développement B2B car :
- Les clients peuvent faire financer leurs formations par leur OPCO
- C'est un gage de qualité pour les entreprises
- Cela ouvre l'accès aux marchés publics`,
  },
  {
    keywords: ['priorité', 'action', 'prochaine'],
    response: `D'après l'analyse de votre checklist et des études, voici les priorités :

1. **Valider le budget de lancement** (45 000 € recommandés)
2. **Nommer le responsable opérationnel** du projet
3. **Choisir l'organisation commerciale** (option A, B ou C)
4. **Fixer la date de lancement** (M1)

Ces décisions sont critiques car elles conditionnent tout le reste du planning.`,
  },
];

// Réponse par défaut
const DEFAULT_RESPONSE = `Je suis l'assistant IA du projet B2B ISFEC. Je peux vous aider à :

- Comprendre les études de marché V1 et V2
- Expliquer les concepts (OPCO, Qualiopi, segments cibles...)
- Identifier les priorités et prochaines actions
- Répondre à vos questions sur le projet

N'hésitez pas à me poser une question précise !`;

/**
 * Générer une réponse (mock ou via Claude API)
 */
async function chat(message, history = [], options = {}) {
  const apiKey = process.env.CLAUDE_API_KEY;

  // Si pas de clé API, utiliser le mock
  if (!apiKey) {
    return mockResponse(message);
  }

  // Sinon, appeler Claude API
  try {
    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey });

    // Construire le contexte
    let systemPrompt = SYSTEM_PROMPT;
    if (options.context) {
      systemPrompt += `\n\nCONTEXTE ACTUEL : ${options.context}`;
    }
    if (options.checklistResponses && options.checklistResponses.length > 0) {
      const checklistSummary = options.checklistResponses
        .map(r => `${r.field_id}: ${r.value}`)
        .join('\n');
      systemPrompt += `\n\nÉTAT DE LA CHECKLIST :\n${checklistSummary}`;
    }

    // Formater l'historique pour Claude
    const messages = history.map(m => ({
      role: m.role,
      content: m.content,
    }));

    // Ajouter le nouveau message s'il n'est pas déjà dans l'historique
    if (!messages.length || messages[messages.length - 1].content !== message) {
      messages.push({ role: 'user', content: message });
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    return response.content[0].text;

  } catch (error) {
    console.error('Erreur Claude API:', error);
    // Fallback sur le mock en cas d'erreur
    return mockResponse(message);
  }
}

/**
 * Générer une réponse mock basée sur les mots-clés
 */
function mockResponse(message) {
  const lowerMessage = message.toLowerCase();

  // Chercher une réponse correspondante
  for (const mock of MOCK_RESPONSES) {
    if (mock.keywords.some(kw => lowerMessage.includes(kw))) {
      return mock.response;
    }
  }

  // Réponse par défaut
  return DEFAULT_RESPONSE;
}

module.exports = { chat, SYSTEM_PROMPT };
