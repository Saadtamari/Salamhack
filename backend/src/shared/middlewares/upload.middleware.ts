import multer from "multer";
import { AppError } from "../errors/app-error.js";

const allowedMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_request, file, callback) => {
    if (allowedMimeTypes.has(file.mimetype)) {
      callback(null, true);
      return;
    }

    callback(
      new AppError(
        `Unsupported file type: ${file.mimetype}. Allowed types are PDF, JPEG, PNG, and WEBP.`,
        400,
      ),
    );
  },
});
