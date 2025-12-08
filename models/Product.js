const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a product name'],
    trim: true,
    maxlength: [100, 'Product name cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Please select a category'],
    enum: ['Shirt', 'Pant', 'Jacket', 'Suits', 'Accessories', 'Dress', 'Skirt', 'T-Shirt', 'Other']
  },
  price: {
    type: Number,
    required: [true, 'Please add a price'],
    min: [0, 'Price cannot be negative']
  },
  availableQuantity: {
    type: Number,
    required: [true, 'Please add available quantity'],
    min: [0, 'Quantity cannot be negative']
  },
  minimumOrderQuantity: {
    type: Number,
    required: [true, 'Please add minimum order quantity'],
    min: [1, 'Minimum order quantity must be at least 1']
  },
  images: [{
    type: String,
    required: [true, 'Please add at least one image']
  }],
  paymentOptions: [{
    type: String,
    enum: ['Cash on Delivery', 'Stripe'],
    required: true
  }],
  showOnHome: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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

// Update timestamp on save
ProductSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Product', ProductSchema);