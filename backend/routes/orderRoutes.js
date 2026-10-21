const express = require('express');
const router = express.Router();
const { placeOrder, getOrderHistory } = require('../controllers/orderController');

router.post('/checkout', placeOrder);
router.get('/history', getOrderHistory);

module.exports = router;