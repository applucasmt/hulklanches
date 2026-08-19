import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { socket } from '../services/socket';

function Funcionario({ onLogout }) {
    const [products, setProducts] = useState([]);
    const [combos, setCombos] = useState([]);
    const [categories, setCategories] = useState([]);
    const [cart, setCart] = useState([]);
    const [tableNumber, setTableNumber] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [activeOrders, setActiveOrders] = useState([]);
    const [notification, setNotification] = useState(null);
    const [showNotificationModal, setShowNotificationModal] = useState(false);

    // Função para formatar preço com segurança
    const formatPrice = (price) => {
        if (price === null || price === undefined) return '0,00';
        const num = typeof price === 'string' ? parseFloat(price) : price;
        return isNaN(num) ? '0,00' : num.toFixed(2);
    };

    // Função para tocar som
    const playSound = (type) => {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            if (type === 'order_ready') {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
                oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.15);
                oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.3);
                
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.5);
            } else if (type === 'new_order') {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
                oscillator.frequency.setValueAtTime(400, audioContext.currentTime + 0.2);
                
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
            }
        } catch (error) {
            console.log('🔇 Som não disponível:', error);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                await loadCategories();
                await loadProducts();
                await loadCombos();
                await loadActiveOrders();
            } catch (error) {
                console.error('Erro ao carregar dados:', error);
            } finally {
                setLoading(false);
            }
        };
        
        loadData();
        
        socket.connect();
        
        socket.on('new_order', (order) => {
            console.log('🆕 Novo pedido recebido:', order);
            setActiveOrders(prev => [order, ...prev]);
            playSound('new_order');
        });
        
        socket.on('order_updated', (updatedOrder) => {
            console.log('🔄 Pedido atualizado:', updatedOrder);
            
            setActiveOrders(prev => 
                prev.map(order => 
                    order.id === updatedOrder.id ? updatedOrder : order
                )
            );
            
            if (updatedOrder.status === 'pronto') {
                playSound('order_ready');
                setNotification({
                    order: updatedOrder,
                    message: `✅ Pedido #${updatedOrder.id} da Mesa ${updatedOrder.table_number} está PRONTO!`,
                });
                setShowNotificationModal(true);
            }
        });
        
        return () => {
            socket.disconnect();
            socket.off('new_order');
            socket.off('order_updated');
        };
    }, []);

    useEffect(() => {
        if (selectedCategory) {
            loadProducts(selectedCategory);
        } else {
            loadProducts();
        }
    }, [selectedCategory]);

    const loadCategories = async () => {
        try {
            const response = await api.get('/categories');
            setCategories(response.data.filter(c => c.is_visible));
        } catch (error) {
            console.error('Erro ao carregar categorias:', error);
        }
    };

    const loadProducts = async (categoryId = null) => {
        try {
            let url = '/products';
            if (categoryId) {
                url += `?category=${categoryId}`;
            }
            const response = await api.get(url);
            setProducts(response.data.filter(p => p.is_visible && p.stock > 0));
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
        }
    };

    const loadCombos = async () => {
        try {
            const response = await api.get('/combos');
            setCombos(response.data.filter(c => c.is_visible));
        } catch (error) {
            console.error('Erro ao carregar combos:', error);
        }
    };

    const loadActiveOrders = async () => {
        try {
            const response = await api.get('/orders/pending');
            setActiveOrders(response.data.filter(o => o.status !== 'entregue'));
        } catch (error) {
            console.error('Erro ao carregar pedidos ativos:', error);
            setActiveOrders([]);
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
    };

    const removeFromCart = (productId) => {
        setCart(prev => prev.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId, quantity) => {
        if (quantity <= 0) {
            removeFromCart(productId);
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

    const handleSubmitOrder = async () => {
        if (!tableNumber) {
            alert('⚠️ Por favor, informe o número da mesa');
            return;
        }
        if (cart.length === 0) {
            alert('⚠️ Adicione itens ao pedido');
            return;
        }

        setSubmitting(true);
        try {
            const items = cart.map(item => ({
                product_id: item.id,
                quantity: item.quantity
            }));

            const response = await api.post('/orders', {
                table_number: parseInt(tableNumber),
                customer_name: customerName || null,
                items
            });

            socket.emit('new_order', response.data);

            setCart([]);
            setTableNumber('');
            setCustomerName('');
            loadActiveOrders();

            const toast = document.createElement('div');
            toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300';
            toast.textContent = '✅ Pedido enviado com sucesso!';
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);

        } catch (error) {
            console.error('❌ Erro ao enviar pedido:', error);
            alert('❌ Erro ao enviar pedido: ' + (error.response?.data?.error || error.message));
        } finally {
            setSubmitting(false);
        }
    };

    const handleConfirmDelivery = async (orderId) => {
        try {
            await api.put(`/orders/${orderId}/status`, { status: 'entregue' });
            setShowNotificationModal(false);
            setNotification(null);
            loadActiveOrders();
            
            const toast = document.createElement('div');
            toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300';
            toast.textContent = '✅ Pedido entregue com sucesso!';
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        } catch (error) {
            console.error('❌ Erro ao confirmar entrega:', error);
            alert('❌ Erro ao confirmar entrega: ' + (error.response?.data?.error || error.message));
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

    const getStatusColor = (status) => {
        switch (status) {
            case 'pendente': return 'text-yellow-600';
            case 'em_preparo': return 'text-blue-600';
            case 'pronto': return 'text-green-600';
            case 'entregue': return 'text-gray-500';
            default: return 'text-gray-500';
        }
    };

    // Combinar produtos e combos
    const allItems = [...products, ...combos.map(c => ({ ...c, isCombo: true }))];

    // Se estiver carregando, mostra um loader
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-4xl mb-4">🍔</div>
                    <div className="text-xl text-gray-600">Carregando...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Modal de Notificação - Popup Central */}
            {showNotificationModal && notification && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl animate-bounce-in">
                        <div className="text-center">
                            <div className="text-6xl mb-4">🔔</div>
                            <h2 className="text-2xl font-bold text-green-600 mb-2">Pedido Pronto!</h2>
                            <p className="text-gray-700 text-lg mb-1">
                                Pedido #{notification.order.id}
                            </p>
                            <p className="text-gray-600 text-lg mb-4">
                                Mesa {notification.order.table_number}
                            </p>
                            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                                {notification.order.items && notification.order.items.map(item => (
                                    <div key={item.id} className="flex justify-between text-sm py-1">
                                        <span>{item.quantity}x {item.product_name}</span>
                                        <span>R$ {formatPrice(item.unit_price * item.quantity)}</span>
                                    </div>
                                ))}
                                <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                                    <span>Total:</span>
                                    <span className="text-green-600">R$ {formatPrice(notification.order.total)}</span>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowNotificationModal(false);
                                        setNotification(null);
                                    }}
                                    className="flex-1 px-4 py-3 bg-gray-200 rounded-lg hover:bg-gray-300 transition font-medium"
                                >
                                    Fechar
                                </button>
                                <button
                                    onClick={() => handleConfirmDelivery(notification.order.id)}
                                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                                >
                                    ✅ Entregar Agora
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="container mx-auto px-4 py-4">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-green-600">🧑‍🍳 Funcionário - Hulk Lanches</h1>
                        <div className="text-sm text-gray-500">
                            {activeOrders.filter(o => o.status === 'pronto').length} pedidos prontos para entrega
                        </div>
                    </div>
                    <button
                        onClick={onLogout}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
                    >
                        Sair
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Produtos */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
                            <div className="flex flex-wrap gap-2 mb-4">
                                <button
                                    className={`px-3 py-1 rounded-lg text-sm transition ${
                                        !selectedCategory ? 'bg-green-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
                                    }`}
                                    onClick={() => setSelectedCategory(null)}
                                >
                                    🍔 Todos
                                </button>
                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        className={`px-3 py-1 rounded-lg text-sm transition ${
                                            selectedCategory === cat.id ? 'bg-green-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
                                        }`}
                                        onClick={() => setSelectedCategory(cat.id)}
                                    >
                                        {cat.icon} {cat.name}
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {allItems.length === 0 ? (
                                    <div className="col-span-3 text-center py-8 text-gray-500">
                                        Nenhum produto disponível
                                    </div>
                                ) : (
                                    allItems.map(item => (
                                        <div
                                            key={item.id}
                                            className={`bg-gray-50 rounded-lg p-3 cursor-pointer hover:shadow-md transition border-2 border-transparent hover:border-green-500 ${
                                                item.isCombo ? 'border-blue-200 bg-blue-50' : ''
                                            }`}
                                            onClick={() => addToCart(item)}
                                        >
                                            <div className="flex items-center gap-1">
                                                {item.isCombo && (
                                                    <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded">🍔 Combo</span>
                                                )}
                                                <div className="font-bold text-sm">{item.name}</div>
                                            </div>
                                            <div className="text-xs text-gray-600 line-clamp-2 min-h-[32px]">
                                                {item.description}
                                            </div>
                                            <div className="text-green-600 font-bold mt-1">
                                                R$ {formatPrice(item.price)}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                Estoque: {item.stock || 0}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Carrinho */}
                    <div className="bg-white rounded-lg shadow-md p-4 h-fit sticky top-4">
                        <h2 className="text-xl font-bold mb-4">🛒 Pedido Atual</h2>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Mesa *</label>
                            <input
                                type="number"
                                value={tableNumber}
                                onChange={(e) => setTableNumber(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                placeholder="Número da mesa"
                                min="1"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Cliente</label>
                            <input
                                type="text"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                placeholder="Nome do cliente (opcional)"
                            />
                        </div>

                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {cart.length === 0 ? (
                                <p className="text-center text-gray-400 py-8 text-sm">
                                    Carrinho vazio<br/>
                                    <span className="text-xs">Clique nos produtos para adicionar</span>
                                </p>
                            ) : (
                                cart.map(item => (
                                    <div key={item.id} className="flex items-center justify-between border-b pb-2">
                                        <div className="flex-1">
                                            <div className="font-medium text-sm">{item.name}</div>
                                            {item.isCombo && (
                                                <span className="text-xs text-blue-500">🍔 Combo</span>
                                            )}
                                            <div className="flex items-center gap-2 mt-1">
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                    className="bg-gray-200 hover:bg-gray-300 w-6 h-6 rounded-full flex items-center justify-center text-sm"
                                                >
                                                    -
                                                </button>
                                                <span className="w-8 text-center text-sm">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    className="bg-gray-200 hover:bg-gray-300 w-6 h-6 rounded-full flex items-center justify-center text-sm"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-sm">
                                                R$ {formatPrice(item.price * item.quantity)}
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(item.id)}
                                                className="text-red-500 text-xs hover:text-red-700"
                                            >
                                                Remover
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {cart.length > 0 && (
                            <div className="mt-4 border-t pt-4">
                                <div className="flex justify-between text-xl font-bold">
                                    <span>Total:</span>
                                    <span className="text-green-600">R$ {formatPrice(calculateTotal())}</span>
                                </div>
                                <button
                                    onClick={handleSubmitOrder}
                                    disabled={submitting}
                                    className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
                                >
                                    {submitting ? 'Enviando...' : '🚀 Enviar Pedido'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Pedidos Ativos */}
                <div className="mt-8">
                    <h2 className="text-xl font-bold mb-4">📋 Pedidos Ativos</h2>
                    {activeOrders.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
                            Nenhum pedido ativo no momento
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {activeOrders.map(order => (
                                <div key={order.id} className={`bg-white rounded-lg shadow-md p-4 border-2 ${
                                    order.status === 'pronto' ? 'border-green-500 shadow-lg bg-green-50' : 'border-gray-200'
                                }`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="font-bold">Mesa {order.table_number}</span>
                                            <div className="text-sm text-gray-500">Pedido #{order.id}</div>
                                        </div>
                                        <span className={`text-sm font-medium ${getStatusColor(order.status)}`}>
                                            {getStatusText(order.status)}
                                        </span>
                                    </div>
                                    <div className="mt-2 text-sm">
                                        {order.items && order.items.map(item => (
                                            <div key={item.id} className="flex justify-between">
                                                <span>{item.quantity}x {item.product_name}</span>
                                                <span>R$ {formatPrice(item.unit_price * item.quantity)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-2 pt-2 border-t flex justify-between font-bold">
                                        <span>Total:</span>
                                        <span className="text-green-600">R$ {formatPrice(order.total)}</span>
                                    </div>
                                    {order.status === 'pronto' ? (
                                        <div className="mt-3 flex flex-col gap-2">
                                            <div className="text-center text-green-600 font-bold text-sm animate-pulse">
                                                ✅ PRONTO PARA ENTREGAR!
                                            </div>
                                            <button
                                                onClick={() => handleConfirmDelivery(order.id)}
                                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition text-sm"
                                            >
                                                📦 Confirmar Entrega
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="mt-2 text-center text-gray-500 text-xs">
                                            {order.status === 'pendente' ? '⏳ Aguardando preparo' : '🔧 Em preparo'}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* CSS para animação */}
            <style>{`
                @keyframes bounceIn {
                    0% { transform: scale(0.5); opacity: 0; }
                    50% { transform: scale(1.05); }
                    70% { transform: scale(0.95); }
                    100% { transform: scale(1); opacity: 1; }
                }
                .animate-bounce-in {
                    animation: bounceIn 0.5s ease-out;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
                .animate-pulse {
                    animation: pulse 1.5s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}

export default Funcionario;