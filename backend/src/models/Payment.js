import { getDatabase } from '../config/database.js';

export class Payment {
    static async create({ order_id, method, amount, status = 'concluido', transaction_id = null }) {
        const db = await getDatabase();
        console.log('💳 Payment.create:', { order_id, method, amount, status });
        
        const result = await db.query(
            `INSERT INTO payments (order_id, method, amount, status, transaction_id) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [order_id, method, amount, status, transaction_id]
        );
        return result.rows[0];
    }

    static async findByOrder(orderId) {
        const db = await getDatabase();
        const result = await db.query('SELECT * FROM payments WHERE order_id = $1', [orderId]);
        return result.rows[0] || null;
    }

    static async updateStatus(id, status, transaction_id = null) {
        const db = await getDatabase();
        const result = await db.query(
            `UPDATE payments SET status = $1, transaction_id = COALESCE($2, transaction_id), updated_at = CURRENT_TIMESTAMP 
             WHERE id = $3 RETURNING *`,
            [status, transaction_id, id]
        );
        return result.rows[0] || null;
    }

    static async getPaymentMethods() {
        return ['Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'PIX', 'Vale Refeição'];
    }
}