const express = require('express');
const router = express.Router();
const { getDatabase } = require('../config/database');

// Page assistant IA
router.get('/', (req, res) => {
  const db = getDatabase();
  const userId = req.session.user.id;

  // Récupérer les conversations de l'utilisateur
  const conversations = db.prepare(`
    SELECT c.*,
           (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message
    FROM conversations c
    WHERE c.user_id = ?
    ORDER BY c.updated_at DESC
    LIMIT 10
  `).all(userId);

  // Récupérer la conversation active (la plus récente ou nouvelle)
  let activeConversation = null;
  let messages = [];

  if (conversations.length > 0) {
    activeConversation = conversations[0];
    messages = db.prepare(
      'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC'
    ).all(activeConversation.id);
  }

  res.render('assistant', {
    title: 'Assistant IA',
    conversations,
    activeConversation,
    messages,
    hasApiKey: !!process.env.CLAUDE_API_KEY,
  });
});

module.exports = router;
