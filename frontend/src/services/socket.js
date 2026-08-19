import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

export const socket = io(SOCKET_URL, {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
});

socket.on('connect', () => {
    console.log('🔌 WebSocket conectado!');
});

socket.on('disconnect', () => {
    console.log('🔌 WebSocket desconectado!');
});

socket.on('connect_error', (error) => {
    console.error('❌ Erro na conexão WebSocket:', error);
});

// Eventos customizados
socket.on('new_order', (order) => {
    console.log('📦 Novo pedido:', order.id);
});

socket.on('order_updated', (order) => {
    console.log('🔄 Pedido atualizado:', order.id);
});