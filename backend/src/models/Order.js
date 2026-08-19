import { getDatabase } from '../config/database.js';

export class Order {
    static async create({ table_number, user_id, items, customer_name = null, notes = '' }) {
        const db = await getDatabase();
        let total = 0;

        console.log('📦 Order.create recebendo:', { table_number, user_id, items, customer_name });

        for (const item of items) {
            const productResult = await db.query('SELECT price FROM products WHERE id = $1', [item.product_id]);
            if (productResult.rows.length > 0) {
                total += parseFloat(productResult.rows[0].price) * item.quantity;
            }
        }

        console.log('💰 Total calculado:', total);

        const result = await db.query(
            `INSERT INTO orders (table_number, user_id, customer_name, total, notes, status) 
             VALUES ($1, $2, $3, $4, $5, 'pendente') RETURNING *`,
            [table_number, user_id, customer_name || 'Cliente', total, notes || '']
        );

        const order = result.rows[0];
        console.log('📦 Pedido criado:', order);

        for (const item of items) {
            const productResult = await db.query('SELECT name, price FROM products WHERE id = $1', [item.product_id]);
            if (productResult.rows.length > 0) {
                const prod = productResult.rows[0];
                const unitPrice = parseFloat(prod.price);
                const totalPrice = unitPrice * item.quantity;
                
                await db.query(
                    `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price) 
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [order.id, item.product_id, prod.name, item.quantity, unitPrice, totalPrice]
                );
            }
        }

        return order;
    }

    static async findAll() {
        const db = await getDatabase();
        const result = await db.query(`
            SELECT o.*, u.name as user_name 
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
        `);
        return result.rows;
    }

    // CORRIGIDO: NÃO inclui pedidos entregues
    static async findPending() {
        const db = await getDatabase();
        const result = await db.query(`
            SELECT o.*, u.name as user_name 
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            WHERE o.status IN ('pendente', 'em_preparo', 'pronto')
            ORDER BY o.created_at ASC
        `);
        return result.rows;
    }

    static async findById(id) {
        const db = await getDatabase();
        const result = await db.query('SELECT * FROM orders WHERE id = $1', [id]);
        const order = result.rows[0];

        if (order) {
            const itemsResult = await db.query(`
                SELECT oi.*, p.name as product_name 
                FROM order_items oi
                LEFT JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = $1
            `, [id]);
            order.items = itemsResult.rows;
        }

        return order || null;
    }

    static async updateStatus(id, status) {
        const db = await getDatabase();
        const result = await db.query(
            'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [status, id]
        );
        return result.rows[0] || null;
    }
}