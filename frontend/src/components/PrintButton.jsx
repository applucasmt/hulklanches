import React from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function PrintButton({ order }) {
    const formatPrice = (price) => {
        if (price === null || price === undefined) return '0,00';
        const num = typeof price === 'string' ? parseFloat(price) : price;
        return isNaN(num) ? '0,00' : num.toFixed(2);
    };

    const handlePrint = () => {
        const doc = new jsPDF();
        doc.setFillColor(22, 163, 74);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text('🍔 Hulk Lanches', 14, 20);
        doc.setFontSize(12);
        doc.text('Sistema de Atendimento', 14, 32);
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.text(`Pedido #${order.id}`, 14, 55);
        doc.setFontSize(11);
        doc.text(`Mesa: ${order.table_number}`, 14, 65);
        doc.text(`Data: ${new Date(order.created_at).toLocaleString()}`, 14, 72);
        doc.text(`Status: ${order.status}`, 14, 79);
        doc.text(`Funcionário: ${order.user_name || 'N/A'}`, 14, 86);
        if (order.customer_name) doc.text(`Cliente: ${order.customer_name}`, 14, 93);
        
        const tableData = order.items?.map(item => [
            `${item.quantity}x ${item.product_name}`,
            `R$ ${formatPrice(item.price || item.unit_price * item.quantity)}`
        ]) || [];
        
        doc.autoTable({ startY: 100, head: [['Item', 'Total']], body: tableData, foot: [['Total', `R$ ${formatPrice(order.total)}`]], theme: 'striped', headStyles: { fillColor: [22, 163, 74] } });
        doc.save(`pedido_${order.id}.pdf`);
    };

    return <button onClick={handlePrint} className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm">🖨️ Imprimir</button>;
}

export default PrintButton;
