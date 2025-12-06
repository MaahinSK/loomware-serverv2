const stripe = require('../config/stripe');
const Order = require('../models/Order');

// @desc    Create Stripe payment intent
// @route   POST /api/payments/create-payment-intent
// @access  Private
const createPaymentIntent = async (req, res) => {
  try {
    const { orderId } = req.body;
    
    if (!orderId) {
      return res.status(400).json({
        status: 'error',
        message: 'Order ID is required'
      });
    }
    
    const order = await Order.findById(orderId)
      .populate('product', 'name price');
    
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }
    
    // Check if user owns the order
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to pay for this order'
      });
    }
    
    // Check if order is pending
    if (order.orderStatus !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: 'Order is not in pending status'
      });
    }
    
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.totalPrice * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        orderId: order._id.toString(),
        userId: req.user.id
      }
    });
    
    // Update order with payment intent ID
    order.paymentId = paymentIntent.id;
    await order.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      }
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
};

// @desc    Confirm payment success
// @route   POST /api/payments/confirm
// @access  Private
const confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    
    if (!paymentIntentId) {
      return res.status(400).json({
        status: 'error',
        message: 'Payment intent ID is required'
      });
    }
    
    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        status: 'error',
        message: 'Payment not successful'
      });
    }
    
    // Find order by payment intent ID
    const order = await Order.findOne({ paymentId: paymentIntentId });
    
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }
    
    // Update order payment status
    order.paymentStatus = 'paid';
    await order.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        order
      }
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
};

// @desc    Webhook for Stripe events
// @route   POST /api/payments/webhook
// @access  Public
const handleWebhook = async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    let event;
    
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        
        // Find and update order
        const order = await Order.findOne({ paymentId: paymentIntent.id });
        if (order) {
          order.paymentStatus = 'paid';
          await order.save();
          console.log(`Order ${order._id} payment confirmed via webhook`);
        }
        break;
        
      case 'payment_intent.payment_failed':
        const failedPaymentIntent = event.data.object;
        
        // Find and update order
        const failedOrder = await Order.findOne({ paymentId: failedPaymentIntent.id });
        if (failedOrder) {
          failedOrder.paymentStatus = 'failed';
          await failedOrder.save();
          console.log(`Order ${failedOrder._id} payment failed via webhook`);
        }
        break;
        
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Webhook processing failed'
    });
  }
};

module.exports = {
  createPaymentIntent,
  confirmPayment,
  handleWebhook
};