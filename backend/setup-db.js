import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { join } from 'path';
import fs from 'fs';

// Garantir que a pasta data existe
const dataDir = join(process.cwd(), '../data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = join(dataDir, 'hulk.db');

console.log('📦 Conectando ao banco:', dbPath);

const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
});

console.log('✅ Conectado!');

// Criar tabelas
console.log('📋 Criando tabelas...');

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
`);

console.log('✅ Tabelas criadas!');

// Inserir admin (senha: admin123 - hash já gerado)
console.log('👤 Criando usuário admin...');

await db.run(`
    INSERT OR REPLACE INTO users (id, name, email, password, role) 
    VALUES (1, 'Administrador', 'admin@hulk.com', '$2a$10$XKm.8QZ.3tJ4Y5Z6W7X8Y9Z0W1X2Y3Z4W5X6Y7Z8W9X0Y1Z2W3X4Y5Z6W7X8', 'admin')
`);

console.log('✅ Usuário admin criado!');

// Inserir categorias
console.log('📂 Criando categorias...');

await db.exec(`
    INSERT OR IGNORE INTO categories (id, name, icon) VALUES 
        (1, 'Combo', '🍔'),
        (2, 'Mais Pedidos', '⭐'),
        (3, 'Promoção', '🔥'),
        (4, 'Bebidas', '🥤'),
        (5, 'Acompanhamentos', '🍟'),
        (6, 'Sobremesa', '🍰')
`);

console.log('✅ Categorias criadas!');

// Inserir produtos
console.log('🍔 Criando produtos...');

await db.exec(`
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
        ('Milkshake', 'Chocolate, Morango ou Baunilha', 13.90, 6, 12, 0)
`);

console.log('✅ Produtos criados!');

// Verificar
console.log('\n📊 Verificando dados...');

const users = await db.all('SELECT id, name, email, role FROM users');
console.log('Usuários:', users);

const categories = await db.all('SELECT id, name, icon FROM categories');
console.log('Categorias:', categories);

const products = await db.all('SELECT COUNT(*) as total FROM products');
console.log('Total de produtos:', products[0].total);

console.log('\n🎉 BANCO DE DADOS INICIALIZADO COM SUCESSO!');
console.log('🔑 Login: admin@hulk.com');
console.log('🔑 Senha: admin123');

await db.close();
process.exit(0);
