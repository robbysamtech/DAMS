const express = require('express');
const router = express.Router();
const WomensMinistrySection = require('../models/WomensMinistrySection');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '../uploads/womensMinistry');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, uploadsDir); },
  filename: (req, file, cb) => { cb(null, `${Date.now()}-${file.originalname}`); }
});

const upload = multer({ storage: storage });

router.get('/', async (req, res) => {
  try {
    const sections = await WomensMinistrySection.findActiveSections();
    res.json(sections);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/admin', auth, adminAuth, async (req, res) => {
  try {
    const sections = await WomensMinistrySection.findAllSections();
    res.json(sections);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.post('/', auth, adminAuth, upload.fields([{ name: 'backgroundImage', maxCount: 1 }, { name: 'tileImage', maxCount: 1 }]), async (req, res) => {
  const { order, title, description, isActive } = req.body;
  try {
    const newSection = new WomensMinistrySection({
      order, title, description, isActive: isActive === 'true', creator: req.user.id,
      backgroundImage: req.files && req.files['backgroundImage'] ? `/uploads/womensMinistry/${req.files['backgroundImage'][0].filename}` : undefined,
      tileImage: req.files && req.files['tileImage'] ? `/uploads/womensMinistry/${req.files['tileImage'][0].filename}` : undefined,
    });
    const section = await newSection.save();
    res.json(section);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.put('/:id', auth, adminAuth, upload.fields([{ name: 'backgroundImage', maxCount: 1 }, { name: 'tileImage', maxCount: 1 }]), async (req, res) => {
  const { order, title, description, isActive } = req.body;
  try {
    let section = await WomensMinistrySection.findById(req.params.id);
    if (!section) return res.status(404).json({ msg: 'WomensMinistry section not found' });
    
    section.order = order || section.order;
    section.title = title || section.title;
    section.description = description || section.description;
    section.isActive = isActive !== undefined ? isActive === 'true' : section.isActive;

    if (req.files && req.files['backgroundImage']) {
      if (section.backgroundImage) {
        const oldImagePath = path.join(__dirname, '..', section.backgroundImage);
        if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
      }
      section.backgroundImage = `/uploads/womensMinistry/${req.files['backgroundImage'][0].filename}`;
    }
    if (req.files && req.files['tileImage']) {
      if (section.tileImage) {
        const oldImagePath = path.join(__dirname, '..', section.tileImage);
        if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
      }
      section.tileImage = `/uploads/womensMinistry/${req.files['tileImage'][0].filename}`;
    }

    section.metadata.updatedAt = Date.now();
    await section.save();
    res.json(section);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const section = await WomensMinistrySection.findById(req.params.id);
    if (!section) return res.status(404).json({ msg: 'WomensMinistry section not found' });

    if (section.backgroundImage) {
      const imagePath = path.join(__dirname, '..', section.backgroundImage);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }
    if (section.tileImage) {
      const imagePath = path.join(__dirname, '..', section.tileImage);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }

    await WomensMinistrySection.deleteOne({ _id: req.params.id });
    res.json({ msg: 'WomensMinistry section removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;