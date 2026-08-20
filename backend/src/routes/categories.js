import express from 'express';
import { 
    getCategories, 
    getCategory, 
    createCategory, 
    updateCategory, 
    deleteCategory 
} from '../controllers/categoryController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getCategories);
router.get('/:id', getCategory);

router.post('/', authenticate, authorize('admin'), createCategory);
router.put('/:id', authenticate, authorize('admin'), updateCategory);
router.delete('/:id', authenticate, authorize('admin'), deleteCategory);

export default router;
