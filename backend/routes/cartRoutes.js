const express = require('express');
const router = express.Router();
const { getCart, addToCart, updateQuantity } = require('../controllers/cartController');

router.get('/', getCart);
router.post('/add', addToCart);
router.post('/update', updateQuantity);

module.exports = router;