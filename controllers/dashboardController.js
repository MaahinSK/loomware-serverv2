const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res) => {
    try {
        const { role, id: userId } = req.user;
        console.log(`Fetching dashboard stats for user: ${userId}, role: ${role}`);
        let stats = [];

        if (role === 'admin') {
            // Admin Stats
            const totalOrders = await Order.countDocuments();
            const totalUsers = await User.countDocuments();
            const totalProducts = await Product.countDocuments();

            // Calculate total revenue from non-cancelled/rejected orders
            const revenueResult = await Order.aggregate([
                {
                    $match: {
                        orderStatus: { $nin: ['cancelled', 'rejected'] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$totalPrice' }
                    }
                }
            ]);
            const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

            stats = [
                { label: 'Total Orders', value: totalOrders, color: 'bg-gradient-primary' },
                { label: 'Total Users', value: totalUsers, color: 'bg-gradient-secondary' },
                { label: 'Total Products', value: totalProducts, color: 'bg-gradient-dark' },
                { label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}`, color: 'bg-green-600' }
            ];

        } else if (role === 'manager') {
            // Manager Stats
            const totalProducts = await Product.countDocuments();
            const pendingOrders = await Order.countDocuments({ orderStatus: 'pending' });
            const approvedOrders = await Order.countDocuments({
                orderStatus: { $in: ['approved', 'processing', 'in_production', 'shipped'] }
            });
            const completedOrders = await Order.countDocuments({ orderStatus: 'completed' });

            // Calculate total revenue from non-cancelled/rejected orders (same as Admin)
            const revenueResult = await Order.aggregate([
                {
                    $match: {
                        orderStatus: { $nin: ['cancelled', 'rejected'] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$totalPrice' }
                    }
                }
            ]);
            const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

            stats = [
                { label: 'Total Products', value: totalProducts, color: 'bg-gradient-primary' },
                { label: 'Pending Orders', value: pendingOrders, color: 'bg-orange-500' },
                { label: 'Active Orders', value: approvedOrders, color: 'bg-blue-500' },
                { label: 'Completed Orders', value: completedOrders, color: 'bg-green-500' },
                { label: 'Total Sales', value: `$${totalRevenue.toFixed(2)}`, color: 'bg-green-600' }
            ];

        } else if (role === 'buyer') {
            // Buyer Stats
            const myOrders = await Order.countDocuments({ user: userId });
            const pendingOrders = await Order.countDocuments({ user: userId, orderStatus: 'pending' });

            const spentResult = await Order.aggregate([
                {
                    $match: {
                        user: new mongoose.Types.ObjectId(userId),
                        orderStatus: { $nin: ['cancelled', 'rejected'] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$totalPrice' }
                    }
                }
            ]);
            const totalSpent = spentResult.length > 0 ? spentResult[0].total : 0;

            stats = [
                { label: 'My Orders', value: myOrders, color: 'bg-gradient-primary' },
                { label: 'Pending Orders', value: pendingOrders, color: 'bg-orange-500' },
                { label: 'Total Spent', value: `$${totalSpent.toFixed(2)}`, color: 'bg-gradient-dark' }
            ];
        }

        console.log('Stats generated:', stats);

        res.status(200).json({
            status: 'success',
            data: {
                stats
            }
        });

    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
};

module.exports = {
    getDashboardStats
};
