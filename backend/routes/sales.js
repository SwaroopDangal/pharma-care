const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// GET all sales
router.get('/', async (req, res) => {
  try {
    const { start_date, end_date, status } = req.query;
    let query = `
      SELECT s.*, c.name as customer_name, u.name as staff_name,
             COUNT(si.id) as item_count
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN sale_items si ON s.id = si.sale_id
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    if (start_date) { query += ` AND s.created_at >= $${idx}`; params.push(start_date); idx++; }
    if (end_date) { query += ` AND s.created_at <= $${idx}`; params.push(end_date); idx++; }
    if (status) { query += ` AND s.status = $${idx}`; params.push(status); idx++; }

    query += ' GROUP BY s.id, c.name, u.name ORDER BY s.created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET single sale with items
router.get('/:id', async (req, res) => {
  try {
    const sale = await pool.query(
      `SELECT s.*, c.name as customer_name, c.phone as customer_phone, u.name as staff_name
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       LEFT JOIN users u ON s.user_id = u.id
       WHERE s.id = $1`,
      [req.params.id]
    );
    if (!sale.rows[0]) return res.status(404).json({ error: 'Sale not found' });

    const items = await pool.query(
      `SELECT si.*, m.name as medicine_name, m.dosage, m.unit
       FROM sale_items si
       LEFT JOIN medicines m ON si.medicine_id = m.id
       WHERE si.sale_id = $1`,
      [req.params.id]
    );

    res.json({ ...sale.rows[0], items: items.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create sale
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const {
      customer_id, items, discount = 0, tax = 0,
      payment_method, prescription_number, notes
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No items in sale' });
    }

    // Generate invoice number
    const countRes = await client.query('SELECT COUNT(*) FROM sales');
    const invoiceNum = `INV-${String(Number(countRes.rows[0].count) + 1).padStart(6, '0')}`;

    let subtotal = 0;
    for (const item of items) {
      subtotal += item.quantity * item.unit_price;
    }
    const totalAmount = subtotal - discount + tax;

    const saleRes = await client.query(
      `INSERT INTO sales (invoice_number, customer_id, user_id, total_amount, discount, tax, payment_method, prescription_number, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [invoiceNum, customer_id, req.user.id, totalAmount, discount, tax, payment_method || 'cash', prescription_number, notes]
    );
    const sale = saleRes.rows[0];

    for (const item of items) {
      await client.query(
        `INSERT INTO sale_items (sale_id, medicine_id, quantity, unit_price, total_price)
         VALUES ($1, $2, $3, $4, $5)`,
        [sale.id, item.medicine_id, item.quantity, item.unit_price, item.quantity * item.unit_price]
      );
      // Deduct stock
      await client.query(
        'UPDATE medicines SET quantity_in_stock = quantity_in_stock - $1, updated_at = NOW() WHERE id = $2',
        [item.quantity, item.medicine_id]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(sale);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

module.exports = router;
