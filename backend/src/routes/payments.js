import express from 'express';
import { 
    createPayment, 
    getPaymentByOrder, 
    updatePaymentStatus,
    getPaymentMethods
} from '../controllers/paymentController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/', createPayment);
router.get('/methods', getPaymentMethods);
router.get('/order/:order_id', authenticate, getPaymentByOrder);
router.put('/:id', authenticate, authorize('admin'), updatePaymentStatus);

export default router;
