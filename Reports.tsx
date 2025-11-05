import React, { useMemo, useState, useEffect } from 'react';
import { Sale, Product, Seller, PaymentType, Purchase, Aplicacao, Exchange } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ReportsProps {
  sales: Sale[];
  products: Product[];
  sellers: Seller[];
  theme: string;
  purchases: Purchase[];
  aplicacoes: Aplicacao[];
  exchanges: Exchange[];
}

const getChartColors = () => {
    const style = getComputedStyle(document.body);
    return {
        grid: style.getPropertyValue('--color-border'),
        axis: style.getPropertyValue('--color-text-secondary'),
        tooltipBg: style.getPropertyValue('--color-background'),
        barFill: style.getPropertyValue('--color-primary'),
    };
};

const Reports: React.FC<ReportsProps> = ({ sales, products, sellers, theme, purchases, aplicacoes, exchanges }) => {
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [chartColors, setChartColors] = useState(getChartColors());

    useEffect(() => {
        setChartColors(getChartColors());
    }, [theme]);

    const dateFilter = (items: (Sale | Purchase | Aplicacao | Exchange)[]) => {
         if (!startDate && !endDate) {
            return items;
        }
        return items.filter(item => {
            const itemDate = new Date(item.date);

            let startMatch = true;
            if (startDate) {
                const filterStartDate = new Date(startDate);
                filterStartDate.setMinutes(filterStartDate.getMinutes() + filterStartDate.getTimezoneOffset());
                filterStartDate.setHours(0, 0, 0, 0);
                startMatch = itemDate >= filterStartDate;
            }

            let endMatch = true;
            if (endDate) {
                const filterEndDate = new Date(endDate);
                filterEndDate.setMinutes(filterEndDate.getMinutes() + filterEndDate.getTimezoneOffset());
                filterEndDate.setHours(23, 59, 59, 999);
                endMatch = itemDate <= filterEndDate;
            }
            
            return startMatch && endMatch;
        });
    }

    const filteredSales = useMemo(() => dateFilter(sales) as Sale[], [sales, startDate, endDate]);
    const filteredPurchases = useMemo(() => dateFilter(purchases) as Purchase[], [purchases, startDate, endDate]);
    const filteredAplicacoes = useMemo(() => dateFilter(aplicacoes) as Aplicacao[], [aplicacoes, startDate, endDate]);

    const { totalRevenue } = useMemo(() => {
        const revenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
        return { totalRevenue: revenue };
    }, [filteredSales]);


    const investorSummary = useMemo(() => {
        // Compras
        const investorPurchasePayments = filteredPurchases.flatMap(p => Array.isArray(p.payments) ? p.payments : []).filter(p => p.source !== 'Caixa da loja');
        const totalInvestidoEmCompras = investorPurchasePayments.reduce((sum, p) => sum + p.amount, 0);
        const totalDevolvidoDeCompras = investorPurchasePayments.flatMap(p => Array.isArray(p.paymentsReceived) ? p.paymentsReceived : []).reduce((sum, r) => sum + r.amount, 0);

        // Aplicações
        const investorAplicacaoPayments = filteredAplicacoes.flatMap(a => Array.isArray(a.payments) ? a.payments : []).filter(p => p.source !== 'Caixa da loja');
        const totalInvestidoEmAplicacoes = investorAplicacaoPayments.reduce((sum, p) => sum + p.amount, 0);
        const totalDevolvidoDeAplicacoes = investorAplicacaoPayments.flatMap(p => Array.isArray(p.paymentsReceived) ? p.paymentsReceived : []).reduce((sum, r) => sum + r.amount, 0);

        return {
            totalInvestidoEmCompras,
            totalDevolvidoDeCompras,
            totalInvestidoEmAplicacoes,
            totalDevolvidoDeAplicacoes
        };
    }, [filteredPurchases, filteredAplicacoes]);
    
    const totalItemsSold = useMemo(() => filteredSales.flatMap(s => s.items).reduce((sum, item) => sum + item.quantity, 0), [filteredSales]);

    const { registeredProductsCount, registeredProductsLabel } = useMemo(() => {
        if (!startDate && !endDate) {
            return {
                registeredProductsCount: products.length,
                registeredProductsLabel: 'Total de Produtos Registrados'
            };
        }

        const filtered = products.filter(product => {
            const productDate = new Date(product.createdAt);
            let startMatch = true;
            if (startDate) {
                const filterStartDate = new Date(startDate);
                filterStartDate.setMinutes(filterStartDate.getMinutes() + filterStartDate.getTimezoneOffset());
                filterStartDate.setHours(0, 0, 0, 0);
                startMatch = productDate >= filterStartDate;
            }

            let endMatch = true;
            if (endDate) {
                const filterEndDate = new Date(endDate);
                filterEndDate.setMinutes(filterEndDate.getMinutes() + filterEndDate.getTimezoneOffset());
                filterEndDate.setHours(23, 59, 59, 999);
                endMatch = productDate <= filterEndDate;
            }
            return startMatch && endMatch;
        });

        return {
            registeredProductsCount: filtered.length,
            registeredProductsLabel: 'Produtos Registrados no Período'
        };
    }, [products, startDate, endDate]);

    const salesBySeller = useMemo(() => {
        const data: { [key: string]: { name: string, total: number } } = {};
        sellers.forEach(seller => {
            data[seller.id] = { name: seller.name, total: 0 };
        });
        filteredSales.forEach(sale => {
            const sellerName = sale.sellerNameOverride || (sellers.find(s => s.id === sale.sellerId)?.name || 'Desconhecido');
            const sellerKey = sale.sellerNameOverride ? `other-${sellerName}` : sale.sellerId;

            if (!data[sellerKey]) {
                data[sellerKey] = { name: sellerName, total: 0 };
            }
            data[sellerKey].total += sale.total;
        });
        return Object.values(data);
    }, [filteredSales, sellers]);

    const topSellingProducts = useMemo(() => {
        const data: { [key: string]: { name: string, quantity: number, revenue: number } } = {};
        filteredSales.flatMap(s => s.items).forEach(item => {
            const product = products.find(p => p.id === item.productId);
            if (product) {
                if (!data[product.id]) {
                    data[product.id] = { name: product.name, quantity: 0, revenue: 0 };
                }
                data[product.id].quantity += item.quantity;
                data[product.id].revenue += item.quantity * item.unitPrice;
            }
        });
        return Object.values(data).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
    }, [filteredSales, products]);
    
    const salesByPaymentType = useMemo(() => {
        const data: { [key in PaymentType]?: number } = {};
        filteredSales.forEach(sale => {
            sale.payments.forEach(payment => {
                if (data[payment.type]) {
                    data[payment.type]! += payment.amount;
                } else {
                    data[payment.type] = payment.amount;
                }
            });
        });
        return Object.entries(data).map(([name, value]) => ({ name, value: value || 0 }));
    }, [filteredSales]);

    const PIE_COLORS = ['#4d7c0f', '#65a30d', '#84cc16', '#a3e635', '#bef264'];
    const EMERALD_COLORS = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'];

    return (
        <div className="space-y-8">
            <h1 className="text-4xl font-bold text-text-primary">Relatórios</h1>

            <div className="bg-card p-4 rounded-lg">
                <div className="flex flex-wrap items-end gap-4">
                    <div className="flex-grow min-w-[280px]">
                        <label className="block text-sm font-medium text-text-secondary mb-1">Filtrar por Período</label>
                        <div className="flex items-center gap-2">
                            <input 
                                type="date" 
                                value={startDate} 
                                onChange={e => setStartDate(e.target.value)} 
                                className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color" 
                                aria-label="Data de início"
                            />
                            <span className="text-text-secondary">até</span>
                            <input 
                                type="date" 
                                value={endDate} 
                                onChange={e => setEndDate(e.target.value)} 
                                className="w-full bg-input-bg text-text-primary p-2 rounded border border-border-color" 
                                aria-label="Data de fim"
                            />
                        </div>
                    </div>
                    { (startDate || endDate) && 
                        <div className="flex-shrink-0">
                             <button 
                                onClick={() => { setStartDate(''); setEndDate(''); }}
                                className="w-full sm:w-auto px-4 py-2 rounded bg-secondary text-text-primary hover:opacity-90 transition-opacity"
                            >
                                Limpar Filtro
                            </button>
                        </div>
                    }
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-card p-6 rounded-lg text-center shadow-md">
                    <h3 className="text-text-secondary">Receita Total</h3>
                    <p className="text-3xl font-bold text-primary">R$ {totalRevenue.toFixed(2)}</p>
                </div>
                <div className="bg-card p-6 rounded-lg text-center shadow-md">
                    <h3 className="text-text-secondary">Vendas Realizadas (período)</h3>
                    <p className="text-3xl font-bold text-primary">{filteredSales.length}</p>
                </div>
                 <div className="bg-card p-6 rounded-lg text-center shadow-md">
                    <h3 className="text-text-secondary">{registeredProductsLabel}</h3>
                    <p className="text-3xl font-bold text-primary">{registeredProductsCount}</p>
                </div>
                <div className="bg-card p-6 rounded-lg text-center shadow-md">
                    <h3 className="text-text-secondary">Peças Vendidas (período)</h3>
                    <p className="text-3xl font-bold text-primary">{totalItemsSold}</p>
                </div>
            </div>

            <div className="bg-card p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-text-primary">Resumo de Investidores (no período)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-secondary p-4 rounded-lg text-center">
                        <h3 className="text-text-secondary">Investido em Compras</h3>
                        <p className="text-2xl font-bold text-primary">R$ {investorSummary.totalInvestidoEmCompras.toFixed(2)}</p>
                    </div>
                    <div className="bg-secondary p-4 rounded-lg text-center">
                        <h3 className="text-text-secondary">Devolvido de Compras</h3>
                        <p className="text-2xl font-bold text-green-400">R$ {investorSummary.totalDevolvidoDeCompras.toFixed(2)}</p>
                    </div>
                    <div className="bg-secondary p-4 rounded-lg text-center">
                        <h3 className="text-text-secondary">Investido em Aplicações</h3>
                        <p className="text-2xl font-bold text-primary">R$ {investorSummary.totalInvestidoEmAplicacoes.toFixed(2)}</p>
                    </div>
                    <div className="bg-secondary p-4 rounded-lg text-center">
                        <h3 className="text-text-secondary">Devolvido de Aplicações</h3>
                        <p className="text-2xl font-bold text-green-400">R$ {investorSummary.totalDevolvidoDeAplicacoes.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-semibold mb-4 text-text-primary">Vendas por Vendedor</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={salesBySeller} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                            <XAxis type="number" stroke={chartColors.axis} />
                            <YAxis type="category" dataKey="name" stroke={chartColors.axis} width={80} />
                            <Tooltip contentStyle={{ backgroundColor: chartColors.tooltipBg }}/>
                            <Legend />
                            <Bar dataKey="total" name="Total de Vendas" fill={chartColors.barFill} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-card p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-semibold mb-4 text-text-primary">Produtos Mais Vendidos (por quantidade)</h2>
                    <ResponsiveContainer width="100%" height={300}>
                         <PieChart>
                            <Pie data={topSellingProducts} dataKey="quantity" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                                {topSellingProducts.map((entry, index) => <Cell key={`cell-${index}`} fill={(theme === 'theme-light-moss' ? PIE_COLORS : EMERALD_COLORS)[index % PIE_COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: chartColors.tooltipBg }}/>
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-card p-6 rounded-lg shadow-lg lg:col-span-2">
                    <h2 className="text-xl font-semibold mb-4 text-text-primary">Vendas por Forma de Pagamento</h2>
                    <ResponsiveContainer width="100%" height={300}>
                         <PieChart>
                            <Pie data={salesByPaymentType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                                {salesByPaymentType.map((entry, index) => <Cell key={`cell-${index}`} fill={(theme === 'theme-light-moss' ? PIE_COLORS : EMERALD_COLORS)[index % PIE_COLORS.length]} />)}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ backgroundColor: chartColors.tooltipBg }}
                                formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                            />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default Reports;