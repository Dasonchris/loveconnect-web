// server/routes/marketplaceRoutes.js
const router = require('express').Router();
const auth   = require('../middleware/authMiddleware');
const {
  getProducts, purchaseProduct, addProduct
} = require('../controllers/marketplaceController');

router.get('/',                   auth, getProducts);
router.post('/',                  auth, addProduct);
router.post('/purchase/:id',      auth, purchaseProduct);

module.exports = router;