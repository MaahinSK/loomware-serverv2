const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyFirebaseToken } = require('../config/firebase');

// Protect routes - JWT authentication
const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from cookies
    if (req.cookies.token) {
      token = req.cookies.token;
    }
    // Get token from Authorization header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized, no token'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Check if user is approved
    if (user.status !== 'approved') {
      return res.status(403).json({
        status: 'error',
        message: 'Account not approved yet. Please wait for admin approval.'
      });
    }

    // Check if user is suspended
    if (user.status === 'suspended') {
      return res.status(403).json({
        status: 'error',
        message: `Account suspended. Reason: ${user.suspendReason || 'No reason provided'}`
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token expired'
      });
    }

    return res.status(401).json({
      status: 'error',
      message: 'Not authorized'
    });
  }
};

// Firebase authentication middleware
const firebaseAuth = async (req, res, next) => {
  try {
    let idToken;

    // Get token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      idToken = req.headers.authorization.split(' ')[1];
    }

    if (!idToken) {
      return res.status(401).json({
        status: 'error',
        message: 'No Firebase token provided'
      });
    }

    // Verify Firebase token
    const decodedToken = await verifyFirebaseToken(idToken);

    // Find or create user in database
    let user = await User.findOne({ email: decodedToken.email });

    if (!user) {
      // Create new user from Firebase
      user = await User.create({
        name: decodedToken.name || decodedToken.email.split('@')[0],
        email: decodedToken.email,
        password: 'firebase-auth', // Dummy password
        photoURL: decodedToken.picture || null,
        role: 'buyer',
        status: 'approved' // Auto-approve Firebase users
      });
    }

    // Generate JWT token for the user
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE
    });

    // Set token in cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    req.user = user;
    req.firebaseUser = decodedToken;
    next();
  } catch (error) {
    console.error('Firebase auth error:', error.message);
    return res.status(401).json({
      status: 'error',
      message: 'Firebase authentication failed'
    });
  }
};

// Optional auth - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (user && user.status === 'approved') {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Don't throw error for optional auth
    next();
  }
};

// Admin only middleware
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }

  return res.status(403).json({
    status: 'error',
    message: 'Admin access required'
  });
};

// Manager only middleware
const managerOnly = (req, res, next) => {
  if (req.user && req.user.role === 'manager') {
    return next();
  }

  return res.status(403).json({
    status: 'error',
    message: 'Manager access required'
  });
};

// Buyer only middleware
const buyerOnly = (req, res, next) => {
  if (req.user && req.user.role === 'buyer') {
    return next();
  }

  return res.status(403).json({
    status: 'error',
    message: 'Buyer access required'
  });
};

// Check if user can access dashboard
const canAccessDashboard = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication required'
    });
  }

  // Check account status
  if (req.user.status !== 'approved') {
    return res.status(403).json({
      status: 'error',
      message: 'Account not approved yet'
    });
  }

  next();
};

// Authorize based on roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized, no user found'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }

    next();
  };
};

module.exports = {
  protect,
  firebaseAuth,
  optionalAuth,
  adminOnly,
  managerOnly,
  buyerOnly,
  authorize,
  canAccessDashboard
};