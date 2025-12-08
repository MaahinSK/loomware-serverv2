const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private/Buyer
const createOrder = async (req, res) => {
  try {
    // Check if user is buyer
    if (req.user.role !== 'buyer') {
      return res.status(403).json({
        status: 'error',
        message: 'Only buyers can place orders'
      });
    }

    const {
      productId,
      quantity,
      firstName,
      lastName,
      contactNumber,
      deliveryAddress,
      additionalNotes,
      paymentMethod
    } = req.body;

    // Validate required fields
    if (!productId || !quantity || !firstName || !lastName || !contactNumber || !deliveryAddress || !paymentMethod) {
      return res.status(400).json({
        status: 'error',
        message: 'Please fill all required fields'
      });
    }

    // Get product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    // Validate quantity
    if (quantity < product.minimumOrderQuantity) {
      return res.status(400).json({
        status: 'error',
        message: `Minimum order quantity is ${product.minimumOrderQuantity}`
      });
    }

    if (quantity > product.availableQuantity) {
      return res.status(400).json({
        status: 'error',
        message: `Only ${product.availableQuantity} items available`
      });
    }

    // Validate payment method
    if (!product.paymentOptions.includes(paymentMethod)) {
      return res.status(400).json({
        status: 'error',
        message: `This product only supports: ${product.paymentOptions.join(', ')}`
      });
    }

    // Create order
    const totalPrice = product.price * parseInt(quantity);

    // Format delivery address as string
    const formattedAddress = typeof deliveryAddress === 'object'
      ? `${deliveryAddress.street}, ${deliveryAddress.city}, ${deliveryAddress.state} ${deliveryAddress.zipCode}, ${deliveryAddress.country}`
      : deliveryAddress;

    const order = await Order.create({
      user: req.user.id,
      product: productId,
      quantity: parseInt(quantity),
      unitPrice: product.price,
      totalPrice,
      firstName,
      lastName,
      email: req.user.email,
      contactNumber,
      deliveryAddress: formattedAddress,
      additionalNotes: additionalNotes || '',
      paymentMethod,
      paymentStatus: paymentMethod === 'Cash on Delivery' ? 'pending' : 'pending',
      orderStatus: 'pending'
    });

    // Update product quantity
    product.availableQuantity -= quantity;
    await product.save();

    // Populate order data
    const populatedOrder = await Order.findById(order._id)
      .populate('product', 'name images price')
      .populate('user', 'name email');

    res.status(201).json({
      status: 'success',
      data: {
        order: populatedOrder
      }
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
};

// @desc    Get user's orders
// @route   GET /api/orders/my-orders
// @access  Private/Buyer
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate('product', 'name images price')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      data: {
        orders
      }
    });
  } catch (error) {
    console.error('Get my orders error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('product')
      .populate('user', 'name email contactNumber');

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    // Check authorization
    const isOwner = order.user._id.toString() === req.user.id;
    const isManager = req.user.role === 'manager';
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isManager && !isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to view this order'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        order
      }
    });
  } catch (error) {
    console.error('Get order by id error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders
// @access  Private/Admin
const getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { status, startDate, endDate } = req.query;

    let query = {};

    // Filter by status
    if (status) {
      query.orderStatus = status;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const totalOrders = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('user', 'name email')
      .populate('product', 'name images')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      data: {
        orders,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalOrders / limit),
          totalOrders
        }
      }
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
};

// @desc    Get pending orders (Manager)
// @route   GET /api/orders/pending
// @access  Private/Manager
const getPendingOrders = async (req, res) => {
  try {
    const orders = await Order.find({ orderStatus: 'pending' })
      .populate('user', 'name email')
      .populate('product', 'name images price')
      .sort({ createdAt: 1 });

    res.status(200).json({
      status: 'success',
      data: {
        orders
      }
    });
  } catch (error) {
    console.error('Get pending orders error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
};

// @desc    Get approved orders (Manager)
// @route   GET /api/orders/approved
// @access  Private/Manager
const getApprovedOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      orderStatus: {
        $in: ['approved', 'processing', 'shipped', 'in_production', 'completed']
      }
    })
      .populate('user', 'name email')
      .populate('product', 'name images')
      .sort({ approvedAt: -1 });

    res.status(200).json({
      status: 'success',
      data: {
        orders
      }
    });
  } catch (error) {
    console.error('Get approved orders error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
};

// @desc    Approve order
// @route   PUT /api/orders/:id/approve
// @access  Private/Manager
const approveOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    if (order.orderStatus !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: 'Only pending orders can be approved'
      });
    }

    order.orderStatus = 'approved';
    order.approvedAt = new Date();
    await order.save();

    res.status(200).json({
      status: 'success',
      data: {
        order
      }
    });
  } catch (error) {
    console.error('Approve order error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
};

// @desc    Reject order
// @route   PUT /api/orders/:id/reject
// @access  Private/Manager
const rejectOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    if (order.orderStatus !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: 'Only pending orders can be rejected'
      });
    }

    // Restore product quantity
    const product = await Product.findById(order.product);
    if (product) {
      product.availableQuantity += order.quantity;
      await product.save();
    }

    order.orderStatus = 'rejected';
    order.rejectedAt = new Date();
    await order.save();

    res.status(200).json({
      status: 'success',
      data: {
        order
      }
    });
  } catch (error) {
    console.error('Reject order error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private/Buyer
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

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
        message: 'Not authorized to cancel this order'
      });
    }

    // Check if order can be cancelled
    if (order.orderStatus !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: 'Only pending orders can be cancelled'
      });
    }

    // Restore product quantity
    const product = await Product.findById(order.product);
    if (product) {
      product.availableQuantity += order.quantity;
      await product.save();
    }

    order.orderStatus = 'cancelled';
    order.cancelledAt = new Date();
    await order.save();

    res.status(200).json({
      status: 'success',
      data: {
        order
      }
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Manager or Admin
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        status: 'error',
        message: 'Status is required'
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    order.orderStatus = status;

    if (status === 'approved') {
      order.approvedAt = new Date();
    } else if (status === 'rejected') {
      order.rejectedAt = new Date();
      // Restore product quantity
      const product = await Product.findById(order.product);
      if (product) {
        product.availableQuantity += order.quantity;
        await product.save();
      }
    } else if (status === 'completed') {
      order.completedAt = new Date();
    }

    await order.save();

    res.status(200).json({
      status: 'success',
      data: {
        order
      }
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
};

module.exports = {
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
};