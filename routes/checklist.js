const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { getDatabase } = require('../config/database');

// Page checklist
router.get('/', (req, res) => {
  const db = getDatabase();
  const userId = req.session.user.id;

  // Charger la structure de la checklist
  let checklistData = { sections: [] };
  const checklistPath = path.join(__dirname, '..', 'data', 'checklist.json');
  if (fs.existsSync(checklistPath)) {
    checklistData = JSON.parse(fs.readFileSync(checklistPath, 'utf8'));
  }

  // Récupérer les réponses de l'utilisateur
  const responses = db.prepare(
    'SELECT field_id, value FROM checklist_responses WHERE user_id = ?'
  ).all(userId);

  const responsesMap = {};
  responses.forEach(r => {
    try {
      responsesMap[r.field_id] = JSON.parse(r.value);
    } catch {
      responsesMap[r.field_id] = r.value;
    }
  });

  // Calculer les statistiques
  let totalFields = 0;
  let completedFields = 0;

  checklistData.sections.forEach(section => {
    section.fields.forEach(field => {
      totalFields++;
      const value = responsesMap[field.id];
      if (value !== undefined && value !== null && value !== '') {
        completedFields++;
      }
    });
  });

  res.render('checklist', {
    title: 'Checklist — Informations à fournir',
    checklist: checklistData,
    responses: responsesMap,
    stats: {
      total: totalFields,
      completed: completedFields,
      percentage: totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0,
    },
  });
});

// Export PDF
router.get('/export', (req, res) => {
  const PDFDocument = require('pdfkit');
  const db = getDatabase();
  const userId = req.session.user.id;

  // Charger la checklist et les réponses
  let checklistData = { sections: [] };
  const checklistPath = path.join(__dirname, '..', 'data', 'checklist.json');
  if (fs.existsSync(checklistPath)) {
    checklistData = JSON.parse(fs.readFileSync(checklistPath, 'utf8'));
  }

  const responses = db.prepare(
    'SELECT field_id, value FROM checklist_responses WHERE user_id = ?'
  ).all(userId);

  const responsesMap = {};
  responses.forEach(r => {
    try {
      responsesMap[r.field_id] = JSON.parse(r.value);
    } catch {
      responsesMap[r.field_id] = r.value;
    }
  });

  // Créer le PDF
  const doc = new PDFDocument({ margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=checklist-isfec-b2b.pdf');

  doc.pipe(res);

  // Titre
  doc.fontSize(20).fillColor('#722F37').text('ISFEC B2B Pilot', { align: 'center' });
  doc.fontSize(16).fillColor('#333').text('Checklist — Informations à fournir', { align: 'center' });
  doc.moveDown();
  doc.fontSize(10).fillColor('#666').text(`Exporté le ${new Date().toLocaleDateString('fr-FR')}`, { align: 'center' });
  doc.moveDown(2);

  // Sections
  checklistData.sections.forEach(section => {
    doc.fontSize(14).fillColor('#722F37').text(section.titre);
    doc.moveDown(0.5);

    section.fields.forEach(field => {
      const value = responsesMap[field.id];
      const displayValue = value !== undefined && value !== null && value !== ''
        ? String(value) + (field.suffix ? ` ${field.suffix}` : '')
        : '(Non renseigné)';

      doc.fontSize(11).fillColor('#333').text(field.label + ' :', { continued: true });
      doc.fillColor(value ? '#2E7D32' : '#999').text(' ' + displayValue);
    });

    doc.moveDown();
  });

  doc.end();
});

module.exports = router;
