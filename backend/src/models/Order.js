import { getDatabase } from '../config/database.js';

export class Order {
    static async create({ table_number, user_id, items, customer_name = null, notes = '' }) {
        const db = await getDatabase();
        let total = 0;

        for (const item of items) {
            const productResult = await db.query('SELECT price FROM products WHERE id = $1', [item.product_id]);
            if (productResult.rows.length > 0) {
                total += parseFloat(productResult.rows[0].price) * item.quantity;
            }
        }

        const result = await db.query(
            `INSERT INTO orders (table_number, user_id, customer_name, total, notes, status) 
             VALUES ($1, $2, $3, $4, $5, 'pendente') RETURNING *`,
            [table_number, user_id, customer_name || 'Cliente', total, notes || '']
        );

        const order = result.rows[0];

        for (const item of items) {
            const productResult = await db.query('SELECT name, price FROM products WHERE id = $1', [item
