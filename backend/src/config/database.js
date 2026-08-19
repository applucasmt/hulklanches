import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

console.log('📦 Conectando ao PostgreSQL...');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'hulk_lanches',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

pool.on('connect', () => {
    console.log('✅ Conectado ao PostgreSQL!');
});

pool.on('error', (err) => {
    console.error('❌ Erro no PostgreSQL:', err.message);
});

export async function getDatabase() {
    return pool;
}

export async function query(text, params) {
    try {
        const start = Date.now();
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('📊 Query:', { text: text.substring(0, 100), duration, rows: res.rowCount });
        return res;
    } catch (error) {
        console.error('❌ Erro na query:', error);
        throw error;
    }
}

export async function getClient() {
    return await pool.connect();
}

export default pool;
