// server/routes/marketplaceRoutes.js
const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const adminAuth = require('../middleware/adminMiddleware');
const {
  getProducts,
  purchaseProduct,
  addProduct,
  getFeatured,
  setFeatured,
} = require('../controllers/marketplaceController');

// Public featured endpoint for adverts
router.get('/featured', getFeatured);

router.get('/', auth, getProducts);
router.post('/', auth, addProduct);
router.post('/purchase/:id', auth, purchaseProduct);

// Admin-only: toggle featured flag
router.put('/:id/feature', adminAuth, setFeatured);

module.exports = router;