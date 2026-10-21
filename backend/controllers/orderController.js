const db = require('../config/db');

exports.placeOrder = async (req, res) => {
  const { customerId = 1, addressId = 1, paymentMethod = 'UPI' } = req.body;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [cartItems] = await connection.query(
      `SELECT ci.product_id, ci.quantity, p.price, i.stock_quantity 
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.product_id
       JOIN inventory i ON ci.product_id = i.product_id
       WHERE ci.customer_id = ?`,
      [customerId]
    );

    if (cartItems.length === 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'Cart is empty' });
    }

    let totalAmount = 0;
    for (const item of cartItems) {
      if (item.stock_quantity < item.quantity) {
        await connection.rollback();
        return res.status(400).json({ message: `Insufficient stock for product ID: ${item.product_id}` });
      }
      totalAmount += item.price * item.quantity;
    }

    const [orderResult] = await connection.query(
      'INSERT INTO orders (customer_id, address_id, total_amount, order_status) VALUES (?, ?, ?, ?)',
      [customerId, addressId, totalAmount, 'PLACED']
    );
    const orderId = orderResult.insertId;

    for (const item of cartItems) {
      await connection.query(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
        [orderId, item.product_id, item.quantity, item.price]
      );

      await connection.query(
        'UPDATE inventory SET stock_quantity = stock_quantity - ? WHERE product_id = ?',
        [item.quantity, item.product_id]
      );
    }

    await connection.query(
      'INSERT INTO payments (order_id, payment_method, payment_status, amount, transaction_id) VALUES (?, ?, ?, ?, ?)',
      [orderId, paymentMethod, 'PENDING', totalAmount, `TXN_${Date.now()}`]
    );

    const [partners] = await connection.query('SELECT partner_id FROM delivery_partners LIMIT 1');
    if (partners.length > 0) {
      await connection.query(
        'INSERT INTO deliveries (order_id, partner_id, delivery_status) VALUES (?, ?, ?)',
        [orderId, partners[0].partner_id, 'ASSIGNED']
      );
    }

    await connection.query('DELETE FROM cart_items WHERE customer_id = ?', [customerId]);

    await connection.commit();
    res.status(201).json({ message: 'Order placed successfully!', orderId, totalAmount });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: 'Transaction Failed: ' + err.message });
  } finally {
    connection.release();
  }
};

exports.getOrderHistory = async (req, res) => {
  const customerId = req.query.customerId || 1;
  try {
    const [orders] = await db.query(
      `SELECT o.order_id, o.total_amount, o.order_status, o.order_date,
              d.delivery_status, dp.partner_name, dp.phone as partner_phone
       FROM orders o
       LEFT JOIN deliveries d ON o.order_id = d.order_id
       LEFT JOIN delivery_partners dp ON d.partner_id = dp.partner_id
       WHERE o.customer_id = ?
       ORDER BY o.order_date DESC`,
      [customerId]
    );
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};