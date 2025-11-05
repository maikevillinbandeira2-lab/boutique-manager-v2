import React, { useState, useMemo } from 'react';
import { Purchase, ReceivedPayment, Aplicacao } from '../types';
import Modal from './ui/Modal';
import StatCard from './ui/StatCard';
import { ICONS } from '../constants';

interface InvestorPayment {
    id: string; // purchaseId or aplicacaoId
    date: Date;
    name: string; // collectionName or aplicacaoName
    paymentId: string;
    investorName: string;
    investedAmount: number;
    paymentsReceived: ReceivedPayment[];
    sourceType: 'purchase' | 'application';
}

interface RegisterPaymentModalProps {
    investorPayment: InvestorPayment;
    onSave: (id: string, paymentId: string, receivedPayment: ReceivedPayment, sourceType: 'purchase' | 'application') => void;
    onClose: () => void;
}

const RegisterPaymentModal: React.FC<RegisterPaymentModalProps> = ({ investorPayment, onSave, onClose }) => {
    const paidAmount = useMemo(() => (Array.isArray(investorPayment.paymentsReceived) ? investorPayment.paymentsReceived : []).reduce((sum, p) => sum + p.amount, 0), [investorPayment]);
    const pendingAmount = investorPayment.investedAmount - paidAmount;
    
    const [amount, setAmount] = useState(pendingAmount > 0 ? pendingAmount.toFixed(2) : '');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const paymentAmount = Number(amount);
        if (!paymentAmount || paymentAmount <= 0 || paymentAmount > pendingAmount + 0.001) {
            alert("Por favor, insira um valor de pagamento válido, que não seja maior que o valor pendente.");
            return;
        }

        const newPayment: ReceivedPayment = {
            id: `rec-${Date.now()}`,
            amount: paymentAmount,
            date,
        };
        onSave(investorPayment.id, investorPayment.paymentId, newPayment, investorPayment.sourceType);
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-lg">Registrar Recebimento para <span className="font-bold text-primary">{investorPayment.investorName}</span></h3>
            <p>Referente a: <span className="font-semibold">{investorPayment.name}</span></p>
            <p>Valor Pendente: <span className="font-bold text-accent">R$ {pendingAmount.toFixed(2)}</span></p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Valor Pago (R$)</label>
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} step="0.01" max={pendingAmount} required className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Data do Pagamento</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color"/>
                </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-secondary text-text-primary hover:opacity-90">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded bg-primary text-white hover:opacity-90">Salvar Pagamento</button>
            </div>
        </form>
    );
};

const PaymentHistoryModal: React.FC<{ payments: ReceivedPayment[], onClose: () => void }> = ({ payments, onClose }) => (
    <div>
        <ul className="space-y-2 max-h-60 overflow-y-auto">
            {(Array.isArray(payments) ? payments : []).map(p => (
                <li key={p.id} className="flex justify-between items-center bg-background p-2 rounded">
                    <span>{new Date(p.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</span>
                    <span className="font-semibold">R$ {p.amount.toFixed(2)}</span>
                </li>
            ))}
        </ul>
        <div className="flex justify-end pt-4 mt-4 border-t border-border-color">
            <button onClick={onClose} className="px-4 py-2 rounded bg-secondary text-text-primary hover:opacity-90">Fechar</button>
        </div>
    </div>
);


interface InvestidoresProps {
    purchases: Purchase[];
    aplicacoes: Aplicacao[];
    onAddPayment: (id: string, paymentId: string, receivedPayment: ReceivedPayment, sourceType: 'purchase' | 'application') => void;
}

const Investidores: React.FC<InvestidoresProps> = ({ purchases, aplicacoes, onAddPayment }) => {

    const [paymentModal, setPaymentModal] = useState<{isOpen: boolean, payment: InvestorPayment | null}>({isOpen: false, payment: null});
    const [paymentHistoryModal, setPaymentHistoryModal] = useState<{isOpen: boolean, payments: ReceivedPayment[]}>({isOpen: false, payments: []});

    const allInvestorPayments = useMemo<InvestorPayment[]>(() => {
        const fromPurchases = (Array.isArray(purchases) ? purchases : []).flatMap(purchase => 
            (Array.isArray(purchase.payments) ? purchase.payments : []).filter(p => p.source !== 'Caixa da loja').map(p => ({
                id: purchase.id,
                date: purchase.date,
                name: purchase.collectionName,
                paymentId: p.id,
                investorName: p.source === 'Outros' ? (p.otherSourceName || 'Outros') : p.source,
                investedAmount: p.amount,
                paymentsReceived: p.paymentsReceived || [],
                sourceType: 'purchase' as const
            }))
        );
        const fromAplicacoes = (Array.isArray(aplicacoes) ? aplicacoes : []).flatMap(aplicacao => 
            (Array.isArray(aplicacao.payments) ? aplicacao.payments : []).filter(p => p.source !== 'Caixa da loja').map(p => ({
                id: aplicacao.id,
                date: aplicacao.date,
                name: aplicacao.name,
                paymentId: p.id,
                investorName: p.source === 'Outros' ? (p.otherSourceName || 'Outros') : p.source,
                investedAmount: p.amount,
                paymentsReceived: p.paymentsReceived || [],
                sourceType: 'application' as const
            }))
        );
        return [...fromPurchases, ...fromAplicacoes].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [purchases, aplicacoes]);

    const groupedByInvestor = useMemo(() => {
        return allInvestorPayments.reduce((acc, p) => {
            if (!acc[p.investorName]) {
                acc[p.investorName] = [];
            }
            acc[p.investorName].push(p);
            return acc;
        }, {} as Record<string, InvestorPayment[]>);
    }, [allInvestorPayments]);

    const summary = useMemo(() => {
        const totalInvested = allInvestorPayments.reduce((sum, p) => sum + p.investedAmount, 0);
        const totalReceived = allInvestorPayments.reduce((sum, p) => {
            const receivedSum = (Array.isArray(p.paymentsReceived) ? p.paymentsReceived : []).reduce((s, rp) => s + rp.amount, 0);
            return sum + receivedSum;
        }, 0);
        return {
            totalInvested,
            totalReceived,
            totalPending: totalInvested - totalReceived,
        }
    }, [allInvestorPayments]);

    return (
        <div className="space-y-8">
            <h1 className="text-4xl font-bold text-text-primary">Investidores</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Total Investido" value={`R$ ${summary.totalInvested.toFixed(2)}`} icon={ICONS.investidores} />
                <StatCard title="Total Devolvido" value={`R$ ${summary.totalReceived.toFixed(2)}`} icon={ICONS.sales} />
                <StatCard title="Total Pendente" value={`R$ ${summary.totalPending.toFixed(2)}`} icon={ICONS.aprazo} />
            </div>

            <div className="space-y-6">
                 {Object.keys(groupedByInvestor).map((investorName) => {
                    const payments = groupedByInvestor[investorName];
                    const totalInvested = payments.reduce((sum, p) => sum + p.investedAmount, 0);
                    const totalReceived = payments.reduce((sum, p) => {
                        const receivedSum = (Array.isArray(p.paymentsReceived) ? p.paymentsReceived : []).reduce((s, rp) => s + rp.amount, 0);
                        return sum + receivedSum;
                    }, 0);

                    return (
                        <div key={investorName} className="bg-card p-6 rounded-lg shadow-lg">
                            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                                <h2 className="text-2xl font-semibold text-text-primary">{investorName}</h2>
                                <div className="text-right">
                                    <p className="text-text-secondary text-sm">Pendente</p>
                                    <p className="font-bold text-xl text-accent">R$ {(totalInvested - totalReceived).toFixed(2)}</p>
                                </div>
                            </div>

                             <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-border-color">
                                    <thead className="bg-secondary">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Data</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Origem</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Investido</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Devolvido</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-card divide-y divide-border-color">
                                        {payments.map(p => {
                                            const received = (Array.isArray(p.paymentsReceived) ? p.paymentsReceived : []).reduce((s, rp) => s + rp.amount, 0);
                                            const pending = p.investedAmount - received;
                                            return (
                                                <tr key={p.paymentId}>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm">{new Date(p.date).toLocaleDateString('pt-BR')}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm">{p.name}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm">R$ {p.investedAmount.toFixed(2)}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                         <div className="flex items-center gap-2">
                                                            <span>R$ {received.toFixed(2)}</span>
                                                            <button
                                                                onClick={() => setPaymentHistoryModal({ isOpen: true, payments: p.paymentsReceived })}
                                                                className="text-xs text-accent hover:underline disabled:text-text-secondary disabled:no-underline disabled:cursor-not-allowed"
                                                                disabled={!Array.isArray(p.paymentsReceived) || p.paymentsReceived.length === 0}
                                                            >
                                                                ({(Array.isArray(p.paymentsReceived) ? p.paymentsReceived : []).length} Lanç.)
                                                            </button>
                                                         </div>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                        {pending > 0.001 && (
                                                            <button 
                                                                onClick={() => setPaymentModal({isOpen: true, payment: p})}
                                                                className="px-3 py-1 rounded bg-primary text-white text-xs hover:opacity-80 transition-opacity"
                                                            >
                                                                Receber
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )
                })}
            </div>

            <Modal isOpen={paymentModal.isOpen} onClose={() => setPaymentModal({isOpen: false, payment: null})} title="Registrar Recebimento">
                {paymentModal.payment && <RegisterPaymentModal investorPayment={paymentModal.payment} onSave={onAddPayment} onClose={() => setPaymentModal({isOpen: false, payment: null})} />}
            </Modal>

            <Modal isOpen={paymentHistoryModal.isOpen} onClose={() => setPaymentHistoryModal({isOpen: false, payments: []})} title="Histórico de Pagamentos">
                <PaymentHistoryModal payments={paymentHistoryModal.payments} onClose={() => setPaymentHistoryModal({isOpen: false, payments: []})} />
            </Modal>
        </div>
    );
};

export default Investidores;
