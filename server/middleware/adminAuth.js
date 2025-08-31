const adminAuth = async (req, res, next) => {
  try {
    // First check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: 'Access denied. Authentication required.' });
    }

    // Check if user is admin by checking properties directly
    if (req.user.status !== 'active' || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(500).json({ error: 'Admin authentication error.' });
  }
};

module.exports = adminAuth;
