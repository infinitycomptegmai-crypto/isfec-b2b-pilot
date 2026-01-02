const express = require('express');
const router = express.Router();
const { getDatabase } = require('../../config/database');
const aiService = require('../../services/ai');

// Envoyer un message
router.post('/message', async (req, res) => {
  const db = getDatabase();
  const userId = req.session.user.id;
  const { message, conversationId, context } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message requis' });
  }

  try {
    let convId = conversationId;

    // Créer une nouvelle conversation si nécessaire
    if (!convId) {
      const result = db.prepare(`
        INSERT INTO conversations (user_id, title, created_at, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(userId, message.substring(0, 50) + '...');
      convId = result.lastInsertRowid;
    }

    // Sauvegarder le message utilisateur
    db.prepare(`
      INSERT INTO messages (conversation_id, role, content, context, created_at)
      VALUES (?, 'user', ?, ?, CURRENT_TIMESTAMP)
    `).run(convId, message, context || null);

    // Récupérer l'historique de la conversation
    const history = db.prepare(`
      SELECT role, content FROM messages
      WHERE conversation_id = ?
      ORDER BY created_at ASC
    `).all(convId);

    // Récupérer les réponses de la checklist pour le contexte
    const checklistResponses = db.prepare(`
      SELECT field_id, value FROM checklist_responses WHERE user_id = ?
    `).all(userId);

    // Appeler le service IA
    const response = await aiService.chat(message, history, {
      context,
      checklistResponses,
    });

    // Sauvegarder la réponse
    db.prepare(`
      INSERT INTO messages (conversation_id, role, content, context, created_at)
      VALUES (?, 'assistant', ?, ?, CURRENT_TIMESTAMP)
    `).run(convId, response, context || null);

    // Mettre à jour la conversation
    db.prepare(`
      UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(convId);

    res.json({
      success: true,
      conversationId: convId,
      response,
    });

  } catch (error) {
    console.error('Erreur assistant IA:', error);
    res.status(500).json({ error: 'Erreur lors de la génération de la réponse' });
  }
});

// Récupérer l'historique d'une conversation
router.get('/conversation/:id', (req, res) => {
  const db = getDatabase();
  const userId = req.session.user.id;
  const { id } = req.params;

  // Vérifier que la conversation appartient à l'utilisateur
  const conversation = db.prepare(`
    SELECT * FROM conversations WHERE id = ? AND user_id = ?
  `).get(id, userId);

  if (!conversation) {
    return res.status(404).json({ error: 'Conversation non trouvée' });
  }

  const messages = db.prepare(`
    SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC
  `).all(id);

  res.json({ conversation, messages });
});

// Créer une nouvelle conversation
router.post('/new', (req, res) => {
  const db = getDatabase();
  const userId = req.session.user.id;

  const result = db.prepare(`
    INSERT INTO conversations (user_id, title, created_at, updated_at)
    VALUES (?, 'Nouvelle conversation', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).run(userId);

  res.json({
    success: true,
    conversationId: result.lastInsertRowid,
  });
});

// Récupérer toutes les conversations
router.get('/history', (req, res) => {
  const db = getDatabase();
  const userId = req.session.user.id;

  const conversations = db.prepare(`
    SELECT c.*,
           (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) as message_count
    FROM conversations c
    WHERE c.user_id = ?
    ORDER BY c.updated_at DESC
  `).all(userId);

  res.json(conversations);
});

module.exports = router;
