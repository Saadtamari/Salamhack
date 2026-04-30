import type { Request, Response } from "express";
import { z } from "zod";
import { AppError } from "../../shared/errors/app-error.js";
import type { InvoicesService } from "./invoices.service.js";

const invoiceStatusSchema = z.enum(["draft", "sent", "viewed", "paid", "overdue", "cancelled"]);
const paymentTermsSchema = z.enum(["immediate", "net_7", "net_15", "net_30", "net_60", "murabaha", "musharakah"]);
const sortSchema = z.enum(["created_at", "due_date", "status", "total"]);

const invoiceItemSchema = z.object({
  description: z.string().trim().min(1),
  descriptionAr: z.string().trim().optional(),
  quantity: z.coerce.number().positive().optional(),
  unitPrice: z.coerce.number().min(0),
  total: z.coerce.number().min(0).optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
});

const invoiceBodySchema = z.object({
  clientId: z.string().trim().min(1).optional().nullable(),
  client_id: z.string().trim().min(1).optional().nullable(),
  invoiceNumber: z.string().trim().optional(),
  invoice_number: z.string().trim().optional(),
  title: z.string().trim().min(1).optional(),
  titleAr: z.string().trim().optional(),
  title_ar: z.string().trim().optional(),
  subtotal: z.coerce.number().min(0).optional(),
  vatAmount: z.coerce.number().min(0).optional(),
  vat_amount: z.coerce.number().min(0).optional(),
  total: z.coerce.number().min(0).optional(),
  currency: z.string().trim().optional(),
  paymentTerms: paymentTermsSchema.optional(),
  payment_terms: paymentTermsSchema.optional(),
  issueDate: z.string().date().optional(),
  issue_date: z.string().date().optional(),
  dueDate: z.string().date().optional().nullable(),
  due_date: z.string().date().optional().nullable(),
  status: invoiceStatusSchema.optional(),
  murabahaTerms: z.string().trim().optional(),
  murabaha_terms: z.string().trim().optional(),
  profitRate: z.coerce.number().min(0).optional().nullable(),
  profit_rate: z.coerce.number().min(0).optional().nullable(),
  generatedByVoice: z.coerce.boolean().optional(),
  generated_by_voice: z.coerce.boolean().optional(),
  chaserSent: z.coerce.boolean().optional(),
  chaser_sent: z.coerce.boolean().optional(),
  chaserMessage: z.string().trim().optional(),
  chaser_message: z.string().trim().optional(),
  items: z.array(invoiceItemSchema).optional(),
});

const updateInvoiceSchema = invoiceBodySchema.partial();

const paramsSchema = z.object({
  id: z.string().trim().min(1),
});

const querySchema = z.object({
  status: invoiceStatusSchema.optional(),
  client_id: z.string().trim().min(1).optional(),
  sort: sortSchema.optional(),
});

function normalizeInvoicePayload(input: z.infer<typeof invoiceBodySchema>) {
  return {
    clientId: input.clientId ?? input.client_id,
    invoiceNumber: input.invoiceNumber ?? input.invoice_number,
    title: input.title,
    titleAr: input.titleAr ?? input.title_ar,
    subtotal: input.subtotal,
    vatAmount: input.vatAmount ?? input.vat_amount,
    total: input.total,
    currency: input.currency,
    paymentTerms: input.paymentTerms ?? input.payment_terms,
    issueDate: input.issueDate ?? input.issue_date,
    dueDate: input.dueDate ?? input.due_date,
    status: input.status,
    murabahaTerms: input.murabahaTerms ?? input.murabaha_terms,
    profitRate: input.profitRate ?? input.profit_rate,
    generatedByVoice: input.generatedByVoice ?? input.generated_by_voice,
    chaserSent: input.chaserSent ?? input.chaser_sent,
    chaserMessage: input.chaserMessage ?? input.chaser_message,
    items: input.items,
  };
}

export class InvoicesController {
  constructor(private readonly service: InvoicesService) {}

  async list(request: Request, response: Response): Promise<void> {
    const query = querySchema.parse(request.query);
    const invoices = await this.service.list({
      status: query.status,
      clientId: query.client_id,
      sort: query.sort,
    });

    response.json({ success: true, data: invoices });
  }

  async getById(request: Request, response: Response): Promise<void> {
    const { id } = paramsSchema.parse(request.params);
    const invoice = await this.service.getById(id);

    if (!invoice) {
      throw new AppError("Invoice not found", 404);
    }

    response.json({ success: true, data: invoice });
  }

  async create(request: Request, response: Response): Promise<void> {
    const payload = normalizeInvoicePayload(invoiceBodySchema.parse(request.body));

    if (!payload.title || payload.subtotal === undefined) {
      throw new AppError("title and subtotal are required", 400);
    }

    const invoice = await this.service.create({
      ...payload,
      title: payload.title,
      subtotal: payload.subtotal,
      items: payload.items,
    });

    response.status(201).json({ success: true, data: invoice });
  }

  async update(request: Request, response: Response): Promise<void> {
    const { id } = paramsSchema.parse(request.params);
    const payload = normalizeInvoicePayload(updateInvoiceSchema.parse(request.body));
    const invoice = await this.service.update(id, payload);

    response.json({ success: true, data: invoice });
  }

  async cancel(request: Request, response: Response): Promise<void> {
    const { id } = paramsSchema.parse(request.params);
    const invoice = await this.service.cancel(id);

    response.json({ success: true, data: invoice });
  }

  async generatePdf(request: Request, response: Response): Promise<void> {
    const body = z.object({ invoice_id: z.string().trim().min(1).optional(), invoiceId: z.string().trim().min(1).optional() }).parse(request.body);
    const invoiceId = body.invoice_id ?? body.invoiceId;

    if (!invoiceId) {
      throw new AppError("invoice_id is required", 400);
    }

    const result = await this.service.generatePdf(invoiceId);

    response.json({ success: true, data: result });
  }
}
