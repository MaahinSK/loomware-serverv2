const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: [true, 'Please add order quantity'],
    min: [1, 'Quantity must be at least 1']
  },
  unitPrice: {
    type: Number,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },
  firstName: {
    type: String,
    required: [true, 'Please add first name']
  },
  lastName: {
    type: String,
    required: [true, 'Please add last name']
  },
  email: {
    type: String,
    required: [true, 'Please add email']
  },
  contactNumber: {
    type: String,
    required: [true, 'Please add contact number']
  },
  deliveryAddress: {
    type: String,
    required: [true, 'Please add delivery address']
  },
  additionalNotes: {
    type: String,
    default: ''
  },
  paymentMethod: {
    type: String,
    enum: ['Cash on Delivery', 'Stripe'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentId: {
    type: String,
    default: null
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'in_production', 'completed', 'cancelled'],
    default: 'pending'
  },
  approvedAt: {
    type: Date,
    default: null
  },
  rejectedAt: {
    type: Date,
    default: null
  },
  cancelledAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate total price before saving
OrderSchema.pre('save', function(next) {
  this.totalPrice = this.unitPrice * this.quantity;
  this.updatedAt = Date.now();
  next();
});

// Indexes for faster queries
OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ orderStatus: 1 });
OrderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', OrderSchema);