const express = require('express');
const { 
  createOrder, 
  getMyOrders, 
  getOrderById, 
  getAllOrders, 
  exportOrdersForAdmin,
  updateOrderStatus,
  confirmDelivery,
  cancelOrder,
} = require('../controllers/orderController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// All order endpoints strictly require authentication (Rule 23)
router.use(authenticate);

// Admin endpoints (Rule 24)
router.get('/admin/all', authorize('ADMIN'), getAllOrders);
router.get('/admin/export', authorize('ADMIN'), exportOrdersForAdmin);
router.put('/admin/:id/status', authorize('ADMIN'), updateOrderStatus);
router.put('/admin/:id/confirm-delivery', authorize('ADMIN'), confirmDelivery);
router.put('/:id/confirm-delivery', authorize('ADMIN'), confirmDelivery);

// Customer endpoints
router.post('/', createOrder);
router.get('/my-orders', getMyOrders);
router.get('/:id', getOrderById);
router.put('/:id/cancel', cancelOrder);

module.exports = router;
