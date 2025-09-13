const carouselAuth = (req, res, next) => {
  // Check if user is authenticated
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Allow admins, super admins, and editors
  if (req.user.role === 'admin' || req.user.role === 'superadmin' || req.user.role === 'editor') {
    return next();
  }

  // Deny access to non-editor and non-admin roles
  return res.status(403).json({ 
    error: 'Access denied. Only admins, super admins, and editors can manage carousel content.' 
  });
};

module.exports = carouselAuth;
