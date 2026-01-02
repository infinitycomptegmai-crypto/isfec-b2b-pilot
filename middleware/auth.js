/**
 * Middleware d'authentification
 */

function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }

  // Si c'est une requête API, renvoyer une erreur JSON
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  // Sinon, rediriger vers le login
  req.session.returnTo = req.originalUrl;
  res.redirect('/login');
}

/**
 * Middleware pour les pages qui ne nécessitent pas d'auth
 * mais qui doivent rediriger si déjà connecté
 */
function redirectIfAuth(req, res, next) {
  if (req.session && req.session.user) {
    return res.redirect('/dashboard');
  }
  next();
}

module.exports = { requireAuth, redirectIfAuth };
