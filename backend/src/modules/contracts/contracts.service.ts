import { AppError } from "../../shared/errors/app-error.js";
import { buildStoragePath, createStorageSignedUrl, getSupabaseStorageBucketName, removeFromStorage, uploadToStorage } from "../../infrastructure/storage/supabase-storage.js";
import type { ContractFlagRow, ContractRow, NewContractFlagRow, NewContractRow } from "../../infrastructure/database/schema.js";
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
    console.log("[contracts] createFromUpload start", {
      clientId: input.clientId ?? null,
      fileName: input.file.originalname,
      mimeType: input.file.mimetype,
      size: input.file.size,
    });
    const title = normalizeText(input.title) ?? this.buildTitleFromFilename(input.file.originalname);
    const titleAr = normalizeText(input.titleAr);
    const analysis = this.analyzeContract(title, input.file.originalname);
    const path = buildStoragePath("contracts/originals", input.file.originalname);
    console.log("[contracts] prepared contract analysis and storage path", {
      title,
      titleAr: titleAr ?? null,
      path,
      analysisStatus: analysis.riskLevel,
      flagsCount: analysis.flags.length,
    });
    let filePath = path;
    let fileUrl: string | null = null;
    let storageError: string | undefined;

    try {
      console.log("[contracts] uploading file to storage", { path, mimeType: input.file.mimetype });
      const uploaded = await uploadToStorage({
        path,
        body: input.file.buffer,
        contentType: input.file.mimetype,
        upsert: false,
      });

      console.log("[contracts] storage upload succeeded", {
        bucket: uploaded.bucket,
        path: uploaded.path,
      });
      filePath = uploaded.path;
      console.log("[contracts] creating signed url", { bucket: uploaded.bucket, path: uploaded.path });
      fileUrl = await createStorageSignedUrl(uploaded.bucket, uploaded.path);
    } catch (error) {
      console.error("Failed to store contract file in Supabase:", error instanceof Error ? error.message : error);
      storageError = error instanceof Error ? error.message : "Failed to store contract file";
    }

    console.log("[contracts] creating database record", {
      filePath,
      hasFileUrl: Boolean(fileUrl),
      storageFallback: Boolean(storageError),
    });
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

    console.log("[contracts] database record created", {
      contractId: contract.id,
      filePath: contract.filePath,
      fileUrl: contract.fileUrl,
    });

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

  private analyzeContract(title: string, originalFilename: string): ContractAnalysisResult {
    const content = `${title} ${originalFilename}`.toLowerCase();
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
}
