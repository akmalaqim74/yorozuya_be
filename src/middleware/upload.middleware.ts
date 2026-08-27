import multer from "multer";
import { throwBadRequest } from "../utils/error.util";

// In-memory storage for handling photos before pushing to Supabase Storage
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"));
  }
};

export const photoUpload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max photo size
  },
  fileFilter,
});
