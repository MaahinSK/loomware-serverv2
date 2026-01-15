const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');

// @desc    Get public statistics (Home page)
// @route   GET /api/stats/public
// @access  Public
const getPublicStats = async (req, res) => {
    try {
        // Product distribution by category
        const categoryStats = await Product.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    avgPrice: { $avg: '$price' }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // Format for charts
        const formattedStats = categoryStats.map(stat => ({
            name: stat._id || 'Uncategorized',
            value: stat.count,
            price: Math.round(stat.avgPrice * 100) / 100
        }));

        res.status(200).json({
            status: 'success',
            data: {
                categoryStats: formattedStats
            }
        });
    } catch (error) {
        console.error('Get public stats error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
};

// @desc    Get buyer statistics
// @route   GET /api/stats/buyer
// @access  Private/Buyer
const getBuyerStats = async (req, res) => {
    try {
        const userId = req.user.id;

        // Total orders
        const totalOrders = await Order.countDocuments({ user: userId });

        // Total spend
        const spendStats = await Order.aggregate([
            { $match: { user: require('mongoose').Types.ObjectId(userId) } },
            {
                $group: {
                    _id: null,
                    totalSpend: { $sum: '$totalPrice' }
                }
            }
        ]);

        // Order status distribution
        const statusStats = await Order.aggregate([
            { $match: { user: require('mongoose').Types.ObjectId(userId) } },
            {
                $group: {
                    _id: '$orderStatus',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.status(200).json({
            status: 'success',
            data: {
                totalOrders,
                totalSpend: spendStats.length > 0 ? spendStats[0].totalSpend : 0,
                statusStats: statusStats.map(s => ({ name: s._id, value: s.count }))
            }
        });
    } catch (error) {
        console.error('Get buyer stats error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
};

// @desc    Get manager statistics
// @route   GET /api/stats/manager
// @access  Private/Manager
const getManagerStats = async (req, res) => {
    try {
        const managerId = req.user.id;

        // Get manager's products
        const products = await Product.find({ createdBy: managerId }).select('_id');
        const productIds = products.map(p => p._id);

        // Total products
        const totalProducts = products.length;

        // Sales stats for these products
        const salesStats = await Order.aggregate([
            { $match: { product: { $in: productIds } } },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: '$totalPrice' },
                    totalOrders: { $sum: 1 }
                }
            }
        ]);

        // Sales by product (Top 5)
        const productSalesStats = await Order.aggregate([
            { $match: { product: { $in: productIds } } },
            {
                $group: {
                    _id: '$product',
                    totalSales: { $sum: '$totalPrice' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { totalSales: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'productInfo'
                }
            },
            {
                $project: {
                    name: { $arrayElemAt: ['$productInfo.name', 0] },
                    totalSales: 1,
                    count: 1
                }
            }
        ]);

        res.status(200).json({
            status: 'success',
            data: {
                totalProducts,
                totalSales: salesStats.length > 0 ? salesStats[0].totalSales : 0,
                totalOrders: salesStats.length > 0 ? salesStats[0].totalOrders : 0,
                topProducts: productSalesStats
            }
        });

    } catch (error) {
        console.error('Get manager stats error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
};

// @desc    Get admin statistics
// @route   GET /api/stats/admin
// @access  Private/Admin
const getAdminStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalProducts = await Product.countDocuments();
        const totalOrders = await Order.countDocuments();

        const revenueStats = await Order.aggregate([
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$totalPrice' }
                }
            }
        ]);

        // User growth (by month) - simple version
        const userGrowth = await User.aggregate([
            {
                $group: {
                    _id: { $month: '$createdAt' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.status(200).json({
            status: 'success',
            data: {
                totalUsers,
                totalProducts,
                totalOrders,
                totalRevenue: revenueStats.length > 0 ? revenueStats[0].totalRevenue : 0,
                userGrowth: userGrowth.map(u => ({ month: u._id, count: u.count }))
            }
        });
    } catch (error) {
        console.error('Get admin stats error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
};

module.exports = {
    getPublicStats,
    getBuyerStats,
    getManagerStats,
    getAdminStats
};
