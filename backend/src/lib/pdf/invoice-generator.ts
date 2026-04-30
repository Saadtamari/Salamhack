import PDFDocument from "pdfkit";
import type { InvoiceItemRow, InvoiceRow } from "../../infrastructure/database/schema.js";

export interface InvoicePdfInput {
  invoice: InvoiceRow;
  items: InvoiceItemRow[];
}

function addTextLine(document: PDFKit.PDFDocument, label: string, value: string, y: number) {
  document.fontSize(11).fillColor("#334155").text(label, 50, y, { continued: true });
  document.fillColor("#0f172a").text(value);
}

export async function generateInvoicePdfBuffer({ invoice, items }: InvoicePdfInput): Promise<Buffer> {
  return await new Promise<Buffer>((resolve, reject) => {
    const document = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];

    document.on("data", (chunk: Buffer) => chunks.push(chunk));
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);

    document.fontSize(22).fillColor("#0f172a").text("Masraf Invoice", { align: "center" });
    document.moveDown(1.2);

    addTextLine(document, "Invoice Number: ", invoice.invoiceNumber, 120);
    addTextLine(document, "Title: ", invoice.title, 140);
    addTextLine(document, "Status: ", invoice.status, 160);
    addTextLine(document, "Currency: ", invoice.currency, 180);
    addTextLine(document, "Issue Date: ", String(invoice.issueDate), 200);
    addTextLine(document, "Due Date: ", invoice.dueDate ? String(invoice.dueDate) : "N/A", 220);

    document.moveDown(1.4);
    document.fontSize(14).fillColor("#0f172a").text("Items");
    document.moveDown(0.5);

    items.forEach((item, index) => {
      const rowY = 270 + index * 36;
      document.fontSize(11).fillColor("#334155").text(`${index + 1}. ${item.description}`, 50, rowY);
      document.text(`Qty: ${item.quantity}`, 320, rowY);
      document.text(`Price: ${item.unitPrice}`, 400, rowY);
      document.text(`Total: ${item.total}`, 480, rowY);
    });

    const footerY = 700;
    document.fontSize(12).fillColor("#0f172a").text(`Subtotal: ${invoice.subtotal}`, 50, footerY);
    document.text(`VAT: ${invoice.vatAmount}`, 200, footerY);
    document.text(`Total: ${invoice.total}`, 320, footerY);

    document.end();
  });
}
