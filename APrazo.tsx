
import React, { useMemo, useState } from 'react';
import { Sale, Customer, Installment, PaymentType } from '../types';
import StatCard from './ui/StatCard';
import { ICONS } from '../constants';

interface APrazoProps {
    sales: Sale[];
    customers: Customer[];
    onPaymentUpdate: (saleId: string, paymentId: string, dateIndex: number, newStatus: Installment['status']) => void;
}

interface InstallmentInfo {
    customerName: string;
    saleId: string;
    paymentId: string;
    installment: Installment;
    installmentIndex: number;
    amountPerInstallment: number;
}

interface GroupedPayments {
    [customerId: string]: {
        customerName: string;
        totalDue: number;
        installments: InstallmentInfo[];
    }
}

interface OverdueInfo {
    customerName: string;
    date: string;
    days: number;
    amount: number;
}

const APrazo: React.FC<APrazoProps> = ({ sales, customers, onPaymentUpdate }) => {
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null); // YYYY-MM format
    
    const groupedPayments = useMemo<GroupedPayments>(() => {
        const groups: GroupedPayments = {};
        
        sales.forEach(sale => {
            sale.payments.forEach(payment => {
                if (payment.type === PaymentType.APrazo && payment.paymentDates) {
                    const customer = customers.find(c => c.id === sale.customerId);
                    if (!customer) return;

                    const amountPerInstallment = payment.amount / (payment.paymentDates.length || 1);

                    payment.paymentDates.forEach((installment, index) => {
                         const installmentMonth = installment.date.slice(0, 7);
                         if (selectedMonth && installmentMonth !== selectedMonth) return;
                        
                         if (!groups[customer.id]) {
                            groups[customer.id] = {
                                customerName: customer.name,
                                totalDue: 0,
                                installments: []
                            };
                        }

                        const installmentInfo: InstallmentInfo = {
                            customerName: customer.name,
                            saleId: sale.id,
                            paymentId: payment.id,
                            installment,
                            installmentIndex: index,
                            amountPerInstallment,
                        };

                        groups[customer.id].installments.push(installmentInfo);
                        if (installment.status === 'Pendente') {
                            groups[customer.id].totalDue += amountPerInstallment;
                        }
                    });
                }
            });
        });

        Object.values(groups).forEach(group => {
            group.installments.sort((a, b) => new Date(a.installment.date).getTime() - new Date(b.installment.date).getTime());
        });

        return groups;
    }, [sales, customers, selectedMonth]);

    const overduePayments = useMemo<{
        '3-5': OverdueInfo[];
        '6-10': OverdueInfo[];
        '11-15': OverdueInfo[];
        '>15': OverdueInfo[];
    }>(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const overdue: {
            '3-5': OverdueInfo[];
            '6-10': OverdueInfo[];
            '11-15': OverdueInfo[];
            '>15': OverdueInfo[];
        } = {
            '3-5': [],
            '6-10': [],
            '11-15': [],
            '>15': [],
        };
        
        sales.forEach(sale => {
            sale.payments.forEach(payment => {
                if (payment.type === PaymentType.APrazo && payment.paymentDates) {
                    const customer = customers.find(c => c.id === sale.customerId);
                    if (!customer) return;

                    const amountPerInstallment = payment.amount / (payment.paymentDates.length || 1);

                    payment.paymentDates.forEach(installment => {
                        if (installment.status === 'Pendente') {
                            const dueDate = new Date(installment.date);
                            dueDate.setMinutes(dueDate.getMinutes() + dueDate.getTimezoneOffset());

                            if (dueDate < today) {
                                const diffTime = today.getTime() - dueDate.getTime();
                                const daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                                
                                if (daysOverdue >= 3) {
                                    const overdueInfo = {
                                        customerName: customer.name,
                                        date: installment.date,
                                        days: daysOverdue,
                                        amount: amountPerInstallment
                                    };

                                    if (daysOverdue > 15) overdue['>15'].push(overdueInfo);
                                    else if (daysOverdue >= 11) overdue['11-15'].push(overdueInfo);
                                    else if (daysOverdue >= 6) overdue['6-10'].push(overdueInfo);
                                    else if (daysOverdue >= 3) overdue['3-5'].push(overdueInfo);
                                }
                            }
                        }
                    });
                }
            });
        });
        
        for (const key in overdue) {
            overdue[key as keyof typeof overdue].sort((a, b) => b.days - a.days);
        }

        return overdue;

    }, [sales, customers]);

    const totalReceivable = useMemo(() => {
        return Object.keys(groupedPayments).reduce((sum, customerId) => sum + groupedPayments[customerId].totalDue, 0);
    }, [groupedPayments]);

    const OverdueSection: React.FC<{title: string, items: OverdueInfo[]}> = ({title, items}) => {
        if (items.length === 0) return null;
        return (
            <div>
                <h3 className="text-lg font-semibold text-text-secondary mb-2">{title}</h3>
                <ul className="space-y-2">
                    {items.map((item, index) => (
                        <li key={index} className="bg-background p-3 rounded-md text-sm flex justify-between items-center">
                            <div>
                                <span className="font-bold">{item.customerName}</span>
                                <span className="text-text-secondary"> - Vencido há {item.days} dias</span>
                            </div>
                            <span className="font-semibold text-accent">R$ {item.amount.toFixed(2)}</span>
                        </li>
                    ))}
                </ul>
            </div>
        )
    };

    return (
        <div className="space-y-8">
            <h1 className="text-4xl font-bold text-text-primary">Controle a Prazo</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <StatCard 
                        title={selectedMonth ? "Total a Receber (Mês Selecionado)" : "Total a Receber (Geral)"}
                        value={`R$ ${totalReceivable.toFixed(2)}`} 
                        icon={ICONS.sales} 
                    />
                     <div className="bg-card p-4 rounded-lg shadow-lg">
                        <h2 className="text-xl font-semibold text-text-primary mb-4">Pagamentos em Atraso</h2>
                        <div className="space-y-4">
                            <OverdueSection title="Atraso de 3 a 5 dias" items={overduePayments['3-5']} />
                            <OverdueSection title="Atraso de 6 a 10 dias" items={overduePayments['6-10']} />
                            <OverdueSection title="Atraso de 11 a 15 dias" items={overduePayments['11-15']} />
                            <OverdueSection title="Atraso de mais de 15 dias" items={overduePayments['>15']} />
                            {Object.values(overduePayments).every(arr => (arr as OverdueInfo[]).length === 0) && (
                                <p className="text-text-secondary text-center py-4">Nenhum pagamento em atraso crítico.</p>
                            )}
                        </div>
                     </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-card p-4 rounded-lg flex items-center gap-4 flex-wrap">
                        <label htmlFor="month-filter" className="font-semibold text-text-primary whitespace-nowrap">Filtrar por Mês:</label>
                        <input 
                            type="month" 
                            id="month-filter"
                            value={selectedMonth || ''} 
                            onChange={e => setSelectedMonth(e.target.value)} 
                            className="flex-grow bg-input-bg text-text-primary p-2 rounded border border-border-color" 
                        />
                         <button
                            onClick={() => setSelectedMonth(null)}
                            className="px-4 py-2 rounded bg-secondary text-text-primary hover:opacity-90 transition-opacity"
                        >
                            Mostrar Todos
                        </button>
                    </div>
                    
                    {Object.keys(groupedPayments).length > 0 ? (
                        Object.keys(groupedPayments).map((customerId) => {
                            const data = groupedPayments[customerId];
                            return (
                            <div key={customerId} className="bg-card p-6 rounded-lg shadow-lg">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-2xl font-semibold text-text-primary">{data.customerName}</h2>
                                    <div className="text-right">
                                        <p className="text-text-secondary text-sm">Pendente</p>
                                        <p className="font-bold text-xl text-accent">R$ {data.totalDue.toFixed(2)}</p>
                                    </div>
                                </div>
                                
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-border-color">
                                        <thead className="bg-secondary">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Vencimento</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Valor</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Status</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Ação</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-card divide-y divide-border-color">
                                            {data.installments.map((info, i) => (
                                                <tr key={`${info.saleId}-${info.paymentId}-${i}`}>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm">{new Date(info.installment.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm">R$ {info.amountPerInstallment.toFixed(2)}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${info.installment.status === 'Pendente' ? 'bg-yellow-500 text-yellow-900' : 'bg-green-500 text-green-900'}`}>
                                                            {info.installment.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                        {info.installment.status === 'Pendente' ? (
                                                            <button 
                                                                onClick={() => onPaymentUpdate(info.saleId, info.paymentId, info.installmentIndex, 'Pago')}
                                                                className="px-3 py-1 rounded bg-primary text-white text-xs hover:opacity-80 transition-opacity"
                                                            >
                                                                Marcar como Pago
                                                            </button>
                                                        ) : (
                                                            <button 
                                                                onClick={() => onPaymentUpdate(info.saleId, info.paymentId, info.installmentIndex, 'Pendente')}
                                                                className="px-3 py-1 rounded bg-yellow-600 text-white text-xs hover:opacity-80 transition-opacity"
                                                            >
                                                                Marcar como Pendente
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );
                    })
                    ) : (
                        <div className="bg-card p-6 rounded-lg shadow-lg text-center">
                            <p className="text-text-secondary">Nenhum pagamento a prazo encontrado para o período selecionado.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default APrazo;
