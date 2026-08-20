import { getDatabase } from '../config/database.js';

export class Combo {
    static async findAll() {
        const db = await getDatabase();
        const result = await db.query(`
            SELECT c.*, COUNT(ci.id) as items_count,
                   json_agg(DISTINCT ci.*) FILTER (WHERE ci.id IS NOT NULL) as items
            FROM combos c
            LEFT JOIN combo_items ci ON c.id = ci.combo_id
            GROUP BY c.id
            ORDER BY c.name
        `);
        return result.rows;
    }

    static async findById(id) {
        const db = await getDatabase();
        const result = await db.query(`
            SELECT c.*, json_agg(DISTINCT ci.*) FILTER (WHERE ci.id IS NOT NULL) as items
            FROM combos c
            LEFT JOIN combo_items ci ON c.id = ci.combo_id
            WHERE c.id = $1
            GROUP BY c.id
        `, [id]);
        return result.rows[0] || null;
    }

    static async create({ name, description, price, image_url, is_visible = true, items = [] }) {
        const db = await getDatabase();
        await db.query('BEGIN');
        try {
            const result = await db.query(
                `INSERT INTO combos (name, description, price, image_url, is_visible) 
                 VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                [name, description, price, image_url, is_visible]
            );
            const combo = result.rows[0];
            for (const item of items) {
                await db.query(
                    `INSERT INTO combo_items (combo_id, product_id, quantity, discount_percent) 
                     VALUES ($1, $2, $3, $4)`,
                    [combo.id, item.product_id, item.quantity || 1, item.discount_percent || 0]
                );
            }
            await db.query('COMMIT');
            return combo;
        } catch (error) {
            await db.query('ROLLBACK');
            throw error;
        }
    }

    static async update(id, { name, description, price, image_url, is_visible, items = [] }) {
        const db = await getDatabase();
        await db.query('BEGIN');
        try {
            const result = await db.query(
                `UPDATE combos SET name = $1, description = $2, price = $3, image_url = $4, is_visible = $5, updated_at = CURRENT_TIMESTAMP
                 WHERE id = $6 RETURNING *`,
                [name, description, price, image_url, is_visible, id]
            );
            const combo = result.rows[0];
            await db.query('DELETE FROM combo_items WHERE combo_id = $1', [id]);
            for (const item of items) {
                await db.query(
                    `INSERT INTO combo_items (combo_id, product_id, quantity, discount_percent) 
                     VALUES ($1, $2, $3, $4)`,
                    [combo.id, item.product_id, item.quantity || 1, item.discount_percent || 0]
                );
            }
            await db.query('COMMIT');
            return combo;
        } catch (error) {
            await db.query('ROLLBACK');
            throw error;
        }
    }

    static async delete(id) {
        const db = await getDatabase();
        await db.query('DELETE FROM combos WHERE id = $1', [id]);
    }
}
