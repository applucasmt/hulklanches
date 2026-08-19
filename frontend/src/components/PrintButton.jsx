import React from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function PrintButton({ order }) {
    const handlePrint = () => {
        const doc = new jsPDF();
        
        // Cabeçalho
        doc.setFillColor(22, 163, 74);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text('🍔 Hulk Lanches', 14, 20);
        doc.setFontSize(12);
        doc.text('Sistema de Atendimento', 14, 32);
        
        // Dados do pedido
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.text(`Pedido #${order.id}`, 14, 55);
        doc.setFontSize(11);
        doc.text(`Mesa: ${order.table_number}`, 14, 65);
        doc.text(`Data: ${new Date(order.created_at).toLocaleString()}`, 14, 72);
        doc.text(`Status: ${order.status}`, 14, 79);
        doc.text(`Funcionário: ${order.user_name || 'N/A'}`, 14, 86);
        if (order.customer_name) {
            doc.text(`Cliente: ${order.customer_name}`, 14, 93);
        }
        
        // Itens do pedido com a proteção Number()
        const tableData = order.items?.map(item => [
            `${item.quantity}x ${item.product_name}`,
            `R$ ${Number(item.price || item.unit_price * item.quantity).toFixed(2)}`
        ]) || [];
        
        doc.autoTable({
            startY: 100,
            head: [['Item', 'Total']],
            body: tableData,
            foot: [['Total', `R$ ${Number(order.total || 0).toFixed(2)}`]], // Proteção Number() aplicada aqui
            theme: 'striped',
            headStyles: { fillColor: [22, 163, 74] },
            footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
        });
        
        // Rodapé
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(12);
        doc.text('✅ Obrigado pela preferência!', 14, finalY);
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text('Hulk Lanches - Qualidade que alimenta', 14, finalY + 7);
        doc.text('📱 Siga nossas redes sociais', 14, finalY + 14);
        
        // Salvar
        doc.save(`pedido_${order.id}.pdf`);
    };

    return (
        <button
            onClick={handlePrint}
            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1 transition"
        >
            🖨️ Imprimir
        </button>
    );
}

export default PrintButton;