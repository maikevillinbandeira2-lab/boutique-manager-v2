export type Page = 'dashboard' | 'products' | 'customers' | 'sales' | 'aprazo' | 'reports' | 'pedidos' | 'trocas' | 'compras' | 'investidores' | 'aplicacoes' | 'caixa' | 'settings';

export enum ProductCondition {
  Novo = 'Novo',
  Usado = 'Usado',
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  brand: string;
  condition: ProductCondition;
  size: string;
  color: string;
  price: number;
  purchasePrice: number;
  quantity: number;
  createdAt: Date;
}

export enum CustomerStatus {
  Nova = 'Nova',
  Regular = 'Regular',
  Top10 = 'Top 10',
}

export enum CustomerSource {
  Instagram = 'Instagram',
  Indicacao = 'Indicação',
  StudioMB = 'Studio MB',
  StudioDT = 'Studio DT',
  Outros = 'Outros',
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  status: CustomerStatus;
  source: CustomerSource;
  sourceOther?: string;
  sourceIndicatorName?: string;
  createdAt: Date;
}

export interface Seller {
  id: string;
  name: string;
}

export interface SaleItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export enum PaymentType {
  Credito = 'Crédito',
  Debito = 'Débito',
  Pix = 'Pix',
  Dinheiro = 'Dinheiro',
  APrazo = 'A Prazo',
  Vale = 'Vale',
  TrocaServico = 'Troca/Serviço',
}

export interface Installment {
    date: string; // YYYY-MM-DD
    status: 'Pendente' | 'Pago';
    paymentDate?: string; // YYYY-MM-DD
}

export interface PaymentDetail {
    id: string;
    type: PaymentType;
    amount: number;
    installments?: number;
    paymentDates?: Installment[];
    description?: string;
}

export interface Sale {
  id: string;
  date: Date;
  sellerId: string;
  sellerNameOverride?: string;
  customerId: string;
  items: SaleItem[];
  total: number;
  payments: PaymentDetail[];
}

export enum ExchangePaymentMethod {
  Vale = 'Vale',
  Dinheiro = 'Dinheiro',
}

export enum ExchangeStatus {
  Pendente = 'Pendente',
  Finalizado = 'Finalizado',
  PagoEmDinheiro = 'Pago em Dinheiro'
}

export interface ExchangeItem {
  id: string;
  description: string;
  purchaseValue: number;
}

export interface Exchange {
  id: string;
  date: Date;
  customerId: string;
  isBulk: boolean;
  items: ExchangeItem[];
  bulkQuantity?: number;
  totalValue: number;
  paymentMethod: ExchangePaymentMethod;
  status?: ExchangeStatus;
  valeExpiresAt?: string;
}

export enum OrderStatus {
  Pendente = 'Pendente',
  Buscando = 'Buscando',
  Entregue = 'Entregue',
  Cancelado = 'Cancelado',
}

export interface SpecificOrder {
  id: string;
  customerId: string;
  product: string;
  size: string;
  color: string;
  eventDate?: string;
  createdAt: Date;
  status: OrderStatus;
  images?: string[]; // Array of Base64 data URLs
}

// Types for Compras and Investidores
export interface ReceivedPayment {
  id: string;
  amount: number;
  date: string; // YYYY-MM-DD
}

export type PaymentSource = 'Caixa da loja' | 'Maikellen' | 'Dhaluma' | 'Outros';

export interface PurchasePayment {
    id: string;
    source: PaymentSource;
    otherSourceName?: string; // If source is 'Outros'
    amount: number;
    paymentMethod: PaymentType; // Reusing from Sales
    paymentsReceived: ReceivedPayment[];
}

export type PurchaseType = 'detalhado' | 'lote';

export interface PurchaseItem {
    id: string;
    description: string;
    purchaseValue: number;
    category: 'Roupas' | 'Calçados' | 'Acessórios';
    condition: ProductCondition; // Reusing from Products
}

export interface LotInfo {
    quantity: number;
    includesClothing: boolean;
    includesFootwear: boolean;
    includesAccessories: boolean;
    includesNew: boolean;
    includesUsed: boolean;
}

export interface Purchase {
    id: string;
    date: Date;
    collectionName: string;
    purchaseType: PurchaseType;
    items: PurchaseItem[];
    lotInfo?: LotInfo;
    payments: PurchasePayment[];
    totalValue: number;
}

// Types for Aplicações
export interface AplicacaoItem {
  id: string;
  description: string;
  value: number;
}

export interface Aplicacao {
  id: string;
  date: Date;
  name: string;
  type: 'detalhada' | 'resumida';
  items: AplicacaoItem[];
  summaryDescription?: string;
  payments: PurchasePayment[];
  totalValue: number;
}

// Types for Caixa
export interface CompromissoPayment {
    id: string;
    source: PaymentSource;
    otherSourceName?: string;
    method: PaymentType;
    amount: number;
}

export interface Compromisso {
  id: string;
  description: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  paymentDate?: string; // YYYY-MM-DD
  status: 'Pendente' | 'Pago';
  recurringId?: string; // To group recurring expenses
  installment?: { current: number; total: number };
  payments?: CompromissoPayment[];
}

export interface SalaryPayment {
  id: string;
  month: string; // YYYY-MM
  recipient: 'Maikellen' | 'Dhaluma' | 'Outros';
  recipientName?: string;
  amount: number;
  paymentDate: string; // YYYY-MM-DD
}