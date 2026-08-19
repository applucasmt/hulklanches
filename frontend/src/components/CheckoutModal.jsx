import React, { useState } from 'react';

function CheckoutModal({ isOpen, onClose, onSubmit, total, orderSuccess }) {
    const [customerName, setCustomerName] = useState('');
    const [tableNumber, setTableNumber] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Dinheiro');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const paymentMethods = ['Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'PIX', 'Vale Refeição'];

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!customerName.trim()) {
            alert('⚠️ Por favor, informe seu nome');
            return;
        }
        
        const tableNum = parseInt(tableNumber);
        if (!tableNumber || isNaN(tableNum) || tableNum <= 0) {
            alert('⚠️ Por favor, informe o número da mesa');
            return;
        }
        
        setIsSubmitting(true);
        try {
            await onSubmit({ 
                customer_name: customerName.trim(), 
                table_number: tableNum, 
                payment_method: paymentMethod 
            });
        } catch (error) {
            console.error('Erro ao finalizar:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const formatPrice = (price) => {
        if (price === null || price === undefined) return '0,00';
        const num = typeof price === 'string' ? parseFloat(price) : price;
        return isNaN(num) ? '0,00' : num.toFixed(2);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
                {orderSuccess ? (
                    <>
                        <div className="text-center">
                            <div className="text-6xl mb-4">✅</div>
                            <h3 className="text-2xl font-bold text-green-600">Pedido Finalizado!</h3>
                            <p className="text-gray-600 mt-2">
                                Seu pedido foi enviado para produção.
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                Total: R$ {formatPrice(total)}
                            </p>
                        </div>
                        <button
                            onClick={() => { onClose(); }}
                            className="w-full mt-6 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                        >
                            Voltar ao Cardápio
                        </button>
                    </>
                ) : (
                    <>
                        <h3 className="text-2xl font-bold mb-4">📋 Finalizar Pedido</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Seu Nome *</label>
                                    <input
                                        type="text"
                                        required
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                        placeholder="Digite seu nome"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Número da Mesa *</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={tableNumber}
                                        onChange={(e) => setTableNumber(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                        placeholder="Ex: 5"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Forma de Pagamento</label>
                                    <select
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                    >
                                        {paymentMethods.map(method => (
                                            <option key={method} value={method}>{method}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                                    <span>Total:</span>
                                    <span className="text-green-600">R$ {formatPrice(total)}</span>
                                </div>
                            </div>
                            <div className="flex gap-2 mt-6">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 px-4 py-3 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Enviando...' : '✅ Finalizar Pedido'}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}

export default CheckoutModal;