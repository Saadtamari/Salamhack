import multer from "multer";
import { AppError } from "../errors/app-error.js";

const allowedAudioMimeTypes = new Set([
  "audio/wav",
  "audio/wave",
  "audio/x-wav",
  "audio/webm",
  "audio/mp3",
  "audio/mpeg",
  "audio/mp4",
  "audio/ogg",
  "audio/flac",
  "audio/x-m4a",
]);

export const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB max (Whisper limit)
    files: 1,
  },
  fileFilter: (_request, file, callback) => {
    if (allowedAudioMimeTypes.has(file.mimetype)) {
      callback(null, true);
      return;
    }

    callback(
      new AppError(
        `Unsupported audio type: ${file.mimetype}. Allowed: WAV, WebM, MP3, MPEG, OGG, FLAC, M4A.`,
        400,
      ),
    );
  },
});
