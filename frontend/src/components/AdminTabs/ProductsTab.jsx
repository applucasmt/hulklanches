import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

function ProductsTab() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [selectedImages, setSelectedImages] = useState([]);
    const [previewImages, setPreviewImages] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category_id: '',
        stock: '',
        is_visible: true,
        is_promotion: false,
        promotion_price: '',
        images: []
    });

    useEffect(() => {
        loadProducts();
        loadCategories();
    }, []);

    const loadProducts = async () => {
        setLoading(true);
        try {
            const response = await api.get('/products');
            setProducts(response.data);
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadCategories = async () => {
        try {
            const response = await api.get('/categories');
            setCategories(response.data);
        } catch (error) {
            console.error('Erro ao carregar categorias:', error);
        }
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setSelectedImages(prev => [...prev, ...files]);
        
        // Criar previews
        const newPreviews = files.map(file => URL.createObjectURL(file));
        setPreviewImages(prev => [...prev, ...newPreviews]);
    };

    const removeImage = (index) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
        setPreviewImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const formDataToSend = new FormData();
            
            // Adicionar campos de texto
            Object.keys(formData).forEach(key => {
                if (key !== 'images') {
                    formDataToSend.append(key, formData[key]);
                }
            });

            // Adicionar imagens
            selectedImages.forEach(file => {
                formDataToSend.append('images', file);
            });

            if (editingProduct) {
                await api.put(`/products/${editingProduct.id}`, formDataToSend);
            } else {
                await api.post('/products', formDataToSend);
            }

            await loadProducts();
            resetForm();
            setShowModal(false);
        } catch (error) {
            console.error('Erro ao salvar produto:', error);
            alert('Erro ao salvar produto: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            price: '',
            category_id: '',
            stock: '',
            is_visible: true,
            is_promotion: false,
            promotion_price: '',
            images: []
        });
        setSelectedImages([]);
        setPreviewImages([]);
        setEditingProduct(null);
    };

    const handleDelete = async (id) => {
        if (!confirm('Tem certeza que deseja excluir este produto?')) return;

        try {
            await api.delete(`/products/${id}`);
            await loadProducts();
        } catch (error) {
            console.error('Erro ao excluir produto:', error);
            alert('Erro ao excluir produto');
        }
    };

    const openEditModal = (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            description: product.description || '',
            price: product.price,
            category_id: product.category_id,
            stock: product.stock,
            is_visible: product.is_visible,
            is_promotion: product.is_promotion,
            promotion_price: product.promotion_price || '',
            images: []
        });
        setPreviewImages(product.images || []);
        setShowModal(true);
    };

    return (
        <div>
            {/* Cabeçalho */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">📦 Produtos</h2>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
                >
                    + Novo Produto
                </button>
            </div>

            {/* Barra de busca */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                <div className="flex gap-4">
                    <input
                        type="text"
                        placeholder="Buscar produtos..."
                        className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                        onChange={(e) => {
                            const search = e.target.value.toLowerCase();
                            // Implementar busca
                        }}
                    />
                    <select className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500">
                        <option value="">Todas categorias</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Tabela */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Produto</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Categoria</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Preço</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Estoque</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-8">Carregando...</td>
                                </tr>
                            ) : products.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-8 text-gray-500">
                                        Nenhum produto cadastrado
                                    </td>
                                </tr>
                            ) : (
                                products.map(product => (
                                    <tr key={product.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {product.images && product.images.length > 0 && (
                                                    <img 
                                                        src={product.images[0]} 
                                                        alt={product.name}
                                                        className="w-12 h-12 object-cover rounded"
                                                        onError={(e) => e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"%3E%3Crect width="48" height="48" fill="%23f3f4f6"/%3E%3Ctext x="24" y="28" text-anchor="middle" font-size="20" fill="%239ca3af"%3E🍔%3C/text%3E%3C/svg%3E'}
                                                    />
                                                )}
                                                <div>
                                                    <div className="font-medium">{product.name}</div>
                                                    <div className="text-sm text-gray-500 truncate max-w-xs">
                                                        {product.description}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="flex items-center gap-1">
                                                {product.category_icon} {product.category_name}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium">R$ {product.price?.toFixed(2)}</div>
                                            {product.is_promotion && product.promotion_price && (
                                                <div className="text-sm text-red-500">
                                                    Promo: R$ {product.promotion_price?.toFixed(2)}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`font-medium ${
                                                product.stock < 5 ? 'text-red-600' :
                                                product.stock < 10 ? 'text-yellow-600' :
                                                'text-green-600'
                                            }`}>
                                                {product.stock}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col gap-1">
                                                <span className={`px-2 py-1 rounded-full text-xs text-center ${
                                                    product.is_visible 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {product.is_visible ? '✅ Visível' : '❌ Oculto'}
                                                </span>
                                                {product.is_promotion && (
                                                    <span className="px-2 py-1 rounded-full text-xs text-center bg-red-100 text-red-800">
                                                        🔥 Promoção
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => openEditModal(product)}
                                                    className="text-blue-600 hover:text-blue-800 p-1"
                                                    title="Editar"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product.id)}
                                                    className="text-red-600 hover:text-red-800 p-1"
                                                    title="Excluir"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Criação/Edição */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <h3 className="text-2xl font-bold mb-4">
                            {editingProduct ? '✏️ Editar Produto' : '➕ Novo Produto'}
                        </h3>

                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-2 gap-4">
                                {/* Nome */}
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium mb-1">Nome *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                        placeholder="Ex: Combo Hulk"
                                    />
                                </div>

                                {/* Descrição */}
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium mb-1">Descrição</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                        rows="3"
                                        placeholder="Descreva o produto..."
                                    />
                                </div>

                                {/* Preço */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">Preço *</label>
                                    <input
                                        type="number"
                                        required
                                        step="0.01"
                                        min="0"
                                        value={formData.price}
                                        onChange={(e) => setFormData(prev => ({...prev, price: e.target.value}))}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                        placeholder="0,00"
                                    />
                                </div>

                                {/* Categoria */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">Categoria *</label>
                                    <select
                                        required
                                        value={formData.category_id}
                                        onChange={(e) => setFormData(prev => ({...prev, category_id: e.target.value}))}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                    >
                                        <option value="">Selecione...</option>
                                        {categories.filter(c => c.is_visible).map(cat => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.icon} {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Estoque */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">Estoque *</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={formData.stock}
                                        onChange={(e) => setFormData(prev => ({...prev, stock: e.target.value}))}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                        placeholder="0"
                                    />
                                </div>

                                {/* Promoção */}
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_promotion}
                                            onChange={(e) => setFormData(prev => ({...prev, is_promotion: e.target.checked}))}
                                            className="w-4 h-4"
                                        />
                                        <span>É promoção?</span>
                                    </label>
                                </div>

                                {/* Preço Promocional */}
                                {formData.is_promotion && (
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium mb-1">Preço Promocional</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={formData.promotion_price}
                                            onChange={(e) => setFormData(prev => ({...prev, promotion_price: e.target.value}))}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                            placeholder="0,00"
                                        />
                                    </div>
                                )}

                                {/* Visibilidade */}
                                <div className="col-span-2">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_visible}
                                            onChange={(e) => setFormData(prev => ({...prev, is_visible: e.target.checked}))}
                                            className="w-4 h-4"
                                        />
                                        <span>Produto visível no cardápio</span>
                                    </label>
                                </div>

                                {/* Imagens */}
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium mb-1">Imagens</label>
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="w-full px-3 py-2 border rounded-lg"
                                    />
                                    <small className="text-gray-500">
                                        PNG, JPG, GIF, WEBP (max 5MB cada)
                                    </small>

                                    {/* Preview das imagens */}
                                    {previewImages.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {previewImages.map((img, index) => (
                                                <div key={index} className="relative">
                                                    <img
                                                        src={img}
                                                        alt={`Preview ${index}`}
                                                        className="w-20 h-20 object-cover rounded border"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeImage(index)}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-4 mt-6">
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); resetForm(); }}
                                    className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                                >
                                    {loading ? 'Salvando...' : 'Salvar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ProductsTab;