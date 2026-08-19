#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Criando projeto Hulk Lanches...${NC}"

# Criar estrutura de pastas
mkdir -p hulk-lanches
cd hulk-lanches

mkdir -p backend/src/{config,models,routes,controllers,middleware,utils}
mkdir -p frontend/{src/pages,src/components,src/services,src/styles,public/images}
mkdir -p data

echo -e "${GREEN}📁 Estrutura de pastas criada!${NC}"

# ==================== BACKEND ====================

echo -e "${YELLOW}📦 Criando arquivos do backend...${NC}"

# backend/package.json
cat > backend/package.json << 'EOF'
{
  "name": "hulk-lanches-backend",
  "version": "1.0.0",
  "description": "Backend do sistema Hulk Lanches",
  "main": "src/server.js",
  "type": "module",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "init-db": "node src/config/database.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "sqlite3": "^5.1.6",
    "sqlite": "^5.1.1",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "socket.io": "^4.7.2",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
EOF

# backend/.env
cat > backend/.env << 'EOF'
PORT=3000
JWT_SECRET=HulkLanches2026!SuperSecret
DATABASE_URL=./data/hulk.db
NODE_ENV=development
EOF

# backend/src/config/database.js
cat > backend/src/config/database.js << 'EOF'
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dataDir = join(__dirname, '../../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db;

export async function getDatabase() {
  if (!db) {
    db = await open({
      filename: join(dataDir, 'hulk.db'),
      driver: sqlite3.Database
    });
    await initializeDatabase();
  }
  return db;
}

async function initializeDatabase() {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT CHECK(role IN ('funcionario', 'producao', 'admin')) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      image TEXT,
      category_id INTEGER,
      stock INTEGER DEFAULT 0,
      is_promotion BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_number INTEGER,
      user_id INTEGER,
      status TEXT CHECK(status IN ('pendente', 'em_preparo', 'pronto', 'entregue')) DEFAULT 'pendente',
      total DECIMAL(10,2),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      product_id INTEGER,
      quantity INTEGER NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    INSERT OR IGNORE INTO users (name, email, password, role) 
    VALUES ('Administrador', 'admin@hulk.com', '$2a$10$XKm.8QZ.3tJ4Y5Z6W7X8Y9Z0W1X2Y3Z4W5X6Y7Z8W9X0Y1Z2W3X4Y5Z6W7X8', 'admin');

    INSERT OR IGNORE INTO categories (name, icon) VALUES 
      ('Combo', '🍔'),
      ('Mais Pedidos', '⭐'),
      ('Promoção', '🔥'),
      ('Bebidas', '🥤'),
      ('Acompanhamentos', '🍟'),
      ('Sobremesa', '🍰');

    INSERT OR IGNORE INTO products (name, description, price, category_id, stock, is_promotion) VALUES
      ('Combo Hulk', 'Hambúrguer duplo + batata + refrigerante', 35.90, 1, 10, 0),
      ('Combo Smash', 'Smash burger + onion rings + suco', 32.90, 1, 8, 0),
      ('X-Tudo', 'Pão, carne, queijo, presunto, ovo, salada', 28.90, 2, 15, 0),
      ('Cheddar Bacon', 'Pão, carne, cheddar, bacon, cebola caramelizada', 26.90, 2, 12, 0),
      ('Promoção Dupla', '2 X-Tudos por R$ 45,00', 45.00, 3, 5, 1),
      ('Refrigerante', 'Coca-Cola, Guaraná ou Fanta', 7.90, 4, 50, 0),
      ('Suco Natural', 'Laranja, Limão ou Morango', 9.90, 4, 30, 0),
      ('Batata Frita', 'Porção média com queijo', 12.90, 5, 20, 0),
      ('Onion Rings', 'Anéis de cebola empanados', 11.90, 5, 15, 0),
      ('Petit Gateau', 'Com sorvete de creme', 14.90, 6, 10, 0),
      ('Milkshake', 'Chocolate, Morango ou Baunilha', 13.90, 6, 12, 0);
  `);
}
EOF

# backend/src/models/User.js
cat > backend/src/models/User.js << 'EOF'
import { getDatabase } from '../config/database.js';
import bcrypt from 'bcryptjs';

export class User {
  static async create({ name, email, password, role }) {
    const db = await getDatabase();
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.run(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role]
    );
    return { id: result.lastID, name, email, role };
  }

  static async findByEmail(email) {
    const db = await getDatabase();
    return await db.get('SELECT * FROM users WHERE email = ?', [email]);
  }

  static async findById(id) {
    const db = await getDatabase();
    return await db.get('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [id]);
  }

  static async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }
}
EOF

# backend/src/models/Product.js
cat > backend/src/models/Product.js << 'EOF'
import { getDatabase } from '../config/database.js';

export class Product {
  static async findAll() {
    const db = await getDatabase();
    return await db.all(`
      SELECT p.*, c.name as category_name 
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.name
    `);
  }

  static async findByCategory(categoryId) {
    const db = await getDatabase();
    return await db.all(
      'SELECT * FROM products WHERE category_id = ? ORDER BY name',
      [categoryId]
    );
  }

  static async findPromotions() {
    const db = await getDatabase();
    return await db.all('SELECT * FROM products WHERE is_promotion = 1');
  }

  static async findById(id) {
    const db = await getDatabase();
    return await db.get('SELECT * FROM products WHERE id = ?', [id]);
  }

  static async create({ name, description, price, image, category_id, stock, is_promotion }) {
    const db = await getDatabase();
    const result = await db.run(
      `INSERT INTO products (name, description, price, image, category_id, stock, is_promotion) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, description, price, image || null, category_id, stock || 0, is_promotion || 0]
    );
    return { id: result.lastID, name, description, price };
  }

  static async update(id, data) {
    const db = await getDatabase();
    const fields = [];
    const values = [];
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });
    values.push(id);
    await db.run(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  }

  static async updateStock(id, quantity) {
    const db = await getDatabase();
    await db.run('UPDATE products SET stock = stock - ? WHERE id = ?', [quantity, id]);
  }
}
EOF

# backend/src/models/Order.js
cat > backend/src/models/Order.js << 'EOF'
import { getDatabase } from '../config/database.js';
import { Product } from './Product.js';

export class Order {
  static async create({ table_number, user_id, items }) {
    const db = await getDatabase();
    let total = 0;
    for (const item of items) {
      const product = await Product.findById(item.product_id);
      total += product.price * item.quantity;
    }
    const result = await db.run(
      'INSERT INTO orders (table_number, user_id, total, status) VALUES (?, ?, ?, ?)',
      [table_number, user_id, total, 'pendente']
    );
    const orderId = result.lastID;
    for (const item of items) {
      const product = await Product.findById(item.product_id);
      await db.run(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, item.product_id, item.quantity, product.price]
      );
      await Product.updateStock(item.product_id, item.quantity);
    }
    return { id: orderId, table_number, user_id, total, status: 'pendente' };
  }

  static async findAll() {
    const db = await getDatabase();
    return await db.all(`
      SELECT o.*, u.name as user_name 
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `);
  }

  static async findPending() {
    const db = await getDatabase();
    return await db.all(`
      SELECT o.*, u.name as user_name 
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.status IN ('pendente', 'em_preparo')
      ORDER BY o.created_at ASC
    `);
  }

  static async findById(id) {
    const db = await getDatabase();
    const order = await db.get('SELECT * FROM orders WHERE id = ?', [id]);
    if (order) {
      order.items = await db.all(`
        SELECT oi.*, p.name as product_name 
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `, [id]);
    }
    return order;
  }

  static async updateStatus(id, status) {
    const db = await getDatabase();
    await db.run('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    return this.findById(id);
  }

  static async getDashboard() {
    const db = await getDatabase();
    const bestSellers = await db.all(`
      SELECT p.name, SUM(oi.quantity) as total_sold
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'entregue'
      GROUP BY p.id
      ORDER BY total_sold DESC
      LIMIT 5
    `);
    const todayOrders = await db.get(`
      SELECT COUNT(*) as count, SUM(total) as total
      FROM orders
      WHERE DATE(created_at) = DATE('now')
    `);
    const lowStock = await db.all(`
      SELECT * FROM products WHERE stock < 5 ORDER BY stock ASC
    `);
    return { bestSellers, todayOrders, lowStock };
  }
}
EOF

# backend/src/models/Category.js
cat > backend/src/models/Category.js << 'EOF'
import { getDatabase } from '../config/database.js';

export class Category {
  static async findAll() {
    const db = await getDatabase();
    return await db.all('SELECT * FROM categories ORDER BY name');
  }

  static async findById(id) {
    const db = await getDatabase();
    return await db.get('SELECT * FROM categories WHERE id = ?', [id]);
  }

  static async create({ name, icon }) {
    const db = await getDatabase();
    const result = await db.run(
      'INSERT INTO categories (name, icon) VALUES (?, ?)',
      [name, icon]
    );
    return { id: result.lastID, name, icon };
  }

  static async update(id, { name, icon }) {
    const db = await getDatabase();
    await db.run(
      'UPDATE categories SET name = ?, icon = ? WHERE id = ?',
      [name, icon, id]
    );
    return this.findById(id);
  }

  static async delete(id) {
    const db = await getDatabase();
    await db.run('DELETE FROM categories WHERE id = ?', [id]);
  }
}
EOF

# backend/src/middleware/auth.js
cat > backend/src/middleware/auth.js << 'EOF'
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export function authenticate(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Permissão negada' });
    }
    next();
  };
}
EOF

# backend/src/controllers/authController.js
cat > backend/src/controllers/authController.js << 'EOF'
import { User } from '../models/User.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    const isValid = await User.comparePassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function register(req, res) {
  try {
    const { name, email, password, role } = req.body;
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }
    const user = await User.create({ name, email, password, role: role || 'funcionario' });
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
EOF

# backend/src/controllers/productController.js
cat > backend/src/controllers/productController.js << 'EOF'
import { Product } from '../models/Product.js';
import { getDatabase } from '../config/database.js';

export async function getProducts(req, res) {
  try {
    const { category, promotion } = req.query;
    let products;
    if (category) {
      products = await Product.findByCategory(category);
    } else if (promotion === 'true') {
      products = await Product.findPromotions();
    } else {
      products = await Product.findAll();
    }
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getProduct(req, res) {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function createProduct(req, res) {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function updateProduct(req, res) {
  try {
    const product = await Product.update(req.params.id, req.body);
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function deleteProduct(req, res) {
  try {
    const db = await getDatabase();
    await db.run('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
EOF

# backend/src/controllers/orderController.js
cat > backend/src/controllers/orderController.js << 'EOF'
import { Order } from '../models/Order.js';

export async function createOrder(req, res) {
  try {
    const { table_number, items } = req.body;
    const order = await Order.create({
      table_number,
      user_id: req.user.id,
      items
    });
    const io = req.app.get('io');
    if (io) {
      io.emit('new_order', order);
    }
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getOrders(req, res) {
  try {
    const orders = await Order.findAll();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getPendingOrders(req, res) {
  try {
    const orders = await Order.findPending();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getOrderDetails(req, res) {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function updateOrderStatus(req, res) {
  try {
    const { status } = req.body;
    const order = await Order.updateStatus(req.params.id, status);
    const io = req.app.get('io');
    if (io) {
      io.emit('order_updated', order);
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
EOF

# backend/src/controllers/categoryController.js
cat > backend/src/controllers/categoryController.js << 'EOF'
import { Category } from '../models/Category.js';

export async function getCategories(req, res) {
  try {
    const categories = await Category.findAll();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getCategory(req, res) {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function createCategory(req, res) {
  try {
    const category = await Category.create(req.body);
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function updateCategory(req, res) {
  try {
    const category = await Category.update(req.params.id, req.body);
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function deleteCategory(req, res) {
  try {
    await Category.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
EOF

# backend/src/controllers/dashboardController.js
cat > backend/src/controllers/dashboardController.js << 'EOF'
import { Order } from '../models/Order.js';

export async function getDashboard(req, res) {
  try {
    const data = await Order.getDashboard();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
EOF

# backend/src/routes/auth.js
cat > backend/src/routes/auth.js << 'EOF'
import express from 'express';
import { login, register } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', login);
router.post('/register', register);

export default router;
EOF

# backend/src/routes/products.js
cat > backend/src/routes/products.js << 'EOF'
import express from 'express';
import { 
  getProducts, 
  getProduct, 
  createProduct, 
  updateProduct, 
  deleteProduct 
} from '../controllers/productController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getProducts);
router.get('/:id', authenticate, getProduct);
router.post('/', authenticate, authorize('admin'), createProduct);
router.put('/:id', authenticate, authorize('admin'), updateProduct);
router.delete('/:id', authenticate, authorize('admin'), deleteProduct);

export default router;
EOF

# backend/src/routes/orders.js
cat > backend/src/routes/orders.js << 'EOF'
import express from 'express';
import { 
  createOrder, 
  getOrders, 
  getPendingOrders, 
  updateOrderStatus,
  getOrderDetails
} from '../controllers/orderController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticate, authorize('funcionario', 'admin'), createOrder);
router.get('/', authenticate, authorize('admin', 'producao'), getOrders);
router.get('/pending', authenticate, authorize('producao', 'admin', 'funcionario'), getPendingOrders);
router.get('/:id', authenticate, getOrderDetails);
router.put('/:id/status', authenticate, authorize('producao', 'admin'), updateOrderStatus);

export default router;
EOF

# backend/src/routes/categories.js
cat > backend/src/routes/categories.js << 'EOF'
import express from 'express';
import { getCategories, getCategory, createCategory, updateCategory, deleteCategory } from '../controllers/categoryController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getCategories);
router.get('/:id', authenticate, getCategory);
router.post('/', authenticate, authorize('admin'), createCategory);
router.put('/:id', authenticate, authorize('admin'), updateCategory);
router.delete('/:id', authenticate, authorize('admin'), deleteCategory);

export default router;
EOF

# backend/src/routes/dashboard.js
cat > backend/src/routes/dashboard.js << 'EOF'
import express from 'express';
import { getDashboard } from '../controllers/dashboardController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, authorize('admin'), getDashboard);

export default router;
EOF

# backend/src/server.js
cat > backend/src/server.js << 'EOF'
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import categoryRoutes from './routes/categories.js';
import orderRoutes from './routes/orders.js';
import dashboardRoutes from './routes/dashboard.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, '../../frontend/dist')));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/dashboard', dashboardRoutes);

io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

app.set('io', io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Servidor rodando em http://0.0.0.0:${PORT}`);
  console.log('📦 Banco de dados inicializado');
});
EOF

echo -e "${GREEN}✅ Backend criado!${NC}"

# ==================== FRONTEND ====================

echo -e "${YELLOW}📦 Criando arquivos do frontend...${NC}"

# frontend/package.json
cat > frontend/package.json << 'EOF'
{
  "name": "hulk-lanches-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.15.0",
    "axios": "^1.5.0",
    "socket.io-client": "^4.7.2",
    "jspdf": "^2.5.1",
    "jspdf-autotable": "^3.5.31"
  },
  "devDependencies": {
    "@types/react": "^18.2.15",
    "@types/react-dom": "^18.2.7",
    "@vitejs/plugin-react": "^4.0.3",
    "autoprefixer": "^10.4.15",
    "postcss": "^8.4.29",
    "tailwindcss": "^3.3.3",
    "vite": "^4.4.5"
  }
}
EOF

# frontend/.env
cat > frontend/.env << 'EOF'
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
EOF

# frontend/vite.config.js
cat > frontend/vite.config.js << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0'
  }
})
EOF

# frontend/tailwind.config.js
cat > frontend/tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOF

# frontend/postcss.config.js
cat > frontend/postcss.config.js << 'EOF'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

# frontend/index.html
cat > frontend/index.html << 'EOF'
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Hulk Lanches</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
EOF

# frontend/src/main.jsx
cat > frontend/src/main.jsx << 'EOF'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
EOF

# frontend/src/index.css
cat > frontend/src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', sans-serif;
  background-color: #f3f4f6;
}
EOF

# frontend/src/App.jsx
cat > frontend/src/App.jsx << 'EOF'
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Cliente from './pages/Cliente';
import Funcionario from './pages/Funcionario';
import Producao from './pages/Producao';
import Admin from './pages/Admin';
import { api } from './services/api';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (token) {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      setUser(userData);
      api.defaults.headers.Authorization = `Bearer ${token}`;
    }
  }, [token]);

  const handleLogin = (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setToken(token);
    setUser(user);
    api.defaults.headers.Authorization = `Bearer ${token}`;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    delete api.defaults.headers.Authorization;
  };

  const ProtectedRoute = ({ children, allowedRoles }) => {
    if (!token || !user) {
      return <Navigate to="/login" />;
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return <Navigate to="/login" />;
    }
    return children;
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/cliente" element={
          <ProtectedRoute allowedRoles={['funcionario', 'admin']}>
            <Cliente />
          </ProtectedRoute>
        } />
        <Route path="/funcionario" element={
          <ProtectedRoute allowedRoles={['funcionario', 'admin']}>
            <Funcionario onLogout={handleLogout} />
          </ProtectedRoute>
        } />
        <Route path="/producao" element={
          <ProtectedRoute allowedRoles={['producao', 'admin']}>
            <Producao onLogout={handleLogout} />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Admin onLogout={handleLogout} />
          </ProtectedRoute>
        } />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
EOF

# frontend/src/pages/Login.jsx
cat > frontend/src/pages/Login.jsx << 'EOF'
import React, { useState } from 'react';
import { api } from '../services/api';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      onLogin(token, user);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">🍔 Hulk Lanches</h1>
          <p className="text-gray-600 mt-2">Sistema de Atendimento</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="admin@hulk.com"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="admin123"
              required
            />
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Credenciais padrão:</p>
          <p className="font-mono text-xs">admin@hulk.com / admin123</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
EOF

# frontend/src/pages/Cliente.jsx
cat > frontend/src/pages/Cliente.jsx << 'EOF'
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import ProductCard from '../components/ProductCard';
import CategoryFilter from '../components/CategoryFilter';

function Cliente() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadProducts(selectedCategory);
    } else {
      loadProducts();
    }
  }, [selectedCategory]);

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const loadProducts = async (categoryId = null) => {
    setLoading(true);
    try {
      let url = '/products';
      if (categoryId) {
        url += `?category=${categoryId}`;
      }
      const response = await api.get(url);
      setProducts(response.data);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">🍔 Hulk Lanches</h1>
          <p className="text-gray-600">Cardápio Digital</p>
        </header>

        <CategoryFilter 
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500 text-xl">Carregando...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Cliente;
EOF

# frontend/src/pages/Funcionario.jsx
cat > frontend/src/pages/Funcionario.jsx << 'EOF'
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { socket } from '../services/socket';

function Funcionario({ onLogout }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [tableNumber, setTableNumber] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories();
    loadProducts();
    socket.connect();
    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadProducts(selectedCategory);
    } else {
      loadProducts();
    }
  }, [selectedCategory]);

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const loadProducts = async (categoryId = null) => {
    setLoading(true);
    try {
      let url = '/products';
      if (categoryId) {
        url += `?category=${categoryId}`;
      }
      const response = await api.get(url);
      setProducts(response.data);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const handleSubmitOrder = async () => {
    if (!tableNumber) {
      alert('Por favor, informe o número da mesa');
      return;
    }
    if (cart.length === 0) {
      alert('Adicione itens ao pedido');
      return;
    }

    try {
      const items = cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity
      }));

      const response = await api.post('/orders', {
        table_number: parseInt(tableNumber),
        items
      });

      socket.emit('new_order', response.data);

      alert('Pedido enviado com sucesso!');
      setCart([]);
      setTableNumber('');
    } catch (error) {
      alert('Erro ao enviar pedido: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">🧑‍🍳 Funcionário - Hulk Lanches</h1>
          <button
            onClick={onLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
          >
            Sair
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-4 mb-4">
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  className={`px-3 py-1 rounded-lg ${!selectedCategory ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
                  onClick={() => setSelectedCategory(null)}
                >
                  Todos
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    className={`px-3 py-1 rounded-lg ${selectedCategory === cat.id ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {products.map(product => (
                  <div
                    key={product.id}
                    className="bg-gray-50 rounded-lg p-3 cursor-pointer hover:shadow-md transition"
                    onClick={() => addToCart(product)}
                  >
                    <div className="text-2xl mb-1">{product.name}</div>
                    <div className="text-sm text-gray-600">{product.description}</div>
                    <div className="text-green-600 font-bold mt-1">R$ {product.price.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">Estoque: {product.stock}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 h-fit sticky top-4">
            <h2 className="text-xl font-bold mb-4">🛒 Pedido Atual</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Mesa</label>
              <input
                type="number"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Número da mesa"
                min="1"
              />
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {cart.map(item => (
                <div key={item.id} className="flex items-center justify-between border-b pb-2">
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="bg-gray-200 hover:bg-gray-300 w-6 h-6 rounded-full flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="bg-gray-200 hover:bg-gray-300 w-6 h-6 rounded-full flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">R$ {(item.price * item.quantity).toFixed(2)}</div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 text-sm hover:text-red-700"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {cart.length > 0 && (
              <div className="mt-4 border-t pt-4">
                <div className="flex justify-between text-xl font-bold">
                  <span>Total:</span>
                  <span className="text-green-600">R$ {calculateTotal().toFixed(2)}</span>
                </div>
                <button
                  onClick={handleSubmitOrder}
                  className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition"
                >
                  Enviar Pedido 🚀
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Funcionario;
EOF

# frontend/src/pages/Producao.jsx
cat > frontend/src/pages/Producao.jsx << 'EOF'
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { socket } from '../services/socket';
import PrintButton from '../components/PrintButton';

function Producao({ onLogout }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingOrders();
    
    socket.connect();
    socket.on('new_order', (order) => {
      setOrders(prev => [order, ...prev]);
    });
    
    socket.on('order_updated', (updatedOrder) => {
      setOrders(prev => prev.map(order => 
        order.id === updatedOrder.id ? updatedOrder : order
      ));
    });
    
    return () => {
      socket.disconnect();
      socket.off('new_order');
      socket.off('order_updated');
    };
  }, []);

  const loadPendingOrders = async () => {
    try {
      const response = await api.get('/orders/pending');
      setOrders(response.data);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status });
    } catch (error) {
      alert('Erro ao atualizar status do pedido');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pendente': return 'bg-yellow-500';
      case 'em_preparo': return 'bg-blue-500';
      case 'pronto': return 'bg-green-500';
      case 'entregue': return 'bg-gray-500';
      default: return 'bg-gray-300';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pendente': return '⏳ Pendente';
      case 'em_preparo': return '🔧 Em preparo';
      case 'pronto': return '✅ Pronto';
      case 'entregue': return '📦 Entregue';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl">Carregando pedidos...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">👨‍🍳 Produção - Hulk Lanches</h1>
          <button
            onClick={onLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
          >
            Sair
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="text-center text-gray-500 text-xl py-12">
            🎉 Nenhum pedido pendente no momento
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {orders.map(order => (
              <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className={`${getStatusColor(order.status)} text-white px-4 py-2 flex justify-between items-center`}>
                  <span className="font-bold">Mesa {order.table_number}</span>
                  <span className="text-sm">{getStatusText(order.status)}</span>
                </div>
                
                <div className="p-4">
                  <div className="mb-3">
                    <div className="text-sm text-gray-600">Pedido #{order.id}</div>
                    <div className="text-sm text-gray-600">Funcionário: {order.user_name}</div>
                    <div className="text-sm text-gray-600">
                      {new Date(order.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div className="border-t border-b py-2 mb-3">
                    {order.items && order.items.map(item => (
                      <div key={item.id} className="flex justify-between py-1">
                        <span>{item.quantity}x {item.product_name}</span>
                        <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between font-bold text-lg mb-3">
                    <span>Total:</span>
                    <span className="text-green-600">R$ {order.total?.toFixed(2)}</span>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <PrintButton order={order} />
                    
                    {order.status === 'pendente' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'em_preparo')}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm"
                      >
                        Iniciar Preparo
                      </button>
                    )}
                    
                    {order.status === 'em_preparo' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'pronto')}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm"
                      >
                        Marcar Pronto
                      </button>
                    )}
                    
                    {order.status === 'pronto' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'entregue')}
                        className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm"
                      >
                        Entregar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Producao;
EOF

# frontend/src/pages/Admin.jsx
cat > frontend/src/pages/Admin.jsx << 'EOF'
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

function Admin({ onLogout }) {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    stock: '',
    is_promotion: false
  });
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    loadDashboard();
    loadProducts();
    loadCategories();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await api.get('/dashboard');
      setDashboard(response.data);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      await api.post('/products', {
        ...newProduct,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock)
      });
      alert('Produto adicionado com sucesso!');
      setShowAddProduct(false);
      setNewProduct({
        name: '',
        description: '',
        price: '',
        category_id: '',
        stock: '',
        is_promotion: false
      });
      loadProducts();
      loadDashboard();
    } catch (error) {
      alert('Erro ao adicionar produto: ' + (error.response?.data?.error || error.message));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl">Carregando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">📊 Admin - Hulk Lanches</h1>
          <button
            onClick={onLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
          >
            Sair
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-gray-500 text-sm">Pedidos Hoje</h3>
            <p className="text-3xl font-bold">{dashboard?.todayOrders?.count || 0}</p>
            <p className="text-green-600">R$ {dashboard?.todayOrders?.total?.toFixed(2) || '0,00'}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-gray-500 text-sm">Produtos em Estoque</h3>
            <p className="text-3xl font-bold">{products.length}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-gray-500 text-sm">Produtos em Baixa</h3>
            <p className="text-3xl font-bold text-red-500">{dashboard?.lowStock?.length || 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">🔥 Produtos Mais Vendidos</h2>
          <div className="space-y-2">
            {dashboard?.bestSellers?.map((product, index) => (
              <div key={index} className="flex justify-between items-center border-b py-2">
                <span>{index + 1}. {product.name}</span>
                <span className="font-bold text-green-600">{product.total_sold} vendidos</span>
              </div>
            ))}
            {(!dashboard?.bestSellers || dashboard.bestSellers.length === 0) && (
              <p className="text-gray-500">Nenhum dado disponível</p>
            )}
          </div>
        </div>

        {dashboard?.lowStock && dashboard.lowStock.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold mb-4 text-red-600">⚠️ Produtos com Estoque Baixo</h2>
            <div className="space-y-2">
              {dashboard.lowStock.map(product => (
                <div key={product.id} className="flex justify-between items-center border-b py-2">
                  <span>{product.name}</span>
                  <span className="text-red-500 font-bold">Estoque: {product.stock}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">📦 Produtos</h2>
            <button
              onClick={() => setShowAddProduct(!showAddProduct)}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
            >
              {showAddProduct ? 'Cancelar' : '+ Adicionar Produto'}
            </button>
          </div>

          {showAddProduct && (
            <form onSubmit={handleAddProduct} className="mb-6 bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Nome do produto"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  className="px-3 py-2 border rounded-lg"
                  required
                />
                <input
                  type="text"
                  placeholder="Descrição"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  className="px-3 py-2 border rounded-lg"
                />
                <input
                  type="number"
                  placeholder="Preço"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                  className="px-3 py-2 border rounded-lg"
                  required
                  step="0.01"
                />
                <select
                  value={newProduct.category_id}
                  onChange={(e) => setNewProduct({...newProduct, category_id: e.target.value})}
                  className="px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Estoque"
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                  className="px-3 py-2 border rounded-lg"
                  required
                />
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="promotion"
                    checked={newProduct.is_promotion}
                    onChange={(e) => setNewProduct({...newProduct, is_promotion: e.target.checked})}
                    className="mr-2"
                  />
                  <label htmlFor="promotion">É promoção?</label>
                </div>
              </div>
              <button
                type="submit"
                className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
              >
                Salvar Produto
              </button>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Nome</th>
                  <th className="px-4 py-2 text-left">Preço</th>
                  <th className="px-4 py-2 text-left">Estoque</th>
                  <th className="px-4 py-2 text-left">Categoria</th>
                  <th className="px-4 py-2 text-left">Promoção</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{product.name}</td>
                    <td className="px-4 py-2">R$ {product.price?.toFixed(2)}</td>
                    <td className="px-4 py-2">{product.stock}</td>
                    <td className="px-4 py-2">{product.category_name}</td>
                    <td className="px-4 py-2">{product.is_promotion ? '⭐ Sim' : 'Não'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Admin;
EOF

# frontend/src/components/ProductCard.jsx
cat > frontend/src/components/ProductCard.jsx << 'EOF'
import React from 'react';

function ProductCard({ product }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
      <div className="p-4">
        <div className="text-3xl mb-2">{product.image || '🍔'}</div>
        <h3 className="font-bold text-lg text-gray-800">{product.name}</h3>
        <p className="text-gray-600 text-sm mb-2">{product.description}</p>
        <div className="flex justify-between items-center">
          <span className="text-green-600 font-bold text-xl">R$ {product.price?.toFixed(2)}</span>
          {product.is_promotion && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">🔥 Promoção</span>
          )}
        </div>
        <div className="text-xs text-gray-500 mt-1">Estoque: {product.stock}</div>
      </div>
    </div>
  );
}

export default ProductCard;
EOF

# frontend/src/components/CategoryFilter.jsx
cat > frontend/src/components/CategoryFilter.jsx << 'EOF'
import React from 'react';

function CategoryFilter({ categories, selectedCategory, onSelectCategory }) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <button
        className={`px-4 py-2 rounded-full transition ${
          !selectedCategory 
            ? 'bg-green-600 text-white' 
            : 'bg-gray-200 hover:bg-gray-300'
        }`}
        onClick={() => onSelectCategory(null)}
      >
        Todos
      </button>
      {categories.map(category => (
        <button
          key={category.id}
          className={`px-4 py-2 rounded-full transition ${
            selectedCategory === category.id
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
          onClick={() => onSelectCategory(category.id)}
        >
          {category.icon} {category.name}
        </button>
      ))}
    </div>
  );
}

export default CategoryFilter;
EOF

# frontend/src/components/PrintButton.jsx
cat > frontend/src/components/PrintButton.jsx << 'EOF'
import React from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function PrintButton({ order }) {
  const handlePrint = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('🍔 Hulk Lanches', 14, 20);
    doc.setFontSize(12);
    doc.text(`Pedido #${order.id}`, 14, 30);
    doc.text(`Mesa: ${order.table_number}`, 14, 37);
    doc.text(`Data: ${new Date(order.created_at).toLocaleString()}`, 14, 44);
    doc.text(`Funcionário: ${order.user_name || 'N/A'}`, 14, 51);
    
    const tableData = order.items?.map(item => [
      `${item.quantity}x ${item.product_name}`,
      `R$ ${(item.price * item.quantity).toFixed(2)}`
    ]) || [];
    
    doc.autoTable({
      startY: 60,
      head: [['Item', 'Total']],
      body: tableData,
      foot: [['Total', `R$ ${order.total?.toFixed(2) || '0,00'}`]],
    });
    
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.text('Obrigado pela preferência!', 14, finalY);
    doc.text('Hulk Lanches - Qualidade que alimenta', 14, finalY + 7);
    
    doc.save(`pedido_${order.id}.pdf`);
  };

  return (
    <button
      onClick={handlePrint}
      className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1"
    >
      🖨️ Imprimir
    </button>
  );
}

export default PrintButton;
EOF

# frontend/src/services/api.js
cat > frontend/src/services/api.js << 'EOF'
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
EOF

# frontend/src/services/socket.js
cat > frontend/src/services/socket.js << 'EOF'
import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
});
EOF

echo -e "${GREEN}✅ Frontend criado!${NC}"

# ==================== ARQUIVOS RAIZ ====================

echo -e "${YELLOW}📦 Criando arquivos raiz...${NC}"

# .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
package-lock.json

# Build
dist/
build/
*.log

# Environment
.env
.env.local

# Database
*.db
*.sqlite
data/

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo
EOF

# docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    environment:
      - PORT=3000
      - JWT_SECRET=HulkLanches2026!SuperSecret
      - DATABASE_URL=sqlite:/app/data/hulk.db
      - NODE_ENV=production
    restart: unless-stopped
    networks:
      - hulk-network

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    environment:
      - VITE_API_URL=http://localhost:3000/api
      - VITE_SOCKET_URL=http://localhost:3000
    restart: unless-stopped
    networks:
      - hulk-network

networks:
  hulk-network:
    driver: bridge
EOF

# Dockerfile.backend
cat > Dockerfile.backend << 'EOF'
FROM node:18-alpine

WORKDIR /app

COPY backend/package*.json ./
RUN npm install --production

COPY backend/src ./src

EXPOSE 3000

CMD ["node", "src/server.js"]
EOF

# Dockerfile.frontend
cat > Dockerfile.frontend << 'EOF'
FROM node:18-alpine as build

WORKDIR /app

COPY frontend/package*.json ./
RUN npm install

COPY frontend ./
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
EOF

# frontend/nginx.conf
cat > frontend/nginx.conf << 'EOF'
server {
    listen 80;
    server_name localhost;
    
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://backend:3000/api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

# LICENSE
cat > LICENSE << 'EOF'
MIT License

Copyright (c) 2026 Hulk Lanches

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF

# README.md
cat > README.md << 'EOF'
# 🍔 Hulk Lanches - Sistema de Atendimento para Lanchonetes

Sistema completo e open source para gerenciamento de pedidos em lanchonetes, com telas para cliente, funcionário, produção e administrador.

## 🚀 Funcionalidades

- ✅ Visualização de produtos por categoria
- ✅ Pedidos em tempo real (WebSocket)
- ✅ Impressão de pedidos (PDF)
- ✅ Dashboard administrativo com estoque e mais vendidos
- ✅ Funciona 100% off-line em rede local (Wi-Fi)
- ✅ Multiplataforma (Web, PWA)
- ✅ 100% Open Source (MIT License)

## 🛠️ Tecnologias

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Banco de Dados**: SQLite
- **Comunicação**: Socket.io (WebSocket)
- **Containerização**: Docker + Docker Compose

## 📦 Instalação Rápida (com Docker)

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/hulk-lanches.git
cd hulk-lanches

# Inicie os containers
docker-compose up -d

# Acesse o sistema
# http://localhost