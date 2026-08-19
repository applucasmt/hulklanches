import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

function ReportsTab() {
    const [salesData, setSalesData] = useState(null);
    const [stockData, setStockData] = useState(null);
    const [paymentData, setPaymentData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('day');

    useEffect(() => {
        loadReports();
    }, [period]);

    const loadReports = async () => {
        setLoading(true);
        try {
            const [sales, stock, payments] = await Promise.all([
                api.get(`/reports/sales?period=${period}`),
                api.get('/reports/stock'),
                api.get('/reports/payments')
            ]);
            setSalesData(sales.data);
            setStockData(stock.data);
            setPaymentData(payments.data);
        } catch (error) {
            console.error('Erro ao carregar relatórios:', error);
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
        return <div className="text-center py-8">Carregando relatórios...</div>;
    }

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold">📊 Relatórios</h2>

            {/* Filtros */}
            <div className="bg-white rounded-lg shadow-md p-4">
                <div className="flex gap-4 items-center">
                    <label className="font-medium">Período:</label>
                    <select 
                        value={period} 
                        onChange={(e) => setPeriod(e.target.value)}
                        className="px-4 py-2 border rounded-lg"
                    >
                        <option value="day">Hoje</option>
                        <option value="week">Últimos 7 dias</option>
                        <option value="month">Últimos 30 dias</option>
                    </select>
                </div>
            </div>

            {/* Resumo de Vendas */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold mb-4">📈 Resumo de Vendas</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">Total de Pedidos</p>
                        <p className="text-2xl font-bold text-green-600">
                            {salesData?.summary?.total_orders || 0}
                        </p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">Receita Total</p>
                        <p className="text-2xl font-bold text-blue-600">
                            R$ {formatPrice(salesData?.summary?.total_revenue)}
                        </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">Ticket Médio</p>
                        <p className="text-2xl font-bold text-purple-600">
                            R$ {formatPrice(salesData?.summary?.average_ticket)}
                        </p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">Clientes Únicos</p>
                        <p className="text-2xl font-bold text-orange-600">
                            {salesData?.summary?.unique_customers || 0}
                        </p>
                    </div>
                </div>
            </div>

            {/* Top Produtos */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold mb-4">🏆 Top 10 Produtos Mais Vendidos</h3>
                <div className="space-y-2">
                    {salesData?.topProducts?.length > 0 ? (
                        salesData.topProducts.map((product, index) => (
                            <div key={index} className="flex justify-between items-center border-b py-2">
                                <span>{index + 1}. {product.name}</span>
                                <div className="flex gap-4">
                                    <span className="text-green-600">{product.total_sold} vendidos</span>
                                    <span className="text-blue-600">R$ {formatPrice(product.total_revenue)}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500">Nenhum dado disponível</p>
                    )}
                </div>
            </div>

            {/* Estoque */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold mb-4">📦 Resumo de Estoque</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">Total</p>
                        <p className="text-2xl font-bold">{stockData?.summary?.total_products || 0}</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">Esgotado</p>
                        <p className="text-2xl font-bold text-red-600">{stockData?.summary?.out_of_stock || 0}</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">Baixo Estoque</p>
                        <p className="text-2xl font-bold text-yellow-600">{stockData?.summary?.low_stock || 0}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">Em Estoque</p>
                        <p className="text-2xl font-bold text-green-600">{stockData?.summary?.high_stock || 0}</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">Unidades</p>
                        <p className="text-2xl font-bold text-blue-600">{stockData?.summary?.total_units || 0}</p>
                    </div>
                </div>
                {stockData?.products?.length > 0 && (
                    <div className="mt-4 max-h-60 overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="text-left px-3 py-2">Produto</th>
                                    <th className="text-left px-3 py-2">Categoria</th>
                                    <th className="text-right px-3 py-2">Estoque</th>
                                    <th className="text-right px-3 py-2">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stockData.products.slice(0, 10).map(product => (
                                    <tr key={product.id} className="border-b">
                                        <td className="px-3 py-2">{product.name}</td>
                                        <td className="px-3 py-2">{product.category_name}</td>
                                        <td className="px-3 py-2 text-right">{product.stock}</td>
                                        <td className="px-3 py-2 text-right">
                                            <span className={`px-2 py-1 rounded-full text-xs ${
                                                product.stock_status === 'Esgotado' ? 'bg-red-100 text-red-800' :
                                                product.stock_status === 'Baixo' ? 'bg-yellow-100 text-yellow-800' :
                                                product.stock_status === 'Médio' ? 'bg-orange-100 text-orange-800' :
                                                'bg-green-100 text-green-800'
                                            }`}>
                                                {product.stock_status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Métodos de Pagamento */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold mb-4">💳 Pagamentos por Método</h3>
                <div className="space-y-2">
                    {paymentData?.methods?.length > 0 ? (
                        paymentData.methods.map((method, index) => (
                            <div key={index} className="flex justify-between items-center border-b py-2">
                                <span>{method.method}</span>
                                <div className="flex gap-4">
                                    <span>{method.total_payments} pedidos</span>
                                    <span className="text-green-600">R$ {formatPrice(method.total_amount)}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500">Nenhum dado disponível</p>
                    )}
                </div>
                {paymentData?.summary?.total_payments > 0 && (
                    <div className="mt-4 pt-4 border-t flex justify-between font-bold">
                        <span>Total Geral:</span>
                        <span className="text-green-600">R$ {formatPrice(paymentData.summary.total_revenue)}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ReportsTab;