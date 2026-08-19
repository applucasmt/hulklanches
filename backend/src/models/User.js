import { getDatabase } from '../config/database.js';
import bcrypt from 'bcryptjs';

export class User {
    static async create({ name, email, password, role }) {
        const db = await getDatabase();
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await db.query(
            'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
            [name, email, hashedPassword, role]
        );
        return result.rows[0];
    }

    static async findByEmail(email) {
        const db = await getDatabase();
        try {
            const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
            return result.rows[0] || null;
        } catch (error) {
            console.error('❌ Erro ao buscar usuário:', error);
            throw error;
        }
    }

    static async findById(id) {
        const db = await getDatabase();
        const result = await db.query('SELECT id, name, email, role, created_at FROM users WHERE id = $1', [id]);
        return result.rows[0] || null;
    }

    static async comparePassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }
}