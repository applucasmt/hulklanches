import { Product } from "../models/Product.js";
import fsPromises from "fs/promises";
import fs from "fs";
import path from "path";

async function saveImage(file) {
    const uploadDir = path.join(process.cwd(), "uploads", "products");
    
    if (!fs.existsSync(uploadDir)) {
        await fsPromises.mkdir(uploadDir, { recursive: true });
    }
    
    const uniqueName = Date.now() + "-" + file.originalname.replace(/\s/g, '_');
    const filePath = path.join(uploadDir, uniqueName);
    
    await fsPromises.writeFile(filePath, file.buffer);
    return "/uploads/products/" + uniqueName;
}

const parsePrice = (value) => {
    if (value === null || value === undefined || value === "") return NaN;
    const cleaned = String(value).replace(/\s/g, "").replace(",", ".");
    return parseFloat(cleaned);
};

export async function getProducts(req, res) {
    try {
        const { category, promotion } = req.query;
        let products;
        if (category) {
            products = await Product.findByCategory(category);
        } else if (promotion === "true") {
            products = await Product.findPromotions();
        } else {
            products = await Product.findAll();
        }
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function getProduct(req, res) {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ error: "Produto não encontrado" });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function createProduct(req, res) {
    try {
        // Se o multer estiver funcionando na rota, o req.body terá os dados aqui.
        const { name, description, price, category_id, stock, is_visible, is_promotion, promotion_price } = req.body;

        if (price === undefined || price === null || price === "") {
            return res.status(400).json({ error: "Preço não enviado no corpo da requisição. Verifique o envio do FormData." });
        }

        const parsedPrice = parsePrice(price);
        const parsedCategoryId = parseInt(category_id);
        const parsedStock = parseInt(stock) || 0;

        if (isNaN(parsedPrice) || parsedPrice <= 0) {
            return res.status(400).json({ error: "Preço inválido. Recebido: " + price });
        }

        let images = [];
        if (req.files && req.files.length > 0) {
            images = await Promise.all(req.files.map(file => saveImage(file)));
        }

        const productData = {
            name: name || "",
            description: description || "",
            price: parsedPrice,
            category_id: parsedCategoryId,
            images: JSON.stringify(images),
            stock: parsedStock,
            is_visible: is_visible === "true" || is_visible === true,
            is_promotion: is_promotion === "true" || is_promotion === true,
            promotion_price: promotion_price ? parsePrice(promotion_price) : null
        };

        const product = await Product.create(productData);
        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function updateProduct(req, res) {
    try {
        const { name, description, price, category_id, stock, is_visible, is_promotion, promotion_price } = req.body;

        const existingProduct = await Product.findById(req.params.id);
        if (!existingProduct) {
            return res.status(404).json({ error: "Produto não encontrado" });
        }

        let images = [];
        if (existingProduct.images) {
            try {
                images = typeof existingProduct.images === 'string' ? JSON.parse(existingProduct.images) : existingProduct.images;
            } catch (e) {
                images = [];
            }
        }

        if (req.files && req.files.length > 0) {
            const newImages = await Promise.all(req.files.map(file => saveImage(file)));
            if (req.body.replace_images === "true") {
                images = newImages;
            } else {
                images = images.concat(newImages);
            }
        }

        const productData = {
            name,
            description,
            price: price !== undefined ? parsePrice(price) : undefined,
            category_id: category_id ? parseInt(category_id) : undefined,
            images: JSON.stringify(images),
            stock: stock !== undefined ? parseInt(stock) : undefined,
            is_visible: is_visible !== undefined ? (is_visible === "true" || is_visible === true) : undefined,
            is_promotion: is_promotion !== undefined ? (is_promotion === "true" || is_promotion === true) : undefined,
            promotion_price: promotion_price ? parsePrice(promotion_price) : null
        };

        const product = await Product.update(req.params.id, productData);
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function deleteProduct(req, res) {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ error: "Produto não encontrado" });
        }

        let images = [];
        if (product.images) {
            try {
                images = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
            } catch (e) {
                images = [];
            }
        }

        if (Array.isArray(images)) {
            images.forEach(function(imageUrl) {
                const filePath = path.join(process.cwd(), imageUrl);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            });
        }

        await Product.delete(req.params.id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}