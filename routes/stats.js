const express = require('express');
const {
    getPublicStats,
    getBuyerStats,
    getManagerStats,
    getAdminStats
} = require('../controllers/statsController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/public', getPublicStats);
router.get('/buyer', protect, authorize('buyer'), getBuyerStats);
router.get('/manager', protect, authorize('manager'), getManagerStats);
router.get('/admin', protect, authorize('admin'), getAdminStats);

module.exports = router;
