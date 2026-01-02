const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { getDatabase } = require('../config/database');
const { redirectIfAuth } = require('../middleware/auth');

// Page de login
router.get('/login', redirectIfAuth, (req, res) => {
  res.render('login', {
    title: 'Connexion',
    error: null,
    layout: false,
  });
});

// Traitement du login
router.post('/login', redirectIfAuth, async (req, res) => {
  const { email, password, remember } = req.body;

  if (!email || !password) {
    return res.render('login', {
      title: 'Connexion',
      error: 'Veuillez remplir tous les champs.',
      layout: false,
    });
  }

  try {
    const db = getDatabase();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());

    if (!user) {
      return res.render('login', {
        title: 'Connexion',
        error: 'Identifiants incorrects.',
        layout: false,
      });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.render('login', {
        title: 'Connexion',
        error: 'Identifiants incorrects.',
        layout: false,
      });
    }

    // Mettre à jour last_login
    db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

    // Créer la session
    req.session.user = {
      id: user.id,
      email: user.email,
      name: user.name,
    };

    // Si "rester connecté" est coché, prolonger la session à 30 jours
    if (remember) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
    }

    // Rediriger vers la page demandée ou le dashboard
    const returnTo = req.session.returnTo || '/dashboard';
    delete req.session.returnTo;
    res.redirect(returnTo);

  } catch (error) {
    console.error('Erreur de login:', error);
    res.render('login', {
      title: 'Connexion',
      error: 'Une erreur est survenue. Veuillez réessayer.',
      layout: false,
    });
  }
});

// Déconnexion
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Erreur lors de la déconnexion:', err);
    }
    res.redirect('/login');
  });
});

module.exports = router;
