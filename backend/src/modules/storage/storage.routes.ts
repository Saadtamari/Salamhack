import express from "express";
import { uploadController } from "./storage.controller.js";
import { upload } from "../../shared/middlewares/upload.middleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/storage/upload:
 *   post:
 *     summary: Upload a file to Supabase Storage
 *     description: Uploads a PDF or image file and returns its storage path plus a public or signed URL.
 *     tags:
 *       - Storage
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               directory:
 *                 type: string
 *                 example: contracts
 *               bucket:
 *                 type: string
 *                 example: contracts
 *               access:
 *                 type: string
 *                 enum: [public, signed]
 *                 example: signed
 *               upsert:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       201:
 *         description: File uploaded successfully
 */
router.post(
  "/upload",
  upload.single("file"),
  (request, response, next) => {
    uploadController.uploadFile(request, response).catch(next);
  },
);

/**
 * @swagger
 * /api/storage/signed-url:
 *   post:
 *     summary: Create a signed download URL
 *     tags:
 *       - Storage
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bucket
 *               - path
 *             properties:
 *               bucket:
 *                 type: string
 *               path:
 *                 type: string
 *               expiresInSeconds:
 *                 type: integer
 *                 example: 900
 *     responses:
 *       200:
 *         description: Signed URL created successfully
 */
router.post("/signed-url", (request, response, next) => {
  uploadController.createSignedUrl(request, response).catch(next);
});

/**
 * @swagger
 * /api/storage/object:
 *   delete:
 *     summary: Delete a stored file
 *     tags:
 *       - Storage
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bucket
 *               - path
 *             properties:
 *               bucket:
 *                 type: string
 *               path:
 *                 type: string
 *     responses:
 *       200:
 *         description: File deleted successfully
 */
router.delete("/object", (request, response, next) => {
  uploadController.deleteFile(request, response).catch(next);
});

export default router;
