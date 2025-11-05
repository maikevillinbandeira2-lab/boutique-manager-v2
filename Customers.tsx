import React, { useState, useMemo } from 'react';
import { Customer, CustomerStatus, CustomerSource, Sale, SpecificOrder, OrderStatus, Exchange } from '../types';
import Modal from './ui/Modal';
import Table from './ui/Table';
import CustomerDetail from './CustomerDetail';

interface CustomerFormProps {
  customer: Customer | null;
  onSave: (customer: Customer) => void;
  onClose: () => void;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ customer, onSave, onClose }) => {
    const [formData, setFormData] = useState<Customer>(
        customer || {
            id: `cust-${Date.now()}`,
            name: '',
            phone: '',
            status: CustomerStatus.Nova,
            source: CustomerSource.StudioMB,
            sourceOther: '',
            sourceIndicatorName: '',
            createdAt: new Date(),
        }
    );

    React.useEffect(() => {
        setFormData(customer || {
            id: `cust-${Date.now()}`,
            name: '',
            phone: '',
            status: CustomerStatus.Nova,
            source: CustomerSource.StudioMB,
            sourceOther: '',
            sourceIndicatorName: '',
            createdAt: new Date(),
        });
    }, [customer]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'createdAt') {
            const dateStr = value;
            if (dateStr) {
                // HTML date input value is 'YYYY-MM-DD'. new Date() parses it as UTC midnight.
                // Adjust to local timezone to prevent off-by-one day errors.
                const dateInUTC = new Date(dateStr);
                const correctedDate = new Date(dateInUTC.getTime() + dateInUTC.getTimezoneOffset() * 60000);
                setFormData(prev => ({ ...prev, createdAt: correctedDate }));
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-text-secondary mb-1">Nome</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Nome do Cliente" required className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div className="md:col-span-2">
                     <label className="block text-sm font-medium text-text-secondary mb-1">Telefone</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="(00) 90000-0000" className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Status</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color focus:outline-none focus:ring-2 focus:ring-primary">
                        {Object.values(CustomerStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Como Chegou</label>
                    <select name="source" value={formData.source} onChange={handleChange} className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color focus:outline-none focus:ring-2 focus:ring-primary">
                        {Object.values(CustomerSource).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                
                {formData.source === CustomerSource.Indicacao && (
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-text-secondary mb-1">Indicado por (Opcional)</label>
                        <input
                            type="text"
                            name="sourceIndicatorName"
                            value={formData.sourceIndicatorName || ''}
                            onChange={handleChange}
                            placeholder="Nome de quem indicou"
                            className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                )}
                
                {formData.source === CustomerSource.Outros && (
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-text-secondary mb-1">Especifique como chegou</label>
                        <input 
                            type="text" 
                            name="sourceOther" 
                            value={formData.sourceOther || ''} 
                            onChange={handleChange} 
                            placeholder="Especifique..." 
                            className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                )}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-text-secondary mb-1">Data de Cadastro</label>
                    <input 
                        type="date" 
                        name="createdAt" 
                        value={new Date(formData.createdAt).toISOString().split('T')[0]} 
                        onChange={handleChange}
                        className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-secondary text-text-primary hover:opacity-90 transition-opacity">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded bg-primary hover:opacity-90 transition-opacity text-white">
                    {customer ? 'Salvar Alterações' : 'Salvar Cliente'}
                </button>
            </div>
        </form>
    );
};

interface CustomersProps {
    customers: Customer[];
    sales: Sale[];
    exchanges: Exchange[];
    specificOrders: SpecificOrder[];
    onSave: (customer: Customer) => void;
    onDelete: (customerId: string) => void;
    onSaveSpecificOrder: (order: SpecificOrder) => void;
    onDeleteSpecificOrder: (orderId: string) => void;
    onUpdateSpecificOrderStatus: (orderId: string, status: OrderStatus) => void;
}

const Customers: React.FC<CustomersProps> = ({ customers, sales, exchanges, specificOrders, onSave, onDelete, onSaveSpecificOrder, onDeleteSpecificOrder, onUpdateSpecificOrderStatus }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        status: '',
    });
    const [confirmModalState, setConfirmModalState] = useState<{
        isOpen: boolean;
        title: string;
        message: React.ReactNode;
        confirmText?: string;
        onConfirm?: (() => void) | null;
    }>({ isOpen: false, title: '', message: '' });

    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const clearFilters = () => {
        setFilters({ startDate: '', endDate: '', status: '' });
        setSearchTerm('');
    };

    const handleOpenModal = (customer: Customer | null = null) => {
        setEditingCustomer(customer);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingCustomer(null);
        setIsModalOpen(false);
    };

    const handleSave = (customer: Customer) => {
        onSave(customer);
        handleCloseModal();
    }

    const handleDelete = (customerId: string) => {
        onDelete(customerId);
        setConfirmModalState({ isOpen: false, title: '', message: '' });
    }

    const handleRequestDelete = (customer: Customer) => {
        const hasSales = sales.some(sale => sale.customerId === customer.id);

        if (hasSales) {
            setConfirmModalState({
                isOpen: true,
                title: "Ação Bloqueada",
                message: `O cliente "${customer.name}" não pode ser excluído pois possui um histórico de vendas associado.`,
                onConfirm: null,
            });
        } else {
            setConfirmModalState({
                isOpen: true,
                title: "Confirmar Exclusão",
                message: `Tem certeza que deseja excluir permanentemente o cliente "${customer.name}"? Esta ação não pode ser desfeita.`,
                confirmText: "Excluir Cliente",
                onConfirm: () => handleDelete(customer.id),
            });
        }
    };

    const filteredCustomers = useMemo(() => {
        return customers
            .filter(c => {
                const searchMatch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
                const statusMatch = filters.status ? c.status === filters.status : true;
                
                const createdAt = new Date(c.createdAt);
                
                let startDateMatch = true;
                if (filters.startDate) {
                    const startDate = new Date(filters.startDate);
                    startDate.setMinutes(startDate.getMinutes() + startDate.getTimezoneOffset());
                    startDate.setHours(0,0,0,0);
                    startDateMatch = createdAt >= startDate;
                }

                let endDateMatch = true;
                if (filters.endDate) {
                    const endDate = new Date(filters.endDate);
                    endDate.setMinutes(endDate.getMinutes() + endDate.getTimezoneOffset());
                    endDate.setHours(23,59,59,999);
                    endDateMatch = createdAt <= endDate;
                }

                return searchMatch && statusMatch && startDateMatch && endDateMatch;
            })
            .sort((a,b) => a.name.localeCompare(b.name));
    }, [customers, searchTerm, filters]);
    
    const selectedCustomer = useMemo(() => {
        return customers.find(c => c.id === selectedCustomerId);
    }, [customers, selectedCustomerId]);

    if (selectedCustomer) {
        return (
            <CustomerDetail
                customer={selectedCustomer}
                sales={sales.filter(s => s.customerId === selectedCustomer.id)}
                exchanges={exchanges.filter(ex => ex.customerId === selectedCustomer.id)}
                specificOrders={specificOrders.filter(so => so.customerId === selectedCustomer.id)}
                onBack={() => setSelectedCustomerId(null)}
                onSaveSpecificOrder={onSaveSpecificOrder}
                onDeleteSpecificOrder={onDeleteSpecificOrder}
                onUpdateSpecificOrderStatus={onUpdateSpecificOrderStatus}
            />
        );
    }

    const columns = [
        { 
            header: 'Nome', 
            accessor: (c: Customer) => (
                <button 
                    onClick={() => setSelectedCustomerId(c.id)}
                    className="font-medium text-primary hover:text-accent transition-colors duration-200 text-left"
                >
                    {c.name}
                </button>
            )
        },
        { header: 'Data Cadastro', accessor: (c: Customer) => new Date(c.createdAt).toLocaleDateString('pt-BR') },
        { header: 'Telefone', accessor: (c: Customer) => c.phone || '-' },
        { header: 'Status', accessor: (c: Customer) => c.status },
        { header: 'Como Chegou', accessor: (c: Customer) => {
            if (c.source === CustomerSource.Outros) {
                return c.sourceOther || c.source;
            }
            if (c.source === CustomerSource.Indicacao && c.sourceIndicatorName) {
                return `${c.source} (${c.sourceIndicatorName})`;
            }
            return c.source;
        }},
        { header: 'Total Gasto', accessor: (c: Customer) => {
            const total = sales.filter(s => s.customerId === c.id).reduce((sum, s) => sum + s.total, 0);
            return `R$ ${total.toFixed(2)}`;
        }},
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-2">
                <h1 className="text-4xl font-bold text-text-primary">Clientes</h1>
                <button onClick={() => handleOpenModal()} className="px-4 py-2 rounded-lg bg-primary hover:bg-accent text-white font-semibold transition-colors shadow-md">
                    + Adicionar Cliente
                </button>
            </div>

            <div className="bg-card p-4 rounded-lg space-y-4">
                <div className="relative">
                     <input type="text" placeholder="Pesquisar cliente por nome..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-input-bg text-text-primary p-2 pl-10 rounded border border-border-color focus:outline-none focus:ring-2 focus:ring-primary" />
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Data de Cadastro</label>
                        <div className="flex items-center gap-2">
                            <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color"/>
                            <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color"/>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Status do Cliente</label>
                        <select name="status" value={filters.status} onChange={handleFilterChange} className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color">
                            <option value="">Todos os Status</option>
                            {Object.values(CustomerStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="flex items-end">
                        {(filters.startDate || filters.endDate || filters.status || searchTerm) && (
                            <button onClick={clearFilters} className="w-full px-4 py-2 rounded bg-secondary text-text-primary hover:opacity-90 transition-opacity">
                                Limpar Filtros
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <Table
                columns={columns}
                data={filteredCustomers}
                actions={(customer) => (
                    <div className="space-x-4">
                        <button onClick={() => handleOpenModal(customer)} className="text-accent hover:opacity-80 transition-opacity font-medium">Editar</button>
                        <button onClick={() => handleRequestDelete(customer)} className="text-red-500 hover:text-red-400 transition-opacity font-medium">Excluir</button>
                    </div>
                )}
            />
            
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}>
                <CustomerForm customer={editingCustomer} onSave={handleSave} onClose={handleCloseModal} />
            </Modal>
            
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
                            {confirmModalState.onConfirm ? 'Cancelar' : 'OK'}
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

export default Customers;