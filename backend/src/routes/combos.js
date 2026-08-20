import express from 'express';
import multer from 'multer';
import { 
    getCombos, 
    getCombo, 
    createCombo, 
    updateCombo, 
    deleteCombo,
    getComboItems
} from '../controllers/comboController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

router.get('/', getCombos);
router.get('/:id', getCombo);
router.get('/:id/items', getComboItems);

router.post('/', authenticate, authorize('admin'), upload.single('image'), createCombo);
router.put('/:id', authenticate, authorize('admin'), upload.single('image'), updateCombo);
router.delete('/:id', authenticate, authorize('admin'), deleteCombo);

export default router;
