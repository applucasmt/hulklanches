import React, { useState } from 'react';

function CheckoutModal({ isOpen, onClose, onSubmit, total, orderSuccess }) {
    const [customerName, setCustomerName] = useState('');
    const [tableNumber, setTableNumber] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Dinheiro');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const paymentMethods = ['Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'PIX', 'Vale Refeição'];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!customerName.trim() || !tableNumber || isNaN(parseInt(tableNumber)) || parseInt(tableNumber) <= 0) {
            alert('⚠️ Preencha todos os campos corretamente');
            return;
        }
        setIsSubmitting(true);
        await onSubmit({ customer_name: customerName, table_number: parseInt(tableNumber), payment_method: paymentMethod });
        setIsSubmitting
