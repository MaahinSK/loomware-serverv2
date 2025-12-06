const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  getPendingOrders,
  getApprovedOrders,
  approveOrder,
  rejectOrder,
  cancelOrder,
  updateOrderStatus
} = require('../controllers/orderController');
const { protect, buyerOnly, managerOnly, adminOnly } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Buyer routes
router.route('/my-orders')
  .get(buyerOnly, getMyOrders);

router.route('/')
  .post(buyerOnly, createOrder);

router.route('/:id/cancel')
  .put(buyerOnly, cancelOrder);

// Manager routes
router.route('/pending')
  .get(managerOnly, getPendingOrders);

router.route('/approved')
  .get(managerOnly, getApprovedOrders);

router.route('/:id/approve')
  .put(managerOnly, approveOrder);

router.route('/:id/reject')
  .put(managerOnly, rejectOrder);

// Admin routes
router.route('/')
  .get(adminOnly, getAllOrders);

router.route('/:id/status')
  .put(adminOnly, updateOrderStatus);

// Common routes
router.route('/:id')
  .get(getOrderById);

module.exports = router;