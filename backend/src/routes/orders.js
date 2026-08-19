import express from 'express';
import { 
  createOrder, 
  getOrders, 
  getPendingOrders, 
  updateOrderStatus,
  getOrderDetails
} from '../controllers/orderController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// ============ ROTAS PÚBLICAS (SEM AUTENTICAÇÃO) ============
router.post('/', createOrder);

// ============ ROTAS COM AUTENTICAÇÃO ============
router.get('/', authenticate, authorize('admin', 'producao'), getOrders);
router.get('/pending', authenticate, authorize('producao', 'admin', 'funcionario'), getPendingOrders);
router.get('/:id', authenticate, getOrderDetails);

// ============ ROTA PARA ATUALIZAR STATUS ============
// Funcionário pode confirmar entrega (mudar para 'entregue')
// Produção pode mudar para 'em_preparo' e 'pronto'
// Admin pode fazer tudo
router.put('/:id/status', authenticate, authorize('funcionario', 'producao', 'admin'), updateOrderStatus);

export default router;