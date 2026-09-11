const express = require('express');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} = require('../controllers/cartController');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Cart routes support both authenticated users and guests via optionalAuth
router.use(optionalAuth);

router.get('/', getCart);
router.post('/items', addToCart);
router.put('/items/:id', updateCartItem);
router.delete('/items/:id', removeCartItem);
router.delete('/clear', clearCart);
router.delete('/', clearCart);

module.exports = router;
