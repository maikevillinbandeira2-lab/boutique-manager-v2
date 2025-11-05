
import React, { useState, useMemo, useEffect } from 'react';
import { Aplicacao, AplicacaoItem, PurchasePayment, PaymentSource, PaymentType } from '../types';
import Modal from './ui/Modal';
import Table from './ui/Table';

// Form component inside the Modal
interface AplicacaoFormProps {
    aplicacao: Aplicacao | null;
    onSave: (aplicacao: Aplicacao) => void;
    onClose: () => void;
}

const AplicacaoForm: React.FC<AplicacaoFormProps> = ({ aplicacao, onSave, onClose }) => {
    const [formData, setFormData] = useState<Omit<Aplicacao, 'id' | 'totalValue'>>(() => {
        if (aplicacao) {
            return {
                date: aplicacao.date,
                name: aplicacao.name,
                type: aplicacao.type,
                items: aplicacao.items,
                summaryDescription: aplicacao.summaryDescription,
                payments: aplicacao.payments
            };
        }
        return {
            date: new Date(),
            name: '',
            type: 'detalhada',
            items: [],
            summaryDescription: '',
            payments: [],
        };
    });

    const [resumidaTotalValue, setResumidaTotalValue] = useState<number | ''>(() => {
        if (aplicacao && aplicacao.type === 'resumida') {
            return aplicacao.totalValue;
        }
        return '';
    });

    // States for individual item input in 'detalhada' mode
    const [currentItem, setCurrentItem] = useState({ description: '', value: '' });
    const PAYMENT_SOURCES: PaymentSource[] = ['Caixa da loja', 'Maikellen', 'Dhaluma', 'Outros'];

    const totalValue = useMemo(() => {
        if (formData.type === 'resumida') {
            return Number(resumidaTotalValue) || 0;
        }
        return formData.items.reduce((sum, item) => sum + item.value, 0);
    }, [formData.items, formData.type, resumidaTotalValue]);

    const totalPaid = useMemo(() => formData.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0), [formData.payments]);

    const difference = totalValue - totalPaid;

    const handleAddItem = () => {
        if (!currentItem.description || !currentItem.value || Number(currentItem.value) <= 0) {
            alert("Preencha a descrição e um valor válido.");
            return;
        }
        const newItem: AplicacaoItem = {
            id: `app-item-${Date.now()}`,
            description: currentItem.description,
            value: Number(currentItem.value)
        };
        setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
        setCurrentItem({ description: '', value: '' });
    };

    const handleRemoveItem = (id: string) => {
        setFormData(prev => ({ ...prev, items: prev.items.filter(item => item.id !== id) }));
    };

    const handleAddPayment = () => {
        const newPayment: PurchasePayment = {
            id: `app-pay-${Date.now()}`,
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
        if (formData.type === 'detalhada' && formData.items.length === 0) {
            alert("Adicione ao menos um item para a aplicação detalhada.");
            return;
        }
        if (formData.type === 'resumida' && (!resumidaTotalValue || Number(resumidaTotalValue) <= 0)) {
            alert("Para aplicações resumidas, insira um valor total válido.");
            return;
        }
        if (Math.abs(difference) > 0.01) {
            alert("O valor total pago deve ser igual ao valor total da aplicação.");
            return;
        }

        const finalPayments = formData.payments.map(p => {
            if (p.source === 'Caixa da loja') {
                return { ...p, paymentsReceived: [{ id: `rec-${Date.now()}`, amount: p.amount, date: formData.date.toISOString().split('T')[0] }] };
            }
            return p;
        });

        onSave({
            id: aplicacao?.id || `app-${Date.now()}`,
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
                    <label className="block text-sm font-medium text-text-secondary mb-1">Data da Aplicação</label>
                    <input type="date" value={formData.date.toISOString().split('T')[0]} onChange={e => {
                      const dateInUTC = new Date(e.target.value);
                      const correctedDate = new Date(dateInUTC.getTime() + dateInUTC.getTimezoneOffset() * 60000);
                      setFormData(p => ({...p, date: correctedDate}))
                    }} required className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Nome da Aplicação</label>
                    <input type="text" value={formData.name} onChange={e => setFormData(p => ({...p, name: e.target.value}))} placeholder="Ex: Reforma da loja" required className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color"/>
                </div>
            </div>
            
            <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Tipo de Aplicação</label>
                <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="type" value="detalhada" checked={formData.type === 'detalhada'} onChange={() => setFormData(p => ({...p, type: 'detalhada'}))} className="form-radio text-primary" /> Detalhada</label>
                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="type" value="resumida" checked={formData.type === 'resumida'} onChange={() => setFormData(p => ({...p, type: 'resumida'}))} className="form-radio text-primary" /> Resumida</label>
                </div>
            </div>
            
            {formData.type === 'detalhada' ? (
                 <div className="bg-background p-4 rounded-lg border border-border-color space-y-3">
                    <h3 className="font-semibold text-text-primary">Itens da Aplicação</h3>
                    <div className="flex items-end gap-2 flex-wrap">
                        <input type="text" value={currentItem.description} onChange={e => setCurrentItem(i => ({...i, description: e.target.value}))} placeholder="Descrição do item" className="flex-grow bg-card text-text-primary p-2 rounded border border-border-color min-w-[200px]" />
                        <input type="number" value={currentItem.value} onChange={e => setCurrentItem(i => ({...i, value: e.target.value}))} placeholder="Valor (R$)" className="w-40 bg-card text-text-primary p-2 rounded border border-border-color" />
                        <button type="button" onClick={handleAddItem} className="px-4 py-2 rounded bg-accent text-white hover:opacity-90 transition-opacity">Adicionar</button>
                    </div>
                     <div className="space-y-2 max-h-40 overflow-y-auto">
                        {formData.items.map(item => (
                             <div key={item.id} className="flex justify-between items-center bg-card p-2 rounded text-sm">
                                <div><span className="font-semibold">{item.description}</span> - R$ {item.value.toFixed(2)}</div>
                                <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:text-red-400 font-bold px-2">X</button>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="bg-background p-4 rounded-lg border border-border-color space-y-4">
                    <h3 className="font-semibold text-text-primary">Detalhes da Aplicação Resumida</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-text-secondary mb-1">Descrição Geral (Opcional)</label>
                            <input type="text" value={formData.summaryDescription || ''} onChange={e => setFormData(p => ({...p, summaryDescription: e.target.value}))} className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Valor Total da Aplicação (R$)</label>
                            <input type="number" value={resumidaTotalValue} onChange={e => setResumidaTotalValue(e.target.value === '' ? '' : Number(e.target.value))} min="0.01" step="0.01" required className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color" />
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
                     <span className="text-lg">Total: <span className="text-primary">R$ {totalValue.toFixed(2)}</span></span>
                     <span className="text-lg">Pago: <span className="text-green-400">R$ {totalPaid.toFixed(2)}</span></span>
                     <span className={`text-lg ${Math.abs(difference) < 0.01 ? 'text-text-primary' : 'text-red-400'}`}>Diferença: R$ {difference.toFixed(2)}</span>
                </div>
                <div className="flex justify-end space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-secondary text-text-primary hover:opacity-90">Cancelar</button>
                    <button type="submit" className="px-6 py-3 rounded bg-primary text-white hover:opacity-90 font-semibold">{aplicacao ? 'Salvar Alterações' : 'Registrar Aplicação'}</button>
                </div>
            </div>
        </form>
    );
};

interface AplicacoesProps {
    aplicacoes: Aplicacao[];
    onSave: (aplicacao: Aplicacao) => void;
    onDelete: (aplicacaoId: string) => void;
}

const Aplicacoes: React.FC<AplicacoesProps> = ({ aplicacoes, onSave, onDelete }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAplicacao, setSelectedAplicacao] = useState<Aplicacao | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [filters, setFilters] = useState({ name: '', startDate: '', endDate: '' });

    const filteredAplicacoes = useMemo(() => {
        return aplicacoes.filter(p => {
            const nameMatch = filters.name ? p.name.toLowerCase().includes(filters.name.toLowerCase()) : true;
            
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
    }, [aplicacoes, filters]);

    const handleOpenModal = (aplicacao: Aplicacao | null = null) => {
        setSelectedAplicacao(aplicacao);
        setIsModalOpen(true);
    };

    const columns = [
        { header: 'Data', accessor: (p: Aplicacao) => new Date(p.date).toLocaleDateString('pt-BR') },
        { header: 'Nome da Aplicação', accessor: (p: Aplicacao) => p.name },
        { header: 'Tipo', accessor: (p: Aplicacao) => p.type === 'detalhada' ? 'Detalhada' : 'Resumida' },
        { header: 'Valor Total', accessor: (p: Aplicacao) => `R$ ${p.totalValue.toFixed(2)}` },
        { header: 'Pagamentos', accessor: (p: Aplicacao) => p.payments.map(pay => `${pay.source === 'Outros' ? (pay.otherSourceName || 'Outros') : pay.source} (R$ ${pay.amount.toFixed(2)})`).join(', ') },
    ];
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h1 className="text-4xl font-bold text-text-primary">Aplicações</h1>
                <button onClick={() => handleOpenModal()} className="px-4 py-2 rounded-lg bg-primary hover:bg-accent text-white font-semibold transition-colors shadow-md">
                    + Nova Aplicação
                </button>
            </div>

            <div className="bg-card p-4 rounded-lg space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                    <input type="text" placeholder="Buscar por nome da aplicação..." value={filters.name} onChange={e => setFilters(f => ({...f, name: e.target.value}))} className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color focus:outline-none focus:ring-2 focus:ring-primary" />
                    <div className="flex items-center gap-2">
                         <input type="date" value={filters.startDate} onChange={e => setFilters(f => ({...f, startDate: e.target.value}))} className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color"/>
                         <input type="date" value={filters.endDate} onChange={e => setFilters(f => ({...f, endDate: e.target.value}))} className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color"/>
                    </div>
                </div>
            </div>
            
            <Table
                columns={columns}
                data={filteredAplicacoes}
                actions={(aplicacao) => (
                    <div className="space-x-2">
                        <button onClick={() => handleOpenModal(aplicacao)} className="text-accent hover:opacity-80">Editar</button>
                        <button onClick={() => setConfirmDeleteId(aplicacao.id)} className="text-red-500 hover:text-red-400">Excluir</button>
                    </div>
                )}
            />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedAplicacao ? 'Editar Aplicação' : 'Nova Aplicação'}>
                <AplicacaoForm aplicacao={selectedAplicacao} onSave={onSave} onClose={() => setIsModalOpen(false)} />
            </Modal>

            <Modal isOpen={!!confirmDeleteId} onClose={() => setConfirmDeleteId(null)} title="Confirmar Exclusão">
                <div>
                    <p className="text-text-secondary mb-6">Tem certeza que deseja excluir este registro de aplicação? Esta ação é irreversível.</p>
                    <div className="flex justify-end space-x-2">
                        <button onClick={() => setConfirmDeleteId(null)} className="px-4 py-2 rounded bg-secondary text-text-primary hover:opacity-90">Cancelar</button>
                        <button onClick={() => { onDelete(confirmDeleteId!); setConfirmDeleteId(null); }} className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700">Excluir</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Aplicacoes;