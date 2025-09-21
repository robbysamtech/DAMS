const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
  },
  fileFilter: fileFilter
});

// Process and optimize uploaded images
const processImage = async (filePath, options = {}) => {
  const {
    width = 800,
    height = 800,
    quality = 80,
    format = 'jpeg'
  } = options;

  try {
    const processedImagePath = filePath.replace(/\.[^/.]+$/, '') + '_processed.' + format;
    
    await sharp(filePath)
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality })
      .toFile(processedImagePath);

    // Remove original file
    await fs.unlink(filePath);

    return processedImagePath;
  } catch (error) {
    throw error;
  }
};

// Generate thumbnail
const generateThumbnail = async (filePath, options = {}) => {
  const {
    width = 150,
    height = 150,
    quality = 80,
    format = 'jpeg'
  } = options;

  try {
    const thumbnailPath = filePath.replace(/\.[^/.]+$/, '') + '_thumb.' + format;
    
    await sharp(filePath)
      .resize(width, height, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality })
      .toFile(thumbnailPath);

    return thumbnailPath;
  } catch (error) {
    throw error;
  }
};

// Delete file
const deleteFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    return false;
  }
};

// Get file info
const getFileInfo = (file) => {
  return {
    originalName: file.originalname,
    filename: file.filename,
    path: file.path,
    size: file.size,
    mimetype: file.mimetype
  };
};

module.exports = {
  upload,
  processImage,
  generateThumbnail,
  deleteFile,
  getFileInfo
};
