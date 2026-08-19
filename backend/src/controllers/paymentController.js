import { Payment } from '../models/Payment.js';
import { Order } from '../models/Order.js';

export async function createPayment(req, res) {
    try {
        const { order_id, method, amount } = req.body;
        
        console.log('💳 Criando pagamento:', { order_id, method, amount });
        
        const order = await Order.findById(order_id);
        if (!order) {
            return res.status(404).json({ error: 'Pedido não encontrado' });
        }

        // REMOVER A VERIFICAÇÃO DE STATUS - Cliente pode pagar imediatamente
        // if (order.status !== 'pronto') {
        //     return res.status(400).json({ error: 'Pedido deve estar pronto para pagamento' });
        // }

        const payment = await Payment.create({
            order_id,
            method,
            amount: amount || order.total,
            status: 'concluido' // Já marcar como concluído
        });

        // Atualizar status do pedido para 'pago' (ou manter como 'pendente' para a produção)
        // Vamos manter como 'pendente' para que a produção veja, mas marcar o pagamento como concluído
        // await Order.updateStatus(order_id, 'pago');

        console.log('✅ Pagamento criado:', payment);
        res.status(201).json(payment);
    } catch (error) {
        console.error('❌ Erro ao criar pagamento:', error);
        res.status(500).json({ error: error.message });
    }
}

export async function getPaymentByOrder(req, res) {
    try {
        const { order_id } = req.params;
        const payment = await Payment.findByOrder(order_id);
        res.json(payment || {});
    } catch (error) {
        console.error('❌ Erro ao buscar pagamento:', error);
        res.status(500).json({ error: error.message });
    }
}

export async function updatePaymentStatus(req, res) {
    try {
        const { id } = req.params;
        const { status, transaction_id } = req.body;
        const payment = await Payment.updateStatus(id, status, transaction_id);
        res.json(payment);
    } catch (error) {
        console.error('❌ Erro ao atualizar pagamento:', error);
        res.status(500).json({ error: error.message });
    }
}

export async function getPaymentMethods(req, res) {
    try {
        const methods = await Payment.getPaymentMethods();
        res.json(methods);
    } catch (error) {
        console.error('❌ Erro ao buscar métodos de pagamento:', error);
        res.status(500).json({ error: error.message });
    }
}