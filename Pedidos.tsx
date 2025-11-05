import React, { useState, useMemo } from 'react';
import { Customer, SpecificOrder, OrderStatus, CustomerStatus, CustomerSource } from '../types';
import Modal from './ui/Modal';
import Table from './ui/Table';
import Lightbox from './ui/Lightbox';

interface PedidosProps {
    customers: Customer[];
    specificOrders: SpecificOrder[];
    onSaveSpecificOrder: (order: SpecificOrder) => void;
    onDeleteSpecificOrder: (orderId: string) => void;
    onUpdateSpecificOrderStatus: (orderId: string, status: OrderStatus) => void;
    onSaveCustomer: (customer: Customer) => void;
}

const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });

interface AddOrderFormProps {
    customers: Customer[];
    onSave: (order: SpecificOrder) => void;
    onClose: () => void;
    onSaveCustomer: (customer: Customer) => void;
}

const getStatusColor = (status: OrderStatus) => {
    switch (status) {
        case OrderStatus.Pendente: return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
        case OrderStatus.Buscando: return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
        case OrderStatus.Entregue: return 'bg-green-500/20 text-green-300 border-green-500/30';
        case OrderStatus.Cancelado: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
        default: return 'bg-gray-200/20 text-gray-200 border-gray-200/30';
    }
};

const AddOrderForm: React.FC<AddOrderFormProps> = ({ customers, onSave, onClose, onSaveCustomer }) => {
    const [customerSearch, setCustomerSearch] = useState('');
    const [newRequest, setNewRequest] = useState({ product: '', size: '', color: '', eventDate: '', images: [] as string[] });

    const filteredCustomers = useMemo(() => {
        if (!customerSearch) return [];
        return customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase())).slice(0, 5);
    }, [customers, customerSearch]);

    const handleSelectCustomer = (customer: Customer) => {
        setCustomerSearch(customer.name);
    };
    
    const handleRequestChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewRequest(prev => ({ ...prev, [e.target.name]: e.target.value }));
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
            setNewRequest(prev => ({ ...prev, images: [...prev.images, ...base64Results] }));
        }
    };
    
    const removeImage = (indexToRemove: number) => {
        setNewRequest(prev => ({
            ...prev,
            images: prev.images.filter((_, index) => index !== indexToRemove)
        }));
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRequest.product || !customerSearch.trim()) {
            alert("Por favor, preencha o nome do cliente e do produto.");
            return;
        }

        let orderCustomerId = '';
        const existingCustomer = customers.find(c => c.name.toLowerCase() === customerSearch.trim().toLowerCase());

        if (existingCustomer) {
            orderCustomerId = existingCustomer.id;
        } else {
            const newCustomer: Customer = { 
                id: `cust-${Date.now()}`, 
                name: customerSearch.trim(), 
                phone: '', 
                status: CustomerStatus.Nova, 
                source: CustomerSource.Outros, 
                createdAt: new Date() 
            };
            onSaveCustomer(newCustomer);
            orderCustomerId = newCustomer.id;
        }

        onSave({
            id: `s-order-${Date.now()}`,
            customerId: orderCustomerId,
            product: newRequest.product,
            size: newRequest.size,
            color: newRequest.color,
            eventDate: newRequest.eventDate || undefined,
            createdAt: new Date(),
            status: OrderStatus.Pendente,
            images: newRequest.images.length > 0 ? newRequest.images : undefined,
        });
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Cliente</label>
                <div className="relative">
                    <input
                        type="text"
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        placeholder="Buscar ou criar novo cliente..."
                        required
                        className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color focus:ring-primary focus:outline-none focus:ring-2"
                    />
                    {customerSearch && !customers.some(c => c.name.toLowerCase() === customerSearch.toLowerCase()) && filteredCustomers.length > 0 && (
                        <ul className="absolute z-20 w-full bg-secondary border border-border-color rounded-md mt-1 max-h-40 overflow-auto shadow-lg">
                            {filteredCustomers.map(customer => (
                                <li key={customer.id} onClick={() => handleSelectCustomer(customer)} className="p-3 hover:bg-background cursor-pointer transition-colors">
                                    {customer.name}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                <input type="text" name="product" value={newRequest.product} onChange={handleRequestChange} placeholder="Nome do produto*" required className="bg-input-bg p-2 rounded border border-border-color" />
                <input type="text" name="size" value={newRequest.size} onChange={handleRequestChange} placeholder="Tamanho" className="bg-input-bg p-2 rounded border border-border-color" />
                <input type="text" name="color" value={newRequest.color} onChange={handleRequestChange} placeholder="Característica específica" className="bg-input-bg p-2 rounded border border-border-color" />
                <input type="date" name="eventDate" value={newRequest.eventDate} onChange={handleRequestChange} className="bg-input-bg p-2 rounded border border-border-color" />
            </div>

            <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Imagens de Referência</label>
                <input type="file" accept="image/*" multiple onChange={handleImageChange} className="w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-accent cursor-pointer"/>
                {newRequest.images.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                        {newRequest.images.map((img, index) => (
                            <div key={index} className="relative w-24 h-24">
                                <img src={img} alt={`Preview ${index}`} className="h-full w-full rounded object-cover" />
                                <button type="button" onClick={() => removeImage(index)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full h-6 w-6 flex items-center justify-center font-bold">&times;</button>
                            </div>
                        ))}
                    </div>
                )}
                <p className="text-xs text-text-secondary mt-1">Aviso: Imagens são salvas no navegador e podem ocupar espaço. Use imagens otimizadas (&lt;2MB).</p>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-secondary text-text-primary hover:opacity-90 transition-opacity">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded bg-primary hover:opacity-90 transition-opacity text-white">Salvar Pedido</button>
            </div>
        </form>
    );
};

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


const Pedidos: React.FC<PedidosProps> = ({ customers, specificOrders, onSaveSpecificOrder, onDeleteSpecificOrder, onSaveCustomer }) => {
    const [filters, setFilters] = useState({ customerName: '', status: '' });
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState<SpecificOrder | null>(null);
    const [orderToDelete, setOrderToDelete] = useState<(SpecificOrder & { customerName: string }) | null>(null);
    const [lightboxState, setLightboxState] = useState<{ images: string[]; startIndex: number } | null>(null);


    const allOrdersWithCustomerName = useMemo(() => {
        return specificOrders.map(order => {
            const customer = customers.find(c => c.id === order.customerId);
            return {
                ...order,
                customerName: customer ? customer.name : 'Cliente não encontrado',
            };
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [specificOrders, customers]);

    const filteredOrders = useMemo(() => {
        return allOrdersWithCustomerName.filter(order => {
            const customerMatch = filters.customerName ? order.customerName.toLowerCase().includes(filters.customerName.toLowerCase()) : true;
            const statusMatch = filters.status ? order.status === filters.status : true;
            return customerMatch && statusMatch;
        });
    }, [allOrdersWithCustomerName, filters]);
    
    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
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

    const columns = [
        { header: 'Cliente', accessor: (order: typeof filteredOrders[0]) => order.customerName },
        { header: 'Data do Pedido', accessor: (order: typeof filteredOrders[0]) => new Date(order.createdAt).toLocaleDateString('pt-BR') },
        { header: 'Produto', accessor: (order: typeof filteredOrders[0]) => (
            <div className="flex items-center gap-3">
                {order.images && order.images[0] && (
                    <img 
                        src={order.images[0]} 
                        alt={order.product} 
                        className="h-12 w-12 rounded object-cover cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setLightboxState({ images: order.images || [], startIndex: 0 })}
                    />
                )}
                <div>
                    <p className="font-semibold">{order.product}</p>
                    <p className="text-sm text-text-secondary">{[order.size, order.color].filter(Boolean).join(' | ')}</p>
                    {order.eventDate && <p className="text-xs text-accent">Evento: {new Date(order.eventDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>}
                </div>
            </div>
        )},
        { header: 'Status', accessor: (order: typeof filteredOrders[0]) => (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}>
                {order.status}
            </span>
        )},
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h1 className="text-4xl font-bold text-text-primary">Gerenciamento de Pedidos</h1>
                <button onClick={() => setIsAddModalOpen(true)} className="px-4 py-2 rounded-lg bg-primary hover:bg-accent text-white font-semibold transition-colors shadow-md">
                    + Novo Pedido
                </button>
            </div>
            
            <div className="bg-card p-4 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                    type="text"
                    name="customerName"
                    value={filters.customerName}
                    onChange={handleFilterChange}
                    placeholder="Filtrar por nome do cliente..."
                    className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color"
                />
                <select 
                    name="status" 
                    value={filters.status} 
                    onChange={handleFilterChange}
                    className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color"
                >
                    <option value="">Filtrar por Status (Todos)</option>
                    {Object.values(OrderStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
            
            <Table
                columns={columns}
                data={filteredOrders}
                actions={(order) => (
                    <div className="flex items-center gap-2">
                        <button onClick={() => setEditingOrder(order)} className="text-accent hover:opacity-80 transition-opacity font-medium">Editar</button>
                        <button onClick={() => setOrderToDelete(order)} className="text-red-500 hover:text-red-400 p-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                )}
            />

            {lightboxState && (
                <Lightbox 
                    images={lightboxState.images}
                    startIndex={lightboxState.startIndex}
                    onClose={() => setLightboxState(null)}
                />
            )}
            
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Adicionar Novo Pedido">
                <AddOrderForm customers={customers} onSave={onSaveSpecificOrder} onClose={() => setIsAddModalOpen(false)} onSaveCustomer={onSaveCustomer} />
            </Modal>

            <Modal isOpen={!!editingOrder} onClose={() => setEditingOrder(null)} title="Editar Pedido">
                {editingOrder && <EditOrderForm order={editingOrder} onSave={handleSaveEdit} onClose={() => setEditingOrder(null)} />}
            </Modal>

            <Modal isOpen={!!orderToDelete} onClose={() => setOrderToDelete(null)} title="Confirmar Exclusão">
                {orderToDelete && (
                    <div>
                        <p className="text-text-secondary mb-6">Tem certeza que deseja excluir permanentemente o pedido de "{orderToDelete.product}" para o cliente <strong>{orderToDelete.customerName}</strong>?</p>
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

export default Pedidos;
