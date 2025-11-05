import React, { useState, useMemo } from 'react';
import { Customer, Sale, SpecificOrder, CustomerSource, OrderStatus, Exchange, ExchangeStatus, ExchangePaymentMethod } from '../types';
import Modal from './ui/Modal';
import Lightbox from './ui/Lightbox';

interface CustomerDetailProps {
    customer: Customer;
    sales: Sale[];
    exchanges: Exchange[];
    specificOrders: SpecificOrder[];
    onBack: () => void;
    onSaveSpecificOrder: (order: SpecificOrder) => void;
    onDeleteSpecificOrder: (orderId: string) => void;
    onUpdateSpecificOrderStatus: (orderId: string, status: OrderStatus) => void;
}

const getStatusColor = (status: OrderStatus) => {
    switch (status) {
        case OrderStatus.Pendente: return 'bg-yellow-500 text-yellow-900';
        case OrderStatus.Buscando: return 'bg-blue-400 text-blue-900';
        case OrderStatus.Entregue: return 'bg-green-500 text-green-900';
        case OrderStatus.Cancelado: return 'bg-gray-500 text-gray-900';
        default: return 'bg-gray-200 text-gray-800';
    }
};

const getValeStatusBadgeColor = (status: ExchangeStatus) => {
    switch (status) {
        case ExchangeStatus.Pendente: return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
        case ExchangeStatus.Finalizado: return 'bg-green-500/20 text-green-300 border-green-500/30';
        case ExchangeStatus.PagoEmDinheiro: return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
        default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
};

const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });


interface EditOrderFormProps {
    order: SpecificOrder;
    onSave: (order: SpecificOrder) => void;
    onClose: () => void;
}

const EditOrderForm: React.FC<EditOrderFormProps> = ({ order, onSave, onClose }) => {
    const [formData, setFormData] = useState<SpecificOrder>(order);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            // FIX: Explicitly type the 'file' parameter in the map function to resolve type inference issues.
            const base64Promises = files.map((file: File) => {
                 if (file.size > 2 * 1024 * 1024) { // 2MB limit
                    alert(`A imagem "${file.name}" é muito grande. Por favor, escolha arquivos menores que 2MB.`);
                    return null;
                }
                return fileToBase64(file);
            });
            const base64Results = (await Promise.all(base64Promises)).filter(Boolean) as string[];
            setFormData(prev => ({ ...prev, images: [...(prev.images || []), ...base64Results] }));
        }
    };

    const removeImage = (indexToRemove: number) => {
        setFormData(prev => ({
            ...prev,
            images: (prev.images || []).filter((_, index) => index !== indexToRemove)
        }));
    }


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Produto</label>
                    <input type="text" name="product" value={formData.product} onChange={handleChange} required className="bg-input-bg p-2 rounded border border-border-color w-full" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Tamanho</label>
                    <input type="text" name="size" value={formData.size} onChange={handleChange} className="bg-input-bg p-2 rounded border border-border-color w-full" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Característica específica</label>
                    <input type="text" name="color" value={formData.color} onChange={handleChange} className="bg-input-bg p-2 rounded border border-border-color w-full" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Data do Evento</label>
                    <input type="date" name="eventDate" value={formData.eventDate || ''} onChange={handleChange} className="bg-input-bg p-2 rounded border border-border-color w-full" />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-text-secondary mb-1">Status</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="bg-input-bg p-2 rounded border border-border-color w-full">
                        {Object.values(OrderStatus).map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </div>
                 <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-text-secondary mb-1">Imagens de Referência</label>
                    <input type="file" accept="image/*" multiple onChange={handleImageChange} className="w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-accent cursor-pointer"/>
                     {formData.images && formData.images.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                            {formData.images.map((img, index) => (
                                <div key={index} className="relative w-24 h-24">
                                    <img src={img} alt={`Preview ${index}`} className="h-full w-full rounded object-cover" />
                                    <button type="button" onClick={() => removeImage(index)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full h-6 w-6 flex items-center justify-center font-bold">&times;</button>
                                </div>
                            ))}
                        </div>
                    )}
                    <p className="text-xs text-text-secondary mt-1">Aviso: Imagens são salvas no navegador e podem ocupar espaço. Use imagens otimizadas (&lt;2MB).</p>
                </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-secondary text-text-primary hover:opacity-90">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded bg-primary text-white hover:opacity-90">Salvar Alterações</button>
            </div>
        </form>
    );
};


const CustomerDetail: React.FC<CustomerDetailProps> = ({ customer, sales, exchanges, specificOrders, onBack, onSaveSpecificOrder, onDeleteSpecificOrder }) => {
    const [activeTab, setActiveTab] = useState<'history' | 'requests' | 'exchanges'>('history');
    const [monthFilter, setMonthFilter] = useState('');
    const [newRequest, setNewRequest] = useState({ product: '', size: '', color: '', eventDate: '', images: [] as string[] });
    const [editingOrder, setEditingOrder] = useState<SpecificOrder | null>(null);
    const [orderToDelete, setOrderToDelete] = useState<SpecificOrder | null>(null);
    const [lightboxState, setLightboxState] = useState<{ images: string[]; startIndex: number } | null>(null);

    
    const sortedSales = useMemo(() => {
        return [...sales].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [sales]);

    const sortedExchanges = useMemo(() => {
        return [...exchanges].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [exchanges]);

    const filteredSales = useMemo(() => {
        if (!monthFilter) return sortedSales;
        return sortedSales.filter(sale => {
            const saleDate = new Date(sale.date);
            const saleMonth = `${saleDate.getFullYear()}-${(saleDate.getMonth() + 1).toString().padStart(2, '0')}`;
            return saleMonth === monthFilter;
        });
    }, [sortedSales, monthFilter]);

    const totalSpent = useMemo(() => {
        return sales.reduce((total, sale) => total + sale.total, 0);
    }, [sales]);

    const handleRequestChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewRequest(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    
    const handleNewRequestImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            // FIX: Explicitly type the 'file' parameter in the map function to resolve type inference issues.
            const base64Promises = files.map((file: File) => {
                 if (file.size > 2 * 1024 * 1024) { // 2MB limit
                    alert(`A imagem "${file.name}" é muito grande. Por favor, escolha arquivos menores que 2MB.`);
                    return null;
                }
                return fileToBase64(file);
            });
            const base64Results = (await Promise.all(base64Promises)).filter(Boolean) as string[];
            setNewRequest(prev => ({ ...prev, images: [...prev.images, ...base64Results] }));
        }
    };

    const removeNewRequestImage = (indexToRemove: number) => {
        setNewRequest(prev => ({
            ...prev,
            images: prev.images.filter((_, index) => index !== indexToRemove)
        }));
    };


    const handleRequestSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!newRequest.product) return;
        onSaveSpecificOrder({
            id: `s-order-${Date.now()}`,
            customerId: customer.id,
            product: newRequest.product,
            size: newRequest.size,
            color: newRequest.color,
            eventDate: newRequest.eventDate || undefined,
            createdAt: new Date(),
            status: OrderStatus.Pendente,
            images: newRequest.images.length > 0 ? newRequest.images : undefined
        });
        setNewRequest({ product: '', size: '', color: '', eventDate: '', images: [] }); // Reset form
    };
    
    const handleSaveEdit = (order: SpecificOrder) => {
        onSaveSpecificOrder(order);
        setEditingOrder(null);
    };

    const handleDeleteConfirm = () => {
        if (orderToDelete) {
            onDeleteSpecificOrder(orderToDelete.id);
            setOrderToDelete(null);
        }
    };

    const sourceDisplay = customer.source === CustomerSource.Outros
        ? customer.sourceOther || customer.source
        : customer.source === CustomerSource.Indicacao && customer.sourceIndicatorName
        ? `${customer.source} (${customer.sourceIndicatorName})`
        : customer.source;

    return (
        <div className="space-y-6">
            <div>
                <button onClick={onBack} className="flex items-center text-sm text-accent hover:underline mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Voltar para a Lista de Clientes
                </button>
                <h1 className="text-4xl font-bold text-text-primary">{customer.name}</h1>
            </div>

            <div className="bg-card p-6 rounded-lg shadow-md grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-center md:text-left">
                <div>
                    <p className="text-sm text-text-secondary">Telefone</p>
                    <p className="font-semibold">{customer.phone || 'Não informado'}</p>
                </div>
                 <div>
                    <p className="text-sm text-text-secondary">Como Chegou</p>
                    <p className="font-semibold">{sourceDisplay}</p>
                </div>
                 <div>
                    <p className="text-sm text-text-secondary">Cliente Desde</p>
                    <p className="font-semibold">{new Date(customer.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
                 <div>
                    <p className="text-sm text-text-secondary">Total Gasto</p>
                    <p className="font-semibold text-primary text-lg">R$ {totalSpent.toFixed(2)}</p>
                </div>
            </div>

            <div>
                <div className="border-b border-border-color">
                    <nav className="-mb-px flex space-x-6">
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'history' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary hover:border-gray-300'}`}
                        >
                            Histórico de Compras
                        </button>
                        <button
                            onClick={() => setActiveTab('exchanges')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'exchanges' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary hover:border-gray-300'}`}
                        >
                            Trocas
                        </button>
                        <button
                            onClick={() => setActiveTab('requests')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'requests' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary hover:border-gray-300'}`}
                        >
                            Pedidos Específicos
                        </button>
                    </nav>
                </div>

                <div className="py-6">
                    {activeTab === 'history' && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 bg-card p-3 rounded-md">
                                <label htmlFor="month-filter" className="text-sm font-medium">Filtrar por Mês:</label>
                                <input type="month" id="month-filter" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="bg-input-bg text-text-primary p-2 rounded border border-border-color" />
                                <button onClick={() => setMonthFilter('')} className="px-4 py-2 rounded bg-secondary text-text-primary hover:opacity-90 transition-opacity">Limpar Filtro</button>
                            </div>
                            <div className="space-y-3">
                                {filteredSales.length > 0 ? filteredSales.map(sale => (
                                    <div key={sale.id} className="bg-card p-4 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <p className="font-semibold">{new Date(sale.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                            <p className="font-bold text-primary">R$ {sale.total.toFixed(2)}</p>
                                        </div>
                                    </div>
                                )) : <p className="text-text-secondary text-center">Nenhuma compra encontrada para o período selecionado.</p>}
                            </div>
                        </div>
                    )}

                    {activeTab === 'exchanges' && (
                        <div className="space-y-3">
                            {sortedExchanges.length > 0 ? sortedExchanges.map(exchange => {
                                const isExpired = exchange.valeExpiresAt && new Date(exchange.valeExpiresAt) < new Date();
                                return (
                                <div key={exchange.id} className="bg-card p-4 rounded-lg">
                                    <div className="flex justify-between items-start flex-wrap gap-2">
                                        <div>
                                            <p className="font-semibold">{new Date(exchange.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                            <p className="text-sm text-text-secondary">{exchange.isBulk ? `Lote de ${exchange.bulkQuantity} peças` : `${exchange.items.length} iten(s) detalhado(s)`}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-primary">R$ {exchange.totalValue.toFixed(2)}</p>
                                            {exchange.paymentMethod === ExchangePaymentMethod.Vale && exchange.status && (
                                                <div className="flex flex-col gap-1 items-end mt-1">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full border text-center ${getValeStatusBadgeColor(exchange.status)}`}>
                                                        {exchange.status}
                                                    </span>
                                                    {exchange.status === ExchangeStatus.Pendente && exchange.valeExpiresAt && (
                                                        <span className={`text-xs text-center ${isExpired ? 'text-red-400 font-bold' : 'text-text-secondary'}`}>
                                                            {isExpired ? 'Expirou em: ' : 'Expira em: '} {new Date(exchange.valeExpiresAt).toLocaleDateString('pt-BR')}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                )
                            }) : <p className="text-text-secondary text-center">Nenhuma troca registrada para este cliente.</p>}
                        </div>
                    )}
                    
                    {activeTab === 'requests' && (
                        <div className="space-y-6">
                             <form onSubmit={handleRequestSubmit} className="bg-card p-4 rounded-lg space-y-4">
                                <h3 className="text-lg font-semibold">Adicionar Novo Pedido</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <input type="text" name="product" value={newRequest.product} onChange={handleRequestChange} placeholder="Produto*" required className="bg-input-bg p-2 rounded border border-border-color" />
                                    <input type="text" name="size" value={newRequest.size} onChange={handleRequestChange} placeholder="Tamanho" className="bg-input-bg p-2 rounded border border-border-color" />
                                    <input type="text" name="color" value={newRequest.color} onChange={handleRequestChange} placeholder="Característica específica" className="bg-input-bg p-2 rounded border border-border-color" />
                                    <input type="date" name="eventDate" value={newRequest.eventDate} onChange={handleRequestChange} className="bg-input-bg p-2 rounded border border-border-color" />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-text-secondary">Imagens de Referência (Opcional)</label>
                                    <input type="file" accept="image/*" multiple onChange={handleNewRequestImageChange} className="w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-accent cursor-pointer"/>
                                    {newRequest.images.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {newRequest.images.map((img, index) => (
                                                 <div key={index} className="relative w-24 h-24">
                                                    <img src={img} alt={`Preview ${index}`} className="h-full w-full rounded object-cover" />
                                                    <button type="button" onClick={() => removeNewRequestImage(index)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full h-6 w-6 flex items-center justify-center font-bold">&times;</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                     <p className="text-xs text-text-secondary mt-1">Aviso: Imagens são salvas no navegador e podem ocupar espaço. Use imagens otimizadas (&lt;2MB).</p>
                                </div>
                                <button type="submit" className="px-4 py-2 w-full md:w-auto rounded bg-primary hover:opacity-90 transition-opacity text-white">Salvar Pedido</button>
                            </form>
                            <div className="space-y-3">
                                {specificOrders.map(order => (
                                    <div key={order.id} className="bg-card p-4 rounded-lg flex justify-between items-center flex-wrap gap-4">
                                        <div className="flex-grow flex items-start gap-4">
                                            {order.images && order.images.length > 0 && (
                                                <div className="flex flex-wrap gap-2 flex-shrink-0">
                                                    {order.images.map((img, index) => (
                                                        <img 
                                                            key={index}
                                                            src={img} 
                                                            alt={`${order.product} ${index+1}`}
                                                            className="h-16 w-16 rounded-md object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                                            onClick={() => setLightboxState({images: order.images || [], startIndex: index})}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <p className="font-bold">{order.product}</p>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                                                        {order.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-text-secondary">
                                                    {order.size && `Tamanho: ${order.size}`}{' '}
                                                    {order.color && `| Característica: ${order.color}`}
                                                </p>
                                                {order.eventDate && <p className="text-sm text-accent">Para evento em: {new Date(order.eventDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <button onClick={() => setEditingOrder(order)} className="text-accent hover:opacity-80 p-2">
                                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>
                                            </button>
                                            <button onClick={() => setOrderToDelete(order)} className="text-red-500 hover:text-red-400 p-2">
                                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {specificOrders.length === 0 && <p className="text-text-secondary text-center">Nenhum pedido específico registrado.</p>}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {lightboxState && (
                <Lightbox 
                    images={lightboxState.images}
                    startIndex={lightboxState.startIndex}
                    onClose={() => setLightboxState(null)}
                />
            )}

            <Modal isOpen={!!editingOrder} onClose={() => setEditingOrder(null)} title="Editar Pedido">
                {editingOrder && <EditOrderForm order={editingOrder} onSave={handleSaveEdit} onClose={() => setEditingOrder(null)} />}
            </Modal>
            <Modal isOpen={!!orderToDelete} onClose={() => setOrderToDelete(null)} title="Confirmar Exclusão">
                {orderToDelete && (
                    <div>
                        <p className="text-text-secondary mb-6">Tem certeza que deseja excluir permanentemente o pedido de "{orderToDelete.product}"?</p>
                        <div className="flex justify-end space-x-2">
                            <button onClick={() => setOrderToDelete(null)} className="px-4 py-2 rounded bg-secondary text-text-primary hover:opacity-90">Cancelar</button>
                            <button onClick={handleDeleteConfirm} className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700">Excluir</button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default CustomerDetail;
