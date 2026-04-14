const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// CREATE RAZORPAY ORDER
router.post('/create-order', auth, async(req, res) => {
    try {
        const { amount, orderId } = req.body;

        const options = {
            amount: amount * 100, // Amount in paise
            currency: 'INR',
            receipt: orderId
        };

        const razorpayOrder = await razorpay.orders.create(options);

        // Save razorpay order ID to database
        await Order.findByIdAndUpdate(orderId, {
            razorpayOrderId: razorpayOrder.id
        });

        res.json({
            id: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            key: process.env.RAZORPAY_KEY_ID
        });

    } catch (error) {
        console.error('Create payment error:', error);
        res.status(500).json({ message: 'Payment creation failed' });
    }
});

// VERIFY PAYMENT
router.post('/verify', auth, async(req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            orderId
        } = req.body;

        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            await Order.findByIdAndUpdate(orderId, {
                paymentStatus: 'completed',
                razorpayPaymentId: razorpay_payment_id,
                status: 'processing'
            });

            res.json({ success: true, message: 'Payment verified' });
        } else {
            await Order.findByIdAndUpdate(orderId, {
                paymentStatus: 'failed'
            });

            res.status(400).json({ success: false, message: 'Invalid signature' });
        }

    } catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({ message: 'Verification failed' });
    }
});

module.exports = router;