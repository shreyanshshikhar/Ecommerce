const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ============ MONGODB CONNECTION ============
const MONGODB_URI = 'mongodb://127.0.0.1:27017/ecommerce';

console.log('🔄 Connecting to MongoDB...');
console.log('📊 Connection:', MONGODB_URI.includes('mongodb+srv') ? 'MongoDB Atlas (Cloud)' : 'Localhost');

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ MongoDB Connected Successfully!');
        console.log('📁 Database:', mongoose.connection.name);
    })
    .catch(err => {
        console.error('❌ MongoDB Connection Error:', err.message);
    });

// ============ SCHEMAS ============

// User Schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'customer' },
    createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

const User = mongoose.model('User', userSchema);

// Product Schema
const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    image: { type: String, default: '' },
    stock: { type: Number, default: 1 },
    createdAt: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', productSchema);

// Order Schema
const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        price: Number,
        quantity: Number
    }],
    totalAmount: { type: Number, required: true },
    shippingAddress: {
        street: String,
        city: String,
        state: String,
        pincode: String
    },
    status: { type: String, default: 'Processing' },
    paymentStatus: { type: String, default: 'Pending' },
    createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);

// ============ MIDDLEWARE ============

// Admin Authentication Middleware - FIXED
const adminAuth = async(req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Invalid token format' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mySecretKey123');
        const user = await User.findById(decoded.userId);

        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// User Authentication Middleware - FIXED
const userAuth = async(req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Invalid token format' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mySecretKey123');
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// ============ PUBLIC ROUTES ============

// Test Route
app.get('/', (req, res) => {
    res.json({
        message: 'E-commerce API is running!',
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
    });
});

// REGISTER
app.post('/api/auth/register', async(req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = new User({ name, email, password });
        await user.save();

        console.log(`✅ New user registered: ${user.email}`);

        const token = jwt.sign({ userId: user._id, role: user.role },
            process.env.JWT_SECRET || 'mySecretKey123', { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            token: token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Register Error:', error.message);

        if (error.code === 11000) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        res.status(500).json({ message: error.message });
    }
});

// LOGIN
app.post('/api/auth/login', async(req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        console.log(`✅ User logged in: ${user.email}`);

        const token = jwt.sign({ userId: user._id, role: user.role },
            process.env.JWT_SECRET || 'mySecretKey123', { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            token: token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login Error:', error.message);
        res.status(500).json({ message: error.message });
    }
});

// GET ALL PRODUCTS (Public)
app.get('/api/products', async(req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET SINGLE PRODUCT (Public)
app.get('/api/products/:id', async(req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ============ USER ROUTES (Require Login) ============

// CREATE ORDER
app.post('/api/orders', userAuth, async(req, res) => {
    try {
        const { items, shippingAddress, totalAmount } = req.body;

        const order = new Order({
            user: req.user._id,
            items,
            shippingAddress,
            totalAmount
        });

        await order.save();
        console.log(`✅ New order created by: ${req.user.email}`);

        res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            order
        });
    } catch (error) {
        console.error('Order Error:', error.message);
        res.status(500).json({ message: error.message });
    }
});

// GET USER ORDERS
app.get('/api/orders/my-orders', userAuth, async(req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .populate('items.product')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ============ ADMIN ROUTES (Require Admin Login) ============

// ADD PRODUCT (Admin Only)
app.post('/api/admin/products', adminAuth, async(req, res) => {
    try {
        const { name, description, price, category, image, stock } = req.body;

        if (!name || !description || !price || !category) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const product = new Product({
            name,
            description,
            price: Number(price),
            category,
            image: image || 'https://via.placeholder.com/400',
            stock: stock || 10
        });

        await product.save();
        console.log(`✅ Admin added product: ${product.name}`);

        res.status(201).json({
            success: true,
            message: 'Product added successfully',
            product
        });
    } catch (error) {
        console.error('Add product error:', error.message);
        res.status(500).json({ message: error.message });
    }
});

// UPDATE PRODUCT (Admin Only)
app.put('/api/admin/products/:id', adminAuth, async(req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body, { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        console.log(`✅ Admin updated product: ${product.name}`);
        res.json({
            success: true,
            message: 'Product updated successfully',
            product
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE PRODUCT (Admin Only)
app.delete('/api/admin/products/:id', adminAuth, async(req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        console.log(`✅ Admin deleted product: ${product.name}`);
        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET ALL ORDERS (Admin Only)
app.get('/api/admin/orders', adminAuth, async(req, res) => {
    try {
        const orders = await Order.find()
            .populate('user', 'name email')
            .populate('items.product')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// UPDATE ORDER STATUS (Admin Only)
app.put('/api/admin/orders/:id', adminAuth, async(req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findByIdAndUpdate(
            req.params.id, { status }, { new: true }
        );

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json({
            success: true,
            message: 'Order status updated',
            order
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET DASHBOARD STATS (Admin Only)
app.get('/api/admin/stats', adminAuth, async(req, res) => {
    try {
        const totalProducts = await Product.countDocuments();
        const totalOrders = await Order.countDocuments();
        const totalUsers = await User.countDocuments();

        const orders = await Order.find();
        const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

        res.json({
            totalProducts,
            totalOrders,
            totalUsers,
            totalRevenue
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ============ START SERVER ============
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log('📝 API Endpoints:');
    console.log('   POST   /api/auth/register');
    console.log('   POST   /api/auth/login');
    console.log('   GET    /api/products');
    console.log('   POST   /api/admin/products    (Admin only)');
    console.log('   PUT    /api/admin/products/:id (Admin only)');
    console.log('   DELETE /api/admin/products/:id (Admin only)');
});