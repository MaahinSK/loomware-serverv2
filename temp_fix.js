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

        const { category, minPrice, maxPrice, search, sort } = req.query;

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

        // Determine sort order
        let sortOption = { createdAt: -1 };
        if (sort) {
            switch (sort) {
                case 'price_low':
                    sortOption = { price: 1 };
                    break;
                case 'price_high':
                    sortOption = { price: -1 };
                    break;
                case 'name':
                    sortOption = { name: 1 };
                    break;
                case 'newest':
                    sortOption = { createdAt: -1 };
                    break;
                case 'featured':
                    sortOption = { showOnHome: -1, createdAt: -1 };
                    break;
                default:
                    sortOption = { createdAt: -1 };
            }
        }

        const totalProducts = await Product.countDocuments(query);
        const products = await Product.find(query)
            .populate('createdBy', 'name email')
            .skip(skip)
            .limit(limit)
            .sort(sortOption);

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
