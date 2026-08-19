import { Category } from '../models/Category.js';

export async function getCategories(req, res) {
  try {
    const categories = await Category.findAll();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getCategory(req, res) {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function createCategory(req, res) {
  try {
    const category = await Category.create(req.body);
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function updateCategory(req, res) {
  try {
    const category = await Category.update(req.params.id, req.body);
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function deleteCategory(req, res) {
  try {
    await Category.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
