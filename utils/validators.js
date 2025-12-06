const { body, param, query } = require('express-validator');
const User = require('../models/User');

// User validation
const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]*$/).withMessage('Name can only contain letters and spaces'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail()
    .custom(async (email) => {
      const user = await User.findOne({ email });
      if (user) {
        throw new Error('Email already in use');
      }
      return true;
    }),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/\d/).withMessage('Password must contain at least one number')
    .matches(/[@$!%*?&]/).withMessage('Password must contain at least one special character (@$!%*?&)'),

  body('confirmPassword')
    .notEmpty().withMessage('Please confirm your password')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),

  body('role')
    .optional()
    .isIn(['buyer', 'manager']).withMessage('Role must be either buyer or manager'),

  body('photoURL')
    .optional()
    .isURL().withMessage('Photo URL must be a valid URL')
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
];

const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]*$/).withMessage('Name can only contain letters and spaces'),

  body('photoURL')
    .optional()
    .isURL().withMessage('Photo URL must be a valid URL')
];

// Product validation
const productValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Product name is required')
    .isLength({ min: 3, max: 100 }).withMessage('Product name must be between 3 and 100 characters'),

  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters'),

  body('category')
    .trim()
    .notEmpty().withMessage('Category is required')
    .isIn(['Shirt', 'Pant', 'Jacket', 'Suits', 'Accessories', 'Other'])
    .withMessage('Invalid category'),

  body('price')
    .notEmpty().withMessage('Price is required')
    .isFloat({ min: 0.01 }).withMessage('Price must be greater than 0')
    .toFloat(),

  body('availableQuantity')
    .notEmpty().withMessage('Available quantity is required')
    .isInt({ min: 0 }).withMessage('Available quantity must be 0 or greater')
    .toInt(),

  body('minimumOrderQuantity')
    .notEmpty().withMessage('Minimum order quantity is required')
    .isInt({ min: 1 }).withMessage('Minimum order quantity must be at least 1')
    .toInt(),

  body('paymentOptions')
    .notEmpty().withMessage('Payment options are required')
    .custom((value) => {
      const options = Array.isArray(value) ? value : [value];
      const validOptions = ['Cash on Delivery', 'Stripe'];
      
      if (!options.every(option => validOptions.includes(option))) {
        throw new Error('Invalid payment option');
      }
      return true;
    }),

  body('showOnHome')
    .optional()
    .isBoolean().withMessage('showOnHome must be a boolean')
    .toBoolean()
];

// Order validation
const orderValidation = [
  body('productId')
    .notEmpty().withMessage('Product ID is required')
    .isMongoId().withMessage('Invalid product ID'),

  body('quantity')
    .notEmpty().withMessage('Quantity is required')
    .isInt({ min: 1 }).withMessage('Quantity must be at least 1')
    .toInt(),

  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required')
    .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),

  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),

  body('contactNumber')
    .trim()
    .notEmpty().withMessage('Contact number is required')
    .matches(/^[\+]?[1-9][\d]{0,15}$/).withMessage('Invalid phone number'),

  body('deliveryAddress')
    .trim()
    .notEmpty().withMessage('Delivery address is required')
    .isLength({ min: 10, max: 500 }).withMessage('Address must be between 10 and 500 characters'),

  body('paymentMethod')
    .trim()
    .notEmpty().withMessage('Payment method is required')
    .isIn(['Cash on Delivery', 'Stripe']).withMessage('Invalid payment method'),

  body('additionalNotes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Additional notes cannot exceed 500 characters')
];

// Tracking validation
const trackingValidation = [
  body('orderId')
    .notEmpty().withMessage('Order ID is required')
    .isMongoId().withMessage('Invalid order ID'),

  body('status')
    .trim()
    .notEmpty().withMessage('Status is required')
    .isIn([
      'Order Placed',
      'Cutting Started',
      'Cutting Completed',
      'Sewing Started',
      'Sewing Completed',
      'Finishing Started',
      'Finishing Completed',
      'QC Checked',
      'Packed',
      'Shipped',
      'Out for Delivery',
      'Delivered'
    ]).withMessage('Invalid status'),

  body('location')
    .trim()
    .notEmpty().withMessage('Location is required')
    .isLength({ min: 3, max: 200 }).withMessage('Location must be between 3 and 200 characters'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),

  body('estimatedCompletionDate')
    .optional()
    .isISO8601().withMessage('Invalid date format')
    .toDate()
];

// User management validation (Admin only)
const userUpdateValidation = [
  param('id')
    .isMongoId().withMessage('Invalid user ID'),

  body('role')
    .optional()
    .isIn(['buyer', 'manager', 'admin']).withMessage('Invalid role'),

  body('status')
    .optional()
    .isIn(['pending', 'approved', 'suspended']).withMessage('Invalid status'),

  body('suspendReason')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Suspend reason cannot exceed 500 characters')
    .custom((value, { req }) => {
      if (req.body.status === 'suspended' && !value) {
        throw new Error('Suspend reason is required when suspending a user');
      }
      return true;
    })
];

// Query parameter validation
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    .toInt(),

  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Search query cannot exceed 100 characters'),

  query('sort')
    .optional()
    .isIn(['createdAt', 'price', 'name', '-createdAt', '-price', '-name'])
    .withMessage('Invalid sort parameter')
];

// Payment validation
const paymentValidation = [
  body('orderId')
    .notEmpty().withMessage('Order ID is required')
    .isMongoId().withMessage('Invalid order ID')
];

// ID parameter validation
const idValidation = [
  param('id')
    .isMongoId().withMessage('Invalid ID format')
];

// Custom validators
const validateOrderQuantity = async (quantity, { req }) => {
  const Product = require('../models/Product');
  const product = await Product.findById(req.body.productId);
  
  if (!product) {
    throw new Error('Product not found');
  }

  if (quantity < product.minimumOrderQuantity) {
    throw new Error(`Minimum order quantity is ${product.minimumOrderQuantity}`);
  }

  if (quantity > product.availableQuantity) {
    throw new Error(`Only ${product.availableQuantity} items available`);
  }

  return true;
};

const validatePaymentMethod = async (paymentMethod, { req }) => {
  const Product = require('../models/Product');
  const product = await Product.findById(req.body.productId);
  
  if (!product) {
    throw new Error('Product not found');
  }

  if (!product.paymentOptions.includes(paymentMethod)) {
    throw new Error(`This product only supports: ${product.paymentOptions.join(', ')}`);
  }

  return true;
};

// Export all validators
module.exports = {
  registerValidation,
  loginValidation,
  updateProfileValidation,
  productValidation,
  orderValidation,
  trackingValidation,
  userUpdateValidation,
  paginationValidation,
  paymentValidation,
  idValidation,
  validateOrderQuantity,
  validatePaymentMethod
};