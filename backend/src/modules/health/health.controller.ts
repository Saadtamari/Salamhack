import type { Request, Response } from "express";

export class HealthController {
  check(_request: Request, response: Response): void {
    response.status(200).json({
      success: true,
      message: "Masraf backend is running",
      timestamp: new Date().toISOString(),
    });
  }
}
