import express from 'express';
import { 
    getCombos, 
    getCombo, 
    createCombo, 
    updateCombo, 
    deleteCombo,
    getComboItems
} from '../controllers/comboController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import multer from 'multer';

// Configurar multer com memoryStorage
const storage = multer.memoryStorage();

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(file.originalname.toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Tipo de arquivo não suportado'));
    }
});

const router = express.Router();

// Rotas públicas
router.get('/', getCombos);
router.get('/:id', getCombo);
router.get('/:id/items', getComboItems);

// Rotas administrativas
router.post('/', authenticate, authorize('admin'), upload.single('image'), createCombo);
router.put('/:id', authenticate, authorize('admin'), upload.single('image'), updateCombo);
router.delete('/:id', authenticate, authorize('admin'), deleteCombo);

export default router;