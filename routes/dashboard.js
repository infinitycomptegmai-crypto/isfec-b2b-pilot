const express = require('express');
const router = express.Router();
const { getDatabase } = require('../config/database');
const fs = require('fs');
const path = require('path');

router.get('/', (req, res) => {
  const db = getDatabase();
  const userId = req.session.user.id;

  // Charger la checklist pour calculer les stats
  let checklistData = { sections: [] };
  const checklistPath = path.join(__dirname, '..', 'data', 'checklist.json');
  if (fs.existsSync(checklistPath)) {
    checklistData = JSON.parse(fs.readFileSync(checklistPath, 'utf8'));
  }

  // Récupérer les réponses de la checklist
  const responses = db.prepare(
    'SELECT field_id, value FROM checklist_responses WHERE user_id = ?'
  ).all(userId);

  const responsesMap = {};
  responses.forEach(r => {
    responsesMap[r.field_id] = r.value;
  });

  // Calculer les statistiques
  let totalFields = 0;
  let completedFields = 0;
  let criticalActions = [];

  checklistData.sections.forEach(section => {
    section.fields.forEach(field => {
      totalFields++;
      const value = responsesMap[field.id];
      if (value && value.trim() !== '') {
        completedFields++;
      } else if (section.priorite === 'critique') {
        criticalActions.push({
          id: field.id,
          label: field.label,
          section: section.titre,
        });
      }
    });
  });

  // Limiter les actions critiques à 5
  criticalActions = criticalActions.slice(0, 5);

  // Calculer la progression globale (checklist = 60%, jalons = 40%)
  const checklistProgress = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
  const globalProgress = Math.round(checklistProgress * 0.6); // Pour l'instant, juste la checklist

  // Date du prochain jalon (statique pour l'instant)
  const prochainJalon = {
    nom: 'Validation budget',
    date: '15 janvier 2026',
  };

  res.render('dashboard', {
    title: 'Tableau de bord',
    stats: {
      globalProgress,
      checklistProgress,
      completedFields,
      totalFields,
      prochainJalon,
      caCible: '150 000',
    },
    criticalActions,
    userName: req.session.user.name,
  });
});

module.exports = router;
