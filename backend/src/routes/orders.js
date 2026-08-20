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

router.post('/', createOrder);
router.get('/', authenticate, authorize('admin', 'producao'), getOrders);
router.get('/pending', authenticate, authorize('producao', 'admin', 'funcionario'), getPendingOrders);
router.get('/:id', authenticate, getOrderDetails);
router.put('/:id/status', authenticate, authorize('funcionario', 'producao', 'admin'), updateOrderStatus);

export default router;
