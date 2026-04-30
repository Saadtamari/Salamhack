// ─── Example: Clients Routes with Swagger Documentation ───────────────────────
// Copy this pattern to other route files (invoices, transactions, contracts, etc.)

import { Router } from "express";
import { ClientsController } from "./clients.controller.js";
import { ClientsRepository } from "./clients.repository.js";
import { ClientsService } from "./clients.service.js";

const clientsRepository = new ClientsRepository();
const clientsService = new ClientsService(clientsRepository);
const clientsController = new ClientsController(clientsService);

export const clientsRouter = Router();

/**
 * @swagger
 * /api/clients:
 *   get:
 *     summary: List all clients
 *     description: Fetch all clients with optional filtering by risk level and sorting
 *     tags:
 *       - Clients
 *     parameters:
 *       - in: query
 *         name: risk_level
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *         description: Filter by risk level (optional)
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [risk, payment_days, invoices_count]
 *         description: Sort by field (optional, default is creation date)
 *     responses:
 *       200:
 *         description: List of clients retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Client'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
clientsRouter.get("/", (request, response, next) => {
  clientsController.list(request, response).catch(next);
});

/**
 * @swagger
 * /api/clients:
 *   post:
 *     summary: Create a new client
 *     description: Add a new client to your network with contact and business information
 *     tags:
 *       - Clients
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Client name (English)
 *                 example: "Al Nujoom Company"
 *               nameAr:
 *                 type: string
 *                 description: Client name (Arabic)
 *                 example: "شركة النجوم"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Client email address
 *                 example: "contact@alnujoom.sa"
 *               phone:
 *                 type: string
 *                 description: Client phone number
 *                 example: "+966501234567"
 *               company:
 *                 type: string
 *                 description: Company name (English)
 *                 example: "Nujoom Trading"
 *               companyAr:
 *                 type: string
 *                 description: Company name (Arabic)
 *                 example: "شركة النجوم للتجارة"
 *               notes:
 *                 type: string
 *                 description: Internal notes about the client
 *                 example: "High-value client, prefers email communication"
 *     responses:
 *       201:
 *         description: Client created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Client'
 *       400:
 *         description: Invalid request body
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
clientsRouter.post("/", (request, response, next) => {
  clientsController.create(request, response).catch(next);
});

/**
 * @swagger
 * /api/clients/{id}:
 *   get:
 *     summary: Get client by ID
 *     description: Fetch detailed information about a specific client including risk analysis and payment history
 *     tags:
 *       - Clients
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Client UUID
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Client details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Client'
 *       404:
 *         description: Client not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
clientsRouter.get("/:id", (request, response, next) => {
  clientsController.getById(request, response).catch(next);
});

/**
 * @swagger
 * /api/clients/{id}:
 *   patch:
 *     summary: Update client
 *     description: Update client information and notes
 *     tags:
 *       - Clients
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Client UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               nameAr:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               company:
 *                 type: string
 *               companyAr:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Client updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Client'
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Client not found
 *       500:
 *         description: Server error
 */
clientsRouter.patch("/:id", (request, response, next) => {
  clientsController.update(request, response).catch(next);
});
