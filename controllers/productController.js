const {db,db_promise} = require('../db');

exports.getAllProducts = async (req, res) => {
  try {
    let { search, category_id, min_price, max_price, page, limit } = req.query;
    let sql = `
      SELECT p.*
      FROM products p`;
    let whereClauses = [];
    let params = [];

    if (search) {
      whereClauses.push('p.name LIKE ?');
      params.push(`%${search}%`);
    }
    if (min_price) {
      whereClauses.push('p.price >= ?');
      params.push(parseFloat(min_price));
    }
    if (max_price) {
      whereClauses.push('p.price <= ?');
      params.push(parseFloat(max_price));
    }
    if (category_id) {
      whereClauses.push('p.category_id = ?');
      params.push(parseInt(category_id));
    }

    // Add WHERE clause if there are any conditions
    if (whereClauses.length > 0) {
      sql += ' WHERE ' + whereClauses.join(' AND ');
    }

    // Pagination
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 20;
    const offset = (page - 1) * limit;
    
    // Add ORDER BY and pagination
    sql += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit.toString(), offset.toString());

    // Get total count for pagination
    const countSql = `SELECT COUNT(*) as total FROM products${whereClauses.length > 0 ? ' WHERE ' + whereClauses.join(' AND ') : ''}`;
    const [countResult] = await db_promise.query(countSql, params.slice(0, -2));
    const total = countResult[0].total;
    
    console.log('Executing query:', sql);
    console.log('With params:', params);
    
    const [results] = await db_promise.execute(sql, params);
    
    res.json({
      data: results,
      pagination: {
        total: total,
        page: page,
        limit: limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ message: 'Database error', error: err.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT p.*
      FROM products p 
      WHERE p.id = ?
    `;

    console.log("Fetching product with ID:", id);
    
    const [results] = await db_promise.execute(sql, [id]);
    console.log("Query results:", results);
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(results[0]);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ message: 'Database error', error: err.message });
  }
};

exports.createProduct = async (req, res) => {
  const { 
    name = null, 
    description = null, 
    price = 0, 
    image_url = null, 
    stock = null, 
    category_id = null, 
    vendor_id = null,
    is_deal_of_the_week = 0 
  } = req.body;
  
  if (!name || !price || !stock) {
    return res.status(400).json({ message: 'Name, price, and stock are required' });
  }

  console.log(req.body)
  
  const sql = `
    INSERT INTO products (name, description, price, image_url, stock, category_id, vendor_id, is_deal_of_the_week, created_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
  `;
  
  try{
  const [result] = await db_promise.execute(sql, [name, description, price, image_url, stock, category_id, vendor_id, is_deal_of_the_week]);
    res.status(201).json({ 
      id: result.insertId, 
      name, 
      description, 
      price, 
      image_url, 
      stock, 
      category_id, 
      vendor_id,
      is_deal_of_the_week 
    });
  }catch(err){
    console.log("DB Error:",err);
    return res.status(500).json({ message: 'Database error', error: err.message });
  }
};

exports.updateProduct = (req, res) => {
  const { id } = req.params;
  const { 
    name, 
    description, 
    price, 
    image_url, 
    stock, 
    category_id, 
    vendor_id,
    is_deal_of_the_week 
  } = req.body;
  
  const sql = `
    UPDATE products 
    SET name=?, description=?, price=?, image_url=?, stock=?, category_id=?, vendor_id=?, is_deal_of_the_week=? 
    WHERE id=?
  `;
  
  db.query(sql, [name, description, price, image_url, stock, category_id, vendor_id, is_deal_of_the_week, id], (err, result) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err.message });
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product updated successfully' });
  });
};

exports.deleteProduct = (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM products WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err.message });
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  });
};

// Get products by category
exports.getProductsByCategory = (req, res) => {
  const { category_id } = req.params;
  const sql = `
    SELECT p.*, c.name as category_name 
    FROM products p  
    WHERE p.category_id = ?
    ORDER BY p.created_at DESC
  `;
  
  db.query(sql, [category_id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err.message });
    res.json(results);
  });
};

// Get deal of the week products
exports.getDealOfTheWeek = (req, res) => {
  const sql = `
    SELECT p.* 
    FROM products p 
    WHERE p.is_deal_of_the_week = 1
    ORDER BY p.created_at DESC
  `;
  
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err.message });
    res.json(results);
  });
}; 
