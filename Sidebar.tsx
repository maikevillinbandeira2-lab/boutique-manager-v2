import React from 'react';
import { Page } from '../types';
import { ICONS } from '../constants';

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  theme: string;
  setTheme: (theme: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const NavItem: React.FC<{
  page: Page;
  label: string;
  icon: React.ReactNode;
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
}> = ({ page, label, icon, currentPage, setCurrentPage }) => {
  const isActive = currentPage === page;
  return (
    <li
      className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
        isActive ? 'bg-primary text-white shadow-lg' : 'hover:bg-card text-text-secondary hover:text-text-primary'
      }`}
      onClick={() => setCurrentPage(page)}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </li>
  );
};

const ThemeSwitcher: React.FC<{ theme: string; setTheme: (theme: string) => void; }> = ({ theme, setTheme }) => {
  return (
    <div className="mt-6 pt-6 border-t border-border-color">
      <h3 className="text-sm font-semibold text-text-secondary mb-3">Tema</h3>
      <div className="flex space-x-2">
        <button 
          onClick={() => setTheme('theme-dark-emerald')}
          className={`w-full py-2 text-sm rounded-md transition-colors ${theme === 'theme-dark-emerald' ? 'bg-primary text-white' : 'bg-card hover:bg-opacity-80'}`}
        >
          Escuro
        </button>
        <button 
          onClick={() => setTheme('theme-light-moss')}
          className={`w-full py-2 text-sm rounded-md transition-colors ${theme === 'theme-light-moss' ? 'bg-primary text-white' : 'bg-card hover:bg-opacity-80 text-text-primary'}`}
        >
          Claro
        </button>
      </div>
    </div>
  )
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage, theme, setTheme, isOpen, onClose }) => {
  return (
    <aside className={`w-64 bg-secondary p-6 flex flex-col h-full text-text-primary 
                       fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out
                       ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
                       md:relative md:translate-x-0 md:shadow-2xl`}>
      <div className="flex-shrink-0">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center space-x-3">
            {ICONS.logo}
            <h1 className="text-2xl font-bold">BoutiqueManager</h1>
          </div>
          <button onClick={onClose} className="md:hidden text-text-secondary hover:text-text-primary" aria-label="Fechar menu">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <nav className="flex-grow overflow-y-auto">
        <ul className="space-y-3">
          <NavItem page="dashboard" label="Dashboard" icon={ICONS.dashboard} currentPage={currentPage} setCurrentPage={setCurrentPage} />
          <NavItem page="products" label="Produtos" icon={ICONS.products} currentPage={currentPage} setCurrentPage={setCurrentPage} />
          <NavItem page="customers" label="Clientes" icon={ICONS.customers} currentPage={currentPage} setCurrentPage={setCurrentPage} />
          <NavItem page="sales" label="Vendas" icon={ICONS.sales} currentPage={currentPage} setCurrentPage={setCurrentPage} />
          <NavItem page="trocas" label="Trocas" icon={ICONS.trocas} currentPage={currentPage} setCurrentPage={setCurrentPage} />
          <NavItem page="compras" label="Compras" icon={ICONS.compras} currentPage={currentPage} setCurrentPage={setCurrentPage} />
          <NavItem page="investidores" label="Investidores" icon={ICONS.investidores} currentPage={currentPage} setCurrentPage={setCurrentPage} />
          <NavItem page="aplicacoes" label="Aplicações" icon={ICONS.aplicacoes} currentPage={currentPage} setCurrentPage={setCurrentPage} />
          <NavItem page="aprazo" label="A Prazo" icon={ICONS.aprazo} currentPage={currentPage} setCurrentPage={setCurrentPage} />
          <NavItem page="caixa" label="Caixa" icon={ICONS.caixa} currentPage={currentPage} setCurrentPage={setCurrentPage} />
          <NavItem page="pedidos" label="Pedidos" icon={ICONS.pedidos} currentPage={currentPage} setCurrentPage={setCurrentPage} />
          <NavItem page="reports" label="Relatórios" icon={ICONS.reports} currentPage={currentPage} setCurrentPage={setCurrentPage} />
          <NavItem page="settings" label="Configurações" icon={ICONS.settings} currentPage={currentPage} setCurrentPage={setCurrentPage} />
        </ul>
      </nav>
      <div className="flex-shrink-0">
        <ThemeSwitcher theme={theme} setTheme={setTheme} />
        <div className="text-center text-xs text-text-secondary mt-6">
          <p>&copy; 2024 BoutiqueManager</p>
          <p>Todos os direitos reservados.</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;