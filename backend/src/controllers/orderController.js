import { Order } from '../models/Order.js';
import { getDatabase } from '../config/database.js';

export async function createOrder(req, res) {
    try {
        console.log('📦 Body recebido:', req.body);
        
        const { table_number, items, customer_name, notes } = req.body;
        
        if (!table_number) {
            return res.status(400).json({ error: 'Número da mesa é obrigatório' });
        }
        
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Pedido deve ter pelo menos um item' });
        }

        for (const item of items) {
            if (!item.product_id || !item.quantity || item.quantity <= 0) {
                return res.status(400).json({ error: 'Item inválido. Verifique product_id e quantity' });
            }
        }

        const db = await getDatabase();
        const adminUser = await db.query('SELECT id FROM users WHERE role = $1 LIMIT 1', ['admin']);
        
        let userId = 1;
        if (adminUser.rows.length > 0) {
            userId = adminUser.rows[0].id;
        }

        const order = await Order.create({
            table_number: parseInt(table_number),
            user_id: userId,
            items,
            customer_name: customer_name || 'Cliente',
            notes: notes || ''
        });

        const io = req.app.get('io');
        if (io) {
            const fullOrder = await Order.findById(order.id);
            io.emit('new_order', fullOrder);
        }

        res.status(201).json(order);
    } catch (error) {
        console.error('❌ Erro ao criar pedido:', error);
        res.status(500).json({ error: error.message });
    }
}

export async function getOrders(req, res) {
    try {
        const orders = await Order.findAll();
        res.json(orders);
    } catch (error) {
        console.error('❌ Erro ao listar pedidos:', error);
        res.status(500).json({ error: error.message });
    }
}

export async function getPendingOrders(req, res) {
    try {
        const orders = await Order.findPending();
        res.json(orders);
    } catch (error) {
        console.error('❌ Erro ao listar pedidos pendentes:', error);
        res.status(500).json({ error: error.message });
    }
}

export async function getOrderDetails(req, res) {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ error: 'Pedido não encontrado' });
        }
        res.json(order);
    } catch (error) {
        console.error('❌ Erro ao buscar pedido:', error);
        res.status(500).json({ error: error.message });
    }
}

export async function updateOrderStatus(req, res) {
    try {
        const { status } = req.body;
        console.log(`🔄 Atualizando pedido ${req.params.id} para status: ${status}`);
        
        const order = await Order.updateStatus(req.params.id, status);

        if (!order) {
            return res.status(404).json({ error: 'Pedido não encontrado' });
        }

        const io = req.app.get('io');
        if (io) {
            const fullOrder = await Order.findById(order.id);
            io.emit('order_updated', fullOrder);
        }

        res.json(order);
    } catch (error) {
        console.error('❌ Erro ao atualizar status:', error);
        res.status(500).json({ error: error.message });
    }
}