const express = require('express');
const Product = require('../models/Product');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// GET all products (public)
router.get('/', async(req, res) => {
    try {
        const { category, search, sort } = req.query;
        let query = {};

        // Filter by category
        if (category && category !== 'All') {
            query.category = category;
        }

        // Search by name
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        // Sort options
        let sortOption = { createdAt: -1 };
        if (sort === 'price-asc') sortOption = { price: 1 };
        if (sort === 'price-desc') sortOption = { price: -1 };

        const products = await Product.find(query).sort(sortOption);
        res.json(products);

    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET single product (public)
router.get('/:id', async(req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.json(product);

    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// CREATE product (admin only)
router.post('/', adminAuth, async(req, res) => {
    try {
        const { name, description, price, category, image, stock } = req.body;

        const product = new Product({
            name,
            description,
            price,
            category,
            image: image || 'https://via.placeholder.com/400',
            stock: stock || 10
        });

        await product.save();
        res.status(201).json(product);

    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// UPDATE product (admin only)
router.put('/:id', adminAuth, async(req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body, { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.json(product);

    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE product (admin only)
router.delete('/:id', adminAuth, async(req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.json({ message: 'Product deleted successfully' });

    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;