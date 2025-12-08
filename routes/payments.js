const express = require('express');
const router = express.Router();
const {
  createPaymentIntent,
  confirmPayment,
  handleWebhook,
  createCheckoutSession
} = require('../controllers/paymentController');
const { protect, buyerOnly } = require('../middleware/auth');

// Webhook route (no auth required)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Protected routes
router.use(protect);

router.post('/create-payment-intent', buyerOnly, createPaymentIntent);
router.post('/confirm', buyerOnly, confirmPayment);
router.post('/create-checkout-session', buyerOnly, createCheckoutSession);

module.exports = router;