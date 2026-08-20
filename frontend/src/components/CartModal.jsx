import React from 'react';

function CartModal({ cart, onClose, onUpdateQuantity, onRemoveItem, onSubmitOrder, total }) {
    const formatPrice = (price) => {
        if (price === null || price === undefined) return '0,00';
        const num = typeof price === 'string' ? parseFloat(price) : price;
        return isNaN(num) ? '0,00' : num.toFixed(2);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold">🛒 Meu Carrinho</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.length === 0 ? (
                        <div className="text-center text-gray-500 py-8"><p className="text-4xl mb-2">🛒</p><p>Seu carrinho está vazio</p></div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className="flex items-center justify-between border-b pb-3">
                                <div className="flex-1">
                                    <div className="font-medium">{item.name}</div>
                                    <div className="text-sm text-gray-500">R$ {formatPrice(item.price)}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => onUpdateQuantity(item.id, item.quantity - 1)} className="bg-gray-200 hover:bg-gray-300 w-8 h-8 rounded-full flex items-center justify-center">-</button>
                                    <span className="w-8 text-center">{item.quantity}</span>
                                    <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1)} className="bg-gray-200 hover:bg-gray-300 w-8 h-8 rounded-full flex items-center justify-center">+</button>
                                    <button onClick={() => onRemoveItem(item.id)} className="text-red-500 hover:text-red-700 ml-2">✖</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div className="p-4 border-t">
                    <div className="flex justify-between text-xl font-bold mb-4">
                        <span>Total:</span>
                        <span className="text-green-600">R$ {formatPrice(total)}</span>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="flex-1 px-4 py-3 bg-gray-200 rounded-lg hover:bg-gray-300">Continuar</button>
                        <button onClick={onSubmitOrder} disabled={cart.length === 0} className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">Finalizar</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CartModal;
