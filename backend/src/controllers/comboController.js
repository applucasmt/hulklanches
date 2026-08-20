import { Combo } from '../models/Combo.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function saveImage(file) {
    const uploadDir = path.join(process.cwd(), 'uploads', 'combos');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    const uniqueName = Date.now() + "-" + file.originalname;
    const filePath = path.join(uploadDir, uniqueName);
    fs.writeFileSync(filePath, file.buffer);
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    return baseUrl + "/uploads/combos/" + uniqueName;
}

export async function getCombos(req, res) {
    try {
        const combos = await Combo.findAll();
        res.json(combos);
    } catch (error) {
        console.error('❌ Erro ao listar combos:', error);
        res.status(500).json({ error: error.message });
    }
}

export async function getCombo(req, res) {
    try {
        const combo = await Combo.findById(req.params.id);
        if (!combo) {
            return res.status(404).json({ error: 'Combo não encontrado' });
        }
        res.json(combo);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function createCombo(req, res) {
    try {
        const { name, description, price, is_visible, items } = req.body;
        let image_url = null;
        if (req.file) {
            image_url = saveImage(req.file);
        }
        let parsedItems = items;
        if (typeof items === 'string') {
            try { parsedItems = JSON.parse(items); } catch (e) { parsedItems = []; }
        }
        const combo = await Combo.create({
            name, description, price: parseFloat(price), image_url,
            is_visible: is_visible === 'true' || is_visible === true,
            items: parsedItems || []
        });
        res.status(201).json(combo);
    } catch (error) {
        console.error('❌ Erro ao criar combo:', error);
        res.status(500).json({ error: error.message });
    }
}

export async function updateCombo(req, res) {
    try {
        const { name, description, price, is_visible, items } = req.body;
        const existingCombo = await Combo.findById(req.params.id);
        if (!existingCombo) {
            return res.status(404).json({ error: 'Combo não encontrado' });
        }
        let image_url = existingCombo.image_url;
        if (req.file) {
            if (image_url) {
                const oldPath = path.join(process.cwd(), image_url);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            image_url = saveImage(req.file);
        }
        let parsedItems = items;
        if (typeof items === 'string') {
            try { parsedItems = JSON.parse(items); } catch (e) { parsedItems = []; }
        }
        const combo = await Combo.update(req.params.id, {
            name, description, price: parseFloat(price), image_url,
            is_visible: is_visible === 'true' || is_visible === true,
            items: parsedItems || []
        });
        res.json(combo);
    } catch (error) {
        console.error('❌ Erro ao atualizar combo:', error);
        res.status(500).json({ error: error.message });
    }
}

export async function deleteCombo(req, res) {
    try {
        const combo = await Combo.findById(req.params.id);
        if (!combo) {
            return res.status(404).json({ error: 'Combo não encontrado' });
        }
        if (combo.image_url) {
            const filePath = path.join(process.cwd(), combo.image_url);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        await Combo.delete(req.params.id);
        res.status(204).send();
    } catch (error) {
        console.error('❌ Erro ao excluir combo:', error);
        res.status(500).json({ error: error.message });
    }
}
