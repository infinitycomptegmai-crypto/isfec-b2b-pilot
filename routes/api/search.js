const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Recherche dans les études
router.get('/', (req, res) => {
  const { q, version } = req.query;

  if (!q || q.trim().length < 2) {
    return res.json({ results: [] });
  }

  const searchTerm = q.toLowerCase().trim();
  const results = [];

  // Déterminer les versions à chercher
  const versions = version ? [version] : ['v1', 'v2'];

  versions.forEach(v => {
    const filePath = path.join(__dirname, '..', '..', 'data', `etude-${v}.json`);
    if (!fs.existsSync(filePath)) return;

    const etude = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    etude.sections.forEach(section => {
      // Chercher dans le titre et le contenu de la section
      const titleMatch = section.titre.toLowerCase().includes(searchTerm);
      const contentMatch = section.contenu && section.contenu.toLowerCase().includes(searchTerm);

      if (titleMatch || contentMatch) {
        results.push({
          version: v,
          sectionId: section.id,
          numero: section.numero,
          titre: section.titre,
          excerpt: getExcerpt(section.contenu, searchTerm),
          type: 'section',
        });
      }

      // Chercher dans les sous-sections
      if (section.sousSections) {
        section.sousSections.forEach(ss => {
          const ssTitleMatch = ss.titre.toLowerCase().includes(searchTerm);
          const ssContentMatch = ss.contenu && ss.contenu.toLowerCase().includes(searchTerm);

          if (ssTitleMatch || ssContentMatch) {
            results.push({
              version: v,
              sectionId: ss.id,
              parentId: section.id,
              numero: ss.numero,
              titre: ss.titre,
              excerpt: getExcerpt(ss.contenu, searchTerm),
              type: 'sous-section',
            });
          }
        });
      }
    });
  });

  // Limiter les résultats
  res.json({
    query: q,
    count: results.length,
    results: results.slice(0, 20),
  });
});

// Extraire un extrait autour du terme recherché
function getExcerpt(content, searchTerm, contextLength = 100) {
  if (!content) return '';

  // Supprimer les balises HTML
  const plainText = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const lowerText = plainText.toLowerCase();
  const index = lowerText.indexOf(searchTerm);

  if (index === -1) {
    return plainText.substring(0, contextLength * 2) + '...';
  }

  const start = Math.max(0, index - contextLength);
  const end = Math.min(plainText.length, index + searchTerm.length + contextLength);

  let excerpt = '';
  if (start > 0) excerpt += '...';
  excerpt += plainText.substring(start, end);
  if (end < plainText.length) excerpt += '...';

  return excerpt;
}

module.exports = router;
