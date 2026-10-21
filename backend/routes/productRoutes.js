const express = require('express');
const router = express.Router();
const { getCategories, getProducts } = require('../controllers/productController');

router.get('/categories', getCategories);
router.get('/products', getProducts);

module.exports = router;