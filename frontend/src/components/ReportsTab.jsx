import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

function ReportsTab() {
    const [salesData, setSalesData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadReports();
    }, []);

    const loadReports = async () => {
        try {
            const response = await api.get('/reports/sales?period=day');
            setSalesData(response.data);
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

    if (loading) return <div className="text-center py-8">Carregando relatórios...</div>;

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">📊 Relatórios</h2>
            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold mb-4">📈 Resumo de Vendas</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">Total de Pedidos</p>
                        <p className="text-2xl font-bold text-green-600">{salesData?.summary?.total_orders || 0}</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">Receita Total</p>
                        <p className="text-2xl font-bold text-blue-600">R$ {formatPrice(salesData?.summary?.total_revenue)}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">Ticket Médio</p>
                        <p className="text-2xl font-bold text-purple-600">R$ {formatPrice(salesData?.summary?.average_ticket)}</p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">Clientes</p>
                        <p className="text-2xl font-bold text-orange-600">{salesData?.summary?.unique_customers || 0}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ReportsTab;
