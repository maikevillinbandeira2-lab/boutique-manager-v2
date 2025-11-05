import React, { useEffect, useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Product, Sale, Customer, CustomerSource, PaymentType } from '../types';
import StatCard from './ui/StatCard';
import { ICONS } from '../constants';

interface DashboardProps {
    products: Product[];
    sales: Sale[];
    customers: Customer[];
    theme: string;
}

const getChartColors = () => {
    const style = getComputedStyle(document.body);
    return {
        grid: style.getPropertyValue('--color-border'),
        axis: style.getPropertyValue('--color-text-secondary'),
        tooltipBg: style.getPropertyValue('--color-background'),
        tooltipBorder: style.getPropertyValue('--color-border'),
        barFill: style.getPropertyValue('--color-primary'),
    };
};

const Dashboard: React.FC<DashboardProps> = ({ products, sales, customers, theme }) => {
    const [chartColors, setChartColors] = useState(getChartColors());
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        setChartColors(getChartColors());
    }, [theme]);

    const filteredSales = useMemo(() => {
        if (!startDate && !endDate) {
            return sales;
        }
        return sales.filter(sale => {
            const saleDate = new Date(sale.date);

            let startMatch = true;
            if (startDate) {
                const filterStartDate = new Date(startDate);
                filterStartDate.setMinutes(filterStartDate.getMinutes() + filterStartDate.getTimezoneOffset());
                filterStartDate.setHours(0, 0, 0, 0);
                startMatch = saleDate >= filterStartDate;
            }

            let endMatch = true;
            if (endDate) {
                const filterEndDate = new Date(endDate);
                filterEndDate.setMinutes(filterEndDate.getMinutes() + filterEndDate.getTimezoneOffset());
                filterEndDate.setHours(23, 59, 59, 999);
                endMatch = saleDate <= filterEndDate;
            }
            
            return startMatch && endMatch;
        });
    }, [sales, startDate, endDate]);
    
    const totalRevenue = useMemo(() => filteredSales.reduce((sum, sale) => sum + sale.total, 0), [filteredSales]);

    const grossProfit = useMemo(() => {
        const totalCOGS = filteredSales.reduce((cogsSum, sale) => {
            const saleCOGS = sale.items.reduce((itemCogsSum, item) => {
                const product = products.find(p => p.id === item.productId);
                const purchasePrice = product ? product.purchasePrice : 0;
                return itemCogsSum + (purchasePrice * item.quantity);
            }, 0);
            return cogsSum + saleCOGS;
        }, 0);
        return totalRevenue - totalCOGS;
    }, [filteredSales, products, totalRevenue]);

    const totalReceivable = useMemo(() => {
        let total = 0;
        filteredSales.forEach(sale => {
            sale.payments.forEach(payment => {
                if (payment.type === PaymentType.APrazo && payment.paymentDates) {
                    const pendingInstallments = payment.paymentDates.filter(d => d.status === 'Pendente');
                    if (payment.paymentDates.length > 0) {
                        const amountPerInstallment = payment.amount / payment.paymentDates.length;
                        total += pendingInstallments.length * amountPerInstallment;
                    }
                }
            });
        });
        return total;
    }, [filteredSales]);

    const averageTicket = useMemo(() => filteredSales.length > 0 ? (totalRevenue / filteredSales.length) : 0, [filteredSales, totalRevenue]);

    const activeCustomersCount = useMemo(() => new Set(filteredSales.map(s => s.customerId)).size, [filteredSales]);
    
    const totalStock = useMemo(() => products.reduce((sum, product) => sum + product.quantity, 0), [products]);

    const salesChartData = useMemo(() => {
        // If a filter is applied, group by day for the selected range.
        if (startDate || endDate) {
            const salesToDisplay = filteredSales;
            const groupedByDay = salesToDisplay.reduce((acc, sale) => {
                const day = new Date(sale.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                if (!acc[day]) {
                    acc[day] = 0;
                }
                acc[day] += sale.total;
                return acc;
            }, {} as Record<string, number>);
    
            // Create a map to get a full Date object for each day, to enable correct sorting.
            const dateMap = new Map<string, Date>();
            salesToDisplay.forEach(sale => {
                const dayKey = new Date(sale.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                if (!dateMap.has(dayKey)) {
                    dateMap.set(dayKey, new Date(sale.date));
                }
            });
    
            return Object.entries(groupedByDay)
                .map(([name, Vendas]) => ({ name, Vendas, date: dateMap.get(name) || new Date() }))
                .sort((a, b) => a.date.getTime() - b.date.getTime())
                .map(({ name, Vendas }) => ({ name, Vendas })); // Remove date property after sorting
        }
    
        // Default view: Show sales for the current year, grouped by month.
        const currentYear = new Date().getFullYear();
        const salesForCurrentYear = sales.filter(sale => new Date(sale.date).getFullYear() === currentYear);
    
        const monthlyData = Array.from({ length: 12 }, (_, i) => ({
            name: new Date(currentYear, i).toLocaleString('pt-BR', { month: 'short' }).replace('.', ''),
            Vendas: 0
        }));
    
        salesForCurrentYear.forEach(sale => {
            const monthIndex = new Date(sale.date).getMonth();
            monthlyData[monthIndex].Vendas += sale.total;
        });
    
        return monthlyData;
    }, [filteredSales, sales, startDate, endDate]);

    const customerSourceData = useMemo(() => {
        const activeCustomerIds = new Set(filteredSales.map(s => s.customerId));
        const activeCustomers = customers.filter(c => activeCustomerIds.has(c.id));
        
        const sourceCounts = activeCustomers.reduce((acc, customer) => {
            const sourceName = customer.source || 'Não especificado';
            acc[sourceName] = (acc[sourceName] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(sourceCounts).map(([name, value]) => ({ name, value }));
    }, [filteredSales, customers]);

    const PIE_COLORS = ['#4d7c0f', '#65a30d', '#84cc16', '#a3e635', '#bef264', '#d9f99d', '#ecfccb'];
    const EMERALD_COLORS = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'];
    const DYNAMIC_COLORS = theme === 'theme-light-moss' ? PIE_COLORS : EMERALD_COLORS;

    return (
        <div className="space-y-8">
            <h1 className="text-4xl font-bold text-text-primary">Dashboard</h1>
            
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Vendas no Período" value={`R$ ${totalRevenue.toFixed(2)}`} icon={ICONS.sales} />
                <StatCard title="Lucro Bruto" value={`R$ ${grossProfit.toFixed(2)}`} icon={ICONS.profit} />
                <StatCard title="A Receber (A Prazo)" value={`R$ ${totalReceivable.toFixed(2)}`} icon={ICONS.aprazo} />
                <StatCard title="Ticket Médio" value={`R$ ${averageTicket.toFixed(2)}`} icon={ICONS.sales} />
                <StatCard title="Clientes Ativos" value={`${activeCustomersCount}`} icon={ICONS.customers} />
                <StatCard title="Estoque Atual" value={`${totalStock} Un.`} icon={ICONS.products} />
            </div>

            <div className="bg-card p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-text-primary">Histórico de Vendas</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={salesChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                        <XAxis dataKey="name" stroke={chartColors.axis} />
                        <YAxis stroke={chartColors.axis} />
                        <Tooltip contentStyle={{ backgroundColor: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}` }} />
                        <Legend />
                        <Bar dataKey="Vendas" fill={chartColors.barFill} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-semibold mb-4 text-text-primary">Origem dos Clientes (no período)</h2>
                    {customerSourceData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie 
                                    data={customerSourceData} 
                                    dataKey="value" 
                                    nameKey="name" 
                                    cx="50%" 
                                    cy="50%" 
                                    outerRadius={100} 
                                    fill={chartColors.barFill}
                                    label
                                >
                                    {customerSourceData.map((entry, index) => <Cell key={`cell-${index}`} fill={DYNAMIC_COLORS[index % DYNAMIC_COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}` }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-text-secondary text-center h-[300px] flex items-center justify-center">Não há dados de clientes no período selecionado.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;