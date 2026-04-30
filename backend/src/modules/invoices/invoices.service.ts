import { AppError } from "../../shared/errors/app-error.js";
import { toNumber } from "../../lib/utils/numbers.js";
import { buildStoragePath, uploadToStorage, getStoragePublicUrl } from "../../infrastructure/storage/supabase-storage.js";
import type { InvoiceItemRow, InvoiceRow, NewInvoiceItemRow, NewInvoiceRow } from "../../infrastructure/database/schema.js";
import { generateInvoicePdfBuffer } from "../../lib/pdf/invoice-generator.js";
import type { InvoicesRepository, InvoiceSortKey } from "./invoices.repository.js";

export interface InvoiceItemPayload {
  description: string;
  descriptionAr?: string | null;
  quantity?: number;
  unitPrice: number;
  total?: number;
  sortOrder?: number;
}

export interface InvoicePayload {
  clientId?: string | null;
  invoiceNumber?: string;
  title: string;
  titleAr?: string | null;
  subtotal: number;
  vatAmount?: number;
  total?: number;
  currency?: string;
  paymentTerms?: InvoiceRow["paymentTerms"];
  issueDate?: string;
  dueDate?: string | null;
  status?: InvoiceRow["status"];
  murabahaTerms?: string | null;
  profitRate?: number | null;
  generatedByVoice?: boolean;
  chaserSent?: boolean;
  chaserMessage?: string | null;
  items?: InvoiceItemPayload[];
}

export interface InvoiceListQuery {
  status?: InvoiceRow["status"];
  clientId?: string;
  sort?: InvoiceSortKey;
}

export class InvoicesService {
  constructor(private readonly repository: InvoicesRepository) {}

  list(query: InvoiceListQuery) {
    return this.repository.list(query);
  }

  async getById(id: string): Promise<InvoiceItemRow & InvoiceRow | null> {
    const invoice = await this.repository.findByIdWithItems(id);
    return invoice as (InvoiceItemRow & InvoiceRow) | null;
  }

  async create(payload: InvoicePayload) {
    const issueDate = payload.issueDate ?? new Date().toISOString().slice(0, 10);
    const invoiceNumber = payload.invoiceNumber ?? (await this.repository.nextInvoiceNumber(`INV-${new Date(issueDate).getFullYear()}`));
    const subtotal = toNumber(payload.subtotal) ?? 0;
    const vatAmount = toNumber(payload.vatAmount) ?? 0;
    const total = toNumber(payload.total) ?? subtotal + vatAmount;
    const dueDate = payload.dueDate ?? this.calculateDueDate(issueDate, payload.paymentTerms ?? "net_30");

    const items = this.normalizeItems(payload.items);

    return this.repository.create(
      {
        clientId: payload.clientId ?? null,
        invoiceNumber,
        title: payload.title.trim(),
        titleAr: this.optionalText(payload.titleAr),
        subtotal: subtotal.toFixed(2),
        vatAmount: vatAmount.toFixed(2),
        total: total.toFixed(2),
        currency: payload.currency?.trim() || "USD",
        paymentTerms: payload.paymentTerms ?? "net_30",
        issueDate,
        dueDate,
        status: payload.status ?? "draft",
        murabahaTerms: this.optionalText(payload.murabahaTerms),
        profitRate: toNumber(payload.profitRate)?.toFixed(2),
        generatedByVoice: payload.generatedByVoice ?? false,
        chaserSent: payload.chaserSent ?? false,
        chaserMessage: this.optionalText(payload.chaserMessage),
      },
      items,
    );
  }

  async update(id: string, payload: Partial<InvoicePayload>) {
    const existing = await this.repository.findByIdWithItems(id);

    if (!existing) {
      throw new AppError("Invoice not found", 404);
    }

    const issueDate = payload.issueDate ?? String(existing.issueDate);
    const paymentTerms = payload.paymentTerms ?? existing.paymentTerms;
    const subtotal = toNumber(payload.subtotal ?? existing.subtotal) ?? 0;
    const vatAmount = toNumber(payload.vatAmount ?? existing.vatAmount) ?? 0;
    const total = toNumber(payload.total ?? existing.total) ?? subtotal + vatAmount;
    const dueDate = payload.dueDate ?? String(existing.dueDate ?? this.calculateDueDate(issueDate, paymentTerms));
    const items = payload.items ? this.normalizeItems(payload.items) : undefined;

    return this.repository.update(
      id,
      {
        clientId: payload.clientId ?? existing.clientId,
        invoiceNumber: payload.invoiceNumber ?? existing.invoiceNumber,
        title: payload.title?.trim() ?? existing.title,
        titleAr: payload.titleAr !== undefined ? this.optionalText(payload.titleAr) : existing.titleAr,
        subtotal: subtotal.toFixed(2),
        vatAmount: vatAmount.toFixed(2),
        total: total.toFixed(2),
        currency: payload.currency?.trim() ?? existing.currency,
        paymentTerms,
        issueDate,
        dueDate,
        status: payload.status ?? existing.status,
        murabahaTerms: payload.murabahaTerms !== undefined ? this.optionalText(payload.murabahaTerms) : existing.murabahaTerms,
        profitRate: payload.profitRate !== undefined ? toNumber(payload.profitRate)?.toFixed(2) : existing.profitRate,
        generatedByVoice: payload.generatedByVoice ?? existing.generatedByVoice,
        chaserSent: payload.chaserSent ?? existing.chaserSent,
        chaserMessage: payload.chaserMessage !== undefined ? this.optionalText(payload.chaserMessage) : existing.chaserMessage,
      },
      items,
    );
  }

  async cancel(id: string) {
    const invoice = await this.repository.cancel(id);

    if (!invoice) {
      throw new AppError("Invoice not found", 404);
    }

    return invoice;
  }

  async generatePdf(id: string) {
    const invoice = await this.repository.findByIdWithItems(id);

    if (!invoice) {
      throw new AppError("Invoice not found", 404);
    }

    const pdfBuffer = await generateInvoicePdfBuffer({
      invoice,
      items: invoice.items,
    });

    const path = buildStoragePath(`invoices/${id}`, `${invoice.invoiceNumber}.pdf`);
    try {
      const uploaded = await uploadToStorage({
        path,
        body: pdfBuffer,
        contentType: "application/pdf",
        upsert: true,
      });

      const pdfUrl = getStoragePublicUrl(uploaded.bucket, uploaded.path);

      await this.repository.update(id, {
        pdfPath: uploaded.path,
        pdfUrl,
      });

      return {
        pdfPath: uploaded.path,
        pdfUrl,
        stored: true,
      };
    } catch (error) {
      return {
        pdfPath: null,
        pdfUrl: null,
        stored: false,
        pdfDataUrl: `data:application/pdf;base64,${pdfBuffer.toString("base64")}`,
        storageError: error instanceof Error ? error.message : "Failed to upload invoice PDF",
      };
    }
  }

  private normalizeItems(items?: InvoiceItemPayload[]): NewInvoiceItemRow[] {
    return (items ?? []).map((item, index) => {
      const quantity = toNumber(item.quantity) ?? 1;
      const unitPrice = toNumber(item.unitPrice) ?? 0;
      const total = toNumber(item.total) ?? quantity * unitPrice;

      return {
        invoiceId: "",
        description: item.description.trim(),
        descriptionAr: this.optionalText(item.descriptionAr),
        quantity: quantity.toFixed(2),
        unitPrice: unitPrice.toFixed(2),
        total: total.toFixed(2),
        sortOrder: item.sortOrder ?? index,
      };
    });
  }

  private optionalText(value: string | null | undefined): string | undefined {
    if (!value) {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  private calculateDueDate(issueDate: string, paymentTerms: InvoiceRow["paymentTerms"]): string {
    const days = (() => {
      switch (paymentTerms) {
        case "immediate": return 0;
        case "net_7": return 7;
        case "net_15": return 15;
        case "net_30": return 30;
        case "net_60": return 60;
        default: return 30;
      }
    })();

    const date = new Date(issueDate);
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  }
}
