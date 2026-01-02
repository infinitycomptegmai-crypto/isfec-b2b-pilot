#!/usr/bin/env node
/**
 * Script de création d'utilisateur
 * Usage: npm run user:create
 *
 * Par défaut, crée l'utilisateur de test :
 * - Email: test@test.com
 * - Mot de passe: test123
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const { getDatabase, initDatabase } = require('../config/database');

const DEFAULT_USER = {
  email: 'test@test.com',
  password: 'test123',
  name: 'Marie-Anne',
};

async function createUser(email, password, name) {
  // S'assurer que la BDD est initialisée
  initDatabase();

  const db = getDatabase();

  // Vérifier si l'utilisateur existe déjà
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    console.log(`L'utilisateur ${email} existe déjà.`);
    return false;
  }

  // Hasher le mot de passe
  const passwordHash = await bcrypt.hash(password, 12);

  // Créer l'utilisateur
  db.prepare(`
    INSERT INTO users (email, password_hash, name, created_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
  `).run(email, passwordHash, name);

  console.log(`Utilisateur créé avec succès !`);
  console.log(`  Email: ${email}`);
  console.log(`  Nom: ${name}`);
  return true;
}

// Exécution
(async () => {
  try {
    // Utiliser les arguments ou les valeurs par défaut
    const email = process.argv[2] || DEFAULT_USER.email;
    const password = process.argv[3] || DEFAULT_USER.password;
    const name = process.argv[4] || DEFAULT_USER.name;

    await createUser(email, password, name);
    process.exit(0);
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
})();
