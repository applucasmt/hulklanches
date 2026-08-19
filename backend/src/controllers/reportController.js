import { getDatabase } from '../config/database.js';

export async function getSalesReport(req, res) {
    try {
        const { start_date, end_date, period = 'day' } = req.query;
        const db = await getDatabase();

        let dateFilter = '';
        let groupBy = '';
        
        if (period === 'day') {
            dateFilter = `DATE(created_at) = CURRENT_DATE`;
            groupBy = `DATE(created_at)`;
        } else if (period === 'week') {
            dateFilter = `DATE(created_at) >= CURRENT_DATE - INTERVAL '7 days'`;
            groupBy = `DATE(created_at)`;
        } else if (period === 'month') {
            dateFilter = `DATE(created_at) >= CURRENT_DATE - INTERVAL '30 days'`;
            groupBy = `DATE(created_at)`;
        } else if (start_date && end_date) {
            dateFilter = `DATE(created_at) BETWEEN '${start_date}' AND '${end_date}'`;
            groupBy = `DATE(created_at)`;
        }

        const salesData = await db.query(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as total_orders,
                SUM(total) as total_sales,
                AVG(total) as average_ticket
            FROM orders
            WHERE status = 'entregue' AND ${dateFilter || '1=1'}
            GROUP BY ${groupBy || 'DATE(created_at)'}
            ORDER BY date DESC
        `);

        // Top produtos
        const topProducts = await db.query(`
            SELECT 
                p.name,
                SUM(oi.quantity) as total_sold,
                SUM(oi.total_price) as total_revenue
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            JOIN orders o ON oi.order_id = o.id
            WHERE o.status = 'entregue' AND ${dateFilter || '1=1'}
            GROUP BY p.id
            ORDER BY total_sold DESC
            LIMIT 10
        `);

        // Resumo do período
        const summary = await db.query(`
            SELECT 
                COUNT(*) as total_orders,
                SUM(total) as total_revenue,
                AVG(total) as average_ticket,
                COUNT(DISTINCT user_id) as unique_customers,
                MIN(created_at) as first_order,
                MAX(created_at) as last_order
            FROM orders
            WHERE status = 'entregue' AND ${dateFilter || '1=1'}
        `);

        res.json({
            sales: salesData.rows,
            topProducts: topProducts.rows,
            summary: summary.rows[0] || {},
            period: period,
            dateRange: { start: start_date, end: end_date }
        });
    } catch (error) {
        console.error('❌ Erro ao gerar relatório de vendas:', error);
        res.status(500).json({ error: error.message });
    }
}

export async function getStockReport(req, res) {
    try {
        const db = await getDatabase();

        const products = await db.query(`
            SELECT 
                p.*,
                c.name as category_name,
                CASE 
                    WHEN p.stock = 0 THEN 'Esgotado'
                    WHEN p.stock < 5 THEN 'Baixo'
                    WHEN p.stock < 15 THEN 'Médio'
                    ELSE 'Alto'
                END as stock_status
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            ORDER BY p.stock ASC
        `);

        const summary = await db.query(`
            SELECT 
                COUNT(*) as total_products,
                SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) as out_of_stock,
                SUM(CASE WHEN stock < 5 AND stock > 0 THEN 1 ELSE 0 END) as low_stock,
                SUM(CASE WHEN stock < 15 AND stock >= 5 THEN 1 ELSE 0 END) as medium_stock,
                SUM(CASE WHEN stock >= 15 THEN 1 ELSE 0 END) as high_stock,
                SUM(stock) as total_units
            FROM products
        `);

        res.json({
            products: products.rows,
            summary: summary.rows[0] || {}
        });
    } catch (error) {
        console.error('❌ Erro ao gerar relatório de estoque:', error);
        res.status(500).json({ error: error.message });
    }
}

export async function getPaymentReport(req, res) {
    try {
        const { start_date, end_date } = req.query;
        const db = await getDatabase();

        let dateFilter = '';
        if (start_date && end_date) {
            dateFilter = `AND o.created_at BETWEEN '${start_date}' AND '${end_date}'`;
        }

        const payments = await db.query(`
            SELECT 
                p.method,
                COUNT(*) as total_payments,
                SUM(p.amount) as total_amount,
                AVG(p.amount) as average_amount,
                COUNT(DISTINCT o.id) as total_orders
            FROM payments p
            JOIN orders o ON p.order_id = o.id
            WHERE o.status = 'entregue' ${dateFilter}
            GROUP BY p.method
            ORDER BY total_amount DESC
        `);

        const total = await db.query(`
            SELECT 
                SUM(p.amount) as total_revenue,
                COUNT(*) as total_payments
            FROM payments p
            JOIN orders o ON p.order_id = o.id
            WHERE o.status = 'entregue' ${dateFilter}
        `);

        res.json({
            methods: payments.rows,
            summary: total.rows[0] || {}
        });
    } catch (error) {
        console.error('❌ Erro ao gerar relatório de pagamentos:', error);
        res.status(500).json({ error: error.message });
    }
}