const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// GET all medicines
router.get('/', async (req, res) => {
  try {
    const { search, category, low_stock } = req.query;
    let query = `
      SELECT m.*, c.name as category_name, s.name as supplier_name
      FROM medicines m
      LEFT JOIN categories c ON m.category_id = c.id
      LEFT JOIN suppliers s ON m.supplier_id = s.id
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    if (search) {
      query += ` AND (LOWER(m.name) LIKE $${idx} OR LOWER(m.generic_name) LIKE $${idx})`;
      params.push(`%${search.toLowerCase()}%`);
      idx++;
    }
    if (category) {
      query += ` AND m.category_id = $${idx}`;
      params.push(category);
      idx++;
    }
    if (low_stock === 'true') {
      query += ` AND m.quantity_in_stock <= m.reorder_level`;
    }
    query += ' ORDER BY m.name ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET single medicine
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.*, c.name as category_name, s.name as supplier_name
       FROM medicines m
       LEFT JOIN categories c ON m.category_id = c.id
       LEFT JOIN suppliers s ON m.supplier_id = s.id
       WHERE m.id = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Medicine not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create medicine
router.post('/', async (req, res) => {
  try {
    const {
      name, generic_name, category_id, supplier_id, dosage, unit,
      purchase_price, selling_price, quantity_in_stock, reorder_level,
      expiry_date, batch_number, description, requires_prescription
    } = req.body;

    const result = await pool.query(
      `INSERT INTO medicines 
       (name, generic_name, category_id, supplier_id, dosage, unit, purchase_price, selling_price,
        quantity_in_stock, reorder_level, expiry_date, batch_number, description, requires_prescription)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [name, generic_name, category_id || null, supplier_id || null, dosage, unit,
        purchase_price, selling_price, quantity_in_stock || 0, reorder_level || 10,
        expiry_date, batch_number, description, requires_prescription || false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update medicine
router.put('/:id', async (req, res) => {
  try {
    const {
      name, generic_name, category_id, supplier_id, dosage, unit,
      purchase_price, selling_price, quantity_in_stock, reorder_level,
      expiry_date, batch_number, description, requires_prescription
    } = req.body;

    const result = await pool.query(
      `UPDATE medicines SET
       name=$1, generic_name=$2, category_id=$3, supplier_id=$4, dosage=$5, unit=$6,
       purchase_price=$7, selling_price=$8, quantity_in_stock=$9, reorder_level=$10,
       expiry_date=$11, batch_number=$12, description=$13, requires_prescription=$14,
       updated_at=NOW()
       WHERE id=$15 RETURNING *`,
      [name, generic_name, category_id || null, supplier_id || null, dosage, unit,
        purchase_price, selling_price, quantity_in_stock, reorder_level,
        expiry_date, batch_number, description, requires_prescription, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Medicine not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE medicine
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM medicines WHERE id = $1', [req.params.id]);
    res.json({ message: 'Medicine deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
