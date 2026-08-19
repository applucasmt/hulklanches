import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import ReportsTab from '../components/ReportsTab';

// ============ COMPONENTES DAS ABAS ============

// 1. DASHBOARD
function DashboardTab() {
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const response = await api.get('/dashboard');
            console.log('📊 Dashboard recebido:', response.data);
            setDashboard(response.data);
        } catch (error) {
            console.error('Erro ao carregar dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        if (price === null || price === undefined) return '0,00';
        const num = typeof price === 'string' ? parseFloat(price) : price;
        return isNaN(num) ? '0,00' : num.toFixed(2);
    };

    if (loading) {
        return <div className="text-center py-8">Carregando dashboard...</div>;
    }

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Pedidos Hoje</p>
                            <p className="text-3xl font-bold">{dashboard?.todayOrders?.count || 0}</p>
                        </div>
                        <div className="text-4xl">📋</div>
                    </div>
                    <div className="mt-2 text-green-600">
                        R$ {formatPrice(dashboard?.todayOrders?.total)}
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Produtos</p>
                            <p className="text-3xl font-bold">{dashboard?.totalProducts || 0}</p>
                        </div>
                        <div className="text-4xl">📦</div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Pedidos Pendentes</p>
                            <p className="text-3xl font-bold text-yellow-600">{dashboard?.pendingOrders || 0}</p>
                        </div>
                        <div className="text-4xl">⏳</div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Receita do Mês</p>
                            <p className="text-3xl font-bold text-green-600">R$ {formatPrice(dashboard?.monthlyRevenue)}</p>
                        </div>
                        <div className="text-4xl">💰</div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h3 className="text-xl font-bold mb-4">🔥 Produtos Mais Vendidos</h3>
                {dashboard?.bestSellers?.length > 0 ? (
                    <div className="space-y-2">
                        {dashboard.bestSellers.map((product, index) => (
                            <div key={index} className="flex justify-between items-center border-b py-2">
                                <span>{index + 1}. {product.name}</span>
                                <span className="font-bold text-green-600">{product.total_sold} vendidos</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">Nenhum dado disponível</p>
                )}
            </div>

            {dashboard?.lowStock?.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-xl font-bold mb-4 text-red-600">⚠️ Produtos com Estoque Baixo</h3>
                    <div className="space-y-2">
                        {dashboard.lowStock.map(product => (
                            <div key={product.id} className="flex justify-between items-center border-b py-2">
                                <span>{product.name}</span>
                                <span className="text-red-500 font-bold">Estoque: {product.stock}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// 2. PRODUTOS
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
    });

    const formatPrice = (price) => {
        if (price === null || price === undefined) return '0,00';
        const num = typeof price === 'string' ? parseFloat(price) : price;
        return isNaN(num) ? '0,00' : num.toFixed(2);
    };

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
            let categoryId = parseInt(formData.category_id);
            if (!categoryId || isNaN(categoryId)) {
                alert('⚠️ Por favor, selecione uma categoria válida!');
                setLoading(false);
                return;
            }

            if (!formData.price) {
                alert('⚠️ Por favor, insira um preço válido!');
                setLoading(false);
                return;
            }

            const formDataToSend = new FormData();
            
            formDataToSend.append('name', formData.name);
            formDataToSend.append('description', formData.description || '');
            formDataToSend.append('price', String(formData.price));
            formDataToSend.append('category_id', String(categoryId));
            formDataToSend.append('stock', String(formData.stock || 0));
            formDataToSend.append('is_visible', formData.is_visible ? 'true' : 'false');
            formDataToSend.append('is_promotion', formData.is_promotion ? 'true' : 'false');
            
            if (formData.promotion_price) {
                formDataToSend.append('promotion_price', String(formData.promotion_price));
            }
            
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
            alert('✅ Produto salvo com sucesso!');
        } catch (error) {
            console.error('❌ Erro ao salvar produto:', error);
            alert('❌ Erro ao salvar produto: ' + (error.response?.data?.error || error.message));
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
        });
        setPreviewImages(product.images || []);
        setShowModal(true);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">📦 Produtos</h2>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
                >
                    + Novo Produto
                </button>
            </div>

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
                                <tr><td colSpan="6" className="text-center py-8">Carregando...</td></tr>
                            ) : products.length === 0 ? (
                                <tr><td colSpan="6" className="text-center py-8 text-gray-500">Nenhum produto cadastrado</td></tr>
                            ) : (
                                products.map(product => (
                                    <tr key={product.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {product.images && product.images.length > 0 && (
                                                    <img src={product.images[0]} alt={product.name} className="w-12 h-12 object-cover rounded" />
                                                )}
                                                <div>
                                                    <div className="font-medium">{product.name}</div>
                                                    <div className="text-sm text-gray-500 truncate max-w-xs">{product.description}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">{product.category_name}</td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium">R$ {formatPrice(product.price)}</div>
                                            {product.is_promotion && product.promotion_price && (
                                                <div className="text-sm text-red-500">Promo: R$ {formatPrice(product.promotion_price)}</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`font-medium ${product.stock < 5 ? 'text-red-600' : 'text-green-600'}`}>
                                                {product.stock}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs ${product.is_visible ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {product.is_visible ? '✅ Visível' : '❌ Oculto'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <button onClick={() => openEditModal(product)} className="text-blue-600 hover:text-blue-800">✏️</button>
                                                <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-800">🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <h3 className="text-2xl font-bold mb-4">{editingProduct ? '✏️ Editar Produto' : '➕ Novo Produto'}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium mb-1">Nome *</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={formData.name} 
                                        onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))} 
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500" 
                                        placeholder="Ex: X-Bacon"
                                    />
                                </div>
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
                                <div>
                                    <label className="block text-sm font-medium mb-1">Preço *</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={formData.price} 
                                        onChange={(e) => setFormData(prev => ({...prev, price: e.target.value}))} 
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500" 
                                        placeholder="10,50"
                                    />
                                    <small className="text-xs text-gray-500">Use ponto (10.50) ou vírgula (10,50)</small>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Categoria *</label>
                                    <select
                                        required
                                        value={formData.category_id || ''}
                                        onChange={(e) => setFormData(prev => ({...prev, category_id: e.target.value}))}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                    >
                                        <option value="">Selecione uma categoria</option>
                                        {categories.filter(c => c.is_visible).map(cat => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.icon} {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
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
                                {formData.is_promotion && (
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium mb-1">Preço Promocional</label>
                                        <input 
                                            type="text" 
                                            step="0.01" 
                                            min="0" 
                                            value={formData.promotion_price} 
                                            onChange={(e) => setFormData(prev => ({...prev, promotion_price: e.target.value}))} 
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500" 
                                            placeholder="0,00"
                                        />
                                    </div>
                                )}
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
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium mb-1">Imagens</label>
                                    <input 
                                        type="file" 
                                        multiple 
                                        accept="image/*" 
                                        onChange={handleFileChange} 
                                        className="w-full px-3 py-2 border rounded-lg" 
                                    />
                                    <small className="text-gray-500">PNG, JPG, GIF, WEBP (max 5MB cada)</small>
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

// 3. CATEGORIAS
function CategoriesTab() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '', icon: '🍔', is_visible: true });

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        setLoading(true);
        try {
            const response = await api.get('/categories');
            setCategories(response.data);
        } catch (error) {
            console.error('Erro ao carregar categorias:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingCategory) {
                await api.put(`/categories/${editingCategory.id}`, formData);
            } else {
                await api.post('/categories', formData);
            }
            await loadCategories();
            resetForm();
            setShowModal(false);
        } catch (error) {
            console.error('Erro ao salvar categoria:', error);
            alert('Erro ao salvar categoria');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;
        try {
            await api.delete(`/categories/${id}`);
            await loadCategories();
        } catch (error) {
            console.error('Erro ao excluir categoria:', error);
            alert('Erro ao excluir categoria');
        }
    };

    const resetForm = () => {
        setFormData({ name: '', description: '', icon: '🍔', is_visible: true });
        setEditingCategory(null);
    };

    const icons = ['🍔', '⭐', '🔥', '🥤', '🍟', '🍰', '🥗', '🍕', '🌮', '🍣', '🧁', '🍦'];

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">🏷️ Categorias</h2>
                <button onClick={() => { resetForm(); setShowModal(true); }} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition">+ Nova Categoria</button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {categories.map(category => (
                    <div key={category.id} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition">
                        <div className="text-4xl text-center mb-2">{category.icon}</div>
                        <h3 className="font-bold text-center text-lg">{category.name}</h3>
                        <p className="text-sm text-gray-600 text-center mt-1">{category.description}</p>
                        <div className="flex justify-center mt-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${category.is_visible ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {category.is_visible ? '✅ Visível' : '❌ Oculto'}
                            </span>
                        </div>
                        <div className="flex justify-center gap-2 mt-3">
                            <button onClick={() => { setEditingCategory(category); setFormData(category); setShowModal(true); }} className="text-blue-600 hover:text-blue-800">✏️</button>
                            <button onClick={() => handleDelete(category.id)} className="text-red-600 hover:text-red-800">🗑️</button>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-8 max-w-md w-full">
                        <h3 className="text-2xl font-bold mb-4">{editingCategory ? '✏️ Editar Categoria' : '➕ Nova Categoria'}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Nome *</label>
                                    <input type="text" required value={formData.name} onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Descrição</label>
                                    <input type="text" value={formData.description} onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Ícone</label>
                                    <div className="grid grid-cols-6 gap-2">
                                        {icons.map(icon => (
                                            <button key={icon} type="button" onClick={() => setFormData(prev => ({...prev, icon}))} className={`text-2xl p-2 rounded hover:bg-gray-100 ${formData.icon === icon ? 'bg-green-100 border-2 border-green-500' : ''}`}>
                                                {icon}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" checked={formData.is_visible} onChange={(e) => setFormData(prev => ({...prev, is_visible: e.target.checked}))} />
                                        <span>Visível no cardápio</span>
                                    </label>
                                </div>
                            </div>
                            <div className="flex justify-end gap-4 mt-6">
                                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition">Cancelar</button>
                                <button type="submit" disabled={loading} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50">{loading ? 'Salvando...' : 'Salvar'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// 4. COMBOS (COMPLETO COM SELECT DE PRODUTOS E IMAGENS)
function CombosTab() {
    const [combos, setCombos] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingCombo, setEditingCombo] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        is_visible: true,
        items: []
    });
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [showProductSelector, setShowProductSelector] = useState(false);
    const [availableProducts, setAvailableProducts] = useState([]);

    const formatPrice = (price) => {
        if (price === null || price === undefined) return '0,00';
        const num = typeof price === 'string' ? parseFloat(price) : price;
        return isNaN(num) ? '0,00' : num.toFixed(2);
    };

    useEffect(() => {
        loadCombos();
        loadProducts();
    }, []);

    const loadCombos = async () => {
        setLoading(true);
        try {
            const response = await api.get('/combos');
            setCombos(response.data);
        } catch (error) {
            console.error('Erro ao carregar combos:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadProducts = async () => {
        try {
            const response = await api.get('/products');
            setProducts(response.data);
            setAvailableProducts(response.data.filter(p => p.is_visible));
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImage(file);
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const handleAddProductToCombo = (product) => {
        if (selectedProducts.find(p => p.product_id === product.id)) {
            alert('⚠️ Este produto já está no combo!');
            return;
        }

        setSelectedProducts(prev => [...prev, { 
            product_id: product.id, 
            product_name: product.name,
            product_price: product.price,
            quantity: 1, 
            discount_percent: 0 
        }]);
        
        setAvailableProducts(prev => prev.filter(p => p.id !== product.id));
        setShowProductSelector(false);
    };

    const removeProductFromCombo = (index) => {
        const removedProduct = selectedProducts[index];
        const productToReturn = products.find(p => p.id === removedProduct.product_id);
        if (productToReturn) {
            setAvailableProducts(prev => [...prev, productToReturn].sort((a, b) => a.name.localeCompare(b.name)));
        }
        setSelectedProducts(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name);
            formDataToSend.append('description', formData.description);
            formDataToSend.append('price', formData.price);
            formDataToSend.append('is_visible', formData.is_visible);
            formDataToSend.append('items', JSON.stringify(selectedProducts));
            
            if (selectedImage) {
                formDataToSend.append('image', selectedImage);
            }

            if (editingCombo) {
                await api.put(`/combos/${editingCombo.id}`, formDataToSend);
            } else {
                await api.post('/combos', formDataToSend);
            }

            await loadCombos();
            resetForm();
            setShowModal(false);
            alert('✅ Combo salvo com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar combo:', error);
            alert('Erro ao salvar combo: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({ name: '', description: '', price: '', is_visible: true, items: [] });
        setSelectedProducts([]);
        setSelectedImage(null);
        setPreviewImage(null);
        setEditingCombo(null);
        setAvailableProducts(products.filter(p => p.is_visible));
        setShowProductSelector(false);
    };

    const handleDelete = async (id) => {
        if (!confirm('Tem certeza que deseja excluir este combo?')) return;
        try {
            await api.delete(`/combos/${id}`);
            await loadCombos();
        } catch (error) {
            console.error('Erro ao excluir combo:', error);
            alert('Erro ao excluir combo');
        }
    };

    const openEditModal = (combo) => {
        setEditingCombo(combo);
        setFormData({
            name: combo.name,
            description: combo.description || '',
            price: combo.price,
            is_visible: combo.is_visible,
            items: combo.items || []
        });
        
        const comboItems = combo.items || [];
        setSelectedProducts(comboItems);
        
        const selectedIds = comboItems.map(item => item.product_id);
        setAvailableProducts(products.filter(p => p.is_visible && !selectedIds.includes(p.id)));
        
        setPreviewImage(combo.image_url || null);
        setShowModal(true);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">🍔 Combos</h2>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
                >
                    + Novo Combo
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {combos.map(combo => (
                    <div key={combo.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                        {combo.image_url && (
                            <img 
                                src={combo.image_url} 
                                alt={combo.name} 
                                className="w-full h-48 object-cover" 
                                onError={(e) => {
                                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect width="200" height="200" fill="%23f3f4f6"/%3E%3Ctext x="100" y="115" text-anchor="middle" font-size="80" fill="%239ca3af"%3E🍔%3C/text%3E%3C/svg%3E';
                                }}
                            />
                        )}
                        <div className="p-4">
                            <div className="flex justify-between items-start">
                                <h3 className="text-xl font-bold">{combo.name}</h3>
                                <span className={`px-2 py-1 rounded-full text-xs ${combo.is_visible ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {combo.is_visible ? '✅ Visível' : '❌ Oculto'}
                                </span>
                            </div>
                            <p className="text-gray-600 text-sm mt-1">{combo.description}</p>
                            <div className="mt-2 flex justify-between items-center">
                                <span className="text-2xl font-bold text-green-600">R$ {formatPrice(combo.price)}</span>
                                <span className="text-sm text-gray-500">{combo.items_count || 0} itens</span>
                            </div>
                            <div className="mt-3 flex gap-2">
                                <button onClick={() => openEditModal(combo)} className="text-blue-600 hover:text-blue-800">✏️</button>
                                <button onClick={() => handleDelete(combo.id)} className="text-red-600 hover:text-red-800">🗑️</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <h3 className="text-2xl font-bold mb-4">
                            {editingCombo ? '✏️ Editar Combo' : '➕ Novo Combo'}
                        </h3>

                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium mb-1">Nome *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                        placeholder="Ex: Combo Família"
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm font-medium mb-1">Descrição</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                        rows="2"
                                        placeholder="Descreva o combo..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Preço *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.price}
                                        onChange={(e) => setFormData(prev => ({...prev, price: e.target.value}))}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                        placeholder="0,00"
                                    />
                                </div>

                                <div className="flex items-center">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_visible}
                                            onChange={(e) => setFormData(prev => ({...prev, is_visible: e.target.checked}))}
                                            className="w-4 h-4"
                                        />
                                        <span>Visível no cardápio</span>
                                    </label>
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm font-medium mb-1">Imagem do Combo</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="w-full px-3 py-2 border rounded-lg"
                                    />
                                    {previewImage && (
                                        <div className="mt-2">
                                            <img 
                                                src={previewImage} 
                                                alt="Preview" 
                                                className="w-32 h-32 object-cover rounded" 
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm font-medium mb-1">Produtos do Combo</label>
                                    <div className="border rounded-lg p-4">
                                        {selectedProducts.length === 0 ? (
                                            <p className="text-gray-400 text-sm text-center py-2">
                                                Nenhum produto adicionado ao combo
                                            </p>
                                        ) : (
                                            selectedProducts.map((item, index) => (
                                                <div key={index} className="flex justify-between items-center border-b py-2">
                                                    <div>
                                                        <span className="font-medium">{item.product_name}</span>
                                                        <span className="text-sm text-gray-500 ml-2">
                                                            Qtd: {item.quantity}
                                                        </span>
                                                        {item.discount_percent > 0 && (
                                                            <span className="text-sm text-green-600 ml-2">
                                                                -{item.discount_percent}%
                                                            </span>
                                                        )}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeProductFromCombo(index)}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        ✖
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                        
                                        {availableProducts.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => setShowProductSelector(!showProductSelector)}
                                                className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                                            >
                                                {showProductSelector ? '⬆️ Fechar lista' : '+ Adicionar Produto'}
                                            </button>
                                        )}
                                        
                                        {showProductSelector && availableProducts.length > 0 && (
                                            <div className="mt-2 max-h-40 overflow-y-auto border rounded-lg p-2 bg-gray-50">
                                                {availableProducts.map(product => (
                                                    <div
                                                        key={product.id}
                                                        onClick={() => handleAddProductToCombo(product)}
                                                        className="flex justify-between items-center p-2 hover:bg-gray-200 rounded cursor-pointer transition"
                                                    >
                                                        <span className="font-medium text-sm">{product.name}</span>
                                                        <span className="text-sm text-gray-500">R$ {formatPrice(product.price)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        
                                        {availableProducts.length === 0 && selectedProducts.length > 0 && (
                                            <p className="text-xs text-gray-400 mt-2">
                                                Todos os produtos já foram adicionados
                                            </p>
                                        )}
                                    </div>
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

// 5. PEDIDOS
function OrdersTab() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const response = await api.get('/orders');
            setOrders(response.data);
        } catch (error) {
            console.error('Erro ao carregar pedidos:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        if (price === null || price === undefined) return '0,00';
        const num = typeof price === 'string' ? parseFloat(price) : price;
        return isNaN(num) ? '0,00' : num.toFixed(2);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pendente': return 'text-yellow-600';
            case 'em_preparo': return 'text-blue-600';
            case 'pronto': return 'text-green-600';
            case 'entregue': return 'text-gray-500';
            default: return 'text-gray-500';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'pendente': return '⏳ Pendente';
            case 'em_preparo': return '🔧 Em preparo';
            case 'pronto': return '✅ Pronto';
            case 'entregue': return '📦 Entregue';
            default: return status;
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">📋 Pedidos</h2>
            {loading ? (
                <div className="text-center py-8">Carregando...</div>
            ) : orders.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
                    <p className="text-4xl mb-4">📋</p>
                    <p>Nenhum pedido encontrado</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map(order => (
                        <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-lg">Pedido #{order.id}</span>
                                        <span className={`text-sm font-medium ${getStatusColor(order.status)}`}>
                                            {getStatusText(order.status)}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-500 mt-1">
                                        Mesa: {order.table_number} • {new Date(order.created_at).toLocaleString()}
                                    </div>
                                    {order.customer_name && (
                                        <div className="text-sm text-gray-500">Cliente: {order.customer_name}</div>
                                    )}
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-bold text-green-600">
                                        R$ {formatPrice(order.total)}
                                    </div>
                                    <div className="text-xs text-gray-500">Funcionário: {order.user_name}</div>
                                </div>
                            </div>
                            <div className="mt-3 pt-3 border-t">
                                {order.items && order.items.map(item => (
                                    <div key={item.id} className="flex justify-between text-sm py-1">
                                        <span>{item.quantity}x {item.product_name}</span>
                                        <span>R$ {formatPrice(item.unit_price * item.quantity)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// 6. USUÁRIOS
function UsersTab() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const response = await api.get('/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">👥 Usuários</h2>
            {loading ? (
                <div className="text-center py-8">Carregando...</div>
            ) : users.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
                    <p className="text-4xl mb-4">👥</p>
                    <p>Nenhum usuário encontrado</p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Nome</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Email</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Perfil</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Criado em</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {users.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium">{user.name}</td>
                                    <td className="px-4 py-3">{user.email}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                            user.role === 'admin' ? 'bg-red-100 text-red-800' :
                                            user.role === 'funcionario' ? 'bg-blue-100 text-blue-800' :
                                            'bg-green-100 text-green-800'
                                        }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ============ ADMIN PRINCIPAL ============

function Admin({ onLogout }) {
    const [activeTab, setActiveTab] = useState('dashboard');

    const tabs = [
        { id: 'dashboard', label: '📊 Dashboard' },
        { id: 'products', label: '📦 Produtos' },
        { id: 'categories', label: '🏷️ Categorias' },
        { id: 'combos', label: '🍔 Combos' },
        { id: 'orders', label: '📋 Pedidos' },
        { id: 'users', label: '👥 Usuários' },
        { id: 'reports', label: '📈 Relatórios' },
    ];

    const renderTab = () => {
        switch (activeTab) {
            case 'dashboard': return <DashboardTab />;
            case 'products': return <ProductsTab />;
            case 'categories': return <CategoriesTab />;
            case 'combos': return <CombosTab />;
            case 'orders': return <OrdersTab />;
            case 'users': return <UsersTab />;
            case 'reports': return <ReportsTab />;
            default: return <div>Tab não encontrada</div>;
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <header className="bg-white shadow-md">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold text-green-600">🍔 Hulk Lanches</h1>
                        <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full">Admin</span>
                    </div>
                    <button
                        onClick={onLogout}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
                    >
                        Sair
                    </button>
                </div>
            </header>

            {/* Navegação */}
            <nav className="bg-white shadow-sm border-b">
                <div className="container mx-auto px-4">
                    <div className="flex overflow-x-auto gap-2 py-3">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                                    activeTab === tab.id
                                        ? 'bg-green-600 text-white'
                                        : 'bg-gray-100 hover:bg-gray-200'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </nav>

            {/* Conteúdo */}
            <main className="container mx-auto px-4 py-8">
                {renderTab()}
            </main>
        </div>
    );
}

export default Admin;