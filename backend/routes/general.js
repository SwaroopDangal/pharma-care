const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// CUSTOMERS
router.get('/customers', async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT * FROM customers WHERE 1=1';
    const params = [];
    if (search) {
      query += ' AND (LOWER(name) LIKE $1 OR phone LIKE $1)';
      params.push(`%${search.toLowerCase()}%`);
    }
    query += ' ORDER BY name ASC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/customers', async (req, res) => {
  try {
    const { name, phone, email, address, date_of_birth } = req.body;
    const result = await pool.query(
      'INSERT INTO customers (name, phone, email, address, date_of_birth) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [name, phone, email, address, date_of_birth]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/customers/:id', async (req, res) => {
  try {
    const { name, phone, email, address, date_of_birth } = req.body;
    const result = await pool.query(
      'UPDATE customers SET name=$1, phone=$2, email=$3, address=$4, date_of_birth=$5 WHERE id=$6 RETURNING *',
      [name, phone, email, address, date_of_birth, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/customers/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM customers WHERE id = $1', [req.params.id]);
    res.json({ message: 'Customer deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// CATEGORIES
router.get('/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/categories', async (req, res) => {
  try {
    const { name, description } = req.body;
    const result = await pool.query(
      'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *',
      [name, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// SUPPLIERS
router.get('/suppliers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM suppliers ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/suppliers', async (req, res) => {
  try {
    const { name, contact_person, phone, email, address } = req.body;
    const result = await pool.query(
      'INSERT INTO suppliers (name, contact_person, phone, email, address) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [name, contact_person, phone, email, address]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/suppliers/:id', async (req, res) => {
  try {
    const { name, contact_person, phone, email, address } = req.body;
    const result = await pool.query(
      'UPDATE suppliers SET name=$1, contact_person=$2, phone=$3, email=$4, address=$5 WHERE id=$6 RETURNING *',
      [name, contact_person, phone, email, address, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DASHBOARD STATS
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalMeds, lowStock, expiringSoon, todaySales,
      monthlySales, topMeds, recentSales
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM medicines'),
      pool.query('SELECT COUNT(*) FROM medicines WHERE quantity_in_stock <= reorder_level'),
      pool.query(`SELECT COUNT(*) FROM medicines WHERE expiry_date <= NOW() + INTERVAL '30 days' AND expiry_date > NOW()`),
      pool.query(`SELECT COALESCE(SUM(total_amount), 0) as total, COUNT(*) as count FROM sales WHERE DATE(created_at) = CURRENT_DATE AND status = 'completed'`),
      pool.query(`SELECT COALESCE(SUM(total_amount), 0) as total, COUNT(*) as count FROM sales WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW()) AND status = 'completed'`),
      pool.query(`
        SELECT m.name, SUM(si.quantity) as total_sold
        FROM sale_items si
        JOIN medicines m ON si.medicine_id = m.id
        JOIN sales s ON si.sale_id = s.id
        WHERE s.created_at >= NOW() - INTERVAL '30 days'
        GROUP BY m.name ORDER BY total_sold DESC LIMIT 5
      `),
      pool.query(`
        SELECT s.invoice_number, s.total_amount, s.created_at, s.payment_method, c.name as customer_name
        FROM sales s LEFT JOIN customers c ON s.customer_id = c.id
        ORDER BY s.created_at DESC LIMIT 5
      `)
    ]);

    res.json({
      stats: {
        total_medicines: parseInt(totalMeds.rows[0].count),
        low_stock: parseInt(lowStock.rows[0].count),
        expiring_soon: parseInt(expiringSoon.rows[0].count),
        today_revenue: parseFloat(todaySales.rows[0].total),
        today_sales: parseInt(todaySales.rows[0].count),
        monthly_revenue: parseFloat(monthlySales.rows[0].total),
        monthly_sales: parseInt(monthlySales.rows[0].count),
      },
      top_medicines: topMeds.rows,
      recent_sales: recentSales.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
