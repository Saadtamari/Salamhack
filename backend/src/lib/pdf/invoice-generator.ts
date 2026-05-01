import PDFDocument from "pdfkit";
import { existsSync } from "node:fs";
import type { InvoiceItemRow, InvoiceRow } from "../../infrastructure/database/schema.js";

export interface InvoicePdfInput {
  invoice: InvoiceRow;
  items: InvoiceItemRow[];
}

const PAGE_WIDTH = 595.28;
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const ENGLISH_COLUMN_X = MARGIN;
const ARABIC_COLUMN_X = 315;
const COLUMN_WIDTH = 230;

function resolvePdfFontPath(): string | null {
  const candidates = [
    process.env.MASRAF_PDF_FONT_PATH,
    "C:/Windows/Fonts/arial.ttf",
    "C:/Windows/Fonts/tahoma.ttf",
    "/usr/share/fonts/truetype/noto/NotoSansArabic-Regular.ttf",
    "/usr/share/fonts/opentype/noto/NotoNaskhArabic-Regular.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
  ].filter(Boolean) as string[];

  return candidates.find((path) => existsSync(path)) ?? null;
}

function setupFonts(document: PDFKit.PDFDocument): string {
  const fontPath = resolvePdfFontPath();

  if (!fontPath) {
    return "Helvetica";
  }

  document.registerFont("MasrafRegular", fontPath);
  return "MasrafRegular";
}

function addEnglishLine(document: PDFKit.PDFDocument, label: string, value: string, y: number) {
  document.fontSize(9).fillColor("#64748b").text(label, ENGLISH_COLUMN_X, y, {
    width: COLUMN_WIDTH,
  });
  document.fontSize(11).fillColor("#0f172a").text(value, ENGLISH_COLUMN_X, y + 13, {
    width: COLUMN_WIDTH,
  });
}

function addArabicLine(document: PDFKit.PDFDocument, label: string, value: string, y: number) {
  document.fontSize(9).fillColor("#64748b").text(label, ARABIC_COLUMN_X, y, {
    width: COLUMN_WIDTH,
    align: "right",
  });
  document.fontSize(11).fillColor("#0f172a").text(value, ARABIC_COLUMN_X, y + 13, {
    width: COLUMN_WIDTH,
    align: "right",
    features: ["liga", "rlig", "calt"],
  });
}

function money(value: string, currency: string): string {
  return `${Number(value).toFixed(2)} ${currency}`;
}

function addTotalLine(
  document: PDFKit.PDFDocument,
  englishLabel: string,
  arabicLabel: string,
  amount: string,
  y: number,
  strong = false,
) {
  document.fontSize(strong ? 13 : 10).fillColor(strong ? "#0f172a" : "#475569").text(englishLabel, 318, y, {
    width: 70,
  });
  document.fontSize(strong ? 11 : 9).fillColor("#64748b").text(arabicLabel, 382, y + (strong ? 1 : 0), {
    width: 50,
    align: "right",
    features: ["liga", "rlig", "calt"],
  });
  document.fontSize(strong ? 13 : 10).fillColor("#0f172a").text(amount, 445, y, {
    width: 82,
    align: "right",
  });
}

export async function generateInvoicePdfBuffer({ invoice, items }: InvoicePdfInput): Promise<Buffer> {
  return await new Promise<Buffer>((resolve, reject) => {
    const document = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];

    document.on("data", (chunk: Buffer) => chunks.push(chunk));
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);

    const regularFont = setupFonts(document);
    document.font(regularFont);

    document.rect(0, 0, PAGE_WIDTH, 96).fill("#0f172a");
    document.fillColor("#ffffff").fontSize(24).text("Masraf Invoice", MARGIN, 28, {
      width: 240,
    });
    document.fontSize(24).text("فاتورة مصرف", ARABIC_COLUMN_X, 28, {
      width: COLUMN_WIDTH,
      align: "right",
      features: ["liga", "rlig", "calt"],
    });
    document.fontSize(10).fillColor("#cbd5e1").text(invoice.invoiceNumber, MARGIN, 62, {
      width: CONTENT_WIDTH,
      align: "center",
    });

    document.fillColor("#e2e8f0").rect(MARGIN, 118, CONTENT_WIDTH, 1).fill();

    addEnglishLine(document, "Title", invoice.title, 138);
    addArabicLine(document, "العنوان", invoice.titleAr ?? invoice.title, 138);
    addEnglishLine(document, "Status", invoice.status, 188);
    addArabicLine(document, "الحالة", invoice.status, 188);
    addEnglishLine(document, "Issue date", String(invoice.issueDate), 238);
    addArabicLine(document, "الإصدار", String(invoice.issueDate), 238);
    addEnglishLine(document, "Due date", invoice.dueDate ? String(invoice.dueDate) : "N/A", 288);
    addArabicLine(document, "الاستحقاق", invoice.dueDate ? String(invoice.dueDate) : "غير محدد", 288);

    document.roundedRect(MARGIN, 350, CONTENT_WIDTH, 1, 0).fill("#e2e8f0");
    document.fontSize(14).fillColor("#0f172a").text("Items", MARGIN, 370, {
      width: 180,
    });
    document.fontSize(14).fillColor("#0f172a").text("البنود", ARABIC_COLUMN_X, 370, {
      width: COLUMN_WIDTH,
      align: "right",
      features: ["liga", "rlig", "calt"],
    });

    const firstRowY = 410;
    const rowHeight = 52;
    items.slice(0, 5).forEach((item, index) => {
      const rowY = firstRowY + index * rowHeight;
      document.fillColor(index % 2 === 0 ? "#f8fafc" : "#ffffff").rect(MARGIN, rowY - 8, CONTENT_WIDTH, rowHeight - 6).fill();
      document.fontSize(10).fillColor("#64748b").text(`#${index + 1}`, MARGIN + 10, rowY, {
        width: 30,
      });
      document.fontSize(11).fillColor("#0f172a").text(item.description, MARGIN + 45, rowY, {
        width: 160,
      });
      document.fontSize(11).fillColor("#0f172a").text(item.descriptionAr ?? item.description, ARABIC_COLUMN_X, rowY, {
        width: COLUMN_WIDTH,
        align: "right",
        features: ["liga", "rlig", "calt"],
      });
      document.fontSize(9).fillColor("#475569").text(`Qty ${item.quantity}`, MARGIN + 45, rowY + 20, {
        width: 80,
      });
      document.text(`Unit ${item.unitPrice}`, MARGIN + 125, rowY + 20, {
        width: 90,
      });
      document.fontSize(10).fillColor("#0f172a").text(money(item.total, invoice.currency), MARGIN + 390, rowY + 20, {
        width: 100,
        align: "right",
      });
    });

    const totalsY = 672;
    document.roundedRect(300, totalsY - 18, 245, 104, 6).fill("#f8fafc").stroke("#e2e8f0");
    addTotalLine(document, "Subtotal", "الفرعي", money(invoice.subtotal, invoice.currency), totalsY);
    addTotalLine(document, "VAT", "الضريبة", money(invoice.vatAmount, invoice.currency), totalsY + 28);
    addTotalLine(document, "Total", "الإجمالي", money(invoice.total, invoice.currency), totalsY + 60, true);

    document.fontSize(9).fillColor("#64748b").text("Generated by Masraf", MARGIN, 800, {
      width: CONTENT_WIDTH,
      align: "center",
    });

    document.end();
  });
}
