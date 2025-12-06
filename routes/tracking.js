const express = require('express');
const router = express.Router();
const {
  addTracking,
  getOrderTracking,
  updateTracking,
  deleteTracking
} = require('../controllers/trackingController');
const { protect, managerOnly } = require('../middleware/auth');
const { uploadMultiple } = require('../middleware/upload');

// All routes require authentication
router.use(protect);

router.route('/order/:orderId')
  .get(getOrderTracking);

// Manager only routes
router.route('/')
  .post(managerOnly, uploadMultiple, addTracking);

router.route('/:id')
  .put(managerOnly, uploadMultiple, updateTracking)
  .delete(managerOnly, deleteTracking);

module.exports = router;