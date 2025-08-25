const express = require('express');
const { upload, processImage, generateThumbnail } = require('../utils/fileUpload');
const path = require('path');
const router = express.Router();

// Upload image endpoint
router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Process the uploaded image
    const processedImagePath = await processImage(req.file.path, {
      width: 800,
      height: 800,
      quality: 80,
      format: 'jpeg'
    });

    // Generate thumbnail
    const thumbnailPath = await generateThumbnail(processedImagePath, {
      width: 150,
      height: 150,
      quality: 80,
      format: 'jpeg'
    });

    // Convert paths to URLs
    const imageUrl = `/uploads/${path.basename(processedImagePath)}`;
    const thumbnailUrl = `/uploads/${path.basename(thumbnailPath)}`;

    res.json({
      message: 'Image uploaded successfully',
      imageUrl,
      thumbnailUrl,
      filename: path.basename(processedImagePath)
    });

  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Get image info
router.get('/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const imagePath = path.join(__dirname, '../uploads', filename);
    
    // Check if file exists
    const fs = require('fs');
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ error: 'Image not found' });
    }

    res.json({
      filename,
      imageUrl: `/uploads/${filename}`,
      path: imagePath
    });

  } catch (error) {
    console.error('Error getting image info:', error);
    res.status(500).json({ error: 'Failed to get image info' });
  }
});

module.exports = router;
