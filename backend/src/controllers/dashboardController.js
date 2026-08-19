import { Order } from '../models/Order.js';
import { getDatabase } from '../config/database.js';

export async function getDashboard(req, res) {
    try {
        const db = await getDatabase();

        const todayOrders = await db.query(`
            SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total
            FROM orders
            WHERE DATE(created_at) = CURRENT_DATE AND status = 'entregue'
        `);

        const bestSellers = await db.query(`
            SELECT p.name, SUM(oi.quantity) as total_sold
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            JOIN orders o ON oi.order_id = o.id
            WHERE o.status = 'entregue'
            GROUP BY p.id
            ORDER BY total_sold DESC
            LIMIT 5
        `);

        const lowStock = await db.query(`
            SELECT * FROM products WHERE stock < 5 AND is_visible = true ORDER BY stock ASC
        `);

        const totalProducts = await db.query('SELECT COUNT(*) as count FROM products WHERE is_visible = true');
        const totalCategories = await db.query('SELECT COUNT(*) as count FROM categories WHERE is_visible = true');

        // Pedidos pendentes (para produção)
        const pendingOrders = await db.query(`
            SELECT COUNT(*) as count FROM orders WHERE status IN ('pendente', 'em_preparo')
        `);

        // Receita do mês
        const monthlyRevenue = await db.query(`
            SELECT COALESCE(SUM(total), 0) as total
            FROM orders
            WHERE DATE(created_at) >= DATE_TRUNC('month', CURRENT_DATE) AND status = 'entregue'
        `);

        res.json({
            todayOrders: todayOrders.rows[0],
            bestSellers: bestSellers.rows,
            lowStock: lowStock.rows,
            totalProducts: parseInt(totalProducts.rows[0].count),
            totalCategories: parseInt(totalCategories.rows[0].count),
            pendingOrders: parseInt(pendingOrders.rows[0].count),
            monthlyRevenue: parseFloat(monthlyRevenue.rows[0].total)
        });
    } catch (error) {
        console.error('❌ Erro ao carregar dashboard:', error);
        res.status(500).json({ error: error.message });
    }
}