const Tracking = require('../models/Tracking');
const Order = require('../models/Order');

// @desc    Add tracking update
// @route   POST /api/tracking
// @access  Private/Manager
const addTracking = async (req, res) => {
  try {
    const { orderId, status, location, notes, estimatedCompletionDate } = req.body;
    
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }
    
    // Check if manager can update this order
    if (req.user.role !== 'manager' && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Only managers can add tracking updates'
      });
    }
    
    // Get uploaded image URLs
    const images = req.files ? req.files.map(file => file.path) : [];
    
    const tracking = await Tracking.create({
      order: orderId,
      status,
      location,
      notes: notes || '',
      images,
      estimatedCompletionDate: estimatedCompletionDate || null,
      createdBy: req.user.id
    });
    
    // Update order status if needed
    if (status === 'Delivered') {
      order.orderStatus = 'completed';
      await order.save();
    }
    
    res.status(201).json({
      status: 'success',
      data: {
        tracking
      }
    });
  } catch (error) {
    console.error('Add tracking error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
};

// @desc    Get tracking for order
// @route   GET /api/tracking/order/:orderId
// @access  Private
const getOrderTracking = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }
    
    // Check authorization
    const isOwner = order.user.toString() === req.user.id;
    const isManager = req.user.role === 'manager';
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isManager && !isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to view tracking for this order'
      });
    }
    
    const tracking = await Tracking.find({ order: req.params.orderId })
      .populate('createdBy', 'name email')
      .sort({ createdAt: 1 });
    
    res.status(200).json({
      status: 'success',
      data: {
        tracking
      }
    });
  } catch (error) {
    console.error('Get order tracking error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
};

// @desc    Update tracking
// @route   PUT /api/tracking/:id
// @access  Private/Manager
const updateTracking = async (req, res) => {
  try {
    const tracking = await Tracking.findById(req.params.id);
    
    if (!tracking) {
      return res.status(404).json({
        status: 'error',
        message: 'Tracking not found'
      });
    }
    
    // Check if user can update
    if (req.user.role !== 'manager' && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Only managers can update tracking'
      });
    }
    
    const updates = req.body;
    
    // Handle image updates
    if (req.files && req.files.length > 0) {
      updates.images = req.files.map(file => file.path);
    }
    
    const updatedTracking = await Tracking.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        tracking: updatedTracking
      }
    });
  } catch (error) {
    console.error('Update tracking error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
};

// @desc    Delete tracking
// @route   DELETE /api/tracking/:id
// @access  Private/Manager
const deleteTracking = async (req, res) => {
  try {
    const tracking = await Tracking.findById(req.params.id);
    
    if (!tracking) {
      return res.status(404).json({
        status: 'error',
        message: 'Tracking not found'
      });
    }
    
    // Check if user can delete
    if (req.user.role !== 'manager' && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Only managers can delete tracking'
      });
    }
    
    await tracking.deleteOne();
    
    res.status(200).json({
      status: 'success',
      message: 'Tracking deleted successfully'
    });
  } catch (error) {
    console.error('Delete tracking error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
};

module.exports = {
  addTracking,
  getOrderTracking,
  updateTracking,
  deleteTracking
};