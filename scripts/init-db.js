#!/usr/bin/env node
/**
 * Script d'initialisation de la base de données
 * Usage: npm run db:init
 */

require('dotenv').config();
const { initDatabase } = require('../config/database');

console.log('Initialisation de la base de données...');

try {
  initDatabase();
  console.log('Base de données initialisée avec succès !');
  process.exit(0);
} catch (error) {
  console.error('Erreur lors de l\'initialisation:', error);
  process.exit(1);
}
