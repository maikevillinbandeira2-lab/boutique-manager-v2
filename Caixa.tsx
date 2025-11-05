import React, { useState, useMemo, useEffect } from 'react';
import { Sale, Purchase, Aplicacao, PaymentType, SalaryPayment, Exchange } from '../types';
import StatCard from './ui/StatCard';
import { ICONS } from '../constants';
import Modal from './ui/Modal';

// Helper for localStorage
const useStickyState = <T,>(defaultValue: T, key: string): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [value, setValue] = useState<T>(() => {
    try {
      const stickyValue = window.localStorage.getItem(key);
      return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  React.useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
};

interface CaixaProps {
    sales: Sale[];
    purchases: Purchase[];
    aplicacoes: Aplicacao[];
    exchanges: Exchange[];
    salaryPayments: SalaryPayment[];
    onSaveSalaryPayment: (payment: SalaryPayment) => void;
    onDeleteSalaryPayment: (paymentId: string) => void;
}

interface SalaryFormData {
    recipient: 'Maikellen' | 'Dhaluma' | 'Outros';
    recipientName: string;
    amount: string;
    paymentDate: string; // YYYY-MM-DD
}

const initialSalaryFormState: SalaryFormData = {
    recipient: 'Maikellen',
    recipientName: '',
    amount: '',
    paymentDate: new Date().toISOString().slice(0, 10),
};


const Caixa: React.FC<CaixaProps> = ({ sales, purchases, aplicacoes, exchanges, salaryPayments, onSaveSalaryPayment, onDeleteSalaryPayment }) => {
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [saldosAnteriores, setSaldosAnteriores] = useStickyState<Record<string, string>>({}, 'boutique-manager-saldos-anteriores');
    
    const saldoAnteriorSalvo = useMemo(() => saldosAnteriores[selectedMonth] || '0', [saldosAnteriores, selectedMonth]);
    const [isEditingSaldo, setIsEditingSaldo] = useState(!saldosAnteriores[selectedMonth]);
    const [editingSaldoValue, setEditingSaldoValue] = useState(saldoAnteriorSalvo);

    const [salaryFormData, setSalaryFormData] = useState<SalaryFormData>(initialSalaryFormState);
    const [editingSalaryId, setEditingSalaryId] = useState<string | null>(null);
    const [salaryToDelete, setSalaryToDelete] = useState<SalaryPayment | null>(null);

    const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setSalaryFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleEditSalary = (salary: SalaryPayment) => {
        setEditingSalaryId(salary.id);
        setSalaryFormData({
            recipient: salary.recipient,
            recipientName: salary.recipientName || '',
            amount: String(salary.amount),
            paymentDate: salary.paymentDate,
        });
    };

    const handleCancelEdit = () => {
        setEditingSalaryId(null);
        setSalaryFormData(initialSalaryFormState);
    };

    const handleSaveSalary = (e: React.FormEvent) => {
        e.preventDefault();
        if (!salaryFormData.amount || Number(salaryFormData.amount) <= 0) {
            alert('Por favor, insira um valor válido para o salário.');
            return;
        }
        if (salaryFormData.recipient === 'Outros' && !salaryFormData.recipientName.trim()) {
            alert('Por favor, especifique o nome para "Outros".');
            return;
        }
        if (salaryFormData.paymentDate.slice(0,7) !== selectedMonth) {
            alert(`A data do pagamento deve ser no mês de ${new Date(`${selectedMonth}-02`).toLocaleString('pt-BR', { month: 'long'})}.`);
            return;
        }

        const paymentToSave: SalaryPayment = {
            id: editingSalaryId || `sal-${Date.now()}`,
            month: salaryFormData.paymentDate.slice(0, 7),
            recipient: salaryFormData.recipient,
            recipientName: salaryFormData.recipient === 'Outros' ? salaryFormData.recipientName.trim() : undefined,
            amount: Number(salaryFormData.amount),
            paymentDate: salaryFormData.paymentDate,
        };
        
        onSaveSalaryPayment(paymentToSave);
        handleCancelEdit();
    };
    
    const handleDeleteSalary = () => {
        if(salaryToDelete) {
            onDeleteSalaryPayment(salaryToDelete.id);
            setSalaryToDelete(null);
        }
    }

    useEffect(() => {
        const saldoSalvo = saldosAnteriores[selectedMonth] || '0';
        setEditingSaldoValue(saldoSalvo);
        setIsEditingSaldo(!saldosAnteriores[selectedMonth]);
    }, [selectedMonth, saldosAnteriores]);

    const handleSaveSaldo = () => {
        setSaldosAnteriores(prev => ({
            ...prev,
            [selectedMonth]: editingSaldoValue
        }));
        setIsEditingSaldo(false);
    };

    const handleMonthChange = (offset: number) => {
        const currentDate = new Date(`${selectedMonth}-02`);
        currentDate.setMonth(currentDate.getMonth() + offset);
        setSelectedMonth(currentDate.toISOString().slice(0, 7));
    };
    
    const { entradas, saidas, saldoFinal, salariosDoMes } = useMemo(() => {
        const saldoAnteriorNum = Number(saldoAnteriorSalvo) || 0;

        const getMonthFromDate = (d: Date) => {
            const date = new Date(d);
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            return `${year}-${month}`;
        };
        const getMonthFromString = (dateStr: string) => dateStr.slice(0, 7);

        // --- ENTRADAS DE CAIXA ---
        let vendasAVistaDoMes = 0;
        let aPrazoRecebidoNoMes = 0;

        sales.forEach(sale => {
            const saleMonth = getMonthFromDate(sale.date);
            // Pagamentos à vista (ou equivalentes) feitos no mês da venda
            sale.payments.forEach(payment => {
                if (payment.type !== PaymentType.APrazo && saleMonth === selectedMonth) {
                    vendasAVistaDoMes += payment.amount;
                }
            });

            // Pagamentos 'A Prazo' recebidos no mês selecionado, independente da data da venda
            sale.payments.forEach(payment => {
                if (payment.type === PaymentType.APrazo && Array.isArray(payment.paymentDates)) {
                    const amountPerInstallment = payment.amount / (payment.paymentDates.length || 1);
                    payment.paymentDates.forEach(installment => {
                        if (installment.status === 'Pago' && installment.paymentDate) {
                            const paymentMonth = getMonthFromString(installment.paymentDate);
                            if (paymentMonth === selectedMonth) {
                                aPrazoRecebidoNoMes += amountPerInstallment;
                            }
                        }
                    });
                }
            });
        });

        const totalEntradas = vendasAVistaDoMes + aPrazoRecebidoNoMes + saldoAnteriorNum;

        // --- SAÍDAS DE CAIXA ---
        const comprasDoMes = purchases.filter(p => getMonthFromDate(p.date) === selectedMonth);
        const saidasCompras = comprasDoMes.flatMap(p => p.payments).filter(p => p.source === 'Caixa da loja').reduce((sum, p) => sum + p.amount, 0);
        
        const aplicacoesDoMes = aplicacoes.filter(a => getMonthFromDate(a.date) === selectedMonth);
        const saidasAplicacoes = aplicacoesDoMes.flatMap(a => a.payments).filter(p => p.source === 'Caixa da loja').reduce((sum, p) => sum + p.amount, 0);

        const trocasDoMes = exchanges.filter(ex => getMonthFromDate(ex.date) === selectedMonth);
        const saidasTrocas = trocasDoMes
            .filter(ex => ex.paymentMethod === 'Dinheiro')
            .reduce((sum, ex) => sum + ex.totalValue, 0);

        const devolucoesInvestidoresEmDinheiro = [...purchases, ...aplicacoes]
            .flatMap(item => Array.isArray(item.payments) ? item.payments : [])
            .filter(p => p.source !== 'Caixa da loja')
            .flatMap(p => Array.isArray(p.paymentsReceived) ? p.paymentsReceived : [])
            .filter(pr => getMonthFromString(pr.date) === selectedMonth)
            .reduce((sum, pr) => sum + pr.amount, 0);
        
        const salariosDoMesFiltrados = salaryPayments.filter(p => p.month === selectedMonth);
        const saidasSalarios = salariosDoMesFiltrados.reduce((sum, p) => sum + p.amount, 0);

        // --- CÁLCULOS FINAIS ---
        const totalSaidasDinheiro = saidasCompras + saidasAplicacoes + saidasTrocas + devolucoesInvestidoresEmDinheiro + saidasSalarios;
        const saldoFinal = totalEntradas - totalSaidasDinheiro;

        return {
            entradas: {
                vendasAVista: vendasAVistaDoMes,
                aPrazoRecebido: aPrazoRecebidoNoMes,
                saldoAnterior: saldoAnteriorNum,
                total: totalEntradas
            },
            saidas: {
                compras: saidasCompras,
                aplicacoes: saidasAplicacoes,
                trocas: saidasTrocas,
                investidores: devolucoesInvestidoresEmDinheiro,
                salarios: saidasSalarios,
                total: totalSaidasDinheiro,
            },
            saldoFinal: saldoFinal,
            salariosDoMes: salariosDoMesFiltrados,
        };
    }, [selectedMonth, sales, purchases, aplicacoes, exchanges, saldoAnteriorSalvo, salaryPayments]);

    const handleCloseMonth = () => {
        const currentDate = new Date(`${selectedMonth}-02`);
        currentDate.setMonth(currentDate.getMonth() + 1);
        const nextMonth = currentDate.toISOString().slice(0, 7);

        setSaldosAnteriores(prev => ({
            ...prev,
            [nextMonth]: saldoFinal.toFixed(2),
        }));

        alert(`Saldo de R$ ${saldoFinal.toFixed(2)} transferido como saldo inicial para ${currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}.`);
    };


    return (
        <div className="space-y-6">
            <h1 className="text-4xl font-bold text-text-primary">Caixa</h1>
            
            <div className="bg-card p-4 rounded-lg flex flex-wrap items-center justify-between gap-4">
                 <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <button onClick={() => handleMonthChange(-1)} className="p-2 rounded bg-secondary">&lt;</button>
                        <span className="font-bold text-lg w-48 text-center">{new Date(`${selectedMonth}-02`).toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</span>
                        <button onClick={() => handleMonthChange(1)} className="p-2 rounded bg-secondary">&gt;</button>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">Saldo Mês Anterior (R$):</label>
                        {isEditingSaldo ? (
                            <>
                                <input
                                    id="saldo-anterior"
                                    type="number"
                                    value={editingSaldoValue}
                                    onChange={e => setEditingSaldoValue(e.target.value)}
                                    placeholder="Insira o valor"
                                    className="w-32 bg-input-bg text-text-primary p-2 rounded border border-border-color"
                                    aria-label="Valor do saldo do mês anterior"
                                />
                                <button onClick={handleSaveSaldo} className="px-3 py-2 text-sm rounded bg-primary text-white hover:opacity-90">
                                    Salvar Saldo
                                </button>
                            </>
                        ) : (
                            <>
                                <span className="p-2 font-semibold text-lg text-text-primary">{Number(saldoAnteriorSalvo).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                <button onClick={() => setIsEditingSaldo(true)} className="px-3 py-2 text-sm rounded bg-secondary text-text-primary hover:opacity-90">
                                    Editar
                                </button>
                            </>
                        )}
                    </div>
                </div>
                <div>
                     <button
                        onClick={handleCloseMonth}
                        className="px-4 py-2 rounded-md bg-accent text-white font-semibold hover:opacity-90 transition-opacity"
                        title="Usa o 'Saldo do Mês' atual como o 'Saldo Anterior' para o próximo mês."
                    >
                        Fechar Mês e Levar Saldo
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Total Entradas" value={`R$ ${entradas.total.toFixed(2)}`} icon={ICONS.sales}/>
                <StatCard title="Total Saídas" value={`R$ ${saidas.total.toFixed(2)}`} icon={ICONS.compras}/>
                <StatCard title="Saldo do Mês" value={`R$ ${saldoFinal.toFixed(2)}`} icon={ICONS.caixa}/>
            </div>

            <div className="bg-card p-6 rounded-lg space-y-4">
                <h2 className="text-2xl font-bold border-b border-border-color pb-2">Salários e Pró-labore do Mês</h2>
                <form onSubmit={handleSaveSalary} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Nome</label>
                            <select name="recipient" value={salaryFormData.recipient} onChange={handleSalaryChange} className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color">
                                <option value="Maikellen">Maikellen</option>
                                <option value="Dhaluma">Dhaluma</option>
                                <option value="Outros">Outros</option>
                            </select>
                        </div>
                        {salaryFormData.recipient === 'Outros' && (
                             <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Especifique</label>
                                <input type="text" name="recipientName" value={salaryFormData.recipientName} onChange={handleSalaryChange} required className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color" />
                            </div>
                        )}
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Valor (R$)</label>
                        <input type="number" name="amount" value={salaryFormData.amount} onChange={handleSalaryChange} placeholder="0.00" required className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Data</label>
                        <input type="date" name="paymentDate" value={salaryFormData.paymentDate} onChange={handleSalaryChange} required className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color" />
                    </div>
                    <div className="flex gap-2">
                         {editingSalaryId && (
                            <button type="button" onClick={handleCancelEdit} className="w-full px-4 py-2 rounded bg-secondary text-text-primary hover:opacity-90 transition-opacity">Cancelar</button>
                        )}
                         <button type="submit" className="w-full px-4 py-2 rounded bg-accent text-white hover:opacity-90 transition-opacity">
                            {editingSalaryId ? 'Salvar' : 'Adicionar'}
                         </button>
                    </div>
                </form>
                {salariosDoMes.length > 0 && (
                     <div className="border-t border-border-color pt-4">
                        <ul className="space-y-2">
                            {salariosDoMes.map(sal => (
                                <li key={sal.id} className="flex justify-between items-center bg-background p-2 rounded-md">
                                    <div className="flex-1">
                                        <span className="font-semibold">{sal.recipient === 'Outros' ? sal.recipientName : sal.recipient}</span>
                                        <span className="text-sm text-text-secondary ml-2">{new Date(sal.paymentDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-medium">R$ {sal.amount.toFixed(2)}</span>
                                        <div className="flex items-center gap-2">
                                             <button onClick={() => handleEditSalary(sal)} className="text-accent hover:opacity-80 transition-opacity p-1" aria-label="Editar">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>
                                            </button>
                                            <button onClick={() => setSalaryToDelete(sal)} className="text-red-500 hover:text-red-400 transition-opacity p-1" aria-label="Excluir">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            <div className="bg-card p-6 rounded-lg space-y-4 max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold border-b border-border-color pb-2">Fluxo de Caixa do Mês</h2>
                <div>
                    <h3 className="text-lg font-semibold text-green-400 mb-2">ENTRADAS</h3>
                    <ul className="space-y-1 text-text-secondary">
                        <li className="flex justify-between"><span>Vendas (Débito, Crédito, Pix, etc)</span> <span>R$ {entradas.vendasAVista.toFixed(2)}</span></li>
                        <li className="flex justify-between"><span>Recebimentos (A Prazo)</span> <span>R$ {entradas.aPrazoRecebido.toFixed(2)}</span></li>
                        <li className="flex justify-between"><span>Saldo Mês Anterior</span> <span>R$ {entradas.saldoAnterior.toFixed(2)}</span></li>
                        <li className="flex justify-between font-bold text-text-primary border-t border-border-color pt-1 mt-1"><span>TOTAL ENTRADAS</span> <span>R$ {entradas.total.toFixed(2)}</span></li>
                    </ul>
                </div>
                 <div>
                    <h3 className="text-lg font-semibold text-red-400 mb-2">SAÍDAS</h3>
                    <ul className="space-y-1 text-text-secondary">
                        <li className="flex justify-between"><span>Compras (pago c/ caixa)</span> <span>R$ {saidas.compras.toFixed(2)}</span></li>
                        <li className="flex justify-between"><span>Aplicações (pago c/ caixa)</span> <span>R$ {saidas.aplicacoes.toFixed(2)}</span></li>
                        <li className="flex justify-between"><span>Trocas (pago em dinheiro)</span> <span>R$ {saidas.trocas.toFixed(2)}</span></li>
                        <li className="flex justify-between"><span>Devolução a Investidores</span> <span>R$ {saidas.investidores.toFixed(2)}</span></li>
                        <li className="flex justify-between"><span>Salários</span> <span>R$ {saidas.salarios.toFixed(2)}</span></li>
                        <li className="flex justify-between font-bold text-text-primary border-t border-border-color pt-1 mt-1"><span>TOTAL SAÍDAS</span> <span>R$ {saidas.total.toFixed(2)}</span></li>
                    </ul>
                </div>
            </div>

            <Modal isOpen={!!salaryToDelete} onClose={() => setSalaryToDelete(null)} title="Confirmar Exclusão">
                {salaryToDelete && (
                    <div>
                        <p className="text-text-secondary mb-6">
                            Tem certeza que deseja excluir o pagamento de <strong>{salaryToDelete.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong> para <strong>{salaryToDelete.recipient === 'Outros' ? salaryToDelete.recipientName : salaryToDelete.recipient}</strong>?
                        </p>
                        <div className="flex justify-end space-x-2">
                            <button onClick={() => setSalaryToDelete(null)} className="px-4 py-2 rounded bg-secondary text-text-primary hover:opacity-90">Cancelar</button>
                            <button onClick={handleDeleteSalary} className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700">Excluir</button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Caixa;