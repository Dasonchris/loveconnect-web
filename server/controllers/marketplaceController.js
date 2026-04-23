// server/controllers/marketplaceController.js
const Product = require('../models/Product');

// GET /api/marketplace  ← Marketplace.jsx grid
exports.getProducts = async (req, res) => {
  try {
    const { search } = req.query;

    const query = search
      ? { name: { $regex: search, $options: 'i' } }
      : {};

    const products = await Product.find(query).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/marketplace/purchase/:id  ← confirm button in Marketplace.jsx
exports.purchaseProduct = async (req, res) => {
  try {
    const { name, message } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product)
      return res.status(404).json({ message: 'Product not found' });
    if (product.sold)
      return res.status(400).json({ message: 'Product already sold' });

    product.sold        = true;
    product.soldTo      = req.user._id;
    product.soldMessage = message || '';
    await product.save();

    res.json({
      message: `Successfully purchased ${product.name} for ${name} 🎉`,
      product,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/marketplace  ← add product (admin/seller)
exports.addProduct = async (req, res) => {
  try {
    const { name, price, description, image, category } = req.body;

    if (!name || !price)
      return res.status(400).json({ message: 'Name and price are required' });

    const product = await Product.create({
      name, price, description, image, category
    });
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};