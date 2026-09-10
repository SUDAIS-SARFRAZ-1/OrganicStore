const express = require('express');
const { createOrder, getMyOrders, getOrderById } = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All order endpoints strictly require authentication (Rule 23)
router.use(authenticate);

router.post('/', createOrder);
router.get('/my-orders', getMyOrders);
router.get('/:id', getOrderById);

module.exports = router;
