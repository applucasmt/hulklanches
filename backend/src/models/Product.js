import { getDatabase } from '../config/database.js';

export class Product {
    static async findAll() {
        const db = await getDatabase();
        const result = await db.query(`
            SELECT p.*, c.name as category_name, c.icon as category_icon
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            ORDER BY p.name
        `);
        return result.rows;
    }

    static async findByCategory(categoryId) {
        const db = await getDatabase();
        const result = await db.query(`
            SELECT p.*, c.name as category_name 
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.category_id = $1 AND p.is_visible = true
            ORDER BY p.display_order, p.name
        `, [categoryId]);
        return result.rows;
    }

    static async findPromotions() {
        const db = await getDatabase();
        const result = await db.query(`
            SELECT p.*, c.name as category_name 
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.is_promotion = true AND p.is_visible = true
            ORDER BY p.promotion_price
        `);
        return result.rows;
    }

    static async findById(id) {
        const db = await getDatabase();
        const result = await db.query(`
            SELECT p.*, c.name as category_name 
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = $1
        `, [id]);
        return result.rows[0] || null;
    }

    static async create(data) {
        const db = await getDatabase();
        const {
            name, description, price, category_id,
            images = '[]', video_url, stock = 0,
            is_visible = true, is_promotion = false,
            promotion_price = null, display_order = 0
        } = data;

        const result = await db.query(
            `INSERT INTO products (
                name, description, price, category_id,
                images, video_url, stock, is_visible,
                is_promotion, promotion_price, display_order
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *`,
            [name, description, price, category_id,
             images, video_url || null, stock, is_visible,
             is_promotion, promotion_price, display_order]
        );
        return result.rows[0];
    }

    static async update(id, data) {
        const db = await getDatabase();
        const fields = [];
        const values = [];
        let paramCount = 1;

        const allowedFields = [
            'name', 'description', 'price', 'category_id',
            'images', 'video_url', 'stock', 'is_visible',
            'is_promotion', 'promotion_price', 'display_order'
        ];

        Object.entries(data).forEach(([key, value]) => {
            if (allowedFields.includes(key) && value !== undefined) {
                fields.push(`${key} = $${paramCount}`);
                values.push(value);
                paramCount++;
            }
        });

        if (fields.length === 0) {
            return await this.findById(id);
        }

        values.push(id);
        const result = await db.query(
            `UPDATE products SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $${paramCount} RETURNING *`,
            values
        );
        return result.rows[0] || null;
    }

    static async delete(id) {
        const db = await getDatabase();
        await db.query('DELETE FROM products WHERE id = $1', [id]);
    }

    static async updateStock(id, quantity) {
        const db = await getDatabase();
        const result = await db.query(
            'UPDATE products SET stock = stock - $1 WHERE id = $2 RETURNING stock',
            [quantity, id]
        );
        return result.rows[0]?.stock || 0;
    }

    static async getLowStock(threshold = 5) {
        const db = await getDatabase();
        const result = await db.query(
            'SELECT * FROM products WHERE stock < $1 AND is_visible = true ORDER BY stock ASC',
            [threshold]
        );
        return result.rows;
    }
}