const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  const { full_name, email, phone, password } = req.body;
  try {
    const [existing] = await db.query('SELECT * FROM customers WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(400).json({ message: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password || '123456', 10);
    const [result] = await db.query(
      'INSERT INTO customers (full_name, email, phone) VALUES (?, ?, ?)',
      [full_name, email, phone]
    );

    const token = jwt.sign({ id: result.insertId, email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, customer: { id: result.insertId, full_name, email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  const { email } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM customers WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(404).json({ message: 'Customer not found' });

    const customer = rows[0];
    const token = jwt.sign({ id: customer.customer_id, email: customer.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, customer: { id: customer.customer_id, full_name: customer.full_name, email: customer.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};