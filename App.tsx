import React, { useState, useEffect, useContext } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from "./components/Sidebar";
import Dashboard from './components/Dashboard';
import Products from './components/Products';
import Customers from './components/Customers';
import Sales from './components/Sales';
import APrazo from './components/APrazo';
import Reports from './components/Reports';
import Pedidos from './components/Pedidos';
import Trocas from './components/Trocas';
import Compras from './components/Compras';
import Investidores from './components/Investidores';
import Aplicacoes from './components/Aplicacoes';
import Caixa from './components/Caixa';
import Settings from './components/Settings';
import Login from './components/Login';
import Signup from './components/Signup';

import { Page, Product, Customer, Sale, Seller, Installment, SpecificOrder, OrderStatus, Exchange, ExchangeStatus, Purchase, ReceivedPayment, Aplicacao, SalaryPayment } from './types';
import { INITIAL_PRODUCTS, INITIAL_CUSTOMERS, INITIAL_SALES, INITIAL_EXCHANGES, SELLERS } from './constants';
import { AuthProvider, AuthContext } from './contexts/AuthContext';


const DATA_KEYS = {
  products: 'boutique-manager-products',
  customers: 'boutique-manager-customers',
  sales: 'boutique-manager-sales',
  exchanges: 'boutique-manager-exchanges',
  purchases: 'boutique-manager-purchases',
  aplicacoes: 'boutique-manager-aplicacoes',
  salaryPayments: 'boutique-manager-salary-payments',
  saldosAnteriores: 'boutique-manager-saldos-anteriores',
  specificOrders: 'boutique-manager-specific-orders',
};


// Helper for localStorage
const useStickyState = <T,>(defaultValue: T, key: string): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [value, setValue] = useState<T>(() => {
    try {
      const stickyValue = window.localStorage.getItem(key);
      return stickyValue !== null ? JSON.parse(stickyValue, (k, v) => {
        // Reviver function to convert ISO date strings back to Date objects
        if (k === 'date' || k === 'createdAt' || k === 'valeExpiresAt') {
            if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(v)) {
                return new Date(v);
            }
        }
        return v;
      }) : defaultValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
};

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
    const auth = useContext(AuthContext);

    if (auth.loading) {
        return <div className="flex justify-center items-center h-screen bg-background text-text-primary">Carregando...</div>;
    }

    if (!auth.currentUser) {
        return <Navigate to="/login" />;
    }

    return children;
};


const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useStickyState<Page>('dashboard', 'boutique-manager-page');
  const [theme, setTheme] = useStickyState<string>('theme-dark-emerald', 'boutique-manager-theme');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [products, setProducts] = useStickyState<Product[]>(INITIAL_PRODUCTS, DATA_KEYS.products);
  const [customers, setCustomers] = useStickyState<Customer[]>(INITIAL_CUSTOMERS, DATA_KEYS.customers);
  const [sales, setSales] = useStickyState<Sale[]>(INITIAL_SALES, DATA_KEYS.sales);
  const [exchanges, setExchanges] = useStickyState<Exchange[]>(INITIAL_EXCHANGES, DATA_KEYS.exchanges);
  const [purchases, setPurchases] = useStickyState<Purchase[]>([], DATA_KEYS.purchases);
  const [aplicacoes, setAplicacoes] = useStickyState<Aplicacao[]>([], DATA_KEYS.aplicacoes);
  const [salaryPayments, setSalaryPayments] = useStickyState<SalaryPayment[]>([], DATA_KEYS.salaryPayments);
  const [specificOrders, setSpecificOrders] = useStickyState<SpecificOrder[]>([], DATA_KEYS.specificOrders);

  useEffect(() => {
    document.body.className = `bg-background font-sans ${theme}`;
  }, [theme]);
  
  const sellers: Seller[] = SELLERS;
  
  const handleExportData = () => {
    const allData: { [key: string]: any } = {};
    for (const key in DATA_KEYS) {
        const dataKey = DATA_KEYS[key as keyof typeof DATA_KEYS];
        const data = window.localStorage.getItem(dataKey);
        if (data) {
            allData[key] = JSON.parse(data);
        }
    }

    const jsonString = JSON.stringify(allData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const today = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `backup-boutique-manager-${today}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleImportData = (jsonData: string) => {
    try {
        const parsedData = JSON.parse(jsonData);
        
        // Basic validation
        const requiredKeys = Object.keys(DATA_KEYS);
        const dataKeys = Object.keys(parsedData);
        if (!requiredKeys.some(key => dataKeys.includes(key))) {
            throw new Error("Arquivo de backup inválido ou corrompido.");
        }
        
        for (const key in parsedData) {
            const storageKey = DATA_KEYS[key as keyof typeof DATA_KEYS];
            if (storageKey) {
                window.localStorage.setItem(storageKey, JSON.stringify(parsedData[key]));
            }
        }
        
        alert("Dados importados com sucesso! A aplicação será recarregada.");
        window.location.reload();

    } catch (error) {
        console.error("Erro ao importar dados:", error);
        alert(`Falha na importação. Verifique se o arquivo de backup é válido. Erro: ${error instanceof Error ? error.message : 'Desconhecido'}`);
    }
  };


  // Product Handlers
  const handleSaveProduct = (productToSave: Product) => {
    setProducts(prev => {
      const index = prev.findIndex(p => p.id === productToSave.id);
      if (index > -1) {
        const updated = [...prev];
        updated[index] = productToSave;
        return updated;
      }
      return [...prev, productToSave];
    });
  };
  
  const handleBulkDeleteProducts = (productIds: string[]) => {
    setProducts(prev => prev.filter(p => !productIds.includes(p.id)));
  };

  // Customer Handlers
  const handleSaveCustomer = (customerToSave: Customer) => {
    setCustomers(prev => {
      const index = prev.findIndex(c => c.id === customerToSave.id);
      if (index > -1) {
        const updated = [...prev];
        updated[index] = customerToSave;
        return updated;
      }
      return [customerToSave, ...prev];
    });
  };

  const handleDeleteCustomer = (customerId: string) => {
    setCustomers(prev => prev.filter(c => c.id !== customerId));
  };
  
  // Sale Handlers
  const handleSaveSale = (saleToSave: Sale) => {
    const stockChanges = new Map<string, number>();
    const originalSale = sales.find(s => s.id === saleToSave.id);

    // If editing, calculate stock to be returned
    if (originalSale) {
        originalSale.items.forEach(item => {
            stockChanges.set(item.productId, (stockChanges.get(item.productId) || 0) + item.quantity);
        });
    }

    // Calculate stock to be removed for the new/updated sale
    saleToSave.items.forEach(item => {
        stockChanges.set(item.productId, (stockChanges.get(item.productId) || 0) - item.quantity);
    });

    // Apply all stock changes immutably
    setProducts(prevProducts => 
        prevProducts.map(p => {
            if (stockChanges.has(p.id)) {
                return { ...p, quantity: p.quantity + (stockChanges.get(p.id) || 0) };
            }
            return p;
        })
    );

    // Save the sale itself
    setSales(prev => {
      const index = prev.findIndex(s => s.id === saleToSave.id);
      if (index > -1) {
        const updated = [...prev];
        updated[index] = saleToSave;
        return updated;
      }
      return [saleToSave, ...prev];
    });
  };

  const handleDeleteSale = (saleId: string) => {
     // Re-add stock
     setProducts(prevProducts => {
        const saleToDelete = sales.find(s => s.id === saleId);
        if (!saleToDelete) return prevProducts;

        const newProducts = [...prevProducts];
        saleToDelete.items.forEach(item => {
            const productIndex = newProducts.findIndex(p => p.id === item.productId);
            if (productIndex > -1) {
                newProducts[productIndex].quantity += item.quantity;
            }
        });
        return newProducts;
    });

    setSales(prev => prev.filter(s => s.id !== saleId));
  };

  const handleAPrazoPaymentUpdate = (saleId: string, paymentId: string, dateIndex: number, newStatus: Installment['status']) => {
    setSales(prevSales => {
        return prevSales.map(sale => {
            if (sale.id === saleId) {
                return {
                    ...sale,
                    payments: sale.payments.map(payment => {
                        if (payment.id === paymentId && payment.paymentDates) {
                            const updatedDates = [...payment.paymentDates];
                            const originalInstallment = updatedDates[dateIndex];
                            
                            const today = new Date();
                            const year = today.getFullYear();
                            const month = (today.getMonth() + 1).toString().padStart(2, '0');
                            const day = today.getDate().toString().padStart(2, '0');
                            const localDateString = `${year}-${month}-${day}`;

                            updatedDates[dateIndex] = { ...originalInstallment, status: newStatus, paymentDate: newStatus === 'Pago' ? localDateString : undefined };
                            return { ...payment, paymentDates: updatedDates };
                        }
                        return payment;
                    })
                };
            }
            return sale;
        });
    });
  };

  // Specific Order Handlers
  const handleSaveSpecificOrder = (orderToSave: SpecificOrder) => {
    setSpecificOrders(prev => {
        const index = prev.findIndex(o => o.id === orderToSave.id);
        if (index > -1) {
            const updated = [...prev];
            updated[index] = orderToSave;
            return updated;
        }
        return [orderToSave, ...prev];
    });
  };

  const handleDeleteSpecificOrder = (orderId: string) => {
      setSpecificOrders(prev => prev.filter(o => o.id !== orderId));
  };

  const handleUpdateSpecificOrderStatus = (orderId: string, status: OrderStatus) => {
      setSpecificOrders(prev => prev.map(order => order.id === orderId ? { ...order, status } : order));
  };

  // Exchange Handlers
  const handleSaveExchange = (exchangeToSave: Exchange) => {
    setExchanges(prev => {
        const index = prev.findIndex(ex => ex.id === exchangeToSave.id);
        if (index > -1) {
            const updated = [...prev];
            updated[index] = exchangeToSave;
            return updated;
        }
        return [exchangeToSave, ...prev];
    });
  };

  const handleDeleteExchange = (exchangeId: string) => {
      setExchanges(prev => prev.filter(ex => ex.id !== exchangeId));
  };

  const handleExchangeStatusUpdate = (exchangeId: string, status: ExchangeStatus) => {
      setExchanges(prev => prev.map(ex => ex.id === exchangeId ? { ...ex, status } : ex));
  };
  
  // Purchase Handlers
  const handleSavePurchase = (purchaseToSave: Purchase) => {
    setPurchases(prev => {
        const index = prev.findIndex(p => p.id === purchaseToSave.id);
        if (index > -1) {
            const updated = [...prev];
            updated[index] = purchaseToSave;
            return updated.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }
        return [purchaseToSave, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });
  };

  const handleDeletePurchase = (purchaseId: string) => {
    setPurchases(prev => prev.filter(p => p.id !== purchaseId));
  };
  
  // Aplicação Handlers
  const handleSaveAplicacao = (aplicacaoToSave: Aplicacao) => {
    setAplicacoes(prev => {
        const index = prev.findIndex(p => p.id === aplicacaoToSave.id);
        if (index > -1) {
            const updated = [...prev];
            updated[index] = aplicacaoToSave;
            return updated.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }
        return [aplicacaoToSave, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });
  };

  const handleDeleteAplicacao = (aplicacaoId: string) => {
    setAplicacoes(prev => prev.filter(p => p.id !== aplicacaoId));
  };

  // Salary Handlers
  const handleSaveSalaryPayment = (paymentToSave: SalaryPayment) => {
    setSalaryPayments(prev => {
        const index = prev.findIndex(p => p.id === paymentToSave.id);
        if (index > -1) {
            const updated = [...prev];
            updated[index] = paymentToSave;
            return updated.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
        }
        return [paymentToSave, ...prev].sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
    });
  };

  const handleDeleteSalaryPayment = (paymentId: string) => {
      setSalaryPayments(prev => prev.filter(p => p.id !== paymentId));
  };

  // Investor Payment Handler
  const handleAddReceivedInvestorPayment = (id: string, paymentId: string, receivedPayment: ReceivedPayment, source: 'purchase' | 'application') => {
      const updateFunction = (items: (Purchase | Aplicacao)[]) => {
          return items.map(item => {
              if (item.id === id) {
                  const updatedPayments = item.payments.map(payment => {
                      if (payment.id === paymentId) {
                          const updatedReceived = [...(Array.isArray(payment.paymentsReceived) ? payment.paymentsReceived : []), receivedPayment];
                          return { ...payment, paymentsReceived: updatedReceived };
                      }
                      return payment;
                  });
                  return { ...item, payments: updatedPayments };
              }
              return item;
          });
      };

      if (source === 'purchase') {
          setPurchases(prev => updateFunction(prev) as Purchase[]);
      } else {
          setAplicacoes(prev => updateFunction(prev) as Aplicacao[]);
      }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard products={products} sales={sales} customers={customers} theme={theme} />;
      case 'products':
        return <Products products={products} sales={sales} onSave={handleSaveProduct} onBulkDelete={handleBulkDeleteProducts} />;
      case 'customers':
        return <Customers 
                    customers={customers} 
                    sales={sales} 
                    exchanges={exchanges}
                    specificOrders={specificOrders}
                    onSave={handleSaveCustomer}
                    onDelete={handleDeleteCustomer}
                    onSaveSpecificOrder={handleSaveSpecificOrder}
                    onDeleteSpecificOrder={handleDeleteSpecificOrder}
                    onUpdateSpecificOrderStatus={handleUpdateSpecificOrderStatus}
                />;
      case 'sales':
        return <Sales sales={sales} products={products} customers={customers} sellers={sellers} onSave={handleSaveSale} onDelete={handleDeleteSale} onCustomerSave={handleSaveCustomer} />;
      case 'aprazo':
        return <APrazo sales={sales} customers={customers} onPaymentUpdate={handleAPrazoPaymentUpdate} />;
      case 'reports':
        return <Reports sales={sales} products={products} sellers={sellers} theme={theme} purchases={purchases} aplicacoes={aplicacoes} exchanges={exchanges} />;
      case 'pedidos':
        return <Pedidos 
                  customers={customers}
                  specificOrders={specificOrders}
                  onSaveSpecificOrder={handleSaveSpecificOrder}
                  onDeleteSpecificOrder={handleDeleteSpecificOrder}
                  onUpdateSpecificOrderStatus={handleUpdateSpecificOrderStatus}
                  onSaveCustomer={handleSaveCustomer}
               />;
      case 'trocas':
        return <Trocas exchanges={exchanges} customers={customers} onSave={handleSaveExchange} onDelete={handleDeleteExchange} onCustomerSave={handleSaveCustomer} onStatusUpdate={handleExchangeStatusUpdate} />;
      case 'compras':
        return <Compras purchases={purchases} onSave={handleSavePurchase} onDelete={handleDeletePurchase} />;
      case 'aplicacoes':
        return <Aplicacoes aplicacoes={aplicacoes} onSave={handleSaveAplicacao} onDelete={handleDeleteAplicacao} />;
      case 'investidores':
        return <Investidores purchases={purchases} aplicacoes={aplicacoes} onAddPayment={handleAddReceivedInvestorPayment} />;
      case 'caixa':
        return <Caixa 
                    sales={sales} 
                    purchases={purchases} 
                    aplicacoes={aplicacoes} 
                    exchanges={exchanges}
                    salaryPayments={salaryPayments}
                    onSaveSalaryPayment={handleSaveSalaryPayment}
                    onDeleteSalaryPayment={handleDeleteSalaryPayment}
                />;
      case 'settings':
        return <Settings onExport={handleExportData} onImport={handleImportData} />;
      default:
        return <div>Página não encontrada</div>;
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
        theme={theme} 
        setTheme={setTheme} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <button 
            onClick={() => setIsSidebarOpen(true)} 
            className="md:hidden mb-4 p-2 rounded-md bg-card text-text-primary"
            aria-label="Abrir menu"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
        </button>
        {renderPage()}
      </main>
    </div>
  );
};

const App: React.FC = () => {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/" element={
                        <ProtectedRoute>
                            <AppContent />
                        </ProtectedRoute>
                    } />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;