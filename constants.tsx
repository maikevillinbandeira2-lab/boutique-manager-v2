import React from 'react';
import { Product, Customer, Seller, Sale, ProductCondition, CustomerStatus, CustomerSource, PaymentType, Exchange, ExchangePaymentMethod, ExchangeStatus } from './types';

export const SELLERS: Seller[] = [
  { id: 'seller-1', name: 'Maikellen' },
  { id: 'seller-2', name: 'Dhaluma' },
  { id: 'seller-3', name: 'Outros' },
];

export const INITIAL_PRODUCTS: Product[] = [
  { id: 'prod-1', name: 'Tênis de Corrida', description: 'Leve e confortável para corridas diárias.', category: 'Calçados', brand: 'SportFit', condition: ProductCondition.Novo, size: '42', color: 'Azul', price: 299.9, purchasePrice: 150.0, quantity: 10, createdAt: new Date('2024-07-10T10:00:00Z') },
  { id: 'prod-2', name: 'Camisa Casual', description: 'Camisa de algodão para o dia a dia.', category: 'Roupas', brand: 'UrbanStyle', condition: ProductCondition.Novo, size: 'M', color: 'Branca', price: 89.9, purchasePrice: 40.0, quantity: 25, createdAt: new Date('2024-07-11T11:00:00Z') },
  { id: 'prod-3', name: 'Bolsa de Couro', description: 'Bolsa de couro genuíno, usada em ótimo estado.', category: 'Acessórios', brand: 'ClassicBags', condition: ProductCondition.Usado, size: 'Único', color: 'Marrom', price: 150.0, purchasePrice: 90.0, quantity: 5, createdAt: new Date('2024-06-20T14:00:00Z') },
  { id: 'prod-4', name: 'Calça Jeans Skinny', description: 'Calça jeans com elastano para maior conforto.', category: 'Roupas', brand: 'DenimCo', condition: ProductCondition.Novo, size: '38', color: 'Azul Escuro', price: 179.9, purchasePrice: 85.0, quantity: 15, createdAt: new Date('2024-07-01T09:30:00Z') },
  { id: 'prod-5', name: 'Relógio Esportivo', description: 'Relógio digital à prova d\'água.', category: 'Acessórios', brand: 'TimeMaster', condition: ProductCondition.Novo, size: 'Único', color: 'Preto', price: 250.0, purchasePrice: 120.0, quantity: 8, createdAt: new Date('2024-05-15T18:00:00Z') },
  { id: 'prod-6', name: 'Sandália de Verão', description: 'Sandália aberta e confortável, pouco usada.', category: 'Calçados', brand: 'SunStep', condition: ProductCondition.Usado, size: '37', color: 'Dourada', price: 70.0, purchasePrice: 30.0, quantity: 3, createdAt: new Date('2024-06-05T13:20:00Z') },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'cust-1', name: 'Carlos Pereira', phone: '(11) 98765-4321', status: CustomerStatus.Regular, source: CustomerSource.Instagram, createdAt: new Date('2024-07-15T10:00:00Z') },
  { id: 'cust-2', name: 'Mariana Lima', phone: '(21) 91234-5678', status: CustomerStatus.Nova, source: CustomerSource.Indicacao, createdAt: new Date('2024-07-21T15:00:00Z') },
  { id: 'cust-3', name: 'Roberto Almeida', phone: '(31) 95555-1111', status: CustomerStatus.Top10, source: CustomerSource.StudioMB, createdAt: new Date('2024-06-10T11:30:00Z') },
];

const nextMonth = new Date();
nextMonth.setMonth(nextMonth.getMonth() + 1);

const twoMonths = new Date();
twoMonths.setMonth(twoMonths.getMonth() + 2);

export const INITIAL_SALES: Sale[] = [
  {
    id: 'sale-1',
    date: new Date('2024-07-20T10:30:00'),
    sellerId: 'seller-1',
    customerId: 'cust-1',
    items: [{ productId: 'prod-1', quantity: 1, unitPrice: 299.9 }],
    total: 299.9,
    payments: [{ id: 'pay-1', type: PaymentType.Credito, amount: 299.9, installments: 3 }],
  },
  {
    id: 'sale-2',
    date: new Date('2024-07-21T15:00:00'),
    sellerId: 'seller-2',
    customerId: 'cust-2',
    items: [
      { productId: 'prod-2', quantity: 2, unitPrice: 89.9 },
      { productId: 'prod-4', quantity: 1, unitPrice: 179.9 },
    ],
    total: 359.7,
    payments: [{ id: 'pay-2', type: PaymentType.Pix, amount: 359.7 }],
  },
   {
    id: 'sale-3',
    date: new Date(),
    sellerId: 'seller-1',
    customerId: 'cust-3',
    items: [{ productId: 'prod-5', quantity: 1, unitPrice: 250.0 }],
    total: 250.0,
    payments: [{ 
        id: 'pay-3', 
        type: PaymentType.APrazo, 
        amount: 250.0, 
        paymentDates: [
            { date: nextMonth.toISOString().split('T')[0], status: 'Pendente' },
            { date: twoMonths.toISOString().split('T')[0], status: 'Pendente' },
        ]
    }],
  },
];

const valeExpires = new Date('2024-07-25T14:00:00Z');
valeExpires.setDate(valeExpires.getDate() + 30);

export const INITIAL_EXCHANGES: Exchange[] = [
  {
    id: 'exch-1',
    date: new Date('2024-07-25T14:00:00Z'),
    customerId: 'cust-1',
    isBulk: false,
    items: [
      { id: 'ex-item-1', description: 'Vestido floral de verão', purchaseValue: 50.0 },
      { id: 'ex-item-2', description: 'Sapato de salto preto', purchaseValue: 75.0 },
    ],
    totalValue: 125.0,
    paymentMethod: ExchangePaymentMethod.Vale,
    status: ExchangeStatus.Pendente,
    valeExpiresAt: valeExpires.toISOString(),
  },
  {
    id: 'exch-2',
    date: new Date('2024-07-26T11:00:00Z'),
    customerId: 'cust-3',
    isBulk: true,
    bulkQuantity: 5,
    items: [],
    totalValue: 100.0,
    paymentMethod: ExchangePaymentMethod.Dinheiro,
  }
];

export const ICONS = {
  dashboard: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="#818cf8"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  products: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="#f472b6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>,
  customers: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="#60a5fa"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  sales: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="#fb923c"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
  aprazo: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="#fb7185"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  reports: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="#4ade80"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  pedidos: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="#c084fc"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
  trocas: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="#a78bfa" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>,
  compras: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="#f87171" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  investidores: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="#eab308" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  aplicacoes: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="#34d399"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
  profit: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="#4ade80"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
  caixa: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="#2dd4bf" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>,
  settings: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="#a3a3a3" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  logo: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21v-2a6 6 0 00-12 0v2" /></svg>
};