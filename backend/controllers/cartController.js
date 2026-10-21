const db = require('../config/db');

exports.getCart = async (req, res) => {
  const customerId = req.query.customerId || 1; 
  try {
    const sql = `
      SELECT ci.cart_item_id, p.product_id, p.product_name AS name, p.price, p.unit, ci.quantity, (p.price * ci.quantity) as total_price
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.product_id
      WHERE ci.customer_id = ?
    `;
    const [rows] = await db.query(sql, [customerId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addToCart = async (req, res) => {
  const { customerId = 1, productId, quantity = 1 } = req.body;
  try {
    const [existing] = await db.query(
      'SELECT * FROM cart_items WHERE customer_id = ? AND product_id = ?',
      [customerId, productId]
    );

    if (existing.length > 0) {
      await db.query(
        'UPDATE cart_items SET quantity = quantity + ? WHERE customer_id = ? AND product_id = ?',
        [quantity, customerId, productId]
      );
    } else {
      await db.query(
        'INSERT INTO cart_items (customer_id, product_id, quantity) VALUES (?, ?, ?)',
        [customerId, productId, quantity]
      );
    }
    res.json({ message: 'Cart updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateQuantity = async (req, res) => {
  const { customerId = 1, productId, delta } = req.body;
  try {
    const [existing] = await db.query(
      'SELECT quantity FROM cart_items WHERE customer_id = ? AND product_id = ?',
      [customerId, productId]
    );

    if (existing.length > 0) {
      const newQty = existing[0].quantity + delta;
      if (newQty <= 0) {
        await db.query('DELETE FROM cart_items WHERE customer_id = ? AND product_id = ?', [customerId, productId]);
      } else {
        await db.query('UPDATE cart_items SET quantity = ? WHERE customer_id = ? AND product_id = ?', [newQty, customerId, productId]);
      }
    }
    res.json({ message: 'Cart item updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};