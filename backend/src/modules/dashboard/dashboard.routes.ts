import { Router } from "express";
import { DashboardService } from "./dashboard.service.js";

const service = new DashboardService();

export const dashboardRouter = Router();

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Get dashboard statistics and aggregated data
 *     tags:
 *       - Dashboard
 *     responses:
 *       200:
 *         description: Aggregated dashboard statistics
 */
dashboardRouter.get("/", async (_request, response, next) => {
  try {
    const stats = await service.getStats();

    response.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});
