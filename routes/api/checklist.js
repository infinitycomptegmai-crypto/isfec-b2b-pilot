const express = require('express');
const router = express.Router();
const { getDatabase } = require('../../config/database');

// Récupérer toutes les réponses
router.get('/', (req, res) => {
  const db = getDatabase();
  const userId = req.session.user.id;

  const responses = db.prepare(
    'SELECT field_id, value, updated_at FROM checklist_responses WHERE user_id = ?'
  ).all(userId);

  const result = {};
  responses.forEach(r => {
    try {
      result[r.field_id] = {
        value: JSON.parse(r.value),
        updated_at: r.updated_at,
      };
    } catch {
      result[r.field_id] = {
        value: r.value,
        updated_at: r.updated_at,
      };
    }
  });

  res.json(result);
});

// Sauvegarder une réponse
router.put('/:fieldId', (req, res) => {
  const db = getDatabase();
  const userId = req.session.user.id;
  const { fieldId } = req.params;
  const { value } = req.body;

  try {
    const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);

    db.prepare(`
      INSERT INTO checklist_responses (user_id, field_id, value, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, field_id)
      DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP
    `).run(userId, fieldId, valueStr, valueStr);

    res.json({ success: true, field_id: fieldId });
  } catch (error) {
    console.error('Erreur sauvegarde checklist:', error);
    res.status(500).json({ error: 'Erreur lors de la sauvegarde' });
  }
});

// Supprimer une réponse
router.delete('/:fieldId', (req, res) => {
  const db = getDatabase();
  const userId = req.session.user.id;
  const { fieldId } = req.params;

  try {
    db.prepare(
      'DELETE FROM checklist_responses WHERE user_id = ? AND field_id = ?'
    ).run(userId, fieldId);

    res.json({ success: true });
  } catch (error) {
    console.error('Erreur suppression checklist:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

module.exports = router;
