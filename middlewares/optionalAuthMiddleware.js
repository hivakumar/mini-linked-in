const admin = require('../config/firebaseConfig');
const User = require('../models/User');

const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No token, proceed as unauthenticated guest
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken; 
    
    // Also try to attach the Mongoose User document if it exists
    const dbUser = await User.findOne({ firebaseUid: decodedToken.uid });
    if (dbUser) {
        req.dbUser = dbUser;
    }

    next();
  } catch (error) {
    // If token is invalid/expired, still proceed but as guest
    // You could also choose to return 401 here if token exists but is invalid
    console.error('Invalid token in optional auth, proceeding as guest:', error.message);
    next();
  }
};

module.exports = optionalAuth;
