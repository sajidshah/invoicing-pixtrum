import type { Timestamp } from "firebase/firestore";

export interface User {
  email: string;
  displayName?: string;
  createdAt: Timestamp;
}

export interface UserSettings {
  id?: string;
  userId: string;
  invoiceStartNumber: number;
  defaultTaxRate: number;
  defaultCurrency: string;
  companyName?: string;
  companyAddress?: string;
  companyEmail?: string;
  companyPhone?: string;
  bankDetails?: string;
  quantityLabel?: string;
  unitPriceLabel?: string;
  footerNote?: string;
  updatedAt: Timestamp;
}

export interface Client {
  id?: string;
  ownedBy: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export type InvoiceStatus = "draft" | "sent" | "paid";

export interface Invoice {
  id?: string;
  ownedBy: string;
  clientId: string;
  number: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  status: InvoiceStatus;
  pdfUrl?: string;
  createdAt: Timestamp;
}

export interface ClientFormData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  notes?: string;
}

export interface InvoiceFormData {
  clientId: string;
  number: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  tax: number;
  currency: string;
  status: InvoiceStatus;
}
