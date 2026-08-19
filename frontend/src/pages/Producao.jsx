import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { socket } from '../services/socket';
import PrintButton from '../components/PrintButton';

function Producao({ onLogout }) {
    const [orders, setOrders] = useState([]);
    const [filterStatus, setFilterStatus] = useState('todos');
    const [loading, setLoading] = useState(true);
    const [newOrderAlert, setNewOrderAlert] = useState(null);
    const [notification, setNotification] = useState(null);

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
            
            if (type === 'new_order') {
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
            } else if (type === 'order_updated') {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.1);
                
                gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.2);
            }
        } catch (error) {
            console.log('🔇 Som não disponível:', error);
        }
    };

    useEffect(() => {
        loadPendingOrders();
        
        socket.connect();
        
        socket.on('new_order', (order) => {
            console.log('🆕 Novo pedido recebido:', order);
            setOrders(prev => [order, ...prev]);
            setNewOrderAlert(order.id);
            
            playSound('new_order');
            
            setNotification({
                message: `📦 Novo pedido #${order.id} da Mesa ${order.table_number}!`,
                type: 'new'
            });
            
            setTimeout(() => setNotification(null), 5000);
        });
        
        socket.on('order_updated', (updatedOrder) => {
            console.log('🔄 Pedido atualizado:', updatedOrder);
            
            // SE O PEDIDO FOI ENTREGUE, REMOVER DA LISTA
            if (updatedOrder.status === 'entregue') {
                setOrders(prev => prev.filter(order => order.id !== updatedOrder.id));
                console.log(`🗑️ Pedido #${updatedOrder.id} removido da produção (entregue)`);
            } else {
                // Caso contrário, atualizar o pedido
                setOrders(prev => prev.map(order => 
                    order.id === updatedOrder.id ? updatedOrder : order
                ));
            }
            
            playSound('order_updated');
        });
        
        return () => {
            socket.disconnect();
            socket.off('new_order');
            socket.off('order_updated');
        };
    }, []);

    const loadPendingOrders = async () => {
        try {
            const response = await api.get('/orders/pending');
            // Filtrar pedidos entregues também no carregamento inicial
            setOrders(response.data.filter(o => o.status !== 'entregue'));
        } catch (error) {
            console.error('Erro ao carregar pedidos:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (orderId, status) => {
        try {
            await api.put(`/orders/${orderId}/status`, { status });
        } catch (error) {
            alert('❌ Erro ao atualizar status do pedido');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pendente': return 'bg-yellow-500';
            case 'em_preparo': return 'bg-blue-500';
            case 'pronto': return 'bg-green-500';
            case 'entregue': return 'bg-gray-500';
            default: return 'bg-gray-300';
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

    const getStatusBg = (status) => {
        switch (status) {
            case 'pendente': return 'bg-yellow-50 border-yellow-200';
            case 'em_preparo': return 'bg-blue-50 border-blue-200';
            case 'pronto': return 'bg-green-50 border-green-200';
            case 'entregue': return 'bg-gray-50 border-gray-200';
            default: return 'bg-white';
        }
    };

    const getTimeElapsed = (createdAt) => {
        const now = new Date();
        const created = new Date(createdAt);
        const diff = Math.floor((now - created) / 60000);
        if (diff < 1) return 'Agora mesmo';
        if (diff === 1) return '1 min';
        return `${diff} min`;
    };

    const filteredOrders = filterStatus === 'todos' 
        ? orders 
        : orders.filter(order => order.status === filterStatus);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-xl text-gray-500">📦 Carregando pedidos...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Notificação */}
            {notification && (
                <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transition-all duration-300 ${
                    notification.type === 'new' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'
                }`}>
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🔔</span>
                        <div>
                            <p className="font-bold">{notification.message}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg sticky top-0 z-30">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">👨‍🍳 Produção - Hulk Lanches</h1>
                        <div className="text-sm opacity-80">
                            {orders.filter(o => o.status === 'pendente').length} pendentes • 
                            {orders.filter(o => o.status === 'em_preparo').length} em preparo • 
                            {orders.filter(o => o.status === 'pronto').length} prontos
                        </div>
                    </div>
                    <button
                        onClick={onLogout}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
                    >
                        Sair
                    </button>
                </div>
            </header>

            {/* Filtros */}
            <div className="container mx-auto px-4 py-4">
                <div className="flex flex-wrap gap-2 bg-white rounded-lg shadow-md p-4">
                    <button
                        className={`px-4 py-2 rounded-lg transition ${
                            filterStatus === 'todos' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                        onClick={() => setFilterStatus('todos')}
                    >
                        📋 Todos ({orders.length})
                    </button>
                    <button
                        className={`px-4 py-2 rounded-lg transition ${
                            filterStatus === 'pendente' 
                                ? 'bg-yellow-500 text-white' 
                                : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                        onClick={() => setFilterStatus('pendente')}
                    >
                        ⏳ Pendentes ({orders.filter(o => o.status === 'pendente').length})
                    </button>
                    <button
                        className={`px-4 py-2 rounded-lg transition ${
                            filterStatus === 'em_preparo' 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                        onClick={() => setFilterStatus('em_preparo')}
                    >
                        🔧 Em Preparo ({orders.filter(o => o.status === 'em_preparo').length})
                    </button>
                    <button
                        className={`px-4 py-2 rounded-lg transition ${
                            filterStatus === 'pronto' 
                                ? 'bg-green-500 text-white' 
                                : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                        onClick={() => setFilterStatus('pronto')}
                    >
                        ✅ Prontos ({orders.filter(o => o.status === 'pronto').length})
                    </button>
                </div>
            </div>

            {/* Pedidos */}
            <div className="container mx-auto px-4 pb-8">
                {filteredOrders.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-lg shadow-md">
                        <div className="text-6xl mb-4">🎉</div>
                        <h3 className="text-2xl font-bold text-gray-600">Nenhum pedido {filterStatus !== 'todos' ? getStatusText(filterStatus).toLowerCase() : ''}</h3>
                        <p className="text-gray-400 mt-2">Aguarde novos pedidos chegarem</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredOrders.map(order => (
                            <div 
                                key={order.id} 
                                className={`bg-white rounded-lg shadow-md overflow-hidden border-2 transition ${
                                    getStatusBg(order.status)
                                } ${newOrderAlert === order.id ? 'ring-4 ring-yellow-400 animate-pulse' : ''}`}
                            >
                                {/* Header do Pedido */}
                                <div className={`${getStatusColor(order.status)} text-white px-4 py-3 flex justify-between items-center`}>
                                    <div>
                                        <span className="font-bold text-lg">Mesa {order.table_number}</span>
                                        <span className="ml-3 text-sm opacity-90">#{order.id}</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold">{getStatusText(order.status)}</div>
                                        <div className="text-xs opacity-80">
                                            ⏱️ {getTimeElapsed(order.created_at)}
                                        </div>
                                    </div>
                                </div>

                                {/* Corpo */}
                                <div className="p-4">
                                    <div className="text-sm text-gray-600 mb-2">
                                        {order.user_name && <span>👤 {order.user_name}</span>}
                                        {order.customer_name && <span className="ml-2">👤 {order.customer_name}</span>}
                                    </div>

                                    <div className="border-t border-b py-2 mb-3">
                                        {order.items && order.items.map(item => (
                                            <div key={item.id} className="flex justify-between py-1 text-sm">
                                                <span>{item.quantity}x {item.product_name}</span>
                                                <span className="font-medium">R$ {formatPrice(item.price || item.unit_price * item.quantity)}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex justify-between font-bold text-lg mb-3">
                                        <span>Total:</span>
                                        <span className="text-green-600">R$ {formatPrice(order.total)}</span>
                                    </div>

                                    {/* Botões de Ação */}
                                    <div className="flex gap-2 flex-wrap">
                                        <PrintButton order={order} />

                                        {order.status === 'pendente' && (
                                            <button
                                                onClick={() => updateOrderStatus(order.id, 'em_preparo')}
                                                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm transition"
                                            >
                                                🔧 Iniciar Preparo
                                            </button>
                                        )}
                                        
                                        {order.status === 'em_preparo' && (
                                            <button
                                                onClick={() => updateOrderStatus(order.id, 'pronto')}
                                                className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm transition"
                                            >
                                                ✅ Marcar Pronto
                                            </button>
                                        )}
                                        
                                        {order.status === 'pronto' && (
                                            <button
                                                onClick={() => updateOrderStatus(order.id, 'entregue')}
                                                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm transition"
                                            >
                                                📦 Entregar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.02); }
                }
                .animate-pulse {
                    animation: pulse 1s ease-in-out 3;
                }
            `}</style>
        </div>
    );
}

export default Producao;