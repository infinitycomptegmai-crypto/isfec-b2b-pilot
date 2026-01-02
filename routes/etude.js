const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Charger les données d'une étude
function loadEtude(version) {
  const filePath = path.join(__dirname, '..', 'data', `etude-${version}.json`);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  return null;
}

// Page d'étude V1
router.get('/v1', (req, res) => {
  const etude = loadEtude('v1');
  if (!etude) {
    return res.status(404).render('error', {
      title: 'Étude non trouvée',
      message: 'L\'étude V1 n\'est pas encore disponible.',
      layout: false,
    });
  }

  res.render('etude', {
    title: 'Étude V1 — Analyse complète',
    etude,
    version: 'v1',
    activeSection: req.query.section || null,
  });
});

// Page d'étude V2
router.get('/v2', (req, res) => {
  const etude = loadEtude('v2');
  if (!etude) {
    return res.status(404).render('error', {
      title: 'Étude non trouvée',
      message: 'L\'étude V2 n\'est pas encore disponible.',
      layout: false,
    });
  }

  res.render('etude', {
    title: 'Étude V2 — Vision stratégique',
    etude,
    version: 'v2',
    activeSection: req.query.section || null,
  });
});

// Section spécifique V1
router.get('/v1/section/:id', (req, res) => {
  const etude = loadEtude('v1');
  if (!etude) {
    return res.status(404).json({ error: 'Étude non trouvée' });
  }

  const section = findSection(etude.sections, req.params.id);
  if (!section) {
    return res.status(404).json({ error: 'Section non trouvée' });
  }

  res.json(section);
});

// Section spécifique V2
router.get('/v2/section/:id', (req, res) => {
  const etude = loadEtude('v2');
  if (!etude) {
    return res.status(404).json({ error: 'Étude non trouvée' });
  }

  const section = findSection(etude.sections, req.params.id);
  if (!section) {
    return res.status(404).json({ error: 'Section non trouvée' });
  }

  res.json(section);
});

// Fonction utilitaire pour trouver une section par ID
function findSection(sections, id) {
  for (const section of sections) {
    if (section.id === id) {
      return section;
    }
    if (section.sousSections) {
      const found = section.sousSections.find(ss => ss.id === id);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

module.exports = router;
