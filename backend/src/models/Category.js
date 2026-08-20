import { getDatabase } from '../config/database.js';

export class Category {
    static async findAll() {
        const db = await getDatabase();
        const result = await db.query('SELECT * FROM categories ORDER BY name');
        return result.rows;
    }

    static async findById(id) {
        const db = await getDatabase();
        const result = await db.query('SELECT * FROM categories WHERE id = $1', [id]);
        return result.rows[0] || null;
    }

    static async create({ name, icon }) {
        const db = await getDatabase();
        const result = await db.query(
            'INSERT INTO categories (name, icon) VALUES ($1, $2) RETURNING *',
            [name, icon]
        );
        return result.rows[0];
    }

    static async update(id, { name, icon }) {
        const db = await getDatabase();
        const result = await db.query(
            'UPDATE categories SET name = $1, icon = $2 WHERE id = $3 RETURNING *',
            [name, icon, id]
        );
        return result.rows[0] || null;
    }

    static async delete(id) {
        const db = await getDatabase();
        await db.query('DELETE FROM categories WHERE id = $1', [id]);
    }
}
