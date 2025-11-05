import React, { useState, useMemo, useEffect } from 'react';
import { Exchange, Customer, ExchangeItem, ExchangePaymentMethod, CustomerStatus, CustomerSource, ExchangeStatus } from '../types';
import Modal from './ui/Modal';
import Table from './ui/Table';

// Internal component to display Vale status and expiration
const ValeStatus: React.FC<{
    exchange: { status?: ExchangeStatus, paymentMethod: ExchangePaymentMethod, valeExpiresAt?: string };
}> = ({ exchange }) => {
    if (exchange.paymentMethod !== 'Vale' || !exchange.status) {
        return <span>{exchange.paymentMethod}</span>;
    }

    const getStatusBadgeColor = (status: ExchangeStatus) => {
        switch (status) {
            case ExchangeStatus.Pendente: return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
            case ExchangeStatus.Finalizado: return 'bg-green-500/20 text-green-300 border-green-500/30';
            case ExchangeStatus.PagoEmDinheiro: return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
            default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
        }
    };
    
    const isExpired = exchange.valeExpiresAt && new Date(exchange.valeExpiresAt) < new Date();

    return (
        <div className="flex flex-col gap-1 items-start">
            <span className={`px-2 py-1 text-xs font-semibold rounded-full border text-center ${getStatusBadgeColor(exchange.status)}`}>
                {exchange.status}
            </span>
            {exchange.status === ExchangeStatus.Pendente && exchange.valeExpiresAt && (
                <span className={`text-xs text-center ${isExpired ? 'text-red-400 font-bold' : 'text-text-secondary'}`}>
                    {isExpired ? 'Expirado em: ' : 'Expira em: '} {new Date(exchange.valeExpiresAt).toLocaleDateString('pt-BR')}
                </span>
            )}
        </div>
    );
};

interface TrocaFormProps {
    exchange: Exchange | null;
    customers: Customer[];
    onSave: (exchange: Exchange) => void;
    onClose: () => void;
    onCustomerSave: (customer: Customer) => void;
}

const TrocaForm: React.FC<TrocaFormProps> = ({ exchange, customers, onSave, onClose, onCustomerSave }) => {
    const [date, setDate] = useState(new Date());
    const [customerInput, setCustomerInput] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<ExchangePaymentMethod>(ExchangePaymentMethod.Vale);
    const [exchangeType, setExchangeType] = useState<'detalhado' | 'lote'>('detalhado');
    
    // State for detailed exchange
    const [items, setItems] = useState<ExchangeItem[]>([]);
    const [currentItemDesc, setCurrentItemDesc] = useState('');
    const [currentItemValue, setCurrentItemValue] = useState('');

    // State for bulk exchange
    const [bulkQuantity, setBulkQuantity] = useState<number | ''>('');
    const [totalValue, setTotalValue] = useState<number | ''>('');

    // New state for vale expiration date
    const [valeExpiresAt, setValeExpiresAt] = useState('');

    useEffect(() => {
        if (exchange) {
            // Populate state from 'exchange' prop for editing
            const exchangeDate = new Date(exchange.date);
            setDate(exchangeDate);
            setCustomerInput(customers.find(c => c.id === exchange.customerId)?.name || '');
            setPaymentMethod(exchange.paymentMethod);
            setExchangeType(exchange.isBulk ? 'lote' : 'detalhado');
            setItems(exchange.isBulk ? [] : exchange.items);
            setBulkQuantity(exchange.isBulk ? (exchange.bulkQuantity || '') : '');
            setTotalValue(exchange.totalValue);

            if (exchange.valeExpiresAt) {
                setValeExpiresAt(new Date(exchange.valeExpiresAt).toISOString().split('T')[0]);
            } else {
                // If an old exchange doesn't have an expiry, default to 30 days from its date
                const defaultExpiry = new Date(exchangeDate);
                defaultExpiry.setDate(defaultExpiry.getDate() + 30);
                setValeExpiresAt(defaultExpiry.toISOString().split('T')[0]);
            }
        } else {
            // Reset state for new exchange form
            const newDate = new Date();
            const newExpiry = new Date(newDate);
            newExpiry.setDate(newExpiry.getDate() + 30);
            
            setDate(newDate);
            setCustomerInput('');
            setPaymentMethod(ExchangePaymentMethod.Vale);
            setExchangeType('detalhado');
            setItems([]);
            setCurrentItemDesc('');
            setCurrentItemValue('');
            setBulkQuantity('');
            setTotalValue('');
            setValeExpiresAt(newExpiry.toISOString().split('T')[0]);
        }
    }, [exchange, customers]);


    const calculatedTotal = useMemo(() => {
        if (exchangeType === 'lote') {
            return Number(totalValue) || 0;
        }
        return items.reduce((sum, item) => sum + item.purchaseValue, 0);
    }, [items, totalValue, exchangeType]);

    const handleAddItem = () => {
        if (!currentItemDesc || !currentItemValue || Number(currentItemValue) <= 0) {
            alert("Preencha a descrição e um valor de compra válido.");
            return;
        }
        setItems(prev => [...prev, {
            id: `ex-item-${Date.now()}`,
            description: currentItemDesc,
            purchaseValue: Number(currentItemValue)
        }]);
        setCurrentItemDesc('');
        setCurrentItemValue('');
    };

    const handleRemoveItem = (id: string) => {
        setItems(prev => prev.filter(item => item.id !== id));
    };
    
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const dateStr = e.target.value;
        if (dateStr) {
            const dateInUTC = new Date(dateStr);
            const correctedDate = new Date(dateInUTC.getTime() + dateInUTC.getTimezoneOffset() * 60000);
            setDate(correctedDate);
            
            // Also update default expiration date
            const expiresDate = new Date(correctedDate);
            expiresDate.setDate(expiresDate.getDate() + 30);
            setValeExpiresAt(expiresDate.toISOString().split('T')[0]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        let saleCustomerId = '';
        const existingCustomer = customers.find(c => c.name.toLowerCase() === customerInput.trim().toLowerCase());
        
        if (existingCustomer) {
            saleCustomerId = existingCustomer.id;
        } else if (customerInput.trim()) {
            const newCustomer: Customer = { id: `cust-${Date.now()}`, name: customerInput.trim(), phone: '', status: CustomerStatus.Nova, source: CustomerSource.Outros, createdAt: new Date() };
            onCustomerSave(newCustomer);
            saleCustomerId = newCustomer.id;
        } else {
             alert("Por favor, selecione ou digite o nome de um cliente.");
            return;
        }

        const isBulk = exchangeType === 'lote';

        if (isBulk && (!bulkQuantity || !totalValue || bulkQuantity <= 0 || totalValue <= 0)) {
            alert("Para trocas por lote, preencha a quantidade e o valor total final.");
            return;
        }
        if (!isBulk && items.length === 0) {
            alert("Adicione ao menos um item para a troca detalhada.");
            return;
        }

        const isVale = paymentMethod === ExchangePaymentMethod.Vale;
        
        onSave({
            id: exchange?.id || `exch-${Date.now()}`,
            date,
            customerId: saleCustomerId,
            isBulk,
            items: isBulk ? [] : items,
            bulkQuantity: isBulk ? Number(bulkQuantity) : undefined,
            totalValue: calculatedTotal,
            paymentMethod,
            status: isVale ? (exchange?.status || ExchangeStatus.Pendente) : undefined,
            valeExpiresAt: isVale ? new Date(valeExpiresAt).toISOString() : undefined,
        });
        onClose();
    };


    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Data da Troca</label>
                    <input type="date" value={date.toISOString().split('T')[0]} onChange={handleDateChange} required className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Cliente</label>
                    <input type="text" list="customer-list" value={customerInput} onChange={e => setCustomerInput(e.target.value)} required placeholder="Buscar ou criar cliente" className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color"/>
                    <datalist id="customer-list">
                        {customers.filter(c => c.name.toLowerCase().includes(customerInput.toLowerCase())).map(c => <option key={c.id} value={c.name} />)}
                    </datalist>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Tipo de Troca</label>
                <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="exchangeType" value="detalhado" checked={exchangeType === 'detalhado'} onChange={() => setExchangeType('detalhado')} className="form-radio text-primary" /> Detalhado (por produto)</label>
                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="exchangeType" value="lote" checked={exchangeType === 'lote'} onChange={() => setExchangeType('lote')} className="form-radio text-primary" /> Por Lote</label>
                </div>
            </div>

            {exchangeType === 'detalhado' ? (
                 <div className="bg-background p-4 rounded-lg border border-border-color space-y-3">
                    <h3 className="font-semibold text-text-primary">Itens da Troca</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                        <input type="text" value={currentItemDesc} onChange={e => setCurrentItemDesc(e.target.value)} placeholder="Descrição do produto" className="flex-grow bg-card text-text-primary p-2 rounded border border-border-color min-w-[200px]" />
                        <input type="number" value={currentItemValue} onChange={e => setCurrentItemValue(e.target.value)} placeholder="Valor de compra (R$)" className="w-40 bg-card text-text-primary p-2 rounded border border-border-color" />
                        <button type="button" onClick={handleAddItem} className="px-4 py-2 rounded bg-accent text-white hover:opacity-90 transition-opacity">Adicionar</button>
                    </div>
                     <div className="space-y-2 max-h-40 overflow-y-auto">
                        {items.map(item => (
                             <div key={item.id} className="flex justify-between items-center bg-card p-2 rounded text-sm">
                                <div><span className="font-semibold">{item.description}</span> - R$ {item.purchaseValue.toFixed(2)}</div>
                                <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:text-red-400 font-bold px-2">X</button>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="bg-background p-4 rounded-lg border border-border-color grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Quantidade de Peças</label>
                        <input type="number" value={bulkQuantity} onChange={e => setBulkQuantity(e.target.value === '' ? '' : Number(e.target.value))} min="1" required className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Valor Total Final a Pagar (R$)</label>
                        <input type="number" value={totalValue} onChange={e => setTotalValue(e.target.value === '' ? '' : Number(e.target.value))} min="0.01" step="0.01" required className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color" />
                    </div>
                </div>
            )}
            
            <div>
                 <label className="block text-sm font-medium text-text-secondary mb-2">Forma de Pagamento para Cliente</label>
                <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="paymentMethod" value={ExchangePaymentMethod.Vale} checked={paymentMethod === ExchangePaymentMethod.Vale} onChange={() => setPaymentMethod(ExchangePaymentMethod.Vale)} className="form-radio text-primary" /> Vale (Crédito na loja)</label>
                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="paymentMethod" value={ExchangePaymentMethod.Dinheiro} checked={paymentMethod === ExchangePaymentMethod.Dinheiro} onChange={() => setPaymentMethod(ExchangePaymentMethod.Dinheiro)} className="form-radio text-primary" /> Dinheiro</label>
                </div>
            </div>

            {paymentMethod === ExchangePaymentMethod.Vale && (
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Validade do Vale</label>
                    <input 
                        type="date" 
                        value={valeExpiresAt} 
                        onChange={e => setValeExpiresAt(e.target.value)} 
                        required 
                        className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color" 
                    />
                </div>
            )}

            <div className="pt-4 border-t border-border-color">
                 <div className="flex justify-end items-baseline space-x-4 font-bold mb-4">
                     <span className="text-lg">Valor Total da Troca: <span className="text-primary">R$ {calculatedTotal.toFixed(2)}</span></span>
                </div>
                <div className="flex justify-end space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-secondary text-text-primary hover:opacity-90">Cancelar</button>
                    <button type="submit" className="px-6 py-3 rounded bg-primary text-white hover:opacity-90 font-semibold">{exchange ? 'Salvar Alterações' : 'Registrar Troca'}</button>
                </div>
            </div>
        </form>
    )
}


interface TrocasProps {
    exchanges: Exchange[];
    customers: Customer[];
    onSave: (exchange: Exchange) => void;
    onDelete: (exchangeId: string) => void;
    onCustomerSave: (customer: Customer) => void;
    onStatusUpdate: (exchangeId: string, status: ExchangeStatus) => void;
}

const Trocas: React.FC<TrocasProps> = ({ exchanges, customers, onSave, onDelete, onCustomerSave, onStatusUpdate }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedExchange, setSelectedExchange] = useState<Exchange | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [filters, setFilters] = useState({
        customerName: '',
        paymentMethod: '',
        startDate: '',
        endDate: '',
        status: '',
    });

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleClearFilters = () => {
        setFilters({
            customerName: '',
            paymentMethod: '',
            startDate: '',
            endDate: '',
            status: '',
        });
    };

    const handleOpenModal = (exchange: Exchange | null = null) => {
        setSelectedExchange(exchange);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setSelectedExchange(null);
        setIsModalOpen(false);
    };
    
    const handleSave = (exchange: Exchange) => {
        onSave(exchange);
        handleCloseModal();
    }

    const handleDelete = () => {
        if(confirmDeleteId) {
            onDelete(confirmDeleteId);
            setConfirmDeleteId(null);
        }
    };

    const handleStatusUpdate = (exchangeId: string, status: ExchangeStatus) => {
        onStatusUpdate(exchangeId, status);
    };
    
    const filteredExchanges = useMemo(() => {
        const exchangesWithCustomer = exchanges.map(ex => ({
            ...ex,
            customerName: customers.find(c => c.id === ex.customerId)?.name || 'Cliente não encontrado'
        }));

        const isAnyFilterActive = filters.customerName || filters.paymentMethod || filters.startDate || filters.endDate || filters.status;

        let filteredData = exchangesWithCustomer;

        if (!isAnyFilterActive) {
            // Default to current month
            const today = new Date();
            const currentYear = today.getFullYear();
            const currentMonth = today.getMonth();

            filteredData = exchangesWithCustomer.filter(ex => {
                const exDate = new Date(ex.date);
                return exDate.getFullYear() === currentYear && exDate.getMonth() === currentMonth;
            });
        } else {
            // Apply active filters
            filteredData = exchangesWithCustomer.filter(ex => {
                const customerMatch = filters.customerName ? ex.customerName.toLowerCase().includes(filters.customerName.toLowerCase()) : true;
                const paymentMethodMatch = filters.paymentMethod ? ex.paymentMethod === filters.paymentMethod : true;
                const statusMatch = filters.status ? ex.status === filters.status : true;
                
                const exDate = new Date(ex.date);

                let startDateMatch = true;
                if (filters.startDate) {
                    const startDate = new Date(filters.startDate);
                    startDate.setMinutes(startDate.getMinutes() + startDate.getTimezoneOffset());
                    startDate.setHours(0, 0, 0, 0);
                    startDateMatch = exDate >= startDate;
                }

                let endDateMatch = true;
                if (filters.endDate) {
                    const endDate = new Date(filters.endDate);
                    endDate.setMinutes(endDate.getMinutes() + endDate.getTimezoneOffset());
                    endDate.setHours(23, 59, 59, 999);
                    endDateMatch = exDate <= endDate;
                }

                return customerMatch && paymentMethodMatch && startDateMatch && endDateMatch && statusMatch;
            });
        }

        return filteredData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [exchanges, customers, filters]);

    const columns = [
        { header: 'Data', accessor: (ex: typeof filteredExchanges[0]) => new Date(ex.date).toLocaleDateString('pt-BR') },
        { header: 'Cliente', accessor: (ex: typeof filteredExchanges[0]) => ex.customerName },
        { header: 'Tipo', accessor: (ex: typeof filteredExchanges[0]) => ex.isBulk ? 'Lote' : 'Detalhado' },
        { header: 'Itens/Qtd.', accessor: (ex: typeof filteredExchanges[0]) => ex.isBulk ? `${ex.bulkQuantity} peças` : `${ex.items.length} iten(s)` },
        { header: 'Valor Total', accessor: (ex: typeof filteredExchanges[0]) => `R$ ${ex.totalValue.toFixed(2)}` },
        { header: 'Pagamento / Status', accessor: (ex: typeof filteredExchanges[0]) => <ValeStatus exchange={ex} /> },
    ];
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h1 className="text-4xl font-bold text-text-primary">Trocas</h1>
                <button onClick={() => handleOpenModal()} className="px-4 py-2 rounded-lg bg-primary hover:bg-accent text-white font-semibold transition-colors shadow-md">
                    + Nova Troca
                </button>
            </div>

            <div className="bg-card p-4 rounded-lg space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
                    <div className="lg:col-span-3">
                        <label className="block text-sm font-medium text-text-secondary mb-1">Cliente</label>
                        <input
                            type="text"
                            name="customerName"
                            value={filters.customerName}
                            onChange={handleFilterChange}
                            placeholder="Nome do cliente..."
                            className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color"
                        />
                    </div>
                    <div className="lg:col-span-3">
                        <label className="block text-sm font-medium text-text-secondary mb-1">Período</label>
                        <div className="flex items-center gap-2">
                            <input 
                                type="date" 
                                name="startDate" 
                                value={filters.startDate} 
                                onChange={handleFilterChange} 
                                className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color" 
                            />
                            <input 
                                type="date" 
                                name="endDate" 
                                value={filters.endDate} 
                                onChange={handleFilterChange} 
                                className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color" 
                            />
                        </div>
                    </div>
                    <div className="lg:col-span-4">
                        <label className="block text-sm font-medium text-text-secondary mb-1">Pagamento / Status do Vale</label>
                        <div className="flex items-center gap-2">
                            <select
                                name="paymentMethod"
                                value={filters.paymentMethod}
                                onChange={handleFilterChange}
                                className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color"
                            >
                                <option value="">Todos Pag.</option>
                                {Object.values(ExchangePaymentMethod).map(pm => <option key={pm} value={pm}>{pm}</option>)}
                            </select>
                             <select
                                name="status"
                                value={filters.status}
                                onChange={handleFilterChange}
                                className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color"
                            >
                                <option value="">Todos Status</option>
                                {Object.values(ExchangeStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="lg:col-span-2">
                        <button
                            onClick={handleClearFilters}
                            className="w-full px-4 py-2 rounded bg-secondary text-text-primary hover:opacity-90 transition-opacity"
                        >
                            Limpar
                        </button>
                    </div>
                </div>
            </div>
            
            <Table
                columns={columns}
                data={filteredExchanges}
                actions={(exchange) => (
                    <div className="space-y-2 text-right">
                        <div className="space-x-4">
                            <button onClick={() => handleOpenModal(exchange)} className="text-accent hover:opacity-80 transition-opacity font-medium">Editar</button>
                            <button onClick={() => setConfirmDeleteId(exchange.id)} className="text-red-500 hover:text-red-400 transition-opacity font-medium">Excluir</button>
                        </div>
                        {exchange.paymentMethod === ExchangePaymentMethod.Vale && (
                            <div className="border-t border-border-color pt-2 flex flex-wrap gap-1 justify-end">
                                <span className='text-xs text-text-secondary w-full mb-1 text-right'>Mudar status do vale:</span>
                                {exchange.status !== ExchangeStatus.Finalizado && (
                                    <button onClick={() => handleStatusUpdate(exchange.id, ExchangeStatus.Finalizado)} className="text-xs px-2 py-1 rounded bg-green-600 hover:bg-green-700 text-white">Finalizado</button>
                                )}
                                {exchange.status !== ExchangeStatus.PagoEmDinheiro && (
                                    <button onClick={() => handleStatusUpdate(exchange.id, ExchangeStatus.PagoEmDinheiro)} className="text-xs px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white">Pago R$</button>
                                )}
                                {exchange.status !== ExchangeStatus.Pendente && (
                                    <button onClick={() => handleStatusUpdate(exchange.id, ExchangeStatus.Pendente)} className="text-xs px-2 py-1 rounded bg-yellow-600 hover:bg-yellow-700 text-white">Pendente</button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            />

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={selectedExchange ? 'Editar Troca' : 'Registrar Nova Troca'}>
                <TrocaForm 
                    exchange={selectedExchange} 
                    customers={customers} 
                    onSave={handleSave} 
                    onClose={handleCloseModal}
                    onCustomerSave={onCustomerSave}
                />
            </Modal>
            
            <Modal isOpen={!!confirmDeleteId} onClose={() => setConfirmDeleteId(null)} title="Confirmar Exclusão">
                <div>
                    <p className="text-text-secondary mb-6">Tem certeza que deseja excluir este registro de troca? Esta ação não pode ser desfeita.</p>
                    <div className="flex justify-end space-x-2">
                        <button onClick={() => setConfirmDeleteId(null)} className="px-4 py-2 rounded bg-secondary text-text-primary hover:opacity-90">Cancelar</button>
                        <button onClick={handleDelete} className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700">Excluir</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Trocas;