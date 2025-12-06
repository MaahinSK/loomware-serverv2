const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserStats
} = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/auth');

// All routes require admin access
router.use(protect, adminOnly);

router.route('/')
  .get(getAllUsers);

router.route('/stats')
  .get(getUserStats);

router.route('/:id')
  .get(getUserById)
  .put(updateUser)
  .delete(deleteUser);

module.exports = router;