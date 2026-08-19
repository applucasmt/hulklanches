import express from 'express';
import multer from 'multer';
import { 
  getProducts, 
  getProduct, 
  createProduct, 
  updateProduct, 
  deleteProduct 
} from '../controllers/productController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

// ============ ROTAS PÚBLICAS (SEM AUTENTICAÇÃO) ============
// O Cliente (cardápio) precisa acessar sem login
router.get('/', getProducts);
router.get('/:id', getProduct);

// ============ ROTAS ADMINISTRATIVAS (COM AUTENTICAÇÃO) ============
router.post('/', authenticate, authorize('admin'), upload.any(), createProduct);
router.put('/:id', authenticate, authorize('admin'), upload.any(), updateProduct);
router.delete('/:id', authenticate, authorize('admin'), deleteProduct);

export default router;