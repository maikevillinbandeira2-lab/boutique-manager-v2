
import React, { useState, useMemo } from 'react';
import { Product, ProductCondition, Sale } from '../types';
import Table from './ui/Table';
import Modal from './ui/Modal';

interface ProductFormProps {
  product: Product | null;
  onSave: (product: Product) => void;
  onClose: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ product, onSave, onClose }) => {
    const [formData, setFormData] = useState<Product>(
        product || {
            id: `prod-${Date.now()}`,
            name: '',
            description: '',
            category: '',
            brand: '',
            condition: ProductCondition.Novo,
            size: '',
            color: '',
            price: 0,
            purchasePrice: 0,
            quantity: 1,
            createdAt: new Date(),
        }
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
            const numValue = ['price', 'purchasePrice', 'quantity'].includes(name) ? parseFloat(value) || 0 : value;
            setFormData(prev => ({ ...prev, [name]: numValue }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as Product);
        onClose();
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-text-secondary mb-1">Nome do Produto</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Nome do Produto" required className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-text-secondary mb-1">Descrição</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Descrição detalhada do produto" rows={3} className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Marca</label>
                    <input type="text" name="brand" value={formData.brand} onChange={handleChange} placeholder="Marca" className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Categoria</label>
                    <select name="category" value={formData.category} onChange={handleChange} required className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color focus:outline-none focus:ring-2 focus:ring-primary">
                        <option value="">Selecione Categoria</option>
                        <option value="Roupas">Roupas</option>
                        <option value="Calçados">Calçados</option>
                        <option value="Acessórios">Acessórios</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Tamanho</label>
                    <input type="text" name="size" value={formData.size} onChange={handleChange} placeholder="Tamanho (ex: M, 42, Único)" className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Cor</label>
                    <input type="text" name="color" value={formData.color} onChange={handleChange} placeholder="Cor" className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Tipo</label>
                    <select name="condition" value={formData.condition} onChange={handleChange} required className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color focus:outline-none focus:ring-2 focus:ring-primary">
                        <option value={ProductCondition.Novo}>Novo</option>
                        <option value={ProductCondition.Usado}>Usado</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Quantidade</label>
                    <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} placeholder="Qtd." min="1" required className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Valor de Compra (R$)</label>
                    <input type="number" name="purchasePrice" value={formData.purchasePrice} onChange={handleChange} placeholder="Valor de Compra (R$)" min="0" step="0.01" className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Valor de Venda (R$)</label>
                    <input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="Valor de Venda (R$)" min="0.01" step="0.01" required className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
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
                <button type="submit" className="px-4 py-2 rounded bg-primary hover:opacity-90 transition-opacity text-white">Salvar Produto</button>
            </div>
        </form>
    );
};

interface ProductsProps {
  products: Product[];
  sales: Sale[];
  onSave: (product: Product) => void;
  onBulkDelete: (productIds: string[]) => void;
}

const Products: React.FC<ProductsProps> = ({ products, sales, onSave, onBulkDelete }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
    
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        category: '',
        condition: '',
        startDate: '',
        endDate: '',
        purchasePrice: '',
        salePrice: '',
    });
    
    const [confirmModalState, setConfirmModalState] = useState<{
        isOpen: boolean;
        title: string;
        message: React.ReactNode;
        confirmText?: string;
        onConfirm?: () => void;
    }>({ isOpen: false, title: '', message: '' });

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const searchMatch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
            const categoryMatch = filters.category ? p.category === filters.category : true;
            const conditionMatch = filters.condition ? p.condition === filters.condition : true;
            
            const createdAt = new Date(p.createdAt);
            
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

            const purchasePriceMatch = filters.purchasePrice
                ? p.purchasePrice === parseFloat(filters.purchasePrice)
                : true;
            const salePriceMatch = filters.salePrice
                ? p.price === parseFloat(filters.salePrice)
                : true;

            return searchMatch && categoryMatch && conditionMatch && startDateMatch && endDateMatch && purchasePriceMatch && salePriceMatch;
        });
    }, [products, searchTerm, filters]);
    
    const handleSelect = (productId: string) => {
        setSelectedProductIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(productId)) {
                newSet.delete(productId);
            } else {
                newSet.add(productId);
            }
            return newSet;
        });
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedProductIds(new Set(filteredProducts.map(p => p.id)));
        } else {
            setSelectedProductIds(new Set());
        }
    };

    const handleOpenModal = (product: Product | null = null) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setSelectedProduct(null);
        setIsModalOpen(false);
    };

    const handleDeleteSelected = () => {
        const soldProductIds = new Set(sales.flatMap(sale => sale.items.map(item => item.productId)));
    
        const idsToProcess = [...selectedProductIds];
        const deletableIds: string[] = [];
        const nonDeletableProducts: Product[] = [];
    
        idsToProcess.forEach(id => {
            const product = products.find(p => p.id === id);
            if (product) {
                if (soldProductIds.has(id)) {
                    nonDeletableProducts.push(product);
                } else {
                    deletableIds.push(id);
                }
            }
        });
    
        if (deletableIds.length === 0 && nonDeletableProducts.length === 0) {
            return; // Nothing selected
        }
        
        if (deletableIds.length === 0) {
            const productList = nonDeletableProducts.map(p => <li key={p.id}>{p.name}</li>);
            setConfirmModalState({
                isOpen: true,
                title: "Aviso de Exclusão",
                message: (
                    <div>
                        <p className="mb-4">Não é possível excluir o(s) produto(s) selecionado(s) pois eles possuem um histórico de vendas:</p>
                        <ul className="list-disc list-inside bg-background p-2 rounded">{productList}</ul>
                    </div>
                )
            });
            return;
        }
    
        const onConfirmAction = () => {
            onBulkDelete(deletableIds);
            setSelectedProductIds(new Set());
            setConfirmModalState({ isOpen: false, title: '', message: '' });
        };
        
        let confirmMessageBody;
        if (nonDeletableProducts.length > 0) {
             const deletableProducts = products.filter(p => deletableIds.includes(p.id));
             const deletableList = deletableProducts.map(p => <li key={p.id}>{p.name}</li>);
             const nonDeletableList = nonDeletableProducts.map(p => <li key={p.id}>{p.name}</li>);
             confirmMessageBody = (
                 <div>
                     <p className="mb-4">Você confirma a exclusão permanente do(s) seguinte(s) item(ns)?</p>
                     <ul className="list-disc list-inside bg-background p-2 rounded mb-4">{deletableList}</ul>
                     <p className="mb-4 font-semibold text-accent">Atenção: O(s) seguinte(s) produto(s) não será(ão) excluído(s) por possuir(em) histórico de vendas:</p>
                     <ul className="list-disc list-inside bg-background p-2 rounded">{nonDeletableList}</ul>
                 </div>
             );
        } else {
            const deletableProducts = products.filter(p => deletableIds.includes(p.id));
            const deletableList = deletableProducts.map(p => <li key={p.id}>{p.name}</li>);
            confirmMessageBody = (
                <div>
                     <p className="mb-4">Tem certeza que deseja excluir permanentemente o(s) seguinte(s) produto(s)?</p>
                     <ul className="list-disc list-inside bg-background p-2 rounded">{deletableList}</ul>
                </div>
            );
        }

        setConfirmModalState({
            isOpen: true,
            title: "Confirmação de Exclusão",
            message: confirmMessageBody,
            confirmText: `Excluir ${deletableIds.length} item(s)`,
            onConfirm: onConfirmAction,
        });
    };
    
    const columns = [
        { 
            header: <input 
                type="checkbox"
                className="form-checkbox h-4 w-4 text-primary bg-card border-border-color rounded focus:ring-primary"
                onChange={handleSelectAll}
                checked={filteredProducts.length > 0 && selectedProductIds.size === filteredProducts.length}
                aria-label="Selecionar todos os produtos"
             />, 
            accessor: (p: Product) => <input 
                type="checkbox"
                className="form-checkbox h-4 w-4 text-primary bg-card border-border-color rounded focus:ring-primary"
                checked={selectedProductIds.has(p.id)}
                onChange={() => handleSelect(p.id)}
                aria-label={`Selecionar produto ${p.name}`}
            />,
            className: 'w-4'
        },
        { header: 'Produto', accessor: (p: Product) => (
            <div>
                <div className="font-medium text-text-primary">{p.name}</div>
                <div className="text-sm text-text-secondary">{p.brand}</div>
            </div>
        )},
        { header: 'Data Cadastro', accessor: (p: Product) => new Date(p.createdAt).toLocaleDateString('pt-BR')},
        { header: 'Estoque', accessor: (p: Product) => p.quantity },
        { header: 'Valor Compra', accessor: (p: Product) => `R$ ${p.purchasePrice.toFixed(2)}` },
        { header: 'Valor Venda', accessor: (p: Product) => `R$ ${p.price.toFixed(2)}` },
        { 
            header: 'Lucro (R$)', 
            accessor: (p: Product) => {
                const profit = p.purchasePrice > 0 ? p.price - p.purchasePrice : 0;
                const profitColor = profit > 0 ? 'text-green-400' : profit < 0 ? 'text-red-400' : 'text-text-primary';
                return <span className={`font-semibold ${profitColor}`}>R$ {profit.toFixed(2)}</span>;
            } 
        },
        { header: 'Condição', accessor: (p: Product) => p.condition },
        { header: 'Categoria', accessor: (p: Product) => p.category },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h1 className="text-4xl font-bold text-text-primary">Produtos</h1>
                <div className="flex items-center gap-2">
                    {selectedProductIds.size > 0 && (
                         <button onClick={handleDeleteSelected} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors shadow-md">
                            Excluir ({selectedProductIds.size})
                        </button>
                    )}
                    <button onClick={() => handleOpenModal()} className="px-4 py-2 rounded-lg bg-primary hover:bg-accent text-white font-semibold transition-colors shadow-md">
                        + Adicionar Produto
                    </button>
                </div>
            </div>

            <div className="bg-card p-4 rounded-lg space-y-4">
                <div className="relative">
                     <input type="text" placeholder="Pesquisar por nome do produto..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-input-bg text-text-primary p-2 pl-10 rounded border border-border-color focus:outline-none focus:ring-2 focus:ring-primary" />
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div>
                        <label className="block text-text-secondary mb-1">Data de Cadastro</label>
                        <div className="flex items-center gap-2">
                            <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color"/>
                            <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color"/>
                        </div>
                    </div>
                    <div>
                        <label className="block text-text-secondary mb-1">Categoria / Tipo</label>
                         <div className="flex items-center gap-2">
                            <select name="category" value={filters.category} onChange={handleFilterChange} className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color">
                                <option value="">Toda Categoria</option>
                                <option value="Roupas">Roupas</option>
                                <option value="Calçados">Calçados</option>
                                <option value="Acessórios">Acessórios</option>
                            </select>
                            <select name="condition" value={filters.condition} onChange={handleFilterChange} className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color">
                                <option value="">Todo Tipo</option>
                                <option value={ProductCondition.Novo}>Novo</option>
                                <option value={ProductCondition.Usado}>Usado</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-text-secondary mb-1">Valores Exatos (R$)</label>
                         <div className="flex items-center gap-2">
                            <input type="number" name="purchasePrice" placeholder="Compra" value={filters.purchasePrice} onChange={handleFilterChange} className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color"/>
                            <input type="number" name="salePrice" placeholder="Venda" value={filters.salePrice} onChange={handleFilterChange} className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color"/>
                        </div>
                    </div>
                </div>
            </div>

            <Table
                columns={columns}
                data={filteredProducts}
                actions={(product) => (
                    <div className="space-x-2">
                        <button onClick={() => handleOpenModal(product)} className="text-accent hover:opacity-80 transition-opacity">Editar</button>
                    </div>
                )}
            />
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={selectedProduct ? 'Editar Produto' : 'Novo Produto'}>
                <ProductForm product={selectedProduct} onSave={onSave} onClose={handleCloseModal} />
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
                            onClick={() => {
                                setConfirmModalState({ isOpen: false, title: '', message: '' });
                                if(!confirmModalState.onConfirm) {
                                    setSelectedProductIds(new Set());
                                }
                            }}
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

export default Products;
