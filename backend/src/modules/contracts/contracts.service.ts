import { AppError } from "../../shared/errors/app-error.js";
import { PDFParse } from "pdf-parse";
import { buildStoragePath, createStorageSignedUrl, getSupabaseStorageBucketName, removeFromStorage, uploadToStorage } from "../../infrastructure/storage/supabase-storage.js";
import type { ContractFlagRow, ContractRow, NewContractFlagRow, NewContractRow } from "../../infrastructure/database/schema.js";
import { AIService } from "../ai/ai.service.js";
import type { ContractsRepository, ListContractsOptions } from "./contracts.repository.js";

export interface ContractPayload {
  clientId?: string | null;
  title?: string;
  titleAr?: string | null;
  analysisStatus?: ContractRow["analysisStatus"];
}

export interface ContractAnalysisResult {
  summary: string;
  summaryAr: string;
  riskLevel: "low" | "medium" | "high";
  keyTerms: {
    paymentAmount?: number;
    paymentSchedule?: string;
    contractDuration?: string;
    terminationClause?: string;
  };
  flags: Array<{
    severity: ContractFlagRow["severity"];
    title: string;
    titleAr: string;
    description: string;
    descriptionAr: string;
    clauseReference?: string;
    recommendation?: string;
    recommendationAr?: string;
    sortOrder: number;
  }>;
}

function normalizeText(value: string | null | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export class ContractsService {
  private readonly aiService = new AIService();

  constructor(private readonly repository: ContractsRepository) {}

  list(query: ListContractsOptions) {
    return this.repository.list(query);
  }

  async getById(id: string) {
    const contract = await this.repository.findByIdWithFlags(id);

    if (!contract) {
      throw new AppError("Contract not found", 404);
    }

    return contract;
  }

  async createFromUpload(input: {
    file: Express.Multer.File;
    clientId?: string | null;
    title?: string;
    titleAr?: string | null;
  }) {
    const title = normalizeText(input.title) ?? this.buildTitleFromFilename(input.file.originalname);
    const titleAr = normalizeText(input.titleAr);
    const contractText = await this.extractContractText(input.file);
    const analysis = await this.analyzeUploadedContract(title, input.file.originalname, contractText);
    const path = buildStoragePath("contracts/originals", input.file.originalname);
    let filePath = path;
    let fileUrl: string | null = null;
    let storageError: string | undefined;

    try {
      const uploaded = await uploadToStorage({
        path,
        body: input.file.buffer,
        contentType: input.file.mimetype,
        upsert: false,
      });

      filePath = uploaded.path;
      fileUrl = await createStorageSignedUrl(uploaded.bucket, uploaded.path);
    } catch (error) {
      console.error("Failed to store contract file in Supabase:", error instanceof Error ? error.message : error);
      storageError = error instanceof Error ? error.message : "Failed to store contract file";
    }

    const contract = await this.repository.create(
      {
        clientId: input.clientId ?? null,
        title,
        titleAr,
        filePath,
        fileUrl,
        fileSize: input.file.size,
        originalFilename: input.file.originalname,
        analysisStatus: "completed",
        analysisResult: analysis,
        keyTerms: analysis.keyTerms,
        paymentAmount: analysis.keyTerms.paymentAmount?.toFixed(2),
        paymentSchedule: analysis.keyTerms.paymentSchedule,
        contractDuration: analysis.keyTerms.contractDuration,
        terminationClause: analysis.keyTerms.terminationClause,
        analyzedAt: new Date(),
      },
      analysis.flags.map((flag) => ({
        contractId: "",
        severity: flag.severity,
        title: flag.title,
        titleAr: flag.titleAr,
        description: flag.description,
        descriptionAr: flag.descriptionAr,
        clauseReference: flag.clauseReference,
        recommendation: flag.recommendation,
        recommendationAr: flag.recommendationAr,
        sortOrder: flag.sortOrder,
      })),
    );

    return {
      ...contract,
      storageStatus: storageError ? "fallback" : "stored",
      storageError,
    };
  }

  async delete(id: string) {
    const contract = await this.repository.delete(id);

    if (!contract) {
      throw new AppError("Contract not found", 404);
    }

    if (contract.filePath) {
      try {
        await removeFromStorage(getSupabaseStorageBucketName(), contract.filePath);
      } catch {
        // Ignore storage cleanup errors so contract deletion still succeeds.
      }
    }

    return contract;
  }

  private buildTitleFromFilename(fileName: string): string {
    const baseName = fileName.replace(/\.[^.]+$/, "");
    return baseName.replace(/[-_]+/g, " ").trim() || "Contract";
  }

  private async analyzeUploadedContract(
    title: string,
    originalFilename: string,
    contractText: string,
  ): Promise<ContractAnalysisResult> {
    if (contractText.trim().length >= 40) {
      try {
        const aiResult = await this.aiService.analyzeContract({
          title,
          contractText: contractText.slice(0, 20_000),
        });
        return this.normalizeAIAnalysis(aiResult, title);
      } catch (error) {
        console.warn("[contracts] AI analysis failed, using heuristic fallback:", error instanceof Error ? error.message : error);
      }
    }

    return this.analyzeContractHeuristically(title, originalFilename, contractText);
  }

  private analyzeContractHeuristically(title: string, originalFilename: string, contractText = ""): ContractAnalysisResult {
    const content = `${title} ${originalFilename} ${contractText}`.toLowerCase();
    const flags: ContractAnalysisResult["flags"] = [];
    const keyTerms: ContractAnalysisResult["keyTerms"] = {};

    if (content.includes("exclusive")) {
      flags.push({
        severity: "warning",
        title: "Exclusive commitment",
        titleAr: "التزام حصري",
        description: "The contract appears to include an exclusivity restriction.",
        descriptionAr: "يبدو أن العقد يتضمن قيدًا حصريًا.",
        clauseReference: "exclusivity",
        recommendation: "Confirm the exclusivity scope and duration.",
        recommendationAr: "تحقق من نطاق الحصرية ومدتها.",
        sortOrder: 0,
      });
    }

    if (content.includes("termination")) {
      flags.push({
        severity: "warning",
        title: "Termination clause present",
        titleAr: "وجود بند إنهاء",
        description: "The contract contains termination language that should be reviewed.",
        descriptionAr: "يتضمن العقد بند إنهاء يحتاج للمراجعة.",
        clauseReference: "termination",
        recommendation: "Check notice periods and termination penalties.",
        recommendationAr: "راجع فترات الإشعار وغرامات الإنهاء.",
        sortOrder: 1,
      });
      keyTerms.terminationClause = "termination language detected";
    }

    if (content.includes("30") || content.includes("thirty")) {
      keyTerms.paymentSchedule = "Net 30 or similar payment window";
    }

    if (flags.length === 0) {
      flags.push({
        severity: "info",
        title: "Contract uploaded successfully",
        titleAr: "تم رفع العقد بنجاح",
        description: "No obvious red flags were detected by the heuristic review.",
        descriptionAr: "لم يتم رصد إشارات تحذيرية واضحة في الفحص المبدئي.",
        clauseReference: "general",
        recommendation: "Proceed with a legal review if needed.",
        recommendationAr: "يمكن إجراء مراجعة قانونية عند الحاجة.",
        sortOrder: 0,
      });
    }

    return {
      summary: `Heuristic review completed for ${title}.`,
      summaryAr: `اكتملت المراجعة المبدئية للعقد: ${title}.`,
      riskLevel: flags.some((flag) => flag.severity === "critical")
        ? "high"
        : flags.some((flag) => flag.severity === "warning")
          ? "medium"
          : "low",
      keyTerms,
      flags,
    };
  }

  private async extractContractText(file: Express.Multer.File): Promise<string> {
    if (file.mimetype === "application/pdf") {
      let parser: PDFParse | null = null;

      try {
        parser = new PDFParse({ data: new Uint8Array(file.buffer) });
        const result = await parser.getText({ first: 5 });
        return result.text.trim();
      } catch (error) {
        console.warn("[contracts] PDF text extraction failed:", error instanceof Error ? error.message : error);
        return "";
      } finally {
        await parser?.destroy().catch(() => undefined);
      }
    }

    if (file.mimetype.startsWith("text/")) {
      return file.buffer.toString("utf8").trim();
    }

    return "";
  }

  private normalizeAIAnalysis(input: any, title: string): ContractAnalysisResult {
    const flags = Array.isArray(input?.flags) ? input.flags : [];
    const riskLevel = ["low", "medium", "high"].includes(input?.riskLevel) ? input.riskLevel : "medium";

    return {
      summary: String(input?.summaryEn ?? input?.summary ?? `AI review completed for ${title}.`),
      summaryAr: String(input?.summary ?? input?.summaryAr ?? `اكتملت مراجعة العقد: ${title}.`),
      riskLevel,
      keyTerms: {
        paymentAmount: typeof input?.keyTerms?.paymentAmount === "number" ? input.keyTerms.paymentAmount : undefined,
        paymentSchedule: input?.keyTerms?.paymentSchedule ?? undefined,
        contractDuration: input?.keyTerms?.contractDuration ?? undefined,
        terminationClause: input?.keyTerms?.terminationClause ?? undefined,
      },
      flags: flags.length > 0
        ? flags.map((flag: any, index: number) => ({
            severity: ["info", "warning", "critical"].includes(flag?.severity) ? flag.severity : "info",
            title: String(flag?.titleEn ?? flag?.title ?? "Contract note"),
            titleAr: String(flag?.title ?? flag?.titleAr ?? "ملاحظة على العقد"),
            description: String(flag?.descriptionEn ?? flag?.description ?? ""),
            descriptionAr: String(flag?.description ?? flag?.descriptionAr ?? ""),
            clauseReference: flag?.clauseReference,
            recommendation: flag?.recommendationEn ?? flag?.recommendation,
            recommendationAr: flag?.recommendation ?? flag?.recommendationAr,
            sortOrder: index,
          }))
        : [
            {
              severity: "info",
              title: "AI review completed",
              titleAr: "تمت مراجعة العقد",
              description: "No specific flags were returned by the AI analyzer.",
              descriptionAr: "لم يرجع محلل الذكاء الاصطناعي ملاحظات محددة.",
              clauseReference: "general",
              recommendation: "Review manually before signing.",
              recommendationAr: "راجعه يدوياً قبل التوقيع.",
              sortOrder: 0,
            },
          ],
    };
  }
}
