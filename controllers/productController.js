const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;
    const skip = (page - 1) * limit;
    
    const { category, minPrice, maxPrice, search } = req.query;
    
    let query = {};
    
    // Filter by category
    if (category) {
      query.category = category;
    }
    
    // Filter by price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    
    // Search by name
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    
    const totalProducts = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('createdBy', 'name email')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      status: 'success',
      data: {
        products,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalProducts / limit),
          totalProducts,
          hasNextPage: page < Math.ceil(totalProducts / limit),
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get all products error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
};

// @desc    Get featured products for home page
// @route   GET /api/products/featured
// @access  Public
const getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({ showOnHome: true })
      .populate('createdBy', 'name email')
      .limit(6)
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      status: 'success',
      data: {
        products
      }
    });
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('createdBy', 'name email photoURL');
    
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        product
      }
    });
  } catch (error) {
    console.error('Get product by id error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private/Manager
const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      price,
      availableQuantity,
      minimumOrderQuantity,
      paymentOptions,
      showOnHome
    } = req.body;
    
    // Check if user is manager
    if (req.user.role !== 'manager') {
      return res.status(403).json({
        status: 'error',
        message: 'Only managers can create products'
      });
    }
    
    // Get uploaded image URLs
    const images = req.files ? req.files.map(file => file.path) : [];
    
    if (images.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'At least one image is required'
      });
    }
    
    const product = await Product.create({
      name,
      description,
      category,
      price: parseFloat(price),
      availableQuantity: parseInt(availableQuantity),
      minimumOrderQuantity: parseInt(minimumOrderQuantity),
      images,
      paymentOptions: Array.isArray(paymentOptions) ? paymentOptions : [paymentOptions],
      showOnHome: showOnHome === 'true',
      createdBy: req.user.id
    });
    
    res.status(201).json({
      status: 'success',
      data: {
        product
      }
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Manager or Admin
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }
    
    // Check authorization
    const isManager = req.user.role === 'manager' && product.createdBy.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    if (!isManager && !isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this product'
      });
    }
    
    const updates = req.body;
    
    // Handle image updates
    if (req.files && req.files.length > 0) {
      // Delete old images from Cloudinary
      if (product.images && product.images.length > 0) {
        for (const imageUrl of product.images) {
          const publicId = imageUrl.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`loomware/products/${publicId}`);
        }
      }
      
      updates.images = req.files.map(file => file.path);
    }
    
    // Parse numeric fields
    if (updates.price) updates.price = parseFloat(updates.price);
    if (updates.availableQuantity) updates.availableQuantity = parseInt(updates.availableQuantity);
    if (updates.minimumOrderQuantity) updates.minimumOrderQuantity = parseInt(updates.minimumOrderQuantity);
    if (updates.showOnHome !== undefined) {
      updates.showOnHome = updates.showOnHome === 'true';
    }
    
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        product: updatedProduct
      }
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Manager or Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }
    
    // Check authorization
    const isManager = req.user.role === 'manager' && product.createdBy.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    if (!isManager && !isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this product'
      });
    }
    
    // Delete images from Cloudinary
    if (product.images && product.images.length > 0) {
      for (const imageUrl of product.images) {
        const publicId = imageUrl.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`loomware/products/${publicId}`);
      }
    }
    
    await product.deleteOne();
    
    res.status(200).json({
      status: 'success',
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
};

// @desc    Get products by manager
// @route   GET /api/products/manager/my-products
// @access  Private/Manager
const getManagerProducts = async (req, res) => {
  try {
    if (req.user.role !== 'manager') {
      return res.status(403).json({
        status: 'error',
        message: 'Only managers can access this endpoint'
      });
    }
    
    const products = await Product.find({ createdBy: req.user.id })
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      status: 'success',
      data: {
        products
      }
    });
  } catch (error) {
    console.error('Get manager products error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
};

module.exports = {
  getAllProducts,
  getFeaturedProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getManagerProducts
};