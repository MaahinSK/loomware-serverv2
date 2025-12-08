const multer = require('multer');

// Use memory storage instead of CloudinaryStorage
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Middleware for multiple image uploads
const uploadMultiple = upload.array('images', 5); // Max 5 images

// Middleware for single image upload
const uploadSingle = upload.single('image');

module.exports = { uploadMultiple, uploadSingle };