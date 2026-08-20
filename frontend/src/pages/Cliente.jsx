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
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
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

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [productsRes, combosRes, categoriesRes] = await Promise.all([
                axios.get(`${API_URL}/products`),
                axios.get(`${API_URL}/combos`),
                axios.get(`${API_URL}/categories`)
            ]);
            setProducts(productsRes.data.filter(p => p.is_visible && p.stock > 0));
            setCombos(combosRes.data.filter(c => c.is_visible));
            setCategories(categoriesRes.data.filter(c => c.is_visible));
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    const allItems = [...products, ...combos.map(c => ({ ...c, isCombo: true }))];

    const addToCart = (item) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { ...item, quantity: 1 }];
        });
    };

    const handleRemoveItem = (productId) => {
        setCart(prev => prev.filter(item => item.id !== productId));
    };

    const handleUpdateQuantity = (productId, quantity) => {
        if (quantity <= 0) {
            handleRemoveItem(productId);
            return;
        }
        setCart(prev => prev.map(item => item.id === productId ? { ...item, quantity } : item));
    };

    const calculateTotal = () => {
        return cart.reduce((total, item) => total + item.price * item.quantity, 0);
    };

    const handleCheckout = async ({ customer_name, table_number, payment_method }) => {
        try {
            const items = cart.map(item => ({ product_id: item.id, quantity: item.quantity }));
            const orderResponse = await axios.post(`${API_URL}/orders`, {
                table_number,
                customer_name,
                items
            });
            await axios.post(`${API_URL}/payments`, {
                order_id: orderResponse.data.id,
                method: payment_method,
                amount: calculateTotal()
            });
            setOrderSuccess(true);
            setCart([]);
        } catch (error) {
            console.error('Erro ao finalizar pedido:', error);
            alert('❌ Erro ao finalizar pedido: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleExit = () => {
        setShowExitModal(true);
        setExitPassword('');
        setExitError('');
    };

    const handleExitConfirm = () => {
        if (exitPassword === '123456') {
            setShowExitModal(false);
            navigate('/login');
        } else {
            setExitError('Senha incorreta!');
        }
    };

    const total = calculateTotal();
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    if (loading) {
        return <div className="flex justify-center items-center h-screen text-xl">Carregando...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg sticky top-0 z-40">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold">🍔 Hulk Lanches</h1>
                    <div className="flex items-center gap-4">
                        <button onClick={() => setShowCartModal(true)} className="relative px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg">
                            🛒 Carrinho
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                                    {cartCount}
                                </span>
                            )}
                        </button>
                        <button onClick={handleExit} className="px-3 py-1 bg-red-500/80 hover:bg-red-500 rounded-lg">🔒 Sair</button>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {allItems.map(item => (
                        <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition cursor-pointer" onClick={() => addToCart(item)}>
                            <div className="w-full h-40 bg-gray-200 flex items-center justify-center relative">
                                {item.image_url ? (
                                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                ) : item.images && item.images.length > 0 ? (
                                    <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-6xl">🍔</span>
                                )}
                                {item.isCombo && <span className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">🍔 Combo</span>}
                            </div>
                            <div className="p-3">
                                <h3 className="font-bold text-sm">{item.name}</h3>
                                <p className="text-xs text-gray-500">{item.description?.substring(0, 50)}</p>
                                <div className="mt-2 flex items-center justify-between">
                                    <span className="text-green-600 font-bold text-lg">R$ {formatPrice(item.price)}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {showCartModal && (
                <CartModal
                    cart={cart}
                    onClose={() => setShowCartModal(false)}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemoveItem={handleRemoveItem}
                    onSubmitOrder={() => { setShowCartModal(false); setShowCheckoutModal(true); }}
                    total={total}
                />
            )}

            {showCheckoutModal && (
                <CheckoutModal
                    isOpen={showCheckoutModal}
                    onClose={() => { setShowCheckoutModal(false); resetCheckout(); }}
                    onSubmit={handleCheckout}
                    total={total}
                    orderSuccess={orderSuccess}
                />
            )}

            {showExitModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-sm w-full p-6">
                        <div className="text-center">
                            <div className="text-4xl mb-4">🔒</div>
                            <h3 className="text-xl font-bold">Sair do Cardápio</h3>
                            <p className="text-gray-600 text-sm mt-2">Digite a senha para voltar à tela de login.</p>
                        </div>
                        <div className="mt-4">
                            <input type="password" value={exitPassword} onChange={(e) => setExitPassword(e.target.value)} placeholder="Digite a senha..." className="w-full px-4 py-3 border rounded-lg text-center text-xl" onKeyPress={(e) => e.key === 'Enter' && handleExitConfirm()} autoFocus />
                            {exitError && <p className="text-red-500 text-sm mt-2 text-center">{exitError}</p>}
                        </div>
                        <div className="mt-6 flex gap-3">
                            <button onClick={() => { setShowExitModal(false); setExitPassword(''); setExitError(''); }} className="flex-1 px-4 py-3 bg-gray-200 rounded-lg hover:bg-gray-300">Cancelar</button>
                            <button onClick={handleExitConfirm} className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700">🔒 Sair</button>
                        </div>
                        <div className="mt-4 text-center text-xs text-gray-400">Senha padrão: 123456</div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Cliente;
