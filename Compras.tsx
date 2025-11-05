import React, { useState, useMemo, useEffect } from 'react';
import { Purchase, PurchaseItem, PurchasePayment, PurchaseType, PaymentSource, ProductCondition, PaymentType } from '../types';
import Modal from './ui/Modal';
import Table from './ui/Table';

// Form component inside the Modal
interface PurchaseFormProps {
    purchase: Purchase | null;
    onSave: (purchase: Purchase) => void;
    onClose: () => void;
}

const PurchaseForm: React.FC<PurchaseFormProps> = ({ purchase, onSave, onClose }) => {
    const [formData, setFormData] = useState<Omit<Purchase, 'id' | 'totalValue'>>(() => {
        if (purchase) {
            return {
                date: purchase.date,
                collectionName: purchase.collectionName,
                purchaseType: purchase.purchaseType,
                items: purchase.items,
                lotInfo: purchase.lotInfo,
                payments: purchase.payments
            };
        }
        return {
            date: new Date(),
            collectionName: '',
            purchaseType: 'detalhado',
            items: [],
            lotInfo: {
                quantity: 0,
                includesClothing: false,
                includesFootwear: false,
                includesAccessories: false,
                includesNew: false,
                includesUsed: false,
            },
            payments: [],
        };
    });

    const [lotTotalValue, setLotTotalValue] = useState<number | ''>(() => {
        if (purchase && purchase.purchaseType === 'lote') {
            return purchase.totalValue;
        }
        return '';
    });

    // States for individual item input in 'detalhado' mode
    const [currentItem, setCurrentItem] = useState({ description: '', purchaseValue: '', category: 'Roupas' as 'Roupas' | 'Calçados' | 'Acessórios', condition: ProductCondition.Novo });
    const PAYMENT_SOURCES: PaymentSource[] = ['Caixa da loja', 'Maikellen', 'Dhaluma', 'Outros'];

    const totalValue = useMemo(() => {
        if (formData.purchaseType === 'lote') {
            return Number(lotTotalValue) || 0;
        }
        return formData.items.reduce((sum, item) => sum + item.purchaseValue, 0);
    }, [formData.items, formData.purchaseType, lotTotalValue]);

    const totalPaid = useMemo(() => formData.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0), [formData.payments]);

    const difference = totalValue - totalPaid;

    const handleAddItem = () => {
        if (!currentItem.description || !currentItem.purchaseValue || Number(currentItem.purchaseValue) <= 0) {
            alert("Preencha a descrição e um valor de compra válido.");
            return;
        }
        const newItem: PurchaseItem = {
            id: `p-item-${Date.now()}`,
            ...currentItem,
            purchaseValue: Number(currentItem.purchaseValue)
        };
        setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
        setCurrentItem({ description: '', purchaseValue: '', category: 'Roupas', condition: ProductCondition.Novo });
    };

    const handleRemoveItem = (id: string) => {
        setFormData(prev => ({ ...prev, items: prev.items.filter(item => item.id !== id) }));
    };

    const handleAddPayment = () => {
        const newPayment: PurchasePayment = {
            id: `pur-pay-${Date.now()}`,
            source: 'Caixa da loja',
            amount: difference > 0 ? difference : 0,
            paymentMethod: PaymentType.Pix,
            paymentsReceived: []
        };
        setFormData(prev => ({ ...prev, payments: [...prev.payments, newPayment] }));
    };

    const handlePaymentChange = (id: string, field: keyof PurchasePayment, value: any) => {
        setFormData(prev => ({
            ...prev,
            payments: prev.payments.map(p => p.id === id ? { ...p, [field]: value } : p)
        }));
    };

    const handleRemovePayment = (id: string) => {
        setFormData(prev => ({ ...prev, payments: prev.payments.filter(p => p.id !== id) }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.purchaseType === 'detalhado' && formData.items.length === 0) {
            alert("Adicione ao menos um item para a compra detalhada.");
            return;
        }
        if (formData.purchaseType === 'lote' && (!lotTotalValue || Number(lotTotalValue) <= 0)) {
            alert("Para compras por lote, insira um valor total válido.");
            return;
        }
        if (Math.abs(difference) > 0.01) {
            alert("O valor total pago deve ser igual ao valor total da compra.");
            return;
        }

        const finalPayments = formData.payments.map(p => {
            if (p.source === 'Caixa da loja') {
                return { ...p, paymentsReceived: [{ id: `rec-${Date.now()}`, amount: p.amount, date: formData.date.toISOString().split('T')[0] }] };
            }
            return p;
        });

        onSave({
            id: purchase?.id || `purch-${Date.now()}`,
            ...formData,
            payments: finalPayments,
            totalValue
        });
        onClose();
    };


    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Data da Compra</label>
                    <input type="date" value={formData.date.toISOString().split('T')[0]} onChange={e => setFormData(p => ({...p, date: new Date(e.target.value)}))} required className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Nome da Coleção/Compra</label>
                    <input type="text" value={formData.collectionName} onChange={e => setFormData(p => ({...p, collectionName: e.target.value}))} placeholder="Ex: Coleção Inverno 24" required className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color"/>
                </div>
            </div>
            
            <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Tipo de Compra</label>
                <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="purchaseType" value="detalhado" checked={formData.purchaseType === 'detalhado'} onChange={() => setFormData(p => ({...p, purchaseType: 'detalhado'}))} className="form-radio text-primary" /> Detalhado</label>
                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="purchaseType" value="lote" checked={formData.purchaseType === 'lote'} onChange={() => setFormData(p => ({...p, purchaseType: 'lote'}))} className="form-radio text-primary" /> Por Lote</label>
                </div>
            </div>
            
            {formData.purchaseType === 'detalhado' ? (
                 <div className="bg-background p-4 rounded-lg border border-border-color space-y-3">
                    <h3 className="font-semibold text-text-primary">Itens da Compra</h3>
                    <div className="flex items-end gap-2 flex-wrap">
                        <input type="text" value={currentItem.description} onChange={e => setCurrentItem(i => ({...i, description: e.target.value}))} placeholder="Descrição do produto" className="flex-grow bg-card text-text-primary p-2 rounded border border-border-color min-w-[200px]" />
                        <input type="number" value={currentItem.purchaseValue} onChange={e => setCurrentItem(i => ({...i, purchaseValue: e.target.value}))} placeholder="Valor (R$)" className="w-28 bg-card text-text-primary p-2 rounded border border-border-color" />
                        <select value={currentItem.category} onChange={e => setCurrentItem(i => ({...i, category: e.target.value as any}))} className="w-32 bg-card text-text-primary p-2 rounded border border-border-color">
                             <option value="Roupas">Roupas</option>
                             <option value="Calçados">Calçados</option>
                             <option value="Acessórios">Acessórios</option>
                        </select>
                        <select value={currentItem.condition} onChange={e => setCurrentItem(i => ({...i, condition: e.target.value as any}))} className="w-28 bg-card text-text-primary p-2 rounded border border-border-color">
                             <option value={ProductCondition.Novo}>Novo</option>
                             <option value={ProductCondition.Usado}>Usado</option>
                        </select>
                        <button type="button" onClick={handleAddItem} className="px-4 py-2 rounded bg-accent text-white hover:opacity-90 transition-opacity">Add</button>
                    </div>
                     <div className="space-y-2 max-h-40 overflow-y-auto">
                        {formData.items.map(item => (
                             <div key={item.id} className="flex justify-between items-center bg-card p-2 rounded text-sm">
                                <div><span className="font-semibold">{item.description}</span> ({item.category}/{item.condition}) - R$ {item.purchaseValue.toFixed(2)}</div>
                                <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:text-red-400 font-bold px-2">X</button>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="bg-background p-4 rounded-lg border border-border-color space-y-4">
                    <h3 className="font-semibold text-text-primary">Detalhes do Lote</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Qtd. de Peças</label>
                            <input type="number" value={formData.lotInfo?.quantity || ''} onChange={e => setFormData(p => ({...p, lotInfo: {...p.lotInfo!, quantity: Number(e.target.value)}}))} min="1" required className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Valor Total da Compra (R$)</label>
                            <input type="number" value={lotTotalValue} onChange={e => setLotTotalValue(e.target.value === '' ? '' : Number(e.target.value))} min="0.01" step="0.01" required className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color" />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <p className="text-sm font-medium text-text-secondary">O que inclui?</p>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.lotInfo?.includesClothing} onChange={e => setFormData(p => ({...p, lotInfo: {...p.lotInfo!, includesClothing: e.target.checked}}))} className="form-checkbox text-primary" /> Roupas</label>
                                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.lotInfo?.includesFootwear} onChange={e => setFormData(p => ({...p, lotInfo: {...p.lotInfo!, includesFootwear: e.target.checked}}))} className="form-checkbox text-primary" /> Calçados</label>
                                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.lotInfo?.includesAccessories} onChange={e => setFormData(p => ({...p, lotInfo: {...p.lotInfo!, includesAccessories: e.target.checked}}))} className="form-checkbox text-primary" /> Acessórios</label>
                                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.lotInfo?.includesNew} onChange={e => setFormData(p => ({...p, lotInfo: {...p.lotInfo!, includesNew: e.target.checked}}))} className="form-checkbox text-primary" /> Novos</label>
                                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.lotInfo?.includesUsed} onChange={e => setFormData(p => ({...p, lotInfo: {...p.lotInfo!, includesUsed: e.target.checked}}))} className="form-checkbox text-primary" /> Usados</label>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-background p-4 rounded-lg border border-border-color space-y-3">
                <h3 className="font-semibold text-text-primary">Pagamento</h3>
                 <div className="space-y-3 max-h-48 overflow-y-auto">
                    {formData.payments.map(p => (
                        <div key={p.id} className="bg-card p-3 rounded-md grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                            <select value={p.source} onChange={e => handlePaymentChange(p.id, 'source', e.target.value)} className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color">
                                {PAYMENT_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            {p.source === 'Outros' && <input type="text" placeholder="Nome (Outros)" value={p.otherSourceName || ''} onChange={e => handlePaymentChange(p.id, 'otherSourceName', e.target.value)} className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color"/>}
                             <select value={p.paymentMethod} onChange={e => handlePaymentChange(p.id, 'paymentMethod', e.target.value)} className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color">
                                {Object.values(PaymentType).filter(pt => pt !== PaymentType.APrazo).map(pt => <option key={pt} value={pt}>{pt}</option>)}
                            </select>
                            <input type="number" placeholder="Valor (R$)" value={p.amount} onChange={e => handlePaymentChange(p.id, 'amount', e.target.value ? parseFloat(e.target.value) : '')} step="0.01" className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color"/>
                            <button type="button" onClick={() => handleRemovePayment(p.id)} className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition-opacity text-sm">Remover</button>
                        </div>
                    ))}
                 </div>
                 <button type="button" onClick={handleAddPayment} className="px-4 py-2 text-sm rounded bg-secondary hover:opacity-90 transition-opacity">+ Adicionar Pagamento</button>
            </div>

            <div className="pt-4 border-t border-border-color">
                <div className="flex justify-end items-baseline space-x-4 font-bold mb-4">
                     <span className="text-lg">Total Compra: <span className="text-primary">R$ {totalValue.toFixed(2)}</span></span>
                     <span className="text-lg">Total Pago: <span className="text-green-400">R$ {totalPaid.toFixed(2)}</span></span>
                     <span className={`text-lg ${Math.abs(difference) < 0.01 ? 'text-text-primary' : 'text-red-400'}`}>Diferença: R$ {difference.toFixed(2)}</span>
                </div>
                <div className="flex justify-end space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-secondary text-text-primary hover:opacity-90">Cancelar</button>
                    <button type="submit" className="px-6 py-3 rounded bg-primary text-white hover:opacity-90 font-semibold">{purchase ? 'Salvar Alterações' : 'Registrar Compra'}</button>
                </div>
            </div>
        </form>
    );
};

interface ComprasProps {
    purchases: Purchase[];
    onSave: (purchase: Purchase) => void;
    onDelete: (purchaseId: string) => void;
}

const Compras: React.FC<ComprasProps> = ({ purchases, onSave, onDelete }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [filters, setFilters] = useState({ collectionName: '', startDate: '', endDate: '' });

    const filteredPurchases = useMemo(() => {
        return purchases.filter(p => {
            const nameMatch = filters.collectionName ? p.collectionName.toLowerCase().includes(filters.collectionName.toLowerCase()) : true;
            
            const pDate = new Date(p.date);
            let startMatch = true;
            if (filters.startDate) {
                const startDate = new Date(filters.startDate);
                startDate.setMinutes(startDate.getMinutes() + startDate.getTimezoneOffset());
                startDate.setHours(0,0,0,0);
                startMatch = pDate >= startDate;
            }
            let endMatch = true;
            if (filters.endDate) {
                const endDate = new Date(filters.endDate);
                endDate.setMinutes(endDate.getMinutes() + endDate.getTimezoneOffset());
                endDate.setHours(23,59,59,999);
                endMatch = pDate <= endDate;
            }
            return nameMatch && startMatch && endMatch;
        });
    }, [purchases, filters]);

    const handleOpenModal = (purchase: Purchase | null = null) => {
        setSelectedPurchase(purchase);
        setIsModalOpen(true);
    };

    const columns = [
        { header: 'Data', accessor: (p: Purchase) => new Date(p.date).toLocaleDateString('pt-BR') },
        { header: 'Coleção/Compra', accessor: (p: Purchase) => p.collectionName },
        { header: 'Tipo', accessor: (p: Purchase) => p.purchaseType === 'detalhado' ? 'Detalhado' : 'Lote' },
        { header: 'Valor Total', accessor: (p: Purchase) => `R$ ${p.totalValue.toFixed(2)}` },
        { header: 'Pagamentos', accessor: (p: Purchase) => p.payments.map(pay => `${pay.source === 'Outros' ? (pay.otherSourceName || 'Outros') : pay.source} (R$ ${pay.amount.toFixed(2)})`).join(', ') },
    ];
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h1 className="text-4xl font-bold text-text-primary">Compras</h1>
                <button onClick={() => handleOpenModal()} className="px-4 py-2 rounded-lg bg-primary hover:bg-accent text-white font-semibold transition-colors shadow-md">
                    + Nova Compra
                </button>
            </div>

            <div className="bg-card p-4 rounded-lg space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                    <input type="text" placeholder="Buscar por nome da coleção..." value={filters.collectionName} onChange={e => setFilters(f => ({...f, collectionName: e.target.value}))} className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color focus:outline-none focus:ring-2 focus:ring-primary" />
                    <div className="flex items-center gap-2">
                         <input type="date" value={filters.startDate} onChange={e => setFilters(f => ({...f, startDate: e.target.value}))} className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color"/>
                         <input type="date" value={filters.endDate} onChange={e => setFilters(f => ({...f, endDate: e.target.value}))} className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color"/>
                    </div>
                </div>
            </div>
            
            <Table
                columns={columns}
                data={filteredPurchases}
                actions={(purchase) => (
                    <div className="space-x-2">
                        <button onClick={() => handleOpenModal(purchase)} className="text-accent hover:opacity-80">Editar</button>
                        <button onClick={() => setConfirmDeleteId(purchase.id)} className="text-red-500 hover:text-red-400">Excluir</button>
                    </div>
                )}
            />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedPurchase ? 'Editar Compra' : 'Nova Compra'}>
                <PurchaseForm purchase={selectedPurchase} onSave={onSave} onClose={() => setIsModalOpen(false)} />
            </Modal>

            <Modal isOpen={!!confirmDeleteId} onClose={() => setConfirmDeleteId(null)} title="Confirmar Exclusão">
                <div>
                    <p className="text-text-secondary mb-6">Tem certeza que deseja excluir este registro de compra? Esta ação é irreversível.</p>
                    <div className="flex justify-end space-x-2">
                        <button onClick={() => setConfirmDeleteId(null)} className="px-4 py-2 rounded bg-secondary text-text-primary hover:opacity-90">Cancelar</button>
                        <button onClick={() => { onDelete(confirmDeleteId!); setConfirmDeleteId(null); }} className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700">Excluir</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Compras;