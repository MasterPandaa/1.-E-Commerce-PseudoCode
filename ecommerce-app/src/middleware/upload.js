// PSEUDO: Multer upload with size limit and basic MIME filter
import multer from 'multer';

const MAX_MB = parseInt(process.env.MAX_IMAGE_SIZE_MB || '5', 10);

const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error('Unsupported image type'));
  }
  cb(null, true);
}

export const upload = multer({
  storage,
  limits: { fileSize: MAX_MB * 1024 * 1024 },
  fileFilter,
});
