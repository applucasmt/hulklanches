import express from 'express';
import { 
    getSalesReport, 
    getStockReport, 
    getPaymentReport 
} from '../controllers/reportController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/sales', authenticate, authorize('admin'), getSalesReport);
router.get('/stock', authenticate, authorize('admin'), getStockReport);
router.get('/payments', authenticate, authorize('admin'), getPaymentReport);

export default router;