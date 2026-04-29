import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { getSupabaseStorageEnv } from "../../config/env.js";

type FileBody =
  | ArrayBuffer
  | ArrayBufferView
  | Blob
  | Buffer
  | File
  | FormData
  | NodeJS.ReadableStream
  | ReadableStream<Uint8Array>
  | URLSearchParams
  | string;

export interface StorageUploadInput {
  path: string;
  body: FileBody;
  bucket?: string;
  contentType?: string;
  cacheControl?: string;
  upsert?: boolean;
}

export interface StorageObjectLocation {
  bucket: string;
  path: string;
  fullPath: string;
}

let storageClient: SupabaseClient | null = null;

function trimSlashes(value: string): string {
  return value.replace(/^\/+|\/+$/g, "");
}

function sanitizeFileName(fileName: string): string {
  return trimSlashes(fileName)
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[.-]+|[.-]+$/g, "");
}

function getStorageClient(): SupabaseClient {
  if (!storageClient) {
    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = getSupabaseStorageEnv();

    storageClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return storageClient;
}

export function buildStoragePath(
  directory: string,
  fileName: string = randomUUID(),
): string {
  const cleanDirectory = trimSlashes(directory);
  const cleanFileName = sanitizeFileName(fileName) || randomUUID();

  return cleanDirectory ? `${cleanDirectory}/${cleanFileName}` : cleanFileName;
}

export function getSupabaseStorageBucketName(): string {
  return getSupabaseStorageEnv().SUPABASE_STORAGE_BUCKET;
}

export function getStoragePublicUrl(bucket: string, path: string): string {
  return getStorageClient().storage.from(bucket).getPublicUrl(path).data
    .publicUrl;
}

export async function createStorageSignedUrl(
  bucket: string,
  path: string,
  expiresInSeconds = 60 * 15,
): Promise<string> {
  const { data, error } = await getStorageClient()
    .storage.from(bucket)
    .createSignedUrl(path, expiresInSeconds);

  if (error) {
    throw new Error(`Failed to create signed Supabase URL: ${error.message}`);
  }

  return data.signedUrl;
}

export async function uploadToStorage(
  input: StorageUploadInput,
): Promise<StorageObjectLocation> {
  const bucket = input.bucket ?? getSupabaseStorageBucketName();

  const { data, error } = await getStorageClient()
    .storage.from(bucket)
    .upload(input.path, input.body, {
      cacheControl: input.cacheControl ?? "3600",
      contentType: input.contentType,
      upsert: input.upsert ?? false,
    });

  if (error) {
    throw new Error(
      `Failed to upload file to Supabase storage: ${error.message}`,
    );
  }

  if (!data) {
    throw new Error("Upload failed: Supabase returned no data");
  }

  return {
    bucket,
    path: data.path,
    fullPath: data.fullPath,
  };
}

export async function removeFromStorage(
  bucket: string,
  path: string,
): Promise<void> {
  const { error } = await getStorageClient()
    .storage.from(bucket)
    .remove([path]);

  if (error) {
    throw new Error(
      `Failed to remove file from Supabase storage: ${error.message}`,
    );
  }
}
