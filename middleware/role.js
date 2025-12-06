// Role-based middleware with enhanced permissions
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
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

    // Check if user is suspended
    if (req.user.status === 'suspended') {
      return res.status(403).json({
        status: 'error',
        message: 'Account suspended. Contact administrator.'
      });
    }

    // Check if user has required role
    if (allowedRoles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({
      status: 'error',
      message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
    });
  };
};

// Specific role checkers
const isBuyer = checkRole('buyer');
const isManager = checkRole('manager');
const isAdmin = checkRole('admin');

// Permission checkers for resource ownership
const canModifyProduct = async (req, res, next) => {
  try {
    const Product = require('../models/Product');
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    // Admin can modify any product
    if (req.user.role === 'admin') {
      return next();
    }

    // Manager can only modify their own products
    if (req.user.role === 'manager' && product.createdBy.toString() === req.user.id) {
      return next();
    }

    return res.status(403).json({
      status: 'error',
      message: 'Not authorized to modify this product'
    });
  } catch (error) {
    console.error('canModifyProduct error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
};

const canViewOrder = async (req, res, next) => {
  try {
    const Order = require('../models/Order');
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    // Admin can view any order
    if (req.user.role === 'admin') {
      return next();
    }

    // Manager can view orders of their products
    if (req.user.role === 'manager') {
      const Product = require('../models/Product');
      const product = await Product.findById(order.product);
      
      if (product && product.createdBy.toString() === req.user.id) {
        return next();
      }
    }

    // Buyer can view their own orders
    if (req.user.role === 'buyer' && order.user.toString() === req.user.id) {
      return next();
    }

    return res.status(403).json({
      status: 'error',
      message: 'Not authorized to view this order'
    });
  } catch (error) {
    console.error('canViewOrder error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
};

const canModifyOrder = async (req, res, next) => {
  try {
    const Order = require('../models/Order');
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    // Admin can modify any order
    if (req.user.role === 'admin') {
      return next();
    }

    // Manager can modify orders of their products
    if (req.user.role === 'manager') {
      const Product = require('../models/Product');
      const product = await Product.findById(order.product);
      
      if (product && product.createdBy.toString() === req.user.id) {
        return next();
      }
    }

    // Buyer can only cancel their own pending orders
    if (req.user.role === 'buyer' && order.user.toString() === req.user.id) {
      if (req.method === 'PUT' && req.path.includes('cancel') && order.orderStatus === 'pending') {
        return next();
      }
    }

    return res.status(403).json({
      status: 'error',
      message: 'Not authorized to modify this order'
    });
  } catch (error) {
    console.error('canModifyOrder error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
};

module.exports = {
  checkRole,
  isBuyer,
  isManager,
  isAdmin,
  canModifyProduct,
  canViewOrder,
  canModifyOrder
};