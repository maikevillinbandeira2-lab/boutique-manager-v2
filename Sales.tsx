import React, { useState, useMemo, useEffect } from 'react';
import { Sale, Product, Customer, Seller, SaleItem, PaymentDetail, PaymentType, CustomerStatus, CustomerSource, Installment } from '../types';
import Modal from './ui/Modal';

interface SaleFormProps {
    sale: Sale | null;
    products: Product[];
    customers: Customer[];
    sellers: Seller[];
    onSave: (sale: Sale) => void;
    onClose: () => void;
    onCustomerSave: (customer: Customer) => void;
    onRequestDelete?: (sale: Sale) => void;
}

const SaleForm: React.FC<SaleFormProps> = ({ sale, products, customers, sellers, onSave, onClose, onCustomerSave, onRequestDelete }) => {
    const [date, setDate] = useState(sale ? sale.date : new Date());
    const [sellerId, setSellerId] = useState(sale ? sale.sellerId : '');
    const [sellerOther, setSellerOther] = useState(sale ? sale.sellerNameOverride || '' : '');
    const [customerInput, setCustomerInput] = useState('');
    const [currentSaleItems, setCurrentSaleItems] = useState<SaleItem[]>(sale ? sale.items : []);
    const [payments, setPayments] = useState<PaymentDetail[]>(sale ? sale.payments : []);
    
    const [productSearch, setProductSearch] = useState('');
    const [productToAdd, setProductToAdd] = useState('');
    const [quantityToAdd, setQuantityToAdd] = useState(1);

    useEffect(() => {
        if(sale) {
            const customerName = customers.find(c => c.id === sale.customerId)?.name || '';
            setCustomerInput(customerName);
            setDate(sale.date);
            setSellerId(sale.sellerId);
            setSellerOther(sale.sellerNameOverride || '');
            setCurrentSaleItems(sale.items);
            setPayments(sale.payments);
        } else {
            // Reset form for new sale
             setDate(new Date());
             setSellerId('');
             setSellerOther('');
             setCustomerInput('');
             setCurrentSaleItems([]);
             setPayments([]);
        }
    }, [sale, customers]);

    const total = useMemo(() => {
        return currentSaleItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
    }, [currentSaleItems]);
    
    const totalPaid = useMemo(() => {
        return payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    }, [payments]);

    const difference = total - totalPaid;

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const dateStr = e.target.value;
        if (dateStr) {
            // 'YYYY-MM-DD' string from date picker is treated as UTC midnight.
            // We need to adjust for the local timezone to avoid off-by-one day errors.
            const dateInUTC = new Date(dateStr);
            const correctedDate = new Date(dateInUTC.getTime() + dateInUTC.getTimezoneOffset() * 60000);
            
            // Preserve the time from the original date state
            correctedDate.setHours(date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
            
            setDate(correctedDate);
        }
    };
    
    const handleAddItem = () => {
        const product = products.find(p => p.id === productToAdd);
        if (!product || quantityToAdd <= 0) return;

        const currentQuantityInCart = currentSaleItems.find(item => item.productId === product.id)?.quantity || 0;
        
        let availableStock = product.quantity;
        // If editing a sale, the items already in the original sale are available to be "used" again.
        if (sale) {
            const originalItem = sale.items.find(item => item.productId === product.id);
            if (originalItem) {
                availableStock += originalItem.quantity;
            }
        }

        if (currentQuantityInCart + quantityToAdd > availableStock) {
            alert(`Estoque insuficiente para "${product.name}". Disponível: ${availableStock}. No carrinho: ${currentQuantityInCart}.`);
            return;
        }

        const existingItemIndex = currentSaleItems.findIndex(item => item.productId === product.id);

        if (existingItemIndex > -1) {
            const updatedItems = [...currentSaleItems];
            updatedItems[existingItemIndex].quantity += quantityToAdd;
            setCurrentSaleItems(updatedItems);
        } else {
            setCurrentSaleItems(prev => [...prev, {
                productId: product.id,
                quantity: quantityToAdd,
                unitPrice: product.price
            }]);
        }
        setProductSearch('');
        setProductToAdd('');
        setQuantityToAdd(1);
    };

    const handleRemoveItem = (productId: string) => {
        setCurrentSaleItems(prev => prev.filter(item => item.productId !== productId));
    };

    const handleAddPayment = () => {
        setPayments(prev => [...prev, {
            id: `pay-${Date.now()}`,
            type: PaymentType.Pix,
            amount: difference > 0 ? difference : 0,
        }]);
    };
    
    const handlePaymentChange = (id: string, field: keyof PaymentDetail, value: any) => {
        setPayments(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const handleRemovePayment = (id: string) => {
        setPayments(prev => prev.filter(p => p.id !== id));
    };

    const handleAddPrazoDate = (id: string) => {
        setPayments(prev => prev.map(p => {
            if (p.id === id) {
                const newDates = [...(p.paymentDates || []), { date: new Date().toISOString().split('T')[0], status: 'Pendente' as const }];
                return { ...p, paymentDates: newDates };
            }
            return p;
        }));
    };
    
    const handlePrazoDateChange = (id: string, index: number, value: string) => {
        setPayments(prev => prev.map(p => {
            if (p.id === id) {
                const newDates = [...(p.paymentDates || [])];
                newDates[index] = { ...newDates[index], date: value };
                return { ...p, paymentDates: newDates };
            }
            return p;
        }));
    };

    const handleRemovePrazoDate = (id: string, index: number) => {
        setPayments(prev => prev.map(p => {
            if (p.id === id) {
                const newDates = [...(p.paymentDates || [])];
                newDates.splice(index, 1);
                return { ...p, paymentDates: newDates };
            }
            return p;
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (currentSaleItems.length === 0 || !sellerId || !customerInput) {
            alert("Preencha cliente, vendedor e adicione ao menos um produto.");
            return;
        }
        if (Math.abs(difference) > 0.01) {
             alert("O valor total pago deve ser igual ao total da venda.");
            return;
        }

        let saleCustomerId = '';
        const existingCustomer = customers.find(c => c.name.toLowerCase() === customerInput.trim().toLowerCase());
        if (existingCustomer) {
            saleCustomerId = existingCustomer.id;
        } else {
            const newCustomer: Customer = { id: `cust-${Date.now()}`, name: customerInput.trim(), phone: '', status: CustomerStatus.Nova, source: CustomerSource.Outros, createdAt: new Date() };
            onCustomerSave(newCustomer);
            saleCustomerId = newCustomer.id;
        }

        const isOtherSeller = sellers.find(s => s.id === sellerId)?.name === 'Outros';

        onSave({
            id: sale?.id || `sale-${Date.now()}`,
            date: date,
            sellerId,
            customerId: saleCustomerId,
            sellerNameOverride: isOtherSeller ? sellerOther : undefined,
            items: currentSaleItems,
            total,
            payments
        });
        onClose();
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Data da Venda</label>
                        <input 
                            type="date" 
                            value={date.toISOString().split('T')[0]} 
                            onChange={handleDateChange}
                            required 
                            className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Cliente</label>
                        <input type="text" list="customer-list" value={customerInput} onChange={e => setCustomerInput(e.target.value)} required placeholder="Buscar ou criar cliente" className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color"/>
                        <datalist id="customer-list">
                            {customers.filter(c => c.name.toLowerCase().includes(customerInput.toLowerCase())).map(c => <option key={c.id} value={c.name} />)}
                        </datalist>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-text-secondary mb-1">Vendedor(a)</label>
                        <select value={sellerId} onChange={e => setSellerId(e.target.value)} required className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color">
                            <option value="">Selecione</option>
                            {sellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    {sellers.find(s => s.id === sellerId)?.name === 'Outros' && (
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-text-secondary mb-1">Nome (Outros)</label>
                            <input type="text" value={sellerOther} onChange={e => setSellerOther(e.target.value)} placeholder="Nome do vendedor" required className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color"/>
                        </div>
                    )}
                </div>

                <div className="bg-background p-4 rounded-lg border border-border-color space-y-3">
                    <h3 className="font-semibold text-text-primary">Itens da Venda</h3>
                    <div className="flex items-center gap-2">
                        <input type="text" list="product-list" value={productSearch} onChange={e => { setProductSearch(e.target.value); setProductToAdd(products.find(p => p.name === e.target.value)?.id || '') }} placeholder="Buscar produto" className="flex-grow bg-card text-text-primary p-2 rounded border border-border-color" />
                        <datalist id="product-list">
                            {products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).map(p => <option key={p.id} value={p.name} />)}
                        </datalist>
                        <input type="number" value={quantityToAdd} onChange={(e) => setQuantityToAdd(Number(e.target.value))} min="1" className="w-20 bg-card text-text-primary p-2 rounded border border-border-color" />
                        <button type="button" onClick={handleAddItem} className="px-4 py-2 rounded bg-accent text-white hover:opacity-90 transition-opacity">Add</button>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                        {currentSaleItems.map(item => {
                            const product = products.find(p => p.id === item.productId);
                            return (
                                <div key={item.productId} className="flex justify-between items-center bg-card p-2 rounded text-sm">
                                    <div><span className="font-semibold">{product?.name}</span> - {item.quantity} x R${item.unitPrice.toFixed(2)}</div>
                                    <button type="button" onClick={() => handleRemoveItem(item.productId)} className="text-red-500 hover:text-red-400 font-bold px-2">X</button>
                                </div>
                            )
                        })}
                    </div>
                </div>
                
                <div className="bg-background p-4 rounded-lg border border-border-color space-y-3">
                    <h3 className="font-semibold text-text-primary">Pagamento</h3>
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                        {payments.map((p) => (
                            <div key={p.id} className="bg-card p-3 rounded-md space-y-2 border border-border-color">
                               <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
                                    <select value={p.type} onChange={e => handlePaymentChange(p.id, 'type', e.target.value)} className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color">
                                        {Object.values(PaymentType).map(pt => <option key={pt} value={pt}>{pt}</option>)}
                                    </select>
                                    <input type="number" placeholder="Valor" value={p.amount} onChange={e => handlePaymentChange(p.id, 'amount', e.target.value ? parseFloat(e.target.value) : '')} step="0.01" className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color"/>
                                    <button type="button" onClick={() => handleRemovePayment(p.id)} className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition-opacity text-sm">Remover</button>
                               </div>
                               {p.type === PaymentType.Credito && <input type="number" placeholder="Nº de Parcelas" value={p.installments || ''} onChange={e => handlePaymentChange(p.id, 'installments', e.target.value ? parseInt(e.target.value) : undefined)} className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color mt-2"/>}
                               {(p.type === PaymentType.Vale || p.type === PaymentType.TrocaServico) && <input type="text" placeholder="Descrição/Observação" value={p.description || ''} onChange={e => handlePaymentChange(p.id, 'description', e.target.value)} className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color mt-2"/>}
                               {p.type === PaymentType.APrazo && <div className="space-y-2 mt-2">
                                    <label className="text-sm font-medium text-text-secondary">Datas de Pagamento</label>
                                    {p.paymentDates?.map((date, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <input type="date" value={date.date} onChange={e => handlePrazoDateChange(p.id, i, e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color"/>
                                            <button type="button" onClick={() => handleRemovePrazoDate(p.id, i)} className="text-red-500">X</button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => handleAddPrazoDate(p.id)} className="text-sm text-accent hover:opacity-80">+ Adicionar Data</button>
                                </div>}
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={handleAddPayment} className="px-4 py-2 text-sm rounded bg-secondary hover:opacity-90 transition-opacity">+ Adicionar Pagamento</button>
                </div>
            </div>
            
            <div className="pt-4 border-t border-border-color">
                <div className="flex justify-end items-baseline space-x-4 font-bold mb-4">
                     <span className="text-lg">Total: <span className="text-primary">R$ {total.toFixed(2)}</span></span>
                     <span className="text-lg">Pago: <span className="text-green-400">R$ {totalPaid.toFixed(2)}</span></span>
                     <span className={`text-lg ${difference === 0 ? 'text-text-primary' : 'text-red-400'}`}>Diferença: R$ {difference.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                    <div>
                        {sale && onRequestDelete && (
                            <button 
                                type="button" 
                                onClick={() => onRequestDelete(sale)} 
                                className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white transition-opacity"
                            >
                                Excluir Venda
                            </button>
                        )}
                    </div>
                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-secondary text-text-primary hover:opacity-90 transition-opacity">Cancelar</button>
                        <button type="submit" className="px-6 py-3 rounded bg-primary text-white hover:opacity-90 transition-opacity font-semibold">{sale ? 'Salvar Alterações' : 'Registrar Venda'}</button>
                    </div>
                </div>
            </div>
        </form>
    );
};


interface SalesProps {
  sales: Sale[];
  products: Product[];
  customers: Customer[];
  sellers: Seller[];
  onSave: (sale: Sale) => void;
  onDelete: (saleId: string) => void;
  onCustomerSave: (customer: Customer) => void;
}

const Sales: React.FC<SalesProps> = ({ sales, products, customers, sellers, onSave, onDelete, onCustomerSave }) => {
    const [selectedSaleId, setSelectedSaleId] = useState<string | null | 'new'>(null);
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [confirmModalState, setConfirmModalState] = useState<{
        isOpen: boolean;
        title: string;
        message: React.ReactNode;
        confirmText?: string;
        onConfirm?: () => void;
    }>({ isOpen: false, title: '', message: '' });

    const handleSave = (sale: Sale) => {
        onSave(sale);
        setSelectedSaleId(null);
    }
    
    const handleDelete = (saleId: string) => {
        onDelete(saleId);
        setConfirmModalState({ isOpen: false, title: '', message: '' });
        if(selectedSaleId === saleId) {
            setSelectedSaleId(null);
        }
    }

    const handleRequestDelete = (sale: Sale) => {
        const customer = customers.find(c => c.id === sale.customerId);
        setConfirmModalState({
            isOpen: true,
            title: "Confirmar Exclusão de Venda",
            message: (
                <span>
                    Tem certeza que deseja excluir a venda para o cliente <strong>{customer?.name || 'Desconhecido'}</strong> no valor de <strong>R$ {sale.total.toFixed(2)}</strong>? O estoque dos produtos será restaurado.
                </span>
            ),
            confirmText: "Excluir Venda",
            onConfirm: () => handleDelete(sale.id),
        });
    };

    const filteredAndSortedSales = useMemo(() => {
        const filtered = sales.filter(sale => {
            const saleDate = new Date(sale.date);
            
            let startMatch = true;
            if (startDate) {
                const filterStartDate = new Date(startDate);
                filterStartDate.setMinutes(filterStartDate.getMinutes() + filterStartDate.getTimezoneOffset());
                filterStartDate.setHours(0, 0, 0, 0);
                startMatch = saleDate >= filterStartDate;
            }

            let endMatch = true;
            if (endDate) {
                const filterEndDate = new Date(endDate);
                filterEndDate.setMinutes(filterEndDate.getMinutes() + filterEndDate.getTimezoneOffset());
                filterEndDate.setHours(23, 59, 59, 999);
                endMatch = saleDate <= filterEndDate;
            }
            
            return startMatch && endMatch;
        });

        return filtered.sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [sales, startDate, endDate]);

     const selectedSale = useMemo(() => {
        if (selectedSaleId === 'new' || selectedSaleId === null) {
          return null;
        }
        return sales.find(s => s.id === selectedSaleId) ?? null;
    }, [sales, selectedSaleId]);

    return (
        <div className="flex flex-col md:flex-row gap-8 md:h-[calc(100vh-4rem)]">
            <div className="w-full md:w-2/3 flex flex-col">
                <div className="flex justify-between items-center flex-wrap gap-2 mb-4">
                    <h1 className="text-4xl font-bold text-text-primary">Vendas</h1>
                    <button onClick={() => setSelectedSaleId('new')} className="px-4 py-2 rounded-lg bg-primary hover:bg-accent text-white font-semibold transition-colors shadow-md">
                        + Nova Venda
                    </button>
                </div>
                <div className="bg-card p-4 rounded-lg mb-4">
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="flex-grow min-w-[280px]">
                            <label className="block text-sm font-medium text-text-secondary mb-1">Filtrar por Data da Venda</label>
                            <div className="flex items-center gap-2">
                                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color" aria-label="Data de início" />
                                <span className="text-text-secondary">até</span>
                                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color" aria-label="Data de fim" />
                            </div>
                        </div>
                        { (startDate || endDate) && 
                            <div className="flex-shrink-0"><button onClick={() => { setStartDate(''); setEndDate(''); }} className="w-full sm:w-auto px-4 py-2 rounded bg-secondary text-text-primary hover:opacity-90 transition-opacity">Limpar</button></div> }
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto bg-card rounded-lg p-2 space-y-2 border border-border-color">
                    {filteredAndSortedSales.map(sale => {
                        const customer = customers.find(c => c.id === sale.customerId);
                        return (
                            <div
                                key={sale.id}
                                onClick={() => setSelectedSaleId(sale.id)}
                                className={`p-4 rounded-md cursor-pointer transition-colors border-l-4 grid grid-cols-3 gap-4 items-center ${selectedSaleId === sale.id ? 'bg-background border-primary shadow-md' : 'border-transparent hover:bg-background'}`}
                            >
                                <div>
                                    <p className="font-semibold">{customer?.name || 'Cliente não encontrado'}</p>
                                    <p className={`text-sm ${selectedSaleId === sale.id ? 'text-gray-300' : 'text-text-secondary'}`}>{new Date(sale.date).toLocaleDateString('pt-BR')}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-text-secondary">Itens</p>
                                    <p className="font-medium">{sale.items.reduce((sum, item) => sum + item.quantity, 0)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-text-secondary">Total</p>
                                    <p className="font-bold text-primary">R$ {sale.total.toFixed(2)}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="w-full md:w-1/3">
                 {selectedSaleId ? (
                    <div className="bg-card p-4 rounded-lg shadow-lg h-full overflow-y-auto">
                         <h2 className="text-2xl font-bold mb-4 pb-4 border-b border-border-color">{selectedSaleId === 'new' ? 'Registrar Nova Venda' : 'Editar Venda'}</h2>
                        <SaleForm 
                            sale={selectedSale} 
                            products={products} 
                            customers={customers} 
                            sellers={sellers} 
                            onSave={handleSave} 
                            onClose={() => setSelectedSaleId(null)} 
                            onCustomerSave={onCustomerSave}
                            onRequestDelete={handleRequestDelete}
                        />
                    </div>
                 ) : (
                    <div className="flex items-center justify-center h-full bg-card rounded-lg shadow-lg border-2 border-dashed border-border-color">
                        <div className="text-center text-text-secondary p-4">
                             <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                             <h3 className="mt-2 text-sm font-medium">Selecione uma venda</h3>
                            <p className="mt-1 text-sm">Escolha uma venda na lista para ver os detalhes, ou registre uma nova.</p>
                        </div>
                    </div>
                )}
            </div>
             <Modal 
                isOpen={confirmModalState.isOpen} 
                onClose={() => setConfirmModalState({ isOpen: false, title: '', message: '' })}
                title={confirmModalState.title}
            >
                <div>
                    <div className="text-text-secondary mb-6">
                        {confirmModalState.message}
                    </div>
                    <div className="flex justify-end space-x-2">
                        <button 
                            type="button" 
                            onClick={() => setConfirmModalState({ isOpen: false, title: '', message: '' })}
                            className="px-4 py-2 rounded bg-secondary text-text-primary hover:opacity-90 transition-opacity"
                        >
                            Cancelar
                        </button>
                        {confirmModalState.onConfirm && (
                            <button 
                                type="button" 
                                onClick={confirmModalState.onConfirm}
                                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition-opacity"
                            >
                                {confirmModalState.confirmText || 'Confirmar'}
                            </button>
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Sales;