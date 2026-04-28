# Swagger API Documentation Setup

**Status:** ✅ Installed and configured  
**Access:** `http://localhost:3000/api-docs`

---

## What's Installed

- `swagger-ui-express` — Interactive API documentation UI
- `swagger-jsdoc` — JSDoc parser to generate OpenAPI specs from comments

---

## How to Use

### 1. **View Documentation**

Start the backend dev server:

```bash
npm run dev
```

Then visit: **`http://localhost:3000/api-docs`**

You'll see the interactive Swagger UI where you can:
- Browse all endpoints
- Read descriptions and parameters
- See request/response schemas
- **Try out endpoints directly** (Test them without Postman/curl)

---

## 2. **Document Your Endpoints**

Each route needs JSDoc comments in the `routes.ts` file. Here's the pattern:

### Basic Endpoint Example

```typescript
/**
 * @swagger
 * /api/clients:
 *   get:
 *     summary: List all clients
 *     description: Fetch all clients with optional filtering and sorting
 *     tags:
 *       - Clients
 *     parameters:
 *       - in: query
 *         name: risk_level
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *         description: Filter by risk level
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [risk, payment_days, invoices_count]
 *         description: Sort field
 *     responses:
 *       200:
 *         description: List of clients
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
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
router.get("/", (request, response, next) => {
  clientsController.list(request, response).catch(next);
});
```

### POST Endpoint Example

```typescript
/**
 * @swagger
 * /api/clients:
 *   post:
 *     summary: Create a new client
 *     description: Add a new client to your network
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
 *                 example: "شركة النجوم"
 *               nameAr:
 *                 type: string
 *                 example: "شركة النجوم"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "contact@alnujoom.sa"
 *               phone:
 *                 type: string
 *                 example: "+966501234567"
 *               company:
 *                 type: string
 *                 example: "Al Nujoom Company"
 *               notes:
 *                 type: string
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
 *                 data:
 *                   $ref: '#/components/schemas/Client'
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post("/", (request, response, next) => {
  clientsController.create(request, response).catch(next);
});
```

### GET by ID Example

```typescript
/**
 * @swagger
 * /api/clients/{id}:
 *   get:
 *     summary: Get client by ID
 *     description: Fetch detailed information about a specific client including risk analysis
 *     tags:
 *       - Clients
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Client ID
 *     responses:
 *       200:
 *         description: Client details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Client'
 *       404:
 *         description: Client not found
 *       500:
 *         description: Server error
 */
router.get("/:id", (request, response, next) => {
  clientsController.getById(request, response).catch(next);
});
```

---

## 3. **Schema Reference**

All data models are already defined in `src/config/swagger.ts`. Use `$ref` to reference them:

```typescript
$ref: '#/components/schemas/Client'
$ref: '#/components/schemas/Invoice'
$ref: '#/components/schemas/Transaction'
$ref: '#/components/schemas/Contract'
$ref: '#/components/schemas/ZakatRecord'
$ref: '#/components/schemas/Report'
```

---

## 4. **Available Tags**

Organize endpoints with these tags (already configured):

- `Health` — Health check
- `Clients` — Client management
- `Invoices` — Invoice management
- `Transactions` — Transaction records
- `Contracts` — Contract management & analysis
- `Zakat` — Zakat calculation
- `Reports` — Financial reports
- `AI` — AI-powered features
- `Voice` — Voice interface

---

## 5. **Quick JSDoc Template**

Copy-paste template for any endpoint:

```typescript
/**
 * @swagger
 * /api/[resource]:
 *   [method]:
 *     summary: "[Brief description]"
 *     description: "[Longer description]"
 *     tags:
 *       - [Tag]
 *     parameters:
 *       - in: query|path|header
 *         name: [param_name]
 *         required: true|false
 *         schema:
 *           type: string|number|boolean
 *         description: "[Description]"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - field1
 *             properties:
 *               field1:
 *                 type: string
 *     responses:
 *       200:
 *         description: "[Success description]"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/[ModelName]'
 *       400:
 *         description: Bad request
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
```

---

## 6. **Common HTTP Methods**

| Method | CRUD | Use For |
|--------|------|---------|
| `GET` | Read | Fetch data |
| `POST` | Create | Create new record |
| `PATCH` | Update | Update existing record |
| `DELETE` | Delete | Delete record |

---

## 7. **Typical Response Format**

All endpoints should follow this response structure:

**Success (200/201):**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error (4xx/5xx):**
```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

---

## 8. **Next Steps**

Document these endpoint files:

| File | Endpoints |
|------|-----------|
| `src/modules/clients/clients.routes.ts` | GET /api/clients, POST, GET /:id, PATCH /:id |
| `src/modules/invoices/invoices.routes.ts` | GET, POST, GET /:id, PATCH /:id, DELETE /:id, POST /pdf |
| `src/modules/transactions/transactions.routes.ts` | GET, POST |
| `src/modules/contracts/contracts.routes.ts` | GET, POST, GET /:id, DELETE /:id, GET /:id/flags |
| `src/modules/zakat/zakat.routes.ts` | GET, POST |
| `src/modules/reports/reports.routes.ts` | GET, POST |

For **AI endpoints** and **Voice endpoints**, follow the same pattern.

---

## 9. **Testing an Endpoint**

1. Go to `http://localhost:3000/api-docs`
2. Find the endpoint you want to test
3. Click **"Try it out"**
4. Fill in parameters/body
5. Click **"Execute"**
6. See the response in real-time!

---

## 10. **Troubleshooting**

**Q: Swagger docs not showing my endpoint?**  
A: Make sure the JSDoc comment is directly above the route definition and follows the exact syntax.

**Q: "Could not find a declaration file" error?**  
A: Run `npm install --save-dev @types/swagger-ui-express @types/swagger-jsdoc`

**Q: Schema reference not working?**  
A: Use `$ref: '#/components/schemas/ModelName'` (check `src/config/swagger.ts` for exact names)

---

## Resources

- [OpenAPI/Swagger Spec](https://spec.openapis.org/oas/v3.0.0)
- [swagger-jsdoc Documentation](https://github.com/Surnet/swagger-jsdoc)
- [Swagger UI Demo](https://swagger.io/tools/swagger-ui/)

