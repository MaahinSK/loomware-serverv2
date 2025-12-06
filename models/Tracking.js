const mongoose = require('mongoose');

const TrackingSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  status: {
    type: String,
    enum: [
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
    ],
    required: true
  },
  location: {
    type: String,
    required: true
  },
  notes: {
    type: String,
    default: ''
  },
  images: [{
    type: String
  }],
  estimatedCompletionDate: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

// Index for faster order tracking queries
TrackingSchema.index({ order: 1, createdAt: -1 });

module.exports = mongoose.model('Tracking', TrackingSchema);