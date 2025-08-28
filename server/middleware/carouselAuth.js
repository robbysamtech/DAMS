const carouselAuth = (req, res, next) => {
  // Check if user is authenticated
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Allow admins and content creators
  if (req.user.role === 'admin' || req.user.role === 'creator') {
    return next();
  }

  // Deny access to consumers and other roles
  return res.status(403).json({ 
    error: 'Access denied. Only admins and content creators can manage carousel content.' 
  });
};

module.exports = carouselAuth;
