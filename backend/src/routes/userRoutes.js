const express = require('express');
const {
  getProfile,
  updateProfile,
  changePassword,
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getWishlist,
  toggleWishlist,
  removeFromWishlist,
} = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All user management routes strictly require authentication (Rule 23)
router.use(authenticate);

// Profile & Security
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);

// Addresses
router.get('/addresses', getAddresses);
router.post('/addresses', createAddress);
router.put('/addresses/:id', updateAddress);
router.delete('/addresses/:id', deleteAddress);
router.put('/addresses/:id/default', setDefaultAddress);

// Wishlist
router.get('/wishlist', getWishlist);
router.post('/wishlist/:productId', toggleWishlist);
router.delete('/wishlist/:productId', removeFromWishlist);

module.exports = router;
