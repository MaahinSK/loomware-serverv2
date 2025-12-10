const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getFeaturedProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getManagerProducts,
  toggleProductVisibility,
  toggleProductFeature,
  getRelatedProducts
} = require('../controllers/productController');
const { protect, managerOnly, adminOnly } = require('../middleware/auth');
const { uploadMultiple } = require('../middleware/upload');

// Public routes
router.route('/')
  .get(getAllProducts);

router.route('/featured')
  .get(getFeaturedProducts);

// Admin route - must come before /:id
router.route('/admin')
  .get(protect, adminOnly, getAllProducts);

router.route('/:id')
  .get(getProductById);

// Protected routes
router.use(protect);

// Manager routes
router.route('/manager/my-products')
  .get(managerOnly, getManagerProducts);

router.route('/:id/visibility')
  .put(toggleProductVisibility);

router.route('/:id/feature')
  .put(toggleProductFeature);

router.get('/related/:id', getRelatedProducts);

router.route('/')
  .post(managerOnly, uploadMultiple, createProduct);

router.route('/:id')
  .put(uploadMultiple, updateProduct)
  .delete(deleteProduct);

module.exports = router;