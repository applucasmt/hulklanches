import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import CartModal from '../components/CartModal';
import CheckoutModal from '../components/CheckoutModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function Cliente() {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [combos, setCombos] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showPromotions, setShowPromotions] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showProductModal, setShowProductModal] = useState(false);
    const [cart, setCart] = useState([]);
    const [showCartModal, setShowCartModal] = useState(false);
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [showExitModal, setShowExitModal] = useState(false);
    const [exitPassword, setExitPassword] = useState('');
    const [exitError, setExitError] = useState('');

    const formatPrice = (price) => {
        if (price === null || price === undefined) return '0,00';
        const num = typeof price === 'string' ? parseFloat(price) : price;
        return isNaN(num) ? '0,00' : num.toFixed(2);
    };

    const loadCategories = async () => {
        try {
            const response = await axios.get(`${API_URL}/categories`);
            setCategories(response.data.filter(c => c.is_visible));
        } catch (error) {
            console.error('Erro ao carregar categorias:', error);
        }
    };

    const loadProducts = async (categoryId = null) => {
        setLoading(true);
        try {
            let url = `${API_URL}/products`;
            if (categoryId) {
                url += `?category=${categoryId}`;
            }
            const response = await axios.get(url);
            setProducts(response.data.filter(p => p.is_visible && p.stock > 0));
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadCombos = async () => {
        try {
            const response = await axios.get(`${API_URL}/combos`);
            setCombos(response.data.filter(c => c.is_visible));
        } catch (error) {
            console.error('Erro ao carregar combos:', error);
        }
    };

    const loadPromotions = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/products?promotion=true`);
            setProducts(response.data.filter(p => p.is_visible && p.is_promotion && p.stock > 0));
        } catch (error) {
            console.error('Erro ao carregar promoções:', error);
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { ...product, quantity: 1 }];
        });
        setShowProductModal(false);
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300';
        toast.textContent = '✅ Produto adicionado ao carrinho!';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    };

    const handleRemoveItem = (productId) => {
        setCart(prev => prev.filter(item => item.id !== productId));
    };

    const handleUpdateQuantity = (productId, quantity) => {
        if (quantity <= 0) {
            handleRemoveItem(productId);
            return;
        }
        setCart(prev =>
            prev.map(item =>
                item.id === productId ? { ...item, quantity } : item
            )
        );
    };

    const calculateTotal = () => {
        return cart.reduce((total, item) => total + item.price * item.quantity, 0);
    };

    const openCheckout = () => {
        setShowCartModal(false);
        setShowCheckoutModal(true);
    };

    const handleCheckout = async ({ customer_name, table_number, payment_method }) => {
        try {
            const items = cart.map(item => ({
                product_id: item.id,
                quantity: item.quantity
            }));

            const orderResponse = await axios.post(`${API_URL}/orders`, {
                table_number: table_number,
                customer_name,
                items
            });

            const order = orderResponse.data;

            await axios.post(`${API_URL}/payments`, {
                order_id: order.id,
                method: payment_method,
                amount: calculateTotal()
            });

            setOrderSuccess(true);
            setCart([]);
            await loadProducts();

        } catch (error) {
            console.error('Erro ao finalizar pedido:', error);
            alert('❌ Erro ao finalizar pedido: ' + (error.response?.data?.error || error.message));
        }
    };

    const resetCheckout = () => {
        setOrderSuccess(false);
        setShowCheckoutModal(false);
    };

    const handleExit = () => {
        setShowExitModal(true);
        setExitPassword('');
        setExitError('');
    };

    const handleExitConfirm = () => {
        if (exitPassword === '123456') {
            setShowExitModal(false);
            setExitPassword('');
            navigate('/login');
        } else {
            setExitError('Senha incorreta! Tente novamente.');
        }
    };

    useEffect(() => {
        loadCategories();
        loadProducts();
        loadCombos(); // <-- ADICIONADO
    }, []);

    useEffect(() => {
        if (selectedCategory) {
            loadProducts(selectedCategory);
        } else if (!showPromotions) {
            loadProducts();
        }
    }, [selectedCategory]);

    useEffect(() => {
        if (showPromotions) {
            loadPromotions();
        }
    }, [showPromotions]);

    // Combinar produtos e combos
    const allItems = [...products, ...combos.map(c => ({ ...c, isCombo: true }))];

    const filteredItems = allItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesSearch;
    });

    const total = calculateTotal();
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <header className="bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg sticky top-0 z-40">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold">🍔 Hulk Lanches</h1>
                            <span className="text-xs bg-white/20 px-2 py-1 rounded">Cardápio</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setShowPromotions(!showPromotions)}
                                className={`px-3 py-1 rounded-lg text-sm transition ${
                                    showPromotions ? 'bg-yellow-500 text-white' : 'bg-white/20 hover:bg-white/30'
                                }`}
                            >
                                🔥 Promoções
                            </button>
                            <button
                                onClick={() => setShowCartModal(true)}
                                className="relative px-3 py-1 rounded-lg text-sm bg-white/20 hover:bg-white/30 transition"
                            >
                                🛒 Carrinho
                                {cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                                        {cartCount}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={handleExit}
                                className="px-3 py-1 rounded-lg text-sm bg-red-500/80 hover:bg-red-500 transition"
                            >
                                🔒 Sair
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Busca */}
            <div className="container mx-auto px-4 py-4">
                <div className="bg-white rounded-lg shadow-md p-4">
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                placeholder="🔍 Buscar produtos..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-3 pl-10 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                        {showPromotions && (
                            <button
                                onClick={() => { setShowPromotions(false); setSelectedCategory(null); }}
                                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                            >
                                Ver todos
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Categorias */}
            <div className="container mx-auto px-4 pb-4">
                <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
                    <button
                        className={`px-4 py-2 rounded-full transition text-sm font-medium ${
                            !selectedCategory && !showPromotions
                                ? 'bg-green-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-200 shadow-sm'
                        }`}
                        onClick={() => { setSelectedCategory(null); setShowPromotions(false); }}
                    >
                        🍔 Todos
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            className={`px-4 py-2 rounded-full transition text-sm font-medium whitespace-nowrap ${
                                selectedCategory === cat.id
                                    ? 'bg-green-600 text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-200 shadow-sm'
                            }`}
                            onClick={() => { setSelectedCategory(cat.id); setShowPromotions(false); }}
                        >
                            {cat.icon} {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Produtos */}
            <div className="container mx-auto px-4 pb-8">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="text-gray-500 text-xl">Carregando...</div>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg shadow-md">
                        <div className="text-6xl mb-4">🍽️</div>
                        <h3 className="text-xl font-bold text-gray-600">Nenhum produto encontrado</h3>
                        <p className="text-gray-400 mt-2">Tente ajustar sua busca</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredItems.map(item => (
                            <div
                                key={item.id}
                                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition cursor-pointer"
                                onClick={() => {
                                    setSelectedProduct(item);
                                    setShowProductModal(true);
                                }}
                            >
                                <div className="w-full h-40 bg-gray-200 flex items-center justify-center relative">
                                    {item.image_url || (item.images && item.images.length > 0) ? (
                                        <img
                                            src={item.image_url || item.images[0]}
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23f3f4f6"/%3E%3Ctext x="50" y="55" text-anchor="middle" font-size="40" fill="%239ca3af"%3E🍔%3C/text%3E%3C/svg%3E'}
                                        />
                                    ) : (
                                        <span className="text-6xl">🍔</span>
                                    )}
                                    {item.isCombo && (
                                        <span className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                                            🍔 Combo
                                        </span>
                                    )}
                                    {item.is_promotion && (
                                        <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                            🔥 Promoção
                                        </span>
                                    )}
                                    {item.stock <= 0 && (
                                        <span className="absolute bottom-2 left-2 bg-gray-800/80 text-white text-xs px-2 py-1 rounded">
                                            Esgotado
                                        </span>
                                    )}
                                    {cart.find(i => i.id === item.id) && (
                                        <span className="absolute bottom-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                                            🛒 No carrinho
                                        </span>
                                    )}
                                </div>
                                <div className="p-3">
                                    <h3 className="font-bold text-sm text-gray-800 line-clamp-2 min-h-[40px]">
                                        {item.name}
                                    </h3>
                                    <p className="text-xs text-gray-500 line-clamp-2 mt-1 min-h-[32px]">
                                        {item.description}
                                    </p>
                                    <div className="mt-2 flex items-center justify-between">
                                        <span className="text-green-600 font-bold text-lg">
                                            R$ {formatPrice(item.price)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal de Produto */}
            {showProductModal && selectedProduct && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="w-full h-64 bg-gray-200 relative">
                            {selectedProduct.image_url || (selectedProduct.images && selectedProduct.images.length > 0) ? (
                                <img
                                    src={selectedProduct.image_url || selectedProduct.images[0]}
                                    alt={selectedProduct.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-8xl">🍔</div>
                            )}
                            <button
                                onClick={() => setShowProductModal(false)}
                                className="absolute top-4 right-4 bg-white/90 rounded-full w-8 h-8 flex items-center justify-center text-xl hover:bg-white transition"
                            >
                                ✕
                            </button>
                            {selectedProduct.isCombo && (
                                <span className="absolute top-4 left-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                                    🍔 Combo
                                </span>
                            )}
                            {selectedProduct.is_promotion && (
                                <span className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                                    🔥 Promoção
                                </span>
                            )}
                        </div>
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-gray-800">{selectedProduct.name}</h2>
                            <p className="text-gray-600 mt-2">{selectedProduct.description}</p>
                            <div className="mt-4 flex items-center gap-4">
                                <div>
                                    <span className="text-3xl font-bold text-green-600">
                                        R$ {formatPrice(selectedProduct.price)}
                                    </span>
                                </div>
                                <div className="text-sm text-gray-500">
                                    Estoque: {selectedProduct.stock || 0}
                                </div>
                            </div>
                            <div className="mt-6 flex gap-3">
                                <button
                                    onClick={() => setShowProductModal(false)}
                                    className="flex-1 px-4 py-3 bg-gray-200 rounded-lg hover:bg-gray-300 transition font-medium"
                                >
                                    Fechar
                                </button>
                                <button
                                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                                    onClick={() => addToCart(selectedProduct)}
                                >
                                    🛒 Adicionar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal do Carrinho */}
            {showCartModal && (
                <CartModal
                    cart={cart}
                    onClose={() => setShowCartModal(false)}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemoveItem={handleRemoveItem}
                    onSubmitOrder={openCheckout}
                    total={total}
                />
            )}

            {/* Modal de Checkout */}
            <CheckoutModal
                isOpen={showCheckoutModal}
                onClose={() => { setShowCheckoutModal(false); resetCheckout(); }}
                onSubmit={handleCheckout}
                total={total}
                orderSuccess={orderSuccess}
            />

            {/* Modal de Saída */}
            {showExitModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-sm w-full p-6">
                        <div className="text-center">
                            <div className="text-4xl mb-4">🔒</div>
                            <h3 className="text-xl font-bold text-gray-800">Sair do Cardápio</h3>
                            <p className="text-gray-600 text-sm mt-2">
                                Digite a senha para voltar à tela de login.
                            </p>
                        </div>
                        <div className="mt-4">
                            <input
                                type="password"
                                value={exitPassword}
                                onChange={(e) => setExitPassword(e.target.value)}
                                placeholder="Digite a senha..."
                                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-center text-xl"
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        handleExitConfirm();
                                    }
                                }}
                                autoFocus
                            />
                            {exitError && (
                                <p className="text-red-500 text-sm mt-2 text-center">{exitError}</p>
                            )}
                        </div>
                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={() => { setShowExitModal(false); setExitPassword(''); setExitError(''); }}
                                className="flex-1 px-4 py-3 bg-gray-200 rounded-lg hover:bg-gray-300 transition font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleExitConfirm}
                                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                            >
                                🔒 Sair
                            </button>
                        </div>
                        <div className="mt-4 text-center text-xs text-gray-400">
                            Senha padrão: 123456
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="bg-white border-t mt-8">
                <div className="container mx-auto px-4 py-4 text-center text-sm text-gray-500">
                    🍔 Hulk Lanches - Cardápio Digital
                </div>
            </footer>
        </div>
    );
}

export default Cliente;