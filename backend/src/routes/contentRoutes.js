const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const {
  getHomeSections,
  getTestimonials,
  getBrandLogos,
  createHomeSection,
  updateHomeSection,
  deleteHomeSection,
  getAllTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  getAllBrandLogos,
  createBrandLogo,
  updateBrandLogo,
  deleteBrandLogo,
} = require('../controllers/contentController');

// Public routes — mounted at /api/home
const publicRouter = express.Router();
publicRouter.get('/sections', getHomeSections);
publicRouter.get('/testimonials', getTestimonials);
publicRouter.get('/brands', getBrandLogos);

// Admin routes — mounted at /api/admin/home
const adminRouter = express.Router();
adminRouter.use(authenticate, authorize('ADMIN'));

adminRouter.post('/sections', createHomeSection);
adminRouter.put('/sections/:id', updateHomeSection);
adminRouter.delete('/sections/:id', deleteHomeSection);

adminRouter.get('/testimonials', getAllTestimonials);
adminRouter.post('/testimonials', createTestimonial);
adminRouter.put('/testimonials/:id', updateTestimonial);
adminRouter.delete('/testimonials/:id', deleteTestimonial);

adminRouter.get('/brands', getAllBrandLogos);
adminRouter.post('/brands', createBrandLogo);
adminRouter.put('/brands/:id', updateBrandLogo);
adminRouter.delete('/brands/:id', deleteBrandLogo);

module.exports = { publicRouter, adminRouter };
