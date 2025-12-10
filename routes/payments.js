const express = require('express');
const router = express.Router();
const {
  createPaymentIntent,
  confirmPayment,
  createCheckoutSession
} = require('../controllers/paymentController');
const { protect, buyerOnly } = require('../middleware/auth');

// Webhook route is registered separately in server.js (before body parser)

// Protected routes (these need JSON body parsing)
router.use(protect);

router.post('/create-payment-intent', buyerOnly, createPaymentIntent);
router.post('/confirm', buyerOnly, confirmPayment);
router.post('/create-checkout-session', buyerOnly, createCheckoutSession);

module.exports = router;