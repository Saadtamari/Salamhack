import type { Request, Response } from "express";
import { z } from "zod";
import {
  buildStoragePath,
  createStorageSignedUrl,
  getStoragePublicUrl,
  removeFromStorage,
  uploadToStorage,
} from "../../infrastructure/storage/supabase-storage.js";
import { AppError } from "../../shared/errors/app-error.js";

const uploadBodySchema = z.object({
  directory: z.string().trim().min(1).default("uploads"),
  bucket: z.string().trim().min(1).optional(),
  upsert: z.coerce.boolean().optional().default(false),
  access: z.enum(["public", "signed"]).optional().default("signed"),
  expiresInSeconds: z.coerce.number().int().min(60).max(60 * 60 * 24).optional().default(900),
});

const signedUrlBodySchema = z.object({
  bucket: z.string().trim().min(1).optional(),
  path: z.string().trim().min(1),
  expiresInSeconds: z.coerce.number().int().min(60).max(60 * 60 * 24).optional().default(900),
});

const deleteBodySchema = z.object({
  bucket: z.string().trim().min(1).optional(),
  path: z.string().trim().min(1),
});

function getRequestFile(request: Request) {
  const file = request.file;

  if (!file) {
    throw new AppError("file is required", 400);
  }

  return file;
}

export const uploadController = {
  async uploadFile(req: Request, res: Response) {
    const file = getRequestFile(req);
    const body = uploadBodySchema.parse(req.body);
    const path = buildStoragePath(body.directory, file.originalname);

    const uploaded = await uploadToStorage({
      bucket: body.bucket,
      path,
      body: file.buffer,
      contentType: file.mimetype,
      upsert: body.upsert,
    });

    const url =
      body.access === "public"
        ? getStoragePublicUrl(uploaded.bucket, uploaded.path)
        : await createStorageSignedUrl(
            uploaded.bucket,
            uploaded.path,
            body.expiresInSeconds,
          );

    res.status(201).json({
      success: true,
      data: {
        ...uploaded,
        url,
        access: body.access,
      },
    });
  },

  async createSignedUrl(req: Request, res: Response) {
    const body = signedUrlBodySchema.parse(req.body);
    const bucket = body.bucket ?? undefined;

    if (!bucket) {
      throw new AppError("bucket is required", 400);
    }

    const signedUrl = await createStorageSignedUrl(
      bucket,
      body.path,
      body.expiresInSeconds,
    );

    res.json({
      success: true,
      data: {
        bucket,
        path: body.path,
        signedUrl,
        expiresInSeconds: body.expiresInSeconds,
      },
    });
  },

  async deleteFile(req: Request, res: Response) {
    const body = deleteBodySchema.parse(req.body);
    const bucket = body.bucket ?? undefined;

    if (!bucket) {
      throw new AppError("bucket is required", 400);
    }

    await removeFromStorage(bucket, body.path);

    res.json({
      success: true,
      message: "File deleted successfully",
      data: {
        bucket,
        path: body.path,
      },
    });
  },
};

export default uploadController;
