const express = require('express');
const {
  getDashboardStats,
  getCustomers,
  updateCustomerRole,
} = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Strict admin gating across all sub-routes (Rule 24)
router.use(authenticate, authorize('ADMIN'));

router.get('/dashboard/stats', getDashboardStats);
router.get('/customers', getCustomers);
router.put('/customers/:id/role', updateCustomerRole);

module.exports = router;
