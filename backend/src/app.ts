import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";
import { errorHandler } from "./shared/http/error-handler.js";
import { notFoundHandler } from "./shared/http/not-found.js";
import { healthRouter } from "./modules/health/health.routes.js";
import storageRouter from "./modules/storage/storage.routes.js";
import { clientsRouter } from "./modules/clients/clients.routes.js";
import { transactionsRouter } from "./modules/transactions/transactions.routes.js";
import { invoicesRouter } from "./modules/invoices/invoices.routes.js";
import { contractsRouter } from "./modules/contracts/contracts.routes.js";
import { zakatRouter } from "./modules/zakat/zakat.routes.js";
import { aiRouter } from "./modules/ai/ai.routes.js";
import { voiceRouter } from "./modules/voice/voice.routes.js";
import { reportsRouter } from "./modules/reports/reports.routes.js";
import { purificationRouter } from "./modules/purification/purification.routes.js";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(morgan("dev"));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get("/", (_request, response) => {
    response.json({
      success: true,
      message: "Masraf API",
    });
  });

  // ── Swagger Documentation ──
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

  app.use("/health", healthRouter);
  app.use("/api/clients", clientsRouter);
  app.use("/api/invoices", invoicesRouter);
  app.use("/api/contracts", contractsRouter);
  app.use("/api/transactions", transactionsRouter);
  app.use("/api/zakat", zakatRouter);
  app.use("/api/ai", aiRouter);
  app.use("/api/voice", voiceRouter);
  app.use("/api/reports", reportsRouter);
  app.use("/api/purification", purificationRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/storage", storageRouter);
  app.use("/storage", storageRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
